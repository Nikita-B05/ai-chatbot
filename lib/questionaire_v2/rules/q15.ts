import {
  getQuestion,
  type QUESTION_TYPE,
  updateBestPlan,
} from "../question_definitions";
import { clientState } from "../state";
import { getQuestionAnswer } from "../state_manager";

/**
 * Helper function to check if Q11 (CAD) is YES
 */
function hasQ11CAD(): boolean {
  const q11Answer = getQuestionAnswer("Q11");
  return typeof q11Answer === "boolean" && q11Answer === true;
}

/**
 * Helper function to get next question based on gender (Q16M for male, Q16F for female)
 * @returns Q16M if male, Q16F if female, or Q16M as default
 */
function getNextQuestionByGender(): QUESTION_TYPE | null {
  if (clientState.gender === "FEMALE") {
    return getQuestion("Q16F");
  }
  if (clientState.gender === "MALE") {
    return getQuestion("Q16M");
  }
  // Default to Q16M if gender not set
  return getQuestion("Q16M");
}

/**
 * Rule for Q15: Respiratory/COPD
 * @returns the next question on success
 * @returns null on error or out of questions
 */
export function apply_rule_Q15(): QUESTION_TYPE | null {
  const answer = getQuestionAnswer("Q15");
  if (typeof answer !== "boolean") {
    console.error("Q15 answer not found or invalid");
    return null;
  }

  if (answer) {
    // YES -> Q15O2 (oxygen therapy in last 2 years?)
    return getQuestion("Q15O2");
  }
  // NO -> Q15sleep (sleep apnea?)
  return getQuestion("Q15sleep");
}

/**
 * Rule for Q15O2: Have you been on oxygen therapy in the last 2 years?
 * @returns the next question on success
 * @returns null on error or out of questions
 */
export function apply_rule_Q15O2(): QUESTION_TYPE | null {
  const answer = getQuestionAnswer("Q15O2");
  if (typeof answer !== "boolean") {
    console.error("Q15O2 answer not found or invalid");
    return null;
  }

  if (answer) {
    // YES -> Guaranteed+ -> Q16M/Q16F
    updateBestPlan("Guaranteed+");
    return getNextQuestionByGender();
  }
  // NO -> Deferred+ -> Check if Q11 (CAD) or SMOKER -> Guaranteed+
  updateBestPlan("Deferred+");
  if (hasQ11CAD() || clientState.is_smoker === true) {
    updateBestPlan("Guaranteed+");
  }
  return getNextQuestionByGender();
}

/**
 * Rule for Q15sleep: Have you been diagnosed, treated, or been prescribed treatment for sleep apnea?
 * @returns the next question on success
 * @returns null on error or out of questions
 */
export function apply_rule_Q15sleep(): QUESTION_TYPE | null {
  const answer = getQuestionAnswer("Q15sleep");
  if (typeof answer !== "boolean") {
    console.error("Q15sleep answer not found or invalid");
    return null;
  }

  if (answer) {
    // YES -> Q15cpap (CPAP/BIPAP daily?)
    return getQuestion("Q15cpap");
  }
  // NO -> Q15asthma (asthma/chronic bronchitis?)
  return getQuestion("Q15asthma");
}

/**
 * Rule for Q15asthma: Have you ever been diagnosed with asthma or chronic bronchitis?
 * @returns the next question on success
 * @returns null on error or out of questions
 */
export function apply_rule_Q15asthma(): QUESTION_TYPE | null {
  const answer = getQuestionAnswer("Q15asthma");
  if (typeof answer !== "boolean") {
    console.error("Q15asthma answer not found or invalid");
    return null;
  }

  if (!answer) {
    // NO -> Day1 -> Q16M/Q16F
    updateBestPlan("Day1");
    return getNextQuestionByGender();
  }
  // YES -> Q15sev (severe asthma symptoms?)
  return getQuestion("Q15sev");
}

/**
 * Rule for Q15sev: Have you been prescribed steroids, take 2 or more daily inhalers, admitted or hospitalized to control your asthma symptoms within the last 2 years?
 * @returns the next question on success
 * @returns null on error or out of questions
 */
export function apply_rule_Q15sev(): QUESTION_TYPE | null {
  const answer = getQuestionAnswer("Q15sev");
  if (typeof answer !== "boolean") {
    console.error("Q15sev answer not found or invalid");
    return null;
  }

  if (!answer) {
    // NO -> Day1+ -> Q16M/Q16F
    updateBestPlan("Day1+");
    return getNextQuestionByGender();
  }
  // YES -> Signature -> Check if SMOKER -> Deferred+
  updateBestPlan("Signature");
  if (clientState.is_smoker === true) {
    updateBestPlan("Deferred+");
  }
  return getNextQuestionByGender();
}

/**
 * Rule for Q15cpap: Do you use a treatment everyday such as a BIPAP, CPAP, or any other machine or oral appliance?
 * @returns the next question on success
 * @returns null on error or out of questions
 */
export function apply_rule_Q15cpap(): QUESTION_TYPE | null {
  const answer = getQuestionAnswer("Q15cpap");
  if (typeof answer !== "boolean") {
    console.error("Q15cpap answer not found or invalid");
    return null;
  }

  if (!answer) {
    // NO -> Signature -> Check if Q11 (CAD) -> Deferred+
    updateBestPlan("Signature");
    if (hasQ11CAD()) {
      updateBestPlan("Deferred+");
    }
    return getNextQuestionByGender();
  }
  // YES -> Day1+ -> Check if Q11 (CAD) -> Signature
  updateBestPlan("Day1+");
  if (hasQ11CAD()) {
    updateBestPlan("Signature");
  }
  return getNextQuestionByGender();
}
