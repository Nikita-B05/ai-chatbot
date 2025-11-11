import {
  getQuestion,
  type QUESTION_TYPE,
  updateBestPlan,
} from "../question_definitions";
import { clientState } from "../state";
import { getQuestionAnswer } from "../state_manager";
import { calculateBMI } from "./bmi_calculator";

/**
 * Helper function to check if Q12 (Diabetes) was answered YES
 * Q12 has gender-specific questions: Q12F (female) or Q12M (male)
 */
function hasQ12Diabetes(): boolean {
  const q12fAnswer = getQuestionAnswer("Q12F");
  const q12mAnswer = getQuestionAnswer("Q12M");

  const q12fYes = typeof q12fAnswer === "boolean" && q12fAnswer === true;
  const q12mYes = typeof q12mAnswer === "boolean" && q12mAnswer === true;

  return q12fYes || q12mYes;
}

/**
 * Helper function to check if Q16 (Genitourinary disorders) was answered YES
 * Q16 has gender-specific questions: Q16F (female) or Q16M (male)
 */
function hasQ16Genitourinary(): boolean {
  const q16fAnswer = getQuestionAnswer("Q16F");
  const q16mAnswer = getQuestionAnswer("Q16M");

  const q16fYes = typeof q16fAnswer === "boolean" && q16fAnswer === true;
  const q16mYes = typeof q16mAnswer === "boolean" && q16mAnswer === true;

  return q16fYes || q16mYes;
}

/**
 * Rule for Q22: Rheumatoid/psoriatic arthritis/spinal disc disease
 * @returns the next question on success
 * @returns null on error or out of questions
 */
export function apply_rule_Q22(): QUESTION_TYPE | null {
  const answer = getQuestionAnswer("Q22");
  if (typeof answer !== "boolean") {
    console.error("Q22 answer not found or invalid");
    return null;
  }

  if (!answer) {
    // NO -> Day1 -> Q23
    updateBestPlan("Day1");
    return getQuestion("Q23");
  }

  // YES -> Check if Q12 YES OR Q16 YES OR BMI >43 -> Guaranteed+
  const hasQ12 = hasQ12Diabetes();
  const hasQ16 = hasQ16Genitourinary();
  let bmiOver43 = false;

  if (clientState.height_cm !== null && clientState.weight_kg !== null) {
    const bmi = calculateBMI(clientState.height_cm, clientState.weight_kg);
    bmiOver43 = bmi > 43;
  }

  if (hasQ12 || hasQ16 || bmiOver43) {
    // Q12 YES OR Q16 YES OR BMI >43 -> Guaranteed+ -> Q23
    updateBestPlan("Guaranteed+");
    return getQuestion("Q23");
  }

  // Otherwise -> Q22dep (daily symptoms/surgery?)
  return getQuestion("Q22dep");
}

/**
 * Rule for Q22dep: Have you ever experienced daily symptoms such as loss of movement or disability, or have you ever undergone surgery to treat your condition?
 * @returns the next question on success
 * @returns null on error or out of questions
 */
export function apply_rule_Q22dep(): QUESTION_TYPE | null {
  const answer = getQuestionAnswer("Q22dep");
  if (typeof answer !== "boolean") {
    console.error("Q22dep answer not found or invalid");
    return null;
  }

  if (answer) {
    // YES (daily symptoms or surgery) -> Signature -> Q23
    updateBestPlan("Signature");
    return getQuestion("Q23");
  }

  // NO -> Q22meds (daily medications?)
  return getQuestion("Q22meds");
}

/**
 * Rule for Q22meds: Are you currently on any prescribed daily medication to control your symptoms?
 * @returns the next question on success
 * @returns null on error or out of questions
 */
export function apply_rule_Q22meds(): QUESTION_TYPE | null {
  const answer = getQuestionAnswer("Q22meds");
  if (typeof answer !== "boolean") {
    console.error("Q22meds answer not found or invalid");
    return null;
  }

  if (!answer) {
    // NO (no daily medications) -> Day1 -> Q23
    updateBestPlan("Day1");
    return getQuestion("Q23");
  }

  // YES (daily medications) -> Check age < 40 -> Signature, Otherwise Day1+
  if (clientState.age !== null && clientState.age < 40) {
    // Age < 40 -> Signature -> Q23
    updateBestPlan("Signature");
    return getQuestion("Q23");
  }

  // Age >= 40 or age not available -> Day1+ -> Q23
  updateBestPlan("Day1+");
  return getQuestion("Q23");
}
