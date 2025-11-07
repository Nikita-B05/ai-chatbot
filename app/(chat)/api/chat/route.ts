import { geolocation } from "@vercel/functions";
import {
  convertToModelMessages,
  createUIMessageStream,
  JsonToSseTransformStream,
  smoothStream,
  stepCountIs,
  streamText,
  generateObject,
} from "ai";
import { z } from "zod";
import { unstable_cache as cache } from "next/cache";
import { after } from "next/server";
import {
  createResumableStreamContext,
  type ResumableStreamContext,
} from "resumable-stream";
import type { ModelCatalog } from "tokenlens/core";
import { fetchModels } from "tokenlens/fetch";
import { getUsage } from "tokenlens/helpers";
import { auth, type UserType } from "@/app/(auth)/auth";
import type { VisibilityType } from "@/components/visibility-selector";
import { entitlementsByUserType } from "@/lib/ai/entitlements";
import type { ChatModel } from "@/lib/ai/models";
import {
  questionnairePrompt,
  type RequestHints,
  systemPrompt,
} from "@/lib/ai/prompts";
import { myProvider } from "@/lib/ai/providers";
import { createDocument } from "@/lib/ai/tools/create-document";
import { getWeather } from "@/lib/ai/tools/get-weather";
import { requestSuggestions } from "@/lib/ai/tools/request-suggestions";
import { updateDocument } from "@/lib/ai/tools/update-document";
import { isProductionEnvironment } from "@/lib/constants";
import {
  createStreamId,
  deleteChatById,
  enableChatQuestionnaireMode,
  getChatById,
  getMessageCountByUserId,
  getMessagesByChatId,
  saveChat,
  saveMessageWithStateSnapshot,
  saveMessages,
  updateChatLastContextById,
  updateChatQuestionnaireState,
} from "@/lib/db/queries";
import type { DBMessage } from "@/lib/db/schema";
import { ChatSDKError } from "@/lib/errors";
import { checkChatRateLimit } from "@/lib/rate-limit";
import { createInitialState, calculateBMI } from "@/lib/questionaire/state";
import { getAvailableQuestionsForLLM } from "@/lib/questionaire/router";
import { updateQuestionnaireState } from "@/lib/questionaire/tool";
import type { QuestionnaireClientState } from "@/lib/questionaire/types";
import type { ChatMessage } from "@/lib/types";
import type { AppUsage } from "@/lib/usage";
import { convertToUIMessages, generateUUID, getTextFromMessage } from "@/lib/utils";
import { generateTitleFromUserMessage } from "../../actions";
import { type PostRequestBody, postRequestBodySchema } from "./schema";

export const maxDuration = 60;

let globalStreamContext: ResumableStreamContext | null = null;

const getTokenlensCatalog = cache(
  async (): Promise<ModelCatalog | undefined> => {
    try {
      return await fetchModels();
    } catch (err) {
      console.warn(
        "TokenLens: catalog fetch failed, using default catalog",
        err
      );
      return; // tokenlens helpers will fall back to defaultCatalog
    }
  },
  ["tokenlens-catalog"],
  { revalidate: 24 * 60 * 60 } // 24 hours
);

export function getStreamContext() {
  if (!globalStreamContext) {
    try {
      globalStreamContext = createResumableStreamContext({
        waitUntil: after,
      });
    } catch (error: any) {
      if (error.message.includes("REDIS_URL")) {
        console.log(
          " > Resumable streams are disabled due to missing REDIS_URL"
        );
      } else {
        console.error(error);
      }
    }
  }

  return globalStreamContext;
}

export async function POST(request: Request) {
  let requestBody: PostRequestBody;

  try {
    const json = await request.json();
    requestBody = postRequestBodySchema.parse(json);
  } catch (_) {
    return new ChatSDKError("bad_request:api").toResponse();
  }

  try {
    const {
      id,
      message,
      selectedChatModel,
      selectedVisibilityType,
    }: {
      id: string;
      message: ChatMessage;
      selectedChatModel: ChatModel["id"];
      selectedVisibilityType?: VisibilityType;
    } = requestBody;

    const session = await auth();

    if (!session?.user) {
      return new ChatSDKError("unauthorized:chat").toResponse();
    }

    // Check per-minute rate limit (30 requests/minute)
    const rateLimitResult = await checkChatRateLimit(session.user.id);
    if (!rateLimitResult.success) {
      const resetTime = new Date(rateLimitResult.reset * 1000).toLocaleTimeString();
      return new ChatSDKError(
        "rate_limit:chat",
        `Rate limit exceeded (30 requests/minute). Please try again after ${resetTime}.`
      ).toResponse();
    }

    // Store rate limit result for response headers
    const currentRateLimit = rateLimitResult;

    const userType: UserType = session.user.type;

    const messageCount = await getMessageCountByUserId({
      id: session.user.id,
      differenceInHours: 24,
    });

    if (messageCount > entitlementsByUserType[userType].maxMessagesPerDay) {
      return new ChatSDKError("rate_limit:chat").toResponse();
    }

    const chat = await getChatById({ id });
    let messagesFromDb: DBMessage[] = [];

    // Initialize questionnaire state if in questionnaire mode
    let questionnaireState: QuestionnaireClientState | null = null;
    let isQuestionnaireMode = false;

    if (chat) {
      if (chat.userId !== session.user.id) {
        return new ChatSDKError("forbidden:chat").toResponse();
      }
      // Only fetch messages if chat already exists
      messagesFromDb = await getMessagesByChatId({ id });

      // Check if chat is in questionnaire mode
      isQuestionnaireMode = chat.questionaireMode ?? false;
      if (isQuestionnaireMode) {
        questionnaireState = chat.clientState ?? createInitialState();
      }
    } else {
      const title = await generateTitleFromUserMessage({
        message,
      });

      await saveChat({
        id,
        userId: session.user.id,
        title,
        visibility: selectedVisibilityType ?? "private",
      });
      // New chat - no need to fetch messages, it's empty
    }

    // Detect if user wants to start an insurance questionnaire
    // Only check if not already in questionnaire mode and this is the first or second message
    if (!isQuestionnaireMode && messagesFromDb.length <= 1) {
      const messageText = getTextFromMessage(message);
      
      // Quick keyword check first (faster, no API call)
      const insuranceKeywords = [
        "insurance",
        "apply for insurance",
        "insurance application",
        "insurance quote",
        "insurance questionnaire",
        "get insurance",
        "health insurance",
        "life insurance",
      ];
      const hasInsuranceKeyword = insuranceKeywords.some((keyword) =>
        messageText.toLowerCase().includes(keyword)
      );

      if (hasInsuranceKeyword) {
        try {
          const detectionResult = await generateObject({
            model: myProvider.languageModel("gemini-2.5-flash-lite"), // Use lightweight model for detection
            system: "You are a classifier that determines if a user message is about starting an insurance questionnaire or application. Return true if the user wants to apply for insurance, get insurance quotes, complete an insurance questionnaire, or provide health/lifestyle information for insurance purposes. Also extract any demographics mentioned (age, gender, height, weight).",
            prompt: messageText,
            schema: z.object({
              isQuestionnaireRequest: z.boolean().describe("Whether this message is requesting to start an insurance questionnaire"),
              confidence: z.number().min(0).max(1).describe("Confidence level (0-1)"),
              demographics: z.object({
                age: z.number().int().positive().optional().describe("Age in years if mentioned"),
                gender: z.enum(["male", "female"]).optional().describe("Gender if mentioned"),
                height: z.number().positive().optional().describe("Height in cm if mentioned"),
                weight: z.number().positive().optional().describe("Weight in kg if mentioned"),
              }).optional().describe("Demographics extracted from the message"),
            }),
          });

          // Lower threshold to 0.5 for better detection, or if keyword matched, use 0.3
          const threshold = 0.3; // Lower threshold since we already have keyword match
          if (detectionResult.object.isQuestionnaireRequest && detectionResult.object.confidence > threshold) {
            // Enable questionnaire mode
            const initialState = createInitialState();
            
            // Extract and set demographics if provided
            if (detectionResult.object.demographics) {
              const { age, gender, height, weight } = detectionResult.object.demographics;
              if (age) initialState.age = age;
              if (gender) initialState.gender = gender;
              if (height) initialState.height = height;
              if (weight) initialState.weight = weight;
              
              // Calculate BMI if height and weight are both provided
              if (height && weight) {
                initialState.bmi = calculateBMI(height, weight);
              }
            }
            
            await enableChatQuestionnaireMode({
              chatId: id,
              initialState,
            });
            isQuestionnaireMode = true;
            questionnaireState = initialState;
          }
        } catch (error) {
          // If detection fails but keyword matched, enable questionnaire mode anyway
          // This ensures we don't miss legitimate requests due to API issues
          console.warn("Questionnaire detection failed, but keyword matched. Enabling questionnaire mode:", error);
          const initialState = createInitialState();
          await enableChatQuestionnaireMode({
            chatId: id,
            initialState,
          });
          isQuestionnaireMode = true;
          questionnaireState = initialState;
        }
      }
    }

    const uiMessages = [...convertToUIMessages(messagesFromDb), message];

    const { longitude, latitude, city, country } = geolocation(request);

    const requestHints: RequestHints = {
      longitude,
      latitude,
      city,
      country,
    };

    // Save user message with state snapshot if in questionnaire mode
    if (isQuestionnaireMode && questionnaireState) {
      await saveMessageWithStateSnapshot({
        message: {
          chatId: id,
          id: message.id,
          role: "user",
          parts: message.parts,
          attachments: [],
          createdAt: new Date(),
        },
        stateSnapshot: questionnaireState,
        answeredQuestionId: null,
      });
    } else {
      await saveMessages({
        messages: [
          {
            chatId: id,
            id: message.id,
            role: "user",
            parts: message.parts,
            attachments: [],
            createdAt: new Date(),
            stateSnapshot: null,
            answeredQuestionId: null,
          },
        ],
      });
    }

    const streamId = generateUUID();
    await createStreamId({ streamId, chatId: id });

    let finalMergedUsage: AppUsage | undefined;

    // Track questionnaire state updates
    let updatedQuestionnaireState: QuestionnaireClientState | null =
      questionnaireState;

    // Determine system prompt and tools based on questionnaire mode
    let systemPromptText: string;
    let activeTools: Array<
      | "getWeather"
      | "createDocument"
      | "updateDocument"
      | "requestSuggestions"
      | "updateQuestionnaireState"
    >;
    const allTools = {
      getWeather,
    };

    if (isQuestionnaireMode && updatedQuestionnaireState) {
      const availableQuestions = getAvailableQuestionsForLLM(
        updatedQuestionnaireState
      );
      systemPromptText = questionnairePrompt({
        selectedChatModel,
        requestHints,
        state: updatedQuestionnaireState,
        availableQuestions,
      });
      activeTools = [
        "updateQuestionnaireState",
        "createDocument",
        "updateDocument",
        "requestSuggestions",
      ];
    } else {
      systemPromptText = systemPrompt({ selectedChatModel, requestHints });
      activeTools = [
        "createDocument",
        "updateDocument",
        "requestSuggestions",
      ];
    }

    const stream = createUIMessageStream({
      execute: ({ writer: dataStream }) => {
        // Update tools with dataStream
        const toolsWithStream = {
          ...allTools,
          createDocument: createDocument({ session, dataStream }),
          updateDocument: updateDocument({ session, dataStream }),
          requestSuggestions: requestSuggestions({
            session,
            dataStream,
          }),
          ...(isQuestionnaireMode && updatedQuestionnaireState
            ? {
                updateQuestionnaireState: updateQuestionnaireState({
                  currentState: updatedQuestionnaireState,
                  onStateUpdate: (newState) => {
                    updatedQuestionnaireState = newState;
                  },
                }),
              }
            : {}),
        };

        const result = streamText({
          model: myProvider.languageModel(selectedChatModel),
          system: systemPromptText,
          messages: convertToModelMessages(uiMessages),
          stopWhen: stepCountIs(5),
          experimental_activeTools: activeTools,
          experimental_transform: smoothStream({ chunking: "word" }),
          tools: toolsWithStream,
          experimental_telemetry: {
            isEnabled: isProductionEnvironment,
            functionId: "stream-text",
          },
          onFinish: async ({ usage }) => {
            try {
              const providers = await getTokenlensCatalog();
              const modelId =
                myProvider.languageModel(selectedChatModel).modelId;
              if (!modelId) {
                finalMergedUsage = usage;
                dataStream.write({
                  type: "data-usage",
                  data: finalMergedUsage,
                });
                return;
              }

              if (!providers) {
                finalMergedUsage = usage;
                dataStream.write({
                  type: "data-usage",
                  data: finalMergedUsage,
                });
                return;
              }

              const summary = getUsage({ modelId, usage, providers });
              finalMergedUsage = { ...usage, ...summary, modelId } as AppUsage;
              dataStream.write({ type: "data-usage", data: finalMergedUsage });
            } catch (err) {
              console.warn("TokenLens enrichment failed", err);
              finalMergedUsage = usage;
              dataStream.write({ type: "data-usage", data: finalMergedUsage });
            }
          },
        });

        result.consumeStream();

        dataStream.merge(
          result.toUIMessageStream({
            sendReasoning: true,
          })
        );
      },
      generateId: generateUUID,
      onFinish: async ({ messages }) => {
        // Save assistant messages with state snapshots if in questionnaire mode
        if (isQuestionnaireMode && updatedQuestionnaireState) {
          for (const currentMessage of messages) {
            await saveMessageWithStateSnapshot({
              message: {
                id: currentMessage.id,
                role: currentMessage.role,
                parts: currentMessage.parts,
                createdAt: new Date(),
                attachments: [],
                chatId: id,
              },
              stateSnapshot:
                currentMessage.role === "assistant"
                  ? updatedQuestionnaireState
                  : null,
              answeredQuestionId: null, // Could be extracted from tool calls if needed
            });
          }

          // Update chat's questionnaire state
          await updateChatQuestionnaireState({
            chatId: id,
            state: updatedQuestionnaireState,
            rateType: updatedQuestionnaireState.rateType ?? null,
          });
        } else {
          // Normal message saving
          await saveMessages({
            messages: messages.map((currentMessage) => ({
              id: currentMessage.id,
              role: currentMessage.role,
              parts: currentMessage.parts,
              createdAt: new Date(),
              attachments: [],
              chatId: id,
              stateSnapshot: null,
              answeredQuestionId: null,
            })),
          });
        }

        if (finalMergedUsage) {
          try {
            await updateChatLastContextById({
              chatId: id,
              context: finalMergedUsage,
            });
          } catch (err) {
            console.warn("Unable to persist last usage for chat", id, err);
          }
        }
      },
      onError: () => {
        return "Oops, an error occurred!";
      },
    });

    // const streamContext = getStreamContext();

    // if (streamContext) {
    //   return new Response(
    //     await streamContext.resumableStream(streamId, () =>
    //       stream.pipeThrough(new JsonToSseTransformStream())
    //     )
    //   );
    // }

    const response = new Response(stream.pipeThrough(new JsonToSseTransformStream()));
    
    // Add rate limit headers
    response.headers.set("X-RateLimit-Limit", "30");
    response.headers.set("X-RateLimit-Remaining", currentRateLimit.remaining.toString());
    response.headers.set("X-RateLimit-Reset", currentRateLimit.reset.toString());
    
    return response;
  } catch (error) {
    const vercelId = request.headers.get("x-vercel-id");

    if (error instanceof ChatSDKError) {
      return error.toResponse();
    }

    // Check for Vercel AI Gateway credit card error
    if (
      error instanceof Error &&
      error.message?.includes(
        "AI Gateway requires a valid credit card on file to service requests"
      )
    ) {
      return new ChatSDKError("bad_request:activate_gateway").toResponse();
    }

    console.error("Unhandled error in chat API:", error, { vercelId });
    return new ChatSDKError("offline:chat").toResponse();
  }
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return new ChatSDKError("bad_request:api").toResponse();
  }

  const session = await auth();

  if (!session?.user) {
    return new ChatSDKError("unauthorized:chat").toResponse();
  }

  const chat = await getChatById({ id });

  if (chat?.userId !== session.user.id) {
    return new ChatSDKError("forbidden:chat").toResponse();
  }

  const deletedChat = await deleteChatById({ id });

  return Response.json(deletedChat, { status: 200 });
}
