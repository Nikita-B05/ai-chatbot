import {
  HIGH_RISK_OCCUPATIONS,
  MODERATE_RISK_OCCUPATIONS,
} from "./constants";
import { recomputeEligibility } from "./recompute";
import {
  calculateBMI,
  canAskQuestion,
  getAvailableQuestions,
  getNextFollowUpQuestion,
  markAsCompleted,
  updateStateWithAnswer,
} from "./state";
import { applyRuleResult, evaluateRules } from "./rules";
import type {
  Gender,
  Q1Answer,
  Q2Answer,
  Q3Answer,
  Q4Answer,
  QuestionnaireClientState,
} from "./types";

type AutoIntakeDemographics = Partial<
  Pick<QuestionnaireClientState, "gender" | "age" | "height" | "weight">
>;

type AutoIntakeAnswer =
  | {
      questionId: "gender";
      answer: Gender;
    }
  | {
      questionId: "q1";
      answer: Q1Answer;
    }
  | {
      questionId: "q2";
      answer: Q2Answer;
    }
  | {
      questionId: "q3";
      answer: Q3Answer;
    }
  | {
      questionId: "q4";
      answer: Q4Answer;
    };

interface AutoIntakeExtraction {
  demographics: AutoIntakeDemographics;
  answers: AutoIntakeAnswer[];
}

interface AutoIntakeApplication {
  state: QuestionnaireClientState;
  answeredQuestions: string[];
  demographicsUpdated: AutoIntakeDemographics;
}

const NON_SMOKER_PATTERNS = [
  /\bnon[-\s]?smoker\b/i,
  /\bdo(?:es)?n['’]?t smoke\b/i,
  /\bdo not smoke\b/i,
  /\bnever smoke\b/i,
  /\bno tobacco\b/i,
  /\bnon[-\s]?tobacco\b/i,
];

const SMOKER_PATTERNS = [
  /\bsmoker\b/i,
  /\bi smoke\b/i,
  /\bi vape\b/i,
  /\bus(?:e|ing) tobacco\b/i,
  /\bsmoking\b/i,
];

const NEGATIVE_WORK_PATTERNS = [
  /\bnot working\b/i,
  /\bunemployed\b/i,
  /\bbetween jobs\b/i,
  /\bstay[-\s]?at[-\s]?home\b/i,
  /\bnot employed\b/i,
  /\bno job\b/i,
  /\bretired\b/i,
];

const INSTITUTIONALIZED_PATTERNS = [
  /\bhospital\b/i,
  /\bnursing (?:facility|home)\b/i,
  /\bassisted living\b/i,
  /\bspecialized center\b/i,
  /\bbedridden\b/i,
  /\bwheelchair\b/i,
];

const ALCOHOL_NEGATIVE_PATTERNS = [
  /\bdo(?:es)?n['’]?t drink\b/i,
  /\bdo not drink\b/i,
  /\bno alcohol\b/i,
  /\bi (?:rarely|never) drink\b/i,
];

const OCCUPATION_CLEANUP_PATTERN = /[,.;!?]/;

const normalizedHighRiskOccupations = HIGH_RISK_OCCUPATIONS.map((value) =>
  normalizeForMatch(value)
);
const normalizedModerateRiskOccupations =
  MODERATE_RISK_OCCUPATIONS.map((value) => normalizeForMatch(value));

/**
 * Applies auto-intake extraction to the questionnaire state based on free-form user messages.
 * Returns the updated state and metadata about applied updates.
 */
export function applyAutoIntakeFromMessage(
  state: QuestionnaireClientState,
  messageText: string
): AutoIntakeApplication {
  const extraction = extractIntake(messageText, state);

  if (
    extraction.demographics.gender === undefined &&
    extraction.demographics.age === undefined &&
    extraction.demographics.height === undefined &&
    extraction.demographics.weight === undefined &&
    extraction.answers.length === 0
  ) {
    return {
      state,
      answeredQuestions: [],
      demographicsUpdated: {},
    };
  }

  let newState: QuestionnaireClientState = { ...state };
  const answeredQuestions: string[] = [];
  const demographicsUpdated: AutoIntakeDemographics = {};

  if (extraction.demographics.age !== undefined && !Number.isNaN(extraction.demographics.age)) {
    if (newState.age !== extraction.demographics.age) {
      newState.age = extraction.demographics.age;
      demographicsUpdated.age = extraction.demographics.age;
    }
  }

  if (
    extraction.demographics.gender !== undefined &&
    newState.gender !== extraction.demographics.gender
  ) {
    newState.gender = extraction.demographics.gender;
    demographicsUpdated.gender = extraction.demographics.gender;
  }

  if (
    extraction.demographics.height !== undefined &&
    !Number.isNaN(extraction.demographics.height)
  ) {
    if (newState.height !== extraction.demographics.height) {
      newState.height = extraction.demographics.height;
      demographicsUpdated.height = extraction.demographics.height;
    }
  }

  if (
    extraction.demographics.weight !== undefined &&
    !Number.isNaN(extraction.demographics.weight)
  ) {
    if (newState.weight !== extraction.demographics.weight) {
      newState.weight = extraction.demographics.weight;
      demographicsUpdated.weight = extraction.demographics.weight;
    }
  }

  const effectiveGender = extraction.demographics.gender ?? newState.gender;
  if (effectiveGender !== undefined) {
    if (!newState.questionsAnswered.includes("gender")) {
      newState.questionsAnswered = [...newState.questionsAnswered, "gender"];
      if (!newState.questionsAsked.includes("gender")) {
        newState.questionsAsked = [...newState.questionsAsked, "gender"];
      }
      answeredQuestions.push("gender");
    }
  }

  for (const { questionId, answer } of extraction.answers) {
    if (questionId === "gender") {
      continue;
    }

    if (newState.questionsAnswered.includes(questionId)) {
      continue;
    }

    if (!canAskQuestion(questionId, newState)) {
      continue;
    }

    newState = updateStateWithAnswer(newState, questionId, answer);
    if (!newState.questionsAsked.includes(questionId)) {
      newState.questionsAsked = [...newState.questionsAsked, questionId];
    }

    const ruleResult = evaluateRules(newState, questionId, answer);
    newState = applyRuleResult(newState, ruleResult);

    answeredQuestions.push(questionId);
  }

  if (answeredQuestions.length === 0 && Object.keys(demographicsUpdated).length === 0) {
    return {
      state,
      answeredQuestions: [],
      demographicsUpdated: {},
    };
  }

  if (newState.height && newState.weight) {
    newState.bmi = calculateBMI(newState.height, newState.weight);
  }

  newState = recomputeEligibility(newState);

  let availableQuestions = getAvailableQuestions(newState);

  if (
    newState.planFloor === "Guaranteed+" &&
    !newState.declined &&
    availableQuestions.length === 0
  ) {
    newState = markAsCompleted(newState);
    availableQuestions = [];
  }

  if (newState.completed || newState.declined) {
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

  return {
    state: newState,
    answeredQuestions,
    demographicsUpdated,
  };
}

function extractIntake(
  messageText: string,
  state: QuestionnaireClientState
): AutoIntakeExtraction {
  const demographics: AutoIntakeDemographics = {};
  const answers: AutoIntakeAnswer[] = [];
  const normalizedMessage = normalizeWhitespace(messageText);
  const lowercaseMessage = normalizedMessage.toLowerCase();

  const age = extractAge(lowercaseMessage);
  if (age !== undefined && state.age !== age) {
    demographics.age = age;
  }

  const gender = extractGender(lowercaseMessage);
  if (gender && state.gender !== gender) {
    demographics.gender = gender;
  }

  const height = extractHeight(lowercaseMessage);
  if (height !== undefined && state.height !== height) {
    demographics.height = height;
  }

  const weight = extractWeight(lowercaseMessage);
  if (weight !== undefined && state.weight !== weight) {
    demographics.weight = weight;
  }

  if (!state.questionsAnswered.includes("q1")) {
    const tobacco = extractTobaccoUsage(lowercaseMessage);
    if (tobacco !== undefined) {
      answers.push({
        questionId: "q1",
        answer: { tobacco } satisfies Q1Answer,
      });
    }
  }

  if (!state.questionsAnswered.includes("q3")) {
    const employment = extractEmploymentInfo(normalizedMessage);
    if (employment) {
      const { working, highRiskOccupation, moderateRiskOccupation, institutionalized, occupation } =
        employment;
      const answer: Q3Answer & { occupationDescription?: string } = {
        working,
      };

      if (highRiskOccupation) {
        answer.highRiskOccupation = true;
      } else if (moderateRiskOccupation) {
        answer.moderateRiskOccupation = true;
      }

      if (institutionalized) {
        answer.institutionalized = true;
      }

      if (occupation) {
        answer.occupationDescription = occupation;
      }

      answers.push({
        questionId: "q3",
        answer,
      });
    }
  }

  if (!state.questionsAnswered.includes("q4")) {
    const alcohol = extractAlcoholUsage(lowercaseMessage);
    if (alcohol) {
      answers.push({
        questionId: "q4",
        answer: alcohol,
      });
    }
  }

  const heightForBmi = demographics.height ?? state.height;
  const weightForBmi = demographics.weight ?? state.weight;

  if (
    !state.questionsAnswered.includes("q2") &&
    heightForBmi !== undefined &&
    weightForBmi !== undefined
  ) {
    const bmi = calculateBMI(heightForBmi, weightForBmi);
    answers.push({
      questionId: "q2",
      answer: { bmi } satisfies Q2Answer,
    });
  }

  return { demographics, answers };
}

function extractAge(message: string): number | undefined {
  const agePatterns = [
    /\b(?:i am|i'm|im)\s*(\d{1,3})(?!\s*(?:cm|mm|kg|lbs|pounds))\b/,
    /\bage\s*(\d{1,3})\b/,
    /\b(\d{1,3})\s*(?:years?|yrs?)\s*old\b/,
  ];

  for (const pattern of agePatterns) {
    const match = message.match(pattern);
    if (!match) {
      continue;
    }
    const age = Number.parseInt(match[1] ?? "", 10);
    if (Number.isNaN(age)) {
      continue;
    }
    if (age >= 16 && age <= 110) {
      return age;
    }
  }

  return undefined;
}

function extractGender(message: string): Gender | undefined {
  if (/\b(?:male|man)\b/.test(message)) {
    if (/\bfemale\b/.test(message) || /\bwoman\b/.test(message)) {
      return undefined;
    }
    return "male";
  }
  if (/\b(?:female|woman)\b/.test(message)) {
    return "female";
  }
  return undefined;
}

function extractHeight(message: string): number | undefined {
  const match = message.match(/\b(\d{2,3})\s*(?:cm|centimet(?:er|re)s?)\b/);
  if (!match) {
    return undefined;
  }

  const height = Number.parseInt(match[1] ?? "", 10);
  if (Number.isNaN(height)) {
    return undefined;
  }

  if (height >= 120 && height <= 230) {
    return height;
  }

  return undefined;
}

function extractWeight(message: string): number | undefined {
  const match = message.match(/\b(\d{2,3})\s*(?:kg|kilograms?)\b/);
  if (!match) {
    return undefined;
  }

  const weight = Number.parseInt(match[1] ?? "", 10);
  if (Number.isNaN(weight)) {
    return undefined;
  }

  if (weight >= 35 && weight <= 250) {
    return weight;
  }

  return undefined;
}

function extractTobaccoUsage(message: string): boolean | undefined {
  if (NON_SMOKER_PATTERNS.some((pattern) => pattern.test(message))) {
    return false;
  }

  if (SMOKER_PATTERNS.some((pattern) => pattern.test(message))) {
    return true;
  }

  return undefined;
}

function extractAlcoholUsage(message: string): Q4Answer | undefined {
  if (ALCOHOL_NEGATIVE_PATTERNS.some((pattern) => pattern.test(message))) {
    return { alcohol: false };
  }

  const drinksPerWeekMatch = message.match(
    /\b(\d{1,2})\s*(?:drink|drinks)\b(?:[^\n]*?\bper\b|\bper\b)\s*\bweek\b/
  );

  if (drinksPerWeekMatch) {
    const drinks = Number.parseInt(drinksPerWeekMatch[1] ?? "", 10);
    if (!Number.isNaN(drinks)) {
      return {
        alcohol: true,
        drinksPerWeek: drinks,
      };
    }
  }

  if (/\b(?:i drink|alcohol)\b/.test(message) && /\bper week\b/.test(message)) {
    return { alcohol: true };
  }

  return undefined;
}

interface EmploymentExtraction {
  working: boolean;
  highRiskOccupation: boolean;
  moderateRiskOccupation: boolean;
  institutionalized: boolean;
  occupation?: string;
}

function extractEmploymentInfo(message: string): EmploymentExtraction | undefined {
  if (NEGATIVE_WORK_PATTERNS.some((pattern) => pattern.test(message))) {
    const institutionalized = INSTITUTIONALIZED_PATTERNS.some((pattern) =>
      pattern.test(message)
    );
    return {
      working: false,
      highRiskOccupation: false,
      moderateRiskOccupation: false,
      institutionalized,
    };
  }

  const occupation = extractOccupation(message);
  if (!occupation) {
    if (/\bwork\b/.test(message) && !/\bnot work\b/.test(message)) {
      return {
        working: true,
        highRiskOccupation: containsHighRiskKeyword(message),
        moderateRiskOccupation: containsModerateRiskKeyword(message),
        institutionalized: false,
      };
    }
    return undefined;
  }

  const risk = determineOccupationRisk(occupation, message);
  return {
    working: true,
    highRiskOccupation: risk === "high",
    moderateRiskOccupation: risk === "moderate",
    institutionalized: false,
    occupation,
  };
}

function extractOccupation(message: string): string | undefined {
  const occupationPatterns = [
    /work(?:ing)? as (?:an?|the)?\s+([a-z\s-]{2,60})/i,
    /i (?:am|was|became) (?:an?|the)?\s+([a-z\s-]{2,60})/i,
    /i['’]?m (?:an?|the)?\s+([a-z\s-]{2,60})/i,
  ];

  for (const pattern of occupationPatterns) {
    const match = message.match(pattern);
    if (!match) {
      continue;
    }

    const extracted = (match[1] ?? "").trim();
    if (!extracted) {
      continue;
    }

    const truncated = extracted.split(OCCUPATION_CLEANUP_PATTERN)[0]?.trim();
    if (!truncated) {
      continue;
    }

    const clean = truncated.replace(/\band\b.*$/i, "").trim();
    if (clean.length === 0) {
      continue;
    }

    return clean.toLowerCase();
  }

  return undefined;
}

function determineOccupationRisk(
  occupation: string,
  message: string
): "high" | "moderate" | "low" {
  const normalizedOccupation = normalizeForMatch(occupation);

  if (
    matchesNormalizedList(normalizedOccupation, normalizedHighRiskOccupations) ||
    containsHighRiskKeyword(message)
  ) {
    return "high";
  }

  if (
    matchesNormalizedList(normalizedOccupation, normalizedModerateRiskOccupations) ||
    containsModerateRiskKeyword(message)
  ) {
    return "moderate";
  }

  if (normalizedOccupation.includes("pilot") && !normalizedOccupation.includes("commercial")) {
    return "moderate";
  }

  return "low";
}

function containsHighRiskKeyword(message: string): boolean {
  const normalizedMessage = normalizeForMatch(message);
  return matchesNormalizedList(normalizedMessage, normalizedHighRiskOccupations);
}

function containsModerateRiskKeyword(message: string): boolean {
  const normalizedMessage = normalizeForMatch(message);
  return matchesNormalizedList(normalizedMessage, normalizedModerateRiskOccupations);
}

function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function normalizeForMatch(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}

function matchesNormalizedList(target: string, list: string[]): boolean {
  if (!target) {
    return false;
  }

  for (const entry of list) {
    if (!entry) {
      continue;
    }

    if (target.includes(entry) || entry.includes(target)) {
      return true;
    }
  }

  return false;
}

