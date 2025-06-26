'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { fetchWithAuth, hasAuthToken } from '../utils/auth';

// Type definitions for the Profile
type Profile = {
    userId: number;
    full_name: string;
    avatar_url: string | null;
};

// Type definitions for the User
type User = {
    id: number;
    username: string;
    email: string;
    profile: Profile | null;
};

// Type definitions for the Auth Context
type AuthContextType = {
    user: User | null;
    loading: boolean;
    logout: () => void;
    checkAuth: () => Promise<void>;
};

// Create the Auth Context with default values
const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
    logout: () => { },
    checkAuth: async () => { },
});

// Helper function to check if we're running in a browser environment
const isBrowser = () => typeof window !== 'undefined';

// Hook to use the Auth Context
export const useAuth = () => useContext(AuthContext);

// Auth Provider Component
export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    // Default to the URL specified in Next.js config (localhost:8000) if environment variable not set
    const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

    // Function to check if user is authenticated
    const checkAuth = async () => {
        setLoading(true);
        try {
            if (!isBrowser()) {
                setLoading(false);
                return;
            }

            if (!hasAuthToken()) {
                console.log('Auth context - No token found');
                setUser(null);
                setLoading(false);
                return;
            }

            // Ensure endpoint has the correct format (with or without trailing slash)
            const userEndpoint = `${API_URL}/api/profile/`;
            console.log('Auth context - Fetching user data from:', userEndpoint);
            console.log('Auth context - Current token state:', {
                authToken: localStorage.getItem('authToken'),
                token: localStorage.getItem('token')
            });

            try {
                const token = localStorage.getItem('authToken');
                const response = await fetchWithAuth(userEndpoint, {
                    headers: {
                        'Authorization': `Token ${token}`
                    },
                    credentials: 'include'
                });

                console.log('Auth context - User API response status:', response.status);

                if (response.ok) {
                    const userData = await response.json();
                    console.log('Auth context - User data loaded successfully:', userData);
                    setUser(userData);
                } else if (response.status === 401) {
                    // This case should be handled by fetchWithAuth now
                    console.warn('Auth context - Token is invalid or expired');
                    // Clear invalid token
                    localStorage.removeItem('authToken');
                    localStorage.removeItem('token');
                    sessionStorage.removeItem('authToken');
                    sessionStorage.removeItem('token');
                    setUser(null);
                    // Force redirect to login page with error parameter
                    window.location.href = '/login?error=token_invalid';
                } else if (response.status === 503) {
                    // Handle network errors from our fetchWithAuth wrapper
                    try {
                        const errorData = await response.json();
                        console.error('Auth context - Network error:', errorData);
                    } catch (e) {
                        console.error('Auth context - Network error, could not parse response');
                    }
                    setUser(null);
                    // Display a user-friendly message without forcing logout
                    // We don't force logout on network errors as they might be temporary
                } else {
                    // Other API errors
                    try {
                        const errorText = await response.text();
                        console.error('Auth context - Failed to load user data, status:', response.status);
                        console.error('Auth context - Error details:', errorText);
                    } catch (e) {
                        console.error('Auth context - Failed to load user data, status:', response.status);
                    }
                    // Don't clear token for other errors - might be temporary server issues
                    setUser(null);
                }
            } catch (fetchError) {
                // Network or server connection errors
                console.error('Auth context - API connection error:', fetchError);
                // Don't clear token for network errors - might be temporary
                setUser(null);
            }
        } catch (error) {
            console.error('Authentication check error:', error);
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    // Function to handle logout
    const logout = () => {
        if (isBrowser()) {
            localStorage.removeItem('authToken');
        }
        setUser(null);
        router.push('/login');
    };

    // Check authentication status on component mount
    useEffect(() => {
        checkAuth();
    }, []);

    return (
        <div suppressHydrationWarning={true}>
            <AuthContext.Provider value={{ user, loading, logout, checkAuth }}>
                {children}
            </AuthContext.Provider>
        </div>
    );
} 