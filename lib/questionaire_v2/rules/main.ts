import { getQuestion, type QUESTION_TYPE } from "../question_definitions";
import { apply_rule_Q1 } from "./q1";
import { apply_rule_Q2 } from "./q2";
import {
  apply_rule_Q3,
  apply_rule_Q3a,
  apply_rule_Q3b,
  apply_rule_Q3c,
} from "./q3";
import { apply_rule_Q4, apply_rule_Q4q } from "./q4";
import { apply_rule_Q5, apply_rule_Q5freq, apply_rule_Q5mix } from "./q5";
import {
  apply_rule_Q6,
  apply_rule_Q6ecstasy,
  apply_rule_Q6howmany,
  apply_rule_Q6when,
} from "./q6";
import {
  apply_rule_Q7,
  apply_rule_Q7alc,
  apply_rule_Q7yrsA,
  apply_rule_Q7yrsD,
} from "./q7";
import { apply_rule_Q8, apply_rule_Q8count } from "./q8";
import {
  apply_rule_Q9,
  apply_rule_Q9inc,
  apply_rule_Q9mult,
  apply_rule_Q9yrs,
} from "./q9";
import { apply_rule_Q10, apply_rule_Q10B } from "./q10";
import {
  apply_rule_Q11,
  apply_rule_Q11dx,
  apply_rule_Q11fu,
  apply_rule_Q11stable,
} from "./q11";
import {
  apply_rule_Q12F,
  apply_rule_Q12F1,
  apply_rule_Q12F1a,
  apply_rule_Q12F1b,
  apply_rule_Q12F2,
  apply_rule_Q12F2a,
  apply_rule_Q12F3,
  apply_rule_Q12F3a,
  apply_rule_Q12F4,
  apply_rule_Q12M,
  apply_rule_Q12M1,
  apply_rule_Q12M1a,
  apply_rule_Q12M1b,
  apply_rule_Q12M2,
  apply_rule_Q12M2b,
} from "./q12";
import { apply_rule_Q13 } from "./q13";
import { apply_rule_Q14 } from "./q14";
import {
  apply_rule_Q15,
  apply_rule_Q15asthma,
  apply_rule_Q15cpap,
  apply_rule_Q15O2,
  apply_rule_Q15sev,
  apply_rule_Q15sleep,
} from "./q15";
import {
  apply_rule_Q16F,
  apply_rule_Q16F2,
  apply_rule_Q16F3,
  apply_rule_Q16M,
  apply_rule_Q16M2,
  apply_rule_Q16M3,
} from "./q16";
import {
  apply_rule_Q17,
  apply_rule_Q17meds1,
  apply_rule_Q17meds2,
  apply_rule_Q17szCount,
  apply_rule_Q17szOnly,
} from "./q17";
import { apply_rule_Q18, apply_rule_Q18meds, apply_rule_Q18mod } from "./q18";
import {
  apply_rule_Q19,
  apply_rule_Q19fu,
  apply_rule_Q19IBD,
  apply_rule_Q19sev,
} from "./q19";
import { apply_rule_Q20 } from "./q20";
import { apply_rule_Q21, apply_rule_Q21amb, apply_rule_Q21prog } from "./q21";
import { apply_rule_Q22, apply_rule_Q22dep, apply_rule_Q22meds } from "./q22";
import { apply_rule_Q23, apply_rule_Q23hi, apply_rule_Q23mid } from "./q23";
import {
  apply_rule_Q24,
  apply_rule_Q24two,
  apply_rule_Q24under50,
} from "./q24";
import { apply_rule_Q25, apply_rule_Q25res } from "./q25";

/**
 * Updates clientState and returns the next question given the current question.
 * @param question the current question
 * @returns the next question on success
 * @returns null on error or out of questions
 */
export function apply_rule(question: QUESTION_TYPE): QUESTION_TYPE | null {
  switch (question.id) {
    case "Q1":
      return apply_rule_Q1();
    case "Q2":
      return apply_rule_Q2();
    case "Q2Pregnancy":
    case "Q2Birth":
    case "Q2PrePregnancyWeight":
    case "Q2WeightLoss":
      // These all route to Q3
      return getQuestion("Q3");
    case "Q3":
      return apply_rule_Q3();
    case "Q3a":
      return apply_rule_Q3a();
    case "Q3b":
      return apply_rule_Q3b();
    case "Q3c":
      return apply_rule_Q3c();
    case "Q4":
      return apply_rule_Q4();
    case "Q4q":
      return apply_rule_Q4q();
    case "Q5":
      return apply_rule_Q5();
    case "Q5mix":
      return apply_rule_Q5mix();
    case "Q5freq":
      return apply_rule_Q5freq();
    case "Q6":
      return apply_rule_Q6();
    case "Q6when":
      return apply_rule_Q6when();
    case "Q6ecstasy":
      return apply_rule_Q6ecstasy();
    case "Q6howmany":
      return apply_rule_Q6howmany();
    case "Q7":
      return apply_rule_Q7();
    case "Q7alc":
      return apply_rule_Q7alc();
    case "Q7yrsA":
      return apply_rule_Q7yrsA();
    case "Q7yrsD":
      return apply_rule_Q7yrsD();
    case "Q8":
      return apply_rule_Q8();
    case "Q8count":
      return apply_rule_Q8count();
    case "Q9":
      return apply_rule_Q9();
    case "Q9mult":
      return apply_rule_Q9mult();
    case "Q9inc":
      return apply_rule_Q9inc();
    case "Q9yrs":
      return apply_rule_Q9yrs();
    case "Q10":
      return apply_rule_Q10();
    case "Q10B":
      return apply_rule_Q10B();
    case "Q11":
      return apply_rule_Q11();
    case "Q11stable":
      return apply_rule_Q11stable();
    case "Q11dx":
      return apply_rule_Q11dx();
    case "Q11fu":
      return apply_rule_Q11fu();
    case "Q12F":
      return apply_rule_Q12F();
    case "Q12F1":
      return apply_rule_Q12F1();
    case "Q12F1a":
      return apply_rule_Q12F1a();
    case "Q12F1b":
      return apply_rule_Q12F1b();
    case "Q12F2":
      return apply_rule_Q12F2();
    case "Q12F2a":
      return apply_rule_Q12F2a();
    case "Q12F3":
      return apply_rule_Q12F3();
    case "Q12F3a":
      return apply_rule_Q12F3a();
    case "Q12F4":
      return apply_rule_Q12F4();
    case "Q12M":
      return apply_rule_Q12M();
    case "Q12M1":
      return apply_rule_Q12M1();
    case "Q12M1a":
      return apply_rule_Q12M1a();
    case "Q12M1b":
      return apply_rule_Q12M1b();
    case "Q12M2":
      return apply_rule_Q12M2();
    case "Q12M2b":
      return apply_rule_Q12M2b();
    case "Q13":
      return apply_rule_Q13();
    case "Q14":
      return apply_rule_Q14();
    case "Q15":
      return apply_rule_Q15();
    case "Q15O2":
      return apply_rule_Q15O2();
    case "Q15sleep":
      return apply_rule_Q15sleep();
    case "Q15asthma":
      return apply_rule_Q15asthma();
    case "Q15sev":
      return apply_rule_Q15sev();
    case "Q15cpap":
      return apply_rule_Q15cpap();
    case "Q16M":
      return apply_rule_Q16M();
    case "Q16M2":
      return apply_rule_Q16M2();
    case "Q16M3":
      return apply_rule_Q16M3();
    case "Q16F":
      return apply_rule_Q16F();
    case "Q16F2":
      return apply_rule_Q16F2();
    case "Q16F3":
      return apply_rule_Q16F3();
    case "Q17":
      return apply_rule_Q17();
    case "Q17szOnly":
      return apply_rule_Q17szOnly();
    case "Q17szCount":
      return apply_rule_Q17szCount();
    case "Q17meds1":
      return apply_rule_Q17meds1();
    case "Q17meds2":
      return apply_rule_Q17meds2();
    case "Q18":
      return apply_rule_Q18();
    case "Q18meds":
      return apply_rule_Q18meds();
    case "Q18mod":
      return apply_rule_Q18mod();
    case "Q19":
      return apply_rule_Q19();
    case "Q19IBD":
      return apply_rule_Q19IBD();
    case "Q19fu":
      return apply_rule_Q19fu();
    case "Q19sev":
      return apply_rule_Q19sev();
    case "Q20":
      return apply_rule_Q20();
    case "Q21":
      return apply_rule_Q21();
    case "Q21prog":
      return apply_rule_Q21prog();
    case "Q21amb":
      return apply_rule_Q21amb();
    case "Q22":
      return apply_rule_Q22();
    case "Q22dep":
      return apply_rule_Q22dep();
    case "Q22meds":
      return apply_rule_Q22meds();
    case "Q23":
      return apply_rule_Q23();
    case "Q23hi":
      return apply_rule_Q23hi();
    case "Q23mid":
      return apply_rule_Q23mid();
    case "Q24":
      return apply_rule_Q24();
    case "Q24two":
      return apply_rule_Q24two();
    case "Q24under50":
      return apply_rule_Q24under50();
    case "Q25":
      return apply_rule_Q25();
    case "Q25res":
      return apply_rule_Q25res();
    default:
      console.error(`No rule handler for question ${question.id}`);
      return null;
  }
}
