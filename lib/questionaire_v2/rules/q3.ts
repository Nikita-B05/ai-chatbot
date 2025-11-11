import {
  getQuestion,
  type QUESTION_TYPE,
  updateBestPlan,
} from "../question_definitions";
import { getQuestionAnswer } from "../state_manager";

/**
 * Rule for Q3: Currently working?
 * @returns the next question on success
 * @returns null on error or out of questions
 */
export function apply_rule_Q3(): QUESTION_TYPE | null {
  const answer = getQuestionAnswer("Q3");
  if (typeof answer !== "boolean") {
    console.error("Q3 answer not found or invalid");
    return null;
  }

  if (answer) {
    // YES -> Q3a (high-risk duties)
    return getQuestion("Q3a");
  }
  // NO -> Q3c (care facility)
  return getQuestion("Q3c");
}

/**
 * Rule for Q3a: High-risk duties
 * @returns the next question on success
 * @returns null on error or out of questions
 */
export function apply_rule_Q3a(): QUESTION_TYPE | null {
  const answer = getQuestionAnswer("Q3a");
  if (typeof answer !== "boolean") {
    console.error("Q3a answer not found or invalid");
    return null;
  }

  if (answer) {
    // YES -> Deferred+ -> Q4
    updateBestPlan("Deferred+");
    return getQuestion("Q4");
  }
  // NO -> Q3b (medium-risk duties)
  return getQuestion("Q3b");
}

/**
 * Rule for Q3b: Medium-risk duties
 * @returns the next question on success
 * @returns null on error or out of questions
 */
export function apply_rule_Q3b(): QUESTION_TYPE | null {
  const answer = getQuestionAnswer("Q3b");
  if (typeof answer !== "boolean") {
    console.error("Q3b answer not found or invalid");
    return null;
  }

  if (answer) {
    // YES -> Signature -> Q4
    updateBestPlan("Signature");
    return getQuestion("Q4");
  }
  // NO -> Day1 -> Q4
  updateBestPlan("Day1");
  return getQuestion("Q4");
}

/**
 * Rule for Q3c: Care facility
 * @returns the next question on success
 * @returns null on error or out of questions
 */
export function apply_rule_Q3c(): QUESTION_TYPE | null {
  const answer = getQuestionAnswer("Q3c");
  if (typeof answer !== "boolean") {
    console.error("Q3c answer not found or invalid");
    return null;
  }

  if (answer) {
    // YES -> Guaranteed+ -> Q4
    updateBestPlan("Guaranteed+");
    return getQuestion("Q4");
  }
  // NO -> Day1 -> Q4
  updateBestPlan("Day1");
  return getQuestion("Q4");
}
