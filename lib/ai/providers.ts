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

const google = createGoogleGenerativeAI({
  apiKey: GOOGLE_API_KEY,
  maxRetries: 5,
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
        "chat-model": google("gemini-2.5-flash"),
        // "chat-model-reasoning": wrapLanguageModel({
        //   model: gateway.languageModel("xai/grok-3-mini"),
        //   middleware: extractReasoningMiddleware({ tagName: "think" }),
        // }),
        // "title-model": gateway.languageModel("xai/grok-2-1212"),
        // "artifact-model": gateway.languageModel("xai/grok-2-1212"),
        "title-model": google("gemini-2.5-flash"),
        "artifact-model": google("gemini-2.5-flash"),
      },
    });
