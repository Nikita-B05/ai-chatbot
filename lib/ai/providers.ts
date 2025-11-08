// import { gateway } from "@ai-sdk/gateway";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import {
  customProvider,
  // extractReasoningMiddleware,
  // wrapLanguageModel,
} from "ai";
import { isTestEnvironment } from "../constants";

// Direct Google API client (bypassing Vercel AI Gateway)
// Use hardcoded API key to ensure all calls go through the same key
const GOOGLE_API_KEY = process.env.GOOGLE_GENERATIVE_AI_KEY;

if (!isTestEnvironment && !GOOGLE_API_KEY) {
  console.warn(
    "WARNING: GOOGLE_GENERATIVE_AI_KEY environment variable is not set. API calls will fail."
  );
}

if (!isTestEnvironment && GOOGLE_API_KEY) {
  // Log first 10 and last 4 characters of API key for debugging (without exposing full key)
  const keyPreview =
    GOOGLE_API_KEY.length > 14
      ? `${GOOGLE_API_KEY.substring(0, 10)}...${GOOGLE_API_KEY.substring(
          GOOGLE_API_KEY.length - 4
        )}`
      : "***";
  console.log(`Using Google API Key: ${keyPreview}`);
}

const google = createGoogleGenerativeAI({
  apiKey: GOOGLE_API_KEY,
});

export const myProvider = isTestEnvironment
  ? (() => {
      const {
        artifactModel,
        chatModel,
        // reasoningModel,
        titleModel,
      } = require("./models.mock");
      return customProvider({
        languageModels: {
          "chat-model": chatModel,
          // "chat-model-reasoning": reasoningModel,
          "title-model": titleModel,
          "artifact-model": artifactModel,
        },
      });
    })()
  : customProvider({
      languageModels: {
        "chat-model": google("gemini-2.0-flash"),
        // "chat-model-reasoning": wrapLanguageModel({
        //   model: gateway.languageModel("xai/grok-3-mini"),
        //   middleware: extractReasoningMiddleware({ tagName: "think" }),
        // }),
        // "title-model": gateway.languageModel("xai/grok-2-1212"),
        // "artifact-model": gateway.languageModel("xai/grok-2-1212"),
        "title-model": google("gemini-2.0-flash"),
        "artifact-model": google("gemini-2.0-flash"),
        "fallback-model": google("gemini-2.0-flash-lite"),
      },
    });
