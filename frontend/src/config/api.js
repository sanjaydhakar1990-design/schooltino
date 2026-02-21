/**
 * api.js — Centralized API Configuration
 *
 * IMPORTANT: Always import from this file instead of constructing API URLs manually.
 * This ensures consistency across the entire app.
 *
 * Usage:
 *   import { API, API_BASE } from '../config/api';
 *   const data = await fetch(`${API}/students?school_id=${id}`);
 *
 * For components inside nested folders, adjust the import path:
 *   import { API } from '../../config/api';
 */

/** Backend base URL (no trailing slash, no /api) */
export const API_BASE = process.env.REACT_APP_BACKEND_URL || '';

/** Full API base with /api prefix — USE THIS for all API calls */
export const API = `${API_BASE}/api`;

/**
 * Build an auth header object from localStorage token.
 * Usage: headers: authHeader()
 */
export const authHeader = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

/**
 * Generic fetch wrapper with auth header and JSON body.
 * Usage:
 *   const data = await apiFetch('/students', { method: 'POST', body: JSON.stringify({...}) });
 */
export const apiFetch = async (path, options = {}) => {
  const url = path.startsWith('http') ? path : `${API}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...authHeader(),
      ...(options.headers || {}),
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || `HTTP ${res.status}`);
  }
  return res.json();
};
