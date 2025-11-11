import { getQuestion, type QUESTION_TYPE } from "../question_definitions";

/**
 * Returns the next question to ask based on prior state.
 * @returns the next question on success
 * @returns null on error or out of questions
 */
export function apply_rule_Q1(): QUESTION_TYPE | null {
  return getQuestion("Q2");
}
