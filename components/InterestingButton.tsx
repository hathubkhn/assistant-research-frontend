'use client';

import { useState, useEffect } from 'react';

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

    // Get auth token from local storage with improved token handling
    const getAuthHeaders = () => {
        if (typeof window === 'undefined') return {
            'Content-Type': 'application/json'
        };

        // Try to get token from various storage locations
        let authToken = localStorage.getItem('authToken') ||
            sessionStorage.getItem('authToken') ||
            localStorage.getItem('token') ||
            sessionStorage.getItem('token');

        // If token already has 'Token ' prefix, remove it to avoid duplication
        if (authToken && authToken.startsWith('Token ')) {
            authToken = authToken.substring(6);
        }

        // Return headers with or without Authorization
        return {
            'Authorization': authToken ? `Token ${authToken}` : '',
            'Content-Type': 'application/json'
        };
    };

    const toggleInteresting = async () => {
        try {
            setIsLoading(true);

            const headers = getAuthHeaders();
            // Check if auth token exists
            if (!headers.Authorization) {
                console.error('No authentication token found');
                throw new Error('You must be logged in to mark papers as interesting');
            }

            // If paper is already marked as interesting, show a confirmation
            if (isInteresting) {
                const confirmRemove = window.confirm('Paper already exists in your library. Do you want to remove it?');
                if (!confirmRemove) {
                    setIsLoading(false);
                    return;
                }
            } else {
                // For adding to favorites - check if it already exists on the server
                const checkResponse = await fetch(`/api/papers/check-interesting/${paperId}/`, {
                    headers,
                    credentials: 'include'
                });

                if (checkResponse.ok) {
                    const data = await checkResponse.json();
                    if (data.isInteresting) {
                        alert('Paper already exists in your library');
                        setIsInteresting(true);
                        setIsLoading(false);
                        if (onToggle) {
                            onToggle(true);
                        }
                        return;
                    }
                }
            }

            // Call the API with the new endpoint format
            const response = await fetch(`/api/papers/mark-interesting/${paperId}/`, {
                method: 'POST',
                headers,
                credentials: 'include' // Add credentials: 'include' to send cookies
            });

            if (!response.ok) {
                if (response.status === 401) {
                    throw new Error('Authentication failed. Please log in again.');
                }

                let errorMessage = 'Failed to toggle interesting state';
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.error || errorMessage;
                } catch (e) {
                    // If parsing JSON fails, use the default message
                }
                throw new Error(errorMessage);
            }

            const data = await response.json();
            setIsInteresting(data.isInteresting);

            // Show confirmation message
            if (data.isInteresting && !isInteresting) {
                alert('Paper added to your library');
            } else if (!data.isInteresting && isInteresting) {
                alert('Paper removed from your library');
            }

            // Call the onToggle callback if provided
            if (onToggle) {
                onToggle(data.isInteresting);
            }
        } catch (error) {
            console.error('Error toggling interesting state:', error);
            // Don't rethrow the error, just log it
            if (onToggle) {
                // Notify the parent component that the operation failed
                onToggle(isInteresting); // Keep the previous state
            }

            // Show an alert with the error message
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            alert(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <button
            onClick={toggleInteresting}
            disabled={isLoading}
            className={`flex items-center justify-center focus:outline-none ${className}`}
            title={isInteresting ? "Remove from interesting papers" : "Mark as interesting"}
            aria-label={isInteresting ? "Remove from interesting papers" : "Mark as interesting"}
        >
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
        </button>
    );
};

export default InterestingButton; 