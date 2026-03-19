import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { initialAssignments } from "../data/assignments";

const AssignmentsContext = createContext(null);
const STORAGE_KEY = "veda_assignments";

export function AssignmentsProvider({ children }) {
  const [assignments, setAssignments] = useState(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return initialAssignments;
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : initialAssignments;
    } catch {
      return initialAssignments;
    }
  });

  const addAssignment = useCallback((payload) => {
    const newAssignment = {
      id: payload.id ?? `asg-${Date.now()}`,
      assignedOn: payload.assignedOn ?? new Date().toISOString().slice(0, 10),
      status: payload.status ?? "draft",
      ...payload,
    };
    setAssignments((prev) => [newAssignment, ...prev]);
    return newAssignment;
  }, []);

  const deleteAssignment = useCallback((id) => {
    let removed = null;
    setAssignments((prev) => {
      removed = prev.find((item) => item.id === id) ?? null;
      return prev.filter((item) => item.id !== id);
    });
    return removed;
  }, []);

  const getAssignmentById = useCallback(
    (id) => assignments.find((item) => item.id === id) ?? null,
    [assignments]
  );

  const upsertAssignment = useCallback((assignment) => {
    setAssignments((prev) => {
      const exists = prev.some((item) => item.id === assignment.id);
      if (exists) {
        return prev.map((item) => (item.id === assignment.id ? { ...item, ...assignment } : item));
      }
      return [assignment, ...prev];
    });
  }, []);

  const value = useMemo(
    () => ({ assignments, addAssignment, deleteAssignment, getAssignmentById, upsertAssignment }),
    [assignments]
  );

  // Persist assignments so create/delete survive reloads.
  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(assignments));
    } catch {
      // Ignore quota/storage errors in dev.
    }
  }, [assignments]);

  return <AssignmentsContext.Provider value={value}>{children}</AssignmentsContext.Provider>;
}

export function useAssignments() {
  const context = useContext(AssignmentsContext);
  if (!context) {
    throw new Error("useAssignments must be used inside AssignmentsProvider");
  }
  return context;
}
