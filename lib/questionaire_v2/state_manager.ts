import { getQuestion, type QUESTION_TYPE } from "./question_definitions";
import { apply_rule } from "./rules/main";
import { clientState } from "./state";

/**
 * Processes a question answer from a tool execution and updates the client state
 * @param question_id The ID of the question being answered
 * @param answer The answer value (validated against the question's schema)
 * @returns The next question to ask, or null if there are no more questions or an error occurred
 */
export function processQuestionAnswer(
  question_id: string,
  answer: unknown
): QUESTION_TYPE | null {
  // Get the question definition
  const question = getQuestion(question_id);
  if (!question) {
    console.error(`Question ${question_id} not found`);
    return null;
  }

  // Validate the answer against the question's schema
  const validationResult = question.answer_type.safeParse(answer);
  if (!validationResult.success) {
    console.error(
      `Invalid answer for question ${question_id}:`,
      validationResult.error
    );
    return null;
  }

  const validatedAnswer = validationResult.data;

  // Update state based on question type
  updateStateForQuestion(question_id, validatedAnswer);

  // Store the answer in question_answers Map
  clientState.question_answers.set(question_id, validatedAnswer);

  // Add to answered_questions if not already present
  if (!clientState.answered_questions.includes(question_id)) {
    clientState.answered_questions.push(question_id);
  }

  // Apply rule logic to determine next question
  const nextQuestion = apply_rule(question);

  // Update current_question_id to the next question
  if (nextQuestion) {
    clientState.current_question_id = nextQuestion.id;
  } else {
    clientState.current_question_id = null;
    clientState.is_complete = true;
  }

  return nextQuestion;
}

/**
 * Updates specific state fields based on the question being answered
 */
function updateStateForQuestion(question_id: string, answer: unknown): void {
  switch (question_id) {
    case "Q0":
      // Q0: Age and gender -> update age and gender
      if (
        typeof answer === "object" &&
        answer !== null &&
        "age" in answer &&
        "gender" in answer
      ) {
        const ag = answer as { age: number; gender: "MALE" | "FEMALE" };
        clientState.age = ag.age;
        clientState.gender = ag.gender;
      }
      break;

    case "Q1":
      // Q1: Tobacco usage -> update is_smoker
      if (typeof answer === "boolean") {
        clientState.is_smoker = answer;
      }
      break;

    case "Q2":
      // Q2: Height and weight -> update height_cm and weight_kg
      if (
        typeof answer === "object" &&
        answer !== null &&
        "height_cm" in answer &&
        "weight_kg" in answer
      ) {
        const hw = answer as { height_cm: number; weight_kg: number };
        clientState.height_cm = hw.height_cm;
        clientState.weight_kg = hw.weight_kg;
      }
      break;

    case "Q2PrePregnancyWeight":
      // Q2PrePregnancyWeight: Pre-pregnancy weight -> update weight_kg
      if (typeof answer === "number") {
        clientState.weight_kg = answer;
      }
      break;

    default:
      // For other questions, just store in question_answers (already done above)
      break;
  }
}

/**
 * Resets the client state to initial values
 */
export function resetState(): void {
  clientState.age = null;
  clientState.gender = null;
  clientState.is_smoker = null;
  clientState.height_cm = null;
  clientState.weight_kg = null;
  clientState.answered_questions = [];
  clientState.current_question_id = "Q0";
  clientState.is_complete = false;
  clientState.best_plan = "Day1";
  clientState.question_answers.clear();
}

/**
 * Checks if a question has been answered
 */
export function isQuestionAnswered(question_id: string): boolean {
  return clientState.answered_questions.includes(question_id);
}

/**
 * Gets the answer for a specific question
 */
export function getQuestionAnswer(question_id: string): unknown {
  return clientState.question_answers.get(question_id);
}
