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
    text: "Provide your height and weight (calculate BMI). [Female only] Are you currently pregnant?",
    topics: ["height", "weight", "bmi", "body mass index", "pregnancy", "pregnant", "birth", "weight loss"],
    followUps: ["q11", "q12", "q19", "q22"], // Questions that depend on BMI
  },
  q3: {
    id: "q3",
    text: "Are you currently working? Does your duties involve any high-risk or moderate-risk occupations?",
    topics: ["work", "working", "employment", "occupation", "job", "diving", "military", "pilot", "logging", "mining", "institutionalized", "nursing facility", "hospital"],
  },
  q4: {
    id: "q4",
    text: "Do you consume alcohol? How many standard alcohol drinks do you consume on average per week?",
    topics: ["alcohol", "drinking", "beer", "wine", "liquor", "drinks", "etoh"],
    followUps: ["q6", "q7", "q8", "q18"], // Questions that check alcohol consumption
  },
  q5: {
    id: "q5",
    text: "In the last 12 months, have you used marijuana, hashish or cannabis in any form? Do you mix marijuana with tobacco? Confirm frequency per week?",
    topics: ["marijuana", "cannabis", "hashish", "weed", "pot", "thc"],
  },
  q6: {
    id: "q6",
    text: "Excluding marijuana, cannabis or hashish, have you ever used any other illicit drugs such as Amphetamines, Anabolic Steroids, Barbiturates, Cocaine, Ecstasy, Hallucinogens, Heroin, Methadone, Opium, Speed, LSD, DMT, or any of the following not prescribed by a doctor or physician: Morphine, Demerol, Codein, or Fentanyl? Date of last use?",
    topics: ["illicit drugs", "drugs", "cocaine", "heroin", "amphetamines", "steroids", "ecstasy", "lsd", "hallucinogens", "speed", "opium", "methadone", "fentanyl", "morphine", "codeine"],
    followUps: ["q7", "q18"], // Questions that check drug use
  },
  q7: {
    id: "q7",
    text: "Have you ever received treatment (including the participation in a support group), or have you ever been advised to reduce your consumption or seek treatment regarding the use of alcohol or any drug? Did you receive treatment for alcohol consumption only? When did you last receive treatment?",
    topics: ["treatment", "rehabilitation", "rehab", "support group", "alcohol treatment", "drug treatment"],
  },
  q8: {
    id: "q8",
    text: "In the last 3 years, have you been charged, convicted, or do you have charges pending for driving with a blood alcohol above the legal limit, under the influence, or impaired driving (DUI/DWI)? Have you had 2 or more DUIs?",
    topics: ["dui", "dwi", "driving under influence", "impaired driving", "drunk driving"],
    followUps: ["q18"], // Q18 checks DUI
  },
  q9: {
    id: "q9",
    text: "Excluding DUI/DWI, in the last 5 years have you been convicted or incarcerated of any criminal offence or have charges or sentencing currently pending? Have you ever been charged/convicted 2 or more times? If incarcerated, was it for 6 months or more? When did you complete your sentence, parole or probation?",
    topics: ["criminal", "conviction", "incarceration", "prison", "jail", "criminal charges", "sentencing", "parole", "probation"],
  },
  q10: {
    id: "q10",
    text: "Excluding annual tests, routine pregnancy or childbirth-related follow-ups with normal results, common cold, flu or seasonal allergies, strains or sprains: Do you have any physical or mental symptoms for which you have not yet consulted a health professional? Have you been advised of an abnormal test result, or to have treatment or investigations which have not yet started or been completed, or are you awaiting results of any medical investigations?",
    topics: ["symptoms", "pending tests", "abnormal test", "medical investigations", "pending treatment"],
  },
  q11: {
    id: "q11",
    text: "Excluding treated and controlled high blood pressure and/or cholesterol have you had or been told you have, been investigated, been treated, taken medication, or been prescribed medication, had surgery or a procedure for: Heart disease, heart attack, angina, heart murmur, abnormal heart rhythm, aneurysm, blood clots, cerebrovascular disease (stroke or mini-stroke such as TIA), or any other disease of the heart or the blood vessels (angioplasty, atherosclerosis, heart bypass, heart stent, peripheral vascular disease)? Are you currently free of symptoms, stable with regular follow-up with no pending surgery? When were you diagnosed? When was your last follow-up?",
    topics: ["heart disease", "heart attack", "angina", "heart murmur", "arrhythmia", "aneurysm", "blood clots", "stroke", "tia", "cad", "cardiovascular", "angioplasty", "bypass", "stent", "peripheral vascular disease"],
    followUps: ["q12", "q15"], // Q12 and Q15 check for CAD
  },
  q12: {
    id: "q12",
    text: "[Female] Have you ever been diagnosed with gestational diabetes (within the last 2 years), diabetes or pre-diabetes? Were you diagnosed with Diabetes type 1? Have you ever had complications of your diabetes? Have you monitored your blood sugar levels in the last 3 months with an average HbA1c or A1C result? Are you currently taking or have you been prescribed any medication to treat your diabetes? [Male] Have you ever been diagnosed with diabetes or pre-diabetes?",
    topics: ["diabetes", "diabetic", "type 1 diabetes", "type 2 diabetes", "gestational diabetes", "pre-diabetes", "blood sugar", "hba1c", "a1c", "insulin"],
    followUps: ["q22"], // Q22 checks for diabetes
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
    text: "Have you ever been diagnosed with shortness of breath, emphysema, Chronic Obstructive Pulmonary Disease (COPD), or cystic fibrosis? Have you been on oxygen therapy in the last 2 years? Have you been diagnosed, treated, or been prescribed treatment for sleep apnea? Do you use a treatment everyday such as a BIPAP, CPAP, or any other machine or oral appliance? Have you ever been diagnosed with asthma or chronic bronchitis? Have you been prescribed steroids, take 2 or more daily inhalers, admitted or hospitalized to control your asthma symptoms within the last 2 years?",
    topics: ["copd", "emphysema", "cystic fibrosis", "shortness of breath", "oxygen therapy", "sleep apnea", "bipap", "cpap", "asthma", "chronic bronchitis", "respiratory"],
  },
  q16: {
    id: "q16",
    text: "[MALE] Have you ever been diagnosed with a prostate disorder or elevated Prostate Specific Antigen (PSA), disorder of the testes, nephritis, nephropathy, kidney disease, polycystic kidney disease or any other genitourinary disorder? In the last 2 years, have you been diagnosed with or told you had sugar or blood in the urine, elevated PSA due to an infection treated with antibiotics? [FEMALE] Have you ever been diagnosed with a disorder of the ovaries, uterus or genitals? Have you ever been diagnosed with nephritis, nephropathy, kidney disease, polycystic kidney disease or any other genitourinary disorder? In the last 2 years, have you been diagnosed with or told you had sugar or blood in the urine (excluding menstrual related), or any abnormal pap smear?",
    topics: ["prostate", "psa", "testes", "nephritis", "nephropathy", "kidney disease", "polycystic kidney disease", "genitourinary", "ovaries", "uterus", "genitals", "pap smear", "urine"],
    followUps: ["q22"], // Q22 checks for genitourinary disorders
  },
  q17: {
    id: "q17",
    text: "Have you ever been diagnosed with Alzheimer, seizures, motor neuron disease, dementia, autism, cerebral palsy, motor neuron syndrome, memory loss, Parkinson's disease or other congenital developmental disorder? Were you diagnosed with only seizure or epilepsy disorder? How many seizures have you had in the last 12 months? Are you currently prescribed more than 1 medication?",
    topics: ["alzheimer", "seizures", "epilepsy", "motor neuron disease", "dementia", "autism", "cerebral palsy", "parkinson's", "memory loss", "neurological"],
  },
  q18: {
    id: "q18",
    text: "Have you ever been diagnosed with a mental health disorder such as severe anxiety, severe depression, bipolar, epilepsy, schizophrenia, psychosis, or attempted suicide? Are you currently prescribed 3 or more medications to control your symptoms? [Male] Have you ever experienced moderate anxiety, moderate depression, or a personality disorder? [Female] Have you ever experienced moderate anxiety, moderate depression (including postpartum depression), or a personality disorder?",
    topics: ["mental health", "anxiety", "depression", "bipolar", "schizophrenia", "psychosis", "suicide", "personality disorder", "postpartum depression"],
    followUps: ["q4", "q6", "q8", "q17", "q21"], // Questions that check mental health
  },
  q19: {
    id: "q19",
    text: "Have you ever been diagnosed with Crohn's disease, ulcerative colitis, hepatitis (excluding hepatitis A), pancreatitis, pancreatic cancer, intestinal bleeding, or other disorders of the stomach, intestine (excluding irritable bowel syndrome - IBS), liver, or pancreas? Were you diagnosed with diverticulitis, Crohn's disease, or ulcerative colitis more than 12 months ago? Have you had a routine medical follow-up or surveillance in the past 2 years? Have you had 2 surgeries or more within the last 5 years, missed any time off work/school in the last 2 years, been hospitalized within the last 2 years, or had a flare within the last 12 months?",
    topics: ["crohn's disease", "ulcerative colitis", "hepatitis", "pancreatitis", "pancreatic cancer", "intestinal bleeding", "stomach", "intestine", "liver", "pancreas", "digestive", "diverticulitis"],
  },
  q20: {
    id: "q20",
    text: "Excluding controlled hypothyroidism/hyperthyroidism, have you ever been diagnosed with, shown symptoms, received treatment for, or recommended therapy or medication for any of the following disorders: Adrenal, parathyroid, pituitary, hormone, metabolic or any other endocrine, gland, or metabolic disorders?",
    topics: ["endocrine", "adrenal", "parathyroid", "pituitary", "hormone", "metabolic", "thyroid", "hypothyroidism", "hyperthyroidism"],
  },
  q21: {
    id: "q21",
    text: "Have you ever been diagnosed with multiple sclerosis, muscular dystrophy, numbness or weakness of an arm or leg, or paralysis? In the last 2 years, were you diagnosed with multiple sclerosis, progressive pattern with loss of bowel, or bladder function? Do you currently have ambulatory or disability issues, or have you had more than 2 attacks in the 12 months?",
    topics: ["multiple sclerosis", "ms", "muscular dystrophy", "numbness", "weakness", "paralysis", "neuromuscular", "ambulatory", "disability"],
  },
  q22: {
    id: "q22",
    text: "Have you ever been diagnosed with rheumatoid arthritis, psoriatic arthritis, or spinal disc disease? Have you ever experienced daily symptoms such as loss of movement or disability, or have you ever undergone surgery to treat your condition? Are you currently on any prescribed daily medication to control your symptoms?",
    topics: ["rheumatoid arthritis", "psoriatic arthritis", "spinal disc disease", "arthritis", "joints", "spine"],
  },
  q23: {
    id: "q23",
    text: "In the last 2 years or in the next 12 months, have you participated in or do you intend to participate in any of the following high-risk activities or sports: mountain climbing, ice climbing, paragliding, parasailing, hang gliding, skydiving, scuba diving (excluding casual vacation resort), bungee jumping, heli-skiing, backcountry skiing, backcountry snowmobiling, aviation (excluding passenger or pilot on scheduled flights), motor racing, or kitesurfing?",
    topics: ["extreme sports", "mountain climbing", "ice climbing", "paragliding", "skydiving", "scuba diving", "bungee jumping", "motor racing", "aviation"],
  },
  q24: {
    id: "q24",
    text: "To your knowledge, have any of your immediate family member(s) (father, mother, brother or sister), ever been diagnosed before the age of 65 with Amyotrophic Lateral Sclerosis, Cardiomyopathy, Hereditary non-polyposis colon cancer, Huntington's disease, Lynch syndrome, Huntington's disease, Muscular dystrophy, or Polycystic kidney disease? Before age 60, have 2 or more of your immediate family members (mother, father, brother or sister) been diagnosed with cancer, stroke, heart attack, angina, bypass, angioplasty, multiple sclerosis, motor neuron disease, Alzheimer's disease or dementia? Has 1 or more immediate family members been diagnosed before the age of 50?",
    topics: ["family history", "hereditary", "als", "cardiomyopathy", "huntington's disease", "lynch syndrome", "muscular dystrophy", "polycystic kidney disease", "family"],
  },
  q25: {
    id: "q25",
    text: "Within the next 12 months, do you plan to travel to a high-risk country or conflict regions or regions at war? Within the next 12 months, do you intend to reside outside of Canada for at least six consecutive months?",
    topics: ["travel", "high-risk country", "conflict regions", "war", "reside outside canada"],
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

