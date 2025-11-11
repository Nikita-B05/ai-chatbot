import {
  getQuestion,
  type QUESTION_TYPE,
  updateBestPlan,
} from "../question_definitions";
import { clientState } from "../state";
import { getQuestionAnswer } from "../state_manager";

/**
 * Helper function to check if Q18 resulted in Signature or better plan
 * Q18 can result in Signature if Q18meds was answered NO (< 3 medications)
 * Plan priorities (lower = better): DENIAL=0, Deferred+=1, Guaranteed+=2, Day1=3, Day1+=4, Signature=5
 * ">Signature" means a plan with priority < 5 (i.e., Signature, Deferred+, or Guaranteed+)
 */
function hasQ18SignatureOrBetter(): boolean {
  const q18medsAnswer = getQuestionAnswer("Q18meds");

  // Q18meds NO (< 3 medications) results in Signature
  if (typeof q18medsAnswer === "boolean" && !q18medsAnswer) {
    return true;
  }

  // Check if current best_plan is Signature or better (higher priority, lower number)
  // Plan priorities: DENIAL=0, Deferred+=1, Guaranteed+=2, Day1=3, Day1+=4, Signature=5
  const planPriority: Record<string, number> = {
    DENIAL: 0,
    "Deferred+": 1,
    "Guaranteed+": 2,
    Day1: 3,
    "Day1+": 4,
    Signature: 5,
  };

  const currentPriority = planPriority[clientState.best_plan] ?? 3;
  const signaturePriority = planPriority.Signature;

  // Return true if current plan is Signature or more restrictive (priority <= Signature, but not Day1 or Day1+)
  // ">Signature" means Signature or a more restrictive plan: Signature (5), Deferred+ (1), or Guaranteed+ (2)
  return currentPriority <= signaturePriority && currentPriority < 3;
}

/**
 * Rule for Q21: Neuro-motor/MS disorders
 * @returns the next question on success
 * @returns null on error or out of questions
 */
export function apply_rule_Q21(): QUESTION_TYPE | null {
  const answer = getQuestionAnswer("Q21");
  if (typeof answer !== "boolean") {
    console.error("Q21 answer not found or invalid");
    return null;
  }

  if (!answer) {
    // NO -> Day1 -> Q22
    updateBestPlan("Day1");
    return getQuestion("Q22");
  }

  // YES -> Q21prog (progressive MS with loss of bowel/bladder function?)
  return getQuestion("Q21prog");
}

/**
 * Rule for Q21prog: In the last 2 years, were you diagnosed with multiple sclerosis, progressive pattern with loss of bowel, or bladder function?
 * @returns the next question on success
 * @returns null on error or out of questions
 */
export function apply_rule_Q21prog(): QUESTION_TYPE | null {
  const answer = getQuestionAnswer("Q21prog");
  if (typeof answer !== "boolean") {
    console.error("Q21prog answer not found or invalid");
    return null;
  }

  if (answer) {
    // YES (progressive MS with loss of bowel/bladder function) -> Guaranteed+ -> Q22
    updateBestPlan("Guaranteed+");
    return getQuestion("Q22");
  }

  // NO -> Check age >40 OR Q18 Signature or better -> Guaranteed+, Otherwise Q21amb
  if (
    (clientState.age !== null && clientState.age > 40) ||
    hasQ18SignatureOrBetter()
  ) {
    // Age >40 OR Q18 Signature or better -> Guaranteed+ -> Q22
    updateBestPlan("Guaranteed+");
    return getQuestion("Q22");
  }

  // Otherwise -> Q21amb (ambulatory/disability issues?)
  return getQuestion("Q21amb");
}

/**
 * Rule for Q21amb: Do you currently have ambulatory or disability issues, or have you had more than 2 attacks in the last 12 months?
 * @returns the next question on success
 * @returns null on error or out of questions
 */
export function apply_rule_Q21amb(): QUESTION_TYPE | null {
  const answer = getQuestionAnswer("Q21amb");
  if (typeof answer !== "boolean") {
    console.error("Q21amb answer not found or invalid");
    return null;
  }

  if (answer) {
    // YES (ambulatory/disability issues or >2 attacks) -> Deferred+ -> Q22
    updateBestPlan("Deferred+");
    return getQuestion("Q22");
  }

  // NO -> Signature -> Q22
  updateBestPlan("Signature");
  return getQuestion("Q22");
}
