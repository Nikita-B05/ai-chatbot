import {
  getQuestion,
  type QUESTION_TYPE,
  updateBestPlan,
} from "../question_definitions";
import { clientState } from "../state";
import { getQuestionAnswer } from "../state_manager";
import { calculateBMI } from "./bmi_calculator";

/**
 * Helper function to check if Q11 (CAD) is YES
 */
function hasQ11CAD(): boolean {
  const q11Answer = getQuestionAnswer("Q11");
  return typeof q11Answer === "boolean" && q11Answer === true;
}

/**
 * Rule for Q12F: [Female] Have you ever been diagnosed with gestational diabetes (within the last 2 years), diabetes or pre-diabetes?
 * @returns the next question on success
 * @returns null on error or out of questions
 */
export function apply_rule_Q12F(): QUESTION_TYPE | null {
  const answer = getQuestionAnswer("Q12F");
  if (typeof answer !== "boolean") {
    console.error("Q12F answer not found or invalid");
    return null;
  }

  if (!answer) {
    // NO -> Day1 -> Q13
    updateBestPlan("Day1");
    return getQuestion("Q13");
  }
  // YES -> Q12F1 (Type 1 diabetes?)
  return getQuestion("Q12F1");
}

/**
 * Rule for Q12F1: Were you diagnosed with Diabetes type 1?
 * @returns the next question on success
 * @returns null on error or out of questions
 */
export function apply_rule_Q12F1(): QUESTION_TYPE | null {
  const answer = getQuestionAnswer("Q12F1");
  if (typeof answer !== "boolean") {
    console.error("Q12F1 answer not found or invalid");
    return null;
  }

  if (answer) {
    // YES (Type 1) -> Q12F1a (complications?)
    return getQuestion("Q12F1a");
  }
  // NO (Type 2/gestational/other) -> Q12F2 (gestational only?)
  return getQuestion("Q12F2");
}

/**
 * Rule for Q12F1a: Have you ever had complications of your diabetes?
 * @returns the next question on success
 * @returns null on error or out of questions
 */
export function apply_rule_Q12F1a(): QUESTION_TYPE | null {
  const answer = getQuestionAnswer("Q12F1a");
  if (typeof answer !== "boolean") {
    console.error("Q12F1a answer not found or invalid");
    return null;
  }

  // Check BMI >40 OR Q11 (CAD) = YES -> Guaranteed+
  if (
    (clientState.height_cm !== null &&
      clientState.weight_kg !== null &&
      calculateBMI(clientState.height_cm, clientState.weight_kg) > 40) ||
    hasQ11CAD()
  ) {
    updateBestPlan("Guaranteed+");
    return getQuestion("Q13");
  }

  if (answer) {
    // YES (complications) -> Guaranteed+ -> Q13
    updateBestPlan("Guaranteed+");
    return getQuestion("Q13");
  }
  // NO (no complications) -> Q12F1b (HbA1c >= 7.5%?)
  return getQuestion("Q12F1b");
}

/**
 * Rule for Q12F1b: Have you monitored your blood sugar levels in the last 3 months with an average HbA1c or A1C result of 7.5% or more?
 * @returns the next question on success
 * @returns null on error or out of questions
 */
export function apply_rule_Q12F1b(): QUESTION_TYPE | null {
  const answer = getQuestionAnswer("Q12F1b");
  if (typeof answer !== "boolean") {
    console.error("Q12F1b answer not found or invalid");
    return null;
  }

  if (answer) {
    // YES (HbA1c >= 7.5%) -> Deferred+ -> Q13
    updateBestPlan("Deferred+");
    return getQuestion("Q13");
  }
  // NO (HbA1c < 7.5%) -> Guaranteed+ -> Q13
  updateBestPlan("Guaranteed+");
  return getQuestion("Q13");
}

/**
 * Rule for Q12F2: If pregnant: Have you been diagnosed with Gestational Diabetes only?
 * @returns the next question on success
 * @returns null on error or out of questions
 */
export function apply_rule_Q12F2(): QUESTION_TYPE | null {
  const answer = getQuestionAnswer("Q12F2");
  if (typeof answer !== "boolean") {
    console.error("Q12F2 answer not found or invalid");
    return null;
  }

  if (answer) {
    // YES (gestational only) -> Q12F2a (HbA1c <= 7%?)
    return getQuestion("Q12F2a");
  }
  // NO (not gestational only) -> Q12F3 (on diabetes meds?)
  return getQuestion("Q12F3");
}

/**
 * Rule for Q12F2a: Is your Gestational Diabetes currently under good control with HbA1c or A1C result of 7.5% or less than or equal to 7%?
 * @returns the next question on success
 * @returns null on error or out of questions
 */
export function apply_rule_Q12F2a(): QUESTION_TYPE | null {
  const answer = getQuestionAnswer("Q12F2a");
  if (typeof answer !== "boolean") {
    console.error("Q12F2a answer not found or invalid");
    return null;
  }

  // Check BMI >40 OR Q11 (CAD) = YES -> Guaranteed+
  if (
    (clientState.height_cm !== null &&
      clientState.weight_kg !== null &&
      calculateBMI(clientState.height_cm, clientState.weight_kg) > 40) ||
    hasQ11CAD()
  ) {
    updateBestPlan("Guaranteed+");
    return getQuestion("Q13");
  }

  if (answer) {
    // YES (HbA1c <= 7%) -> Signature -> Q13
    updateBestPlan("Signature");
    return getQuestion("Q13");
  }
  // NO (HbA1c > 7%) -> Deferred+ -> Q13
  updateBestPlan("Deferred+");
  return getQuestion("Q13");
}

/**
 * Rule for Q12F3: Are you currently taking or have you been prescribed any medication to treat your diabetes?
 * @returns the next question on success
 * @returns null on error or out of questions
 */
export function apply_rule_Q12F3(): QUESTION_TYPE | null {
  const answer = getQuestionAnswer("Q12F3");
  if (typeof answer !== "boolean") {
    console.error("Q12F3 answer not found or invalid");
    return null;
  }

  if (answer) {
    // Check BMI >40 -> Guaranteed+
    if (
      clientState.height_cm !== null &&
      clientState.weight_kg !== null &&
      calculateBMI(clientState.height_cm, clientState.weight_kg) > 40
    ) {
      updateBestPlan("Guaranteed+");
      return getQuestion("Q13");
    }

    // YES (on meds) -> Check age 18-24 OR Q11 (CAD) = YES -> Deferred+
    if (
      (clientState.age !== null &&
        clientState.age >= 18 &&
        clientState.age <= 24) ||
      hasQ11CAD()
    ) {
      updateBestPlan("Deferred+");
      return getQuestion("Q13");
    }

    // Otherwise -> Q12F3a (HbA1c >= 7.5%?)
    return getQuestion("Q12F3a");
  }
  // NO (not on meds) -> Q13
  updateBestPlan("Day1+");
  return getQuestion("Q13");
}

/**
 * Rule for Q12F3a: Have you monitored your blood sugar levels in the last 3 months with an average HbA1c or A1C result of 7.5% or more?
 * @returns the next question on success
 * @returns null on error or out of questions
 */
export function apply_rule_Q12F3a(): QUESTION_TYPE | null {
  const answer = getQuestionAnswer("Q12F3a");
  if (typeof answer !== "boolean") {
    console.error("Q12F3a answer not found or invalid");
    return null;
  }

  if (!answer) {
    // NO (HbA1c < 7.5%) -> Day1+ -> Q13
    updateBestPlan("Deferred+");
    return getQuestion("Q13");
  }

  // YES (HbA1c >= 7.5%) -> Check BMI bands
  if (clientState.height_cm !== null && clientState.weight_kg !== null) {
    const bmi = calculateBMI(clientState.height_cm, clientState.weight_kg);
    if (bmi >= 38 && bmi <= 39) {
      // BMI 38-39.0 -> Deferred+ -> Q13
      updateBestPlan("Deferred+");
      return getQuestion("Q13");
    }
    if (bmi >= 36 && bmi < 38) {
      // BMI 36-37.9 -> Signature -> Q13
      updateBestPlan("Signature");
      return getQuestion("Q13");
    }
    if (bmi >= 18 && bmi < 36) {
      // BMI 18-36 -> Day1+ -> Q13
      updateBestPlan("Day1+");
      return getQuestion("Q13");
    }
  }
  // BMI not in range or not available -> Deferred+ -> Q13
  updateBestPlan("Deferred+");
  return getQuestion("Q13");
}

/**
 * Rule for Q12M: [Male] Have you ever been diagnosed with diabetes or pre-diabetes?
 * @returns the next question on success
 * @returns null on error or out of questions
 */
export function apply_rule_Q12M(): QUESTION_TYPE | null {
  const answer = getQuestionAnswer("Q12M");
  if (typeof answer !== "boolean") {
    console.error("Q12M answer not found or invalid");
    return null;
  }

  if (!answer) {
    // NO -> Day1 -> Q13
    updateBestPlan("Day1");
    return getQuestion("Q13");
  }
  // YES -> Q12M1 (Type 1 diabetes?)
  return getQuestion("Q12M1");
}

/**
 * Rule for Q12M1: Were you diagnosed with Diabetes type 1?
 * @returns the next question on success
 * @returns null on error or out of questions
 */
export function apply_rule_Q12M1(): QUESTION_TYPE | null {
  const answer = getQuestionAnswer("Q12M1");
  if (typeof answer !== "boolean") {
    console.error("Q12M1 answer not found or invalid");
    return null;
  }

  if (answer) {
    // YES (Type 1) -> Q12M1a (complications?)
    return getQuestion("Q12M1a");
  }
  // NO (Type 2/other) -> Q12M2 (on diabetes meds?)
  return getQuestion("Q12M2");
}

/**
 * Rule for Q12M1a: Have you ever had complications of your diabetes?
 * @returns the next question on success
 * @returns null on error or out of questions
 */
export function apply_rule_Q12M1a(): QUESTION_TYPE | null {
  const answer = getQuestionAnswer("Q12M1a");
  if (typeof answer !== "boolean") {
    console.error("Q12M1a answer not found or invalid");
    return null;
  }

  // Check BMI >40 OR Q11 (CAD) = YES -> Guaranteed+
  if (
    (clientState.height_cm !== null &&
      clientState.weight_kg !== null &&
      calculateBMI(clientState.height_cm, clientState.weight_kg) > 40) ||
    hasQ11CAD()
  ) {
    updateBestPlan("Guaranteed+");
    return getQuestion("Q13");
  }

  if (answer) {
    // YES (complications) -> Guaranteed+ -> Q13
    updateBestPlan("Guaranteed+");
    return getQuestion("Q13");
  }
  // NO (no complications) -> Q12M1b (HbA1c >= 7.5%?)
  return getQuestion("Q12M1b");
}

/**
 * Rule for Q12M1b: Have you monitored your blood sugar levels in the last 3 months with an average HbA1c or A1C result of 7.5% or more?
 * @returns the next question on success
 * @returns null on error or out of questions
 */
export function apply_rule_Q12M1b(): QUESTION_TYPE | null {
  const answer = getQuestionAnswer("Q12M1b");
  if (typeof answer !== "boolean") {
    console.error("Q12M1b answer not found or invalid");
    return null;
  }

  if (answer) {
    // YES (HbA1c >= 7.5%) -> Deferred+ -> Q13
    updateBestPlan("Deferred+");
    return getQuestion("Q13");
  }
  // NO (HbA1c < 7.5%) -> Guaranteed+ -> Q13
  updateBestPlan("Guaranteed+");
  return getQuestion("Q13");
}

/**
 * Rule for Q12M2: Are you currently taking or have you been prescribed any medication to treat your diabetes?
 * @returns the next question on success
 * @returns null on error or out of questions
 */
export function apply_rule_Q12M2(): QUESTION_TYPE | null {
  const answer = getQuestionAnswer("Q12M2");
  if (typeof answer !== "boolean") {
    console.error("Q12M2 answer not found or invalid");
    return null;
  }

  if (!answer) {
    // NO (not on meds) -> Day1+ -> Q13
    updateBestPlan("Day1+");
    return getQuestion("Q13");
  }

  // YES (on meds) -> Check age 18-24 OR Q11 (CAD) = YES -> Deferred+
  if (
    (clientState.age !== null &&
      clientState.age >= 18 &&
      clientState.age <= 24) ||
    hasQ11CAD()
  ) {
    updateBestPlan("Deferred+");
    return getQuestion("Q13");
  }

  // Check BMI >40 -> Guaranteed+
  if (
    clientState.height_cm !== null &&
    clientState.weight_kg !== null &&
    calculateBMI(clientState.height_cm, clientState.weight_kg) > 40
  ) {
    updateBestPlan("Guaranteed+");
    return getQuestion("Q13");
  }

  // Otherwise -> Q12M2b (HbA1c >= 7.5%?)
  return getQuestion("Q12M2b");
}

/**
 * Rule for Q12M2b: Have you monitored your blood sugar levels in the last 3 months with an average HbA1c or A1C result of 7.5% or more?
 * @returns the next question on success
 * @returns null on error or out of questions
 */
export function apply_rule_Q12M2b(): QUESTION_TYPE | null {
  const answer = getQuestionAnswer("Q12M2b");
  if (typeof answer !== "boolean") {
    console.error("Q12M2b answer not found or invalid");
    return null;
  }

  if (!answer) {
    // NO (HbA1c < 7.5%) -> Day1+ -> Q13
    updateBestPlan("Day1+");
    return getQuestion("Q13");
  }

  // YES (HbA1c >= 7.5%) -> Check BMI bands
  if (clientState.height_cm !== null && clientState.weight_kg !== null) {
    const bmi = calculateBMI(clientState.height_cm, clientState.weight_kg);
    if (bmi >= 38 && bmi <= 39) {
      // BMI 38-39.0 -> Deferred+ -> Q13
      updateBestPlan("Deferred+");
      return getQuestion("Q13");
    }
    if (bmi >= 36 && bmi < 38) {
      // BMI 36-37.9 -> Signature -> Q13
      updateBestPlan("Signature");
      return getQuestion("Q13");
    }
    if (bmi >= 18 && bmi < 36) {
      // BMI 18-36 -> Day1+ -> Q13
      updateBestPlan("Day1+");
      return getQuestion("Q13");
    }
  }
  // BMI not in range or not available -> Deferred+ -> Q13
  updateBestPlan("Deferred+");
  return getQuestion("Q13");
}
