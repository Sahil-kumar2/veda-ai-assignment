import { useMemo, useState } from "react";

const baseForm = {
  title: "",
  dueDate: "",
  questionTypes: ["mcq"],
  questionDistribution: [{ type: "mcq", count: 10, marksPerQuestion: 2 }],
  instructions: "",
};

const QUESTION_TYPE_OPTIONS = [
  { value: "mcq", label: "MCQ" },
  { value: "short_answer", label: "Short Answer" },
  { value: "long_answer", label: "Long Answer" },
  { value: "true_false", label: "True/False" },
  { value: "fill_in_the_blank", label: "Fill in the Blank" },
];

const DEFAULT_MARKS_BY_TYPE = {
  mcq: 1,
  short_answer: 3,
  long_answer: 5,
  true_false: 1,
  fill_in_the_blank: 2,
};

const TYPE_LABELS = QUESTION_TYPE_OPTIONS.reduce((acc, option) => {
  acc[option.value] = option.label;
  return acc;
}, {});

export default function AssignmentForm({ onSubmit, submitting = false }) {
  const [formData, setFormData] = useState(baseForm);
  const [referenceFiles, setReferenceFiles] = useState([]);
  const [dragActive, setDragActive] = useState(false);

  const computedTotals = useMemo(() => {
    const totalQuestions = formData.questionDistribution.reduce(
      (sum, item) => sum + Number(item.count || 0),
      0
    );
    const totalMarks = formData.questionDistribution.reduce(
      (sum, item) => sum + Number(item.count || 0) * Number(item.marksPerQuestion || 0),
      0
    );
    return { totalQuestions, totalMarks };
  }, [formData.questionDistribution]);

  const isValid = useMemo(
    () =>
      formData.title.trim().length > 2 &&
      formData.dueDate &&
      formData.questionTypes.length > 0 &&
      formData.questionDistribution.length === formData.questionTypes.length &&
      formData.questionDistribution.every(
        (item) => Number(item.count) > 0 && Number(item.marksPerQuestion) > 0
      ) &&
      computedTotals.totalQuestions > 0 &&
      computedTotals.totalMarks > 0,
    [computedTotals.totalMarks, computedTotals.totalQuestions, formData]
  );

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const toggleQuestionType = (value) => {
    setFormData((prev) => {
      const nextTypes = prev.questionTypes.includes(value)
        ? prev.questionTypes.filter((item) => item !== value)
        : [...prev.questionTypes, value];

      const nextDistribution = nextTypes.map((type) => {
        const existing = prev.questionDistribution.find((item) => item.type === type);
        if (existing) return existing;
        return {
          type,
          count: 1,
          marksPerQuestion: DEFAULT_MARKS_BY_TYPE[type] ?? 1,
        };
      });

      return { ...prev, questionTypes: nextTypes, questionDistribution: nextDistribution };
    });
  };

  const handleDistributionChange = (type, field, value) => {
    const parsed = Number(value);
    setFormData((prev) => ({
      ...prev,
      questionDistribution: prev.questionDistribution.map((item) =>
        item.type === type
          ? {
              ...item,
              [field]: Number.isNaN(parsed) ? 0 : parsed,
            }
          : item
      ),
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!isValid) return;

    onSubmit({
      title: formData.title,
      dueDate: formData.dueDate,
      questionTypes: formData.questionTypes,
      questionDistribution: formData.questionDistribution.map((item) => ({
        type: item.type,
        count: Number(item.count),
        marksPerQuestion: Number(item.marksPerQuestion),
      })),
      totalQuestions: computedTotals.totalQuestions,
      totalMarks: computedTotals.totalMarks,
      instructions: formData.instructions,
      referenceFiles,
    });

    setFormData(baseForm);
    setReferenceFiles([]);
  };

  const addFiles = (fileList) => {
    const incoming = Array.from(fileList || []);
    if (!incoming.length) return;

    setReferenceFiles((prev) => {
      const seen = new Set(prev.map((file) => `${file.name}-${file.size}-${file.lastModified}`));
      const merged = [...prev];
      incoming.forEach((file) => {
        const key = `${file.name}-${file.size}-${file.lastModified}`;
        if (!seen.has(key)) {
          merged.push(file);
          seen.add(key);
        }
      });
      return merged;
    });
  };

  const handleDrop = (event) => {
    event.preventDefault();
    event.stopPropagation();
    setDragActive(false);
    addFiles(event.dataTransfer.files);
  };

  const handleBrowse = (event) => {
    addFiles(event.target.files);
    event.target.value = "";
  };

  const removeFile = (indexToRemove) => {
    setReferenceFiles((prev) => prev.filter((_, index) => index !== indexToRemove));
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-borderSoft bg-white p-6 shadow-panel sm:p-8">
      <h2 className="text-2xl font-bold text-ink">Create Assignment</h2>
      <p className="mb-6 mt-1 text-sm text-slate-500">Set up a new assignment for your students.</p>

      <div className="grid gap-4">
        <label className="space-y-2">
          <span className="text-sm font-semibold text-ink">Assignment Title</span>
          <input
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="e.g. Quiz on Electricity"
            className="w-full rounded-xl border border-borderSoft px-4 py-3 outline-none focus:ring-2 focus:ring-slate-300"
          />
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-2">
            <span className="text-sm font-semibold text-ink">Due Date</span>
            <input
              type="date"
              name="dueDate"
              value={formData.dueDate}
              onChange={handleChange}
              className="w-full rounded-xl border border-borderSoft px-4 py-3 outline-none focus:ring-2 focus:ring-slate-300"
            />
          </label>

          <div className="space-y-2">
            <span className="text-sm font-semibold text-ink">Question Types (select multiple)</span>
            <div className="flex flex-wrap gap-2 rounded-xl border border-borderSoft bg-white p-3">
              {QUESTION_TYPE_OPTIONS.map((option) => {
                const active = formData.questionTypes.includes(option.value);
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => toggleQuestionType(option.value)}
                    className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                      active
                        ? "border-[#101521] bg-[#101521] text-white"
                        : "border-borderSoft bg-white text-slate-600"
                    }`}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="space-y-3 rounded-xl border border-borderSoft bg-slate-50 p-4">
          <p className="text-sm font-semibold text-ink">Question Type Distribution</p>
          <p className="text-xs text-slate-500">Set how many questions and marks each selected type should have.</p>
          {formData.questionDistribution.map((item) => (
            <div key={item.type} className="grid gap-3 rounded-lg border border-borderSoft bg-white p-3 sm:grid-cols-[1.4fr_1fr_1fr]">
              <div className="text-sm font-semibold text-ink">{TYPE_LABELS[item.type] || item.type}</div>
              <label className="space-y-1">
                <span className="text-xs font-medium text-slate-500">No. of Questions</span>
                <input
                  type="number"
                  min="1"
                  value={item.count}
                  onChange={(event) => handleDistributionChange(item.type, "count", event.target.value)}
                  className="w-full rounded-lg border border-borderSoft px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-300"
                />
              </label>
              <label className="space-y-1">
                <span className="text-xs font-medium text-slate-500">Marks per Question</span>
                <input
                  type="number"
                  min="1"
                  value={item.marksPerQuestion}
                  onChange={(event) =>
                    handleDistributionChange(item.type, "marksPerQuestion", event.target.value)
                  }
                  className="w-full rounded-lg border border-borderSoft px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-300"
                />
              </label>
            </div>
          ))}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-2">
            <span className="text-sm font-semibold text-ink">No. of Questions</span>
            <input
              type="number"
              value={computedTotals.totalQuestions}
              readOnly
              className="w-full rounded-xl border border-borderSoft bg-slate-50 px-4 py-3 text-slate-700 outline-none"
            />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-semibold text-ink">Total Marks</span>
            <input
              type="number"
              value={computedTotals.totalMarks}
              readOnly
              className="w-full rounded-xl border border-borderSoft bg-slate-50 px-4 py-3 text-slate-700 outline-none"
            />
          </label>
        </div>

        <label className="space-y-2">
          <span className="text-sm font-semibold text-ink">Additional Information</span>
          <textarea
            rows="4"
            name="instructions"
            value={formData.instructions}
            onChange={handleChange}
            placeholder="e.g. Generate a question paper for 3 hour exam duration"
            className="w-full rounded-xl border border-borderSoft px-4 py-3 outline-none focus:ring-2 focus:ring-slate-300"
          />
        </label>

        <div className="space-y-3">
          <span className="text-sm font-semibold text-ink">Reference Files (Optional)</span>
          <div
            onDragEnter={(event) => {
              event.preventDefault();
              setDragActive(true);
            }}
            onDragOver={(event) => {
              event.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={(event) => {
              event.preventDefault();
              setDragActive(false);
            }}
            onDrop={handleDrop}
            className={`rounded-xl border-2 border-dashed p-5 text-center transition ${
              dragActive
                ? "border-[#101521] bg-slate-50"
                : "border-borderSoft bg-white"
            }`}
          >
            <p className="text-sm font-semibold text-ink">Drag & drop files here</p>
            <p className="mt-1 text-xs text-slate-500">PDF, DOC, DOCX, PNG, JPG, TXT</p>
            <label className="mt-3 inline-flex cursor-pointer rounded-full border border-borderSoft px-4 py-2 text-xs font-semibold text-slate-700">
              Choose Files
              <input
                type="file"
                multiple
                accept=".pdf,.doc,.docx,.txt,image/*"
                onChange={handleBrowse}
                className="hidden"
              />
            </label>
          </div>

          {referenceFiles.length > 0 ? (
            <div className="space-y-2 rounded-xl border border-borderSoft bg-slate-50 p-3">
              {referenceFiles.map((file, index) => (
                <div
                  key={`${file.name}-${file.size}-${file.lastModified}`}
                  className="flex items-center justify-between gap-3 rounded-lg border border-borderSoft bg-white px-3 py-2"
                >
                  <p className="truncate text-sm text-slate-700">{file.name}</p>
                  <button
                    type="button"
                    onClick={() => removeFile(index)}
                    className="rounded-md border border-rose-200 px-2 py-1 text-xs font-semibold text-rose-600"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between">
        <button
          type="button"
          onClick={() => window.history.back()}
          className="rounded-full border border-borderSoft px-5 py-2 text-sm font-semibold text-slate-600"
        >
          Previous
        </button>
        <button
          type="submit"
          disabled={!isValid || submitting}
          className="rounded-full bg-[#101521] px-6 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? "Creating..." : "Create Assignment"}
        </button>
      </div>
    </form>
  );
}
