import {
  getQuestion,
  type QUESTION_TYPE,
  updateBestPlan,
} from "../question_definitions";
import { getQuestionAnswer } from "../state_manager";

/**
 * Rule for Q20: Endocrine/metabolic disorders
 * @returns the next question on success
 * @returns null on error or out of questions
 */
export function apply_rule_Q20(): QUESTION_TYPE | null {
  const answer = getQuestionAnswer("Q20");
  if (typeof answer !== "boolean") {
    console.error("Q20 answer not found or invalid");
    return null;
  }

  if (!answer) {
    // NO -> Day1 -> Q21
    updateBestPlan("Day1");
    return getQuestion("Q21");
  }

  // YES -> Signature -> Q21
  updateBestPlan("Signature");
  return getQuestion("Q21");
}
