import { MANDATORY_QUESTIONS, QUESTION_DEPENDENCIES } from "./constants";
import {
  getQuestionsForMentionedConditions as getQuestionsForTopicConditions,
  getQuestionDescription,
  QUESTION_DESCRIPTIONS,
} from "./questions";
import {
  canAskQuestion,
  getAvailableQuestions,
  getQuestionPlanImpact,
  isQuestionPlanRelevant,
} from "./state";
import type { PlanOutcome, QuestionnaireClientState } from "./types";

export interface AvailableQuestionInfo {
  id: string;
  description: string;
  topics: string[];
  dependencies: string[];
  dependenciesMet: boolean;
  asked: boolean;
  answered: boolean;
  available: boolean;
  priority: "mandatory" | "follow-up" | "fallback" | "standard";
  queuePosition?: number;
  worstOutcome?: PlanOutcome | null;
  impactsPlan: boolean;
}

/**
 * Get formatted list of available questions for LLM consumption
 * Returns structured information about each question's status and dependencies
 */
export function getAvailableQuestionsForLLM(
  state: QuestionnaireClientState
): AvailableQuestionInfo[] {
  const availableQuestionIds = getAvailableQuestions(state);
  const mandatoryPending = new Set<string>(
    MANDATORY_QUESTIONS.filter(
      (questionId) => !state.questionsAnswered.includes(questionId)
    )
  );
  const followUpQueue = state.followUpQueue ?? [];
  const queueIndexMap = new Map<string, number>();

  followUpQueue.forEach((questionId, index) => {
    queueIndexMap.set(questionId, index);
  });

  const fallbackQuestionId = availableQuestionIds.find(
    (questionId) =>
      !mandatoryPending.has(questionId) && !queueIndexMap.has(questionId)
  );
  // Include all defined questions (base and sub-questions) for LLM display
  const allQuestionIds = Array.from(
    new Set([
      ...MANDATORY_QUESTIONS,
      ...Object.keys(QUESTION_DESCRIPTIONS),
    ])
  );

  return allQuestionIds.map((questionId) => {
    const description = getQuestionDescription(questionId);
    const dependencies = QUESTION_DEPENDENCIES[questionId] ?? [];
    const dependenciesMet = dependencies.every((dep) =>
      state.questionsAnswered.includes(dep)
    );
    const asked = state.questionsAsked.includes(questionId);
    const answered = state.questionsAnswered.includes(questionId);
    const available = availableQuestionIds.includes(questionId);
    const worstOutcome = getQuestionPlanImpact(questionId);
    const impactsPlan = isQuestionPlanRelevant(questionId, state);
    const queuePosition =
      queueIndexMap.has(questionId) && !answered
        ? (queueIndexMap.get(questionId) ?? 0) + 1
        : undefined;

    let priority: AvailableQuestionInfo["priority"] = "standard";
    if (mandatoryPending.has(questionId) && !answered) {
      priority = "mandatory";
    } else if (queueIndexMap.has(questionId) && !answered) {
      priority = "follow-up";
    } else if (
      fallbackQuestionId &&
      fallbackQuestionId === questionId &&
      !answered
    ) {
      priority = "fallback";
    }

    return {
      id: questionId,
      description: description?.text ?? `Question ${questionId}`,
      topics: description?.topics ?? [],
      dependencies,
      dependenciesMet,
      asked,
      answered,
      available,
      priority,
      queuePosition,
      worstOutcome: worstOutcome ?? null,
      impactsPlan,
    };
  });
}

/**
 * Re-export canAskQuestion from state.ts for convenience
 */
export { canAskQuestion } from "./state";

/**
 * Get question topics mapping
 * Returns a mapping of question IDs to topics/conditions they cover
 */
export function getQuestionTopics(): Record<string, string[]> {
  const topics: Record<string, string[]> = {};

  for (const [questionId, description] of Object.entries(QUESTION_DESCRIPTIONS)) {
    topics[questionId] = description.topics;
  }

  return topics;
}

/**
 * Get questions relevant for mentioned conditions based on current state
 * Returns question IDs that should be asked based on mentioned conditions
 */
export function getQuestionsForMentionedConditions(
  conditions: string[],
  state: QuestionnaireClientState
): string[] {
  const relevantQuestions = getQuestionsForTopicConditions(conditions);

  // Filter to only include questions that can be asked
  return relevantQuestions.filter((questionId) =>
    canAskQuestion(questionId, state)
  );
}

/**
 * Get summary of questionnaire state for LLM
 */
export function getQuestionnaireStateSummary(
  state: QuestionnaireClientState
): {
  demographics: {
    gender?: string;
    age?: number;
    height?: number;
    weight?: number;
    bmi?: number;
  };
  rateType?: string;
  eligiblePlans: string[];
  currentPlan?: string;
  recommendedPlan?: string;
  declined: boolean;
  declineReason?: string;
  questionsAsked: number;
  questionsAnswered: number;
  availableQuestions: number;
  mentionedConditions?: string[];
  followUpQueue: string[];
} {
  const availableQuestions = getAvailableQuestions(state);

  return {
    demographics: {
      gender: state.gender,
      age: state.age,
      height: state.height,
      weight: state.weight,
      bmi: state.bmi,
    },
    rateType: state.rateType,
    eligiblePlans: state.eligiblePlans,
    currentPlan: state.currentPlan,
    recommendedPlan: state.recommendedPlan,
    declined: state.declined,
    declineReason: state.declineReason,
    questionsAsked: state.questionsAsked.length,
    questionsAnswered: state.questionsAnswered.length,
    availableQuestions: availableQuestions.length,
    mentionedConditions: state.mentionedConditions,
    followUpQueue: state.followUpQueue,
  };
}

