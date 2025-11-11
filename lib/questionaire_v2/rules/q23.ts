import {
  getQuestion,
  type QUESTION_TYPE,
  updateBestPlan,
} from "../question_definitions";
import { getQuestionAnswer } from "../state_manager";

/**
 * Rule for Q23: High-risk activities
 * @returns the next question on success
 * @returns null on error or out of questions
 */
export function apply_rule_Q23(): QUESTION_TYPE | null {
  const answer = getQuestionAnswer("Q23");
  if (typeof answer !== "boolean") {
    console.error("Q23 answer not found or invalid");
    return null;
  }

  if (!answer) {
    // NO -> Day1 -> Q24
    updateBestPlan("Day1");
    return getQuestion("Q24");
  }

  // YES -> Q23hi (highest risk activities?)
  return getQuestion("Q23hi");
}

/**
 * Rule for Q23hi: Highest risk activities (free solo mountain climbing, international peaks or peaks > 6,000 meters, >= YDS 5.11, NCCS grade VI, kayak jumping, motor racing with maximum speed above 240 km/h, any solo/night/cave, or wreck scuba diving)
 * @returns the next question on success
 * @returns null on error or out of questions
 */
export function apply_rule_Q23hi(): QUESTION_TYPE | null {
  const answer = getQuestionAnswer("Q23hi");
  if (typeof answer !== "boolean") {
    console.error("Q23hi answer not found or invalid");
    return null;
  }

  if (answer) {
    // YES (highest risk activities) -> Guaranteed+ -> Q24
    updateBestPlan("Guaranteed+");
    return getQuestion("Q24");
  }

  // NO -> Q23mid (medium risk activities?)
  return getQuestion("Q23mid");
}

/**
 * Rule for Q23mid: Medium risk activities (ice or glacier climbing, mountain climbing above 4000 meters, YDS 5.8 or NCCS grade V, bungee paragliding, hang gliding, or scuba diving above 45 meters)
 * @returns the next question on success
 * @returns null on error or out of questions
 */
export function apply_rule_Q23mid(): QUESTION_TYPE | null {
  const answer = getQuestionAnswer("Q23mid");
  if (typeof answer !== "boolean") {
    console.error("Q23mid answer not found or invalid");
    return null;
  }

  if (answer) {
    // YES (medium risk activities) -> Signature -> Q24
    updateBestPlan("Signature");
    return getQuestion("Q24");
  }

  // NO -> Day1+ -> Q24
  updateBestPlan("Day1+");
  return getQuestion("Q24");
}
