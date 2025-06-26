'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTranslation } from '../../utils/useTranslation';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

function LoginForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const { language } = useLanguage();
    const { t } = useTranslation();
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
                    console.error('Test API call error:', testError instanceof Error ? testError.message : 'Unknown error');
                }

                // Redirect to profile page instead of home
                router.push('/profile');
            } else {
                try {
                    const errorData = await response.json();
                    console.error('Login failed:', errorData);

                    // Provide more specific error messages based on the response
                    if (errorData.non_field_errors) {
                        setError(errorData.non_field_errors[0]);
                    } else if (errorData.username) {
                        setError(`Username error: ${errorData.username[0]}`);
                    } else if (errorData.password) {
                        setError(`Password error: ${errorData.password[0]}`);
                    } else if (errorData.detail) {
                        setError(errorData.detail);
                    } else {
                        setError('Login failed. Please check your credentials and try again.');
                    }
                } catch (parseError) {
                    console.error('Error parsing response:', parseError);
                    setError(`Login failed with status ${response.status}. Please try again.`);
                }
            }
        } catch (error) {
            // Safely log the error, preventing empty object issues
            console.error('Login failed:', error instanceof Error ? error.message : 'Unknown error');
            setError('An error occurred while trying to log in. Please try again later.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="w-full max-w-md mx-auto">
            {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">{error}</div>}

            <form onSubmit={handleSubmit} className="bg-white shadow-lg rounded-lg px-8 pt-6 pb-8 mb-4">
                <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">{t('auth.login')}</h2>

                <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="username">
                        {t('auth.email')}
                    </label>
                    <input
                        id="username"
                        type="text"
                        name="username"
                        value={formData.username}
                        onChange={handleInputChange}
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        placeholder="john@example.com"
                        required
                    />
                </div>

                <div className="mb-6">
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">
                        {t('auth.password')}
                    </label>
                    <input
                        id="password"
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        placeholder="********"
                        required
                    />
                </div>

                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center">
                        <input
                            id="remember-me"
                            name="remember-me"
                            type="checkbox"
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                            {t('auth.rememberMe')}
                        </label>
                    </div>
                    <a href="#" className="text-sm text-blue-600 hover:text-blue-800">
                        {t('auth.forgotPassword')}
                    </a>
                </div>

                <div className="mb-6">
                    <button
                        type="submit"
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                        disabled={isLoading}
                    >
                        {isLoading ? t('common.loading') : t('auth.loginButton')}
                    </button>
                </div>

                <div className="mb-6 flex items-center">
                    <div className="flex-grow border-t border-gray-300"></div>
                    <span className="mx-4 text-gray-500 text-sm">
                        {t('common.or')}
                    </span>
                    <div className="flex-grow border-t border-gray-300"></div>
                </div>

                <div className="space-y-3">
                    <button
                        type="button"
                        onClick={() => handleSSOLogin('google')}
                        className="w-full flex justify-center items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                    >
                        <svg className="h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
                            <path d="M488 261.8C488 403.3 391.1 504 248 504C110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6c98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z" />
                        </svg>
                        {t('auth.continueWithGoogle')}
                    </button>
                    <button
                        type="button"
                        onClick={() => handleSSOLogin('microsoft')}
                        className="w-full flex justify-center items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                    >
                        <svg className="h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 23 23">
                            <path fill="#f3f3f3" d="M0 0h23v23H0z" />
                            <path fill="#f35325" d="M1 1h10v10H1z" />
                            <path fill="#81bc06" d="M12 1h10v10H12z" />
                            <path fill="#05a6f0" d="M1 12h10v10H1z" />
                            <path fill="#ffba08" d="M12 12h10v10H12z" />
                        </svg>
                        {t('auth.continueWithMicrosoft')}
                    </button>
                </div>
            </form>

            <div className="text-center">
                <p className="text-gray-600">
                    {t('auth.noAccount')} <Link href="/signup" className="text-blue-600 hover:text-blue-800">{t('auth.signupButton')}</Link>
                </p>
            </div>
        </div>
    );
}

export default function Login() {
    return (
        <div className="min-h-screen bg-gray-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <h1 className="text-center text-3xl font-extrabold text-gray-900">Research Assistant</h1>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <Suspense fallback={<div>Loading...</div>}>
                    <LoginForm />
                </Suspense>
            </div>
        </div>
    );
} 