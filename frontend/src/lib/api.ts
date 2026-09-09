import axios from 'axios';
import { getIdToken } from '@/lib/amplify';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

// Attach the Cognito ID token (async — Amplify reads it from its token store).
api.interceptors.request.use(async (config) => {
  const token = await getIdToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// On 401, bounce to login. Cognito/Amplify handles token refresh internally,
// so there's no manual refresh dance anymore.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      error.response?.status === 401 &&
      typeof window !== 'undefined' &&
      !window.location.pathname.startsWith('/auth')
    ) {
      window.location.href = '/auth/login';
    }
    return Promise.reject(error);
  },
);

export default api;
