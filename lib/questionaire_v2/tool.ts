import { tool } from "ai";
import { z } from "zod";
import { processQuestionAnswer } from "./state_manager";

/**
 * Tool for generating a question answer object from user input
 * Takes a question_id and answer and returns them in the standardized format
 * This tool also updates the client state with the answer
 */
export const generateQuestionAnswer = tool({
  description:
    "Generate a question answer object from user input. Use this tool when the user provides an answer to a question. The tool formats the question_id and answer into the required object structure and updates the client state.",
  inputSchema: z.object({
    question_id: z
      .string()
      .describe(
        "The ID of the question being answered (e.g., 'Q1', 'Q2', 'Q3')"
      ),
    answer: z
      .union([
        z.boolean(),
        z.number(),
        z.string(),
        z.object({
          height_cm: z.number().positive().min(50).max(300),
          weight_kg: z.number().positive().min(20).max(500),
        }),
      ])
      .describe(
        "The answer to the question. Can be a boolean, number, string, or an object with height_cm and weight_kg (for Q2). Height must be in centimeters (50-300 cm) and weight must be in kilograms (20-500 kg)."
      ),
  }),
  execute: (input) => {
    // Process the answer and update state
    const nextQuestion = processQuestionAnswer(input.question_id, input.answer);

    return {
      question_id: input.question_id,
      answer: input.answer,
      success: true,
      next_question: nextQuestion
        ? {
            id: nextQuestion.id,
            text: nextQuestion.text,
          }
        : null,
      message: nextQuestion
        ? `Answer recorded. Next question: ${nextQuestion.id}`
        : "Answer recorded. No more questions.",
    };
  },
});

/**
 * Tool for converting height and weight units
 * Converts height from inches to centimeters and weight from pounds to kilograms
 */
export const convertUnits = tool({
  description:
    "Convert height from inches to centimeters and weight from pounds to kilograms. Use this tool when the user provides height in inches or weight in pounds and you need to convert them to metric units.",
  inputSchema: z.object({
    heightInches: z
      .number()
      .min(0)
      .optional()
      .describe("Height in inches to convert to centimeters"),
    weightPounds: z
      .number()
      .min(0)
      .optional()
      .describe("Weight in pounds to convert to kilograms"),
  }),
  execute: (input) => {
    const INCHES_TO_CM = 2.54;
    const POUNDS_TO_KG = 0.453_592;

    const result: {
      heightCm?: number;
      weightKg?: number;
    } = {};

    if (input.heightInches !== undefined) {
      result.heightCm = Number((input.heightInches * INCHES_TO_CM).toFixed(2));
    }

    if (input.weightPounds !== undefined) {
      result.weightKg = Number((input.weightPounds * POUNDS_TO_KG).toFixed(2));
    }

    return {
      ...result,
      message:
        (input.heightInches !== undefined
          ? `Height converted: ${input.heightInches} inches = ${result.heightCm} cm. `
          : "") +
        (input.weightPounds !== undefined
          ? `Weight converted: ${input.weightPounds} lbs = ${result.weightKg} kg.`
          : ""),
    };
  },
});
