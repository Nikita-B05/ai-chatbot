import {
  getQuestion,
  type QUESTION_TYPE,
  updateBestPlan,
} from "../question_definitions";
import { clientState } from "../state";
import { getQuestionAnswer } from "../state_manager";

/**
 * Rule for Q5: Marijuana/Cannabis use?
 * @returns the next question on success
 * @returns null on error or out of questions
 */
export function apply_rule_Q5(): QUESTION_TYPE | null {
  const answer = getQuestionAnswer("Q5");
  if (typeof answer !== "boolean") {
    console.error("Q5 answer not found or invalid");
    return null;
  }

  if (!answer) {
    // NO -> Day1 -> Q6
    updateBestPlan("Day1");
    return getQuestion("Q6");
  }
  // YES -> Q5mix (mix with tobacco?)
  return getQuestion("Q5mix");
}

/**
 * Rule for Q5mix: Mix with tobacco?
 * @returns the next question on success
 * @returns null on error or out of questions
 */
export function apply_rule_Q5mix(): QUESTION_TYPE | null {
  const answer = getQuestionAnswer("Q5mix");
  if (typeof answer !== "boolean") {
    console.error("Q5mix answer not found or invalid");
    return null;
  }

  // Update smoker status based on mixing with tobacco
  if (answer) {
    // YES -> Set smoker rates if not already set
    if (clientState.is_smoker === null || !clientState.is_smoker) {
      clientState.is_smoker = true;
    }
  } else if (clientState.is_smoker === null) {
    // NO -> Confirm non-smoker rates (only if not already a smoker from Q1)
    clientState.is_smoker = false;
  }
  // If already a smoker from Q1, keep it as smoker

  // Both paths lead to Q5freq
  return getQuestion("Q5freq");
}

/**
 * Rule for Q5freq: Frequency per week?
 * @returns the next question on success
 * @returns null on error or out of questions
 */
export function apply_rule_Q5freq(): QUESTION_TYPE | null {
  const answer = getQuestionAnswer("Q5freq");
  if (typeof answer !== "number") {
    console.error("Q5freq answer not found or invalid");
    return null;
  }

  const frequencyPerWeek = answer;

  if (frequencyPerWeek >= 15) {
    // 15+ -> Guaranteed+ -> Q6
    updateBestPlan("Guaranteed+");
    return getQuestion("Q6");
  }

  if (frequencyPerWeek >= 8) {
    // 8-14 -> Check age
    return apply_rule_Q5freq_age("Deferred+", "Signature");
  }

  if (frequencyPerWeek >= 4) {
    // 4-7 -> Check age
    return apply_rule_Q5freq_age("Signature", "Day1+");
  }

  // 1-3 -> Check age
  return apply_rule_Q5freq_age("Day1+", "Day1");
}

/**
 * Helper function to apply age-based rules for Q5freq
 * @param planUnder25 Plan if age ≤ 25
 * @param planOver25 Plan if age ≥ 26
 * @returns the next question on success
 * @returns null on error or out of questions
 */
function apply_rule_Q5freq_age(
  planUnder25: "Deferred+" | "Signature" | "Day1+" | "Day1",
  planOver25: "Deferred+" | "Signature" | "Day1+" | "Day1"
): QUESTION_TYPE | null {
  if (clientState.age === null) {
    console.error("Age not set, cannot determine Q5freq plan");
    return getQuestion("Q6");
  }

  if (clientState.age <= 25) {
    // Age ≤ 25
    updateBestPlan(planUnder25);
    return getQuestion("Q6");
  }

  // Age ≥ 26
  updateBestPlan(planOver25);
  return getQuestion("Q6");
}
