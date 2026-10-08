import axios from 'axios';

// Connects to /api (which is proxied by Vite to http://127.0.0.1:8000),
// or custom VITE_API_URL if configured.
const baseURL = import.meta.env.VITE_API_URL || '/api';

export const apiClient = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});
