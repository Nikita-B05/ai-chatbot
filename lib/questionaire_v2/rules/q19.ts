import {
  getQuestion,
  type QUESTION_TYPE,
  updateBestPlan,
} from "../question_definitions";
import { clientState } from "../state";
import { getQuestionAnswer } from "../state_manager";
import { calculateBMI } from "./bmi_calculator";

/**
 * Rule for Q19: GI/hepatic/pancreas disorders
 * @returns the next question on success
 * @returns null on error or out of questions
 */
export function apply_rule_Q19(): QUESTION_TYPE | null {
  const answer = getQuestionAnswer("Q19");
  if (typeof answer !== "boolean") {
    console.error("Q19 answer not found or invalid");
    return null;
  }

  if (!answer) {
    // NO -> Day1 -> Q20
    updateBestPlan("Day1");
    return getQuestion("Q20");
  }

  // YES -> Check BMI < 18 -> Guaranteed+
  if (clientState.height_cm !== null && clientState.weight_kg !== null) {
    const bmi = calculateBMI(clientState.height_cm, clientState.weight_kg);
    if (bmi < 18) {
      updateBestPlan("Guaranteed+");
      return getQuestion("Q20");
    }
  }

  // Otherwise -> Q19IBD (Were you diagnosed with diverticulitis, Crohn's disease, or ulcerative colitis more than 12 months ago?)
  return getQuestion("Q19IBD");
}

/**
 * Rule for Q19IBD: Were you diagnosed with diverticulitis, Crohn's disease, or ulcerative colitis more than 12 months ago?
 * @returns the next question on success
 * @returns null on error or out of questions
 */
export function apply_rule_Q19IBD(): QUESTION_TYPE | null {
  const answer = getQuestionAnswer("Q19IBD");
  if (typeof answer !== "boolean") {
    console.error("Q19IBD answer not found or invalid");
    return null;
  }

  if (!answer) {
    // NO (diagnosed <= 12 months ago) -> Deferred+ -> Q20
    updateBestPlan("Deferred+");
    return getQuestion("Q20");
  }

  // YES (diagnosed > 12 months ago) -> Q19fu (routine medical follow-up?)
  return getQuestion("Q19fu");
}

/**
 * Rule for Q19fu: Have you had a routine medical follow-up or surveillance in the past 2 years?
 * @returns the next question on success
 * @returns null on error or out of questions
 */
export function apply_rule_Q19fu(): QUESTION_TYPE | null {
  const answer = getQuestionAnswer("Q19fu");
  if (typeof answer !== "boolean") {
    console.error("Q19fu answer not found or invalid");
    return null;
  }

  if (!answer) {
    // NO (no follow-up in past 2 years) -> Deferred+ -> Q20
    updateBestPlan("Deferred+");
    return getQuestion("Q20");
  }

  // YES (had follow-up) -> Q19sev (severe symptoms?)
  return getQuestion("Q19sev");
}

/**
 * Rule for Q19sev: Have you had 2 surgeries or more within the last 5 years, missed any time off work/school in the last 2 years, been hospitalized within the last 2 years, or had a flare within the last 12 months?
 * @returns the next question on success
 * @returns null on error or out of questions
 */
export function apply_rule_Q19sev(): QUESTION_TYPE | null {
  const answer = getQuestionAnswer("Q19sev");
  if (typeof answer !== "boolean") {
    console.error("Q19sev answer not found or invalid");
    return null;
  }

  if (answer) {
    // YES (severe symptoms) -> Signature -> Q20
    updateBestPlan("Signature");
    return getQuestion("Q20");
  }

  // NO (no severe symptoms) -> Check BMI 18-20 -> Signature, Otherwise Day1+
  if (clientState.height_cm !== null && clientState.weight_kg !== null) {
    const bmi = calculateBMI(clientState.height_cm, clientState.weight_kg);
    if (bmi >= 18 && bmi <= 20) {
      // BMI 18-20 -> Signature -> Q20
      updateBestPlan("Signature");
      return getQuestion("Q20");
    }
  }

  // BMI not in range or not available -> Day1+ -> Q20
  updateBestPlan("Day1+");
  return getQuestion("Q20");
}
