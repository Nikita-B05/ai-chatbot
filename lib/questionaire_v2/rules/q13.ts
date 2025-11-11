import {
  getQuestion,
  type QUESTION_TYPE,
  updateBestPlan,
} from "../question_definitions";
import { getQuestionAnswer } from "../state_manager";

/**
 * Rule for Q13: Cancer/tumor/lymphoma/leukemia/malignancy in last 10 years?
 * @returns the next question on success
 * @returns null on error or out of questions
 */
export function apply_rule_Q13(): QUESTION_TYPE | null {
  const answer = getQuestionAnswer("Q13");
  if (typeof answer !== "boolean") {
    console.error("Q13 answer not found or invalid");
    return null;
  }

  if (!answer) {
    // NO -> Day1 -> Q14
    updateBestPlan("Day1");
    return getQuestion("Q14");
  }
  // YES -> Deferred+ -> Q14
  updateBestPlan("Deferred+");
  return getQuestion("Q14");
}
