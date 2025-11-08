import { streamObject } from "ai";
import { z } from "zod";
// import { codePrompt, updateDocumentPrompt } from "@/lib/ai/prompts";
import { codePrompt } from "@/lib/ai/prompts";
import { myProvider } from "@/lib/ai/providers";
import { createDocumentHandler } from "@/lib/artifacts/server";

export const codeDocumentHandler = createDocumentHandler<"code">({
  kind: "code",
  onCreateDocument: async ({ title, dataStream }) => {
    let draftContent = "";

    let fullStream;
    try {
      const result = streamObject({
        model: myProvider.languageModel("artifact-model"),
        system: codePrompt,
        prompt: title,
        schema: z.object({
          code: z.string(),
        }),
        maxRetries: 2,
      });
      fullStream = result.fullStream;
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
          "Primary artifact-model failed, falling back to gemini-2.0-flash-lite"
        );
        const result = streamObject({
          model: myProvider.languageModel("fallback-model"),
          system: codePrompt,
          prompt: title,
          schema: z.object({
            code: z.string(),
          }),
          maxRetries: 0,
        });
        fullStream = result.fullStream;
      } else {
        throw error;
      }
    }

    try {
      for await (const delta of fullStream) {
        const { type } = delta;

        if (type === "object") {
          const { object } = delta;
          const { code } = object;

          if (code) {
            dataStream.write({
              type: "data-codeDelta",
              data: code ?? "",
              transient: true,
            });

            draftContent = code;
          }
        }
      }
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
          "Primary artifact-model stream failed, falling back to gemini-2.0-flash-lite"
        );
        const result = streamObject({
          model: myProvider.languageModel("fallback-model"),
          system: codePrompt,
          prompt: title,
          schema: z.object({
            code: z.string(),
          }),
          maxRetries: 0,
        });

        for await (const delta of result.fullStream) {
          const { type } = delta;

          if (type === "object") {
            const { object } = delta;
            const { code } = object;

            if (code) {
              dataStream.write({
                type: "data-codeDelta",
                data: code ?? "",
                transient: true,
              });

              draftContent = code;
            }
          }
        }
      } else {
        throw error;
      }
    }

    return draftContent;
  },
  onUpdateDocument: async ({ document, description, dataStream }) => {
    let draftContent = "";

    let fullStream;
    try {
      const result = streamObject({
        model: myProvider.languageModel("artifact-model"),
        system: "Update the following code document",
        prompt: description,
        schema: z.object({
          code: z.string(),
        }),
        maxRetries: 2,
      });
      fullStream = result.fullStream;
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
          "Primary artifact-model failed, falling back to gemini-2.0-flash-lite"
        );
        const result = streamObject({
          model: myProvider.languageModel("fallback-model"),
          system: "Update the following code document",
          prompt: description,
          schema: z.object({
            code: z.string(),
          }),
          maxRetries: 0,
        });
        fullStream = result.fullStream;
      } else {
        throw error;
      }
    }

    try {
      for await (const delta of fullStream) {
        const { type } = delta;

        if (type === "object") {
          const { object } = delta;
          const { code } = object;

          if (code) {
            dataStream.write({
              type: "data-codeDelta",
              data: code ?? "",
              transient: true,
            });

            draftContent = code;
          }
        }
      }
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
          "Primary artifact-model stream failed, falling back to gemini-2.0-flash-lite"
        );
        const result = streamObject({
          model: myProvider.languageModel("fallback-model"),
          system: "Update the following code document",
          prompt: description,
          schema: z.object({
            code: z.string(),
          }),
          maxRetries: 0,
        });

        for await (const delta of result.fullStream) {
          const { type } = delta;

          if (type === "object") {
            const { object } = delta;
            const { code } = object;

            if (code) {
              dataStream.write({
                type: "data-codeDelta",
                data: code ?? "",
                transient: true,
              });

              draftContent = code;
            }
          }
        }
      } else {
        throw error;
      }
    }

    return draftContent;
  },
});
