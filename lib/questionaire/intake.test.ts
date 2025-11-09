import assert from "node:assert/strict";
import test from "node:test";
import { applyAutoIntakeFromMessage } from "./intake";
import { calculateBMI, createInitialState } from "./state";

test("auto intake captures demographics and low-risk occupation details", () => {
  const initialState = createInitialState();
  const message =
    "Hi, I want to apply for insurance. I am 30, a male, and a non smoker, 175cm, and 75kg, working as a designer.";

  const result = applyAutoIntakeFromMessage(initialState, message);
  const updatedState = result.state;

  assert.equal(updatedState.gender, "male");
  assert.ok(updatedState.questionsAnswered.includes("gender"));

  assert.equal(updatedState.age, 30);
  assert.equal(updatedState.height, 175);
  assert.equal(updatedState.weight, 75);

  const expectedBmi = calculateBMI(175, 75);
  assert.ok(updatedState.bmi !== undefined);
  assert.ok(Math.abs((updatedState.bmi ?? 0) - expectedBmi) < 0.05);

  assert.ok(updatedState.questionsAnswered.includes("q1"));
  assert.equal(updatedState.answers.q1?.tobacco, false);
  assert.ok(updatedState.questionsAnswered.includes("q2"));
  assert.equal(updatedState.answers.q2?.bmi, expectedBmi);
  assert.ok(updatedState.questionsAnswered.includes("q3"));

  assert.equal(updatedState.answers.q3?.working, true);
  assert.equal(updatedState.answers.q3?.highRiskOccupation, undefined);
  assert.equal(updatedState.answers.q3?.moderateRiskOccupation, undefined);
  assert.equal(updatedState.planFloor, "Day1");

  assert.equal(updatedState.currentQuestion, "q4");
});

test("auto intake flags high-risk occupation and updates plan floor", () => {
  const initialState = createInitialState();
  const message =
    "Hello, I'm a 40 year old male, non smoker, 180cm tall and 90kg, currently working on an oil rig offshore.";

  const result = applyAutoIntakeFromMessage(initialState, message);
  const updatedState = result.state;

  assert.equal(updatedState.gender, "male");
  assert.ok(updatedState.questionsAnswered.includes("gender"));
  assert.ok(updatedState.questionsAnswered.includes("q1"));
  assert.ok(updatedState.questionsAnswered.includes("q2"));
  assert.ok(updatedState.questionsAnswered.includes("q3"));

  assert.equal(updatedState.answers.q3?.working, true);
  assert.equal(updatedState.answers.q3?.highRiskOccupation, true);
  assert.equal(updatedState.answers.q3?.moderateRiskOccupation, undefined);
  assert.equal(updatedState.planFloor, "Deferred+");
  assert.equal(updatedState.currentQuestion, "q4");
});

