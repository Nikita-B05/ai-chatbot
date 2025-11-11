import { tool } from "ai";
import { z } from "zod";
import { getQuestion } from "./question_definitions";
import { clientState } from "./state";
import { processQuestionAnswer, resetState } from "./state_manager";
import { deserializeState, serializeState } from "./state_serialization";

/**
 * Tool wrapper that integrates questionaire_v2 with database persistence
 * This tool updates the client state and returns information about the next question
 */
export const updateQuestionnaireStateV2 = ({
  currentState,
  onStateUpdate,
  chatId,
}: {
  currentState: Record<string, unknown>;
  onStateUpdate: (newState: Record<string, unknown>) => void;
  chatId: string;
}) =>
  tool({
    description:
      "Update the questionnaire state by recording an answer to a question. Use this tool when the user provides an answer to a question. The tool will validate the answer, update the state, and determine the next question to ask. When the questionnaire is complete (is_complete is true), check best_plan - if it's 'DENIAL', inform the user they're denied; otherwise, provide the plan name.",
    inputSchema: z.object({
      question_id: z
        .string()
        .describe(
          "The ID of the question being answered (e.g., 'Q0', 'Q1', 'Q2')"
        ),
      answer: z
        .union([
          z.boolean(),
          z.number(),
          z.string(),
          z.object({
            age: z.number().int().positive().min(18).max(150),
            gender: z.enum(["MALE", "FEMALE"]),
          }),
          z.object({
            height_cm: z.number().positive().min(50).max(300),
            weight_kg: z.number().positive().min(20).max(500),
          }),
        ])
        .describe(
          "The answer to the question. Can be a boolean, number, string, or an object (for Q0: age and gender, for Q2: height_cm and weight_kg)."
        ),
    }),
    execute: (input) => {
      console.log(
        "[Questionnaire V2 Tool] INPUT - updateQuestionnaireStateV2",
        {
          chatId,
          tool: "updateQuestionnaireStateV2",
          input: {
            question_id: input.question_id,
            answer: input.answer,
          },
          currentState,
        }
      );

      // Deserialize current state to state object
      const stateObj = deserializeState(currentState);

      // Reset and restore state
      resetState();
      Object.assign(clientState, stateObj);

      // Process the answer
      const nextQuestion = processQuestionAnswer(
        input.question_id,
        input.answer
      );

      // Serialize updated state
      const updatedState = serializeState(clientState);

      const toolOutput = {
        question_id: input.question_id,
        answer: input.answer,
        success: true,
        state: {
          is_complete: clientState.is_complete,
          best_plan: clientState.best_plan,
          answered_questions: clientState.answered_questions,
        },
        next_question: nextQuestion
          ? {
              id: nextQuestion.id,
              text: nextQuestion.text,
            }
          : null,
        message: clientState.is_complete
          ? clientState.best_plan === "DENIAL"
            ? "Questionnaire complete. Client is denied for insurance."
            : `Questionnaire complete. Best plan: ${clientState.best_plan}`
          : nextQuestion
            ? `Answer recorded. Next question: ${nextQuestion.id}`
            : "Answer recorded. No more questions.",
      };

      console.log(
        "[Questionnaire V2 Tool] OUTPUT - updateQuestionnaireStateV2",
        {
          chatId,
          tool: "updateQuestionnaireStateV2",
          output: toolOutput,
          updatedState,
        }
      );

      // Update state via callback
      onStateUpdate(updatedState);

      return toolOutput;
    },
  });

/**
 * Tool to get the first question (Q0) to start the questionnaire
 */
export const getFirstQuestion = tool({
  description:
    "Get the first question (Q0) to start the insurance questionnaire. Use this when the user wants to start an insurance questionnaire or apply for insurance.",
  inputSchema: z.object({}),
  execute: () => {
    console.log("[Questionnaire V2 Tool] INPUT - getFirstQuestion", {
      tool: "getFirstQuestion",
      input: {},
    });

    const q0 = getQuestion("Q0");
    if (!q0) {
      const errorOutput = {
        error: "Could not get first question",
      };
      console.log("[Questionnaire V2 Tool] OUTPUT - getFirstQuestion", {
        tool: "getFirstQuestion",
        output: errorOutput,
      });
      return errorOutput;
    }

    const toolOutput = {
      question: {
        id: q0.id,
        text: q0.text,
      },
      message:
        "Starting insurance questionnaire. Please answer the first question.",
    };

    console.log("[Questionnaire V2 Tool] OUTPUT - getFirstQuestion", {
      tool: "getFirstQuestion",
      output: toolOutput,
    });

    return toolOutput;
  },
});
