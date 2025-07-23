'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { getAuthHeaders } from '@/utils/auth';

interface InterestingButtonProps {
    paperId: string;
    initialState?: boolean;
    className?: string;
    onToggle?: (isInteresting: boolean) => void;
}

const InterestingButton = ({
    paperId,
    initialState = false,
    className = '',
    onToggle
}: InterestingButtonProps) => {
    const [isInteresting, setIsInteresting] = useState(initialState);
    const [isLoading, setIsLoading] = useState(false);
    const [isAnimating, setIsAnimating] = useState(false);

    // Update state if initialState prop changes
    useEffect(() => {
        setIsInteresting(initialState);
    }, [initialState]);

    // Load state from localStorage on component mount
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const interestState = localStorage.getItem(`paper-starred-${paperId}`);
            if (interestState !== null) {
                const newState = interestState === 'true';
                setIsInteresting(newState);
                // Call the onToggle callback if provided and state is different from initialState
                if (onToggle && newState !== initialState) {
                    onToggle(newState);
                }
            }
        }
    }, [paperId, initialState, onToggle]);

    const toggleInteresting = async () => {
        try {
            setIsLoading(true);
            setIsAnimating(true);

            // Optimistically update UI
            const newState = !isInteresting;
            setIsInteresting(newState);

            // Store state in localStorage to persist across page reloads
            if (typeof window !== 'undefined') {
                localStorage.setItem(`paper-starred-${paperId}`, String(newState));
            }

            // Call the onToggle callback if provided
            if (onToggle) {
                onToggle(newState);
            }

            const headers = getAuthHeaders(true);
            // Check if auth token exists
            if (typeof window !== 'undefined' &&
                !(localStorage.getItem('authToken') ||
                    sessionStorage.getItem('authToken') ||
                    localStorage.getItem('token') ||
                    sessionStorage.getItem('token'))) {
                console.error('No authentication token found');
                throw new Error('You must be logged in to mark papers as interesting');
            }

            // Call the API with the appropriate method depending on the new state
            const method = newState ? 'POST' : 'DELETE';
            const endpoint = newState
                ? `/api/papers/mark-interesting/${paperId}/`
                : `/api/papers/${paperId}/unmark-interesting/`;

            const response = await fetch(endpoint, {
                method,
                headers,
                credentials: 'include'
            });

            if (!response.ok) {
                if (response.status === 401) {
                    throw new Error('Authentication failed. Please log in again.');
                }

                const errorData = await response.json().catch(() => ({}));
                const errorMessage = errorData.error || 'Failed to toggle interesting state';
                throw new Error(errorMessage);
            }

            // Success message
            toast.success(newState ? 'Paper added to your interests' : 'Paper removed from your interests');
        } catch (error) {
            console.error('Error toggling interesting state:', error);
            toast.error(error instanceof Error ? error.message : 'An error occurred');

            // Revert optimistic update on error
            const revertedState = isInteresting;
            setIsInteresting(revertedState);

            // Update localStorage with the reverted state
            if (typeof window !== 'undefined') {
                localStorage.setItem(`paper-starred-${paperId}`, String(revertedState));
            }

            // Call the onToggle callback with the reverted state
            if (onToggle) {
                onToggle(revertedState);
            }
        } finally {
            setIsLoading(false);

            // End animation after slight delay
            setTimeout(() => {
                setIsAnimating(false);
            }, 300);
        }
    };

    return (
        <button
            onClick={toggleInteresting}
            disabled={isLoading}
            className={`flex items-center justify-center focus:outline-none ${className} transition-transform ${isAnimating ? 'transform scale-125' : ''}`}
            title={isInteresting ? "Remove from interesting papers" : "Mark as interesting"}
            aria-label={isInteresting ? "Remove from interesting papers" : "Mark as interesting"}
        >
            {isLoading ? (
                <span className="mr-2">
                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                </span>
            ) : (
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6"
                    fill={isInteresting ? "currentColor" : "none"}
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2"
                    style={{ color: isInteresting ? '#FFC107' : 'currentColor' }}
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                    />
                </svg>
            )}
            {isInteresting && (
                <span className="ml-1 text-sm text-yellow-500 font-medium">Interested</span>
            )}
        </button>
    );
};

export default InterestingButton; 