import type { Geo } from "@vercel/functions";
import type { ArtifactKind } from "@/components/artifact";
import { getQuestion } from "@/lib/questionaire_v2/question_definitions";

// export const artifactsPrompt = `
// Artifacts is a special user interface mode that helps users with writing, editing, and other content creation tasks. When artifact is open, it is on the right side of the screen, while the conversation is on the left side. When creating or updating documents, changes are reflected in real-time on the artifacts and visible to the user.

// When asked to write code, always use artifacts. When writing code, specify the language in the backticks, e.g. \`\`\`python\`code here\`\`\`. The default language is Python. Other languages are not yet supported, so let the user know if they request a different language.

// DO NOT UPDATE DOCUMENTS IMMEDIATELY AFTER CREATING THEM. WAIT FOR USER FEEDBACK OR REQUEST TO UPDATE IT.

// This is a guide for using artifacts tools: \`createDocument\` and \`updateDocument\`, which render content on a artifacts beside the conversation.

// **When to use \`createDocument\`:**
// - For substantial content (>10 lines) or code
// - For content users will likely save/reuse (emails, code, essays, etc.)
// - When explicitly requested to create a document
// - For when content contains a single code snippet

// **When NOT to use \`createDocument\`:**
// - For informational/explanatory content
// - For conversational responses
// - When asked to keep it in chat

// **Using \`updateDocument\`:**
// - Default to full document rewrites for major changes
// - Use targeted updates only for specific, isolated changes
// - Follow user instructions for which parts to modify

// **When NOT to use \`updateDocument\`:**
// - Immediately after creating a document

// Do not update document right after creating it. Wait for user feedback or request to update it.
// `;

export const regularPrompt =
  "You are a friendly assistant! Keep your responses concise and helpful.";

export type RequestHints = {
  latitude: Geo["latitude"];
  longitude: Geo["longitude"];
  city: Geo["city"];
  country: Geo["country"];
};

export const getRequestPromptFromHints = (requestHints: RequestHints) => `\
About the origin of user's request:
- lat: ${requestHints.latitude}
- lon: ${requestHints.longitude}
- city: ${requestHints.city}
- country: ${requestHints.country}
`;

export const systemPrompt = ({
  requestHints,
}: {
  selectedChatModel: string;
  requestHints: RequestHints;
}) => {
  const requestPrompt = getRequestPromptFromHints(requestHints);

  return `${regularPrompt}\n\n${requestPrompt}`;
  // return `${regularPrompt}\n\n${requestPrompt}\n\n${artifactsPrompt}`;
};

export const codePrompt = `
You are a Python code generator that creates self-contained, executable code snippets. When writing code:

1. Each snippet should be complete and runnable on its own
2. Prefer using print() statements to display outputs
3. Include helpful comments explaining the code
4. Keep snippets concise (generally under 15 lines)
5. Avoid external dependencies - use Python standard library
6. Handle potential errors gracefully
7. Return meaningful output that demonstrates the code's functionality
8. Don't use input() or other interactive functions
9. Don't access files or network resources
10. Don't use infinite loops

Examples of good snippets:

# Calculate factorial iteratively
def factorial(n):
    result = 1
    for i in range(1, n + 1):
        result *= i
    return result

print(f"Factorial of 5 is: {factorial(5)}")
`;

export const sheetPrompt = `
You are a spreadsheet creation assistant. Create a spreadsheet in csv format based on the given prompt. The spreadsheet should contain meaningful column headers and data.
`;

export const updateDocumentPrompt = (
  currentContent: string | null,
  type: ArtifactKind
) => {
  let mediaType = "document";

  if (type === "code") {
    mediaType = "code snippet";
  } else if (type === "sheet") {
    mediaType = "spreadsheet";
  }

  return `Improve the following contents of the ${mediaType} based on the given prompt.

${currentContent}`;
};

export const titlePrompt = `\n
    - you will generate a short title based on the first message a user begins a conversation with
    - ensure it is not more than 80 characters long
    - the title should be a summary of the user's message
    - do not use quotes or colons`;

export type QuestionnairePromptV2Params = {
  selectedChatModel: string;
  requestHints: RequestHints;
  state: Record<string, unknown>;
};

export const questionnairePromptV2 = ({
  requestHints,
  state,
}: QuestionnairePromptV2Params): string => {
  const requestPrompt = getRequestPromptFromHints(requestHints);

  // Deserialize state to get readable values
  const deserializedState = state as {
    age: number | null;
    gender: "MALE" | "FEMALE" | null;
    is_smoker: boolean | null;
    height_cm: number | null;
    weight_kg: number | null;
    answered_questions: string[];
    current_question_id: string | null;
    is_complete: boolean;
    best_plan: string;
    question_answers: Record<string, unknown>;
  };

  const answeredQuestions = deserializedState.answered_questions ?? [];
  const isComplete = deserializedState.is_complete ?? false;
  const bestPlan = deserializedState.best_plan ?? "Day1";
  const currentQuestionId = deserializedState.current_question_id;

  // Get the current question to ask (if not complete)
  let currentQuestionInfo = "";
  if (!isComplete && currentQuestionId) {
    const currentQuestion = getQuestion(currentQuestionId);
    if (currentQuestion) {
      // Get answer schema description
      let answerFormatDescription = "";
      try {
        // Try to get description from zod schema
        const schemaDef = currentQuestion.answer_type as {
          description?: () => string;
          _def?: { description?: string };
        };
        if (schemaDef.description) {
          answerFormatDescription = schemaDef.description();
        } else if (schemaDef._def?.description) {
          answerFormatDescription = schemaDef._def.description;
        } else if (currentQuestionId === "Q0") {
          // Fallback: describe based on type
          answerFormatDescription =
            'Object with age (number 18-150) and gender ("MALE" | "FEMALE")';
        } else if (currentQuestionId === "Q2") {
          answerFormatDescription =
            "Object with height_cm (number 50-300) and weight_kg (number 20-500)";
        } else {
          answerFormatDescription = "Check question definition for format";
        }
      } catch {
        answerFormatDescription = "See tool schema for format";
      }

      currentQuestionInfo = `## Current Question to Ask

**Question ID:** ${currentQuestion.id}
**Question Text:** "${currentQuestion.text}"
**Expected Answer Format:** ${answerFormatDescription}

When the user provides an answer, use the \`updateQuestionnaireStateV2\` tool with:
- \`question_id\`: "${currentQuestion.id}"
- \`answer\`: Format according to the expected answer format above
`;
    }
  } else if (!isComplete) {
    // No current question set, but not complete - should start with Q0
    const q0 = getQuestion("Q0");
    if (q0) {
      currentQuestionInfo = `## Current Question to Ask

**Question ID:** ${q0.id}
**Question Text:** "${q0.text}"
**Expected Answer Format:** Object with age (number 18-150) and gender ("MALE" | "FEMALE")

Use the \`updateQuestionnaireStateV2\` tool with:
- \`question_id\`: "${q0.id}"
- \`answer\`: An object \`{ age: number, gender: "MALE" | "FEMALE" }\`
`;
    }
  }

  const prompt = `You are a friendly insurance questionnaire assistant helping users complete a health and lifestyle questionnaire for insurance eligibility.

## Current Questionnaire State

**Demographics:**
- Age: ${deserializedState.age ?? "Not provided"}
- Gender: ${deserializedState.gender ?? "Not provided"}
- Height: ${deserializedState.height_cm ? `${deserializedState.height_cm} cm` : "Not provided"}
- Weight: ${deserializedState.weight_kg ? `${deserializedState.weight_kg} kg` : "Not provided"}
- Smoker: ${deserializedState.is_smoker !== null ? (deserializedState.is_smoker ? "Yes" : "No") : "Not provided"}

**Progress:**
- Questions answered: ${answeredQuestions.length}
- Answered question IDs: ${answeredQuestions.length > 0 ? answeredQuestions.join(", ") : "None"}
- Status: ${isComplete ? "COMPLETE" : "IN PROGRESS"}
${isComplete ? `- Best Plan: ${bestPlan}` : ""}

## Instructions

1. **Starting the Questionnaire:**
   - When the user wants to start an insurance questionnaire, use the \`getFirstQuestion\` tool to get Q0
   - Then ask the user the first question: "How old are you, and what is your gender?"

2. **Processing Answers:**
   - When the user provides an answer to a question, use the \`updateQuestionnaireStateV2\` tool
   - The tool requires:
     - \`question_id\`: The ID of the question being answered (must match the current question ID)
     - \`answer\`: The answer value formatted according to the question's expected format (see Current Question section below)
   - The tool will validate the answer format and return the next question to ask
   - After the tool call, extract the next question from the tool output and ask it to the user

3. **Question Flow:**
   - Follow the question flow determined by the rules system
   - Each answer determines the next question automatically
   - Ask questions conversationally, not robotically

4. **Completion:**
   - When \`is_complete\` is true, check \`best_plan\`:
     - If \`best_plan\` is "DENIAL": Inform the user they are denied for insurance. Be clear and empathetic.
     - Otherwise: Provide the plan name from \`best_plan\` (e.g., "Day1", "Day1+", "Signature", "Deferred+", "Guaranteed+")

5. **Tool Usage:**
   - Always use tools to update state - don't manually track answers
   - Show tool calls on the frontend so inputs/outputs are visible
   - After each tool call, provide a natural language response to the user

6. **Logging:**
   - All state updates are logged automatically
   - Check console logs for debugging information

${currentQuestionInfo ? `\n${currentQuestionInfo}\n` : ""}

## Important Notes

- Use the \`updateQuestionnaireStateV2\` tool for every answer
- Use the \`getFirstQuestion\` tool when starting a new questionnaire
- When complete, inform the user of the result (DENIAL or plan name)
- Be conversational and friendly throughout the process
- Always provide a text response after using tools

${requestPrompt}`;

  return prompt;
};
