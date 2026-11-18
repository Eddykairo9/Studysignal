const API_BASE = (import.meta.env.VITE_API_URL || "http://localhost:8000").replace(
  /\/$/,
  "",
);

async function request(path, options = {}) {
  let response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: {
        Accept: "application/json",
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...options.headers,
      },
    });
  } catch {
    throw new Error(
      "The API could not be reached. Start the backend and try again.",
    );
  }

  const body = await response.json().catch(() => null);
  if (!response.ok) {
    const detail =
      typeof body?.detail === "string"
        ? body.detail
        : "The request could not be completed.";
    throw new Error(detail);
  }
  return body;
}

export const api = {
  health: () => request("/api/health"),
  models: () => request("/api/models"),
  predict: (payload) =>
    request("/api/predict", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  overview: () => request("/api/dashboard/overview"),
  distribution: () => request("/api/dashboard/performance-distribution"),
  featureAnalysis: () => request("/api/dashboard/feature-analysis"),
  comparison: () => request("/api/dashboard/model-comparison"),
};
