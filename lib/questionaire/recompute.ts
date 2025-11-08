import { PLAN_TIERS } from "./constants";
import { applyRuleResult, evaluateRules } from "./rules";
import { getBestEligiblePlan } from "./state";
import type { QuestionnaireClientState } from "./types";

/**
 * Recomputes eligibility, plan tiers, and decline status by replaying all stored answers.
 */
export function recomputeEligibility(
  state: QuestionnaireClientState
): QuestionnaireClientState {
  const baseline: QuestionnaireClientState = {
    ...state,
    eligiblePlans: [...PLAN_TIERS],
    declined: false,
    declineReason: undefined,
    followUpQueue: [],
    completed: false,
    completedAt: undefined,
    currentPlan: undefined,
    recommendedPlan: getBestEligiblePlan(PLAN_TIERS),
    planFloor: "Day1",
  };

  let recomputed = { ...baseline, questionsAnswered: [] as string[] };

  for (const questionId of state.questionsAnswered) {
    const answer =
      state.answers[questionId as keyof typeof state.answers];

    if (answer === undefined) {
      continue;
    }

    recomputed.questionsAnswered.push(questionId);

    const ruleResult = evaluateRules(recomputed, questionId, answer);
    recomputed = applyRuleResult(recomputed, ruleResult);

    if (recomputed.declined) {
      break;
    }
  }

  // Preserve the original sequences for downstream consumers
  recomputed.questionsAnswered = [...state.questionsAnswered];
  recomputed.questionsAsked = [...state.questionsAsked];

  const finalPlan = getBestEligiblePlan(recomputed.eligiblePlans);

  if (!recomputed.planFloor && finalPlan) {
    recomputed.planFloor = finalPlan;
  }

  if (recomputed.declined) {
    recomputed.currentPlan = "DECLINE";
    recomputed.recommendedPlan = "DECLINE";
  } else {
    recomputed.recommendedPlan = finalPlan;
    recomputed.currentPlan = recomputed.planFloor ?? finalPlan;
  }

  return recomputed;
}

