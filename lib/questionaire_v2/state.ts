import { PLANS } from "./question_definitions";

export const clientState = getInitialState();

export type state = {
    age: number | null;
    gender: "MALE" | "FEMALE" | null;
    is_smoker: boolean | null;
    height_cm: number | null;
    weight_kg: number | null;
    answered_questions: string[];
    is_complete: boolean;
    best_plan: PLANS | "DENIAL";
    question_answers: Map<string, any>;
};

function getInitialState(): state {
    return {
        age: null,
        gender: null,
        is_smoker: null,
        height_cm: null,
        weight_kg: null,
        answered_questions: [],
        is_complete: false,
        best_plan: "Day1",
        question_answers: new Map(),
    }
}