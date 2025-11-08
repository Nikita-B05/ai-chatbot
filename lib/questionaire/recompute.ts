import type { QuestionnaireClientState } from "./types";
import {
  filterPlansByMinimumTier,
  updateRecommendedPlan,
} from "./state";

/**
 * Recomputes eligibility and plan recommendations based on current state.
 * This ensures that eligiblePlans, recommendedPlan, and planFloor are consistent
 * after any state updates.
 */
export function recomputeEligibility(
  state: QuestionnaireClientState
): QuestionnaireClientState {
  // If declined, no need to recompute
  if (state.declined) {
    return state;
  }

  let newState = { ...state };

  // Filter eligible plans by plan floor if it exists
  // This ensures eligible plans never include plans better than the floor
  if (newState.planFloor && newState.planFloor !== "DECLINE") {
    newState.eligiblePlans = filterPlansByMinimumTier(
      newState.eligiblePlans,
      newState.planFloor
    );
  }

  // Update recommended plan based on filtered eligible plans
  return updateRecommendedPlan(newState);
}

