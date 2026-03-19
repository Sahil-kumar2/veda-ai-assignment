import { AssignmentJobPayload } from "../queue/assignment.queue";

export interface PromptMessages {
  system: string;
  user: string;
}

const SYSTEM_PROMPT = `You are an expert assessment designer AI.
Your ONLY job is to generate structured exam papers in strict JSON format.

CRITICAL RULES - you MUST follow ALL of them:
1. Output ONLY raw JSON. No markdown, no code fences, no explanation text.
2. Your entire response must start with '{' and end with '}'.
3. Do not include any text before or after the JSON object.
4. Distribute difficulty: approximately 40% easy, 40% medium, 20% hard.
5. Ensure marks per question are reasonable (1-20) and sum correctly.
6. Make questions clear, concise, and educationally valid.`;

export const buildPrompt = (
  payload: AssignmentJobPayload["payload"]
): PromptMessages => {
  const {
    title,
    dueDate,
    questionTypes,
    questionDistribution,
    referenceMaterials,
    totalQuestions,
    totalMarks,
    instructions,
  } = payload;

  const questionTypesFormatted = questionTypes
    .map((qt) => qt.replace(/_/g, " "))
    .join(", ");

  const distributionText =
    questionDistribution && questionDistribution.length > 0
      ? questionDistribution
          .map(
            (item) =>
              `- ${item.type.replace(/_/g, " ")}: ${item.count} questions, ${item.marksPerQuestion} marks each`
          )
          .join("\n")
      : null;

  const referenceMaterialText =
    referenceMaterials && referenceMaterials.length > 0
      ? referenceMaterials
          .map((item, index) => {
            const safeText = item.extractedText.slice(0, 1200);
            return `Reference ${index + 1} (${item.fileName}, ${item.mimeType}):\n${safeText}`;
          })
          .join("\n\n")
      : null;

  const user = `Generate an assignment paper with the following specifications:

ASSIGNMENT DETAILS:
- Title: "${title}"
- Due Date: ${new Date(dueDate).toDateString()}
- Question Types: ${questionTypesFormatted}
- Question Distribution:
${distributionText ?? "- Not fixed per type. Use a sensible split across selected types."}
- Total Questions: ${totalQuestions}
- Total Marks: ${totalMarks}
${instructions ? `- Special Instructions: ${instructions}` : ""}
${referenceMaterialText ? `- Reference Material Context:\n${referenceMaterialText}` : ""}

OUTPUT REQUIREMENTS:
- Organise questions into logical sections (e.g., Section A: MCQ, Section B: Short Answer)
- Distribute the ${totalQuestions} questions across sections appropriately${distributionText ? " and STRICTLY follow the exact per-type distribution above" : ""}
- Total marks across ALL questions MUST equal exactly ${totalMarks}
- Each question must have: type, text, difficulty (easy/medium/hard), marks (integer)
- For every question where type = "mcq":
  - include exactly 4 options in an array, in A/B/C/D order
  - include correctOption as one of: "A", "B", "C", "D"
- For non-MCQ types, do not add options/correctOption.
- If reference material context is provided, base question topics and wording on that context.

REQUIRED JSON SCHEMA (output ONLY this structure):
{
  "sections": [
    {
      "title": "string - section name e.g. Section A",
      "instruction": "string - instruction for this section",
      "questions": [
        {
          "type": "mcq" | "short_answer" | "long_answer" | "true_false" | "fill_in_the_blank",
          "text": "string - the question text",
          "difficulty": "easy" | "medium" | "hard",
          "marks": number,
          "options": ["string", "string", "string", "string"],
          "correctOption": "A" | "B" | "C" | "D"
        }
      ]
    }
  ]
}

IMPORTANT:
- options and correctOption are required only for MCQ.
- options and correctOption must NOT be present for non-MCQ.

Remember: respond with ONLY the JSON object. No extra text whatsoever.`;

  return { system: SYSTEM_PROMPT, user };
};

