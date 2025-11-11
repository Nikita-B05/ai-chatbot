import type { state } from "./state";

/**
 * Converts a state object to a JSON-serializable format
 * Maps are converted to objects for database storage
 */
export function serializeState(stateObj: state): Record<string, unknown> {
  return {
    age: stateObj.age,
    gender: stateObj.gender,
    is_smoker: stateObj.is_smoker,
    height_cm: stateObj.height_cm,
    weight_kg: stateObj.weight_kg,
    answered_questions: stateObj.answered_questions,
    current_question_id: stateObj.current_question_id,
    is_complete: stateObj.is_complete,
    best_plan: stateObj.best_plan,
    question_answers: Object.fromEntries(stateObj.question_answers),
  };
}

/**
 * Converts a serialized state back to a state object
 * Objects are converted back to Maps
 */
export function deserializeState(serialized: Record<string, unknown>): state {
  return {
    age: (serialized.age as number | null) ?? null,
    gender: (serialized.gender as "MALE" | "FEMALE" | null) ?? null,
    is_smoker: (serialized.is_smoker as boolean | null) ?? null,
    height_cm: (serialized.height_cm as number | null) ?? null,
    weight_kg: (serialized.weight_kg as number | null) ?? null,
    answered_questions: (serialized.answered_questions as string[]) ?? [],
    current_question_id:
      (serialized.current_question_id as string | null) ?? null,
    is_complete: (serialized.is_complete as boolean) ?? false,
    best_plan: (serialized.best_plan as state["best_plan"]) ?? "Day1",
    question_answers: new Map(
      Object.entries(serialized.question_answers ?? {})
    ),
  };
}
