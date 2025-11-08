import type { PlanOutcome, PlanTier } from "./types";

// Plan Tiers in priority order (best to worst)
export const PLAN_TIERS: PlanTier[] = [
  "Day1",
  "Day1+",
  "Signature",
  "Deferred+",
  "Guaranteed+",
];

export const PLAN_PRIORITY: Record<PlanOutcome, number> = {
  "Day1": 1,
  "Day1+": 2,
  "Signature": 3,
  "Deferred+": 4,
  "Guaranteed+": 5,
  "DECLINE": 6,
};

// Mandatory questions that must be asked first
export const MANDATORY_QUESTIONS = [
  "gender",
  "q1", // Tobacco
  "q2", // Height/Weight/BMI
] as const;

// Question dependencies - questions that require other questions to be answered first
export const QUESTION_DEPENDENCIES: Record<string, string[]> = {
  // Q4 (alcohol) - Can be asked independently, but if 21-28 drinks/week, judgment deferred until Q18 is answered
  // q4: removed q18 dependency - Q4 should be asked early, rule evaluation handles Q18 check when needed
  // Q6 (illicit drugs) - Can be asked independently, but checks Q18 and Q4 for combination rules
  q6: ["q4"], // Q6 depends on Q4 for alcohol quantity check (lines 56, 57, 63), but Q18 check is handled in rule evaluation
  q7: ["q4", "q6"], // Q7 (treatment) - "CHECK Q4 If YES AND YES to Treatment for alcohol consumption only" and "CHECK Q6 If YES AND NO to Treatment for alcohol consumption only" (lines 68, 74)
  // Q8 (DUI) - Can be asked independently, but if YES, judgment deferred until Q18 is answered for combination rules
  // q8: removed q18 dependency - Q8 should be asked early, rule evaluation handles Q18 check when needed
  q11: ["q2"], // Q11 (heart disease) - "CHECK If BMI >= 44.0" requires BMI from Q2 (line 104)
  q12: ["q11", "q2"], // Q12 (diabetes) - "CHECK If YES TO Q11 (CAD)" and BMI checks (lines 116, 121, 126, 132, 142, 146)
  q15: ["q11"], // Q15 (respiratory) - "CHECK If YES to Q11 (CAD)" (lines 160, 168, 169)
  q17: ["q18"], // Q17 (neurological) - "CHECK If YES TO Q18" (lines 188, 190, 193)
  // Q18 depends on Q4, Q6, Q8 for evaluation (checks "alcohol quantity 21 and over" from Q4)
  // but Q18 can be asked independently - rules will re-evaluate after dependencies are answered
  // q18: removed dependencies - Q18 should be asked independently, rule evaluation handles Q4/Q6/Q8 checks when needed
  q19: ["q2"], // Q19 (digestive) - "CHECK If BMI < 18" requires BMI from Q2 (line 214)
  q21: ["q18"], // Q21 (neuromuscular) - "CHECK if >Signature for #18" (line 225)
  q22: ["q12", "q16", "q2"], // Q22 (arthritis) - "if YES to #12, #16, or If BMI >43" (line 231)
};

// Worst-case plan outcome (or decline) each question can trigger
export const QUESTION_WORST_OUTCOME: Record<string, PlanOutcome | null> = {
  gender: null,
  q1: null,
  q2: "Guaranteed+",
  q3: "Deferred+",
  q4: "Guaranteed+",
  q5: "Guaranteed+",
  q6: "DECLINE",
  q7: "DECLINE",
  q8: "Guaranteed+",
  q9: "DECLINE",
  q10: "Guaranteed+",
  q11: "DECLINE",
  q12: "Guaranteed+",
  q13: "Deferred+",
  q14: "Guaranteed+",
  q15: "Guaranteed+",
  q16: "Deferred+",
  q17: "Guaranteed+",
  q18: "Guaranteed+",
  q19: "Guaranteed+",
  q20: "Signature",
  q21: "Guaranteed+",
  q22: "Guaranteed+",
  q23: "Guaranteed+",
  q24: "Deferred+",
  q25: "Guaranteed+",
};

export const DECLINE_QUESTION_IDS = Object.entries(QUESTION_WORST_OUTCOME)
  .filter(([, outcome]) => outcome === "DECLINE")
  .map(([questionId]) => questionId);

// Decline reasons mapped to question IDs
export const DECLINE_REASONS = {
  Q6_RECENT_USE: "Recent illicit drug use (< 1 year)",
  Q6_WITH_MENTAL_HEALTH: "Illicit drug use with mental health conditions (1-2 years)",
  Q6_WITH_ALCOHOL:"Illicit drug use with high alcohol consumption (21+ drinks/week) (1-2 years)",
  Q7_ALCOHOL_TREATMENT: "Alcohol treatment with current alcohol use ",
  Q7_DRUG_TREATMENT: "Drug treatment with recent drug use",
  Q9_MULTIPLE_CHARGES: "Multiple criminal charges (2 or more times) or charges/sentencing currently pending",
  Q9_RECENT_INCARCERATION: "Recent incarceration (6+ months)",
  Q11_BMI_HIGH: "Heart disease with BMI >= 44.0",
} as const;

// BMI ranges for Q2
export const BMI_RANGES = {
  VERY_LOW: { min: 0, max: 17.0, plan: "Guaranteed+" as PlanTier },
  LOW: { min: 17.1, max: 38.0, plan: "Day1" as PlanTier },
  MODERATE: { min: 38.1, max: 40.0, plan: "Day1+" as PlanTier },
  HIGH: { min: 40.1, max: 43.0, plan: "Signature" as PlanTier },
  VERY_HIGH: { min: 43.1, max: 44.0, plan: "Deferred+" as PlanTier },
  EXTREME: { min: 44.1, max: Number.POSITIVE_INFINITY,  plan: "Guaranteed+" as PlanTier },
} as const;

// Age thresholds
export const AGE_THRESHOLDS = {
  MARIJUANA_25: 25, // Age threshold for marijuana frequency rules
  MARIJUANA_26: 26, // Age threshold for marijuana frequency rules
  DIABETES_18: 18, // Minimum age for diabetes rules
  DIABETES_24: 24, // Maximum age for diabetes rules
  FAMILY_HISTORY_50: 50, // Age threshold for family history
  FAMILY_HISTORY_60: 60, // Age threshold for family history
  FAMILY_HISTORY_65: 65, // Age threshold for hereditary conditions
  DUI_71: 71, // Age threshold for DUI rules
  NEUROMUSCULAR_40: 40, // Age threshold for neuromuscular conditions
  ARTHRITIS_40: 40, // Age threshold for arthritis
} as const;

// Alcohol consumption thresholds (drinks per week)
export const ALCOHOL_THRESHOLDS = {
  LOW: 14, // < 14 = Day1
  MODERATE: 20, // 14-20 = Day1+
  HIGH: 21, // 21-28 = Signature (with conditions) or Guaranteed+
  VERY_HIGH: 28, // > 28 = Guaranteed+
} as const;

// Marijuana frequency thresholds (times per week)
export const MARIJUANA_FREQUENCY = {
  LOW: { min: 1, max: 3 }, // 1-3 times/week
  MODERATE: { min: 4, max: 7 }, // 4-7 times/week
  HIGH: { min: 8, max: 14 }, // 8-14 times/week
  VERY_HIGH: { min: 15, max: Number.POSITIVE_INFINITY }, // 15+ times/week
} as const;

// Years thresholds for various questions
export const YEARS_THRESHOLDS = {
  Q6_DRUG_USE: {
    DECLINE: 1, // < 1 year = DECLINE
    GUARANTEED_PLUS: 2, // 1-2 years
    SIGNATURE: 5, // 2-5 years
    DAY1_PLUS: 10, // 5-10 years
    DAY1: 10, // >= 10 years
  },
  Q7_TREATMENT: {
    GUARANTEED_PLUS: 1, // < 1 year
    DEFERRED_PLUS: 2, // 1-2 years
    SIGNATURE: 5, // 2-5 years
    DAY1_PLUS: 10, // 5-10 years
    DAY1: 10, // >= 10 years
  },
  Q9_SENTENCE: {
    GUARANTEED_PLUS: 3, // < 3 years
    DEFERRED_PLUS: 5, // 3-5 years
    SIGNATURE: 5, // > 5 years
  },
  Q11_DIAGNOSIS: {
    DEFERRED_PLUS: 3, // <= 3 years
    FOLLOW_UP: 2, // < 2 years ago for follow-up
  },
  Q12_GESTATIONAL: {
    WITHIN_LAST: 2, // Gestational diabetes within last 2 years
  },
  Q13_CANCER: {
    WITHIN_LAST: 10, // Cancer within last 10 years
  },
  Q15_OXYGEN: {
    WITHIN_LAST: 2, // Oxygen therapy within last 2 years
  },
  Q15_ASTHMA: {
    WITHIN_LAST: 2, // Asthma hospitalization within last 2 years
  },
  Q16_FOLLOW_UP: {
    WITHIN_LAST: 2, // Diagnosis within last 2 years
    NORMAL_FOLLOW_UP: 12, // Normal follow-up within last 12 months
  },
  Q17_SEIZURES: {
    WITHIN_LAST: 12, // Seizures within last 12 months
  },
  Q18_MENTAL_HEALTH: {
    WITHIN_LAST: 24, // Severe anxiety/depression within last 24 months
  },
  Q19_DIGESTIVE: {
    DIAGNOSIS: 12, // Diagnosed more than 12 months ago
    FOLLOW_UP: 2, // Follow-up within past 2 years
    SURGERY: 5, // Surgeries within last 5 years
    HOSPITALIZATION: 2, // Hospitalized within last 2 years
    FLARE: 12, // Flare within last 12 months
  },
  Q21_MS: {
    WITHIN_LAST: 2, // MS diagnosis within last 2 years
    ATTACKS: 12, // Attacks within last 12 months
  },
  Q23_EXTREME_SPORTS: {
    WITHIN_LAST: 2, // Participation within last 2 years
    NEXT: 12, // Intend to participate in next 12 months
  },
  Q24_FAMILY_HISTORY: {
    HEREDITARY: 65, // Hereditary conditions before age 65
    MULTIPLE: 60, // Multiple conditions before age 60
    SINGLE: 50, // Single condition before age 50
  },
  Q25_TRAVEL: {
    NEXT: 12, // Travel in next 12 months
    RESIDE: 6, // Reside outside Canada for 6+ months
  },
} as const;

// BMI thresholds for specific conditions
export const BMI_CONDITION_THRESHOLDS = {
  Q11_DECLINE: 44.0, // Heart disease with BMI >= 44.0 = DECLINE
  Q11_SIGNATURE: 40.0, // Heart disease with BMI < 40 = Signature
  Q12_DECLINE: 40.0, // Diabetes with BMI > 40 = Guaranteed+
  Q12_DEFERRED: { min: 38.0, max: 39.0 }, // Diabetes BMI 38-39.0 = Deferred+
  Q12_SIGNATURE: { min: 36.0, max: 37.9 }, // Diabetes BMI 36-37.9 = Signature
  Q12_DAY1_PLUS: { min: 18.0, max: 36.0 }, // Diabetes BMI 18-36 = Day1+
  Q19_GUARANTEED_PLUS: 18.0, // Digestive disorders with BMI < 18 = Guaranteed+
  Q19_SIGNATURE: { min: 18.0, max: 20.0 }, // Digestive disorders BMI 18-20 = Signature
  Q22_GUARANTEED_PLUS: 43.0, // Arthritis with BMI > 43 = Guaranteed+
} as const;

// Seizure frequency thresholds
export const SEIZURE_FREQUENCY = {
  NONE: 0, // 0 seizures
  LOW: { min: 1, max: 3 }, // 1-3 seizures
  MODERATE: { min: 4, max: 6 }, // 4-6 seizures
  HIGH: { min: 7, max: Number.POSITIVE_INFINITY }, // 7+ seizures
} as const;

// Mental health medication thresholds
export const MENTAL_HEALTH_MEDICATIONS = {
  SEVERE: 3, // 3+ medications for severe mental health = Deferred+
  MODERATE: 0, // Any medications for moderate mental health = Day1+
} as const;

// High-risk occupations for Q3
export const HIGH_RISK_OCCUPATIONS = [
  "commercial diving",
  "deep-sea construction",
  "salvage",
  "demolition diver",
  "marine harvesting",
  "oil rig",
  "cable laying",
  "pipe laying",
  "diplomat",
  "politician",
  "journalist travelling in high-risk countries",
  "military personnel deployed",
  "military personnel under order to deploy in the next 12 months",
  "stunt work",
  "exotic dancer",
  "adult film industry",
] as const;

// Moderate-risk occupations for Q3
export const MODERATE_RISK_OCCUPATIONS = [
  "working at heights over 30 ft (10m)",
  "offshore fishing",
  "underground mining",
  "offshore mining",
  "logging",
  "forestry (excluding log hauler)",
  "hydro lineman",
  "power lineman",
  "pilot (except on a scheduled commercial airline)",
] as const;

// Experimental drugs (Q6)
export const EXPERIMENTAL_DRUGS = [
  "ecstasy",
  "speed",
  "hallucinogens",
] as const;

// Illicit drugs list (Q6)
export const ILLICIT_DRUGS = [
  "amphetamines",
  "anabolic steroids",
  "barbiturates",
  "cocaine",
  "ecstasy",
  "hallucinogens",
  "heroin",
  "methadone",
  "opium",
  "speed",
  "lsd",
  "dmt",
  "morphine", // not prescribed by a doctor or physician
  "demerol", // not prescribed by a doctor or physician
  "codein", // not prescribed by a doctor or physician  
  "codeine", // not prescribed by a doctor or physician
  "fentanyl", // not prescribed by a doctor or physician
] as const;

// Standard alcohol drink definition
export const STANDARD_ALCOHOL_DRINK = {
  BEER: { size: 12, unit: "oz" }, // 12 oz beer
  WINE: { size: 5, unit: "oz" }, // 5 oz wine
  LIQUOR: { size: 1.5, unit: "oz" }, // 1.5 oz liquor
} as const;

// Extreme sports categories (Q23)
export const EXTREME_SPORTS_HIGHEST_RISK = [
  "free solo mountain climbing ",
  "international peaks",
  "peaks > 6000 meters",
  ">= YDS 5.11",
  "NCCS grade VI",
  "base jumping",
  "motor racing with maximum speed above 240 km/h (150 mp/h)",
  "solo scuba diving",
  "night scuba diving",
  "cave scuba diving",
  "wreck scuba diving",
] as const;

export const EXTREME_SPORTS_MODERATE_RISK = [
  "ice climbing",
  "glacier climbing",
  "mountain climbing above 4000 meters",
  "YDS 5.8",
  "NCCS grade V",
  "bungee jumping",
  "hang gliding",
  "paragliding",
  "scuba diving above 45 meters",
] as const;

export const EXTREME_SPORTS_LOW_RISK = [
  "skydiving",
  "heli-skiing",
  "backcountry skiing",
  "backcountry snowmobiling",
  "aviation (excluding passenger or pilot on scheduled flights)",
  "motor racing",
  "kitesurfing",
] as const;

// Hereditary conditions (Q24)
export const HEREDITARY_CONDITIONS = [
  "amyotrophic lateral sclerosis (ALS)",
  "cardiomyopathy",
  "hereditary non-polyposis colon cancer (HNPCC)",
  "huntington's disease",
  "lynch syndrome",
  "muscular dystrophy",
  "polycystic kidney disease",
] as const;

// Family history conditions (Q24)
export const FAMILY_HISTORY_CONDITIONS = [
  "cancer",
  "stroke",
  "heart attack",
  "angina",
  "bypass",
  "angioplasty",
  "multiple sclerosis",
  "motor neuron disease",
  "alzheimer's disease",
  "dementia",
] as const;

// Question flow order (after mandatory questions)
export const QUESTION_ORDER = [
  "q3", // Working
  "q4", // Alcohol
  "q5", // Marijuana
  "q6", // Illicit drugs
  "q7", // Treatment
  "q8", // DUI
  "q9", // Criminal
  "q10", // Pending symptoms/tests
  "q11", // Heart disease
  "q12", // Diabetes
  "q13", // Cancer
  "q14", // Immune disorder
  "q15", // Respiratory
  "q16", // Genitourinary
  "q17", // Neurological
  "q18", // Mental health
  "q19", // Digestive
  "q20", // Endocrine
  "q21", // Neuromuscular
  "q22", // Arthritis
  "q23", // Extreme sports
  "q24", // Family history
  "q25", // High-risk travel
] as const;
