# Questionnaire Implementation TODO

## Completed ✅
1. ✅ Database schema - Added questionnaire fields (`questionaireMode`, `clientState`, `rateType`, `questionnaireStateSnapshot`)
2. ✅ Types - All question answer types defined (`Q1Answer` through `Q25Answer`, `QuestionnaireClientState`, etc.)
3. ✅ Constants - All thresholds, dependencies, decline reasons, BMI ranges, age thresholds, etc.
4. ✅ State management - Utilities for managing client state (`createInitialState`, `calculateBMI`, `getHighestEligiblePlan`, etc.)
5. ✅ Rules engine - Complete rule evaluation for all 25 questions (`evaluateRules`, `applyRuleResult`)

## Next Steps (In Order)

### 1. Router Helper (`lib/questionaire/router.ts`)
Create helper functions for the LLM to understand available questions:
- `getAvailableQuestionsForLLM()` - Returns structured view of available questions with dependencies, formatted for LLM consumption
- `canAskQuestion()` - Checks if a specific question can be asked based on dependencies
- `getQuestionsForConditions()` - Analyzes mentioned conditions and suggests relevant questions (uses LLM interpretation, not manual mapping)
- `detectRelevantQuestions()` - Helper that provides context about which questions relate to which types of conditions

**Key Point**: The LLM will interpret which questions to ask based on conditions mentioned. This file provides the LLM with:
- List of all questions and what they cover
- Question dependencies
- Available questions based on current state
- Context about question topics (e.g., "Q11 covers heart disease, Q12 covers diabetes")

### 2. LLM Tool (`lib/questionaire/tool.ts`)
Create a tool that allows the LLM to:
- Update demographics (age, gender, height, weight, BMI)
- Answer specific questions (q1 through q25)
- Set the next question to ask
- **Add new conditions to `mentionedConditions`** - When user mentions a new condition mid-conversation
- **Trigger condition-based question discovery** - LLM can request which questions are relevant for newly mentioned conditions

The tool should integrate with:
- `updateStateWithAnswer()` from state.ts
- `evaluateRules()` from rules.ts
- `applyRuleResult()` from rules.ts
- `getAvailableQuestions()` from state.ts

### 3. Enhanced Prompt (`lib/ai/prompts.ts`)
Add `questionnairePrompt()` function that:
- Provides current client state (demographics, answers, eligible plans)
- Lists available questions with dependencies
- Shows current question status (asked, answered, pending)
- **Instructs the LLM to:**
  - Detect new conditions mentioned mid-conversation
  - Add them to `mentionedConditions` using the tool
  - Interpret which questions are relevant for newly mentioned conditions
  - Prioritize: mandatory questions → condition-relevant questions → other questions
  - Ask questions dynamically based on what the user reveals
- Provides context about what each question covers (for LLM interpretation)

### 4. Database Queries (`lib/db/queries.ts`)
Add functions to:
- `updateChatQuestionnaireState()` - Update chat's questionnaire state
- `saveMessageWithStateSnapshot()` - Save state snapshot with each message (for reversion)
- `getLastStateSnapshot()` - Get state snapshot from a specific message (for reversion)
- `getStateSnapshotByMessageId()` - Get state snapshot for a specific message ID

### 5. API Route Integration (`app/(chat)/api/chat/route.ts`)
Modify the POST handler to:
- Check if chat is in questionnaire mode (`chat.questionaireMode`)
- If yes:
  - Load current questionnaire state from `chat.clientState`
  - Get available questions using `getAvailableQuestions()`
  - Use `questionnairePrompt()` instead of default `systemPrompt`
  - Include `updateQuestionnaireStateTool` in tools array
  - After LLM response, evaluate rules and update state
  - Save state snapshot with each message
  - Update chat's `clientState` with latest state
- Handle state re-evaluation when new conditions are detected

### 6. Message Editing (`app/(chat)/actions.ts`)
Modify `deleteTrailingMessages()` to:
- When messages are deleted/edited, find the last remaining message
- Get the state snapshot from that message (`questionnaireStateSnapshot`)
- Restore the chat's `clientState` to that snapshot
- This allows users to correct answers and have state revert properly

## Key Features for Dynamic Condition Detection

### LLM-Driven Question Routing
- **No manual condition mapping** - The LLM interprets which questions are relevant based on:
  - Question descriptions provided in the prompt
  - Question topics and keywords
  - User's mentioned conditions
  - Context from the conversation

### Dynamic Question Discovery
- When user mentions a new condition:
  1. LLM detects it in the conversation
  2. LLM adds it to `mentionedConditions` via tool
  3. LLM analyzes which questions relate to that condition
  4. LLM asks relevant questions even if they weren't in the original flow
  5. System re-evaluates available questions based on new state

### State Management
- Each message stores a state snapshot
- When conditions are added, state is updated
- Available questions are recalculated dynamically
- Rules are re-evaluated when answers change

## Implementation Notes

- The LLM has access to all question descriptions and topics through the prompt
- The router helper provides structured information but doesn't make decisions
- The tool allows the LLM to update state and add conditions
- The prompt guides the LLM on how to interpret conditions and route questions
- State snapshots enable proper reversion when messages are edited

