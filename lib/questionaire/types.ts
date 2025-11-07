// lib/questionnaire/types.ts

export type PlanTier =
  | "DECLINE"
  | "Guaranteed+"
  | "Deferred+"
  | "Signature"
  | "Day1+"
  | "Day1";

export type RateType = "SMOKER" | "NON_SMOKER";
export type Gender = "male" | "female";

// Question Answer Types (complete definitions)
export interface Q1Answer {
  tobacco: boolean;
}

export interface Q2Answer {
  bmi: number;
  weightLoss?: boolean;
  pregnancy?: boolean;
  birthLast6Months?: boolean;
  prePregnancyWeight?: number;
}

export interface Q3Answer {
  working: boolean;
  highRiskOccupation?: boolean;
  moderateRiskOccupation?: boolean;
  institutionalized?: boolean;
}

export interface Q4Answer {
  alcohol: boolean;
  drinksPerWeek?: number;
}

export interface Q5Answer {
  marijuana: boolean;
  mixedWithTobacco?: boolean;
  frequencyPerWeek?: number;
}

export interface Q6Answer {
  illicitDrugs: boolean;
  lastUseYears?: number;
  drugTypes?: string[];
  onlyExperimental?: boolean; // Ecstasy, Speed, Hallucinogens only
  totalUses?: number; // For experimental drugs
}

export interface Q7Answer {
  treatment: boolean;
  alcoholOnly?: boolean;
  lastTreatmentYears?: number;
}

export interface Q8Answer {
  dui: boolean;
  multipleDUIs?: boolean;
}

export interface Q9Answer {
  criminal: boolean;
  multipleCharges?: boolean;
  incarcerated6MonthsPlus?: boolean;
  sentenceCompletedYears?: number;
}

export interface Q10Answer {
  pendingSymptoms: boolean;
  pendingTests: boolean;
}

export interface Q11Answer {
  heartDisease: boolean;
  stable?: boolean;
  diagnosedYears?: number;
  lastFollowUpYears?: number;
}

export interface Q12Answer {
  diabetes: boolean;
  type1?: boolean;
  gestational?: boolean;
  complications?: boolean;
  hba1c?: number;
  onMedication?: boolean;
}

export interface Q13Answer {
  cancer: boolean;
}

export interface Q14Answer {
  immuneDisorder: boolean;
}

export interface Q15Answer {
  respiratory: boolean;
  oxygenTherapy?: boolean;
  sleepApnea?: boolean;
  asthma?: boolean;
  asthmaSeverity?: "mild" | "moderate" | "severe";
}

export interface Q16Answer {
  genitourinary: boolean;
  followUpNormal?: boolean;
  abnormalPap?: boolean; // female only
  elevatedPSA?: boolean; // male only
}

export interface Q17Answer {
  neurological: boolean;
  seizures?: boolean;
  seizuresLast12Months?: number;
  multipleMedications?: boolean;
}

export interface Q18Answer {
  severeMentalHealth: boolean;
  moderateMentalHealth?: boolean;
  medicationsCount?: number;
}

export interface Q19Answer {
  digestive: boolean;
  crohnsUC?: boolean;
  followUpYears?: number;
  surgeries?: number;
  flareLast12Months?: boolean;
}

export interface Q20Answer {
  endocrine: boolean;
}

export interface Q21Answer {
  neuromuscular: boolean;
  msProgressive?: boolean;
  ambulatoryIssues?: boolean;
  attacksLast12Months?: number;
}

export interface Q22Answer {
  arthritis: boolean;
  dailySymptoms?: boolean;
  surgery?: boolean;
  onMedication?: boolean;
}

export interface Q23Answer {
  extremeSports: boolean;
  highestRisk?: boolean;
  moderateRisk?: boolean;
}

export interface Q24Answer {
  familyHistory: boolean;
  hereditary?: boolean;
  multipleBefore60?: boolean;
  oneBefore50?: boolean;
}

export interface Q25Answer {
  highRiskTravel: boolean;
  resideOutside6Months?: boolean;
}

// Main Client State
export interface QuestionnaireClientState {
  // Mandatory demographics
  gender?: Gender;
  age?: number;
  height?: number; // cm
  weight?: number; // kg
  bmi?: number; // calculated

  // Rate determination
  rateType?: RateType;

  // All question answers
  answers: {
    q1?: Q1Answer;
    q2?: Q2Answer;
    q3?: Q3Answer;
    q4?: Q4Answer;
    q5?: Q5Answer;
    q6?: Q6Answer;
    q7?: Q7Answer;
    q8?: Q8Answer;
    q9?: Q9Answer;
    q10?: Q10Answer;
    q11?: Q11Answer;
    q12?: Q12Answer;
    q13?: Q13Answer;
    q14?: Q14Answer;
    q15?: Q15Answer;
    q16?: Q16Answer;
    q17?: Q17Answer;
    q18?: Q18Answer;
    q19?: Q19Answer;
    q20?: Q20Answer;
    q21?: Q21Answer;
    q22?: Q22Answer;
    q23?: Q23Answer;
    q24?: Q24Answer;
    q25?: Q25Answer;
  };

  // Eligibility tracking
  eligiblePlans: PlanTier[];
  currentPlan?: PlanTier;
  declined: boolean;
  declineReason?: string;

  // Flow control
  questionsAsked: string[]; // ['gender', 'q1', 'q2', ...]
  questionsAnswered: string[]; // ['gender', 'q1', ...]
  currentQuestion?: string; // 'q2', 'q3', etc.
  completed: boolean;

  // Metadata
  mentionedConditions?: string[]; // Conditions extracted from initial prompt
  startedAt?: string; // ISO timestamp
  completedAt?: string; // ISO timestamp
}

// Question Definition
export interface QuestionDefinition {
  id: string;
  priority: number;
  mandatory: boolean;
  dependencies: string[];
  condition?: (state: QuestionnaireClientState) => boolean;
  getText: (state: QuestionnaireClientState) => string;
  validateAnswer: (
    answer: any,
    state: QuestionnaireClientState
  ) => {
    valid: boolean;
    error?: string;
  };
}

// Rule Evaluation Result
export interface RuleEvaluationResult {
  planFilter?: PlanTier; // Minimum tier required
  decline?: boolean;
  declineReason?: string;
  updateState?: Partial<QuestionnaireClientState>;
}
