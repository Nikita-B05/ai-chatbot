import {
  MANDATORY_QUESTIONS,
  PLAN_PRIORITY,
  PLAN_TIERS,
  QUESTION_DEPENDENCIES,
} from "./constants";
import type { PlanTier, QuestionnaireClientState } from "./types";

/**
 * Creates an initial empty questionnaire state
 */
export function createInitialState(): QuestionnaireClientState {
  return {
    answers: {},
    eligiblePlans: [...PLAN_TIERS],
    declined: false,
    questionsAsked: [],
    questionsAnswered: [],
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
 * Gets the highest priority eligible plan from the list
 */
export function getHighestEligiblePlan(
  eligiblePlans: PlanTier[]
): PlanTier | undefined {
  if (eligiblePlans.length === 0) {
    return;
  }

  return eligiblePlans.reduce((highest, current) => {
    return PLAN_PRIORITY[current] > PLAN_PRIORITY[highest] ? current : highest;
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
 * Updates the state with a new answer to a question
 */
export function updateStateWithAnswer(
  state: QuestionnaireClientState,
  questionId: string,
  answer: any
): QuestionnaireClientState {
  const { currentQuestion: _, ...stateWithoutCurrentQuestion } = state;

  return {
    ...stateWithoutCurrentQuestion,
    answers: {
      ...state.answers,
      [questionId]: answer,
    },
    questionsAnswered: [...new Set([...state.questionsAnswered, questionId])],
  };
}

/**
 * Gets all available questions that can be asked based on dependencies
 * This is used by the LLM to determine which questions are available
 */
export function getAvailableQuestions(
  state: QuestionnaireClientState
): string[] {
  const available: string[] = [];

  // Check mandatory questions first
  for (const q of MANDATORY_QUESTIONS) {
    if (!state.questionsAnswered.includes(q)) {
      available.push(q);
    }
  }

  // Check other questions (q1 through q25)
  for (let i = 1; i <= 25; i++) {
    const questionId = `q${i}`;

    // Skip if already answered
    if (state.questionsAnswered.includes(questionId)) {
      continue;
    }

    // Check dependencies
    const dependencies = QUESTION_DEPENDENCIES[questionId] ?? [];
    const dependenciesMet = dependencies.every((dep) =>
      state.questionsAnswered.includes(dep)
    );

    if (dependenciesMet) {
      available.push(questionId);
    }
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
  return dependencies.every((dep) => state.questionsAnswered.includes(dep));
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
  return {
    ...state,
    completed: true,
    completedAt: new Date().toISOString(),
    currentPlan: getHighestEligiblePlan(state.eligiblePlans),
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
    completed: true,
    completedAt: new Date().toISOString(),
  };
}
