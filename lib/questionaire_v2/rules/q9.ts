import {
  getQuestion,
  type QUESTION_TYPE,
  updateBestPlan,
} from "../question_definitions";
import { clientState } from "../state";
import { getQuestionAnswer } from "../state_manager";

/**
 * Rule for Q9: Criminal conviction (excluding DUI/DWI) in last 5 years?
 * @returns the next question on success
 * @returns null on error or out of questions
 */
export function apply_rule_Q9(): QUESTION_TYPE | null {
  const answer = getQuestionAnswer("Q9");
  if (typeof answer !== "boolean") {
    console.error("Q9 answer not found or invalid");
    return null;
  }

  if (!answer) {
    // NO -> Day1 -> Q10
    updateBestPlan("Day1");
    return getQuestion("Q10");
  }
  // YES -> Q9mult (2 or more charges/convictions?)
  return getQuestion("Q9mult");
}

/**
 * Rule for Q9mult: Have you ever been charged/convicted 2 or more times, or have charges or sentencing currently pending?
 * @returns the next question on success
 * @returns null on error or out of questions
 */
export function apply_rule_Q9mult(): QUESTION_TYPE | null {
  const answer = getQuestionAnswer("Q9mult");
  if (typeof answer !== "boolean") {
    console.error("Q9mult answer not found or invalid");
    return null;
  }

  if (answer) {
    // YES (2+ charges/convictions or pending) -> DENIAL
    updateBestPlan("DENIAL");
    clientState.is_complete = true;
    return null;
  }
  // NO -> Q9inc (incarceration duration?)
  return getQuestion("Q9inc");
}

/**
 * Rule for Q9inc: If incarcerated, was it for 6 months or more?
 * @returns the next question on success
 * @returns null on error or out of questions
 */
export function apply_rule_Q9inc(): QUESTION_TYPE | null {
  const answer = getQuestionAnswer("Q9inc");
  if (typeof answer !== "boolean") {
    console.error("Q9inc answer not found or invalid");
    return null;
  }

  if (answer) {
    // YES (6+ months incarceration) -> DENIAL
    updateBestPlan("DENIAL");
    clientState.is_complete = true;
    return null;
  }
  // NO (< 6 months or not incarcerated) -> Q9yrs (years since sentence completion)
  return getQuestion("Q9yrs");
}

/**
 * Rule for Q9yrs: When did you complete your sentence, parole or probation (number of years)?
 * @returns the next question on success
 * @returns null on error or out of questions
 */
export function apply_rule_Q9yrs(): QUESTION_TYPE | null {
  const answer = getQuestionAnswer("Q9yrs");
  if (typeof answer !== "number") {
    console.error("Q9yrs answer not found or invalid");
    return null;
  }

  const yearsSinceCompletion = answer;

  if (yearsSinceCompletion < 3) {
    // < 3 years -> Guaranteed+ -> Q10
    updateBestPlan("Guaranteed+");
    return getQuestion("Q10");
  }

  if (yearsSinceCompletion <= 5) {
    // 3-5 years -> Deferred+ -> Q10
    updateBestPlan("Deferred+");
    return getQuestion("Q10");
  }

  // > 5 years -> Signature -> Q10
  updateBestPlan("Signature");
  return getQuestion("Q10");
}
