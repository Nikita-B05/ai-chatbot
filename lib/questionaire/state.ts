import {
  MANDATORY_QUESTIONS,
  PLAN_PRIORITY,
  PLAN_TIERS,
  QUESTION_DEPENDENCIES,
  QUESTION_ORDER,
  QUESTION_WORST_OUTCOME,
} from "./constants";
import type { PlanOutcome, PlanTier, QuestionnaireClientState } from "./types";

/**
 * Creates an initial empty questionnaire state
 */
export function createInitialState(): QuestionnaireClientState {
  return {
    answers: {},
    eligiblePlans: [...PLAN_TIERS],
    recommendedPlan: getBestEligiblePlan(PLAN_TIERS),
    planFloor: "Day1",
    declined: false,
    questionsAsked: [],
    questionsAnswered: [],
    followUpQueue: [],
    completed: false,
    startedAt: new Date().toISOString(),
  };
}

/**
 * Calculates BMI from height (cm) and weight (kg)
 */
export function calculateBMI(height: number, weight: number): number {
  // Height in cm, weight in kg
  const heightInMeters = height / 100;
  return Number((weight / (heightInMeters * heightInMeters)).toFixed(1));
}

/**
 * Gets the best (highest quality) eligible plan from the list
 */
export function getBestEligiblePlan(
  eligiblePlans: PlanTier[]
): PlanTier | undefined {
  if (eligiblePlans.length === 0) {
    return;
  }

  return eligiblePlans.reduce((best, current) => {
    return PLAN_PRIORITY[current] < PLAN_PRIORITY[best] ? current : best;
  });
}

/**
 * Filters eligible plans to only include those at or above the minimum tier
 */
export function filterPlansByMinimumTier(
  eligiblePlans: PlanTier[],
  minimumTier: PlanTier
): PlanTier[] {
  const minimumPriority = PLAN_PRIORITY[minimumTier];
  return eligiblePlans.filter((plan) => PLAN_PRIORITY[plan] >= minimumPriority);
}

/**
 * Removes a specific plan from the eligible plans list
 */
export function removePlan(
  eligiblePlans: PlanTier[],
  planToRemove: PlanTier
): PlanTier[] {
  return eligiblePlans.filter((plan) => plan !== planToRemove);
}

/**
 * Returns the worst-case plan outcome a question can trigger.
 */
export function getQuestionPlanImpact(questionId: string): PlanOutcome | null {
  return QUESTION_WORST_OUTCOME[questionId] ?? null;
}

function getEffectiveBaselinePlan(
  state: QuestionnaireClientState
): PlanOutcome | undefined {
  if (state.planFloor) {
    return state.planFloor;
  }

  if (state.declined) {
    return "DECLINE";
  }

  const bestPlan = getBestEligiblePlan(state.eligiblePlans);
  if (bestPlan) {
    return bestPlan;
  }

  return state.recommendedPlan;
}

/**
 * Returns true if a question can still worsen the client's current best plan.
 */
export function isQuestionPlanRelevant(
  questionId: string,
  state: QuestionnaireClientState
): boolean {
  if (MANDATORY_QUESTIONS.includes(questionId as any)) {
    return true;
  }

  if (state.declined) {
    return false;
  }

  const impact = QUESTION_WORST_OUTCOME[questionId];

  // If we lack metadata, err on the side of asking
  if (impact === undefined) {
    return true;
  }

  // Explicitly marked as no impact
  if (impact === null) {
    return false;
  }

  const baselinePlan = getEffectiveBaselinePlan(state);

  if (!baselinePlan) {
    return true;
  }

  if (baselinePlan === "DECLINE") {
    return false;
  }

  if (baselinePlan === "Guaranteed+") {
    return impact === "DECLINE";
  }

  if (impact === "DECLINE") {
    return true;
  }

  const baselinePriority = PLAN_PRIORITY[baselinePlan];
  const impactPriority = PLAN_PRIORITY[impact];

  return impactPriority > baselinePriority;
}

/**
 * Updates the state with a new answer to a question
 */
export function updateStateWithAnswer(
  state: QuestionnaireClientState,
  questionId: string,
  answer: any
): QuestionnaireClientState {
  const { currentQuestion: _, ...stateWithoutCurrentQuestion } = state;
  const filteredQueue = state.followUpQueue.filter(
    (queuedId) => queuedId !== questionId
  );

  return {
    ...stateWithoutCurrentQuestion,
    answers: {
      ...state.answers,
      [questionId]: answer,
    },
    questionsAnswered: [...new Set([...state.questionsAnswered, questionId])],
    followUpQueue: filteredQueue,
  };
}

/**
 * Gets all available questions that can be asked based on dependencies
 * This is used by the LLM to determine which questions are available
 */
export function getAvailableQuestions(
  state: QuestionnaireClientState
): string[] {
  if (state.declined) {
    return [];
  }

  const available: string[] = [];
  const answered = new Set(state.questionsAnswered);
  const seen = new Set<string>();

  // Check mandatory questions first
  for (const q of MANDATORY_QUESTIONS) {
    if (!answered.has(q) && canAskQuestion(q, state)) {
      available.push(q);
      seen.add(q);
    }
  }

  // Prioritize follow-up queue next
  for (const queuedQuestion of state.followUpQueue) {
    if (seen.has(queuedQuestion) || answered.has(queuedQuestion)) {
      continue;
    }

    if (canAskQuestion(queuedQuestion, state)) {
      available.push(queuedQuestion);
      seen.add(queuedQuestion);
    }
  }

  // Provide a single fallback question to keep progress moving
  const fallback = getNextFallbackQuestion(state, seen);
  if (fallback) {
    available.push(fallback);
  }

  return available;
}

/**
 * Checks if a specific question can be asked based on dependencies
 */
export function canAskQuestion(
  questionId: string,
  state: QuestionnaireClientState
): boolean {
  if (state.declined) {
    return false;
  }

  // Mandatory questions can always be asked if not answered
  if (MANDATORY_QUESTIONS.includes(questionId as any)) {
    return !state.questionsAnswered.includes(questionId);
  }

  // Check if already answered
  if (state.questionsAnswered.includes(questionId)) {
    return false;
  }

  // Check dependencies
  const dependencies = QUESTION_DEPENDENCIES[questionId] ?? [];
  const dependenciesMet = dependencies.every((dep) =>
    state.questionsAnswered.includes(dep)
  );

  if (!dependenciesMet) {
    return false;
  }

  return isQuestionPlanRelevant(questionId, state);
}

/**
 * Updates BMI in state if height and weight are available
 */
export function updateBMIInState(
  state: QuestionnaireClientState
): QuestionnaireClientState {
  if (state.height && state.weight && !state.bmi) {
    return {
      ...state,
      bmi: calculateBMI(state.height, state.weight),
    };
  }
  return state;
}

/**
 * Marks the questionnaire as completed and sets completion timestamp
 */
export function markAsCompleted(
  state: QuestionnaireClientState
): QuestionnaireClientState {
  const bestPlan = getBestEligiblePlan(state.eligiblePlans);
  return {
    ...state,
    completed: true,
    completedAt: new Date().toISOString(),
    currentPlan: state.planFloor ?? bestPlan,
    recommendedPlan: bestPlan,
    planFloor: state.planFloor ?? bestPlan,
  };
}

/**
 * Applies a decline to the state
 */
export function applyDecline(
  state: QuestionnaireClientState,
  reason: string
): QuestionnaireClientState {
  return {
    ...state,
    declined: true,
    declineReason: reason,
    eligiblePlans: [],
    recommendedPlan: "DECLINE",
    planFloor: "DECLINE",
    completed: true,
    completedAt: new Date().toISOString(),
  };
}

/**
 * Adds follow-up questions to the queue while preserving order and uniqueness.
 */
export function enqueueFollowUpQuestions(
  state: QuestionnaireClientState,
  followUps: string[]
): QuestionnaireClientState {
  if (!followUps || followUps.length === 0) {
    return state;
  }

  const answered = new Set(state.questionsAnswered);
  const existingQueue = new Set(state.followUpQueue);
  const nextQueue = [...state.followUpQueue];

  for (const followUp of followUps) {
    if (!followUp || answered.has(followUp) || existingQueue.has(followUp)) {
      continue;
    }
    if (!isQuestionPlanRelevant(followUp, state)) {
      continue;
    }
    nextQueue.push(followUp);
    existingQueue.add(followUp);
  }

  if (nextQueue.length === state.followUpQueue.length) {
    return state;
  }

  return {
    ...state,
    followUpQueue: nextQueue,
  };
}

/**
 * Removes a question from the follow-up queue.
 */
export function removeFollowUpQuestion(
  state: QuestionnaireClientState,
  questionId: string
): QuestionnaireClientState {
  if (state.followUpQueue.length === 0) {
    return state;
  }

  const nextQueue = state.followUpQueue.filter((queued) => queued !== questionId);

  if (nextQueue.length === state.followUpQueue.length) {
    return state;
  }

  return {
    ...state,
    followUpQueue: nextQueue,
  };
}

/**
 * Returns the next follow-up question whose dependencies are satisfied.
 */
export function getNextFollowUpQuestion(
  state: QuestionnaireClientState
): string | undefined {
  for (const queuedQuestion of state.followUpQueue) {
    if (canAskQuestion(queuedQuestion, state)) {
      return queuedQuestion;
    }
  }

  return;
}

/**
 * Recalculates the recommended plan based on currently eligible plans.
 * Ensures the recommended plan respects the plan floor (never better than floor).
 */
export function updateRecommendedPlan(
  state: QuestionnaireClientState
): QuestionnaireClientState {
  // Filter eligible plans by plan floor if it exists
  let filteredPlans = state.eligiblePlans;
  if (state.planFloor && state.planFloor !== "DECLINE") {
    filteredPlans = filterPlansByMinimumTier(
      state.eligiblePlans,
      state.planFloor
    );
  }

  const recommendedPlan = getBestEligiblePlan(filteredPlans);

  // Ensure recommended plan respects plan floor
  let finalRecommendedPlan = recommendedPlan;
  if (state.planFloor && recommendedPlan && state.planFloor !== "DECLINE") {
    const floorPriority = PLAN_PRIORITY[state.planFloor];
    const recommendedPriority = PLAN_PRIORITY[recommendedPlan];
    // If recommended plan is better (lower priority) than floor, use floor instead
    if (recommendedPriority < floorPriority) {
      finalRecommendedPlan = state.planFloor;
    }
  }

  if (state.recommendedPlan === finalRecommendedPlan) {
    return state;
  }

  return {
    ...state,
    recommendedPlan: finalRecommendedPlan,
  };
}

export function updatePlanFloor(
  state: QuestionnaireClientState,
  newMinimum?: PlanOutcome
): QuestionnaireClientState {
  if (!newMinimum) {
    return state;
  }

  const currentFloor = state.planFloor ?? "Day1";

  if (PLAN_PRIORITY[newMinimum] <= PLAN_PRIORITY[currentFloor]) {
    return state;
  }

  return {
    ...state,
    planFloor: newMinimum,
  };
}

/**
 * Find the next fallback question outside of the mandatory set and queue.
 */
function getNextFallbackQuestion(
  state: QuestionnaireClientState,
  seen: Set<string>
): string | undefined {
  for (const questionId of QUESTION_ORDER) {
    if (seen.has(questionId)) {
      continue;
    }

    if (canAskQuestion(questionId, state)) {
      return questionId;
    }
  }

  return;
}
