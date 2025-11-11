import {
  getQuestion,
  type QUESTION_TYPE,
  updateBestPlan,
} from "../question_definitions";
import { clientState } from "../state";
import { getQuestionAnswer } from "../state_manager";

/**
 * Rule for Q8: DUI/DWI in last 3 years?
 * @returns the next question on success
 * @returns null on error or out of questions
 */
export function apply_rule_Q8(): QUESTION_TYPE | null {
  const answer = getQuestionAnswer("Q8");
  if (typeof answer !== "boolean") {
    console.error("Q8 answer not found or invalid");
    return null;
  }

  if (!answer) {
    // NO -> Day1 -> Q9
    updateBestPlan("Day1");
    return getQuestion("Q9");
  }

  // YES -> Check age >71, otherwise Q8count
  if (clientState.age !== null && clientState.age > 71) {
    // Age > 71 -> Guaranteed+ -> Q9
    updateBestPlan("Guaranteed+");
    return getQuestion("Q9");
  }

  // Age <= 71 or age not set -> Q8count (2 or more DUIs?)
  return getQuestion("Q8count");
}

/**
 * Rule for Q8count: Have you had 2 or more DUIs to date?
 * @returns the next question on success
 * @returns null on error or out of questions
 */
export function apply_rule_Q8count(): QUESTION_TYPE | null {
  const answer = getQuestionAnswer("Q8count");
  if (typeof answer !== "boolean") {
    console.error("Q8count answer not found or invalid");
    return null;
  }

  if (answer) {
    // YES (2+ DUIs) -> Guaranteed+ -> Q9
    updateBestPlan("Guaranteed+");
    return getQuestion("Q9");
  }

  // NO (< 2 DUIs) -> Day1+ -> Q9
  // Note: Combo rules with Q18 will be handled in Q18's rule handler
  updateBestPlan("Day1+");
  return getQuestion("Q9");
}
