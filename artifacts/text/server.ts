import { smoothStream, streamText } from "ai";
// import { updateDocumentPrompt } from "@/lib/ai/prompts";
import { myProvider } from "@/lib/ai/providers";
import { createDocumentHandler } from "@/lib/artifacts/server";

export const textDocumentHandler = createDocumentHandler<"text">({
  kind: "text",
  onCreateDocument: async ({ title, dataStream }) => {
    let draftContent = "";

    let fullStream;
    try {
      const result = streamText({
        model: myProvider.languageModel("artifact-model"),
        system:
          "Write about the given topic. Markdown is supported. Use headings wherever appropriate.",
        experimental_transform: smoothStream({ chunking: "word" }),
        prompt: title,
        maxRetries: 2, // 3 total attempts
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
        const result = streamText({
          model: myProvider.languageModel("fallback-model"),
          system:
            "Write about the given topic. Markdown is supported. Use headings wherever appropriate.",
          experimental_transform: smoothStream({ chunking: "word" }),
          prompt: title,
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

        if (type === "text-delta") {
          const { text } = delta;

          draftContent += text;

          dataStream.write({
            type: "data-textDelta",
            data: text,
            transient: true,
          });
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
        const result = streamText({
          model: myProvider.languageModel("fallback-model"),
          system:
            "Write about the given topic. Markdown is supported. Use headings wherever appropriate.",
          experimental_transform: smoothStream({ chunking: "word" }),
          prompt: title,
          maxRetries: 0,
        });

        for await (const delta of result.fullStream) {
          const { type } = delta;

          if (type === "text-delta") {
            const { text } = delta;

            draftContent += text;

            dataStream.write({
              type: "data-textDelta",
              data: text,
              transient: true,
            });
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
      const result = streamText({
        model: myProvider.languageModel("artifact-model"),
        system: "Update the following text document",
        experimental_transform: smoothStream({ chunking: "word" }),
        prompt: description,
        maxRetries: 2,
        providerOptions: {
          openai: {
            prediction: {
              type: "content",
              content: document.content,
            },
          },
        },
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
        const result = streamText({
          model: myProvider.languageModel("fallback-model"),
          system: "Update the following text document",
          experimental_transform: smoothStream({ chunking: "word" }),
          prompt: description,
          maxRetries: 0,
          providerOptions: {
            openai: {
              prediction: {
                type: "content",
                content: document.content,
              },
            },
          },
        });
        fullStream = result.fullStream;
      } else {
        throw error;
      }
    }

    try {
      for await (const delta of fullStream) {
        const { type } = delta;

        if (type === "text-delta") {
          const { text } = delta;

          draftContent += text;

          dataStream.write({
            type: "data-textDelta",
            data: text,
            transient: true,
          });
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
        const result = streamText({
          model: myProvider.languageModel("fallback-model"),
          system: "Update the following text document",
          experimental_transform: smoothStream({ chunking: "word" }),
          prompt: description,
          maxRetries: 0,
          providerOptions: {
            openai: {
              prediction: {
                type: "content",
                content: document.content,
              },
            },
          },
        });

        for await (const delta of result.fullStream) {
          const { type } = delta;

          if (type === "text-delta") {
            const { text } = delta;

            draftContent += text;

            dataStream.write({
              type: "data-textDelta",
              data: text,
              transient: true,
            });
          }
        }
      } else {
        throw error;
      }
    }

    return draftContent;
  },
});
