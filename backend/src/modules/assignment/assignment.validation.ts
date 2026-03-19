import { z } from "zod";

/**
 * Allowed question types — mirrors the QuestionType union in assignment.types.ts
 */
const QUESTION_TYPES = [
  "mcq",
  "short_answer",
  "long_answer",
  "true_false",
  "fill_in_the_blank",
] as const;

const questionDistributionItemSchema = z.object({
  type: z.enum(QUESTION_TYPES),
  count: z.coerce
    .number({ required_error: "questionDistribution.count is required" })
    .int("questionDistribution.count must be a whole number")
    .min(1, "questionDistribution.count must be at least 1"),
  marksPerQuestion: z.coerce
    .number({ required_error: "questionDistribution.marksPerQuestion is required" })
    .min(1, "questionDistribution.marksPerQuestion must be at least 1"),
});

const referenceMaterialSchema = z.object({
  fileName: z
    .string({ required_error: "referenceMaterials.fileName is required" })
    .trim()
    .min(1, "referenceMaterials.fileName cannot be empty"),
  mimeType: z
    .string({ required_error: "referenceMaterials.mimeType is required" })
    .trim()
    .min(1, "referenceMaterials.mimeType cannot be empty"),
  size: z.coerce
    .number({ required_error: "referenceMaterials.size is required" })
    .min(0, "referenceMaterials.size cannot be negative"),
  extractedText: z
    .string({ required_error: "referenceMaterials.extractedText is required" })
    .trim()
    .min(1, "referenceMaterials.extractedText cannot be empty")
    .max(3500, "referenceMaterials.extractedText cannot exceed 3500 characters"),
});

/**
 * createAssignmentSchema
 * Validates the request body for POST /api/v1/assignments.
 *
 * Rules:
 *  - title:           non-empty string, max 200 chars
 *  - dueDate:         valid future-or-present date string (coerced)
 *  - questionTypes:   non-empty array of allowed values
 *  - totalQuestions:  integer >= 1
 *  - totalMarks:      positive number >= 1
 *  - instructions:    optional string, max 2000 chars
 */
export const createAssignmentSchema = z.object({
  title: z
    .string({ required_error: "title is required" })
    .trim()
    .min(1, "title cannot be empty")
    .max(200, "title cannot exceed 200 characters"),

  dueDate: z.coerce
    .date({ required_error: "dueDate is required", invalid_type_error: "dueDate must be a valid date" })
    .refine((d) => d >= new Date(new Date().setHours(0, 0, 0, 0)), {
      message: "dueDate must be today or in the future",
    }),

  questionTypes: z
    .array(z.enum(QUESTION_TYPES), { required_error: "questionTypes is required" })
    .min(1, "questionTypes must contain at least one type")
    .refine((arr) => new Set(arr).size === arr.length, {
      message: "questionTypes must not contain duplicate values",
    }),

  questionDistribution: z
    .array(questionDistributionItemSchema)
    .min(1, "questionDistribution must contain at least one entry")
    .optional(),

  totalQuestions: z.coerce
    .number({ required_error: "totalQuestions is required", invalid_type_error: "totalQuestions must be a number" })
    .int("totalQuestions must be a whole number")
    .min(1, "totalQuestions must be at least 1")
    .max(500, "totalQuestions cannot exceed 500"),

  totalMarks: z.coerce
    .number({ required_error: "totalMarks is required", invalid_type_error: "totalMarks must be a number" })
    .min(1, "totalMarks must be at least 1"),

  instructions: z
    .string()
    .trim()
    .max(2000, "instructions cannot exceed 2000 characters")
    .optional(),

  referenceMaterials: z.array(referenceMaterialSchema).max(5).optional(),
})
  .superRefine((data, ctx) => {
    if (!data.questionDistribution || data.questionDistribution.length === 0) return;

    const questionTypesSet = new Set(data.questionTypes);
    const seen = new Set<string>();

    for (const item of data.questionDistribution) {
      if (!questionTypesSet.has(item.type)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["questionDistribution"],
          message: `questionDistribution contains type "${item.type}" not present in questionTypes`,
        });
      }

      if (seen.has(item.type)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["questionDistribution"],
          message: `questionDistribution has duplicate type "${item.type}"`,
        });
      }
      seen.add(item.type);
    }

    for (const type of data.questionTypes) {
      if (!seen.has(type)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["questionDistribution"],
          message: `questionDistribution is missing type "${type}"`,
        });
      }
    }

    const totalQuestionsFromDistribution = data.questionDistribution.reduce(
      (sum, item) => sum + item.count,
      0
    );
    if (totalQuestionsFromDistribution !== data.totalQuestions) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["totalQuestions"],
        message: "totalQuestions must equal the sum of questionDistribution.count",
      });
    }

    const totalMarksFromDistribution = data.questionDistribution.reduce(
      (sum, item) => sum + item.count * item.marksPerQuestion,
      0
    );
    if (totalMarksFromDistribution !== data.totalMarks) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["totalMarks"],
        message: "totalMarks must equal sum(count * marksPerQuestion) from questionDistribution",
      });
    }
  });

/** Inferred TypeScript type from the schema */
export type CreateAssignmentInput = z.infer<typeof createAssignmentSchema>;
