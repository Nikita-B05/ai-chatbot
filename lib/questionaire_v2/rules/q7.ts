import {
  getQuestion,
  type QUESTION_TYPE,
  updateBestPlan,
} from "../question_definitions";
import { clientState } from "../state";
import { getQuestionAnswer } from "../state_manager";

/**
 * Rule for Q7: Treatment for alcohol/drugs?
 * @returns the next question on success
 * @returns null on error or out of questions
 */
export function apply_rule_Q7(): QUESTION_TYPE | null {
  const answer = getQuestionAnswer("Q7");
  if (typeof answer !== "boolean") {
    console.error("Q7 answer not found or invalid");
    return null;
  }

  if (!answer) {
    // NO -> Day1 -> Q8
    updateBestPlan("Day1");
    return getQuestion("Q8");
  }
  // YES -> Q7alc (treatment for alcohol only?)
  return getQuestion("Q7alc");
}

/**
 * Rule for Q7alc: Treatment for alcohol only?
 * @returns the next question on success
 * @returns null on error or out of questions
 */
export function apply_rule_Q7alc(): QUESTION_TYPE | null {
  const answer = getQuestionAnswer("Q7alc");
  if (typeof answer !== "boolean") {
    console.error("Q7alc answer not found or invalid");
    return null;
  }

  if (answer) {
    // YES -> Q7yrsA (years since alcohol treatment)
    return getQuestion("Q7yrsA");
  }
  // NO -> Q7yrsD (years since drug treatment)
  return getQuestion("Q7yrsD");
}

/**
 * Rule for Q7yrsA: Years since alcohol treatment
 * @returns the next question on success
 * @returns null on error or out of questions
 */
export function apply_rule_Q7yrsA(): QUESTION_TYPE | null {
  const answer = getQuestionAnswer("Q7yrsA");
  if (typeof answer !== "number") {
    console.error("Q7yrsA answer not found or invalid");
    return null;
  }

  // Check combo rule: If Q4 (alcohol) = YES → DENIAL
  const q4Answer = getQuestionAnswer("Q4");
  if (typeof q4Answer === "boolean" && q4Answer) {
    // Q4 = YES (consumes alcohol) edit if non-problematic usage means something else → DENIAL
    updateBestPlan("DENIAL");
    clientState.is_complete = true;
    return null;
  }

  // Apply years-based rules
  return apply_rule_Q7yrs(answer);
}

/**
 * Rule for Q7yrsD: Years since drug treatment
 * @returns the next question on success
 * @returns null on error or out of questions
 */
export function apply_rule_Q7yrsD(): QUESTION_TYPE | null {
  const answer = getQuestionAnswer("Q7yrsD");
  if (typeof answer !== "number") {
    console.error("Q7yrsD answer not found or invalid");
    return null;
  }

  const yearsSinceLastTreatment = answer;

  // Check combo rule: If Q6 (drugs) = YES → DENIAL (modify based on how recent or what severe means)
  const q6Answer = getQuestionAnswer("Q6");
  if (typeof q6Answer === "boolean" && q6Answer) {
    // Q6 = YES (used other illicit drugs) → DENIAL
    updateBestPlan("DENIAL");
    clientState.is_complete = true;
    return null;
  }

  // Apply years-based rules
  return apply_rule_Q7yrs(yearsSinceLastTreatment);
}

/**
 * Helper function to apply years-based rules for Q7yrsA and Q7yrsD
 * @param yearsSinceLastTreatment Years since last treatment
 * @returns the next question on success
 * @returns null on error or out of questions
 */
function apply_rule_Q7yrs(
  yearsSinceLastTreatment: number
): QUESTION_TYPE | null {
  if (yearsSinceLastTreatment < 1) {
    // < 1 year -> Guaranteed+ -> Q8
    updateBestPlan("Guaranteed+");
    return getQuestion("Q8");
  }

  if (yearsSinceLastTreatment < 2) {
    // 1-2 years -> Deferred+ -> Q8
    updateBestPlan("Deferred+");
    return getQuestion("Q8");
  }

  if (yearsSinceLastTreatment < 5) {
    // 2-5 years -> Signature -> Q8
    updateBestPlan("Signature");
    return getQuestion("Q8");
  }

  if (yearsSinceLastTreatment < 10) {
    // 5-10 years -> Day1+ -> Q8
    updateBestPlan("Day1+");
    return getQuestion("Q8");
  }

  // >= 10 years -> Day1 -> Q8
  updateBestPlan("Day1");
  return getQuestion("Q8");
}
