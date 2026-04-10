import { useState, useEffect } from 'react'
import { getAuthHeaders } from '../utils/auth'
import toast from 'react-hot-toast'

interface DownloadButtonProps {
    paperId: string;
    initialState?: boolean;
    className?: string;
    onToggle?: (isDownloaded: boolean) => void;
}

const DownloadButton = ({
    paperId,
    initialState = false,
    className = '',
    onToggle,
}: DownloadButtonProps) => {
    const [isDownloaded, setIsDownloaded] = useState(initialState)
    const [isLoading, setIsLoading] = useState(false)

    // Update state if initialState prop changes
    useEffect(() => {
        setIsDownloaded(initialState)
    }, [initialState])

    const toggleDownloaded = async () => {
        try {
            setIsLoading(true)

            const headers = getAuthHeaders()
            // Check if auth token exists
            if (!headers.Authorization) {
                console.error('No authentication token found')
                throw new Error('You must be logged in to mark papers as downloaded')
            }

            // Call the API with the new endpoint format
            const response = await fetch(`/api/papers/mark-downloaded/${paperId}/`, {
                method: 'POST',
                headers,
                credentials: 'include', // Add credentials: 'include' to send cookies
            })

            if (!response.ok) {
                if (response.status === 401) {
                    throw new Error('Authentication failed. Please log in again.')
                }

                let errorMessage = 'Failed to toggle downloaded state'
                try {
                    const errorData = await response.json()
                    errorMessage = errorData.error || errorMessage
                } catch (e) {
                    // If parsing JSON fails, use the default message
                }
                throw new Error(errorMessage)
            }

            const data = await response.json()
            const newDownloadedState = !isDownloaded // Toggle the state
            setIsDownloaded(newDownloadedState)

            // Call the onToggle callback if provided
            if (onToggle) {
                onToggle(newDownloadedState)
            }
        } catch (error) {
            console.error('Error toggling downloaded state:', error)
            toast.error(error instanceof Error ? error.message : 'An error occurred')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <button
            onClick={toggleDownloaded}
            disabled={isLoading}
            aria-label={isDownloaded ? 'Remove from downloaded' : 'Mark as downloaded'}
            className={`${className} flex items-center`}
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
                    {isDownloaded ? (
                        <svg xmlns='http://www.w3.org/2000/svg' className='h-5 w-5 mr-1' viewBox='0 0 20 20' fill='currentColor'>
                            <path fillRule='evenodd' d='M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z' clipRule='evenodd' />
                        </svg>
                    ) : (
                        <svg xmlns='http://www.w3.org/2000/svg' className='h-5 w-5 mr-1' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4' />
                        </svg>
                    )}
                </>
            )}
            {isDownloaded ? 'Downloaded' : 'Download'}
        </button>
    )
}

export default DownloadButton
