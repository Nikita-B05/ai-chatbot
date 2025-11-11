"use server";

import { generateText, type UIMessage } from "ai";
import { cookies } from "next/headers";
import type { VisibilityType } from "@/components/visibility-selector";
import { titlePrompt } from "@/lib/ai/prompts";
import { withRetryAndFallback } from "@/lib/ai/retry-with-fallback";
import {
  deleteMessagesByChatIdAfterTimestamp,
  getChatById,
  getMessageById,
  getMessagesByChatId,
  updateChatQuestionnaireState,
  updateChatVisibilityById,
} from "@/lib/db/queries";
import { getTextFromMessage } from "@/lib/utils";

export async function saveChatModelAsCookie(model: string) {
  const cookieStore = await cookies();
  cookieStore.set("chat-model", model);
}

export async function generateTitleFromUserMessage({
  message,
}: {
  message: UIMessage;
}) {
  const { text: title } = await withRetryAndFallback(
    "title-model",
    async (model, maxRetries) =>
      generateText({
        model,
        system: titlePrompt,
        prompt: getTextFromMessage(message),
        maxRetries,
      })
  );

  return title;
}

export async function deleteTrailingMessages({ id }: { id: string }) {
  const [message] = await getMessageById({ id });

  if (!message) {
    throw new Error(`Message with id ${id} not found`);
  }

  await deleteMessagesByChatIdAfterTimestamp({
    chatId: message.chatId,
    timestamp: message.createdAt,
  });

  // Restore questionnaire state if chat is in questionnaire mode
  const chat = await getChatById({ id: message.chatId });
  if (chat?.questionaireMode) {
    // Get remaining messages after deletion
    const remainingMessages = await getMessagesByChatId({
      id: message.chatId,
    });

    // Find the last message with a state snapshot
    let stateSnapshot: Record<string, unknown> | null = null;
    for (let i = remainingMessages.length - 1; i >= 0; i--) {
      const msg = remainingMessages[i];
      if (msg.stateSnapshot) {
        stateSnapshot = msg.stateSnapshot as Record<string, unknown>;
        break;
      }
    }

    // If we found a snapshot, restore it
    if (stateSnapshot) {
      await updateChatQuestionnaireState({
        chatId: message.chatId,
        state: stateSnapshot,
        rateType: null, // v2 doesn't use rateType
      });
    } else {
      // If no snapshot found, reset to initial state
      const { getInitialState } = await import("@/lib/questionaire_v2/state");
      const { serializeState } = await import(
        "@/lib/questionaire_v2/state_serialization"
      );
      const initialState = getInitialState();
      const serializedState = serializeState(initialState);
      await updateChatQuestionnaireState({
        chatId: message.chatId,
        state: serializedState,
        rateType: null, // v2 doesn't use rateType
      });
    }
  }
}

export async function updateChatVisibility({
  chatId,
  visibility,
}: {
  chatId: string;
  visibility: VisibilityType;
}) {
  await updateChatVisibilityById({ chatId, visibility });
}
