import { QUESTION_TYPE } from "./question_definitions";

/** 
 * Updates clientState and returns the next question given the current question id and its answer.
 * @param question the current question id
 * @param answer the answer to the question
 * @returns the next question 
*/
export function apply_rule(question: QUESTION_TYPE, answer: any) : QUESTION_TYPE | null {
    switch (question.id) {
        case "Q1": 
            return apply_rule_q1(question, answer);
        default:
            console.error("Invalid question id");
            return null
    }
}