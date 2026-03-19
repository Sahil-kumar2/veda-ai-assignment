const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api/v1";

const parseJson = async (response) => {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = data?.message || `Request failed (${response.status})`;
    const details =
      Array.isArray(data?.errors) && data.errors.length > 0
        ? `: ${data.errors.join(", ")}`
        : "";
    throw new Error(`${message}${details}`);
  }
  return data;
};

export async function createAssignment(payload) {
  const formData = new FormData();
  formData.append("title", payload.title);
  formData.append("dueDate", payload.dueDate);
  formData.append("totalQuestions", String(payload.totalQuestions));
  formData.append("totalMarks", String(payload.totalMarks));
  formData.append("instructions", payload.instructions || "");
  formData.append("questionTypes", JSON.stringify(payload.questionTypes || []));
  formData.append("questionDistribution", JSON.stringify(payload.questionDistribution || []));

  if (Array.isArray(payload.referenceFiles)) {
    payload.referenceFiles.forEach((file) => {
      if (file instanceof File) {
        formData.append("referenceFiles", file);
      }
    });
  }

  const response = await fetch(`${API_BASE}/assignments`, {
    method: "POST",
    body: formData,
  });
  const json = await parseJson(response);
  return json?.data?.assignmentId;
}

export async function getAssignmentById(id) {
  const response = await fetch(`${API_BASE}/assignments/${id}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });
  const json = await parseJson(response);
  return json?.data;
}

export async function regenerateAssignment(id) {
  const response = await fetch(`${API_BASE}/assignments/${id}/regenerate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
  const json = await parseJson(response);
  return json?.data;
}
