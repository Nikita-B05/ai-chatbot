import { tool } from "ai";
import { z } from "zod";
import { canAskQuestion, getQuestionsForMentionedConditions } from "./router";
import { applyRuleResult, evaluateRules } from "./rules";
import {
  calculateBMI,
  enqueueFollowUpQuestions,
  getAvailableQuestions,
  getBestEligiblePlan,
  getNextFollowUpQuestion,
  markAsCompleted,
  updateBMIInState,
  updateStateWithAnswer,
} from "./state";
import { PLAN_PRIORITY } from "./constants";
import { recomputeEligibility } from "./recompute";
import type {
  Gender,
  Q1Answer,
  Q2Answer,
  Q5Answer,
  PlanOutcome,
  QuestionnaireClientState,
} from "./types";

type UpdateQuestionnaireStateProps = {
  currentState: QuestionnaireClientState;
  onStateUpdate?: (newState: QuestionnaireClientState) => void;
};

/**
 * Tool for updating questionnaire state
 * Allows LLM to update demographics, answer questions, add conditions, etc.
 */
export const updateQuestionnaireState = ({
  currentState,
  onStateUpdate,
}: UpdateQuestionnaireStateProps) =>
  tool({
    description:
      "Update the questionnaire state by answering questions, updating demographics, or adding mentioned conditions. Use this tool when the user provides information relevant to the questionnaire.",
    inputSchema: z.object({
      updateDemographics: z
        .object({
          age: z.number().min(0).max(150).optional(),
          gender: z.enum(["male", "female"]).optional(),
          height: z.number().min(0).max(300).optional(), // cm
          weight: z.number().min(0).max(1000).optional(), // kg
        })
        .optional(),
      answerQuestion: z
        .object({
          questionId: z.string().describe("The question ID (e.g., 'q1', 'q2', 'gender')"),
          answer: z.any().describe("The answer object matching the question type"),
        })
        .optional(),
      addMentionedCondition: z
        .array(z.string())
        .describe("Add newly detected conditions mentioned by the user (e.g., ['diabetes', 'heart disease'])")
        .optional(),
      setCurrentQuestion: z
        .string()
        .describe("Set which question to ask next (optional, LLM can decide)")
        .optional(),
    }),
    execute: async (input) => {
      let newState: QuestionnaireClientState = { ...currentState };
      const previousPlan = getPlanOutcome(newState);

      // Update demographics
      if (input.updateDemographics) {
        const { age, gender, height, weight } = input.updateDemographics;

        if (age !== undefined) {
          newState.age = age;
        }
        if (gender !== undefined) {
          newState.gender = gender as Gender;
          if (!newState.questionsAnswered.includes("gender")) {
            newState.questionsAnswered = [...newState.questionsAnswered, "gender"];
          }
          if (!newState.questionsAsked.includes("gender")) {
            newState.questionsAsked = [...newState.questionsAsked, "gender"];
          }
        }
        if (height !== undefined) {
          newState.height = height;
        }
        if (weight !== undefined) {
          newState.weight = weight;
        }

        // Recalculate BMI if height and weight are available
        if (newState.height && newState.weight) {
          newState.bmi = calculateBMI(newState.height, newState.weight);
        }

        // Update BMI in state
        newState = updateBMIInState(newState);
      }

      // Add mentioned conditions
      if (input.addMentionedCondition && input.addMentionedCondition.length > 0) {
        const existingConditions = newState.mentionedConditions ?? [];
        const normalizedExistingSet = new Set(
          existingConditions.map((condition) => condition.toLowerCase())
        );
        const normalizedIncoming = input.addMentionedCondition
          .map((condition) => condition.toLowerCase().trim())
          .filter((condition) => condition.length > 0);

        const updatedConditions = [
          ...new Set([...normalizedExistingSet, ...normalizedIncoming]),
        ];

        newState.mentionedConditions = updatedConditions;

        const newlyAddedConditions = normalizedIncoming.filter(
          (condition) => !normalizedExistingSet.has(condition)
        );

        if (newlyAddedConditions.length > 0) {
          const relevantQuestions = getQuestionsForMentionedConditions(
            newlyAddedConditions,
            newState
          );

          const affectedQuestions = relevantQuestions.filter((questionId) =>
            newState.questionsAnswered.includes(questionId)
          );
          const unansweredQuestions = relevantQuestions.filter(
            (questionId) => !newState.questionsAnswered.includes(questionId)
          );

          for (const questionId of affectedQuestions) {
            delete newState.answers[questionId as keyof typeof newState.answers];
            newState.questionsAnswered = newState.questionsAnswered.filter(
              (askedQuestion) => askedQuestion !== questionId
            );
            newState.questionsAsked = newState.questionsAsked.filter(
              (askedQuestion) => askedQuestion !== questionId
            );
          }

          if (unansweredQuestions.length > 0) {
            newState = enqueueFollowUpQuestions(
              newState,
              unansweredQuestions
            );
          }
        }
      }

      // Answer a question
      if (input.answerQuestion) {
        const { questionId, answer } = input.answerQuestion;

        // Validate question can be asked
        if (!canAskQuestion(questionId, newState)) {
          return {
            error: `Question ${questionId} cannot be answered yet. Dependencies may not be met.`,
            state: newState,
            availableQuestions: getAvailableQuestions(newState),
          };
        }

        // Update state with answer
        newState = updateStateWithAnswer(newState, questionId, answer);

        // Mark question as asked if not already
        if (!newState.questionsAsked.includes(questionId)) {
          newState.questionsAsked = [...newState.questionsAsked, questionId];
        }

        // Evaluate rules for this question
        const ruleResult = evaluateRules(newState, questionId, answer);
        newState = applyRuleResult(newState, ruleResult);

        // Update BMI if Q2 was answered
        if (questionId === "q2" && (answer as Q2Answer).bmi) {
          newState.bmi = (answer as Q2Answer).bmi;
        }

        // Update rateType if Q1 or Q5 was answered
        if (questionId === "q1") {
          const q1Answer = answer as Q1Answer;
          newState.rateType = q1Answer.tobacco ? "SMOKER" : "NON_SMOKER";
        } else if (questionId === "q5") {
          const q5Answer = answer as Q5Answer;
          if (q5Answer.mixedWithTobacco && newState.rateType !== "SMOKER") {
            newState.rateType = "SMOKER";
          }
        }
      }

      // Recompute eligibility after all updates to ensure plan accuracy
      newState = recomputeEligibility(newState);

      const currentPlan = getPlanOutcome(newState);
      let planChangeMessage: string | undefined;
      if (
        previousPlan &&
        currentPlan &&
        PLAN_PRIORITY[currentPlan] > PLAN_PRIORITY[previousPlan]
      ) {
        planChangeMessage = `Plan adjusted from ${previousPlan} to ${currentPlan}.`;
      }

      // Determine available questions and next steps
      let availableQuestions = getAvailableQuestions(newState);

      if (
        newState.planFloor === "Guaranteed+" &&
        !newState.declined &&
        availableQuestions.length === 0
      ) {
        newState = markAsCompleted(newState);
      }

      if (newState.completed) {
        availableQuestions = [];
        newState.currentQuestion = undefined;
      } else if (input.setCurrentQuestion) {
        newState.currentQuestion = input.setCurrentQuestion;
      } else if (newState.declined) {
        newState.currentQuestion = undefined;
      } else {
        const nextFollowUp = getNextFollowUpQuestion(newState);
        if (nextFollowUp) {
          newState.currentQuestion = nextFollowUp;
        } else if (availableQuestions.length > 0) {
          newState.currentQuestion = availableQuestions[0];
        } else {
          newState.currentQuestion = undefined;
        }
      }

      // Notify callback if provided
      if (onStateUpdate) {
        onStateUpdate(newState);
      }

      return {
        success: true,
        state: {
          demographics: {
            gender: newState.gender,
            age: newState.age,
            height: newState.height,
            weight: newState.weight,
            bmi: newState.bmi,
          },
          rateType: newState.rateType,
          eligiblePlans: newState.eligiblePlans,
          currentPlan: newState.currentPlan,
          recommendedPlan: newState.recommendedPlan,
          planFloor: newState.planFloor,
          declined: newState.declined,
          declineReason: newState.declineReason,
          questionsAnswered: newState.questionsAnswered,
          questionsAsked: newState.questionsAsked,
          mentionedConditions: newState.mentionedConditions,
          currentQuestion: newState.currentQuestion,
          followUpQueue: newState.followUpQueue,
        },
        availableQuestions,
        planChange:
          previousPlan && currentPlan && planChangeMessage
            ? { from: previousPlan, to: currentPlan }
            : undefined,
        message:
          (input.answerQuestion
          ? `Question ${input.answerQuestion.questionId} answered successfully.`
          : input.updateDemographics
            ? "Demographics updated successfully."
            : input.addMentionedCondition
              ? `Added ${input.addMentionedCondition.length} condition(s) to mentioned conditions.`
              : "State updated successfully.") +
          (planChangeMessage ? ` ${planChangeMessage}` : ""),
      };
    },
  });

function getPlanOutcome(
  state: QuestionnaireClientState
): PlanOutcome | undefined {
  if (state.declined) {
    return "DECLINE";
  }
  if (state.planFloor) {
    return state.planFloor;
  }
  if (state.recommendedPlan) {
    return state.recommendedPlan as PlanOutcome;
  }
  return getBestEligiblePlan(state.eligiblePlans);
}

