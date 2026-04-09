'use client'

import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../contexts/AuthContext'
import Link from 'next/link'

interface RecommendedPaper {
    id: string;
    title: string;
    authors: string[];
    keywords: string[];
    addedDate: string;
}

export default function NotificationBell() {
    const { user } = useAuth()
    const [isOpen, setIsOpen] = useState(false)
    const [recommendedPapers, setRecommendedPapers] = useState<RecommendedPaper[]>([])
    const [loading, setLoading] = useState(false)
    const dropdownRef = useRef<HTMLDivElement>(null)

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [dropdownRef])

    // Fetch recommended papers based on user's keywords
    useEffect(() => {
        if (user) {
            fetchRecommendedPapers()
        }
    }, [user])

    const fetchRecommendedPapers = async () => {
        if (!user) return

        setLoading(true)
        try {
            // Get the auth token from local storage
            const token = localStorage.getItem('authToken')

            if (!token) {
                console.error('Authentication token not found')
                setLoading(false)
                return
            }

            // Use the new API endpoint
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
            const response = await fetch(`${API_URL}/api/my-library/?section=recommended`, {
                headers: {
                    'Authorization': token.startsWith('Token ') ? token : `Token ${token}`,
                },
            })

            if (!response.ok) {
                const errorText = await response.text()
                console.error(`Failed to fetch paper recommendations: ${response.status} - ${errorText}`)
                setLoading(false)
                return
            }

            const papersData = await response.json()

            // Get only the first 5 papers for the notification bell
            const filteredPapers = papersData.slice(0, 5)

            setRecommendedPapers(filteredPapers)
        } catch (error) {
            console.error('Error fetching recommended papers:', error)
        } finally {
            setLoading(false)
        }
    }

    // Count of new papers
    const newPapersCount = recommendedPapers.length

    return (
        <div className='relative' ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className='text-white hover:text-blue-200 focus:outline-none relative'
                aria-label='Notifications'
            >
                <svg xmlns='http://www.w3.org/2000/svg' className='h-6 w-6' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9' />
                </svg>
                {newPapersCount > 0 && (
                    <span className='absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center'>
                        {newPapersCount > 9 ? '9+' : newPapersCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className='absolute right-0 mt-2 w-72 bg-white rounded-md shadow-lg py-1 z-20'>
                    <div className='px-4 py-2 border-b'>
                        <h3 className='text-sm font-semibold'>Paper Recommendations</h3>
                    </div>

                    {loading ? (
                        <div className='px-4 py-3 text-center'>
                            <div className='w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto'></div>
                        </div>
                    ) : recommendedPapers.length > 0 ? (
                        <div className='max-h-96 overflow-y-auto'>
                            {recommendedPapers.map(paper => (
                                <Link
                                    href={`/papers/${paper.id}`}
                                    key={paper.id}
                                    className='block px-4 py-2 hover:bg-gray-100 border-b'
                                    onClick={() => setIsOpen(false)}
                                >
                                    <div className='text-sm font-medium text-gray-800'>{paper.title}</div>
                                    <div className='text-xs text-gray-500'>
                                        {Array.isArray(paper.authors)
                                            ? paper.authors.slice(0, 2).join(', ') + (paper.authors.length > 2 ? ' et al.' : '')
                                            : paper.authors}
                                    </div>
                                    <div className='mt-1 flex flex-wrap gap-1'>
                                        {Array.isArray(paper.keywords) && paper.keywords.slice(0, 3).map((keyword, idx) => (
                                            <span
                                                key={idx}
                                                className='inline-flex items-center rounded-md bg-blue-50 px-1.5 py-0.5 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10'
                                            >
                                                {keyword}
                                            </span>
                                        ))}
                                    </div>
                                </Link>
                            ))}
                            <Link
                                href={`/my-library?section=recommended&t=${Date.now()}`}
                                className='block text-center text-sm text-blue-600 hover:text-blue-700 py-2 font-medium'
                                onClick={() => setIsOpen(false)}
                            >
                                View all recommendations
                            </Link>
                        </div>
                    ) : (
                        <div className='px-4 py-3 text-center text-sm text-gray-500'>
                            No new paper recommendations found.
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
