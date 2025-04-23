'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

function GoogleCallbackContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [error, setError] = useState('');

    useEffect(() => {
        const code = searchParams.get('code');

        if (!code) {
            // No authorization code received
            router.push('/login?error=no_auth_code');
            return;
        }

        // Exchange the code for a token
        const exchangeCodeForToken = async () => {
            try {
                // Call your backend to exchange the code for a token
                const response = await fetch(`${API_URL}/api/auth/google/callback`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ code, redirect_uri: `${window.location.origin}/sso-callback/google` }),
                });

                if (response.ok) {
                    const data = await response.json();
                    // Store token in localStorage
                    localStorage.setItem('authToken', data.token);
                    localStorage.setItem('authProvider', 'google');

                    // Redirect to home page
                    router.push('/');
                } else {
                    // Handle error
                    setError('Failed to authenticate with Google');
                    setTimeout(() => router.push('/login?error=authentication_failed'), 2000);
                }
            } catch (error) {
                console.error('Google auth error:', error);
                setError('An error occurred during Google authentication');
                setTimeout(() => router.push('/login?error=authentication_failed'), 2000);
            }
        };

        exchangeCodeForToken();
    }, [router, searchParams]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-gray-900">
                        {error ? 'Authentication Error' : 'Processing Google Login...'}
                    </h1>
                    <div className="mt-4">
                        {!error ? (
                            <div className="flex justify-center">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                            </div>
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

export default function GoogleCallback() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-gray-100">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>}>
            <GoogleCallbackContent />
        </Suspense>
    );
} 