'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Journal {
    id: string;
    name: string;
    abbreviation: string;
    impactFactor: number;
    quartile: string;
    publisher: string;
    url: string;
    papersCount: number;
}

// Impact factor range type
interface ImpactRange {
    min: number;
    max: number | null;
    label: string;
}

export default function JournalsPage() {
    const [journals, setJournals] = useState<Journal[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')

    // Pagination state
    const [currentPage, setCurrentPage] = useState<number>(1)
    const [pageSize, setPageSize] = useState<number>(20)
    const [totalItems, setTotalItems] = useState<number>(0)
    const [totalPages, setTotalPages] = useState<number>(0)

    // Filter state
    const [quartileFilter, setQuartileFilter] = useState<string>('')
    const [impactFilter, setImpactFilter] = useState<string>('')

    // Define impact factor ranges
    const impactRanges: ImpactRange[] = [
        { min: 0, max: 3, label: '0~3' },
        { min: 3, max: 5, label: '3~5' },
        { min: 5, max: 7, label: '5~7' },
        { min: 7, max: null, label: '7+' },
    ]

    const fetchJournals = async (page: number = 1, size: number = pageSize, quartileValue: string = quartileFilter, impactValue: string = impactFilter, searchValue: string = searchQuery) => {
        try {
            setLoading(true)
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

            // Build query parameters including filters and pagination
            let queryParams = `page=${page}&pageSize=${size}`

            // Add filter parameters if active
            if (quartileValue) {
                queryParams += `&quartile=${encodeURIComponent(quartileValue)}`
            }

            // Add impact factor filter if active
            if (impactValue) {
                const selectedRange = impactRanges.find(range => range.label === impactValue)
                if (selectedRange) {
                    queryParams += `&impactMin=${selectedRange.min}`
                    if (selectedRange.max !== null) {
                        queryParams += `&impactMax=${selectedRange.max}`
                    }
                }
            }

            // Add search parameter if present
            if (searchValue) {
                queryParams += `&search=${encodeURIComponent(searchValue)}`
            }

            const response = await fetch(`${apiUrl}/api/journals/?${queryParams}`)
            if (response.ok) {
                const data = await response.json()
                setJournals(data.results)
                setTotalItems(data.pagination.totalItems)
                setTotalPages(data.pagination.totalPages)
                setCurrentPage(data.pagination.page)
            }
        } catch (error) {
            console.error('Error fetching journals:', error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        // Only fetch on initial load - filtering is handled by individual handlers
        fetchJournals(1, pageSize, quartileFilter, impactFilter, searchQuery)
    }, [])  // Empty dependency array means this only runs once on mount

    // Handle page change
    const handlePageChange = (newPage: number) => {
        if (newPage < 1 || newPage > totalPages) return
        setCurrentPage(newPage)
        fetchJournals(newPage, pageSize, quartileFilter, impactFilter, searchQuery)

        // Scroll to top of page
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    // Handle items per page change
    const handleItemsPerPageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newSize = parseInt(e.target.value, 10)
        setPageSize(newSize)
        setCurrentPage(1) // Reset to first page when changing items per page
        fetchJournals(1, newSize, quartileFilter, impactFilter, searchQuery)
    }

    // Handle search input
    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchQuery(e.target.value)
    }

    // Handle search submission
    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault()
        setCurrentPage(1)
        fetchJournals(1, pageSize, quartileFilter, impactFilter, searchQuery)
    }

    // Handle quartile filter change
    const handleQuartileFilterChange = (quartile: string) => {
        // Toggle quartile filter - if same quartile is clicked, remove filter
        const newQuartileValue = quartileFilter === quartile ? '' : quartile
        setQuartileFilter(newQuartileValue)
        setCurrentPage(1)
        // Pass the new quartile value directly to fetchJournals
        fetchJournals(1, pageSize, newQuartileValue, impactFilter, searchQuery)
    }

    // Handle impact factor filter change
    const handleImpactFilterChange = (impact: string) => {
        const newImpactValue = impactFilter === impact ? '' : impact
        setImpactFilter(newImpactValue)
        setCurrentPage(1)
        // Pass the new impact value directly to fetchJournals
        fetchJournals(1, pageSize, quartileFilter, newImpactValue, searchQuery)
    }

    // Clear all filters
    const clearFilters = () => {
        setQuartileFilter('')
        setImpactFilter('')
        setSearchQuery('')
        setCurrentPage(1)
        fetchJournals(1, pageSize, '', '', '')
    }

    return (
        <div className='container mx-auto px-4 py-8'>
            <h1 className='text-3xl font-bold text-blue-900 mb-6'>Academic Journals</h1>

            {/* Search and filter bar */}
            <div className='bg-white shadow-md rounded-lg p-4 mb-6'>
                <div className='flex flex-col md:flex-row gap-4'>
                    <div className='flex-grow'>
                        <form onSubmit={handleSearch} className='flex'>
                            <input
                                type='text'
                                placeholder='Search journals...'
                                className='w-full px-4 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                                value={searchQuery}
                                onChange={handleSearchChange}
                            />
                            <button
                                type='submit'
                                className='bg-blue-600 text-white px-4 py-2 rounded-r-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500'
                            >
                                Search
                            </button>
                        </form>
                    </div>
                </div>

                <div className='mt-4'>
                    <h3 className='font-medium text-gray-700 mb-2'>Filter by Quartile:</h3>
                    <div className='flex flex-wrap gap-2'>
                        {['Q1', 'Q2', 'Q3', 'Q4'].map(quartile => (
                            <button
                                key={quartile}
                                onClick={() => handleQuartileFilterChange(quartile)}
                                className={`px-3 py-1 rounded-full border ${quartileFilter === quartile
                                    ? 'bg-blue-600 text-white border-blue-600'
                                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
                                    }`}
                            >
                                {quartile}
                            </button>
                        ))}
                    </div>
                </div>

                <div className='mt-4'>
                    <h3 className='font-medium text-gray-700 mb-2'>Filter by Impact:</h3>
                    <div className='flex flex-wrap gap-2'>
                        {impactRanges.map(range => (
                            <button
                                key={range.label}
                                onClick={() => handleImpactFilterChange(range.label)}
                                className={`px-3 py-1 rounded-full border ${impactFilter === range.label
                                    ? 'bg-blue-600 text-white border-blue-600'
                                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
                                    }`}
                            >
                                {range.label}
                            </button>
                        ))}
                        {(quartileFilter || impactFilter) && (
                            <button
                                onClick={clearFilters}
                                className='px-3 py-1 rounded-full border border-gray-300 text-gray-700 hover:bg-gray-100'
                            >
                                Clear Filters
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Journals list */}
            {loading ? (
                <div className='flex justify-center items-center py-12'>
                    <div className='animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600'></div>
                </div>
            ) : journals.length === 0 ? (
                <div className='bg-white shadow-md rounded-lg p-6 text-center'>
                    <p className='text-lg text-gray-600'>No journals found matching your criteria.</p>
                    <button
                        onClick={clearFilters}
                        className='mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500'
                    >
                        Clear Filters
                    </button>
                </div>
            ) : (
                <div className='bg-white shadow-md rounded-lg overflow-hidden'>
                    <div className='overflow-x-auto'>
                        <table className='min-w-full divide-y divide-gray-200'>
                            <thead className='bg-gray-50'>
                                <tr>
                                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                                        Journal
                                    </th>
                                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                                        Abbreviation
                                    </th>
                                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                                        Impact Factor
                                    </th>
                                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                                        Quartile
                                    </th>
                                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                                        Papers
                                    </th>
                                </tr>
                            </thead>
                            <tbody className='bg-white divide-y divide-gray-200'>
                                {journals.map((journal) => (
                                    <tr key={journal.id} className='hover:bg-gray-50'>
                                        <td className='px-6 py-4 whitespace-nowrap'>
                                            <Link href={`/journals/${journal.id}`} className='text-blue-600 hover:text-blue-800 hover:underline'>
                                                {journal.name}
                                            </Link>
                                        </td>
                                        <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-700'>
                                            {journal.abbreviation}
                                        </td>
                                        <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-700'>
                                            {journal.impactFactor ? journal.impactFactor.toFixed(2) : 'N/A'}
                                        </td>
                                        <td className='px-6 py-4 whitespace-nowrap'>
                                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${journal.quartile === 'Q1' ? 'bg-green-100 text-green-800' :
                                                journal.quartile === 'Q2' ? 'bg-blue-100 text-blue-800' :
                                                    journal.quartile === 'Q3' ? 'bg-yellow-100 text-yellow-800' :
                                                        journal.quartile === 'Q4' ? 'bg-red-100 text-red-800' :
                                                            'bg-gray-100 text-gray-800'
                                                }`}>
                                                {journal.quartile || 'N/A'}
                                            </span>
                                        </td>
                                        <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-700'>
                                            {journal.papersCount}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
                <div className='flex justify-between items-center mt-6'>
                    <div className='flex items-center'>
                        <label className='mr-2 text-gray-700'>Items per page:</label>
                        <select
                            value={pageSize}
                            onChange={handleItemsPerPageChange}
                            className='px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                        >
                            <option value='10'>10</option>
                            <option value='20'>20</option>
                            <option value='50'>50</option>
                            <option value='100'>100</option>
                        </select>
                    </div>
                    <nav className='flex items-center space-x-2'>
                        <button
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                            className={`px-3 py-1 rounded-md ${currentPage === 1
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                : 'bg-white text-blue-600 hover:bg-blue-50 border border-gray-300'
                                }`}
                        >
                            Previous
                        </button>

                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                            let pageNum
                            if (totalPages <= 5) {
                                pageNum = i + 1
                            } else if (currentPage <= 3) {
                                pageNum = i + 1
                            } else if (currentPage >= totalPages - 2) {
                                pageNum = totalPages - 4 + i
                            } else {
                                pageNum = currentPage - 2 + i
                            }

                            return (
                                <button
                                    key={pageNum}
                                    onClick={() => handlePageChange(pageNum)}
                                    className={`px-3 py-1 rounded-md ${currentPage === pageNum
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-white text-blue-600 hover:bg-blue-50 border border-gray-300'
                                        }`}
                                >
                                    {pageNum}
                                </button>
                            )
                        })}

                        <button
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            className={`px-3 py-1 rounded-md ${currentPage === totalPages
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                : 'bg-white text-blue-600 hover:bg-blue-50 border border-gray-300'
                                }`}
                        >
                            Next
                        </button>
                    </nav>
                </div>
            )}
        </div>
    )
}
