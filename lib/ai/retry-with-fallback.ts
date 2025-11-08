import type { LanguageModel } from "ai";
import { myProvider } from "./providers";

/**
 * Wraps a model call with retry logic and fallback to gemini-2.0-flash.
 * Uses maxRetries: 2 on the primary model (3 total attempts), then falls back to gemini-2.0-flash if all fail.
 */
export async function withRetryAndFallback<T>(
  modelId: string,
  callFn: (model: LanguageModel, maxRetries: number) => Promise<T>
): Promise<T> {
  const primaryModel = myProvider.languageModel(modelId);
  const fallbackModel = myProvider.languageModel("fallback-model");

  let lastError: unknown;

  // Try with primary model with 2 retries (3 total attempts)
  try {
    return await callFn(primaryModel, 2);
  } catch (error) {
    lastError = error;
    // Check if it's a rate limit or quota error
    const errorMessage =
      error instanceof Error ? error.message : String(error);
    const isRetryable =
      errorMessage.includes("rate limit") ||
      errorMessage.includes("429") ||
      errorMessage.includes("quota") ||
      errorMessage.includes("RESOURCE_EXHAUSTED");

    // If not a retryable error, throw immediately
    if (!isRetryable) {
      throw error;
    }

    // All retries failed, try with fallback model
    console.warn(
      `Primary model ${modelId} failed after 3 attempts, falling back to gemini-2.0-flash`
    );
    try {
      return await callFn(fallbackModel, 0); // No retries on fallback, just one attempt
    } catch (fallbackError) {
      // If fallback also fails, throw the original error
      throw lastError ?? fallbackError;
    }
  }
}

