import { z } from "zod";

/**
 * Zod schemas for the structured JSON output from the LLM.
 *
 * This is the contract between the AI and the rest of the system.
 * Any response that doesn't conform is rejected before touching the DB.
 */

// ─── Question ─────────────────────────────────────────────────────────────────

export const questionSchema = z.object({
  type: z.enum(
    ["mcq", "short_answer", "long_answer", "true_false", "fill_in_the_blank"],
    {
      required_error: "question.type is required",
      invalid_type_error:
        'question.type must be "mcq", "short_answer", "long_answer", "true_false", or "fill_in_the_blank"',
    }
  ),

  text: z
    .string({ required_error: "question.text is required" })
    .trim()
    .min(5, "question.text must be at least 5 characters"),

  difficulty: z.enum(["easy", "medium", "hard"], {
    required_error: "question.difficulty is required",
    invalid_type_error: 'question.difficulty must be "easy", "medium", or "hard"',
  }),

  marks: z
    .number({ required_error: "question.marks is required", invalid_type_error: "question.marks must be a number" })
    .int("question.marks must be a whole number")
    .min(1, "question.marks must be at least 1"),

  options: z
    .array(
      z
        .string({ required_error: "question.options[] must be string" })
        .trim()
        .min(1, "question.options[] cannot be empty")
    )
    .length(4, "MCQ questions must have exactly 4 options")
    .optional(),

  correctOption: z.enum(["A", "B", "C", "D"]).optional(),
}).superRefine((question, ctx) => {
  if (question.type !== "mcq") return;

  if (!question.options || question.options.length !== 4) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["options"],
      message: "MCQ questions must include exactly 4 options",
    });
  }

  if (!question.correctOption) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["correctOption"],
      message: "MCQ questions must include correctOption (A/B/C/D)",
    });
  }
});

// ─── Section ──────────────────────────────────────────────────────────────────

export const sectionSchema = z.object({
  title: z
    .string({ required_error: "section.title is required" })
    .trim()
    .min(1, "section.title cannot be empty"),

  instruction: z
    .string({ required_error: "section.instruction is required" })
    .trim()
    .min(1, "section.instruction cannot be empty"),

  questions: z
    .array(questionSchema, { required_error: "section.questions is required" })
    .min(1, "Each section must have at least one question"),
});

// ─── Root ─────────────────────────────────────────────────────────────────────

export const assignmentOutputSchema = z.object({
  sections: z
    .array(sectionSchema, { required_error: "sections is required" })
    .min(1, "Assignment must have at least one section"),
});

// ─── Inferred Types ───────────────────────────────────────────────────────────

export type Question      = z.infer<typeof questionSchema>;
export type Section       = z.infer<typeof sectionSchema>;
export type AssignmentOutput = z.infer<typeof assignmentOutputSchema>;
