import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAssignments } from "../context/AssignmentsContext";
import AssignmentCard from "../components/AssignmentCard";
import EmptyState from "../components/EmptyState";

export default function AssignmentsPage() {
  const navigate = useNavigate();
  const { assignments, deleteAssignment } = useAssignments();
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState("");

  const filteredAssignments = useMemo(() => {
    if (!query.trim()) return assignments;
    const q = query.toLowerCase();
    return assignments.filter((item) => item.title.toLowerCase().includes(q));
  }, [assignments, query]);

  const handleView = (assignment) => {
    navigate(`/assignments/${assignment.id}`);
  };

  const handleDelete = (id) => {
    const confirmed = window.confirm("Delete this assignment?");
    if (!confirmed) return;
    const removed = deleteAssignment(id);
    if (removed) {
      setMessage(`Deleted: ${removed.title}`);
      window.setTimeout(() => setMessage(""), 2200);
    }
  };

  if (assignments.length === 0) {
    return <EmptyState onCreate={() => navigate("/assignments/create")} />;
  }

  return (
    <section>
      <header className="mb-6">
        <p className="mb-2 text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">Assignments</p>
        <h1 className="text-3xl font-bold text-ink">Manage Assignments</h1>
        <p className="mt-1 text-sm text-slate-500">Create and track assignments for your classes.</p>
        {message ? (
          <p className="mt-3 inline-flex rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-sm text-emerald-700">
            {message}
          </p>
        ) : null}
      </header>

      <div className="mb-5 flex flex-col gap-3 rounded-2xl border border-borderSoft bg-white p-3 shadow-panel sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={() => setQuery("")}
          className="rounded-xl border border-borderSoft px-3 py-2 text-sm font-medium text-slate-500"
        >
          Clear Filter
        </button>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search Assignment"
          className="w-full rounded-xl border border-borderSoft px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-300 sm:max-w-xs"
        />
      </div>

      {filteredAssignments.length === 0 ? (
        <EmptyState onCreate={() => navigate("/assignments/create")} />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filteredAssignments.map((assignment) => (
            <AssignmentCard
              key={assignment.id}
              assignment={assignment}
              onDelete={handleDelete}
              onView={handleView}
            />
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={() => navigate("/assignments/create")}
        className="fixed bottom-4 left-1/2 z-30 hidden -translate-x-1/2 items-center gap-2 rounded-full bg-[#101521] px-5 py-2 text-sm font-semibold text-white shadow-panel md:inline-flex"
      >
        <Plus size={14} />
        Create Assignment
      </button>
    </section>
  );
}
