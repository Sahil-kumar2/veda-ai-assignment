import { Schema, model } from "mongoose";
import {
  IAssignmentDocument,
  AssignmentStatus,
  QuestionType,
} from "./assignment.types";

/**
 * Assignment Mongoose Schema
 *
 * Maps directly to IAssignment. Every field has explicit validation
 * (required, enum, min/max) so MongoDB is the last line of defence
 * for bad data even if request validation is bypassed.
 */
const assignmentSchema = new Schema<IAssignmentDocument>(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      maxlength: [200, "Title cannot exceed 200 characters"],
    },

    dueDate: {
      type: Date,
      required: [true, "Due date is required"],
    },

    questionTypes: {
      type: [String],
      enum: {
        values: [
          "mcq",
          "short_answer",
          "long_answer",
          "true_false",
          "fill_in_the_blank",
        ] as QuestionType[],
        message: "{VALUE} is not a valid question type",
      },
      required: [true, "At least one question type is required"],
      validate: {
        validator: (arr: string[]) => arr.length > 0,
        message: "questionTypes must have at least one entry",
      },
    },

    questionDistribution: {
      type: [
        {
          type: {
            type: String,
            enum: [
              "mcq",
              "short_answer",
              "long_answer",
              "true_false",
              "fill_in_the_blank",
            ] as QuestionType[],
            required: [true, "Question distribution type is required"],
          },
          count: {
            type: Number,
            required: [true, "Question distribution count is required"],
            min: [1, "Question distribution count must be at least 1"],
          },
          marksPerQuestion: {
            type: Number,
            required: [true, "Question distribution marksPerQuestion is required"],
            min: [1, "marksPerQuestion must be at least 1"],
          },
        },
      ],
      default: undefined,
    },

    referenceMaterials: {
      type: [
        {
          fileName: {
            type: String,
            required: [true, "referenceMaterials.fileName is required"],
            trim: true,
          },
          mimeType: {
            type: String,
            required: [true, "referenceMaterials.mimeType is required"],
            trim: true,
          },
          size: {
            type: Number,
            required: [true, "referenceMaterials.size is required"],
            min: [0, "referenceMaterials.size cannot be negative"],
          },
          extractedText: {
            type: String,
            required: [true, "referenceMaterials.extractedText is required"],
            trim: true,
          },
        },
      ],
      default: undefined,
    },

    totalQuestions: {
      type: Number,
      required: [true, "Total questions count is required"],
      min: [1, "Must have at least 1 question"],
      max: [500, "Cannot exceed 500 questions"],
    },

    totalMarks: {
      type: Number,
      required: [true, "Total marks is required"],
      min: [1, "Total marks must be at least 1"],
    },

    instructions: {
      type: String,
      trim: true,
      maxlength: [2000, "Instructions cannot exceed 2000 characters"],
    },

    status: {
      type: String,
      enum: {
        values: ["pending", "processing", "completed", "failed"] as AssignmentStatus[],
        message: "{VALUE} is not a valid status",
      },
      default: "pending" as AssignmentStatus,
    },

    result: {
      type: Schema.Types.Mixed, // Stores arbitrary JSON returned by the AI
      default: null,
    },
  },
  {
    timestamps: true,        // Adds createdAt and updatedAt automatically
    versionKey: false,       // Removes __v field
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Index for common query patterns
assignmentSchema.index({ status: 1, createdAt: -1 });
assignmentSchema.index({ dueDate: 1 });

export const Assignment = model<IAssignmentDocument>(
  "Assignment",
  assignmentSchema
);
