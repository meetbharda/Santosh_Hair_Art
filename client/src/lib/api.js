const API_URL = import.meta.env.VITE_API_URL || '/api';

export async function fetchApi(endpoint, options = {}) {
  const url = endpoint.startsWith('http') ? endpoint : `${API_URL}${endpoint}`;
  
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  const storedToken = typeof window !== 'undefined' ? localStorage.getItem('sha_token') : null;
  if (storedToken && !headers['Authorization']) {
    headers['Authorization'] = `Bearer ${storedToken}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include' // include HttpOnly session cookies
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(data.error || 'Network request failed');
    error.status = response.status;
    error.details = data.details;
    error.code = data.code;
    throw error;
  }

  return data;
}

export default fetchApi;
