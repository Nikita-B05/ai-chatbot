import {
  getQuestion,
  type QUESTION_TYPE,
  updateBestPlan,
} from "../question_definitions";
import { getQuestionAnswer } from "../state_manager";

/**
 * Rule for Q4: Consume alcohol?
 * @returns the next question on success
 * @returns null on error or out of questions
 */
export function apply_rule_Q4(): QUESTION_TYPE | null {
  const answer = getQuestionAnswer("Q4");
  if (typeof answer !== "boolean") {
    console.error("Q4 answer not found or invalid");
    return null;
  }

  if (!answer) {
    // NO -> Day1 -> Q5
    updateBestPlan("Day1");
    return getQuestion("Q5");
  }
  // YES -> Q4q (average drinks per week)
  return getQuestion("Q4q");
}

/**
 * Rule for Q4q: Average drinks per week
 * @returns the next question on success
 * @returns null on error or out of questions
 */
export function apply_rule_Q4q(): QUESTION_TYPE | null {
  const answer = getQuestionAnswer("Q4q");
  if (typeof answer !== "number") {
    console.error("Q4q answer not found or invalid");
    return null;
  }

  const drinksPerWeek = answer;

  if (drinksPerWeek < 14) {
    // < 14 -> Day1 -> Q5
    updateBestPlan("Day1");
    return getQuestion("Q5");
  }

  if (drinksPerWeek <= 20) {
    // 14-20 -> Day1+ -> Q5
    updateBestPlan("Day1+");
    return getQuestion("Q5");
  }

  if (drinksPerWeek <= 28) {
    // 21-28 -> Check combo with Q18
    // Note: Q18 is not be answered yet, so we'll check it when Q18 is answered
    return getQuestion("Q5");
  }

  // > 28 -> Guaranteed+ -> Q5
  updateBestPlan("Guaranteed+");
  return getQuestion("Q5");
}
