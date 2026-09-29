const TOKEN_KEY = 'pawnest_token';

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (token) => {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
};

export class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

async function request(path, { method = 'GET', body, params, signal, formData } = {}) {
 const API_BASE = 'https://pawnest-backend.vercel.app';

let url = `${API_BASE}/api${path}`;
  if (params) {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '') return;
      qs.set(key, Array.isArray(value) ? value.join(',') : value);
    });
    const text = qs.toString();
    if (text) url += `?${text}`;
  }

  const headers = {};
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  let payload;
  if (formData) {
    payload = formData;
  } else if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
    payload = JSON.stringify(body);
  }

  let response;
  try {
    response = await fetch(url, { method, headers, body: payload, signal });
  } catch (err) {
    if (err.name === 'AbortError') throw err;
    throw new ApiError('Cannot reach the server. Check your connection and try again.', 0);
  }

  let data = null;
  try {
    data = await response.json();
  } catch (err) {
    data = null;
  }

  if (!response.ok) {
    if (response.status === 401 && token) window.dispatchEvent(new Event('pawnest:unauthorized'));
    throw new ApiError((data && data.message) || 'Something went wrong. Please try again.', response.status, data);
  }
  return data;
}

export const api = {
  get: (path, params, opts) => request(path, { params, ...opts }),
  post: (path, body) => request(path, { method: 'POST', body }),
  put: (path, body) => request(path, { method: 'PUT', body }),
  patch: (path, body) => request(path, { method: 'PATCH', body }),
  del: (path) => request(path, { method: 'DELETE' }),
  upload: (file) => {
    const formData = new FormData();
    formData.append('image', file);
    return request('/admin/upload', { method: 'POST', formData });
  },
};
