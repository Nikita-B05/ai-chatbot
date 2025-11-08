import { streamObject } from "ai";
import { z } from "zod";
// import { sheetPrompt, updateDocumentPrompt } from "@/lib/ai/prompts";
import { sheetPrompt } from "@/lib/ai/prompts";
import { myProvider } from "@/lib/ai/providers";
import { createDocumentHandler } from "@/lib/artifacts/server";

export const sheetDocumentHandler = createDocumentHandler<"sheet">({
  kind: "sheet",
  onCreateDocument: async ({ title, dataStream }) => {
    let draftContent = "";

    let fullStream;
    try {
      const result = streamObject({
        model: myProvider.languageModel("artifact-model"),
        system: sheetPrompt,
        prompt: title,
        schema: z.object({
          csv: z.string().describe("CSV data"),
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
          "Primary artifact-model failed, falling back to gemini-2.0-flash"
        );
        const result = streamObject({
          model: myProvider.languageModel("fallback-model"),
          system: sheetPrompt,
          prompt: title,
          schema: z.object({
            csv: z.string().describe("CSV data"),
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
          const { csv } = object;

          if (csv) {
            dataStream.write({
              type: "data-sheetDelta",
              data: csv,
              transient: true,
            });

            draftContent = csv;
          }
        }
      }

      dataStream.write({
        type: "data-sheetDelta",
        data: draftContent,
        transient: true,
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
          "Primary artifact-model stream failed, falling back to gemini-2.0-flash"
        );
        const result = streamObject({
          model: myProvider.languageModel("fallback-model"),
          system: sheetPrompt,
          prompt: title,
          schema: z.object({
            csv: z.string().describe("CSV data"),
          }),
          maxRetries: 0,
        });

        for await (const delta of result.fullStream) {
          const { type } = delta;

          if (type === "object") {
            const { object } = delta;
            const { csv } = object;

            if (csv) {
              dataStream.write({
                type: "data-sheetDelta",
                data: csv,
                transient: true,
              });

              draftContent = csv;
            }
          }
        }

        dataStream.write({
          type: "data-sheetDelta",
          data: draftContent,
          transient: true,
        });
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
        system: "Update the following sheet document",
        prompt: description,
        schema: z.object({
          csv: z.string(),
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
          "Primary artifact-model failed, falling back to gemini-2.0-flash"
        );
        const result = streamObject({
          model: myProvider.languageModel("fallback-model"),
          system: "Update the following sheet document",
          prompt: description,
          schema: z.object({
            csv: z.string(),
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
          const { csv } = object;

          if (csv) {
            dataStream.write({
              type: "data-sheetDelta",
              data: csv,
              transient: true,
            });

            draftContent = csv;
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
          "Primary artifact-model stream failed, falling back to gemini-2.0-flash"
        );
        const result = streamObject({
          model: myProvider.languageModel("fallback-model"),
          system: "Update the following sheet document",
          prompt: description,
          schema: z.object({
            csv: z.string(),
          }),
          maxRetries: 0,
        });

        for await (const delta of result.fullStream) {
          const { type } = delta;

          if (type === "object") {
            const { object } = delta;
            const { csv } = object;

            if (csv) {
              dataStream.write({
                type: "data-sheetDelta",
                data: csv,
                transient: true,
              });

              draftContent = csv;
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
