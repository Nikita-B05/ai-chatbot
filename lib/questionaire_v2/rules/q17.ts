import {
  getQuestion,
  type QUESTION_TYPE,
  updateBestPlan,
} from "../question_definitions";
import { getQuestionAnswer } from "../state_manager";

/**
 * Rule for Q17: Neuro disorders (Alzheimer, seizures, motor neuron disease, dementia, autism, cerebral palsy, motor neuron syndrome, memory loss, Parkinson's disease)
 * @returns the next question on success
 * @returns null on error or out of questions
 */
export function apply_rule_Q17(): QUESTION_TYPE | null {
  const answer = getQuestionAnswer("Q17");
  if (typeof answer !== "boolean") {
    console.error("Q17 answer not found or invalid");
    return null;
  }

  if (!answer) {
    // NO -> Day1 -> Q18
    updateBestPlan("Day1");
    return getQuestion("Q18");
  }
  // YES -> Q17szOnly (only seizure/epilepsy?)
  return getQuestion("Q17szOnly");
}

/**
 * Rule for Q17szOnly: Were you diagnosed with only seizure or epilepsy disorder?
 * @returns the next question on success
 * @returns null on error or out of questions
 */
export function apply_rule_Q17szOnly(): QUESTION_TYPE | null {
  const answer = getQuestionAnswer("Q17szOnly");
  if (typeof answer !== "boolean") {
    console.error("Q17szOnly answer not found or invalid");
    return null;
  }

  if (!answer) {
    // We'll put the logic of this in Q18
    return getQuestion("Q18");
  }
  // YES (only seizure/epilepsy) -> Q17szCount (seizures in last 12 months?)
  return getQuestion("Q17szCount");
}

/**
 * Rule for Q17szCount: How many seizures have you had in the last 12 months?
 * @returns the next question on success
 * @returns null on error or out of questions
 */
export function apply_rule_Q17szCount(): QUESTION_TYPE | null {
  const answer = getQuestionAnswer("Q17szCount");
  if (typeof answer !== "number") {
    console.error("Q17szCount answer not found or invalid");
    return null;
  }

  const seizureCount = answer;

  if (seizureCount === 0) {
    // handled in Q18
    return getQuestion("Q18");
  }

  if (seizureCount >= 1 && seizureCount <= 3) {
    // 1-3 seizures -> Q17meds1 (more than 1 medication?)
    return getQuestion("Q17meds1");
  }

  if (seizureCount >= 4 && seizureCount <= 6) {
    // 4-6 seizures -> Q17meds2 (more than 1 medication?)
    return getQuestion("Q17meds2");
  }

  // 7+ seizures -> Guaranteed+ -> Q18
  updateBestPlan("Guaranteed+");
  return getQuestion("Q18");
}

/**
 * Rule for Q17meds1: Are you currently prescribed more than 1 medication? (for 1-3 seizures)
 * @returns the next question on success
 * @returns null on error or out of questions
 */
export function apply_rule_Q17meds1(): QUESTION_TYPE | null {
  const answer = getQuestionAnswer("Q17meds1");
  if (typeof answer !== "boolean") {
    console.error("Q17meds1 answer not found or invalid");
    return null;
  }

  if (!answer) {
    // NO (1 or fewer medications) -> Signature -> Q18
    updateBestPlan("Signature");
    return getQuestion("Q18");
  }
  // handled by Q18
  return getQuestion("Q18");
}

/**
 * Rule for Q17meds2: Are you currently prescribed more than 1 medication? (for 4-6 seizures)
 * @returns the next question on success
 * @returns null on error or out of questions
 */
export function apply_rule_Q17meds2(): QUESTION_TYPE | null {
  const answer = getQuestionAnswer("Q17meds2");
  if (typeof answer !== "boolean") {
    console.error("Q17meds2 answer not found or invalid");
    return null;
  }

  if (!answer) {
    // NO (1 or fewer medications) -> Deferred+ -> Q18
    updateBestPlan("Deferred+");
    return getQuestion("Q18");
  }
  // YES (more than 1 medication) -> Guaranteed+ -> Q18
  updateBestPlan("Guaranteed+");
  return getQuestion("Q18");
}
