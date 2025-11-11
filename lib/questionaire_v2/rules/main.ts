import { QUESTION_TYPE } from "../question_definitions";
import { apply_rule_Q1 } from "./q1";
import { apply_rule_Q2 } from "./q2";

/** 
 * Updates clientState and returns the next question given the current question.
 * @param question the current question
 * @returns the next question on success
 * @returns null on error or out of questions
*/
export function apply_rule(question: QUESTION_TYPE) : QUESTION_TYPE | null {
    switch (question.id) {
        case "Q1": 
            return apply_rule_Q1();
        case "Q2": 
            return apply_rule_Q2();
        default:
            console.error("Invalid question id");
            return null;
    }
}
