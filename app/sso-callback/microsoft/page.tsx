'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

function MicrosoftCallbackContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [error, setError] = useState('');
    const [status, setStatus] = useState('Processing...');

    useEffect(() => {
        const code = searchParams.get('code');

        if (!code) {
            // No authorization code received
            setError('No authorization code received');
            setTimeout(() => router.push('/login?error=no_auth_code'), 2000);
            return;
        }

        // Exchange the code for a token
        const exchangeCodeForToken = async () => {
            try {
                setStatus('Received code, exchanging for token...');
                console.log('Sending code to backend:', code);
                console.log('Using API URL:', API_URL);

                // Ensure API_URL has protocol
                const apiUrl = API_URL.startsWith('http') ? API_URL : `http://${API_URL}`;
                const callbackUrl = `${apiUrl}/api/auth/microsoft/callback`;

                console.log('Full callback URL:', callbackUrl);
                console.log('Redirect URI:', `${window.location.origin}/sso-callback/microsoft`);

                // Call your backend to exchange the code for a token using XMLHttpRequest
                // instead of fetch to avoid CORS issues and get more detailed errors
                const xhr = new XMLHttpRequest();
                xhr.open('POST', callbackUrl, true);
                xhr.setRequestHeader('Content-Type', 'application/json');

                xhr.onload = function () {
                    if (xhr.status >= 200 && xhr.status < 300) {
                        // Success
                        const data = JSON.parse(xhr.responseText);
                        localStorage.setItem('authToken', data.token);
                        localStorage.setItem('authProvider', 'microsoft');
                        router.push('/');
                    } else {
                        // Error
                        console.error('Authentication error:', xhr.status, xhr.statusText, xhr.responseText);
                        try {
                            const errorData = JSON.parse(xhr.responseText);
                            setError(`Authentication failed: ${errorData.error || xhr.statusText}`);
                        } catch (e) {
                            setError(`Authentication failed: ${xhr.status} ${xhr.statusText}`);
                        }
                        setTimeout(() => router.push('/login?error=authentication_failed'), 2000);
                    }
                };

                xhr.onerror = function () {
                    console.error('Network error occurred');
                    setError('Network error - could not connect to authentication server');
                    setTimeout(() => router.push('/login?error=connection_failed'), 2000);
                };

                xhr.send(JSON.stringify({
                    code,
                    redirect_uri: `${window.location.origin}/sso-callback/microsoft`
                }));

            } catch (error: any) {
                console.error('Microsoft auth error:', error);
                setError(`Error: ${error.message || 'Unknown error'}`);
                setTimeout(() => router.push('/login?error=connection_failed'), 2000);
            }
        };

        exchangeCodeForToken();
    }, [router, searchParams]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-gray-900">
                        {error ? 'Authentication Error' : 'Processing Microsoft Login...'}
                    </h1>
                    <div className="mt-4">
                        {!error ? (
                            <>
                                <div className="flex justify-center">
                                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                                </div>
                                <p className="mt-2 text-gray-600">{status}</p>
                            </>
                        ) : (
                            <div className="text-red-500">{error}</div>
                        )}
                        <p className="mt-4 text-gray-600">
                            {error
                                ? 'Redirecting back to login page...'
                                : 'Please wait while we authenticate your account.'}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function MicrosoftCallback() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-gray-100">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>}>
            <MicrosoftCallbackContent />
        </Suspense>
    );
} 