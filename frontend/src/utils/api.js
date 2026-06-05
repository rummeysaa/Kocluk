/**
 * authFetch – fetch wrapper that automatically adds the JWT token.
 *
 * Usage:
 *   import { authFetch } from '../utils/api';
 *   const response = await authFetch('http://localhost:5000/api/teacher/stats');
 */
export async function authFetch(url, options = {}) {
  const token = localStorage.getItem('token');

  const headers = {
    ...(options.headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  // Only set Content-Type to JSON if there's no body or body is not FormData
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = headers['Content-Type'] || 'application/json';
  }

  const opts = {
    ...options,
    headers,
  };

  const response = await fetch(url, opts);

  if (response.status === 401) {
    console.warn('Token geçersiz veya süresi dolmuş – token siliniyor');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }

  return response;
}
