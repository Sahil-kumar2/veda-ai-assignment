import { MoreVertical } from "lucide-react";

export default function AssignmentCard({ assignment, onDelete, onView }) {
  return (
    <article className="rounded-2xl border border-borderSoft bg-white p-5 shadow-panel transition hover:-translate-y-0.5">
      <div className="mb-3 flex items-start justify-between gap-3">
        <h3 className="text-xl font-bold text-ink">{assignment.title}</h3>
        <button type="button" className="rounded-lg p-1 text-slate-500 hover:bg-slate-100" onClick={() => onView(assignment)}>
          <MoreVertical size={16} />
        </button>
      </div>

      <div className="mb-3 text-sm text-slate-500">
        <p>Questions: {assignment.totalQuestions}</p>
        <p>Marks: {assignment.totalMarks}</p>
      </div>

      <div className="flex items-center justify-between text-xs text-slate-500">
        <p>
          Assigned on: <span className="font-semibold text-slate-700">{assignment.assignedOn}</span>
        </p>
        <p>
          Due: <span className="font-semibold text-slate-700">{assignment.dueDate}</span>
        </p>
      </div>

      <div className="mt-4 flex gap-2">
        <button
          type="button"
          onClick={() => onView(assignment)}
          className="rounded-lg border border-borderSoft px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
        >
          View
        </button>
        <button
          type="button"
          onClick={() => onDelete(assignment.id)}
          className="rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50"
        >
          Delete
        </button>
      </div>
    </article>
  );
}
