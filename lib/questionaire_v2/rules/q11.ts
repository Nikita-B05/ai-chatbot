import {
  getQuestion,
  type QUESTION_TYPE,
  updateBestPlan,
} from "../question_definitions";
import { clientState } from "../state";
import { getQuestionAnswer } from "../state_manager";
import { calculateBMI } from "./bmi_calculator";

/**
 * Rule for Q11: Cardio/CVD
 * @returns the next question on success
 * @returns null on error or out of questions
 */
export function apply_rule_Q11(): QUESTION_TYPE | null {
  const answer = getQuestionAnswer("Q11");
  if (typeof answer !== "boolean") {
    console.error("Q11 answer not found or invalid");
    return null;
  }

  if (!answer) {
    // NO -> Day1 -> Q12F or Q12M (gender-based)
    updateBestPlan("Day1");
    return getNextQuestionByGender();
  }

  // YES -> Check BMI >= 44.0 -> DENIAL
  if (clientState.height_cm !== null && clientState.weight_kg !== null) {
    const bmi = calculateBMI(clientState.height_cm, clientState.weight_kg);
    if (bmi >= 44.0) {
      updateBestPlan("DENIAL");
      clientState.is_complete = true;
      return null;
    }
  }

  // BMI < 44.0 or BMI not available -> Q11stable
  return getQuestion("Q11stable");
}

/**
 * Rule for Q11stable: Are you currently free of symptoms, stable with regular follow-up with no pending surgery?
 * @returns the next question on success
 * @returns null on error or out of questions
 */
export function apply_rule_Q11stable(): QUESTION_TYPE | null {
  const answer = getQuestionAnswer("Q11stable");
  if (typeof answer !== "boolean") {
    console.error("Q11stable answer not found or invalid");
    return null;
  }

  if (!answer) {
    // NO (not stable) -> Check smoker
    if (clientState.is_smoker === true) {
      // Smoker -> Guaranteed+ -> Q12F/Q12M
      updateBestPlan("Guaranteed+");
      return getNextQuestionByGender();
    }
    // Non-smoker -> Deferred+ -> Q12F/Q12M
    updateBestPlan("Deferred+");
    return getNextQuestionByGender();
  }

  // YES (stable) -> Q11dx (years since diagnosis)
  return getQuestion("Q11dx");
}

/**
 * Rule for Q11dx: When were you diagnosed?
 * @returns the next question on success
 * @returns null on error or out of questions
 */
export function apply_rule_Q11dx(): QUESTION_TYPE | null {
  const answer = getQuestionAnswer("Q11dx");
  if (typeof answer !== "number") {
    console.error("Q11dx answer not found or invalid");
    return null;
  }

  const yearsSinceDiagnosis = answer;

  if (yearsSinceDiagnosis <= 3) {
    // <= 3 years -> Check age < 40 OR smoker
    if (
      (clientState.age !== null && clientState.age < 40) ||
      clientState.is_smoker === true
    ) {
      // Age < 40 or smoker -> Guaranteed+ -> Q12F/Q12M
      updateBestPlan("Guaranteed+");
      return getNextQuestionByGender();
    }
    // Otherwise -> Deferred+ -> Q12F/Q12M
    updateBestPlan("Deferred+");
    return getNextQuestionByGender();
  }

  // > 3 years -> Q11fu (last follow-up)
  return getQuestion("Q11fu");
}

/**
 * Rule for Q11fu: When was your last follow-up?
 * @returns the next question on success
 * @returns null on error or out of questions
 */
export function apply_rule_Q11fu(): QUESTION_TYPE | null {
  const answer = getQuestionAnswer("Q11fu");
  if (typeof answer !== "number") {
    console.error("Q11fu answer not found or invalid");
    return null;
  }

  const yearsSinceFollowUp = answer;

  if (yearsSinceFollowUp < 2) {
    // < 2 years ago -> Check BMI < 40
    if (clientState.height_cm !== null && clientState.weight_kg !== null) {
      const bmi = calculateBMI(clientState.height_cm, clientState.weight_kg);
      if (bmi < 40) {
        // BMI < 40 -> Signature -> Q12F/Q12M
        updateBestPlan("Signature");
        return getNextQuestionByGender();
      }
    }
    // BMI >= 40 or BMI not available -> Check age < 40 or smoker
    if (
      (clientState.age !== null && clientState.age < 40) ||
      clientState.is_smoker === true
    ) {
      // Age < 40 or smoker -> Deferred+ -> Q12F/Q12M
      updateBestPlan("Deferred+");
      return getNextQuestionByGender();
    }
    // Otherwise -> Guaranteed+ -> Q12F/Q12M
    updateBestPlan("Guaranteed+");
    return getNextQuestionByGender();
  }

  // >= 2 years ago -> Check BMI < 40
  if (clientState.height_cm !== null && clientState.weight_kg !== null) {
    const bmi = calculateBMI(clientState.height_cm, clientState.weight_kg);
    if (bmi < 40) {
      // BMI < 40 -> Check age < 40 or smoker
      if (
        (clientState.age !== null && clientState.age < 40) ||
        clientState.is_smoker === true
      ) {
        // Age < 40 or smoker -> Guaranteed+ -> Q12F/Q12M
        updateBestPlan("Guaranteed+");
        return getNextQuestionByGender();
      }
      // Otherwise -> Deferred+ -> Q12F/Q12M
      updateBestPlan("Deferred+");
      return getNextQuestionByGender();
    }
  }
  // BMI >= 40 or BMI not available -> Guaranteed+ -> Q12F/Q12M
  updateBestPlan("Guaranteed+");
  return getNextQuestionByGender();
}

/**
 * Helper function to get next question based on gender (Q12F for female, Q12M for male)
 * @returns Q12F if female, Q12M if male, or Q12F as default
 */
function getNextQuestionByGender(): QUESTION_TYPE | null {
  if (clientState.gender === "FEMALE") {
    return getQuestion("Q12F");
  }
  if (clientState.gender === "MALE") {
    return getQuestion("Q12M");
  }
  // Default to Q12F if gender not set
  console.error("No gender set");
  return getQuestion("Q12F");
}
