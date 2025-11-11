import { clientState } from "./state";

export type PLANS =
  | "Day1"
  | "Day1+"
  | "Signature"
  | "Deferred+"
  | "Guaranteed+";

export type QUESTION_TYPE = {
  id: string;
  text: string;
  answer_type: boolean | number | string;
  resulting_nodes?: string[];
  resulting_plans?: Array<PLANS | "DENIAL">;
};

export function getQuestion(id: string): QUESTION_TYPE | null {
  const question = QUESTIONS.get(id);
  if (!question) {
    console.error(`Could not get question ${id}.`);
    return null;
  }
  return question;
}

export function updateBestPlan(plan: PLANS | "DENIAL"): void {
  const PLAN_PRIORITY: Record<PLANS | "DENIAL", number> = {
    DENIAL: 0,
    "Deferred+": 1,
    "Guaranteed+": 2,
    Day1: 3,
    "Day1+": 4,
    Signature: 5,
  };

  if (PLAN_PRIORITY[plan] < PLAN_PRIORITY[clientState.best_plan]) {
    clientState.best_plan = plan;
  }
}

// Assumptions:
// 1. resulting_nodes contains question IDs (strings) that can be reached from this question
// 2. resulting_plans contains all possible plan outcomes from this question
// 3. Some questions have conditional logic (combo rules) that depend on other questions - these are represented as separate questions
// 4. BMI ranges are handled as numeric ranges in Q2
// 5. Age questions are numeric
// 6. Questions that set flags (like smoker status) don't have resulting_plans but do have resulting_nodes
// 7. We still have to handle the whole Q4 logic of checking Q18, either handle at the rules level or someplace else

export const QUESTIONS = new Map<string, QUESTION_TYPE>([
  // Q1: Tobacco
  [
    "Q1",
    {
      id: "Q1",
      text: "In the past 12 months, excluding large cigars (12 or less), have you used tobacco in any form (not limited to small cigars, cigarillos, electronic cigarettes or vaping, nicotine products or nicotine substitutes such as patch or gum)?",
      answer_type: "boolean",
      resulting_nodes: ["Q2"],
    },
  ],

  // Q2: Height and weight input (BMI calculation)
  [
    "Q2",
    {
      id: "Q2",
      text: "Provide your height and weight (calculate BMI)",
      answer_type: "number", // Height and weight inputs, BMI calculated from these
      resulting_nodes: ["Q2Pregnancy", "Q2WeightLoss", "Q3"],
      resulting_plans: ["Guaranteed+", "Deferred+"],
      // BMI ranges determine routing:
      // ≤17.0: Guaranteed+ → Q3
      // 17.1-38.0: Day1 → Q2Pregnancy (if female) or Q2WeightLoss (if male)
      // 38.1-40.0: Day1+ → Q2Pregnancy (if female) or Q2WeightLoss (if male)
      // 40.1-43.0: Signature → Q2Pregnancy (if female) or Q2WeightLoss (if male)
      // 43.1-44.0: Deferred+ → Q3
      // ≥44.1: Guaranteed+ → Q3
    },
  ],

  // Q2Pregnancy: Pregnancy status (female only, asked when BMI routes to 17.1-43.0 range)
  [
    "Q2Pregnancy",
    {
      id: "Q2Pregnancy",
      text: "[Female only] Are you currently pregnant?",
      answer_type: "boolean",
      resulting_nodes: ["Q2PrePregnancyWeight", "Q2Birth"],
      // If YES → Q2PrePregnancyWeight (provide pre-pregnancy weight, recalculate BMI with base tier)
      // If NO → Q2Birth (check if birth in last 6 months)
    },
  ],

  // Q2PrePregnancyWeight: Pre-pregnancy weight input (female only)
  [
    "Q2PrePregnancyWeight",
    {
      id: "Q2PrePregnancyWeight",
      text: "[Female only] Provide your pre-pregnancy weight (rules based on this new calculated BMI)",
      answer_type: "number",
      resulting_nodes: ["Q3"],
      // BMI recalculated with pre-pregnancy weight, then original BMI tier rules apply
    },
  ],

  // Q2Birth: Birth in last 6 months (female only, if not pregnant)
  [
    "Q2Birth",
    {
      id: "Q2Birth",
      text: "[Female only] Have you given birth in the last 6 months?",
      answer_type: "boolean",
      resulting_nodes: ["Q2PrePregnancyWeight", "Q2WeightLoss"],
      // If YES → Q2PrePregnancyWeight (provide pre-pregnancy weight)
      // If NO → Q2WeightLoss (lost >10% body weight?)
    },
  ],

  // Q2WeightLoss: Unintentional weight loss check
  [
    "Q2WeightLoss",
    {
      id: "Q2WeightLoss",
      text: "Excluding intentional weight loss (such as diet or exercise), have you lost more than 10% of body weight in the past 12 months?",
      answer_type: "boolean",
      resulting_nodes: ["Q3"],
      resulting_plans: ["Deferred+"],
      // If YES → Deferred+ → Q3
      // If NO → Rules based on BMI tier from Q2 → Q3 (base tier persists)
    },
  ],

  // Q3: Currently working
  [
    "Q3",
    {
      id: "Q3",
      text: "Are you currently working?",
      answer_type: "boolean",
      resulting_nodes: ["Q3a", "Q3c"],
    },
  ],

  // Q3a: High-risk duties
  [
    "Q3a",
    {
      id: "Q3a",
      text: "Does your duties involve any of the following: Commercial diving (such as deep-sea construction or salvage, demolition diver, marine harvesting, oil rig, cable or pipe laying), diplomat, politician, journalist travelling in high-risk countries, military personnel deployed or under order to deploy in the next 12 months, stunt work, exotic dancer or in the adult film industry?",
      answer_type: "boolean",
      resulting_nodes: ["Q3b", "Q4"],
      resulting_plans: ["Deferred+"],
    },
  ],

  // Q3b: Medium-risk duties
  [
    "Q3b",
    {
      id: "Q3b",
      text: "Do your duties involve any of the following: Working at heights over 30 ft (10m), offshore fishing, underground or offshore mining, logging, or forestry (excluding log hauler), hydro/power lineman or as a pilot (except on a scheduled commercial airline)?",
      answer_type: "boolean",
      resulting_nodes: ["Q4"],
      resulting_plans: ["Signature", "Day1"],
    },
  ],

  // Q3c: Care facility
  [
    "Q3c",
    {
      id: "Q3c",
      text: "Are you currently receiving care in a hospital, nursing facility, or specialized center for individuals with limited mobility or autonomy, or do you require assistance with daily activities such as being bedridden or using a wheelchair?",
      answer_type: "boolean",
      resulting_nodes: ["Q4"],
      resulting_plans: ["Guaranteed+", "Day1"],
    },
  ],

  // Q4: Consume alcohol
  [
    "Q4",
    {
      id: "Q4",
      text: "Do you consume alcohol?",
      answer_type: "boolean",
      resulting_nodes: ["Q4q", "Q5"],
      resulting_plans: ["Day1"],
    },
  ],

  // Q4q: Average drinks per week
  [
    "Q4q",
    {
      id: "Q4q",
      text: "How many standard alcohol drinks do you consume on average per week? (One standard alcohol drink is comparable to one beer bottle/can (12 oz) or one glass of wine (5 oz) or one shot glass of liquor (1.5 oz))",
      answer_type: "number",
      resulting_nodes: ["Q5"],
      resulting_plans: ["Day1", "Day1+", "Guaranteed+"],
    },
  ],

  // Q5: Marijuana/Cannabis
  [
    "Q5",
    {
      id: "Q5",
      text: "In the last 12 months, have you used marijuana, hashish or cannabis in any form (inhalation, ingestion, patches, or other)?",
      answer_type: "boolean",
      resulting_nodes: ["Q5mix", "Q6"],
      resulting_plans: ["Day1"],
    },
  ],

  // Q5mix: Mix with tobacco
  [
    "Q5mix",
    {
      id: "Q5mix",
      text: "Do you mix marijuana, cannabis or hashish with tobacco?",
      answer_type: "boolean",
      resulting_nodes: ["Q5freq"],
    },
  ],

  // Q5freq: Frequency per week
  [
    "Q5freq",
    {
      id: "Q5freq",
      text: "How often do you smoke per week?",
      answer_type: "number",
      resulting_nodes: ["Q6"],
      resulting_plans: [
        "Guaranteed+",
        "Deferred+",
        "Signature",
        "Day1+",
        "Day1",
      ],
    },
  ],

  // Q6: Other illicit drugs
  [
    "Q6",
    {
      id: "Q6",
      text: "Excluding marijuana, cannabis or hashish, have you ever used any other illicit drugs such as Amphetamines, Anabolic Steroids, Barbiturates, Cocaine, Ecstasy, Hallucinogens, Heroin, Methadone, Opium, Speed, LSD, DMT, or any of the following not prescribed by a doctor or physician: Morphine, Demerol, Codein, or Fentanyl?",
      answer_type: "boolean",
      resulting_nodes: ["Q6when", "Q7"],
      resulting_plans: ["Day1"],
    },
  ],

  // Q6when: Years since last use
  [
    "Q6when",
    {
      id: "Q6when",
      text: "Date of last use (number of years)?",
      answer_type: "number",
      resulting_nodes: ["Q6ecstasy", "Q7"],
      resulting_plans: [
        "DENIAL",
        "Day1",
        "Guaranteed+",
        "Deferred+",
        "Signature",
      ],
    },
  ],

  // Q6ecstasy: Only Ecstasy/Speed/Hallucinogens
  [
    "Q6ecstasy",
    {
      id: "Q6ecstasy",
      text: "Did you only use Ecstasy, Speed or Hallucinogens?",
      answer_type: "boolean",
      resulting_nodes: ["Q6howmany", "Q6comb510"],
      resulting_plans: ["Signature", "Day1+"],
    },
  ],

  // Q6howmany: Total times used
  [
    "Q6howmany",
    {
      id: "Q6howmany",
      text: "How many times did you use those substances in total?",
      answer_type: "number",
      resulting_nodes: ["Q7"],
      resulting_plans: ["Day1", "Day1+"],
    },
  ],

  // Q7: Treatment for alcohol/drugs
  [
    "Q7",
    {
      id: "Q7",
      text: "Have you ever received treatment (including the participation in a support group), or have you ever been advised to reduce your consumption or seek treatment regarding the use of alcohol or any drug?",
      answer_type: "boolean",
      resulting_nodes: ["Q7alc", "Q8"],
      resulting_plans: ["Day1"],
    },
  ],

  // Q7alc: Treatment for alcohol only
  [
    "Q7alc",
    {
      id: "Q7alc",
      text: "Did you receive treatment for alcohol consumption only?",
      answer_type: "boolean",
      resulting_nodes: ["Q7yrsA", "Q7yrsD"],
    },
  ],

  // Q7yrsA: Years since alcohol treatment
  [
    "Q7yrsA",
    {
      id: "Q7yrsA",
      text: "When did you last receive treatment (number years)?",
      answer_type: "number",
      resulting_nodes: ["Q8"],
      resulting_plans: [
        "Guaranteed+",
        "Deferred+",
        "Signature",
        "Day1+",
        "Day1",
        "DENIAL",
      ],
    },
  ],

  // Q7yrsD: Years since drug treatment
  [
    "Q7yrsD",
    {
      id: "Q7yrsD",
      text: "When did you last receive treatment (number years)?",
      answer_type: "number",
      resulting_nodes: ["Q8"],
      resulting_plans: [
        "Guaranteed+",
        "Deferred+",
        "Signature",
        "Day1+",
        "Day1",
        "DENIAL",
      ],
    },
  ],

  // Q8: DUI/DWI
  [
    "Q8",
    {
      id: "Q8",
      text: "In the last 3 years, have you been charged, convicted, or do you have charges pending for driving with a blood alcohol above the legal limit, under the influence, or impaired driving (DUI/DWI)?",
      answer_type: "boolean",
      resulting_nodes: ["Q8count", "Q9"],
      resulting_plans: ["Day1", "Guaranteed+"],
    },
  ],

  // Q8count: Multiple DUIs
  [
    "Q8count",
    {
      id: "Q8count",
      text: "Have you had 2 or more DUIs to date?",
      answer_type: "boolean",
      resulting_nodes: ["Q9"],
      resulting_plans: ["Guaranteed+", "Day1+"],
    },
  ],

  // Q9: Criminal conviction
  [
    "Q9",
    {
      id: "Q9",
      text: "Excluding DUI/DWI, in the last 5 years have you been convicted or incarcerated of any criminal offense or have charges or sentencing currently pending?",
      answer_type: "boolean",
      resulting_nodes: ["Q9mult", "Q10"],
      resulting_plans: ["Day1"],
    },
  ],

  // Q9mult: Multiple charges
  [
    "Q9mult",
    {
      id: "Q9mult",
      text: "Have you ever been charged/convicted 2 or more times, or have charges or sentencing currently pending?",
      answer_type: "boolean",
      resulting_nodes: ["Q9inc"],
      resulting_plans: ["DENIAL"],
    },
  ],

  // Q9inc: Incarceration duration
  [
    "Q9inc",
    {
      id: "Q9inc",
      text: "If you were incarcerated, was it for 6 months or more?",
      answer_type: "boolean",
      resulting_nodes: ["Q9yrs"],
      resulting_plans: ["DENIAL"],
    },
  ],

  // Q9yrs: Years since sentence completion
  [
    "Q9yrs",
    {
      id: "Q9yrs",
      text: "When did you complete your sentence, parole or probation (number of years)?",
      answer_type: "number",
      resulting_nodes: ["Q10"],
      resulting_plans: ["Guaranteed+", "Deferred+", "Signature"],
    },
  ],

  // Q10: Current symptoms
  [
    "Q10",
    {
      id: "Q10",
      text: "Excluding annual tests, routine pregnancy or childbirth-related follow-ups with normal results, common cold, flu or seasonal allergies, strains or sprains, do you have any physical or mental symptoms for which you have not yet consulted a health professional?",
      answer_type: "boolean",
      resulting_nodes: ["Q10B"],
      resulting_plans: ["Day1", "Guaranteed+"],
    },
  ],

  // Q10B: Abnormal tests pending
  [
    "Q10B",
    {
      id: "Q10B",
      text: "Have you been advised of an abnormal test result, or to have treatment or investigations which have not yet started or been completed, or are you awaiting results of any medical investigations?",
      answer_type: "boolean",
      resulting_nodes: ["Q11"],
      resulting_plans: ["Day1", "Guaranteed+"],
    },
  ],

  // Q11: Cardio/CVD
  [
    "Q11",
    {
      id: "Q11",
      text: "Excluding treated and controlled high blood pressure and/or cholesterol have you had or been told you have, been investigated, been treated, taken medication, or been prescribed medication, had surgery or a procedure for: Heart disease, heart attack, angina, heart murmur, abnormal heart rhythm, aneurysm, blood clots, cerebrovascular disease (stroke or mini-stroke such as TIA), or any other disease of the heart or the blood vessels (angioplasty, atherosclerosis, heart bypass, heart stent, peripheral vascular disease)?",
      answer_type: "boolean",
      resulting_nodes: ["Q11stable", "Q12F", "Q12M"],
      resulting_plans: ["Day1", "DENIAL"],
    },
  ],

  // Q11stable: Stable condition check
  [
    "Q11stable",
    {
      id: "Q11stable",
      text: "Are you currently free of symptoms, stable with regular follow-up with no pending surgery?",
      answer_type: "boolean",
      resulting_nodes: ["Q12F", "Q12M", "Q11dx"],
      resulting_plans: ["Guaranteed+", "Deferred+"],
    },
  ],

  // Q11dx: Years since diagnosis
  [
    "Q11dx",
    {
      id: "Q11dx",
      text: "When were you diagnosed?",
      answer_type: "number",
      resulting_nodes: ["Q12F", "Q12M", "Q11fu"],
      resulting_plans: ["Guaranteed+", "Deferred+"],
    },
  ],

  // Q11fu: Last follow-up
  [
    "Q11fu",
    {
      id: "Q11fu",
      text: "When was your last follow-up?",
      answer_type: "number",
      resulting_nodes: ["Q12F", "Q12M"],
      resulting_plans: ["Signature", "Deferred+", "Guaranteed+"],
    },
  ],

  // Q12F: Female branch
  [
    "Q12F",
    {
      id: "Q12F",
      text: "[Female] Have you ever been diagnosed with gestational diabetes (within the last 2 years), diabetes or pre-diabetes?",
      answer_type: "boolean",
      resulting_nodes: ["Q12F1", "Q13"],
      resulting_plans: ["Day1"],
    },
  ],

  // Q12F1: Type 1 diabetes (Female)
  [
    "Q12F1",
    {
      id: "Q12F1",
      text: "Were you diagnosed with Diabetes type 1?",
      answer_type: "boolean",
      resulting_nodes: ["Q12F1a", "Q12F2"],
    },
  ],

  // Q12F1a: Complications check (Female Type 1)
  [
    "Q12F1a",
    {
      id: "Q12F1a",
      text: "Have you ever had complications of your diabetes, such as amputation related to poor circulation or infection, hypo or hyperglycemic reactions or nephropathy?",
      answer_type: "boolean",
      resulting_nodes: ["Q12F1b", "Q13"],
      resulting_plans: ["Guaranteed+"],
    },
  ],

  // Q12F1b: HbA1c check (Female Type 1)
  [
    "Q12F1b",
    {
      id: "Q12F1b",
      text: "Have you monitored your blood sugar levels in the last 3 months with an average HbA1c or A1C result of 7.5% or more than or equal to 7.5%?",
      answer_type: "boolean",
      resulting_nodes: ["Q13"],
      resulting_plans: ["Deferred+", "Guaranteed+"],
    },
  ],

  // Q12F2: Gestational only check
  [
    "Q12F2",
    {
      id: "Q12F2",
      text: "If pregnant: Have you been diagnosed with Gestational Diabetes only?",
      answer_type: "boolean",
      resulting_nodes: ["Q12F2a", "Q12F3"],
    },
  ],

  // Q12F2a: Gestational diabetes control
  [
    "Q12F2a",
    {
      id: "Q12F2a",
      text: "Is your Gestational Diabetes currently under good control with HbA1c or A1C result of 7.5% or less than or equal to 7%?",
      answer_type: "boolean",
      resulting_nodes: ["Q13"],
      resulting_plans: ["Guaranteed+", "Signature", "Deferred+"],
    },
  ],

  // Q12F3: On diabetes meds (Female)
  [
    "Q12F3",
    {
      id: "Q12F3",
      text: "Are you currently taking or have you been prescribed any medication to treat your diabetes?",
      answer_type: "boolean",
      resulting_nodes: ["Q12F3a", "Q12F4"],
    },
  ],

  // Q12F3a: HbA1c check with conditions (Female)
  [
    "Q12F3a",
    {
      id: "Q12F3a",
      text: "Have you monitored your blood sugar levels in the last 3 months with an average HbA1c or A1C result of 7.5% or more than or equal to 7.5%?",
      answer_type: "boolean",
      resulting_nodes: ["Q13"],
      resulting_plans: ["Deferred+", "Signature", "Guaranteed+", "Day1+"],
    },
  ],

  // Q12F4: Not pregnant logic
  [
    "Q12F4",
    {
      id: "Q12F4",
      text: "Not pregnant: apply same meds/HbA1c/BMI logic if meds later",
      answer_type: "string",
      resulting_nodes: ["Q13"],
    },
  ],

  // Q12M: Male branch
  [
    "Q12M",
    {
      id: "Q12M",
      text: "[Male] Have you ever been diagnosed with diabetes or pre-diabetes?",
      answer_type: "boolean",
      resulting_nodes: ["Q12M1", "Q13"],
      resulting_plans: ["Day1"],
    },
  ],

  // Q12M1: Type 1 diabetes (Male)
  [
    "Q12M1",
    {
      id: "Q12M1",
      text: "Were you diagnosed with Diabetes type 1?",
      answer_type: "boolean",
      resulting_nodes: ["Q12M1a", "Q12M2"],
    },
  ],

  // Q12M1a: Complications check (Male Type 1)
  [
    "Q12M1a",
    {
      id: "Q12M1a",
      text: "Have you ever had complications of your diabetes, such as amputation related to poor circulation or infection, hypo or hyperglycemic reactions, or nephropathy?",
      answer_type: "boolean",
      resulting_nodes: ["Q12M1b", "Q13"],
      resulting_plans: ["Guaranteed+"],
    },
  ],

  // Q12M1b: HbA1c check (Male Type 1)
  [
    "Q12M1b",
    {
      id: "Q12M1b",
      text: "Have you monitored your blood sugar levels in the last 3 months with an average HbA1c or A1C result of 7.5% or more than or equal to 7.5%?",
      answer_type: "boolean",
      resulting_nodes: ["Q13"],
      resulting_plans: ["Deferred+", "Guaranteed+"],
    },
  ],

  // Q12M2: On diabetes meds (Male)
  [
    "Q12M2",
    {
      id: "Q12M2",
      text: "Are you currently taking or have you been prescribed any medication to treat your diabetes?",
      answer_type: "boolean",
      resulting_nodes: ["Q12M2b", "Q13"],
      resulting_plans: ["Deferred+", "Guaranteed+", "Day1+"],
    },
  ],

  // Q12M2b: BMI bands for HbA1c ≥7.5% (Male)
  [
    "Q12M2b",
    {
      id: "Q12M2b",
      text: "Have you monitored your blood sugar levels in the last 3 months with an average HbA1c or A1C result of 7.5% or more than or equal to 7.5%?",
      answer_type: "string",
      resulting_nodes: ["Q13"],
      resulting_plans: ["Deferred+", "Signature", "Day1+"],
    },
  ],

  // Q13: Cancer
  [
    "Q13",
    {
      id: "Q13",
      text: "Within the last 10 years, have you been diagnosed with, shown symptoms, received treatment for or recommended therapy or medication for any of the following disorders: [Excluding Basal Cell Carcinoma or any other benign cysts/polyps] Cancer, cyst(s), tumor(s), Hodgkin's disease, Lymphoma, Leukemia, Melanoma, or any other abnormal growth or malignant disease?",
      answer_type: "boolean",
      resulting_nodes: ["Q14"],
      resulting_plans: ["Day1", "Deferred+"],
    },
  ],

  // Q14: Immune system
  [
    "Q14",
    {
      id: "Q14",
      text: "Have you ever been diagnosed with, shown symptoms, received treatment for or recommended therapy or medication for any disease of the immune system, lupus, scleroderma, AIDS/HIV, or any disease or disorder of the immune system?",
      answer_type: "boolean",
      resulting_nodes: ["Q15"],
      resulting_plans: ["Day1", "Guaranteed+"],
    },
  ],

  // Q15: Respiratory/COPD
  [
    "Q15",
    {
      id: "Q15",
      text: "Have you ever been diagnosed with shortness of breath, emphysema, Chronic Obstructive Pulmonary Disease (COPD), or cystic fibrosis?",
      answer_type: "boolean",
      resulting_nodes: ["Q15O2", "Q15sleep"],
    },
  ],

  // Q15O2: Oxygen therapy
  [
    "Q15O2",
    {
      id: "Q15O2",
      text: "Have you been on oxygen therapy in the last 2 years?",
      answer_type: "boolean",
      resulting_nodes: ["Q16M", "Q16F"],
      resulting_plans: ["Guaranteed+", "Deferred+"],
    },
  ],

  // Q15sleep: Sleep apnea
  [
    "Q15sleep",
    {
      id: "Q15sleep",
      text: "Have you been diagnosed, treated, or been prescribed treatment for sleep apnea?",
      answer_type: "boolean",
      resulting_nodes: ["Q15asthma", "Q15cpap"],
    },
  ],

  // Q15asthma: Asthma/chronic bronchitis
  [
    "Q15asthma",
    {
      id: "Q15asthma",
      text: "Have you ever been diagnosed with asthma or chronic bronchitis?",
      answer_type: "boolean",
      resulting_nodes: ["Q15sev", "Q16M", "Q16F"],
      resulting_plans: ["Day1"],
    },
  ],

  // Q15sev: Severe asthma symptoms
  [
    "Q15sev",
    {
      id: "Q15sev",
      text: "Have you been prescribed steroids, take 2 or more daily inhalers, admitted or hospitalized (within the last 12 hours) to control your asthma symptoms within the last 2 years?",
      answer_type: "boolean",
      resulting_nodes: ["Q16M", "Q16F"],
      resulting_plans: ["Day1+", "Signature"],
    },
  ],

  // Q15cpap: CPAP usage
  [
    "Q15cpap",
    {
      id: "Q15cpap",
      text: "Do you use a treatment everyday such as a BIPAP, CPAP, or any other machine or oral appliance?",
      answer_type: "boolean",
      resulting_nodes: ["Q16M", "Q16F"],
      resulting_plans: ["Signature", "Deferred+", "Day1+"],
    },
  ],

  // Q16M: Male GU disorders
  [
    "Q16M",
    {
      id: "Q16M",
      text: "[MALE] Have you ever been diagnosed with a prostate disorder or elevated Prostate Specific Antigen (PSA), disorder of the testes, nephritis, nephropathy, kidney disease, polycystic kidney disease or any other genitourinary disorder, (excluding kidney stone in only one kidney or non-obstructive kidney stone or any infection treated with antibiotics)?",
      answer_type: "boolean",
      resulting_nodes: ["Q16M2", "Q17"],
      resulting_plans: ["Deferred+"],
    },
  ],

  // Q16M2: Recent findings (Male)
  [
    "Q16M2",
    {
      id: "Q16M2",
      text: "In the last 2 years, have you been diagnosed with or told you had sugar or blood in the urine, elevated Prostate Specific Antigen (PSA) due to an infection treated with antibiotics?",
      answer_type: "boolean",
      resulting_nodes: ["Q16M3", "Q17"],
      resulting_plans: ["Day1"],
    },
  ],

  // Q16M3: Normal follow-up (Male)
  [
    "Q16M3",
    {
      id: "Q16M3",
      text: "Have you had a normal follow-up in the last 12 months, with no further tests or consult recommended?",
      answer_type: "boolean",
      resulting_nodes: ["Q17"],
      resulting_plans: ["Day1+", "Deferred+"],
    },
  ],

  // Q16F: Female GU disorders
  [
    "Q16F",
    {
      id: "Q16F",
      text: "[FEMALE] Have you ever been diagnosed with a disorder of the ovaries, uterus or genitals (excluding hysterectomy), nephritis, nephropathy, kidney disease, polycystic kidney disease or any other genitourinary disorder (excluding kidney stone in only one kidney, non-obstructive kidney stone or any infection treated with antibiotics)?",
      answer_type: "boolean",
      resulting_nodes: ["Q16F2", "Q17"],
      resulting_plans: ["Deferred+"],
    },
  ],

  // Q16F2: Recent findings (Female)
  [
    "Q16F2",
    {
      id: "Q16F2",
      text: "In the last 2 years, have you been diagnosed with or told you had sugar or blood in the urine (excluding menstrual related), or any abnormal pap smear?",
      answer_type: "boolean",
      resulting_nodes: ["Q16F3", "Q17"],
      resulting_plans: ["Day1"],
    },
  ],

  // Q16F3: Normal follow-up (Female)
  [
    "Q16F3",
    {
      id: "Q16F3",
      text: "Have you had a normal follow-up in the last 12 months with no further tests or consult recommended?",
      answer_type: "boolean",
      resulting_nodes: ["Q17"],
      resulting_plans: ["Day1+", "Deferred+"],
    },
  ],

  // Q17: Neuro disorders
  [
    "Q17",
    {
      id: "Q17",
      text: "Have you ever been diagnosed with Alzheimer, seizures, motor neuron disease, dementia, autism, cerebral palsy, motor neuron syndrome, memory loss, Parkinson's disease or other congenital developmental disorder?",
      answer_type: "boolean",
      resulting_nodes: ["Q17szOnly", "Q18"],
      resulting_plans: ["Day1"],
    },
  ],

  // Q17szOnly: Only seizure/epilepsy
  [
    "Q17szOnly",
    {
      id: "Q17szOnly",
      text: "Were you diagnosed with only seizure or epilepsy disorder?",
      answer_type: "boolean",
      resulting_nodes: ["Q17szCount"],
      resulting_plans: ["Guaranteed+", "Deferred+"],
    },
  ],

  // Q17szCount: Seizure count
  [
    "Q17szCount",
    {
      id: "Q17szCount",
      text: "How many seizures have you had in the last 12 months?",
      answer_type: "number",
      resulting_nodes: ["Q18", "Q17meds1", "Q17meds2", "Q18"],
      resulting_plans: ["Signature", "Day1+", "Guaranteed+"],
    },
  ],

  // Q17meds1: Medications for 1-3 seizures
  [
    "Q17meds1",
    {
      id: "Q17meds1",
      text: "Are you currently prescribed more than 1 medication?",
      answer_type: "boolean",
      resulting_nodes: ["Q18"],
      resulting_plans: ["Guaranteed+", "Deferred+", "Signature"],
    },
  ],

  // Q17meds2: Medications for 4-6 seizures
  [
    "Q17meds2",
    {
      id: "Q17meds2",
      text: "Are you currently prescribed more than 1 medication?",
      answer_type: "boolean",
      resulting_nodes: ["Q18"],
      resulting_plans: ["Deferred+", "Guaranteed+"],
    },
  ],

  // Q18: Mental health
  [
    "Q18",
    {
      id: "Q18",
      text: "Have you ever been diagnosed with a mental health disorder such as severe anxiety, severe depression, bipolar, epilepsy, schizophrenia, psychosis, or attempted suicide? (Severe anxiety or severe depression: Multiple episodes, last episode within the last 24 months, time off work or school less than 2 weeks, or with a history of hospitalization.)",
      answer_type: "boolean",
      resulting_nodes: ["Q18meds", "Q18mod"],
      resulting_plans: ["Guaranteed+"],
    },
  ],

  // Q18meds: Medications for severe mental health
  [
    "Q18meds",
    {
      id: "Q18meds",
      text: "Are you currently prescribed 3 or more medications to control your symptoms?",
      answer_type: "boolean",
      resulting_nodes: ["Q19"],
      resulting_plans: ["Deferred+", "Signature"],
    },
  ],

  // Q18mod: Moderate mental health
  [
    "Q18mod",
    {
      id: "Q18mod",
      text: "[Male] Have you ever experienced moderate anxiety, moderate depression, or a personality disorder? [Female] Have you ever experienced moderate anxiety, moderate depression (including postpartum depression), or a personality disorder? (Moderate anxiety or moderate depression: Multiple episodes with none within the last 24 months, time off work or school less than 2 weeks, and with NO previous history of hospitalization.)",
      answer_type: "boolean",
      resulting_nodes: ["Q19"],
      resulting_plans: ["Deferred+", "Day1", "Day1+"],
    },
  ],

  // Q19: GI/hepatic/pancreas
  [
    "Q19",
    {
      id: "Q19",
      text: "Have you ever been diagnosed with Crohn's disease, ulcerative colitis, hepatitis (excluding hepatitis A), pancreatitis, pancreatic cancer, intestinal bleeding, or other disorders of the stomach, intestine (excluding irritable bowel syndrome - IBS), liver, or pancreas?",
      answer_type: "boolean",
      resulting_nodes: ["Q19IBD", "Q20"],
      resulting_plans: ["Guaranteed+", "Day1"],
    },
  ],

  // Q19IBD: IBD diagnosis timing
  [
    "Q19IBD",
    {
      id: "Q19IBD",
      text: "Were you diagnosed with diverticulitis, Crohn's disease, or ulcerative colitis more than 12 months ago?",
      answer_type: "boolean",
      resulting_nodes: ["Q19fu", "Q20"],
      resulting_plans: ["Deferred+"],
    },
  ],

  // Q19fu: Follow-up check
  [
    "Q19fu",
    {
      id: "Q19fu",
      text: "Have you had a routine medical follow-up or surveillance in the past 2 years?",
      answer_type: "boolean",
      resulting_nodes: ["Q19sev", "Q20"],
      resulting_plans: ["Deferred+"],
    },
  ],

  // Q19sev: Severe symptoms
  [
    "Q19sev",
    {
      id: "Q19sev",
      text: "Have you had 2 surgeries or more within the last 5 years, missed any time off work/school in the last 2 years, been hospitalized within the last 2 years, or had a flare within the last 12 months?",
      answer_type: "boolean",
      resulting_nodes: ["Q20"],
      resulting_plans: ["Signature", "Day1+"],
    },
  ],

  // Q20: Endocrine/metabolic
  [
    "Q20",
    {
      id: "Q20",
      text: "Excluding controlled hypothyroidism/hyperthyroidism, have you ever been diagnosed with, shown symptoms, received treatment for, or recommended therapy or medication for any of the following disorders: Adrenal, parathyroid, pituitary, hormone, metabolic or any other endocrine, gland, or metabolic disorders?",
      answer_type: "boolean",
      resulting_nodes: ["Q21"],
      resulting_plans: ["Day1", "Signature"],
    },
  ],

  // Q21: Neuro-motor/MS
  [
    "Q21",
    {
      id: "Q21",
      text: "Have you ever been diagnosed with multiple sclerosis, muscular dystrophy, numbness or weakness of an arm or leg, or paralysis?",
      answer_type: "boolean",
      resulting_nodes: ["Q21prog", "Q22"],
      resulting_plans: ["Day1"],
    },
  ],

  // Q21prog: Progressive MS
  [
    "Q21prog",
    {
      id: "Q21prog",
      text: "In the last 2 years, were you diagnosed with multiple sclerosis, progressive pattern with loss of bowel, or bladder function?",
      answer_type: "boolean",
      resulting_nodes: ["Q21amb", "Q22"],
      resulting_plans: ["Guaranteed+"],
    },
  ],

  // Q21amb: Ambulatory/disability issues
  [
    "Q21amb",
    {
      id: "Q21amb",
      text: "Do you currently have ambulatory or disability issues, or have you had more than 2 attacks in the last 12 months? (Ambulatory issues include being unable to walk less than 200 meters or 1 flight of stairs per day, or assistance devices such as a cane, crutches or brace, wheelchair)",
      answer_type: "boolean",
      resulting_nodes: ["Q22"],
      resulting_plans: ["Deferred+", "Signature"],
    },
  ],

  // Q22: Rheumatoid/psoriatic arthritis/spinal disc
  [
    "Q22",
    {
      id: "Q22",
      text: "Have you ever been diagnosed with rheumatoid arthritis, psoriatic arthritis, or spinal disc disease?",
      answer_type: "boolean",
      resulting_nodes: ["Q22dep", "Q23"],
      resulting_plans: ["Day1"],
    },
  ],

  // Q22dep: Dependency check
  [
    "Q22dep",
    {
      id: "Q22dep",
      text: "Have you ever experienced daily symptoms such as loss of movement or disability, or have you ever undergone surgery to treat your condition?",
      answer_type: "boolean",
      resulting_nodes: ["Q22meds", "Q23"],
      resulting_plans: ["Guaranteed+", "Signature"],
    },
  ],

  // Q22meds: Daily medications
  [
    "Q22meds",
    {
      id: "Q22meds",
      text: "Are you currently on any prescribed daily medication to control your symptoms?",
      answer_type: "boolean",
      resulting_nodes: ["Q23"],
      resulting_plans: ["Signature", "Day1", "Day1+"],
    },
  ],

  // Q23: High-risk activities
  [
    "Q23",
    {
      id: "Q23",
      text: "In the last 2 years or in the next 12 months, have you participated in or do you intend to participate in any of the following high-risk activities or sports: mountain climbing, ice climbing, paragliding, parasailing, hang gliding, skydiving, scuba diving (excluding casual vacation resort), bungee jumping, heli-skiing, backcountry skiing, backcountry snowmobiling, aviation (excluding passenger or pilot on scheduled flights), motor racing, or kitesurfing?",
      answer_type: "boolean",
      resulting_nodes: ["Q23hi", "Q24"],
      resulting_plans: ["Day1"],
    },
  ],

  // Q23hi: Highest risk activities
  [
    "Q23hi",
    {
      id: "Q23hi",
      text: "Any free solo mountain climbing, international peaks or peaks > 6,000 meters, >= YDS 5.11, NCCS grade VI, kayak jumping, motor racing with maximum speed above 240 km/h (150 mp/h), any solo/night/cave, or wreck scuba diving?",
      answer_type: "boolean",
      resulting_nodes: ["Q23mid", "Q24"],
      resulting_plans: ["Guaranteed+"],
    },
  ],

  // Q23mid: Medium risk activities
  [
    "Q23mid",
    {
      id: "Q23mid",
      text: "Any ice or glacier climbing, mountain climbing above 4000 meters, YDS 5.8 or NCCS grade V, bungee paragliding, hang gliding, or scuba diving above 45 meters?",
      answer_type: "boolean",
      resulting_nodes: ["Q24"],
      resulting_plans: ["Signature", "Day1+"],
    },
  ],

  // Q24: Family history
  [
    "Q24",
    {
      id: "Q24",
      text: "To your knowledge, have any of your immediate family member(s) (father, mother, brother or sister), ever been diagnosed before the age of 65 with Amyotrophic Lateral Sclerosis, Cardiomyopathy, Hereditary non-polyposis colon cancer, Huntington's disease, Lynch syndrome, Muscular dystrophy, or Polycystic kidney disease?",
      answer_type: "boolean",
      resulting_nodes: ["Q24two", "Q25"],
      resulting_plans: ["Deferred+"],
    },
  ],

  // Q24two: Two or more family members
  [
    "Q24two",
    {
      id: "Q24two",
      text: "Before age 60, have 2 or more of your immediate family members (mother, father, brother or sister) been diagnosed with cancer, stroke, heart attack, angina, bypass, angioplasty, multiple sclerosis, motor neuron disease, Alzheimer's disease or dementia?",
      answer_type: "boolean",
      resulting_nodes: ["Q24under50", "Q25"],
      resulting_plans: ["Day1"],
    },
  ],

  // Q24under50: Diagnosis before age 50
  [
    "Q24under50",
    {
      id: "Q24under50",
      text: "Before age 50, has 1 or more of your immediate family members (mother, father, brother or sister) been diagnosed with cancer, stroke, heart attack, angina, bypass, angioplasty, multiple sclerosis, motor neuron disease, Alzheimer's disease or dementia?",
      answer_type: "boolean",
      resulting_nodes: ["Q25"],
      resulting_plans: ["Signature", "Day1+"],
    },
  ],

  // Q25: Travel/residency
  [
    "Q25",
    {
      id: "Q25",
      text: "Within the next 12 months, do you plan to travel to a high-risk country or conflict regions or regions at war? (View list of Canada website for the current list of countries classified as Avoid all travel or Avoid non-essential travel: travel.gc.ca/travelling/advisories)",
      answer_type: "boolean",
      resulting_nodes: ["Q25res"],
      resulting_plans: ["Guaranteed+"],
    },
  ],

  // Q25res: Residency outside Canada
  [
    "Q25res",
    {
      id: "Q25res",
      text: "Within the next 12 months, do you intend to reside outside of Canada for at least six consecutive months?",
      answer_type: "boolean",
      resulting_nodes: [],
      resulting_plans: ["Day1", "Day1+"],
    },
  ],
]);
