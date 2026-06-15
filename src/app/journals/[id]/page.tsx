'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import BackNavigationButton from '@/components/BackNavigationButton'
import DataPagination from '@/app/components/DataPagination'

const API_URL = process.env.NEXT_PUBLIC_API_URL

interface Journal {
    id: string;
    name: string;
    abbreviation: string;
    impactFactor: number | null;
    quartile: string;
    publisher: string;
    url: string;
    papersCount: number;
    created_at: string;
}

interface Paper {
    id: string;
    title: string;
    year: number;
    authors: string[] | string;
}

interface PapersResponse {
    results: Paper[];
    pagination: {
        page: number;
        pageSize: number;
        totalItems: number;
        totalPages: number;
    };
}

export default function JournalDetailPage() {
    const params = useParams()
    const router = useRouter()
    const id = params.id as string

    const [journal, setJournal] = useState<Journal | null>(null)
    const [papers, setPapers] = useState<Paper[]>([])
    const [loading, setLoading] = useState(true)
    const [papersLoading, setPapersLoading] = useState(true)
    const [currentPage, setCurrentPage] = useState(1)
    const [pageSize, setPageSize] = useState(20)
    const [totalItems, setTotalItems] = useState(0)

    useEffect(() => {
        const fetchJournalDetails = async () => {
            try {
                setLoading(true)
                const response = await fetch(`${API_URL}/api/journals/${id}/`)

                if (response.status === 404) {
                    console.error(`Journal not found with ID: ${id}`)
                    setLoading(false)
                    return
                }

                if (response.ok) {
                    const data = await response.json()
                    setJournal(data)
                } else {
                    console.error(`Error fetching journal details: ${response.status} ${response.statusText}`)
                }
            } catch (error) {
                console.error('Error fetching journal details:', error)
            } finally {
                setLoading(false)
            }
        }

        if (id) {
            fetchJournalDetails()
        }
    }, [id])

    const fetchPapers = useCallback(async () => {
        if (!id) return

        try {
            setPapersLoading(true)
            const params = new URLSearchParams({
                page: String(currentPage),
                pageSize: String(pageSize),
            })
            const response = await fetch(`${API_URL}/api/journals/${id}/papers/?${params}`)

            if (response.ok) {
                const data: PapersResponse = await response.json()
                setPapers(data.results || [])
                setTotalItems(data.pagination?.totalItems ?? 0)
            } else {
                console.error(`Error fetching journal papers: ${response.status}`)
                setPapers([])
                setTotalItems(0)
            }
        } catch (error) {
            console.error('Error fetching journal papers:', error)
            setPapers([])
            setTotalItems(0)
        } finally {
            setPapersLoading(false)
        }
    }, [id, currentPage, pageSize])

    useEffect(() => {
        fetchPapers()
    }, [fetchPapers])

    const handlePageChange = (page: number, size: number) => {
        setCurrentPage(page)
        setPageSize(size)
    }

    const handleViewMorePapers = () => {
        router.push(`/papers?venueType=journal&venue_id=${id}`)
    }

    if (loading) {
        return (
            <div className='container mx-auto px-4 py-8 flex justify-center items-center min-h-[60vh]'>
                <div className='animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600'></div>
            </div>
        )
    }

    if (!journal) {
        return (
            <div className='container mx-auto px-4 py-8'>
            <div className='mb-6'>
                <BackNavigationButton href='/journals' label='Back to Journals' />
            </div>
            <div className='bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md'>
                    <p>Journal not found. Please check the URL and try again.</p>
                    <Link href='/journals' className='mt-2 inline-block text-blue-600 hover:text-blue-800'>
                        Go back to Journals
                    </Link>
                </div>
            </div>
        )
    }

    const formatAuthors = (authors: string[] | string): string => {
        if (typeof authors === 'string') {
            try {
                const parsedAuthors = JSON.parse(authors)
                if (Array.isArray(parsedAuthors)) {
                    return parsedAuthors.join(', ')
                }
                return authors
            } catch {
                return authors
            }
        } else if (Array.isArray(authors)) {
            return authors.join(', ')
        }
        return 'Unknown'
    }

    return (
        <div className='container mx-auto px-4 py-8'>
            <div className='mb-6'>
                <BackNavigationButton href='/journals' label='Back to Journals' />
            </div>

            <div className='bg-white shadow-md rounded-lg overflow-hidden mb-8'>
                <div className='p-6'>
                    <div className='flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6'>
                        <div>
                            <h1 className='text-3xl font-bold text-blue-900'>{journal.name}</h1>
                            <p className='text-gray-500 text-lg'>{journal.abbreviation}</p>
                        </div>
                        {journal.url && (
                            <a
                                href={journal.url}
                                target='_blank'
                                rel='noopener noreferrer'
                                className='bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center gap-2'
                            >
                                <svg xmlns='http://www.w3.org/2000/svg' className='h-5 w-5' viewBox='0 0 20 20' fill='currentColor'>
                                    <path d='M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z' />
                                    <path d='M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z' />
                                </svg>
                                Visit Journal
                            </a>
                        )}
                    </div>

                    <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mb-6'>
                        <div className='bg-gray-50 p-4 rounded-md'>
                            <h3 className='text-sm font-medium text-gray-500 uppercase'>Impact Factor</h3>
                            <p className='mt-1 font-medium text-lg'>{journal.impactFactor ? journal.impactFactor.toFixed(2) : 'N/A'}</p>
                        </div>
                        <div className='bg-gray-50 p-4 rounded-md'>
                            <h3 className='text-sm font-medium text-gray-500 uppercase'>Quartile</h3>
                            <p className='mt-1 font-medium'>
                                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${journal.quartile === 'Q1' ? 'bg-green-100 text-green-800' :
                                        journal.quartile === 'Q2' ? 'bg-blue-100 text-blue-800' :
                                            journal.quartile === 'Q3' ? 'bg-yellow-100 text-yellow-800' :
                                                journal.quartile === 'Q4' ? 'bg-red-100 text-red-800' :
                                                    'bg-gray-100 text-gray-800'
                                    }`}>
                                    {journal.quartile || 'N/A'}
                                </span>
                            </p>
                        </div>
                        <div className='bg-gray-50 p-4 rounded-md'>
                            <h3 className='text-sm font-medium text-gray-500 uppercase'>Publisher</h3>
                            <p className='mt-1 font-medium'>{journal.publisher || 'N/A'}</p>
                        </div>
                    </div>

                    <div className='bg-gray-50 p-4 rounded-md mb-6'>
                        <h3 className='text-sm font-medium text-gray-500 uppercase'>Total Papers</h3>
                        <p className='mt-1 font-medium text-lg'>{journal.papersCount}</p>
                    </div>
                </div>
            </div>

            <div className='bg-white shadow-md rounded-lg overflow-hidden'>
                <div className='p-6'>
                    <div className='flex justify-between items-center mb-4'>
                        <h2 className='text-xl font-bold text-gray-800'>Papers</h2>
                        <button
                            onClick={handleViewMorePapers}
                            className='text-blue-600 hover:text-blue-800'
                        >
                            View All
                        </button>
                    </div>

                    {papersLoading ? (
                        <div className='flex justify-center py-8'>
                            <div className='animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600'></div>
                        </div>
                    ) : papers.length === 0 ? (
                        <p className='text-gray-600'>No papers found for this journal.</p>
                    ) : (
                        <>
                            <div className='space-y-4'>
                                {papers.map((paper) => (
                                    <div key={paper.id} className='border-b border-gray-200 pb-4 last:border-b-0 last:pb-0'>
                                        <Link href={`/papers/${paper.id}`} className='text-blue-600 hover:text-blue-800 hover:underline'>
                                            <h3 className='font-medium'>{paper.title}</h3>
                                        </Link>
                                        <div className='text-sm text-gray-500 mt-1 flex flex-wrap gap-x-2'>
                                            <span>{formatAuthors(paper.authors)}</span>
                                            <span>•</span>
                                            <span>{paper.year}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className='mt-6'>
                                <DataPagination
                                    current={currentPage}
                                    total={totalItems}
                                    pageSize={pageSize}
                                    onChange={handlePageChange}
                                    itemName='papers'
                                    loading={papersLoading}
                                />
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}
