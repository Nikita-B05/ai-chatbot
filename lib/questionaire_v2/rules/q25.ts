import {
  getQuestion,
  type QUESTION_TYPE,
  updateBestPlan,
} from "../question_definitions";
import { clientState } from "../state";
import { getQuestionAnswer } from "../state_manager";

/**
 * Rule for Q25: Travel to high-risk country or conflict regions
 * @returns the next question on success
 * @returns null on error or out of questions
 */
export function apply_rule_Q25(): QUESTION_TYPE | null {
  const answer = getQuestionAnswer("Q25");
  if (typeof answer !== "boolean") {
    console.error("Q25 answer not found or invalid");
    return null;
  }

  if (answer) {
    // YES (travel to high-risk country/conflict regions) -> Guaranteed+ -> Q25res
    updateBestPlan("Guaranteed+");
    clientState.is_complete = true;
    return null;
  }

  // NO -> Q25res (residency outside Canada?)
  return getQuestion("Q25res");
}

/**
 * Rule for Q25res: Reside outside Canada for 6+ consecutive months
 * This is the final question in the questionnaire
 * @returns null (questionnaire complete)
 */
export function apply_rule_Q25res(): QUESTION_TYPE | null {
  const answer = getQuestionAnswer("Q25res");
  if (typeof answer !== "boolean") {
    console.error("Q25res answer not found or invalid");
    return null;
  }

  if (!answer) {
    // NO (not residing outside Canada) -> Day1 -> Complete
    updateBestPlan("Day1");
    clientState.is_complete = true;
    return null;
  }

  // YES (residing outside Canada for 6+ months) -> Day1+ -> Complete
  updateBestPlan("Day1+");
  clientState.is_complete = true;
  return null;
}
