import {
  getQuestion,
  type QUESTION_TYPE,
  updateBestPlan,
} from "../question_definitions";
import { getQuestionAnswer } from "../state_manager";

/**
 * Rule for Q24: Family history of specific conditions before age 65
 * @returns the next question on success
 * @returns null on error or out of questions
 */
export function apply_rule_Q24(): QUESTION_TYPE | null {
  const answer = getQuestionAnswer("Q24");
  if (typeof answer !== "boolean") {
    console.error("Q24 answer not found or invalid");
    return null;
  }

  if (answer) {
    // YES (family history of ALS, Cardiomyopathy, Hereditary non-polyposis colon cancer, Huntington's, Lynch syndrome, Muscular dystrophy, or Polycystic kidney disease before age 65) -> Deferred+ -> Q25
    updateBestPlan("Deferred+");
    return getQuestion("Q25");
  }

  // NO -> Q24two (2+ family members with other conditions before age 60?)
  return getQuestion("Q24two");
}

/**
 * Rule for Q24two: Before age 60, have 2 or more of your immediate family members been diagnosed with cancer, stroke, heart attack, angina, bypass, angioplasty, multiple sclerosis, motor neuron disease, Alzheimer's disease or dementia?
 * @returns the next question on success
 * @returns null on error or out of questions
 */
export function apply_rule_Q24two(): QUESTION_TYPE | null {
  const answer = getQuestionAnswer("Q24two");
  if (typeof answer !== "boolean") {
    console.error("Q24two answer not found or invalid");
    return null;
  }

  if (!answer) {
    // NO (less than 2 family members) -> Day1 -> Q25
    updateBestPlan("Day1");
    return getQuestion("Q25");
  }

  // YES (2+ family members) -> Q24under50 (1+ family members diagnosed before age 50?)
  return getQuestion("Q24under50");
}

/**
 * Rule for Q24under50: Before age 50, has 1 or more of your immediate family members been diagnosed with cancer, stroke, heart attack, angina, bypass, angioplasty, multiple sclerosis, motor neuron disease, Alzheimer's disease or dementia?
 * @returns the next question on success
 * @returns null on error or out of questions
 */
export function apply_rule_Q24under50(): QUESTION_TYPE | null {
  const answer = getQuestionAnswer("Q24under50");
  if (typeof answer !== "boolean") {
    console.error("Q24under50 answer not found or invalid");
    return null;
  }

  if (answer) {
    // YES (1+ family members diagnosed before age 50) -> Signature -> Q25
    updateBestPlan("Signature");
    return getQuestion("Q25");
  }

  // NO (no family members diagnosed before age 50) -> Day1+ -> Q25
  updateBestPlan("Day1+");
  return getQuestion("Q25");
}
