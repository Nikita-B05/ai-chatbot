import type { PLANS } from "./question_definitions";

export type state = {
  age: number | null;
  gender: "MALE" | "FEMALE" | null;
  is_smoker: boolean | null;
  height_cm: number | null;
  weight_kg: number | null;
  answered_questions: string[];
  current_question_id: string | null;
  is_complete: boolean;
  best_plan: PLANS | "DENIAL";
  question_answers: Map<string, unknown>;
};

export function getInitialState(): state {
  return {
    age: null,
    gender: null,
    is_smoker: null,
    height_cm: null,
    weight_kg: null,
    answered_questions: [],
    current_question_id: "Q0",
    is_complete: false,
    best_plan: "Day1",
    question_answers: new Map(),
  };
}

export const clientState = getInitialState();
