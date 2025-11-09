import { geolocation } from "@vercel/functions";
import {
  convertToModelMessages,
  createUIMessageStream,
  generateObject,
  JsonToSseTransformStream,
  smoothStream,
  stepCountIs,
  streamText,
} from "ai";
import { unstable_cache as cache } from "next/cache";
import { after } from "next/server";
import {
  createResumableStreamContext,
  type ResumableStreamContext,
} from "resumable-stream";
import type { ModelCatalog } from "tokenlens/core";
import { fetchModels } from "tokenlens/fetch";
import { getUsage } from "tokenlens/helpers";
import { z } from "zod";
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
import { withRetryAndFallback } from "@/lib/ai/retry-with-fallback";
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
  saveMessages,
  saveMessageWithStateSnapshot,
  updateChatLastContextById,
  updateChatQuestionnaireState,
} from "@/lib/db/queries";
import type { DBMessage } from "@/lib/db/schema";
import { ChatSDKError } from "@/lib/errors";
import { getAvailableQuestionsForLLM } from "@/lib/questionaire/router";
import { applyAutoIntakeFromMessage } from "@/lib/questionaire/intake";
import { calculateBMI, createInitialState } from "@/lib/questionaire/state";
import { updateQuestionnaireState } from "@/lib/questionaire/tool";
import type { QuestionnaireClientState } from "@/lib/questionaire/types";
import { checkChatRateLimit } from "@/lib/rate-limit";
import type { ChatMessage } from "@/lib/types";
import type { AppUsage } from "@/lib/usage";
import {
  convertToUIMessages,
  generateUUID,
  getTextFromMessage,
} from "@/lib/utils";
import { generateTitleFromUserMessage } from "../../actions";
import { type PostRequestBody, postRequestBodySchema } from "./schema";

export const maxDuration = 60;

let globalStreamContext: ResumableStreamContext | null = null;

const shouldLogQuestionnaireDebug =
  process.env.QUESTIONNAIRE_DEBUG === "true" ||
  process.env.NODE_ENV !== "production";

function logQuestionnaireDebug(label: string, payload: unknown) {
  if (!shouldLogQuestionnaireDebug) {
    return;
  }

  try {
    console.log(
      `\n[Questionnaire Debug] ${label}\n${JSON.stringify(payload, null, 2)}`
    );
  } catch (error) {
    console.log(`[Questionnaire Debug] ${label}`, payload, error);
  }
}

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
      const resetTime = new Date(
        rateLimitResult.reset * 1000
      ).toLocaleTimeString();
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
        if (questionnaireState) {
          logQuestionnaireDebug("Loaded questionnaire state", {
            chatId: id,
            state: questionnaireState,
          });
        }
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

    const messageText = getTextFromMessage(message);

    // Detect if user wants to start an insurance questionnaire
    // Only check if not already in questionnaire mode and this is the first or second message
    if (!isQuestionnaireMode && messagesFromDb.length <= 1) {
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
          const detectionResult = await withRetryAndFallback(
            "title-model",
            async (model, maxRetries) =>
              generateObject({
                model,
                system:
                  "You are a classifier that determines if a user message is about starting an insurance questionnaire or application. Return true if the user wants to apply for insurance, get insurance quotes, complete an insurance questionnaire, or provide health/lifestyle information for insurance purposes. Also extract any demographics mentioned (age, gender, height, weight).",
                prompt: messageText,
                schema: z.object({
                  isQuestionnaireRequest: z
                    .boolean()
                    .describe(
                      "Whether this message is requesting to start an insurance questionnaire"
                    ),
                  confidence: z
                    .number()
                    .min(0)
                    .max(1)
                    .describe("Confidence level (0-1)"),
                  demographics: z
                    .object({
                      age: z
                        .number()
                        .int()
                        .positive()
                        .optional()
                        .describe("Age in years if mentioned"),
                      gender: z
                        .enum(["male", "female"])
                        .optional()
                        .describe("Gender if mentioned"),
                      height: z
                        .number()
                        .positive()
                        .optional()
                        .describe("Height in cm if mentioned"),
                      weight: z
                        .number()
                        .positive()
                        .optional()
                        .describe("Weight in kg if mentioned"),
                    })
                    .optional()
                    .describe("Demographics extracted from the message"),
                }),
                maxRetries,
              })
          );

          // Lower threshold to 0.5 for better detection, or if keyword matched, use 0.3
          const threshold = 0.3; // Lower threshold since we already have keyword match
          if (
            detectionResult.object.isQuestionnaireRequest &&
            detectionResult.object.confidence > threshold
          ) {
            // Enable questionnaire mode
            const initialState = createInitialState();

            // Extract and set demographics if provided
            if (detectionResult.object.demographics) {
              const { age, gender, height, weight } =
                detectionResult.object.demographics;
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
            logQuestionnaireDebug(
              "Initialized questionnaire state from detection result",
              {
                chatId: id,
                state: questionnaireState,
                detection: detectionResult.object,
              }
            );
          }
        } catch (error) {
          // If detection fails but keyword matched, enable questionnaire mode anyway
          // This ensures we don't miss legitimate requests due to API issues
          console.warn(
            "Questionnaire detection failed, but keyword matched. Enabling questionnaire mode:",
            error
          );
          const initialState = createInitialState();
          await enableChatQuestionnaireMode({
            chatId: id,
            initialState,
          });
          isQuestionnaireMode = true;
          questionnaireState = initialState;
          logQuestionnaireDebug(
            "Initialized questionnaire state via keyword fallback",
            {
              chatId: id,
              state: questionnaireState,
              error: error instanceof Error ? error.message : String(error),
            }
          );
        }
      }
    }

    if (isQuestionnaireMode && questionnaireState) {
      const intakeResult = applyAutoIntakeFromMessage(
        questionnaireState,
        messageText
      );
      questionnaireState = intakeResult.state;

      if (
        intakeResult.answeredQuestions.length > 0 ||
        Object.keys(intakeResult.demographicsUpdated).length > 0
      ) {
        logQuestionnaireDebug("Applied auto-intake from user message", {
          chatId: id,
          answeredQuestions: intakeResult.answeredQuestions,
          demographicsUpdated: intakeResult.demographicsUpdated,
        });
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
    let availableQuestionsForLLM:
      | ReturnType<typeof getAvailableQuestionsForLLM>
      | undefined;

    if (isQuestionnaireMode && updatedQuestionnaireState) {
      availableQuestionsForLLM = getAvailableQuestionsForLLM(
        updatedQuestionnaireState
      );
      systemPromptText = questionnairePrompt({
        selectedChatModel,
        requestHints,
        state: updatedQuestionnaireState,
        availableQuestions: availableQuestionsForLLM,
      });
      activeTools = [
        "updateQuestionnaireState",
        "createDocument",
        "updateDocument",
        "requestSuggestions",
      ];
      logQuestionnaireDebug("Prepared questionnaire prompt context", {
        chatId: id,
        state: updatedQuestionnaireState,
        availableQuestions: availableQuestionsForLLM,
      });
    } else {
      systemPromptText = systemPrompt({ selectedChatModel, requestHints });
      activeTools = ["createDocument", "updateDocument", "requestSuggestions"];
    }

    const modelMessages = convertToModelMessages(uiMessages);

    logQuestionnaireDebug("LLM request payload", {
      chatId: id,
      mode: isQuestionnaireMode ? "questionnaire" : "standard",
      systemPrompt: systemPromptText,
      activeTools,
      messages: modelMessages,
      questionnaireState: updatedQuestionnaireState,
      availableQuestions: availableQuestionsForLLM?.map(
        ({
          id: questionId,
          available,
          answered,
          asked,
          priority,
          queuePosition,
        }) => ({
          id: questionId,
          available,
          answered,
          asked,
          priority,
          queuePosition,
        })
      ),
    });

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
                    logQuestionnaireDebug("Questionnaire state updated via tool", {
                      chatId: id,
                      state: newState,
                    });
                  },
                }),
              }
            : {}),
        };

        let result;
        let usedFallback = false;
        try {
          result = streamText({
            model: myProvider.languageModel(selectedChatModel),
            system: systemPromptText,
            messages: modelMessages,
            stopWhen: stepCountIs(5),
            experimental_activeTools: activeTools,
            experimental_transform: smoothStream({ chunking: "word" }),
            tools: toolsWithStream,
            maxRetries: 2, // 3 total attempts (1 initial + 2 retries)
            experimental_telemetry: {
              isEnabled: isProductionEnvironment,
              functionId: "stream-text",
            },
            onFinish: async ({ usage }) => {
              try {
                const providers = await getTokenlensCatalog();
                const modelId = usedFallback
                  ? myProvider.languageModel("fallback-model").modelId
                  : myProvider.languageModel(selectedChatModel).modelId;
                
                // Log API usage for verification
                console.log(
                  `[Gemini API] Model: ${modelId || "unknown"}, Tokens: ${usage.inputTokens || 0} input + ${usage.outputTokens || 0} output = ${usage.totalTokens || 0} total`
                );
                
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
                finalMergedUsage = {
                  ...usage,
                  ...summary,
                  modelId,
                } as AppUsage;
                dataStream.write({
                  type: "data-usage",
                  data: finalMergedUsage,
                });
              } catch (err) {
                console.warn("TokenLens enrichment failed", err);
                finalMergedUsage = usage;
                dataStream.write({ type: "data-usage", data: finalMergedUsage });
              }
            },
          });
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : String(error);
          const isRetryable =
            errorMessage.includes("rate limit") ||
            errorMessage.includes("429") ||
            errorMessage.includes("quota") ||
            errorMessage.includes("RESOURCE_EXHAUSTED");

          if (isRetryable) {
            console.warn(
              `Primary model ${selectedChatModel} failed, falling back to gemini-2.0-flash-lite`
            );
            usedFallback = true;
            result = streamText({
              model: myProvider.languageModel("fallback-model"),
              system: systemPromptText,
              messages: modelMessages,
              stopWhen: stepCountIs(5),
              experimental_activeTools: activeTools,
              experimental_transform: smoothStream({ chunking: "word" }),
              tools: toolsWithStream,
              maxRetries: 0, // No retries on fallback
              experimental_telemetry: {
                isEnabled: isProductionEnvironment,
                functionId: "stream-text",
              },
              onFinish: async ({ usage }) => {
                try {
                  const providers = await getTokenlensCatalog();
                  const modelId =
                    myProvider.languageModel("fallback-model").modelId;
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
                  finalMergedUsage = {
                    ...usage,
                    ...summary,
                    modelId,
                  } as AppUsage;
                  dataStream.write({
                    type: "data-usage",
                    data: finalMergedUsage,
                  });
                } catch (err) {
                  console.warn("TokenLens enrichment failed", err);
                  finalMergedUsage = usage;
                  dataStream.write({
                    type: "data-usage",
                    data: finalMergedUsage,
                  });
                }
              },
            });
          } else {
            throw error;
          }
        }

        try {
          result.consumeStream();

          dataStream.merge(
            result.toUIMessageStream({
              sendReasoning: true,
            })
          );
        } catch (streamError) {
          console.error("Error consuming or merging stream:", streamError);
          // Re-throw to be caught by outer error handler
          throw streamError;
        }
      },
      generateId: generateUUID,
      onFinish: async ({ messages }) => {
        // Save assistant messages with state snapshots if in questionnaire mode
        if (isQuestionnaireMode && updatedQuestionnaireState) {
          logQuestionnaireDebug("Persisting questionnaire state", {
            chatId: id,
            state: updatedQuestionnaireState,
          });

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

    const response = new Response(
      stream.pipeThrough(new JsonToSseTransformStream())
    );

    // Add rate limit headers
    response.headers.set("X-RateLimit-Limit", "30");
    response.headers.set(
      "X-RateLimit-Remaining",
      currentRateLimit.remaining.toString()
    );
    response.headers.set(
      "X-RateLimit-Reset",
      currentRateLimit.reset.toString()
    );

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
