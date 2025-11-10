// Question descriptions and metadata for LLM consumption
// Based on stuff.txt questionnaire definitions

export interface QuestionDescription {
  id: string;
  text: string;
  topics: string[]; // Keywords/conditions this question covers
  followUps?: string[]; // Question IDs that may be needed as follow-ups
}

export const QUESTION_DESCRIPTIONS: Record<string, QuestionDescription> = {
  gender: {
    id: "gender",
    text: "What is your gender? (Required for determining which questions apply)",
    topics: ["gender", "male", "female"],
  },
  q1: {
    id: "q1",
    text: "In the past 12 months, excluding large cigars (12 or less), have you used tobacco in any form (not limited to small cigars, cigarillos, electronic cigarettes or vaping, nicotine products or nicotine substitutes such as patch or gum)?",
    topics: ["tobacco", "smoking", "cigarettes", "vaping", "e-cigarettes", "nicotine", "cigars", "cigarillos"],
  },
  q2: {
    id: "q2",
    text: "Provide your height and weight (calculate BMI).",
    topics: ["height", "weight", "bmi", "body mass index", "pregnancy", "pregnant", "birth", "weight loss"],
    followUps: ["q2_weightLoss", "q2_pregnancy", "q2_birth6m", "q2_prePregWeight", "q11", "q12", "q19", "q22"], // BMI sub-steps then dependents
  },
  q2_weightLoss: {
    id: "q2_weightLoss",
    text: "In the last 12 months, has the client lost more than 10% of body weight unintentionally?",
    topics: ["weight loss", "weight change"],
  },
  q2_pregnancy: {
    id: "q2_pregnancy",
    text: "[Female only] Is the client currently pregnant?",
    topics: ["pregnancy", "pregnant"],
  },
  q2_birth6m: {
    id: "q2_birth6m",
    text: "[Female only] Has the client given birth in the last 6 months?",
    topics: ["birth", "postpartum"],
  },
  q2_prePregWeight: {
    id: "q2_prePregWeight",
    text: "[Female only] If pregnant or recent birth, what was the pre-pregnancy weight (kg)?",
    topics: ["pre-pregnancy weight"],
  },
  q3: {
    id: "q3",
    text: "Are you currently working? Does your duties involve any high-risk or moderate-risk occupations?",
    topics: ["work", "working", "employment", "occupation", "job", "diving", "military", "pilot", "logging", "mining", "institutionalized", "nursing facility", "hospital"],
  },
  q3c: {
    id: "q3c",
    text: "Receiving care in a facility or need assistance (bedridden or wheelchair)?",
    topics: ["institutionalized", "facility", "bedridden", "wheelchair", "assisted living", "nursing home", "hospital"],
  },
  q4: {
    id: "q4",
    text: "Do you consume alcohol?",
    topics: ["alcohol", "drinking", "beer", "wine", "liquor", "drinks", "etoh"],
    followUps: ["q4q", "q6", "q7", "q8", "q18"], // Ask drinks/week then related checks
  },
  q4q: {
    id: "q4q",
    text: "On average, how many standard alcoholic drinks per week?",
    topics: ["alcohol", "drinks per week"],
  },
  q5: {
    id: "q5",
    text: "In the last 12 months, have you used marijuana, hashish or cannabis in any form?",
    topics: ["marijuana", "cannabis", "hashish", "weed", "pot", "thc"],
  },
  q5mix: {
    id: "q5mix",
    text: "Do they mix marijuana with tobacco?",
    topics: ["marijuana", "tobacco"],
  },
  q5freq: {
    id: "q5freq",
    text: "How many times per week do they use marijuana (1–3, 4–7, 8–14, 15+)?",
    topics: ["marijuana", "frequency"],
  },
  q6: {
    id: "q6",
    text: "Excluding marijuana, have you ever used any other illicit drugs (e.g., amphetamines, steroids, cocaine, heroin, hallucinogens, etc.) or non-prescribed listed Rx?",
    topics: ["illicit drugs", "drugs", "cocaine", "heroin", "amphetamines", "steroids", "ecstasy", "lsd", "hallucinogens", "speed", "opium", "methadone", "fentanyl", "morphine", "codeine"],
    followUps: ["q6when", "q6ecstasy", "q6howmany", "q7", "q18"], // Sub-steps, then related
  },
  q6when: {
    id: "q6when",
    text: "How many years since last use of illicit drugs?",
    topics: ["illicit drugs", "last use"],
  },
  q6ecstasy: {
    id: "q6ecstasy",
    text: "If 5–10 years, was use only Ecstasy/Speed/Hallucinogens (experimental)?",
    topics: ["illicit drugs", "experimental"],
  },
  q6howmany: {
    id: "q6howmany",
    text: "If experimental only, how many total times (1 = experimental)?",
    topics: ["illicit drugs", "experimental count"],
  },
  q7: {
    id: "q7",
    text: "Have you ever received treatment or been advised to seek treatment for alcohol or drugs (including support groups)?",
    topics: ["treatment", "rehabilitation", "rehab", "support group", "alcohol treatment", "drug treatment"],
  },
  q7alc: {
    id: "q7alc",
    text: "Was the treatment for alcohol consumption only?",
    topics: ["alcohol treatment"],
  },
  q7yrs: {
    id: "q7yrs",
    text: "How many years since last treatment?",
    topics: ["treatment", "years since treatment"],
  },
  q8: {
    id: "q8",
    text: "In the last 3 years, have you been charged, convicted, or do you have charges pending for DUI/DWI?",
    topics: ["dui", "dwi", "driving under influence", "impaired driving", "drunk driving"],
    followUps: ["q8count", "q18"], // Ask multiple DUIs then related
  },
  q8count: {
    id: "q8count",
    text: "Have they had 2 or more DUIs to date?",
    topics: ["dui", "multiple"],
  },
  q9: {
    id: "q9",
    text: "Excluding DUI/DWI, in the last 5 years have you been convicted or incarcerated for any criminal offence, or have charges/sentencing pending?",
    topics: ["criminal", "conviction", "incarceration", "prison", "jail", "criminal charges", "sentencing", "parole", "probation"],
  },
  q9mult: {
    id: "q9mult",
    text: "Have they been charged/convicted 2 or more times, or have charges/sentencing currently pending?",
    topics: ["criminal", "multiple charges", "pending"],
  },
  q9inc: {
    id: "q9inc",
    text: "If incarcerated, was it for 6 months or more?",
    topics: ["incarceration", "6 months"],
  },
  q9yrs: {
    id: "q9yrs",
    text: "How many years since completing sentence, parole or probation?",
    topics: ["sentence", "years since"],
  },
  q10: {
    id: "q10",
    text: "Excluding routine follow-ups and minor illnesses: Do you have any physical or mental symptoms for which you have not yet consulted a health professional?",
    topics: ["symptoms", "pending tests", "abnormal test", "medical investigations", "pending treatment"],
  },
  q10b: {
    id: "q10b",
    text: "Have you been advised of an abnormal test, pending investigations, or awaiting results?",
    topics: ["abnormal test", "pending investigations"],
  },
  q11: {
    id: "q11",
    text: "Excluding treated and controlled high blood pressure and/or cholesterol: Have you had heart disease or any disease of the heart/blood vessels (e.g., heart attack, angina, arrhythmia, aneurysm, clots, stroke/TIA, angioplasty/bypass/stent, peripheral vascular disease)?",
    topics: ["heart disease", "heart attack", "angina", "heart murmur", "arrhythmia", "aneurysm", "blood clots", "stroke", "tia", "cad", "cardiovascular", "angioplasty", "bypass", "stent", "peripheral vascular disease"],
    followUps: ["q11stable", "q11dx", "q11fu", "q12", "q15"], // Heart sub-steps then related
  },
  q11stable: {
    id: "q11stable",
    text: "Are they currently free of symptoms, stable with regular follow-up, and no pending surgery?",
    topics: ["heart disease", "stable"],
  },
  q11dx: {
    id: "q11dx",
    text: "How many years since diagnosis?",
    topics: ["heart disease", "diagnosis years"],
  },
  q11fu: {
    id: "q11fu",
    text: "When was their last follow-up (years)?",
    topics: ["heart disease", "follow-up years"],
  },
  q12: {
    id: "q12",
    text: "Have you ever been diagnosed with diabetes or pre-diabetes?",
    topics: ["diabetes", "diabetic", "type 1 diabetes", "type 2 diabetes", "gestational diabetes", "pre-diabetes", "blood sugar", "hba1c", "a1c", "insulin"],
    followUps: ["q12type1", "q12gest", "q12meds", "q12comp", "q12hba1c", "q22"], // Diabetes sub-steps then related
  },
  q12type1: {
    id: "q12type1",
    text: "Is it Type 1 diabetes?",
    topics: ["diabetes", "type 1"],
  },
  q12gest: {
    id: "q12gest",
    text: "Is it gestational diabetes (within last 2 years)?",
    topics: ["diabetes", "gestational"],
  },
  q12meds: {
    id: "q12meds",
    text: "Are they on or prescribed diabetes medications?",
    topics: ["diabetes", "medication"],
  },
  q12comp: {
    id: "q12comp",
    text: "Have they had any diabetes complications?",
    topics: ["diabetes", "complications"],
  },
  q12hba1c: {
    id: "q12hba1c",
    text: "What is the average HbA1c (A1C) in the last 3 months (%)?",
    topics: ["diabetes", "hba1c"],
  },
  q13: {
    id: "q13",
    text: "Within the last 10 years, have you been diagnosed with, shown symptoms, received treatment for or recommended therapy or medication for any of the following disorders: [Excluding Basal Cell Carcinoma or any other benign cysts/polyps] Cancer, cyst(s), tumor(s), Hodgkin's disease, Lymphoma, Leukemia, Melanoma, or any other abnormal growth or malignant disease?",
    topics: ["cancer", "tumor", "cyst", "hodgkin's disease", "lymphoma", "leukemia", "melanoma", "malignant"],
  },
  q14: {
    id: "q14",
    text: "Have you ever been diagnosed with, shown symptoms, received treatment for or recommended therapy or medication for any disease of the immune system, lupus, scleroderma, AIDS/HIV, or any disease or disorder of the immune system?",
    topics: ["immune system", "lupus", "scleroderma", "aids", "hiv", "immune disorder"],
  },
  q15: {
    id: "q15",
    text: "Have you ever been diagnosed with shortness of breath, emphysema, Chronic Obstructive Pulmonary Disease (COPD), or cystic fibrosis?",
    topics: ["copd", "emphysema", "cystic fibrosis", "shortness of breath", "oxygen therapy", "sleep apnea", "bipap", "cpap", "asthma", "chronic bronchitis", "respiratory"],
  },
  q15o2: {
    id: "q15o2",
    text: "Have they been on oxygen therapy in the last 2 years?",
    topics: ["oxygen therapy"],
  },
  q15sleep: {
    id: "q15sleep",
    text: "Have they been diagnosed or treated for sleep apnea?",
    topics: ["sleep apnea"],
  },
  q15cpap: {
    id: "q15cpap",
    text: "Do they use daily treatment for sleep apnea (CPAP/BIPAP/oral appliance)?",
    topics: ["cpap", "bipap", "appliance"],
  },
  q15asthma: {
    id: "q15asthma",
    text: "Have they ever been diagnosed with asthma or chronic bronchitis?",
    topics: ["asthma", "bronchitis"],
  },
  q15sev: {
    id: "q15sev",
    text: "For asthma: steroids, 2+ daily inhalers, or admitted/hospitalized in last 2 years?",
    topics: ["asthma severity"],
  },
  q16: {
    id: "q16",
    text: "Have you ever been diagnosed with a genitourinary disorder (e.g., prostate/testes, kidney disease, polycystic kidney disease, ovaries/uterus/genitals)?",
    topics: ["prostate", "psa", "testes", "nephritis", "nephropathy", "kidney disease", "polycystic kidney disease", "genitourinary", "ovaries", "uterus", "genitals", "pap smear", "urine"],
    followUps: ["q16recent", "q16followup", "q22"], // GU sub-steps then related
  },
  q16recent: {
    id: "q16recent",
    text: "In the last 2 years, were there findings like sugar/blood in urine or elevated PSA due to infection?",
    topics: ["urine", "psa", "last 2 years"],
  },
  q16followup: {
    id: "q16followup",
    text: "If recent findings: was there a normal follow-up in the last 12 months with no further tests/consults?",
    topics: ["follow-up", "normal"],
  },
  q17: {
    id: "q17",
    text: "Have you ever been diagnosed with Alzheimer, seizures, motor neuron disease, dementia, autism, cerebral palsy, motor neuron syndrome, memory loss, Parkinson's disease or other congenital developmental disorder?",
    topics: ["alzheimer", "seizures", "epilepsy", "motor neuron disease", "dementia", "autism", "cerebral palsy", "parkinson's", "memory loss", "neurological"],
  },
  q17szonly: {
    id: "q17szonly",
    text: "Is it only seizure/epilepsy disorder (no other neuro conditions)?",
    topics: ["seizure only"],
  },
  q17count: {
    id: "q17count",
    text: "How many seizures have they had in the last 12 months?",
    topics: ["seizure count"],
  },
  q17meds: {
    id: "q17meds",
    text: "Are they currently prescribed more than 1 medication?",
    topics: ["neuro meds"],
  },
  q18: {
    id: "q18",
    text: "Have you ever been diagnosed with a mental health disorder such as severe anxiety, severe depression, bipolar, schizophrenia, psychosis, or attempted suicide? [Male/Female] Have you experienced moderate anxiety or depression, or a personality disorder?",
    topics: ["mental health", "anxiety", "depression", "bipolar", "schizophrenia", "psychosis", "suicide", "personality disorder", "postpartum depression"],
    followUps: ["q18medscount", "q18moderate", "q4", "q6", "q8", "q17", "q21"], // Sub-steps then related
  },
  q18medscount: {
    id: "q18medscount",
    text: "How many medications are they currently prescribed to control symptoms?",
    topics: ["mental health", "medications"],
  },
  q18moderate: {
    id: "q18moderate",
    text: "Do they have moderate anxiety/depression or a personality disorder (if male/female as applicable)?",
    topics: ["mental health", "moderate"],
  },
  q19: {
    id: "q19",
    text: "Have you ever been diagnosed with Crohn's disease, ulcerative colitis, hepatitis (excluding hepatitis A), pancreatitis, pancreatic cancer, intestinal bleeding, or other disorders of the stomach, intestine, liver, or pancreas?",
    topics: ["crohn's disease", "ulcerative colitis", "hepatitis", "pancreatitis", "pancreatic cancer", "intestinal bleeding", "stomach", "intestine", "liver", "pancreas", "digestive", "diverticulitis"],
  },
  q19ibd: {
    id: "q19ibd",
    text: "Were they diagnosed with diverticulitis, Crohn's disease, or ulcerative colitis more than 12 months ago?",
    topics: ["ibd"],
  },
  q19fu: {
    id: "q19fu",
    text: "Have they had routine medical follow-up/surveillance in the past 2 years?",
    topics: ["follow-up"],
  },
  q19sev: {
    id: "q19sev",
    text: "Any of: 2+ surgeries in 5 years, missed work/school in 2 years, hospitalized in 2 years, or flare in last 12 months?",
    topics: ["severity"],
  },
  q20: {
    id: "q20",
    text: "Excluding controlled hypothyroidism/hyperthyroidism, have you ever been diagnosed with, shown symptoms, received treatment for, or recommended therapy or medication for any of the following disorders: Adrenal, parathyroid, pituitary, hormone, metabolic or any other endocrine, gland, or metabolic disorders?",
    topics: ["endocrine", "adrenal", "parathyroid", "pituitary", "hormone", "metabolic", "thyroid", "hypothyroidism", "hyperthyroidism"],
  },
  q21: {
    id: "q21",
    text: "Have you ever been diagnosed with multiple sclerosis, muscular dystrophy, numbness or weakness of an arm or leg, or paralysis?",
    topics: ["multiple sclerosis", "ms", "muscular dystrophy", "numbness", "weakness", "paralysis", "neuromuscular", "ambulatory", "disability"],
  },
  q21prog: {
    id: "q21prog",
    text: "In the last 2 years, is MS progressive with loss of bowel or bladder function?",
    topics: ["ms progressive"],
  },
  q21amb: {
    id: "q21amb",
    text: "Do they have ambulatory or disability issues?",
    topics: ["ambulatory", "disability"],
  },
  q21attacks: {
    id: "q21attacks",
    text: "Have they had more than 2 attacks in the last 12 months?",
    topics: ["ms attacks"],
  },
  q22: {
    id: "q22",
    text: "Have you ever been diagnosed with rheumatoid arthritis, psoriatic arthritis, or spinal disc disease?",
    topics: ["rheumatoid arthritis", "psoriatic arthritis", "spinal disc disease", "arthritis", "joints", "spine"],
  },
  q22daily: {
    id: "q22daily",
    text: "Do they experience daily symptoms such as loss of movement or disability?",
    topics: ["arthritis", "daily symptoms"],
  },
  q22surgery: {
    id: "q22surgery",
    text: "Have they undergone surgery to treat their condition?",
    topics: ["arthritis", "surgery"],
  },
  q22meds: {
    id: "q22meds",
    text: "Are they currently on any prescribed daily medication to control symptoms?",
    topics: ["arthritis", "medication"],
  },
  q23: {
    id: "q23",
    text: "In the last 2 years or in the next 12 months, have you participated in or do you intend to participate in any of the following high-risk activities or sports: mountain climbing, ice climbing, paragliding, parasailing, hang gliding, skydiving, scuba diving (excluding casual vacation resort), bungee jumping, heli-skiing, backcountry skiing, backcountry snowmobiling, aviation (excluding passenger or pilot on scheduled flights), motor racing, or kitesurfing?",
    topics: ["extreme sports", "mountain climbing", "ice climbing", "paragliding", "skydiving", "scuba diving", "bungee jumping", "motor racing", "aviation"],
  },
  q23hi: {
    id: "q23hi",
    text: "Do they participate in highest-risk activities (e.g., free solo, international 6000m+, YDS 5.11+, NCCS VI, solo/night/cave/wreck scuba, >240 km/h racing)?",
    topics: ["extreme sports", "highest risk"],
  },
  q23mid: {
    id: "q23mid",
    text: "Do they participate in moderate-risk activities (e.g., ice/glacier climbing, >4000m, YDS 5.8 or NCCS V, bungee, hang/paragliding, scuba >45m)?",
    topics: ["extreme sports", "moderate risk"],
  },
  q24: {
    id: "q24",
    text: "To your knowledge, have any of your immediate family member(s) (father, mother, brother or sister), ever been diagnosed before the age of 65 with Amyotrophic Lateral Sclerosis, Cardiomyopathy, Hereditary non-polyposis colon cancer, Huntington's disease, Lynch syndrome, Huntington's disease, Muscular dystrophy, or Polycystic kidney disease? Before age 60, have 2 or more of your immediate family members (mother, father, brother or sister) been diagnosed with cancer, stroke, heart attack, angina, bypass, angioplasty, multiple sclerosis, motor neuron disease, Alzheimer's disease or dementia? Has 1 or more immediate family members been diagnosed before the age of 50?",
    topics: ["family history", "hereditary", "als", "cardiomyopathy", "huntington's disease", "lynch syndrome", "muscular dystrophy", "polycystic kidney disease", "family"],
  },
  q24two: {
    id: "q24two",
    text: "Before age 60, have 2 or more immediate family members been diagnosed with the listed conditions?",
    topics: ["family history", "two before 60"],
  },
  q24under50: {
    id: "q24under50",
    text: "Has at least 1 immediate family member been diagnosed before age 50?",
    topics: ["family history", "under 50"],
  },
  q24hereditary: {
    id: "q24hereditary",
    text: "Any hereditary conditions (ALS, cardiomyopathy, HNPCC/Lynch, Huntington's, muscular dystrophy, polycystic kidney)?",
    topics: ["hereditary"],
  },
  q25: {
    id: "q25",
    text: "Within the next 12 months, do you plan to travel to a high-risk country or conflict region or a region at war?",
    topics: ["travel", "high-risk country", "conflict regions", "war", "reside outside canada"],
  },
  q25res: {
    id: "q25res",
    text: "Within the next 12 months, do they intend to reside outside of Canada for at least six consecutive months?",
    topics: ["reside outside canada"],
  },
};

/**
 * Get question description by ID
 */
export function getQuestionDescription(
  questionId: string
): QuestionDescription | undefined {
  return QUESTION_DESCRIPTIONS[questionId];
}

/**
 * Get follow-up question IDs for a specific question
 */
export function getFollowUpsForQuestion(questionId: string): string[] {
  return QUESTION_DESCRIPTIONS[questionId]?.followUps ?? [];
}

/**
 * Get all question IDs that cover a specific topic/condition
 * Uses keyword matching on topics array
 */
export function getQuestionsForTopic(
  topic: string
): string[] {
  const normalizedTopic = topic.toLowerCase().trim();
  const matchingQuestions: string[] = [];

  for (const [questionId, description] of Object.entries(QUESTION_DESCRIPTIONS)) {
    if (
      description.topics.some((t) =>
        t.toLowerCase().includes(normalizedTopic) ||
        normalizedTopic.includes(t.toLowerCase())
      )
    ) {
      matchingQuestions.push(questionId);
    }
  }

  return matchingQuestions;
}

/**
 * Get questions relevant for mentioned conditions
 */
export function getQuestionsForMentionedConditions(
  conditions: string[]
): string[] {
  const questionIds = new Set<string>();

  for (const condition of conditions) {
    const matching = getQuestionsForTopic(condition);
    for (const qId of matching) {
      questionIds.add(qId);
    }
  }

  return Array.from(questionIds);
}

