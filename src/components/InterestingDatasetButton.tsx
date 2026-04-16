import { useState, useEffect } from 'react';
import { getAuthHeaders } from '../utils/auth';
import { toast } from 'react-hot-toast';

interface InterestingDatasetButtonProps {
    datasetId: string;
    initialState?: boolean;
    className?: string;
    onToggle?: (isInteresting: boolean) => void;
}

const InterestingDatasetButton = ({
    datasetId,
    initialState = false,
    className = '',
    onToggle
}: InterestingDatasetButtonProps) => {
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
            const interestState = localStorage.getItem(`dataset-starred-${datasetId}`);
            if (interestState !== null) {
                const newState = interestState === 'true';
                setIsInteresting(newState);
                // Call the onToggle callback if provided and state is different from initialState
                if (onToggle && newState !== initialState) {
                    onToggle(newState);
                }
            }
        }
    }, [datasetId, initialState, onToggle]);

    const toggleInteresting = async () => {
        try {
            setIsLoading(true);
            setIsAnimating(true);

            // Optimistically update UI
            const newState = !isInteresting;
            setIsInteresting(newState);

            // Store state in localStorage to persist across page reloads
            if (typeof window !== 'undefined') {
                localStorage.setItem(`dataset-starred-${datasetId}`, String(newState));
            }

            // Call the onToggle callback if provided
            if (onToggle) {
                onToggle(newState);
            }

            const headers = getAuthHeaders();
            // Check if user is logged in
            if (typeof window !== 'undefined' &&
                !(localStorage.getItem('authToken') ||
                    sessionStorage.getItem('authToken') ||
                    localStorage.getItem('token') ||
                    sessionStorage.getItem('token'))) {
                console.error('No authentication token found');
                throw new Error('You must be logged in to mark datasets as interesting');
            }

            // Call the API with the appropriate method depending on the new state
            const method = newState ? 'POST' : 'DELETE';
            const endpoint = newState
                ? `/api/datasets/mark-interesting/${datasetId}/`
                : `/api/datasets/${datasetId}/unmark-interesting/`;

            const response = await fetch(endpoint, {
                method,
                headers,
                credentials: 'include'
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                const errorMessage = errorData.error || 'Failed to toggle interesting state';

                if (response.status === 401) {
                    throw new Error('Authentication failed. Please log in again.');
                }

                throw new Error(errorMessage);
            }

            // Success message
            toast.success(newState ? 'Added to your interests' : 'Removed from your interests');
        } catch (error) {
            console.error('Error toggling interesting state:', error);
            toast.error(error instanceof Error ? error.message : 'An error occurred');

            // Revert optimistic update on error
            const revertedState = isInteresting;
            setIsInteresting(revertedState);

            // Update localStorage with the reverted state
            if (typeof window !== 'undefined') {
                localStorage.setItem(`dataset-starred-${datasetId}`, String(revertedState));
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
            aria-label={isInteresting ? 'Remove from interesting' : 'Mark as interesting'}
            className={`${className} flex items-center focus:outline-none transition-transform ${isAnimating ? 'transform scale-125' : ''}`}
        >
            {isLoading ? (
                <span className='mr-2'>
                    <svg className='animate-spin h-4 w-4' xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24'>
                        <circle className='opacity-25' cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='4'></circle>
                        <path className='opacity-75' fill='currentColor' d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'></path>
                    </svg>
                </span>
            ) : (
                <>
                    {isInteresting ? (
                        <svg
                            xmlns='http://www.w3.org/2000/svg'
                            className={`h-5 w-5 mr-1 text-yellow-500 transition-all duration-300 ${isAnimating ? 'animate-pulse' : ''}`}
                            viewBox='0 0 20 20'
                            fill='currentColor'
                        >
                            <path d='M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z' />
                        </svg>
                    ) : (
                        <svg
                            xmlns='http://www.w3.org/2000/svg'
                            className={`h-5 w-5 mr-1 text-gray-400 hover:text-yellow-400 transition-all duration-300 ${isAnimating ? 'animate-pulse' : ''}`}
                            fill='none'
                            viewBox='0 0 24 24'
                            stroke='currentColor'
                        >
                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z' />
                        </svg>
                    )}
                </>
            )}
            {isInteresting ? 'Interested' : 'Add to Interests'}
        </button>
    );
};

export default InterestingDatasetButton; 