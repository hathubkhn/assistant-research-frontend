'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

function LoginForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [loginLinks, setLoginLinks] = useState({
        google_login: '',
        microsoft_login: '',
        token_login: ''
    });
    const [formData, setFormData] = useState({
        username: '',
        password: ''
    });

    useEffect(() => {
        // Check if there's an error parameter in the URL
        const errorMsg = searchParams.get('error');
        if (errorMsg) {
            setError(errorMsg === 'authentication_failed'
                ? 'Authentication failed. Please try again.'
                : errorMsg === 'token_invalid'
                    ? 'Your session has expired. Please log in again.'
                    : 'An error occurred. Please try again.');

            // Clear any existing auth token if there was an auth error
            localStorage.removeItem('authToken');
        }

        // Fetch login links from the backend
        const fetchLoginLinks = async () => {
            try {
                setIsLoading(true);
                const response = await fetch(`${API_URL}/api/login/`);

                if (response.ok) {
                    const data = await response.json();
                    setLoginLinks({
                        google_login: data.google_login,
                        microsoft_login: data.microsoft_login,
                        token_login: data.token_login
                    });
                } else {
                    setError('Failed to load login options');
                    // Fallback to direct external links
                    setLoginLinks({
                        google_login: 'https://accounts.google.com/o/oauth2/auth',
                        microsoft_login: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
                        token_login: `${API_URL}/api/token-login/`
                    });
                }
            } catch (error) {
                console.error('Login fetch error:', error);
                setError('An error occurred while setting up login options');
                // Fallback to direct external links
                setLoginLinks({
                    google_login: 'https://accounts.google.com/o/oauth2/auth',
                    microsoft_login: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
                    token_login: `${API_URL}/api/token-login/`
                });
            } finally {
                setIsLoading(false);
            }
        };

        fetchLoginLinks();
    }, [searchParams]);

    const handleSSOLogin = (provider: string) => {
        // Redirect to the SSO provider
        if (provider === 'google') {
            // Direct Google OAuth URL
            const googleOAuthUrl = 'https://accounts.google.com/o/oauth2/auth';
            const redirectUri = `${window.location.origin}/sso-callback/google`;
            const params = new URLSearchParams({
                client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '',
                redirect_uri: redirectUri,
                response_type: 'code',
                scope: 'email profile',
                access_type: 'offline',
                prompt: 'consent'
            });
            console.log('Google OAuth URL:', `${googleOAuthUrl}?${params.toString()}`);
            console.log('Google redirect URI:', redirectUri);
            window.location.href = `${googleOAuthUrl}?${params.toString()}`;
        } else if (provider === 'microsoft') {
            // Direct Microsoft OAuth URL
            const msOAuthUrl = 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize';
            const redirectUri = `${window.location.origin}/sso-callback/microsoft`;
            const clientId = process.env.NEXT_PUBLIC_MICROSOFT_CLIENT_ID || '';

            console.log('Microsoft client ID:', clientId);
            console.log('Microsoft redirect URI:', redirectUri);

            const params = new URLSearchParams({
                client_id: clientId,
                redirect_uri: redirectUri,
                response_type: 'code',
                scope: 'openid profile email User.Read',
                response_mode: 'query'
            });
            console.log('Microsoft OAuth URL:', `${msOAuthUrl}?${params.toString()}`);
            window.location.href = `${msOAuthUrl}?${params.toString()}`;
        } else {
            setError(`${provider} login link is not available`);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            setIsLoading(true);
            setError('');

            console.log('Attempting login to:', `${API_URL}/api/token-login/`);
            const response = await fetch(`${API_URL}/api/token-login/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            console.log('Login response status:', response.status);

            if (response.ok) {
                const data = await response.json();
                console.log('Login successful, token received:', !!data.token);
                console.log('Token value (first 10 chars):', data.token ? data.token.substring(0, 10) + '...' : 'No token');

                // Clear any old tokens
                localStorage.removeItem('token');
                sessionStorage.removeItem('token');
                sessionStorage.removeItem('authToken');
                localStorage.removeItem('authToken');

                // Check if the token has a prefix like "Token " and remove it
                let cleanToken = data.token;
                if (cleanToken && cleanToken.startsWith('Token ')) {
                    cleanToken = cleanToken.substring(6);
                    console.log('Removed "Token " prefix from token');
                }

                // Store token
                localStorage.setItem('authToken', cleanToken);

                console.log('Token stored in localStorage. Current storage state:', {
                    authToken: localStorage.getItem('authToken')
                });

                // Make a test API call to verify the token works
                try {
                    const testResponse = await fetch(`${API_URL}/api/test/`, {
                        method: 'GET',
                        headers: {
                            'Authorization': `Token ${cleanToken}`
                        }
                    });

                    console.log('Test API call status:', testResponse.status);
                    if (testResponse.ok) {
                        console.log('Test API call successful');
                    } else {
                        console.warn('Test API call failed with status:', testResponse.status);
                    }
                } catch (testError) {
                    console.error('Test API call error:', testError);
                }

                // Redirect to profile page instead of home
                router.push('/profile');
            } else {
                const errorData = await response.json();
                console.error('Login failed:', errorData);
                setError(errorData.non_field_errors?.[0] || 'Invalid credentials');
            }
        } catch (error) {
            console.error('Login error:', error);
            setError('An error occurred while logging in');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-gray-100">
            <div className="w-full max-w-md bg-white rounded-lg shadow-md p-8">
                <h2 className="text-2xl font-bold text-center text-gray-800 mb-8">Welcome AI Research Assistant Website</h2>

                {error && (
                    <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="mb-6 space-y-4">
                    <div>
                        <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                            Username or Email
                        </label>
                        <input
                            type="text"
                            id="username"
                            name="username"
                            value={formData.username}
                            onChange={handleInputChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                            Password
                        </label>
                        <input
                            type="password"
                            id="password"
                            name="password"
                            value={formData.password}
                            onChange={handleInputChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-2 px-4 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-70"
                    >
                        {isLoading ? 'Loading...' : 'Sign In'}
                    </button>
                </form>

                <div className="relative flex items-center justify-center mt-6 mb-6">
                    <div className="border-t border-gray-300 absolute w-full"></div>
                    <div className="bg-white px-4 relative text-sm text-gray-500">OR</div>
                </div>

                <div className="space-y-4">
                    <button
                        onClick={() => handleSSOLogin('google')}
                        disabled={isLoading || !loginLinks.google_login}
                        className="w-full flex items-center justify-center gap-3 bg-white border border-gray-300 rounded-md py-3 text-gray-800 hover:bg-gray-50 disabled:opacity-70"
                    >
                        <svg viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
                            <g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)">
                                <path fill="#4285F4" d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z" />
                                <path fill="#34A853" d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z" />
                                <path fill="#FBBC05" d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.724 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.479 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.999 -25.464 56.619 L -21.484 53.529 Z" />
                                <path fill="#EA4335" d="M -14.754 43.989 C -12.984 43.989 -11.404 44.599 -10.154 45.789 L -6.734 42.369 C -8.804 40.429 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.989 -14.754 43.989 Z" />
                            </g>
                        </svg>
                        Sign in with Google
                    </button>

                    <button
                        onClick={() => handleSSOLogin('microsoft')}
                        disabled={isLoading || !loginLinks.microsoft_login}
                        className="w-full flex items-center justify-center gap-3 bg-white border border-gray-300 rounded-md py-3 text-gray-800 hover:bg-gray-50 disabled:opacity-70"
                    >
                        <svg width="24" height="24" viewBox="0 0 21 21" xmlns="http://www.w3.org/2000/svg">
                            <rect x="1" y="1" width="9" height="9" fill="#f25022" />
                            <rect x="1" y="11" width="9" height="9" fill="#00a4ef" />
                            <rect x="11" y="1" width="9" height="9" fill="#7fba00" />
                            <rect x="11" y="11" width="9" height="9" fill="#ffb900" />
                        </svg>
                        Sign in with Microsoft
                    </button>
                </div>

                <div className="mt-6 text-center">
                    <p className="text-sm text-gray-600">
                        {"Don't have an account? "}
                        <Link href="/signup" className="text-blue-600 hover:underline">
                            Sign up
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}

export default function Login() {
    return (
        <Suspense fallback={<div className="flex min-h-screen flex-col items-center justify-center bg-gray-100">Loading...</div>}>
            <LoginForm />
        </Suspense>
    );
} 