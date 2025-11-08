import type { LanguageModel } from "ai";
import { myProvider } from "./providers";

/**
 * Extracts retry delay from error message if available
 */
function extractRetryDelay(error: unknown): number | null {
  const errorMessage =
    error instanceof Error ? error.message : String(error);
  
  // Look for "Please retry in X.XXXs" pattern
  const retryMatch = errorMessage.match(/Please retry in ([\d.]+)s/i);
  if (retryMatch) {
    const seconds = Number.parseFloat(retryMatch[1]);
    if (!Number.isNaN(seconds) && seconds > 0) {
      return Math.ceil(seconds * 1000); // Convert to milliseconds
    }
  }
  
  return null;
}

/**
 * Checks if error is a quota exhaustion error (not just rate limit)
 * Quota errors mean both models will fail, so fallback won't help
 */
function isQuotaExhausted(error: unknown): boolean {
  const errorMessage =
    error instanceof Error ? error.message : String(error);
  
  return (
    errorMessage.includes("quota") &&
    (errorMessage.includes("exceeded") ||
      errorMessage.includes("limit") ||
      errorMessage.includes("free_tier"))
  );
}

/**
 * Wraps a model call with retry logic and fallback to gemini-2.0-flash-lite.
 * Uses maxRetries: 2 on the primary model (3 total attempts), then falls back to gemini-2.0-flash-lite if all fail.
 * Note: If quota is exhausted, fallback won't help since both models share the same quota.
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

    // Check if quota is exhausted - if so, don't try fallback (both models share quota)
    if (isQuotaExhausted(error)) {
      const retryDelay = extractRetryDelay(error);
      const delayMessage = retryDelay
        ? ` Please retry in ${Math.ceil(retryDelay / 1000)} seconds.`
        : "";
      
      console.error(
        `Quota exhausted for ${modelId}. Fallback model will also fail (shared quota).${delayMessage}`
      );
      throw error;
    }

    // All retries failed, try with fallback model
    console.warn(
      `Primary model ${modelId} failed after 3 attempts, falling back to gemini-2.0-flash-lite`
    );
    try {
      return await callFn(fallbackModel, 0); // No retries on fallback, just one attempt
    } catch (fallbackError) {
      // If fallback also fails, check if it's quota exhaustion
      if (isQuotaExhausted(fallbackError)) {
        const retryDelay = extractRetryDelay(fallbackError);
        const delayMessage = retryDelay
          ? ` Please retry in ${Math.ceil(retryDelay / 1000)} seconds.`
          : "";
        
        console.error(
          `Fallback model also hit quota limit.${delayMessage}`
        );
      }
      // Throw the original error (from primary model) as it's more informative
      throw lastError ?? fallbackError;
    }
  }
}

