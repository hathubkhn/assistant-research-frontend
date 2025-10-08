export const getAuthHeaders = (includeContentType: boolean = false): HeadersInit => {
  const headers: Record<string, string> = {};

  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('authToken');
    if (token) {
      headers['Authorization'] = `Token ${token}`;
    }
  }

  if (includeContentType) {
    headers['Content-Type'] = 'application/json';
  }

  return headers;
};

export const hasAuthToken = (): boolean => {
  if (typeof window === 'undefined') return false;
  const token = localStorage.getItem('authToken');
  return !!token;
};

export const fetchWithAuth = async (url: string, options: RequestInit = {}): Promise<Response> => {
  if (!options.headers) {
    options.headers = {};
  }

  const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;

  if (token && typeof options.headers === 'object' && !('Authorization' in options.headers)) {
    const headers = new Headers(options.headers);
    headers.set('Authorization', `Token ${token}`);
    options.headers = headers;
  }

  const fetchOptions: RequestInit = {
    ...options,
    credentials: options.credentials || 'include',
    mode: options.mode || 'cors',
  };

  try {
    const response = await fetch(url, fetchOptions);

    if (response.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('authToken');
        localStorage.removeItem('token');
        sessionStorage.removeItem('authToken');
        sessionStorage.removeItem('token');
        window.location.href = '/login?error=token_invalid';
      }
    }

    return response;
  } catch (error) {
    return new Response(JSON.stringify({
      error: 'Failed to connect to the server',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const fetchProfile = async () => {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  if (!hasAuthToken()) {
    return null;
  }

  try {
    const response = await fetchWithAuth(`${API_URL}/api/profile`);
    return response.ok ? await response.json() : null;
  } catch (error) {
    console.error('Error fetching profile:', error);
    return null;
  }
}; 