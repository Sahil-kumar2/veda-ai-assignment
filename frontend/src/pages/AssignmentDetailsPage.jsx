import { ArrowLeft } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAssignments } from "../context/AssignmentsContext";
import {
  getAssignmentById as fetchAssignmentById,
  regenerateAssignment as regenerateAssignmentApi,
} from "../services/assignmentApi";
import { useEffect, useMemo, useRef, useState } from "react";
import { jsPDF } from "jspdf";
import { getSocketClient } from "../services/socketClient";

const STATUS_COLORS = {
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  processing: "bg-blue-50 text-blue-700 border-blue-200",
  completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  failed: "bg-rose-50 text-rose-700 border-rose-200",
};
const OPTION_LABELS = ["A", "B", "C", "D"];

export default function AssignmentDetailsPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { getAssignmentById, upsertAssignment } = useAssignments();

  const localAssignment = getAssignmentById(id);
  const [remoteAssignment, setRemoteAssignment] = useState(null);
  const [loading, setLoading] = useState(!localAssignment);
  const [error, setError] = useState("");
  const [regenerating, setRegenerating] = useState(false);
  const pollTimeoutRef = useRef(null);

  const assignment = useMemo(() => {
    if (remoteAssignment) {
      return {
        id: remoteAssignment.assignmentId,
        title: remoteAssignment.assignment?.title || localAssignment?.title || "Generated Assignment",
        assignedOn: remoteAssignment.assignment?.createdAt?.slice(0, 10) || localAssignment?.assignedOn,
        dueDate: remoteAssignment.assignment?.dueDate?.slice(0, 10) || localAssignment?.dueDate,
        totalQuestions: remoteAssignment.assignment?.totalQuestions || localAssignment?.totalQuestions,
        totalMarks: remoteAssignment.assignment?.totalMarks || localAssignment?.totalMarks,
        instructions: remoteAssignment.assignment?.instructions || localAssignment?.instructions,
        status: remoteAssignment.status,
        result: remoteAssignment.result,
      };
    }
    return localAssignment;
  }, [localAssignment, remoteAssignment]);

  useEffect(() => {
    if (!id || id.startsWith("asg-")) return;

    let active = true;
    const socket = getSocketClient();

    const syncAssignment = (data) => {
      setRemoteAssignment(data);
      upsertAssignment({
        id: data.assignmentId,
        title: data.assignment?.title,
        assignedOn: data.assignment?.createdAt?.slice(0, 10),
        dueDate: data.assignment?.dueDate?.slice(0, 10),
        totalQuestions: data.assignment?.totalQuestions,
        totalMarks: data.assignment?.totalMarks,
        instructions: data.assignment?.instructions,
        status: data.status,
        result: data.result,
      });
    };

    const clearNextPoll = () => {
      if (pollTimeoutRef.current) {
        window.clearTimeout(pollTimeoutRef.current);
        pollTimeoutRef.current = null;
      }
    };

    const scheduleNextPoll = () => {
      clearNextPoll();
      pollTimeoutRef.current = window.setTimeout(() => {
        void pull();
      }, 2500);
    };

    const pull = async () => {
      try {
        if (!active) return;
        setLoading(true);
        setError("");
        const data = await fetchAssignmentById(id);
        if (!active) return;
        syncAssignment(data);
        if (data.status === "pending" || data.status === "processing") {
          scheduleNextPoll();
        } else {
          clearNextPoll();
        }
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Failed to load assignment");
        scheduleNextPoll();
      } finally {
        if (active) setLoading(false);
      }
    };

    socket.emit("subscribe", { assignmentId: id });

    const onAssignmentUpdate = (payload) => {
      if (!active || payload.assignmentId !== id) return;

      setRemoteAssignment((prev) => ({
        ...(prev ?? { assignmentId: id, assignment: localAssignment ?? {} }),
        status: payload.status,
        result: payload.result ?? prev?.result ?? null,
      }));

      if (payload.status === "completed" || payload.status === "failed") {
        clearNextPoll();
        void pull();
      }
    };

    socket.on("assignment:update", onAssignmentUpdate);
    void pull();

    return () => {
      active = false;
      clearNextPoll();
      socket.off("assignment:update", onAssignmentUpdate);
    };
  }, [id, localAssignment, upsertAssignment]);

  if (!assignment) {
    return (
      <section className="rounded-2xl border border-borderSoft bg-white p-6 shadow-panel">
        <h1 className="text-2xl font-bold text-ink">Assignment not found</h1>
        <p className="mt-2 text-slate-500">The assignment may have been deleted.</p>
        <Link
          to="/assignments"
          className="mt-4 inline-flex rounded-full bg-[#101521] px-4 py-2 text-sm font-semibold text-white"
        >
          Back to Assignments
        </Link>
      </section>
    );
  }

  const status = assignment.status || "draft";
  const hasGeneratedSections = Boolean(
    assignment.result && assignment.result.sections && assignment.result.sections.length > 0
  );
  const normalizeSectionTitle = (rawTitle = "", sectionLabel = "") => {
    const title = String(rawTitle).trim();
    if (!title) return sectionLabel;

    const escaped = sectionLabel.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const prefixRegex = new RegExp(`^${escaped}\\s*[:\\-]?\\s*`, "i");
    const cleaned = title.replace(prefixRegex, "").trim();
    return cleaned ? `${sectionLabel}: ${cleaned}` : sectionLabel;
  };

  const handleRegenerate = async () => {
    if (!id || id.startsWith("asg-")) {
      setError("Regenerate is available for backend-generated assignments only.");
      return;
    }

    try {
      setRegenerating(true);
      setError("");
      await regenerateAssignmentApi(id);
      const updated = {
        ...assignment,
        status: "pending",
        result: null,
      };
      setRemoteAssignment((prev) => ({ ...(prev ?? {}), status: "pending", result: null }));
      upsertAssignment(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to regenerate assignment");
    } finally {
      setRegenerating(false);
    }
  };

  const handleDownloadPdf = () => {
    if (!hasGeneratedSections) return;

    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 48;
    const contentWidth = pageWidth - margin * 2;
    let y = margin;

    const ensureSpace = (requiredHeight = 20) => {
      if (y + requiredHeight <= pageHeight - margin) return;
      doc.addPage();
      y = margin;
    };

    const drawDivider = (gapTop = 10, gapBottom = 10) => {
      y += gapTop;
      ensureSpace(4);
      doc.setDrawColor(215, 221, 230);
      doc.setLineWidth(1);
      doc.line(margin, y, pageWidth - margin, y);
      y += gapBottom;
    };

    const writeLeft = (text, size = 11, weight = "normal", step = 15) => {
      doc.setFont("times", weight);
      doc.setFontSize(size);
      const lines = doc.splitTextToSize(text, contentWidth);
      lines.forEach((line) => {
        ensureSpace(step + 2);
        doc.text(line, margin, y);
        y += step;
      });
    };

    const writeCenter = (text, size = 12, weight = "normal", step = 16) => {
      doc.setFont("times", weight);
      doc.setFontSize(size);
      ensureSpace(step + 2);
      doc.text(text, pageWidth / 2, y, { align: "center" });
      y += step;
    };

    const safeTitle = (assignment.title || "Generated Assignment").trim();
    const assignedOn = assignment.assignedOn || "-";
    const dueDate = assignment.dueDate || "-";
    const totalMarks = assignment.totalMarks || "-";
    const totalQuestions = assignment.totalQuestions || "-";

    writeCenter(safeTitle, 19, "bold", 24);
    writeCenter("QUESTION PAPER", 11, "bold", 16);
    drawDivider(2, 12);

    doc.setFont("times", "normal");
    doc.setFontSize(11);
    ensureSpace(18);
    doc.text(`Assigned On: ${assignedOn}`, margin, y);
    doc.text(`Due Date: ${dueDate}`, pageWidth - margin, y, { align: "right" });
    y += 16;
    ensureSpace(18);
    doc.text(`Total Questions: ${totalQuestions}`, margin, y);
    doc.text(`Maximum Marks: ${totalMarks}`, pageWidth - margin, y, { align: "right" });
    y += 12;

    drawDivider(4, 12);
    writeLeft("Name: ____________________________", 11, "normal", 14);
    writeLeft("Roll Number: _____________________", 11, "normal", 14);
    writeLeft("Class: _______    Section: _______", 11, "normal", 16);
    drawDivider(6, 10);

    writeLeft("All questions are compulsory unless stated otherwise.", 10, "italic", 13);
    drawDivider(8, 8);

    assignment.result.sections.forEach((section, sectionIndex) => {
      ensureSpace(30);
      const sectionLabel = `Section ${String.fromCharCode(65 + sectionIndex)}`;
      const sectionHeading = normalizeSectionTitle(section.title, sectionLabel);
      doc.setFillColor(245, 247, 251);
      doc.roundedRect(margin, y - 11, contentWidth, 20, 4, 4, "F");
      doc.setFont("times", "bold");
      doc.setFontSize(12);
      doc.text(sectionHeading, margin + 8, y + 3);
      y += 20;

      writeLeft(section.instruction, 10, "italic", 13);
      y += 2;

      section.questions.forEach((question, questionIndex) => {
        const questionNumber = questionIndex + 1;
        const marksLabel = `[${question.marks} Marks]`;

        doc.setFont("times", "bold");
        doc.setFontSize(10);
        ensureSpace(16);
        doc.text(`${questionNumber}.`, margin, y);

        doc.setFont("times", "normal");
        doc.setFontSize(10.5);
        const questionX = margin + 16;
        const questionWidth = contentWidth - 90;
        const wrappedQuestion = doc.splitTextToSize(question.text, questionWidth);
        wrappedQuestion.forEach((line, idx) => {
          ensureSpace(14);
          doc.text(line, questionX, y);
          if (idx === 0) {
            doc.setFont("times", "bold");
            doc.setFontSize(9.5);
            doc.text(marksLabel, pageWidth - margin, y, { align: "right" });
            doc.setFont("times", "normal");
            doc.setFontSize(10.5);
          }
          y += 14;
        });

        if (Array.isArray(question.options) && question.options.length > 0) {
          doc.setFont("times", "normal");
          doc.setFontSize(10);
          question.options.forEach((optionText, optionIndex) => {
            ensureSpace(14);
            const optionLabel = OPTION_LABELS[optionIndex] || `${optionIndex + 1}`;
            const optionLines = doc.splitTextToSize(
              `${optionLabel}) ${optionText}`,
              contentWidth - 34
            );
            optionLines.forEach((line) => {
              ensureSpace(14);
              doc.text(line, questionX + 10, y);
              y += 14;
            });
          });
        }

        doc.setFont("times", "italic");
        doc.setFontSize(9);
        ensureSpace(12);
        doc.text(`Difficulty: ${question.difficulty}`, questionX, y);
        y += 13;
      });

      y += 4;
      if (sectionIndex < assignment.result.sections.length - 1) {
        drawDivider(2, 8);
      }
    });

    const fileName = safeTitle
      .replace(/[^a-z0-9\s-]/gi, "")
      .trim()
      .replace(/\s+/g, "-")
      .toLowerCase() || "assignment";
    doc.save(`${fileName}.pdf`);
  };

  return (
    <section className="space-y-6">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-2 rounded-full border border-borderSoft bg-white px-4 py-2 text-sm font-semibold text-slate-600"
      >
        <ArrowLeft size={14} />
        Back
      </button>

      <article className="rounded-2xl border border-borderSoft bg-white p-6 shadow-panel">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-3xl font-bold text-ink">{assignment.title}</h1>
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase ${STATUS_COLORS[status] || "bg-slate-50 text-slate-600 border-slate-200"}`}>
              {status}
            </span>
            <button
              type="button"
              onClick={handleRegenerate}
              disabled={regenerating}
              className="rounded-full border border-borderSoft px-3 py-1.5 text-xs font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {regenerating ? "Regenerating..." : "Regenerate Assignment"}
            </button>
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={!hasGeneratedSections}
              className="rounded-full bg-[#101521] px-3 py-1.5 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              Download PDF
            </button>
          </div>
        </div>
        {!hasGeneratedSections ? (
          <p className="mt-2 text-slate-500">Detailed assignment overview.</p>
        ) : null}

        {!hasGeneratedSections ? (
          <dl className="mt-6 grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="font-semibold text-slate-500">Assigned On</dt>
              <dd className="text-ink">{assignment.assignedOn || "-"}</dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-500">Due Date</dt>
              <dd className="text-ink">{assignment.dueDate || "-"}</dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-500">Total Questions</dt>
              <dd className="text-ink">{assignment.totalQuestions || "-"}</dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-500">Total Marks</dt>
              <dd className="text-ink">{assignment.totalMarks || "-"}</dd>
            </div>
          </dl>
        ) : null}

        {!hasGeneratedSections ? (
          <div className="mt-6 rounded-xl border border-borderSoft bg-slate-50 p-4">
            <p className="text-sm font-semibold text-slate-600">Instructions</p>
            <p className="mt-1 text-sm text-slate-700">{assignment.instructions || "No instructions provided."}</p>
          </div>
        ) : null}

        {loading && (status === "pending" || status === "processing") ? (
          <div className="mt-6 rounded-xl border border-borderSoft bg-slate-50 p-4 text-sm text-slate-600">
            Generating questions... please wait.
          </div>
        ) : null}

        {error ? (
          <div className="mt-6 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</div>
        ) : null}

        {assignment.result && assignment.result.sections ? (
          <div className="mt-6">
            <div className="rounded-2xl border border-borderSoft bg-white px-6 py-7 sm:px-10" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
              <h2 className="text-center text-4xl font-bold text-[#111111]">{assignment.title}</h2>
              <p className="mt-2 text-center text-lg font-semibold text-[#111111]">QUESTION PAPER</p>

              <div className="mt-6 border-t border-slate-300 pt-3 text-[17px] text-[#111111]">
                <div className="flex items-center justify-between gap-4">
                  <p>Assigned On: {assignment.assignedOn || "-"}</p>
                  <p>Due Date: {assignment.dueDate || "-"}</p>
                </div>
                <div className="mt-1 flex items-center justify-between gap-4">
                  <p>Total Questions: {assignment.totalQuestions || "-"}</p>
                  <p>Maximum Marks: {assignment.totalMarks || "-"}</p>
                </div>
              </div>

              <div className="mt-4 border-t border-slate-300 pt-3 text-[17px] text-[#111111]">
                <p>Name: ____________________________</p>
                <p className="mt-1">Roll Number: _____________________</p>
                <p className="mt-1">Class: _______ &nbsp;&nbsp; Section: _______</p>
              </div>

              <p className="mt-5 border-t border-slate-300 pt-3 text-[16px] italic text-[#111111]">
                All questions are compulsory unless stated otherwise.
              </p>

              <div className="mt-4 space-y-6 text-[#111111]">
                {assignment.result.sections.map((section, sectionIndex) => {
                  const sectionLabel = `Section ${String.fromCharCode(65 + sectionIndex)}`;
                  const sectionHeading = normalizeSectionTitle(section.title, sectionLabel);

                  return (
                    <section key={`${section.title}-${sectionIndex}`}>
                      <h3 className="rounded-md bg-slate-100 px-3 py-1 text-2xl font-bold">
                        {sectionHeading}
                      </h3>
                      <p className="mt-2 text-lg italic">{section.instruction}</p>

                      <ol className="mt-2 space-y-3 text-[17px]">
                        {section.questions.map((question, questionIndex) => (
                          <li key={`${question.text}-${questionIndex}`}>
                            <div className="flex items-start justify-between gap-4">
                              <p className="leading-7">
                                <span className="mr-2 font-semibold">{questionIndex + 1}.</span>
                                {question.text}
                              </p>
                              <span className="whitespace-nowrap font-semibold">[{question.marks} Marks]</span>
                            </div>
                            {Array.isArray(question.options) && question.options.length > 0 ? (
                              <ul className="ml-7 mt-2 space-y-1 text-[16px]">
                                {question.options.map((optionText, optionIndex) => (
                                  <li key={`${optionText}-${optionIndex}`}>
                                    <span className="mr-2 font-semibold">
                                      {OPTION_LABELS[optionIndex] || `${optionIndex + 1}`}.
                                    </span>
                                    {optionText}
                                  </li>
                                ))}
                              </ul>
                            ) : null}
                            <p className="mt-1 text-base italic text-slate-600">
                              Difficulty: {question.difficulty}
                            </p>
                          </li>
                        ))}
                      </ol>
                    </section>
                  );
                })}
              </div>
            </div>
          </div>
        ) : !loading && status === "completed" ? (
          <div className="mt-6 rounded-xl border border-borderSoft bg-slate-50 p-4 text-sm text-slate-600">
            No generated question sections found for this assignment.
          </div>
        ) : null}
      </article>
    </section>
  );
}
