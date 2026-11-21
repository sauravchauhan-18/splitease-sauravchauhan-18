const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

async function request(path, options = {}) {
  let response;
  try {
    response = await fetch(`${API_URL}/api${path}`, {
      ...options,
      headers: {
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        ...options.headers,
      },
    });
  } catch {
    throw new Error('Could not reach the API. Start the server and check its database connection.');
  }

  const payload = response.status === 204 ? null : await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload?.message || `Request failed (${response.status}).`);
  return payload;
}

const json = (method, body) => ({ method, body: JSON.stringify(body) });

export const api = {
  health: () => request('/health'),
  people: {
    list: () => request('/people'),
    create: (data) => request('/people', json('POST', data)),
    remove: (id) => request(`/people/${id}`, { method: 'DELETE' }),
  },
  expenses: {
    list: () => request('/expenses'),
    create: (data) => request('/expenses', json('POST', data)),
    update: (id, data) => request(`/expenses/${id}`, json('PUT', data)),
    remove: (id) => request(`/expenses/${id}`, { method: 'DELETE' }),
  },
};
