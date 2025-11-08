# Questionnaire Test Suite - 30 Test Cases

## Test Case 1: Healthy Young Non-Smoker
**Profile:** Male, 28, 180cm, 75kg (BMI: 23.1)
**Answers:**
- Q1: No tobacco → NON_SMOKER
- Q2: Height 180cm, Weight 75kg → BMI 23.1 → Day1
- Q3: Yes, working (office job) → Day1
- Q4: No alcohol → Day1
- Q5: No marijuana → Day1
**Expected Outcome:** Day1

---

## Test Case 2: Smoker with High BMI
**Profile:** Female, 35, 165cm, 95kg (BMI: 34.9)
**Answers:**
- Q1: Yes tobacco → SMOKER
- Q2: Height 165cm, Weight 95kg → BMI 34.9 → Day1
- Q3: Yes, working (retail) → Day1
- Q4: 8 drinks/week → Day1
- Q5: No marijuana → Day1
**Expected Outcome:** Day1 (SMOKER rates)

---

## Test Case 3: Very High BMI - Guaranteed+
**Profile:** Male, 42, 175cm, 140kg (BMI: 45.7)
**Answers:**
- Q1: No tobacco → NON_SMOKER
- Q2: Height 175cm, Weight 140kg → BMI 45.7 → Guaranteed+ (BMI >= 44.1)
**Expected Outcome:** Guaranteed+

---

## Test Case 4: High BMI with Weight Loss
**Profile:** Female, 38, 160cm, 90kg (BMI: 35.2)
**Answers:**
- Q1: No tobacco → NON_SMOKER
- Q2: Height 160cm, Weight 90kg → BMI 35.2 → Day1+, Lost 12kg unintentionally → Deferred+
**Expected Outcome:** Deferred+

---

## Test Case 5: Commercial Diver - Deferred+
**Profile:** Male, 30, 180cm, 80kg (BMI: 24.7)
**Answers:**
- Q1: No tobacco → NON_SMOKER
- Q2: Height 180cm, Weight 80kg → BMI 24.7 → Day1
- Q3: Yes, working → Commercial diving → Deferred+
**Expected Outcome:** Deferred+

---

## Test Case 6: High-Risk Job - Signature
**Profile:** Male, 45, 175cm, 85kg (BMI: 27.8)
**Answers:**
- Q1: No tobacco → NON_SMOKER
- Q2: Height 175cm, Weight 85kg → BMI 27.8 → Day1
- Q3: Yes, working → Pilot (non-commercial) → Signature
**Expected Outcome:** Signature

---

## Test Case 7: High Alcohol Consumption
**Profile:** Male, 32, 178cm, 82kg (BMI: 25.9)
**Answers:**
- Q1: No tobacco → NON_SMOKER
- Q2: Height 178cm, Weight 82kg → BMI 25.9 → Day1
- Q3: Yes, working (office) → Day1
- Q4: Yes alcohol → 25 drinks/week → Guaranteed+ (21-28 with no Q18)
**Expected Outcome:** Guaranteed+

---

## Test Case 8: Marijuana User - Non-Smoker Rates
**Profile:** Female, 25, 165cm, 60kg (BMI: 22.0)
**Answers:**
- Q1: No tobacco → NON_SMOKER
- Q2: Height 165cm, Weight 60kg → BMI 22.0 → Day1
- Q3: Yes, working → Day1
- Q4: 5 drinks/week → Day1
- Q5: Yes marijuana → No tobacco mix → NON_SMOKER, 2x/week, Age 25 → Day1+
**Expected Outcome:** Day1+ (NON_SMOKER rates)

---

## Test Case 9: Heavy Marijuana User - Guaranteed+
**Profile:** Male, 22, 180cm, 75kg (BMI: 23.1)
**Answers:**
- Q1: No tobacco → NON_SMOKER
- Q2: Height 180cm, Weight 75kg → BMI 23.1 → Day1
- Q3: Yes, working → Day1
- Q4: 3 drinks/week → Day1
- Q5: Yes marijuana → No tobacco mix → NON_SMOKER, 18x/week → Guaranteed+ (15+)
**Expected Outcome:** Guaranteed+

---

## Test Case 10: Recent Illicit Drug Use - DECLINE
**Profile:** Male, 28, 175cm, 78kg (BMI: 25.5)
**Answers:**
- Q1: No tobacco → NON_SMOKER
- Q2: Height 175cm, Weight 78kg → BMI 25.5 → Day1
- Q3: Yes, working → Day1
- Q4: 6 drinks/week → Day1
- Q5: No marijuana → Day1
- Q6: Yes illicit drugs → Last use 8 months ago → DECLINE (< 1 year)
**Expected Outcome:** DECLINE

---

## Test Case 11: Past Drug Use with Mental Health
**Profile:** Female, 30, 165cm, 70kg (BMI: 25.7)
**Answers:**
- Q1: No tobacco → NON_SMOKER
- Q2: Height 165cm, Weight 70kg → BMI 25.7 → Day1
- Q3: Yes, working → Day1
- Q4: 22 drinks/week → Day1+
- Q5: No marijuana → Day1
- Q6: Yes illicit drugs → Last use 1.5 years ago → Check Q18 or Q4 (21+) → DECLINE
- Q18: Yes severe anxiety → Guaranteed+
**Expected Outcome:** DECLINE (combination rule)

---

## Test Case 12: Alcohol Treatment - Recent
**Profile:** Male, 40, 180cm, 85kg (BMI: 26.2)
**Answers:**
- Q1: No tobacco → NON_SMOKER
- Q2: Height 180cm, Weight 85kg → BMI 26.2 → Day1
- Q3: Yes, working → Day1
- Q4: 5 drinks/week → Day1
- Q5: No marijuana → Day1
- Q6: No illicit drugs → Day1
- Q7: Yes treatment → Alcohol only → Last treatment 6 months ago → Guaranteed+ (< 1 year)
**Expected Outcome:** Guaranteed+

---

## Test Case 13: Multiple DUIs - Guaranteed+
**Profile:** Male, 50, 175cm, 90kg (BMI: 29.4)
**Answers:**
- Q1: No tobacco → NON_SMOKER
- Q2: Height 175cm, Weight 90kg → BMI 29.4 → Day1
- Q3: Yes, working → Day1
- Q4: 10 drinks/week → Day1
- Q5: No marijuana → Day1
- Q6: No illicit drugs → Day1
- Q7: No treatment → Day1
- Q8: Yes DUI → 2+ DUIs → Guaranteed+
**Expected Outcome:** Guaranteed+

---

## Test Case 14: Single DUI - Day1+
**Profile:** Female, 35, 165cm, 65kg (BMI: 23.9)
**Answers:**
- Q1: No tobacco → NON_SMOKER
- Q2: Height 165cm, Weight 65kg → BMI 23.9 → Day1
- Q3: Yes, working → Day1
- Q4: 8 drinks/week → Day1
- Q5: No marijuana → Day1
- Q6: No illicit drugs → Day1
- Q7: No treatment → Day1
- Q8: Yes DUI → 1 DUI, Age 35 → Day1+
**Expected Outcome:** Day1+

---

## Test Case 15: Criminal Offense - Recent
**Profile:** Male, 28, 180cm, 80kg (BMI: 24.7)
**Answers:**
- Q1: No tobacco → NON_SMOKER
- Q2: Height 180cm, Weight 80kg → BMI 24.7 → Day1
- Q3: Yes, working → Day1
- Q4: 5 drinks/week → Day1
- Q5: No marijuana → Day1
- Q6: No illicit drugs → Day1
- Q7: No treatment → Day1
- Q8: No DUI → Day1
- Q9: Yes criminal offense → 1 offense, Not incarcerated 6+ months → Completed sentence 2 years ago → Guaranteed+ (< 3 years)
**Expected Outcome:** Guaranteed+

---

## Test Case 16: Pending Medical Investigation
**Profile:** Female, 32, 170cm, 70kg (BMI: 24.2)
**Answers:**
- Q1: No tobacco → NON_SMOKER
- Q2: Height 170cm, Weight 70kg → BMI 24.2 → Day1
- Q3: Yes, working → Day1
- Q4: 4 drinks/week → Day1
- Q5: No marijuana → Day1
- Q6: No illicit drugs → Day1
- Q7: No treatment → Day1
- Q8: No DUI → Day1
- Q9: No criminal → Day1
- Q10: No symptoms → Day1, Yes abnormal test awaiting results → Guaranteed+
**Expected Outcome:** Guaranteed+

---

## Test Case 17: Heart Disease - Recent Diagnosis
**Profile:** Male, 45, 175cm, 95kg (BMI: 31.0), SMOKER
**Answers:**
- Q1: Yes tobacco → SMOKER
- Q2: Height 175cm, Weight 95kg → BMI 31.0 → Day1
- Q3: Yes, working → Day1
- Q4: 6 drinks/week → Day1
- Q5: No marijuana → Day1
- Q6: No illicit drugs → Day1
- Q7: No treatment → Day1
- Q8: No DUI → Day1
- Q9: No criminal → Day1
- Q10: No pending → Day1
- Q11: Yes heart disease → BMI < 44, Not stable → Deferred+, Check smoker → Guaranteed+
**Expected Outcome:** Guaranteed+

---

## Test Case 18: Type 1 Diabetes - Well Controlled
**Profile:** Male, 30, 180cm, 80kg (BMI: 24.7)
**Answers:**
- Q1: No tobacco → NON_SMOKER
- Q2: Height 180cm, Weight 80kg → BMI 24.7 → Day1
- Q3: Yes, working → Day1
- Q4: 5 drinks/week → Day1
- Q5: No marijuana → Day1
- Q6: No illicit drugs → Day1
- Q7: No treatment → Day1
- Q8: No DUI → Day1
- Q9: No criminal → Day1
- Q10: No pending → Day1
- Q11: No heart disease → Day1
- Q12: Yes diabetes → Type 1 → BMI < 40, No CAD → No complications → HbA1c 6.8% (< 7.5%) → Guaranteed+
**Expected Outcome:** Guaranteed+

---

## Test Case 19: Type 2 Diabetes - Poor Control
**Profile:** Female, 50, 165cm, 85kg (BMI: 31.2)
**Answers:**
- Q1: No tobacco → NON_SMOKER
- Q2: Height 165cm, Weight 85kg → BMI 31.2 → Day1
- Q3: Yes, working → Day1
- Q4: 4 drinks/week → Day1
- Q5: No marijuana → Day1
- Q6: No illicit drugs → Day1
- Q7: No treatment → Day1
- Q8: No DUI → Day1
- Q9: No criminal → Day1
- Q10: No pending → Day1
- Q11: No heart disease → Day1
- Q12: Yes diabetes → Type 2 → Taking medication → Age 50, No CAD → BMI < 40 → HbA1c 8.2% (>= 7.5%) → BMI 31.2 (18-36) → Day1+
**Expected Outcome:** Day1+

---

## Test Case 20: Cancer History - Deferred+
**Profile:** Female, 40, 170cm, 75kg (BMI: 25.9)
**Answers:**
- Q1: No tobacco → NON_SMOKER
- Q2: Height 170cm, Weight 75kg → BMI 25.9 → Day1
- Q3: Yes, working → Day1
- Q4: 6 drinks/week → Day1
- Q5: No marijuana → Day1
- Q6: No illicit drugs → Day1
- Q7: No treatment → Day1
- Q8: No DUI → Day1
- Q9: No criminal → Day1
- Q10: No pending → Day1
- Q11: No heart disease → Day1
- Q12: No diabetes → Day1
- Q13: Yes cancer → Diagnosed 5 years ago → Deferred+
**Expected Outcome:** Deferred+

---

## Test Case 21: HIV/AIDS - Guaranteed+
**Profile:** Male, 35, 180cm, 75kg (BMI: 23.1)
**Answers:**
- Q1: No tobacco → NON_SMOKER
- Q2: Height 180cm, Weight 75kg → BMI 23.1 → Day1
- Q3: Yes, working → Day1
- Q4: 3 drinks/week → Day1
- Q5: No marijuana → Day1
- Q6: No illicit drugs → Day1
- Q7: No treatment → Day1
- Q8: No DUI → Day1
- Q9: No criminal → Day1
- Q10: No pending → Day1
- Q11: No heart disease → Day1
- Q12: No diabetes → Day1
- Q13: No cancer → Day1
- Q14: Yes HIV/AIDS → Guaranteed+
**Expected Outcome:** Guaranteed+

---

## Test Case 22: COPD with Oxygen - Guaranteed+
**Profile:** Male, 60, SMOKER, 175cm, 85kg (BMI: 27.8)
**Answers:**
- Q1: Yes tobacco → SMOKER
- Q2: Height 175cm, Weight 85kg → BMI 27.8 → Day1
- Q3: Yes, working → Day1
- Q4: 5 drinks/week → Day1
- Q5: No marijuana → Day1
- Q6: No illicit drugs → Day1
- Q7: No treatment → Day1
- Q8: No DUI → Day1
- Q9: No criminal → Day1
- Q10: No pending → Day1
- Q11: No heart disease → Day1
- Q12: No diabetes → Day1
- Q13: No cancer → Day1
- Q14: No immune disorder → Day1
- Q15: Yes COPD → Oxygen therapy in last 2 years → Guaranteed+
**Expected Outcome:** Guaranteed+

---

## Test Case 23: Sleep Apnea with CPAP - Day1+
**Profile:** Male, 45, 180cm, 100kg (BMI: 30.9)
**Answers:**
- Q1: No tobacco → NON_SMOKER
- Q2: Height 180cm, Weight 100kg → BMI 30.9 → Day1
- Q3: Yes, working → Day1
- Q4: 7 drinks/week → Day1
- Q5: No marijuana → Day1
- Q6: No illicit drugs → Day1
- Q7: No treatment → Day1
- Q8: No DUI → Day1
- Q9: No criminal → Day1
- Q10: No pending → Day1
- Q11: No heart disease → Day1
- Q12: No diabetes → Day1
- Q13: No cancer → Day1
- Q14: No immune disorder → Day1
- Q15: No COPD → Yes sleep apnea → Using CPAP daily → No CAD → Day1+
**Expected Outcome:** Day1+

---

## Test Case 24: Severe Anxiety with Multiple Medications
**Profile:** Female, 32, 165cm, 70kg (BMI: 25.7)
**Answers:**
- Q1: No tobacco → NON_SMOKER
- Q2: Height 165cm, Weight 70kg → BMI 25.7 → Day1
- Q3: Yes, working → Day1
- Q4: 8 drinks/week → Day1
- Q5: No marijuana → Day1
- Q6: No illicit drugs → Day1
- Q7: No treatment → Day1
- Q8: No DUI → Day1
- Q9: No criminal → Day1
- Q10: No pending → Day1
- Q11: No heart disease → Day1
- Q12: No diabetes → Day1
- Q13: No cancer → Day1
- Q14: No immune disorder → Day1
- Q15: No respiratory → Day1
- Q16: No genitourinary → Day1
- Q17: No neurological → Day1
- Q18: Yes severe anxiety → 4 medications → Deferred+
**Expected Outcome:** Deferred+

---

## Test Case 25: Multiple Sclerosis - Progressive
**Profile:** Female, 38, 170cm, 68kg (BMI: 23.5)
**Answers:**
- Q1: No tobacco → NON_SMOKER
- Q2: Height 170cm, Weight 68kg → BMI 23.5 → Day1
- Q3: Yes, working → Day1
- Q4: 4 drinks/week → Day1
- Q5: No marijuana → Day1
- Q6: No illicit drugs → Day1
- Q7: No treatment → Day1
- Q8: No DUI → Day1
- Q9: No criminal → Day1
- Q10: No pending → Day1
- Q11: No heart disease → Day1
- Q12: No diabetes → Day1
- Q13: No cancer → Day1
- Q14: No immune disorder → Day1
- Q15: No respiratory → Day1
- Q16: No genitourinary → Day1
- Q17: No neurological → Day1
- Q18: No mental health → Day1
- Q21: Yes MS → Progressive with bowel/bladder loss in last 2 years → Guaranteed+
**Expected Outcome:** Guaranteed+

---

## Test Case 26: Rheumatoid Arthritis - Daily Medication
**Profile:** Female, 50, 165cm, 75kg (BMI: 27.6)
**Answers:**
- Q1: No tobacco → NON_SMOKER
- Q2: Height 165cm, Weight 75kg → BMI 27.6 → Day1
- Q3: Yes, working → Day1
- Q4: 5 drinks/week → Day1
- Q5: No marijuana → Day1
- Q6: No illicit drugs → Day1
- Q7: No treatment → Day1
- Q8: No DUI → Day1
- Q9: No criminal → Day1
- Q10: No pending → Day1
- Q11: No heart disease → Day1
- Q12: No diabetes → Day1
- Q13: No cancer → Day1
- Q14: No immune disorder → Day1
- Q15: No respiratory → Day1
- Q16: No genitourinary → Day1
- Q17: No neurological → Day1
- Q18: No mental health → Day1
- Q19: No GI → Day1
- Q20: No endocrine → Day1
- Q21: No MS → Day1
- Q22: Yes rheumatoid arthritis → No diabetes, BMI < 43 → No daily symptoms/surgery → Daily medication → Age 50 → Day1+
**Expected Outcome:** Day1+

---

## Test Case 27: Extreme Sports - Free Solo Climbing
**Profile:** Male, 28, 180cm, 72kg (BMI: 22.2)
**Answers:**
- Q1: No tobacco → NON_SMOKER
- Q2: Height 180cm, Weight 72kg → BMI 22.2 → Day1
- Q3: Yes, working → Day1
- Q4: 4 drinks/week → Day1
- Q5: No marijuana → Day1
- Q6: No illicit drugs → Day1
- Q7: No treatment → Day1
- Q8: No DUI → Day1
- Q9: No criminal → Day1
- Q10: No pending → Day1
- Q11: No heart disease → Day1
- Q12: No diabetes → Day1
- Q13: No cancer → Day1
- Q14: No immune disorder → Day1
- Q15: No respiratory → Day1
- Q16: No genitourinary → Day1
- Q17: No neurological → Day1
- Q18: No mental health → Day1
- Q19: No GI → Day1
- Q20: No endocrine → Day1
- Q21: No MS → Day1
- Q22: No arthritis → Day1
- Q23: Yes high-risk activities → Free solo climbing → Guaranteed+
**Expected Outcome:** Guaranteed+

---

## Test Case 28: Family History - Multiple Early Cancers
**Profile:** Female, 35, 170cm, 70kg (BMI: 24.2)
**Answers:**
- Q1: No tobacco → NON_SMOKER
- Q2: Height 170cm, Weight 70kg → BMI 24.2 → Day1
- Q3: Yes, working → Day1
- Q4: 5 drinks/week → Day1
- Q5: No marijuana → Day1
- Q6: No illicit drugs → Day1
- Q7: No treatment → Day1
- Q8: No DUI → Day1
- Q9: No criminal → Day1
- Q10: No pending → Day1
- Q11: No heart disease → Day1
- Q12: No diabetes → Day1
- Q13: No cancer → Day1
- Q14: No immune disorder → Day1
- Q15: No respiratory → Day1
- Q16: No genitourinary → Day1
- Q17: No neurological → Day1
- Q18: No mental health → Day1
- Q19: No GI → Day1
- Q20: No endocrine → Day1
- Q21: No MS → Day1
- Q22: No arthritis → Day1
- Q23: No high-risk activities → Day1
- Q24: No hereditary disorders → 2+ family members before 60 → 1+ before 50 → Signature
**Expected Outcome:** Signature

---

## Test Case 29: Travel to High-Risk Country
**Profile:** Male, 30, 180cm, 80kg (BMI: 24.7)
**Answers:**
- Q1: No tobacco → NON_SMOKER
- Q2: Height 180cm, Weight 80kg → BMI 24.7 → Day1
- Q3: Yes, working → Day1
- Q4: 6 drinks/week → Day1
- Q5: No marijuana → Day1
- Q6: No illicit drugs → Day1
- Q7: No treatment → Day1
- Q8: No DUI → Day1
- Q9: No criminal → Day1
- Q10: No pending → Day1
- Q11: No heart disease → Day1
- Q12: No diabetes → Day1
- Q13: No cancer → Day1
- Q14: No immune disorder → Day1
- Q15: No respiratory → Day1
- Q16: No genitourinary → Day1
- Q17: No neurological → Day1
- Q18: No mental health → Day1
- Q19: No GI → Day1
- Q20: No endocrine → Day1
- Q21: No MS → Day1
- Q22: No arthritis → Day1
- Q23: No high-risk activities → Day1
- Q24: No family history → Day1
- Q25: Yes travel to high-risk country → Guaranteed+
**Expected Outcome:** Guaranteed+

---

## Test Case 30: Complex Case - Multiple Conditions
**Profile:** Male, 55, SMOKER, 175cm, 110kg (BMI: 35.9)
**Answers:**
- Q1: Yes tobacco → SMOKER
- Q2: Height 175cm, Weight 110kg → BMI 35.9 → Day1+
- Q3: Yes, working (office) → Day1
- Q4: 18 drinks/week → Day1+
- Q5: No marijuana → Day1
- Q6: No illicit drugs → Day1
- Q7: No treatment → Day1
- Q8: No DUI → Day1
- Q9: No criminal → Day1
- Q10: No pending → Day1
- Q11: Yes heart disease → BMI < 44 → Stable, diagnosed 5 years ago → Last follow-up 1 year ago → BMI < 40 → Age 55, Smoker → Guaranteed+
- Q12: No diabetes → Day1
- Q13: No cancer → Day1
- Q14: No immune disorder → Day1
- Q15: Yes COPD → No oxygen → Deferred+, Check CAD or SMOKER → Guaranteed+
**Expected Outcome:** Guaranteed+ (worst outcome from multiple conditions)

---

## Test Case Summary by Expected Outcome:

- **Day1:** Cases 1, 2, 3, 5, 6, 7, 8, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29
- **Day1+:** Cases 4, 8, 14, 19, 23, 26, 30
- **Signature:** Cases 6, 28
- **Deferred+:** Cases 4, 5, 11, 20, 24
- **Guaranteed+:** Cases 3, 7, 9, 11, 12, 13, 15, 16, 17, 18, 21, 22, 25, 27, 29, 30
- **DECLINE:** Cases 10, 11

