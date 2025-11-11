import {
  getQuestion,
  type QUESTION_TYPE,
  updateBestPlan,
} from "../question_definitions";
import { getQuestionAnswer } from "../state_manager";

/**
 * Rule for Q10: Do you have any physical or mental symptoms for which you have not yet consulted a health professional?
 * @returns the next question on success
 * @returns null on error or out of questions
 */
export function apply_rule_Q10(): QUESTION_TYPE | null {
  const answer = getQuestionAnswer("Q10");
  if (typeof answer !== "boolean") {
    console.error("Q10 answer not found or invalid");
    return null;
  }

  if (answer) {
    // YES -> Guaranteed+ -> Q10B
    updateBestPlan("Guaranteed+");
    return getQuestion("Q10B");
  }
  // NO -> Day1 -> Q10B
  updateBestPlan("Day1");
  return getQuestion("Q10B");
}

/**
 * Rule for Q10B: Have you been advised of an abnormal test result, or to have treatment or investigations which have not yet started or been completed, or are you awaiting results of any medical investigations?
 * @returns the next question on success
 * @returns null on error or out of questions
 */
export function apply_rule_Q10B(): QUESTION_TYPE | null {
  const answer = getQuestionAnswer("Q10B");
  if (typeof answer !== "boolean") {
    console.error("Q10B answer not found or invalid");
    return null;
  }

  if (answer) {
    // YES -> Guaranteed+ -> Q11
    updateBestPlan("Guaranteed+");
    return getQuestion("Q11");
  }
  // NO -> Day1 -> Q11
  updateBestPlan("Day1");
  return getQuestion("Q11");
}
