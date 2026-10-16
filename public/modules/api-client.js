// ==========================================
// API Client & In-Memory Auth State
// ==========================================

let currentSession = null;
let currentApprovalToken = null;

export const getSession = () => currentSession;
export const setSession = (session) => {
  currentSession = session;
};

export const getApprovalToken = () => currentApprovalToken;
export const setApprovalToken = (token) => {
  currentApprovalToken = token;
};

export const clearAuth = () => {
  currentSession = null;
  currentApprovalToken = null;
};

export async function apiFetch(endpoint, options = {}) {
  const { method = 'GET', body, headers = {}, ...rest } = options;
  const mergedHeaders = { ...headers };

  if (currentSession?.access_token) {
    mergedHeaders['Authorization'] = `Bearer ${currentSession.access_token}`;
  }
  if (currentApprovalToken) {
    mergedHeaders['x-device-approval'] = currentApprovalToken;
  }
  if (body && typeof body === 'object' && !(body instanceof FormData)) {
    mergedHeaders['Content-Type'] = 'application/json';
  }

  return fetch(endpoint, {
    method,
    headers: mergedHeaders,
    body: body && typeof body === 'object' && !(body instanceof FormData) ? JSON.stringify(body) : body,
    credentials: 'same-origin',
    cache: 'no-store',
    ...rest,
  });
}
