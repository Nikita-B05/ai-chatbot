import { QUESTION_TYPE, getQuestion, updateBestPlan } from "../question_definitions";
import { clientState } from "../state";

/** 
 * Returns the next question to ask based on prior state.
 * @returns the next question on success
 * @returns null on error or out of questions
*/
export function apply_rule_Q2() : QUESTION_TYPE | null {
    if (!clientState.weight_kg || !clientState.height_cm) {
        console.error("Client height and/or weight not set");
        return null;
    }

    const bmi = calculateBMI(clientState.height_cm, clientState.weight_kg);
    if (bmi <= 17) {
        updateBestPlan("Guaranteed+");
        return getQuestion("Q3");
    } else if (bmi <= 38) {
        updateBestPlan("Day1");
        return getQuestion("Q2b");
    } else if (bmi <= 40) {
        updateBestPlan("Day1+");
        return getQuestion("Q2b");
    } else if (bmi <= 43) {
        updateBestPlan("Signature");
        return getQuestion("Q2b");
    } else if (bmi <= 44) {
        updateBestPlan("Deferred+");
        return getQuestion("Q3");
    } else {
        updateBestPlan("Guaranteed+");
        return getQuestion("Q3");
    }
};

export function apply_rule_Q2b() : QUESTION_TYPE | null {
    return null;  // TODO
}

function calculateBMI(heightCm: number, weightKg: number): number {
  const heightM = heightCm / 100;
  const bmi = weightKg / (heightM * heightM);
  return parseFloat(bmi.toFixed(2));
}
