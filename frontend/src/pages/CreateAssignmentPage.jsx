import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAssignments } from "../context/AssignmentsContext";
import AssignmentForm from "../components/AssignmentForm";
import { createAssignment } from "../services/assignmentApi";
import { useState } from "react";

export default function CreateAssignmentPage() {
  const navigate = useNavigate();
  const { addAssignment } = useAssignments();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleCreate = async (payload) => {
    try {
      setSubmitting(true);
      setError("");
      const assignmentId = await createAssignment(payload);

      const { referenceFiles, ...persistablePayload } = payload;
      const localAssignment = addAssignment({
        ...persistablePayload,
        referenceFileNames: Array.isArray(referenceFiles)
          ? referenceFiles.map((file) => file.name)
          : [],
        id: assignmentId,
        status: "pending",
      });

      navigate(`/assignments/${localAssignment.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create assignment");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="mb-2 text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">Create Assignment</p>
          <h1 className="text-3xl font-bold text-ink">New Assignment</h1>
        </div>
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 rounded-full border border-borderSoft bg-white px-4 py-2 text-sm font-semibold text-slate-600"
        >
          <ArrowLeft size={14} />
          Back
        </button>
      </div>

      {error ? (
        <p className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-700">
          {error}
        </p>
      ) : null}

      <AssignmentForm onSubmit={handleCreate} submitting={submitting} />

      {submitting ? (
        <p className="mt-4 text-sm text-slate-500">Creating assignment and starting generation...</p>
      ) : null}
    </section>
  );
}
