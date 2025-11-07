"use server";

import { generateText, type UIMessage } from "ai";
import { cookies } from "next/headers";
import type { VisibilityType } from "@/components/visibility-selector";
import { titlePrompt } from "@/lib/ai/prompts";
import { myProvider } from "@/lib/ai/providers";
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
  const { text: title } = await generateText({
    model: myProvider.languageModel("title-model"),
    system: titlePrompt,
    prompt: getTextFromMessage(message),
    maxRetries: 5,
  });

  return title;
}

export async function deleteTrailingMessages({ id }: { id: string }) {
  const [message] = await getMessageById({ id });

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
    let stateSnapshot = null;
    for (let i = remainingMessages.length - 1; i >= 0; i--) {
      const msg = remainingMessages[i];
      if (msg.stateSnapshot) {
        stateSnapshot = msg.stateSnapshot;
        break;
      }
    }

    // If we found a snapshot, restore it
    if (stateSnapshot) {
      await updateChatQuestionnaireState({
        chatId: message.chatId,
        state: stateSnapshot,
        rateType: stateSnapshot.rateType ?? null,
      });
    } else {
      // If no snapshot found, reset to initial state
      const { createInitialState } = await import("@/lib/questionaire/state");
      const initialState = createInitialState();
      await updateChatQuestionnaireState({
        chatId: message.chatId,
        state: initialState,
        rateType: null,
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
