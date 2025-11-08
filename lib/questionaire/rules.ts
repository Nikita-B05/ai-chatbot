import {
  AGE_THRESHOLDS,
  ALCOHOL_THRESHOLDS,
  BMI_CONDITION_THRESHOLDS,
  BMI_RANGES,
  DECLINE_REASONS,
  MARIJUANA_FREQUENCY,
  PLAN_PRIORITY,
  SEIZURE_FREQUENCY,
  YEARS_THRESHOLDS,
} from "./constants";
import {
  enqueueFollowUpQuestions,
  filterPlansByMinimumTier,
  updatePlanFloor,
  updateRecommendedPlan,
} from "./state";
import { getFollowUpsForQuestion } from "./questions";
import type {
  PlanTier,
  Q1Answer,
  Q2Answer,
  Q3Answer,
  Q4Answer,
  Q5Answer,
  Q6Answer,
  Q7Answer,
  Q8Answer,
  Q9Answer,
  Q10Answer,
  Q11Answer,
  Q12Answer,
  Q13Answer,
  Q14Answer,
  Q15Answer,
  Q16Answer,
  Q17Answer,
  Q18Answer,
  Q19Answer,
  Q20Answer,
  Q21Answer,
  Q22Answer,
  Q23Answer,
  Q24Answer,
  Q25Answer,
  QuestionnaireClientState,
  RuleEvaluationResult,
} from "./types";

/**
 * Helper function to check if Q18 has severe mental health condition
 */
function hasSevereMentalHealth(state: QuestionnaireClientState): boolean {
  return state.answers.q18?.severeMentalHealth === true;
}

/**
 * Helper function to check if Q18 has moderate mental health condition
 */
function hasModerateMentalHealth(state: QuestionnaireClientState): boolean {
  return state.answers.q18?.moderateMentalHealth === true;
}

/**
 * Helper function to check Q6 combination rule:
 * "Question 6 answered Yes but no to #8 or alcohol quantity 21 and over"
 */
function checkQ6CombinationRule(state: QuestionnaireClientState): boolean {
  const q6 = state.answers.q6;
  const q8 = state.answers.q8;
  const q4 = state.answers.q4;

  if (!q6?.illicitDrugs) {
    return false;
  }

  // "Yes to Q6 but no to Q8" OR "alcohol quantity 21 and over"
  const noQ8 = q8?.dui === false || !q8;
  const alcohol21Plus = (q4?.drinksPerWeek ?? 0) >= ALCOHOL_THRESHOLDS.HIGH;

  return noQ8 || alcohol21Plus;
}

/**
 * Helper function to check if Q8 answered yes OR alcohol quantity 21 and over
 */
function checkQ8OrAlcohol21Plus(state: QuestionnaireClientState): boolean {
  const q8 = state.answers.q8;
  const q4 = state.answers.q4;
  return (
    q8?.dui === true || (q4?.drinksPerWeek ?? 0) >= ALCOHOL_THRESHOLDS.HIGH
  );
}

/**
 * Helper function to check if Q11 (CAD) is answered yes
 */
function hasCAD(state: QuestionnaireClientState): boolean {
  return state.answers.q11?.heartDisease === true;
}

/**
 * Helper function to check if smoker
 */
function isSmoker(state: QuestionnaireClientState): boolean {
  return state.rateType === "SMOKER";
}

/**
 * Helper function to check if age >= threshold
 */
function isAgeGreaterThanOrEqual(
  state: QuestionnaireClientState,
  threshold: number
): boolean {
  return (state.age ?? 0) >= threshold;
}

/**
 * Evaluates rules for Q1 (Tobacco)
 * Sets rateType to SMOKER or NON_SMOKER
 */
export function evaluateQ1Rules(
  _state: QuestionnaireClientState,
  answer: Q1Answer
): RuleEvaluationResult {
  return {
    updateState: {
      rateType: answer.tobacco ? "SMOKER" : "NON_SMOKER",
    },
  };
}

/**
 * Evaluates rules for Q2 (Height/Weight/BMI)
 * Complex rules based on BMI ranges, pregnancy, weight loss
 */
export function evaluateQ2Rules(
  state: QuestionnaireClientState,
  answer: Q2Answer
): RuleEvaluationResult {
  const bmi = answer.bmi;
  let minimumTier: PlanTier = "Day1";

  // Determine plan based on BMI range
  if (bmi <= BMI_RANGES.VERY_LOW.max) {
    minimumTier = BMI_RANGES.VERY_LOW.plan;
  } else if (bmi >= BMI_RANGES.LOW.min && bmi <= BMI_RANGES.LOW.max) {
    minimumTier = BMI_RANGES.LOW.plan;
  } else if (bmi >= BMI_RANGES.MODERATE.min && bmi <= BMI_RANGES.MODERATE.max) {
    minimumTier = BMI_RANGES.MODERATE.plan;
  } else if (bmi >= BMI_RANGES.HIGH.min && bmi <= BMI_RANGES.HIGH.max) {
    minimumTier = BMI_RANGES.HIGH.plan;
  } else if (
    bmi >= BMI_RANGES.VERY_HIGH.min &&
    bmi <= BMI_RANGES.VERY_HIGH.max
  ) {
    minimumTier = BMI_RANGES.VERY_HIGH.plan;
  } else if (bmi >= BMI_RANGES.EXTREME.min) {
    minimumTier = BMI_RANGES.EXTREME.plan;
  }

  // Weight loss rule (>10% in past 12 months) = Deferred+
  if (answer.weightLoss === true) {
    minimumTier = "Deferred+";
  }

  return {
    planFilter: minimumTier,
    updateState: {
      bmi,
      height: state.height,
      weight: state.weight,
    },
  };
}

/**
 * Evaluates rules for Q3 (Working)
 */
export function evaluateQ3Rules(
  _state: QuestionnaireClientState,
  answer: Q3Answer
): RuleEvaluationResult {
  if (!answer.working) {
    // Not working - check if institutionalized
    if (answer.institutionalized === true) {
      return { planFilter: "Guaranteed+" };
    }
    return { planFilter: "Day1" };
  }

  // Working - check occupation risk
  if (answer.highRiskOccupation === true) {
    return { planFilter: "Deferred+" };
  }
  if (answer.moderateRiskOccupation === true) {
    return { planFilter: "Signature" };
  }
  return { planFilter: "Day1" };
}

/**
 * Evaluates rules for Q4 (Alcohol)
 * Checks Q18 for severe/moderate anxiety
 */
export function evaluateQ4Rules(
  state: QuestionnaireClientState,
  answer: Q4Answer
): RuleEvaluationResult {
  const followUps = answer.alcohol ? getFollowUpsForQuestion("q4") : [];

  if (!answer.alcohol) {
    return { planFilter: "Day1" };
  }

  const drinksPerWeek = answer.drinksPerWeek ?? 0;

  if (drinksPerWeek < ALCOHOL_THRESHOLDS.LOW) {
    return { planFilter: "Day1", followUps };
  }
  if (
    drinksPerWeek >= ALCOHOL_THRESHOLDS.LOW &&
    drinksPerWeek <= ALCOHOL_THRESHOLDS.MODERATE
  ) {
    return { planFilter: "Day1+", followUps };
  }
  if (
    drinksPerWeek >= ALCOHOL_THRESHOLDS.HIGH &&
    drinksPerWeek <= ALCOHOL_THRESHOLDS.VERY_HIGH
  ) {
    // CHECK If YES to Q18 for Severe Anxiety Guaranteed+ OR If Yes to Q18 for Moderate Anxiety Deferred+ OTHERWISE : Signature
    if (hasSevereMentalHealth(state)) {
      return { planFilter: "Guaranteed+", followUps };
    }
    if (hasModerateMentalHealth(state)) {
      return { planFilter: "Deferred+", followUps };
    }
    return { planFilter: "Signature", followUps };
  }
  if (drinksPerWeek > ALCOHOL_THRESHOLDS.VERY_HIGH) {
    return { planFilter: "Guaranteed+", followUps };
  }

  return { planFilter: "Day1", followUps };
}

/**
 * Evaluates rules for Q5 (Marijuana)
 */
export function evaluateQ5Rules(
  state: QuestionnaireClientState,
  answer: Q5Answer
): RuleEvaluationResult {
  if (!answer.marijuana) {
    return { planFilter: "Day1" };
  }

  // Update rateType if mixed with tobacco
  const updateState: Partial<QuestionnaireClientState> = {};
  if (answer.mixedWithTobacco === true && state.rateType !== "SMOKER") {
    updateState.rateType = "SMOKER";
  }

  const frequency = answer.frequencyPerWeek ?? 0;
  const age = state.age ?? 0;

  if (frequency >= MARIJUANA_FREQUENCY.VERY_HIGH.min) {
    return { planFilter: "Guaranteed+", updateState };
  }
  if (
    frequency >= MARIJUANA_FREQUENCY.HIGH.min &&
    frequency <= MARIJUANA_FREQUENCY.HIGH.max
  ) {
    if (age <= AGE_THRESHOLDS.MARIJUANA_25) {
      return { planFilter: "Deferred+", updateState };
    }
    return { planFilter: "Signature", updateState };
  }
  if (
    frequency >= MARIJUANA_FREQUENCY.MODERATE.min &&
    frequency <= MARIJUANA_FREQUENCY.MODERATE.max
  ) {
    if (age <= AGE_THRESHOLDS.MARIJUANA_25) {
      return { planFilter: "Signature", updateState };
    }
    return { planFilter: "Day1+", updateState };
  }
  if (
    frequency >= MARIJUANA_FREQUENCY.LOW.min &&
    frequency <= MARIJUANA_FREQUENCY.LOW.max
  ) {
    if (age <= AGE_THRESHOLDS.MARIJUANA_25) {
      return { planFilter: "Day1+", updateState };
    }
    return { planFilter: "Day1", updateState };
  }

  return { planFilter: "Day1", updateState };
}

/**
 * Evaluates rules for Q6 (Illicit Drugs)
 * Complex rules with Q18 and Q4 checks
 */
export function evaluateQ6Rules(
  state: QuestionnaireClientState,
  answer: Q6Answer
): RuleEvaluationResult {
  const followUps = answer.illicitDrugs
    ? getFollowUpsForQuestion("q6")
    : [];

  if (!answer.illicitDrugs) {
    return { planFilter: "Day1" };
  }

  const lastUseYears = answer.lastUseYears ?? 0;

  // < 1 year = DECLINE
  if (lastUseYears < YEARS_THRESHOLDS.Q6_DRUG_USE.DECLINE) {
    return {
      decline: true,
      declineReason: DECLINE_REASONS.Q6_RECENT_USE,
    };
  }

  // Check combination rules
  const hasMentalHealth =
    hasSevereMentalHealth(state) || hasModerateMentalHealth(state);
  const alcohol21Plus =
    (state.answers.q4?.drinksPerWeek ?? 0) >= ALCOHOL_THRESHOLDS.HIGH;

  // 1-2 years
  if (
    lastUseYears >= YEARS_THRESHOLDS.Q6_DRUG_USE.DECLINE &&
    lastUseYears < YEARS_THRESHOLDS.Q6_DRUG_USE.GUARANTEED_PLUS
  ) {
    if (hasMentalHealth || alcohol21Plus) {
      return {
        decline: true,
        declineReason: hasMentalHealth
          ? DECLINE_REASONS.Q6_WITH_MENTAL_HEALTH
          : DECLINE_REASONS.Q6_WITH_ALCOHOL,
      };
    }
    return { planFilter: "Guaranteed+", followUps };
  }

  // 2-5 years
  if (
    lastUseYears >= YEARS_THRESHOLDS.Q6_DRUG_USE.GUARANTEED_PLUS &&
    lastUseYears < YEARS_THRESHOLDS.Q6_DRUG_USE.SIGNATURE
  ) {
    if (hasMentalHealth || alcohol21Plus) {
      return { planFilter: "Deferred+", followUps };
    }
    return { planFilter: "Signature", followUps };
  }

  // 5-10 years
  if (
    lastUseYears >= YEARS_THRESHOLDS.Q6_DRUG_USE.SIGNATURE &&
    lastUseYears < YEARS_THRESHOLDS.Q6_DRUG_USE.DAY1_PLUS
  ) {
    if (answer.onlyExperimental === true) {
      const totalUses = answer.totalUses ?? 0;
      if (totalUses === 1) {
        return { planFilter: "Day1", followUps };
      }
      return { planFilter: "Day1+", followUps };
    }
    if (hasMentalHealth || alcohol21Plus) {
      return { planFilter: "Signature", followUps };
    }
    return { planFilter: "Day1+", followUps };
  }

  // >= 10 years
  return { planFilter: "Day1", followUps };
}

/**
 * Evaluates rules for Q7 (Treatment)
 * Checks Q4 and Q6
 */
export function evaluateQ7Rules(
  state: QuestionnaireClientState,
  answer: Q7Answer
): RuleEvaluationResult {
  if (!answer.treatment) {
    return { planFilter: "Day1" };
  }

  const lastTreatmentYears = answer.lastTreatmentYears ?? 0;

  // Alcohol treatment only
  if (answer.alcoholOnly === true) {
    // CHECK If YES to Q4 (ETOH) DECLINE
    if (state.answers.q4?.alcohol === true) {
      return {
        decline: true,
        declineReason: DECLINE_REASONS.Q7_ALCOHOL_TREATMENT,
      };
    }

    // Otherwise based on years since treatment
    if (lastTreatmentYears < YEARS_THRESHOLDS.Q7_TREATMENT.GUARANTEED_PLUS) {
      return { planFilter: "Guaranteed+" };
    }
    if (lastTreatmentYears < YEARS_THRESHOLDS.Q7_TREATMENT.DEFERRED_PLUS) {
      return { planFilter: "Deferred+" };
    }
    if (lastTreatmentYears < YEARS_THRESHOLDS.Q7_TREATMENT.SIGNATURE) {
      return { planFilter: "Signature" };
    }
    if (lastTreatmentYears < YEARS_THRESHOLDS.Q7_TREATMENT.DAY1_PLUS) {
      return { planFilter: "Day1+" };
    }
    return { planFilter: "Day1" };
  }

  // Drug treatment
  // CHECK If YES to Q6 (DRUG) DECLINE
  if (state.answers.q6?.illicitDrugs === true) {
    return {
      decline: true,
      declineReason: DECLINE_REASONS.Q7_DRUG_TREATMENT,
    };
  }

  // Otherwise based on years since treatment
  if (lastTreatmentYears < YEARS_THRESHOLDS.Q7_TREATMENT.GUARANTEED_PLUS) {
    return { planFilter: "Guaranteed+" };
  }
  if (lastTreatmentYears < YEARS_THRESHOLDS.Q7_TREATMENT.DEFERRED_PLUS) {
    return { planFilter: "Deferred+" };
  }
  if (lastTreatmentYears < YEARS_THRESHOLDS.Q7_TREATMENT.SIGNATURE) {
    return { planFilter: "Signature" };
  }
  if (lastTreatmentYears < YEARS_THRESHOLDS.Q7_TREATMENT.DAY1_PLUS) {
    return { planFilter: "Day1+" };
  }
  return { planFilter: "Day1" };
}

/**
 * Evaluates rules for Q8 (DUI)
 * Checks Q18 combination rules
 */
export function evaluateQ8Rules(
  state: QuestionnaireClientState,
  answer: Q8Answer
): RuleEvaluationResult {
  const followUps = answer.dui ? getFollowUpsForQuestion("q8") : [];

  if (!answer.dui) {
    return { planFilter: "Day1" };
  }

  // CHECK If age >71 > Guaranteed+
  if (isAgeGreaterThanOrEqual(state, AGE_THRESHOLDS.DUI_71 + 1)) {
    return { planFilter: "Guaranteed+", followUps };
  }

  // CHECK combination rules in Q18
  // If Question 8 answered yes or alcohol quantity 21 and over > Guaranteed+
  if (checkQ8OrAlcohol21Plus(state)) {
    return { planFilter: "Guaranteed+", followUps };
  }

  // Otherwise: Have you had 2 or more DUIs?
  if (answer.multipleDUIs === true) {
    return { planFilter: "Guaranteed+", followUps };
  }

  return { planFilter: "Day1+", followUps };
}

/**
 * Evaluates rules for Q9 (Criminal)
 */
export function evaluateQ9Rules(
  _state: QuestionnaireClientState,
  answer: Q9Answer
): RuleEvaluationResult {
  if (!answer.criminal) {
    return { planFilter: "Day1" };
  }

  // Multiple charges = DECLINE
  if (answer.multipleCharges === true) {
    return {
      decline: true,
      declineReason: DECLINE_REASONS.Q9_MULTIPLE_CHARGES,
    };
  }

  // Incarceration 6+ months = DECLINE
  if (answer.incarcerated6MonthsPlus === true) {
    return {
      decline: true,
      declineReason: DECLINE_REASONS.Q9_RECENT_INCARCERATION,
    };
  }

  // Based on years since sentence completed
  const years = answer.sentenceCompletedYears ?? 0;
  if (years < YEARS_THRESHOLDS.Q9_SENTENCE.GUARANTEED_PLUS) {
    return { planFilter: "Guaranteed+" };
  }
  if (
    years >= YEARS_THRESHOLDS.Q9_SENTENCE.GUARANTEED_PLUS &&
    years <= YEARS_THRESHOLDS.Q9_SENTENCE.DEFERRED_PLUS
  ) {
    return { planFilter: "Deferred+" };
  }
  return { planFilter: "Signature" };
}

/**
 * Evaluates rules for Q10 (Pending Symptoms/Tests)
 */
export function evaluateQ10Rules(
  _state: QuestionnaireClientState,
  answer: Q10Answer
): RuleEvaluationResult {
  if (answer.pendingSymptoms === true || answer.pendingTests === true) {
    return { planFilter: "Guaranteed+" };
  }
  return { planFilter: "Day1" };
}

/**
 * Evaluates rules for Q11 (Heart Disease)
 * Checks BMI >= 44.0 for decline
 */
export function evaluateQ11Rules(
  state: QuestionnaireClientState,
  answer: Q11Answer
): RuleEvaluationResult {
  const followUps = answer.heartDisease
    ? getFollowUpsForQuestion("q11")
    : [];

  if (!answer.heartDisease) {
    return { planFilter: "Day1" };
  }

  const bmi = state.bmi ?? 0;

  // CHECK If BMI >= 44.0 > DECLINE
  if (bmi >= BMI_CONDITION_THRESHOLDS.Q11_DECLINE) {
    return {
      decline: true,
      declineReason: DECLINE_REASONS.Q11_BMI_HIGH,
    };
  }

  // Are you currently free of symptoms, stable with regular follow-up with no pending surgery?
  if (answer.stable !== true) {
    // If NO > Deferred+ CHECK if smoker Guaranteed+
    if (isSmoker(state)) {
      return { planFilter: "Guaranteed+", followUps };
    }
    return { planFilter: "Deferred+", followUps };
  }

  // If YES > When were you diagnosed?
  const diagnosedYears = answer.diagnosedYears ?? 0;
  const age = state.age ?? 0;

  // <= 3 years
  if (diagnosedYears <= YEARS_THRESHOLDS.Q11_DIAGNOSIS.DEFERRED_PLUS) {
    if (age < AGE_THRESHOLDS.NEUROMUSCULAR_40 || isSmoker(state)) {
      return { planFilter: "Guaranteed+", followUps };
    }
    return { planFilter: "Deferred+", followUps };
  }

  // > 3 years
  const lastFollowUpYears = answer.lastFollowUpYears ?? 0;

  // < 2 years ago
  if (lastFollowUpYears < YEARS_THRESHOLDS.Q11_DIAGNOSIS.FOLLOW_UP) {
    if (bmi < BMI_CONDITION_THRESHOLDS.Q11_SIGNATURE) {
      if (age < AGE_THRESHOLDS.NEUROMUSCULAR_40 || isSmoker(state)) {
        return { planFilter: "Deferred+", followUps };
      }
      return { planFilter: "Guaranteed+", followUps };
    }
    if (age < AGE_THRESHOLDS.NEUROMUSCULAR_40 || isSmoker(state)) {
      return { planFilter: "Guaranteed+", followUps };
    }
    return { planFilter: "Guaranteed+", followUps };
  }

  // >= 2 years ago
  if (bmi < BMI_CONDITION_THRESHOLDS.Q11_SIGNATURE) {
    if (age < AGE_THRESHOLDS.NEUROMUSCULAR_40 || isSmoker(state)) {
      return { planFilter: "Guaranteed+", followUps };
    }
    return { planFilter: "Deferred+", followUps };
  }
  return { planFilter: "Guaranteed+", followUps };
}

/**
 * Evaluates rules for Q12 (Diabetes)
 * Very complex rules with multiple checks
 */
export function evaluateQ12Rules(
  state: QuestionnaireClientState,
  answer: Q12Answer
): RuleEvaluationResult {
  const followUps = answer.diabetes ? getFollowUpsForQuestion("q12") : [];

  if (!answer.diabetes) {
    return { planFilter: "Day1" };
  }

  const bmi = state.bmi ?? 0;
  const age = state.age ?? 0;
  const gender = state.gender;
  const hasCADCondition = hasCAD(state);
  const isPregnant: boolean = state.answers.q2?.pregnancy === true;

  // Type 1 Diabetes
  if (answer.type1 === true) {
    // CHECK If BMI >40 OR YES TO CAD Q11 (CAD) > Guaranteed+
    if (bmi > BMI_CONDITION_THRESHOLDS.Q12_DECLINE || hasCADCondition) {
      return { planFilter: "Guaranteed+", followUps };
    }

    // Otherwise: Have you ever had complications?
    if (answer.complications === true) {
      return { planFilter: "Guaranteed+", followUps };
    }

    // Have you monitored your blood sugar levels in the last 3 months with an average HbA1c or A1C result of 7.5% or more?
    if ((answer.hba1c ?? 0) >= 7.5) {
      return { planFilter: "Deferred+", followUps };
    }
    return { planFilter: "Guaranteed+", followUps };
  }

  // Female: Gestational Diabetes
  if (
    gender === "female" &&
    answer.gestational === true &&
    isPregnant === true
  ) {
    // CHECK If BMI >40 OR YES TO CAD Q11 (CAD) > Guaranteed+ GO TO NEXT QUESTION
    if (bmi > BMI_CONDITION_THRESHOLDS.Q12_DECLINE || hasCADCondition) {
      return { planFilter: "Guaranteed+", followUps };
    }

    // OTHERWISE > Is your Gestational Diabetes currently under good control with HbA1c or A1C result of 7.5% or less?
    if ((answer.hba1c ?? 0) <= 7.5) {
      return { planFilter: "Signature", followUps };
    }
    return { planFilter: "Deferred+", followUps };
  }

  // Are you currently taking or have you been prescribed any medication to treat your diabetes?
  if (answer.onMedication === true) {
    // CHECK If age 18 to 24 > OR YES TO Q11 (CAD) Deferred+ GO TO NEXT QUESTION
    if (
      (age >= AGE_THRESHOLDS.DIABETES_18 &&
        age <= AGE_THRESHOLDS.DIABETES_24) ||
      hasCADCondition
    ) {
      return { planFilter: "Deferred+", followUps };
    }

    // CHECK BMI >40 > Guaranteed+ GO TO NEXT QUESTION
    if (bmi > BMI_CONDITION_THRESHOLDS.Q12_DECLINE) {
      return { planFilter: "Guaranteed+", followUps };
    }

    // OTHERWISE: Have you monitored your blood sugar levels in the last 3 months with an average HbA1c or A1C result of 7.5% or more?
    if ((answer.hba1c ?? 0) >= 7.5) {
      // CHECK BMI 38-39.0 >Deferred+, 36-37.9 > Signature, 18-36 > Day1+
      if (
        bmi >= BMI_CONDITION_THRESHOLDS.Q12_DEFERRED.min &&
        bmi <= BMI_CONDITION_THRESHOLDS.Q12_DEFERRED.max
      ) {
        return { planFilter: "Deferred+", followUps };
      }
      if (
        bmi >= BMI_CONDITION_THRESHOLDS.Q12_SIGNATURE.min &&
        bmi <= BMI_CONDITION_THRESHOLDS.Q12_SIGNATURE.max
      ) {
        return { planFilter: "Signature", followUps };
      }
      if (
        bmi >= BMI_CONDITION_THRESHOLDS.Q12_DAY1_PLUS.min &&
        bmi <= BMI_CONDITION_THRESHOLDS.Q12_DAY1_PLUS.max
      ) {
        return { planFilter: "Day1+", followUps };
      }
      return { planFilter: "Deferred+", followUps };
    }
    return { planFilter: "Day1+", followUps };
  }

  return { planFilter: "Day1", followUps };
}

/**
 * Evaluates rules for Q13 (Cancer)
 */
export function evaluateQ13Rules(
  _state: QuestionnaireClientState,
  answer: Q13Answer
): RuleEvaluationResult {
  if (!answer.cancer) {
    return { planFilter: "Day1" };
  }
  return { planFilter: "Deferred+" };
}

/**
 * Evaluates rules for Q14 (Immune Disorder)
 */
export function evaluateQ14Rules(
  _state: QuestionnaireClientState,
  answer: Q14Answer
): RuleEvaluationResult {
  if (!answer.immuneDisorder) {
    return { planFilter: "Day1" };
  }
  return { planFilter: "Guaranteed+" };
}

/**
 * Evaluates rules for Q15 (Respiratory)
 * Checks Q11 and smoker status
 * Structure: COPD/etc → sleep apnea → asthma
 */
export function evaluateQ15Rules(
  state: QuestionnaireClientState,
  answer: Q15Answer
): RuleEvaluationResult {
  // If YES to respiratory (COPD, emphysema, CF)
  if (answer.respiratory === true) {
    // Have you been on oxygen therapy in the last 2 years?
    if (answer.oxygenTherapy === true) {
      return { planFilter: "Guaranteed+" };
    }
    // If NO > Deferred+ CHECK If YES to Q11 (CAD) or SMOKER Guaranteed+
    if (hasCAD(state) || isSmoker(state)) {
      return { planFilter: "Guaranteed+" };
    }
    return { planFilter: "Deferred+" };
  }

  // If NO to respiratory > Have you been diagnosed, treated, or been prescribed treatment for sleep apnea?
  if (answer.sleepApnea === true) {
    // Do you use a treatment everyday such as a BIPAP, CPAP, or any other machine or oral appliance?
    if (answer.sleepApneaDailyTreatment === true) {
      // If YES > Day1+ CHECK If YES to Q11 (CAD) > Signature
      if (hasCAD(state)) {
        return { planFilter: "Signature" };
      }
      return { planFilter: "Day1+" };
    }
    // If NO > Signature CHECK If YES to Q11 (CAD) > Deferred+
    if (hasCAD(state)) {
      return { planFilter: "Deferred+" };
    }
    return { planFilter: "Signature" };
  }

  // If NO to sleep apnea > Have you ever been diagnosed with asthma or chronic bronchitis?
  if (answer.asthma === true) {
    // Have you been prescribed steroids, take 2 or more daily inhalers, admitted or hospitalized
    // (within the last 12 hours) to control your asthma symptoms within the last 2 years?
    if (answer.asthmaSeverity === "severe") {
      // If YES > Signature CHECK if SMOKER Deferred+
      if (isSmoker(state)) {
        return { planFilter: "Deferred+" };
      }
      return { planFilter: "Signature" };
    }
    // If NO > Day1+
    return { planFilter: "Day1+" };
  }

  // If NO to all > Day1
  return { planFilter: "Day1" };
}

/**
 * Evaluates rules for Q16 (Genitourinary)
 */
export function evaluateQ16Rules(
  _state: QuestionnaireClientState,
  answer: Q16Answer
): RuleEvaluationResult {
  const hasGenitourinaryHistory =
    answer.everDiagnosed === true || answer.diagnosedLast2Years === true;
  const followUps = hasGenitourinaryHistory
    ? getFollowUpsForQuestion("q16")
    : [];

  if (answer.everDiagnosed) {
    return { planFilter: "Deferred+", followUps };
  }

  if (answer.diagnosedLast2Years) {
    if (answer.followUpNormal === true) {
      return { planFilter: "Day1+", followUps };
    }
    return { planFilter: "Deferred+", followUps };
  }

  return { planFilter: "Day1" };
}

/**
 * Evaluates rules for Q17 (Neurological)
 * Checks Q18
 */
export function evaluateQ17Rules(
  state: QuestionnaireClientState,
  answer: Q17Answer
): RuleEvaluationResult {
  if (!answer.neurological) {
    return { planFilter: "Day1" };
  }

  // Were you diagnosed with only seizure or epilepsy disorder?
  if (answer.seizures !== true) {
    // CHECK If YES TO Q18 Guaranteed+, OTHERWISE: Deferred+
    if (hasSevereMentalHealth(state) || hasModerateMentalHealth(state)) {
      return { planFilter: "Guaranteed+" };
    }
    return { planFilter: "Deferred+" };
  }

  // Seizures: How many seizures have you had in the last 12 months?
  const seizures = answer.seizuresLast12Months ?? 0;

  // 0 seizures
  if (seizures === SEIZURE_FREQUENCY.NONE) {
    // CHECK If YES TO Q18 Signature+, OTHERWISE: Day1+
    if (hasSevereMentalHealth(state) || hasModerateMentalHealth(state)) {
      return { planFilter: "Signature" };
    }
    return { planFilter: "Day1+" };
  }

  // 1-3 seizures
  if (
    seizures >= SEIZURE_FREQUENCY.LOW.min &&
    seizures <= SEIZURE_FREQUENCY.LOW.max
  ) {
    // Are you currently prescribed more than 1 medication?
    if (answer.multipleMedications === true) {
      // CHECK If YES TO Q18 Guaranteed+, OTHERWISE: Deferred+
      if (hasSevereMentalHealth(state) || hasModerateMentalHealth(state)) {
        return { planFilter: "Guaranteed+" };
      }
      return { planFilter: "Deferred+" };
    }
    return { planFilter: "Signature" };
  }

  // 4-6 seizures
  if (
    seizures >= SEIZURE_FREQUENCY.MODERATE.min &&
    seizures <= SEIZURE_FREQUENCY.MODERATE.max
  ) {
    // Are you currently prescribed more than 1 medication?
    if (answer.multipleMedications === true) {
      return { planFilter: "Guaranteed+" };
    }
    return { planFilter: "Deferred+" };
  }

  // 7+ seizures
  return { planFilter: "Guaranteed+" };
}

/**
 * Evaluates rules for Q18 (Mental Health)
 * Checks Q6, Q8, Q4 combination rules
 */
export function evaluateQ18Rules(
  state: QuestionnaireClientState,
  answer: Q18Answer
): RuleEvaluationResult {
  const shouldQueueFollowUps =
    answer.severeMentalHealth === true || answer.moderateMentalHealth === true;
  const followUps = shouldQueueFollowUps
    ? getFollowUpsForQuestion("q18")
    : [];

  // CHECK If Question 6 answered Yes but no to #8 or alcohol quantity 21 and over - combination rule in question 6 applies.
  // If Question 8 answered yes or alcohol quantity 21 and over > Guaranteed+
  if (checkQ6CombinationRule(state) || checkQ8OrAlcohol21Plus(state)) {
    return { planFilter: "Guaranteed+", followUps };
  }

  // Severe mental health
  if (answer.severeMentalHealth === true) {
    // Are you currently prescribed 3 or more medications to control your symptoms?
    if ((answer.medicationsCount ?? 0) >= 3) {
      return { planFilter: "Deferred+", followUps };
    }
    return { planFilter: "Signature", followUps };
  }

  // Moderate mental health
  if (answer.moderateMentalHealth === true) {
    // CHECK if Question 6 answered Yes but no to #8 or alcohol quantity 21 and over - combination rule in question 6 applies.
    // If Question 8 answered yes or alcohol quantity 21 and over > Deferred +
    if (checkQ6CombinationRule(state) || checkQ8OrAlcohol21Plus(state)) {
      return { planFilter: "Deferred+", followUps };
    }
    return { planFilter: "Day1+", followUps };
  }

  return { planFilter: "Day1", followUps };
}

/**
 * Evaluates rules for Q19 (Digestive)
 * Checks BMI < 18
 */
export function evaluateQ19Rules(
  state: QuestionnaireClientState,
  answer: Q19Answer
): RuleEvaluationResult {
  if (!answer.digestive) {
    return { planFilter: "Day1" };
  }

  const bmi = state.bmi ?? 0;

  // CHECK If BMI < 18 Guaranteed+
  if (bmi < BMI_CONDITION_THRESHOLDS.Q19_GUARANTEED_PLUS) {
    return { planFilter: "Guaranteed+" };
  }

  // Were you diagnosed with diverticulitis, Crohn's disease, or ulcerative colitis more than 12 months ago?
  if (answer.crohnsUC !== true) {
    return { planFilter: "Deferred+" };
  }

  // Have you had a routine medical follow-up or surveillance in the past 2 years?
  const followUpYears = answer.followUpYears ?? 0;
  if (followUpYears >= YEARS_THRESHOLDS.Q19_DIGESTIVE.FOLLOW_UP) {
    return { planFilter: "Deferred+" };
  }

  // Have you had 2 surgeries or more within the last 5 years, missed any time off work/school in the last 2 years,
  // been hospitalized within the last 2 years, or had a flare within the last 12 months?
  const surgeries = answer.surgeries ?? 0;
  if (surgeries >= 2 || answer.flareLast12Months === true) {
    return { planFilter: "Signature" };
  }

  // CHECK If BMI 18-20 Signature, OTHERWISE Day1+
  if (
    bmi >= BMI_CONDITION_THRESHOLDS.Q19_SIGNATURE.min &&
    bmi <= BMI_CONDITION_THRESHOLDS.Q19_SIGNATURE.max
  ) {
    return { planFilter: "Signature" };
  }
  return { planFilter: "Day1+" };
}

/**
 * Evaluates rules for Q20 (Endocrine)
 */
export function evaluateQ20Rules(
  _state: QuestionnaireClientState,
  answer: Q20Answer
): RuleEvaluationResult {
  if (!answer.endocrine) {
    return { planFilter: "Day1" };
  }
  return { planFilter: "Signature" };
}

/**
 * Evaluates rules for Q21 (Neuromuscular)
 * Checks Q18 and age
 */
export function evaluateQ21Rules(
  state: QuestionnaireClientState,
  answer: Q21Answer
): RuleEvaluationResult {
  if (!answer.neuromuscular) {
    return { planFilter: "Day1" };
  }

  // In the last 2 years, were you diagnosed with multiple sclerosis, progressive pattern with loss of bowel, or bladder function?
  if (answer.msProgressive === true) {
    return { planFilter: "Guaranteed+" };
  }

  const age = state.age ?? 0;
  const q18Answer = state.answers.q18;
  const q18Tier =
    q18Answer?.severeMentalHealth === true
      ? "Signature"
      : q18Answer?.moderateMentalHealth === true
        ? "Day1+"
        : "Day1";

  // AGE CHECK If Age >40 or if >Signature for #18 > Guaranteed+
  if (
    age > AGE_THRESHOLDS.NEUROMUSCULAR_40 ||
    PLAN_PRIORITY[q18Tier] > PLAN_PRIORITY.Signature
  ) {
    return { planFilter: "Guaranteed+" };
  }

  // Do you currently have ambulatory or disability issues, or have you had more than 2 attacks in the 12 months?
  if (
    answer.ambulatoryIssues === true ||
    (answer.attacksLast12Months ?? 0) > 2
  ) {
    return { planFilter: "Deferred+" };
  }

  return { planFilter: "Signature" };
}

/**
 * Evaluates rules for Q22 (Arthritis)
 * Checks Q12, Q16, BMI >43
 */
export function evaluateQ22Rules(
  state: QuestionnaireClientState,
  answer: Q22Answer
): RuleEvaluationResult {
  if (!answer.arthritis) {
    return { planFilter: "Day1" };
  }

  const bmi = state.bmi ?? 0;
  const age = state.age ?? 0;
  const hasQ12 = state.answers.q12?.diabetes === true;
  const hasQ16 =
    state.answers.q16?.everDiagnosed === true ||
    state.answers.q16?.diagnosedLast2Years === true;

  // if YES to #12, #16, or If BMI >43 -> Guaranteed+
  if (hasQ12 || hasQ16 || bmi > BMI_CONDITION_THRESHOLDS.Q22_GUARANTEED_PLUS) {
    return { planFilter: "Guaranteed+" };
  }

  // Have you ever experienced daily symptoms such as loss of movement or disability, or have you ever undergone surgery to treat your condition?
  if (answer.dailySymptoms === true || answer.surgery === true) {
    return { planFilter: "Signature" };
  }

  // Are you currently on any prescribed daily medication to control your symptoms?
  if (answer.onMedication === true) {
    // CHECK If Age < 40 Signature, OTHERWISE Day1+
    if (age < AGE_THRESHOLDS.ARTHRITIS_40) {
      return { planFilter: "Signature" };
    }
    return { planFilter: "Day1+" };
  }

  return { planFilter: "Day1" };
}

/**
 * Evaluates rules for Q23 (Extreme Sports)
 */
export function evaluateQ23Rules(
  _state: QuestionnaireClientState,
  answer: Q23Answer
): RuleEvaluationResult {
  if (!answer.extremeSports) {
    return { planFilter: "Day1" };
  }

  if (answer.highestRisk === true) {
    return { planFilter: "Guaranteed+" };
  }
  if (answer.moderateRisk === true) {
    return { planFilter: "Signature" };
  }
  return { planFilter: "Day1+" };
}

/**
 * Evaluates rules for Q24 (Family History)
 */
export function evaluateQ24Rules(
  _state: QuestionnaireClientState,
  answer: Q24Answer
): RuleEvaluationResult {
  if (!answer.familyHistory) {
    return { planFilter: "Day1" };
  }

  // Hereditary conditions before age 65 = Deferred+
  if (answer.hereditary === true) {
    return { planFilter: "Deferred+" };
  }

  // Multiple conditions before age 60
  if (answer.multipleBefore60 === true) {
    // Has 1 or more immediate family members been diagnosed before the age of 50?
    if (answer.oneBefore50 === true) {
      return { planFilter: "Signature" };
    }
    return { planFilter: "Day1+" };
  }

  return { planFilter: "Day1" };
}

/**
 * Evaluates rules for Q25 (High-Risk Travel)
 */
export function evaluateQ25Rules(
  _state: QuestionnaireClientState,
  answer: Q25Answer
): RuleEvaluationResult {
  if (!answer.highRiskTravel) {
    // Within the next 12 months, do you intend to reside outside of Canada for at least six consecutive months?
    if (answer.resideOutside6Months === true) {
      return { planFilter: "Day1+" };
    }
    return { planFilter: "Day1" };
  }
  return { planFilter: "Guaranteed+" };
}

/**
 * Main rule evaluation dispatcher
 * Evaluates rules for a specific question and updates state accordingly
 */
export function evaluateRules(
  state: QuestionnaireClientState,
  questionId: string,
  answer: any
): RuleEvaluationResult {
  switch (questionId) {
    case "q1":
      return evaluateQ1Rules(state, answer as Q1Answer);
    case "q2":
      return evaluateQ2Rules(state, answer as Q2Answer);
    case "q3":
      return evaluateQ3Rules(state, answer as Q3Answer);
    case "q4":
      return evaluateQ4Rules(state, answer as Q4Answer);
    case "q5":
      return evaluateQ5Rules(state, answer as Q5Answer);
    case "q6":
      return evaluateQ6Rules(state, answer as Q6Answer);
    case "q7":
      return evaluateQ7Rules(state, answer as Q7Answer);
    case "q8":
      return evaluateQ8Rules(state, answer as Q8Answer);
    case "q9":
      return evaluateQ9Rules(state, answer as Q9Answer);
    case "q10":
      return evaluateQ10Rules(state, answer as Q10Answer);
    case "q11":
      return evaluateQ11Rules(state, answer as Q11Answer);
    case "q12":
      return evaluateQ12Rules(state, answer as Q12Answer);
    case "q13":
      return evaluateQ13Rules(state, answer as Q13Answer);
    case "q14":
      return evaluateQ14Rules(state, answer as Q14Answer);
    case "q15":
      return evaluateQ15Rules(state, answer as Q15Answer);
    case "q16":
      return evaluateQ16Rules(state, answer as Q16Answer);
    case "q17":
      return evaluateQ17Rules(state, answer as Q17Answer);
    case "q18":
      return evaluateQ18Rules(state, answer as Q18Answer);
    case "q19":
      return evaluateQ19Rules(state, answer as Q19Answer);
    case "q20":
      return evaluateQ20Rules(state, answer as Q20Answer);
    case "q21":
      return evaluateQ21Rules(state, answer as Q21Answer);
    case "q22":
      return evaluateQ22Rules(state, answer as Q22Answer);
    case "q23":
      return evaluateQ23Rules(state, answer as Q23Answer);
    case "q24":
      return evaluateQ24Rules(state, answer as Q24Answer);
    case "q25":
      return evaluateQ25Rules(state, answer as Q25Answer);
    default:
      return {};
  }
}

/**
 * Applies rule evaluation result to state
 * This function updates the state based on the rule evaluation result
 */
export function applyRuleResult(
  state: QuestionnaireClientState,
  result: RuleEvaluationResult
): QuestionnaireClientState {
  let newState = { ...state };

  // Apply decline
  if (result.decline === true) {
    newState.declined = true;
    newState.declineReason = result.declineReason;
    newState.eligiblePlans = [];
    newState.followUpQueue = [];
    newState.currentPlan = "DECLINE";
    newState.recommendedPlan = "DECLINE";
    newState.planFloor = "DECLINE";
    newState.completed = true;
    newState.completedAt = new Date().toISOString();
    return newState;
  }

  // Apply plan filter
  if (result.planFilter) {
    newState.eligiblePlans = filterPlansByMinimumTier(
      newState.eligiblePlans,
      result.planFilter
    );
    newState = updatePlanFloor(newState, result.planFilter);
  }

  // Queue follow-up questions
  if (result.followUps && result.followUps.length > 0) {
    newState = enqueueFollowUpQuestions(newState, result.followUps);
  }

  if (result.planFloorUpdate) {
    newState = updatePlanFloor(newState, result.planFloorUpdate);
  }

  // Apply state updates
  if (result.updateState) {
    newState = { ...newState, ...result.updateState };
  }

  return updateRecommendedPlan(newState);
}
