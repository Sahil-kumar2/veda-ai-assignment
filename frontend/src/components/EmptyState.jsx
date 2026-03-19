import { PlusCircle } from "lucide-react";

export default function EmptyState({ onCreate }) {
  return (
    <section className="grid min-h-[62vh] place-items-center rounded-2xl border border-borderSoft bg-white px-6 py-12 shadow-panel">
      <div className="max-w-xl text-center">
        <div className="mx-auto mb-6 grid h-28 w-28 place-items-center rounded-full bg-slate-100 text-4xl">??</div>
        <h2 className="text-3xl font-bold text-ink">No assignments yet</h2>
        <p className="mt-3 text-slate-500">
          Create your first assignment to start collecting and grading student submissions.
        </p>
        <button
          type="button"
          onClick={onCreate}
          className="mt-7 inline-flex items-center gap-2 rounded-full bg-[#101521] px-6 py-3 text-sm font-semibold text-white"
        >
          <PlusCircle size={16} />
          Create Your First Assignment
        </button>
      </div>
    </section>
  );
}
