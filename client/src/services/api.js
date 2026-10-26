const configuredApiUrl = import.meta.env.VITE_API_URL?.trim().replace(/\/+$/, '');
const API_URL = configuredApiUrl || (import.meta.env.PROD ? '/api/v1' : 'http://localhost:5000/api/v1');
const SESSION_KEY = 'mystery-room-session';

async function sessionId() {
  let id = localStorage.getItem(SESSION_KEY);
  if (!id) {
    const response = await fetch(`${API_URL}/sessions`, { method: 'POST' });
    if (!response.ok) throw new Error('Could not start a private investigation session.');
    ({ sessionId: id } = await response.json()); localStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

export async function api(path, options = {}) {
  const sid = await sessionId();
  const response = await fetch(`${API_URL}${path}`, { ...options, headers: { 'Content-Type': 'application/json', 'X-Session-Id': sid, ...options.headers } });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error?.message || 'Request failed. Please try again.');
  return data;
}
export const json = (method, body) => ({ method, body: JSON.stringify(body) });
