import {
  getQuestion,
  type QUESTION_TYPE,
  updateBestPlan,
} from "../question_definitions";
import { getQuestionAnswer } from "../state_manager";

/**
 * Rule for Q16M: [MALE] Have you ever been diagnosed with a prostate disorder or elevated PSA, disorder of the testes, nephritis, nephropathy, kidney disease, polycystic kidney disease or any other genitourinary disorder?
 * @returns the next question on success
 * @returns null on error or out of questions
 */
export function apply_rule_Q16M(): QUESTION_TYPE | null {
  const answer = getQuestionAnswer("Q16M");
  if (typeof answer !== "boolean") {
    console.error("Q16M answer not found or invalid");
    return null;
  }

  if (answer) {
    // YES -> Deferred+ -> Q17
    updateBestPlan("Deferred+");
    return getQuestion("Q17");
  }
  // NO -> Q16M2 (recent findings?)
  return getQuestion("Q16M2");
}

/**
 * Rule for Q16M2: In the last 2 years, have you been diagnosed with or told you had sugar or blood in the urine, elevated PSA due to an infection treated with antibiotics?
 * @returns the next question on success
 * @returns null on error or out of questions
 */
export function apply_rule_Q16M2(): QUESTION_TYPE | null {
  const answer = getQuestionAnswer("Q16M2");
  if (typeof answer !== "boolean") {
    console.error("Q16M2 answer not found or invalid");
    return null;
  }

  if (!answer) {
    // NO -> Day1 -> Q17
    updateBestPlan("Day1");
    return getQuestion("Q17");
  }
  // YES -> Q16M3 (normal follow-up?)
  return getQuestion("Q16M3");
}

/**
 * Rule for Q16M3: Have you had a normal follow-up in the last 12 months, with no further tests or consult recommended?
 * @returns the next question on success
 * @returns null on error or out of questions
 */
export function apply_rule_Q16M3(): QUESTION_TYPE | null {
  const answer = getQuestionAnswer("Q16M3");
  if (typeof answer !== "boolean") {
    console.error("Q16M3 answer not found or invalid");
    return null;
  }

  if (answer) {
    // YES -> Day1+ -> Q17
    updateBestPlan("Day1+");
    return getQuestion("Q17");
  }
  // NO -> Deferred+ -> Q17
  updateBestPlan("Deferred+");
  return getQuestion("Q17");
}

/**
 * Rule for Q16F: [FEMALE] Have you ever been diagnosed with a disorder of the ovaries, uterus or genitals (excluding hysterectomy), nephritis, nephropathy, kidney disease, polycystic kidney disease or any other genitourinary disorder?
 * @returns the next question on success
 * @returns null on error or out of questions
 */
export function apply_rule_Q16F(): QUESTION_TYPE | null {
  const answer = getQuestionAnswer("Q16F");
  if (typeof answer !== "boolean") {
    console.error("Q16F answer not found or invalid");
    return null;
  }

  if (answer) {
    // YES -> Deferred+ -> Q17
    updateBestPlan("Deferred+");
    return getQuestion("Q17");
  }
  // NO -> Q16F2 (recent findings?)
  return getQuestion("Q16F2");
}

/**
 * Rule for Q16F2: In the last 2 years, have you been diagnosed with or told you had sugar or blood in the urine (excluding menstrual related), or any abnormal pap smear?
 * @returns the next question on success
 * @returns null on error or out of questions
 */
export function apply_rule_Q16F2(): QUESTION_TYPE | null {
  const answer = getQuestionAnswer("Q16F2");
  if (typeof answer !== "boolean") {
    console.error("Q16F2 answer not found or invalid");
    return null;
  }

  if (!answer) {
    // NO -> Day1 -> Q17
    updateBestPlan("Day1");
    return getQuestion("Q17");
  }
  // YES -> Q16F3 (normal follow-up?)
  return getQuestion("Q16F3");
}

/**
 * Rule for Q16F3: Have you had a normal follow-up in the last 12 months with no further tests or consult recommended?
 * @returns the next question on success
 * @returns null on error or out of questions
 */
export function apply_rule_Q16F3(): QUESTION_TYPE | null {
  const answer = getQuestionAnswer("Q16F3");
  if (typeof answer !== "boolean") {
    console.error("Q16F3 answer not found or invalid");
    return null;
  }

  if (answer) {
    // YES -> Day1+ -> Q17
    updateBestPlan("Day1+");
    return getQuestion("Q17");
  }
  // NO -> Deferred+ -> Q17
  updateBestPlan("Deferred+");
  return getQuestion("Q17");
}
