type PLANS = "Day1" | "Day1+" | "Signature" | "Deferred+" | "Guaranteed+";

export type QUESTION_TYPE = {
  id: string;
  text: string;
  resulting_nodes?: QUESTION_TYPE[];
  resulting_plans?: Array<PLANS | "DENIAL">;
};
