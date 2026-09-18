// Swap via window.CINELOG_API_URL before this script loads (e.g. in index.html) when
// pointing at a deployed backend - no build step means no env-var injection here.
const BASE_URL = window.CINELOG_API_URL || 'http://localhost:4000/api';
const TOKEN_KEY = 'cinelog_token';

function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

// The one fetch wrapper - every page/component call goes through this, nothing else
// in the frontend calls fetch() directly.
async function apiRequest(path, { method = 'GET', body, auth = true } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (auth) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(errBody.message || `Request failed: ${res.status}`);
  }

  if (res.status === 204) return null;
  return res.json();
}

async function loginWithGoogle(credential) {
  const data = await apiRequest('/auth/google', {
    method: 'POST',
    body: { credential },
    auth: false
  });
  setToken(data.token);
  return data;
}

export { apiRequest, getToken, setToken, clearToken, loginWithGoogle };
