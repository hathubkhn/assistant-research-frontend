/**
 * Gets authentication headers for API requests.
 * 
 * @param includeContentType Whether to include Content-Type header
 * @returns Headers object with Authorization token
 */
export const getAuthHeaders = (includeContentType: boolean = false): HeadersInit => {
    // Get token from localStorage if available
    let headers: HeadersInit = {};

    if (typeof window !== 'undefined') {
        const token = localStorage.getItem('authToken');
        if (token) {
            headers = {
                ...headers,
                'Authorization': `Token ${token}`
            };
        }
    }

    // Add Content-Type header if requested
    if (includeContentType) {
        headers = {
            ...headers,
            'Content-Type': 'application/json'
        };
    }

    return headers;
};

/**
 * Checks if there's a valid auth token available
 * @returns boolean indicating if a token exists
 */
export const hasAuthToken = (): boolean => {
    if (typeof window === 'undefined') return false;

    const token = localStorage.getItem('authToken');
    return !!token;
};

/**
 * Handles API requests with authentication, automatically handling token expiration
 * 
 * @param url The API endpoint URL
 * @param options Fetch options
 * @returns Promise with the fetch response
 */
export const fetchWithAuth = async (url: string, options: RequestInit = {}): Promise<Response> => {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

    // If headers are not set in options, create an empty object
    if (!options.headers) {
        options.headers = {};
    }

    // Get current auth token from localStorage
    const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
    console.log('Utils/auth - fetchWithAuth token status:', !!token);

    // Only add the Authorization header if it's not already present
    if (token && typeof options.headers === 'object' && !('Authorization' in options.headers)) {
        // Clone the headers to avoid modifying the original object
        const headers = new Headers(options.headers);
        headers.set('Authorization', `Token ${token}`);
        options.headers = headers;
        console.log('Utils/auth - Added Authorization header in fetchWithAuth');
    }

    // Ensure we have appropriate CORS settings
    const fetchOptions: RequestInit = {
        ...options,
        credentials: options.credentials || 'include',
        mode: options.mode || 'cors',
    };

    try {
        // Make the API request
        let response = await fetch(url, fetchOptions);
        console.log('Utils/auth - API response status:', response.status, 'URL:', url);

        // Handle 401 Unauthorized errors (token expired)
        if (response.status === 401) {
            console.log('Token expired or invalid, redirecting to login');

            // Clear all possible token storage locations
            if (typeof window !== 'undefined') {
                localStorage.removeItem('authToken');
                localStorage.removeItem('token');
                sessionStorage.removeItem('authToken');
                sessionStorage.removeItem('token');

                // Redirect to login page with error parameter
                window.location.href = '/login?error=token_invalid';
            }
        }

        return response;
    } catch (error) {
        console.error('Fetch error in fetchWithAuth:', error);

        // Create a mock response for fetch errors to maintain API 
        // compatibility while providing better error information
        return new Response(JSON.stringify({
            error: 'Failed to connect to the server',
            details: error instanceof Error ? error.message : 'Unknown error'
        }), {
            status: 503, // Service Unavailable
            headers: { 'Content-Type': 'application/json' }
        });
    }
};

/**
 * Specific function to fetch profile data
 * 
 * @returns Promise with the profile data or null if not authenticated
 */
export const fetchProfile = async () => {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

    if (!hasAuthToken()) {
        return null;
    }

    try {
        const response = await fetchWithAuth(`${API_URL}/api/profile`);

        if (response.ok) {
            return await response.json();
        }

        return null;
    } catch (error) {
        console.error('Error fetching profile:', error);
        return null;
    }
}; 