import {
  getQuestion,
  type QUESTION_TYPE,
  updateBestPlan,
} from "../question_definitions";
import { getQuestionAnswer } from "../state_manager";

/**
 * Rule for Q14: Immune system disease, lupus, scleroderma, AIDS/HIV, etc?
 * @returns the next question on success
 * @returns null on error or out of questions
 */
export function apply_rule_Q14(): QUESTION_TYPE | null {
  const answer = getQuestionAnswer("Q14");
  if (typeof answer !== "boolean") {
    console.error("Q14 answer not found or invalid");
    return null;
  }

  if (!answer) {
    // NO -> Day1 -> Q15
    updateBestPlan("Day1");
    return getQuestion("Q15");
  }
  // YES -> Guaranteed+ -> Q15
  updateBestPlan("Guaranteed+");
  return getQuestion("Q15");
}
