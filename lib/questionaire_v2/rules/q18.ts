import {
  getQuestion,
  type QUESTION_TYPE,
  updateBestPlan,
} from "../question_definitions";
import { clientState } from "../state";
import { getQuestionAnswer } from "../state_manager";

/**
 * Helper function to check Q6 combination rule:
 * "Question 6 answered Yes but no to #8 or alcohol quantity 21 and over"
 */
function checkQ6CombinationRule(): boolean {
  const q6Answer = getQuestionAnswer("Q6");
  const q8Answer = getQuestionAnswer("Q8");
  const q4qAnswer = getQuestionAnswer("Q4q");

  // Q6 must be YES
  if (typeof q6Answer !== "boolean" || !q6Answer) {
    return false;
  }

  // Check "no to Q8" OR "alcohol quantity 21 and over"
  const noQ8 = typeof q8Answer === "boolean" && !q8Answer;
  const alcohol21Plus = typeof q4qAnswer === "number" && q4qAnswer >= 21;

  return noQ8 || alcohol21Plus;
}

/**
 * Helper function to check if Q8 answered yes OR alcohol quantity 21 and over
 */
function checkQ8OrAlcohol21Plus(): boolean {
  const q8Answer = getQuestionAnswer("Q8");
  const q4qAnswer = getQuestionAnswer("Q4q");

  const q8Yes = typeof q8Answer === "boolean" && q8Answer === true;
  const alcohol21Plus = typeof q4qAnswer === "number" && q4qAnswer >= 21;

  return q8Yes || alcohol21Plus;
}

/**
 * Re-evaluate Q17 deferred logic based on Q18 answer
 */
function reEvaluateQ17Logic(): void {
  const q17szOnlyAnswer = getQuestionAnswer("Q17szOnly");
  const q17szCountAnswer = getQuestionAnswer("Q17szCount");
  const q17meds1Answer = getQuestionAnswer("Q17meds1");
  const q18Answer = getQuestionAnswer("Q18");

  const hasQ18Severe = typeof q18Answer === "boolean" && q18Answer === true;

  // Q17szOnly: NO (not only seizure/epilepsy) -> Check if Q18 = YES -> Guaranteed+, Otherwise Deferred+
  if (
    typeof q17szOnlyAnswer === "boolean" &&
    !q17szOnlyAnswer &&
    hasQ18Severe
  ) {
    updateBestPlan("Guaranteed+");
    return;
  }
  if (
    typeof q17szOnlyAnswer === "boolean" &&
    !q17szOnlyAnswer &&
    !hasQ18Severe
  ) {
    updateBestPlan("Deferred+");
    return;
  }

  // Q17szCount: 0 seizures -> Check if Q18 = YES -> Signature, Otherwise Day1+
  if (
    typeof q17szCountAnswer === "number" &&
    q17szCountAnswer === 0 &&
    hasQ18Severe
  ) {
    updateBestPlan("Signature");
    return;
  }
  if (
    typeof q17szCountAnswer === "number" &&
    q17szCountAnswer === 0 &&
    !hasQ18Severe
  ) {
    updateBestPlan("Day1+");
    return;
  }

  // Q17meds1: YES (more than 1 medication) -> Check if Q18 = YES -> Guaranteed+, Otherwise Deferred+
  if (typeof q17meds1Answer === "boolean" && q17meds1Answer && hasQ18Severe) {
    updateBestPlan("Guaranteed+");
    return;
  }
  if (typeof q17meds1Answer === "boolean" && q17meds1Answer && !hasQ18Severe) {
    updateBestPlan("Deferred+");
    return;
  }
}

/**
 * Re-evaluate Q4 deferred logic (21-28 drinks/week)
 */
function reEvaluateQ4Logic(): void {
  const q4qAnswer = getQuestionAnswer("Q4q");
  const q18Answer = getQuestionAnswer("Q18");
  const q18modAnswer = getQuestionAnswer("Q18mod");

  // Only process if Q4q is 21-28 drinks/week
  if (typeof q4qAnswer !== "number" || q4qAnswer < 21 || q4qAnswer > 28) {
    return;
  }

  const hasQ18Severe = typeof q18Answer === "boolean" && q18Answer === true;
  const hasQ18Moderate =
    typeof q18modAnswer === "boolean" && q18modAnswer === true;

  if (hasQ18Severe) {
    // Q18 severe -> Guaranteed+
    updateBestPlan("Guaranteed+");
    return;
  }

  if (hasQ18Moderate) {
    // Q18 moderate -> Deferred+
    updateBestPlan("Deferred+");
    return;
  }

  // No Q18 -> Signature
  updateBestPlan("Signature");
}

/**
 * Re-evaluate Q6 deferred logic (1-2 years, 2-5 years, Q6ecstasy NO)
 * @returns true if DENIAL was set, false otherwise
 */
function reEvaluateQ6Logic(): boolean {
  const q6whenAnswer = getQuestionAnswer("Q6when");
  const q6ecstasyAnswer = getQuestionAnswer("Q6ecstasy");
  const q18Answer = getQuestionAnswer("Q18");
  const q18modAnswer = getQuestionAnswer("Q18mod");

  const hasQ18Severe = typeof q18Answer === "boolean" && q18Answer === true;
  const hasQ18Moderate =
    typeof q18modAnswer === "boolean" && q18modAnswer === true;
  const hasMentalHealth = hasQ18Severe || hasQ18Moderate;
  const alcohol21Plus = checkQ8OrAlcohol21Plus();

  // Q6when: 1-2 years
  if (
    typeof q6whenAnswer === "number" &&
    q6whenAnswer >= 1 &&
    q6whenAnswer < 2
  ) {
    if (hasMentalHealth || alcohol21Plus) {
      // DENIAL
      updateBestPlan("DENIAL");
      clientState.is_complete = true;
      return true;
    }
    // Otherwise Guaranteed+
    updateBestPlan("Guaranteed+");
    return false;
  }

  // Q6when: 2-5 years
  if (
    typeof q6whenAnswer === "number" &&
    q6whenAnswer >= 2 &&
    q6whenAnswer < 5
  ) {
    if (hasMentalHealth || alcohol21Plus) {
      // Deferred+
      updateBestPlan("Deferred+");
      return false;
    }
    // Otherwise Signature
    updateBestPlan("Signature");
    return false;
  }

  // Q6ecstasy: NO (not only Ecstasy/Speed/Hallucinogens)
  if (
    typeof q6ecstasyAnswer === "boolean" &&
    !q6ecstasyAnswer &&
    checkQ6CombinationRule() &&
    (hasQ18Severe || checkQ8OrAlcohol21Plus())
  ) {
    // Guaranteed+
    updateBestPlan("Guaranteed+");
    return false;
  }

  return false;
}

/**
 * Re-evaluate Q8 deferred logic (Q8count NO)
 */
function reEvaluateQ8Logic(): void {
  const q8countAnswer = getQuestionAnswer("Q8count");
  const q18Answer = getQuestionAnswer("Q18");
  const q18modAnswer = getQuestionAnswer("Q18mod");

  // Only process if Q8count is NO (< 2 DUIs)
  if (typeof q8countAnswer !== "boolean" || q8countAnswer) {
    return;
  }

  const hasQ18Severe = typeof q18Answer === "boolean" && q18Answer === true;
  const hasQ18Moderate =
    typeof q18modAnswer === "boolean" && q18modAnswer === true;

  // Q8count NO with Q18 severe or moderate -> Check combo rules
  if ((hasQ18Severe || hasQ18Moderate) && checkQ8OrAlcohol21Plus()) {
    if (hasQ18Severe) {
      updateBestPlan("Guaranteed+");
    } else {
      // Q18 moderate
      updateBestPlan("Deferred+");
    }
    return;
  }
}

/**
 * Rule for Q18: Severe mental health disorder
 * @returns the next question on success
 * @returns null on error or out of questions
 */
export function apply_rule_Q18(): QUESTION_TYPE | null {
  const answer = getQuestionAnswer("Q18");
  if (typeof answer !== "boolean") {
    console.error("Q18 answer not found or invalid");
    return null;
  }

  // First, check combo rules that override everything
  // CHECK If Question 6 answered Yes but no to #8 or alcohol quantity 21 and over - combination rule in question 6 applies.
  // If Question 8 answered yes or alcohol quantity 21 and over > Guaranteed+
  if (checkQ6CombinationRule() || checkQ8OrAlcohol21Plus()) {
    updateBestPlan("Guaranteed+");
    // Still need to ask Q18meds if severe, or Q18mod if not severe
    if (answer) {
      return getQuestion("Q18meds");
    }
    return getQuestion("Q18mod");
  }

  // Re-evaluate deferred logic from Q17, Q4, Q6, Q8
  reEvaluateQ17Logic();
  reEvaluateQ4Logic();
  const q6Denial = reEvaluateQ6Logic();
  if (q6Denial) {
    // Q6 logic resulted in DENIAL
    return null;
  }
  reEvaluateQ8Logic();

  if (answer) {
    // YES (severe) -> Q18meds (3 or more medications?)
    return getQuestion("Q18meds");
  }
  // NO (not severe) -> Q18mod (moderate mental health?)
  return getQuestion("Q18mod");
}

/**
 * Rule for Q18meds: Are you currently prescribed 3 or more medications to control your symptoms?
 * @returns the next question on success
 * @returns null on error or out of questions
 */
export function apply_rule_Q18meds(): QUESTION_TYPE | null {
  const answer = getQuestionAnswer("Q18meds");
  if (typeof answer !== "boolean") {
    console.error("Q18meds answer not found or invalid");
    return null;
  }

  // Re-check combo rules in case they weren't set before
  if (checkQ6CombinationRule() || checkQ8OrAlcohol21Plus()) {
    updateBestPlan("Guaranteed+");
    return getQuestion("Q19");
  }

  if (answer) {
    // YES (3+ medications) -> Deferred+ -> Q19
    updateBestPlan("Deferred+");
    return getQuestion("Q19");
  }
  // NO (< 3 medications) -> Signature -> Q19
  updateBestPlan("Signature");
  return getQuestion("Q19");
}

/**
 * Rule for Q18mod: Moderate mental health disorder
 * @returns the next question on success
 * @returns null on error or out of questions
 */
export function apply_rule_Q18mod(): QUESTION_TYPE | null {
  const answer = getQuestionAnswer("Q18mod");
  if (typeof answer !== "boolean") {
    console.error("Q18mod answer not found or invalid");
    return null;
  }

  if (!answer) {
    // NO (not moderate) -> Day1 -> Q19
    updateBestPlan("Day1");
    return getQuestion("Q19");
  }

  // YES (moderate) -> Re-evaluate Q6 logic now that we know there's moderate mental health
  const q6Denial = reEvaluateQ6Logic();
  if (q6Denial) {
    // Q6 logic resulted in DENIAL
    return null;
  }

  // Check combo rules
  // CHECK if Question 6 answered Yes but no to #8 or alcohol quantity 21 and over - combination rule in question 6 applies.
  // If Question 8 answered yes or alcohol quantity 21 and over > Deferred+
  if (checkQ6CombinationRule() || checkQ8OrAlcohol21Plus()) {
    updateBestPlan("Deferred+");
    return getQuestion("Q19");
  }

  // Otherwise -> Day1+ -> Q19
  updateBestPlan("Day1+");
  return getQuestion("Q19");
}
