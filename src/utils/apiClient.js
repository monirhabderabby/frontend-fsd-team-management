const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

const buildHeaders = (headers = {}, token) => {
  const finalHeaders = {
    "Content-Type": "application/json",
    ...headers,
  };
  if (token) {
    finalHeaders.Authorization = `Bearer ${token}`;
  }
  return finalHeaders;
};

export const apiRequest = async (path, options = {}) => {
  const token = localStorage.getItem("auth_token");
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: buildHeaders(options.headers, token),
  });

  const contentType = response.headers.get("content-type") || "";
  const payload = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    let message = "Request failed";
    if (typeof payload === "object" && payload?.message) {
      message = payload.message;
    } else if (typeof payload === "string") {
      if (payload.includes("<!DOCTYPE html>") || payload.includes("<html>")) {
        message = `Server error (${response.status}): The requested resource was not found or the server encountered an issue.`;
      } else {
        message = payload;
      }
    }
    if (
      response.status === 403 &&
      typeof message === "string" &&
      message.toLowerCase().includes("inactive")
    ) {
      localStorage.removeItem("auth_token");
      window.dispatchEvent(
        new CustomEvent("auth:inactive", { detail: { message } })
      );
    }
    const error = new Error(message);
    error.status = response.status;
    error.payload = payload;
    throw error;
  }

  return payload;
};
