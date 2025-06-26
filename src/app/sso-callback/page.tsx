'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function SSOCallbackContent() {
    const router = useRouter();
    const searchParams = useSearchParams();

    useEffect(() => {
        // Get token and provider from URL params
        const token = searchParams.get('token');
        const provider = searchParams.get('provider');

        if (token) {
            // Store token in localStorage
            localStorage.setItem('authToken', token);

            // You might want to store provider info as well
            if (provider) {
                localStorage.setItem('authProvider', provider);
            }

            // Redirect to dashboard or appropriate page
            router.push('/dashboard');
        } else {
            // If no token was received, redirect to login with error
            router.push('/login?error=no_token');
        }
    }, [router, searchParams]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-gray-900">Processing login...</h1>
                    <div className="mt-4">
                        <div className="flex justify-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                        </div>
                        <p className="mt-4 text-gray-600">
                            Please wait while we authenticate your account.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function SSOCallback() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-gray-100">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>}>
            <SSOCallbackContent />
        </Suspense>
    );
} 