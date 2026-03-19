import { Document } from "mongoose";

export type AssignmentStatus = "pending" | "processing" | "completed" | "failed";

export type QuestionType =
  | "mcq"
  | "short_answer"
  | "long_answer"
  | "true_false"
  | "fill_in_the_blank";

export interface IQuestionDistributionItem {
  type: QuestionType;
  count: number;
  marksPerQuestion: number;
}

export interface IReferenceMaterial {
  fileName: string;
  mimeType: string;
  size: number;
  extractedText: string;
}

export interface IAssignment {
  title: string;
  dueDate: Date;
  questionTypes: QuestionType[];
  questionDistribution?: IQuestionDistributionItem[];
  referenceMaterials?: IReferenceMaterial[];
  totalQuestions: number;
  totalMarks: number;
  instructions?: string;
  status: AssignmentStatus;
  result?: Record<string, unknown> | null;
}

export interface IAssignmentDocument extends IAssignment, Document {}
