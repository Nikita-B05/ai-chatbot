import {
  getQuestion,
  type QUESTION_TYPE,
  updateBestPlan,
} from "../question_definitions";
import { clientState } from "../state";
import { calculateBMI } from "./bmi_calculator";

/**
 * Returns the next question to ask based on prior state.
 * @returns the next question on success
 * @returns null on error or out of questions
 */
export function apply_rule_Q2(): QUESTION_TYPE | null {
  if (!clientState.weight_kg || !clientState.height_cm) {
    console.error("Client height and/or weight not set");
    return null;
  }

  const bmi = calculateBMI(clientState.height_cm, clientState.weight_kg);
  if (bmi <= 17) {
    updateBestPlan("Guaranteed+");
    return getQuestion("Q3");
  }
  if (bmi <= 38) {
    updateBestPlan("Day1");
    // Route based on gender: Q2Pregnancy for female, Q2WeightLoss for male
    if (clientState.gender === "FEMALE") {
      return getQuestion("Q2Pregnancy");
    }
    return getQuestion("Q2WeightLoss");
  }
  if (bmi <= 40) {
    updateBestPlan("Day1+");
    // Route based on gender: Q2Pregnancy for female, Q2WeightLoss for male
    if (clientState.gender === "FEMALE") {
      return getQuestion("Q2Pregnancy");
    }
    return getQuestion("Q2WeightLoss");
  }
  if (bmi <= 43) {
    updateBestPlan("Signature");
    // Route based on gender: Q2Pregnancy for female, Q2WeightLoss for male
    if (clientState.gender === "FEMALE") {
      return getQuestion("Q2Pregnancy");
    }
    return getQuestion("Q2WeightLoss");
  }
  if (bmi <= 44) {
    updateBestPlan("Deferred+");
    return getQuestion("Q3");
  }
  updateBestPlan("Guaranteed+");
  return getQuestion("Q3");
}
