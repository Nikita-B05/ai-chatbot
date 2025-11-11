import {
  getQuestion,
  type QUESTION_TYPE,
  updateBestPlan,
} from "../question_definitions";
import { clientState } from "../state";
import { getQuestionAnswer } from "../state_manager";

/**
 * Rule for Q6: Other illicit drugs?
 * @returns the next question on success
 * @returns null on error or out of questions
 */
export function apply_rule_Q6(): QUESTION_TYPE | null {
  const answer = getQuestionAnswer("Q6");
  if (typeof answer !== "boolean") {
    console.error("Q6 answer not found or invalid");
    return null;
  }

  if (!answer) {
    // NO -> Day1 -> Q7
    updateBestPlan("Day1");
    return getQuestion("Q7");
  }
  // YES -> Q6when (years since last use)
  return getQuestion("Q6when");
}

/**
 * Rule for Q6when: Years since last use?
 * @returns the next question on success
 * @returns null on error or out of questions
 */
export function apply_rule_Q6when(): QUESTION_TYPE | null {
  const answer = getQuestionAnswer("Q6when");
  if (typeof answer !== "number") {
    console.error("Q6when answer not found or invalid");
    return null;
  }

  const yearsSinceLastUse = answer;

  if (yearsSinceLastUse < 1) {
    // < 1 year -> DENIAL
    updateBestPlan("DENIAL");
    clientState.is_complete = true;
    return null;
  }

  if (yearsSinceLastUse < 2) {
    // 1-2 years -> logic will be in Q18
    return getQuestion("Q7");
  }

  if (yearsSinceLastUse < 5) {
    // 2-5 years -> logic will be in Q18
    return getQuestion("Q7");
  }

  if (yearsSinceLastUse < 10) {
    // 5-10 years -> Q6ecstasy (only Ecstasy/Speed/Hallucinogens?)
    return getQuestion("Q6ecstasy");
  }

  // >= 10 years -> Day1 -> Q7
  updateBestPlan("Day1");
  return getQuestion("Q7");
}

/**
 * Rule for Q6ecstasy: Only Ecstasy/Speed/Hallucinogens?
 * @returns the next question on success
 * @returns null on error or out of questions
 */
export function apply_rule_Q6ecstasy(): QUESTION_TYPE | null {
  const answer = getQuestionAnswer("Q6ecstasy");
  if (typeof answer !== "boolean") {
    console.error("Q6ecstasy answer not found or invalid");
    return null;
  }

  if (answer) {
    // YES -> Q6howmany (total times used)
    return getQuestion("Q6howmany");
  }
  // NO -> Will do in Q18
  return getQuestion("Q7");
}

/**
 * Rule for Q6howmany: Total times used?
 * @returns the next question on success
 * @returns null on error or out of questions
 */
export function apply_rule_Q6howmany(): QUESTION_TYPE | null {
  const answer = getQuestionAnswer("Q6howmany");
  if (typeof answer !== "number") {
    console.error("Q6howmany answer not found or invalid");
    return null;
  }

  const totalTimes = answer;

  if (totalTimes === 1) {
    // 1 use (experimental only) -> Day1 -> Q7
    updateBestPlan("Day1");
    return getQuestion("Q7");
  }

  // >= 2 uses -> Day1+ -> Q7
  updateBestPlan("Day1+");
  return getQuestion("Q7");
}
