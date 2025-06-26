'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Conference {
    id: string;
    name: string;
    abbreviation: string;
    rank: string;
    location: string;
    url: string;
    papersCount: number;
}

export default function ConferencesPage() {
    const [conferences, setConferences] = useState<Conference[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    // Pagination state
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [pageSize, setPageSize] = useState<number>(20);
    const [totalItems, setTotalItems] = useState<number>(0);
    const [totalPages, setTotalPages] = useState<number>(0);

    // Filter state
    const [rankFilter, setRankFilter] = useState<string>('');

    const fetchConferences = async (page: number = 1, size: number = pageSize) => {
        try {
            setLoading(true);
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

            // Build query parameters including filters and pagination
            let queryParams = `page=${page}&pageSize=${size}`;

            // Add filter parameters if active
            if (rankFilter) {
                // Send the actual rank value as stored in the database
                // For "Not ranked", we send null or empty as the rank value
                if (rankFilter === 'Not ranked') {
                    queryParams += '&rank=null';
                } else {
                    queryParams += `&rank=${encodeURIComponent(rankFilter)}`;
                }
            }

            // Add search parameter if present
            if (searchQuery) {
                queryParams += `&search=${encodeURIComponent(searchQuery)}`;
            }

            const response = await fetch(`${apiUrl}/api/conferences/?${queryParams}`);
            if (response.ok) {
                const data = await response.json();
                setConferences(data.results);
                setTotalItems(data.pagination.totalItems);
                setTotalPages(data.pagination.totalPages);
                setCurrentPage(data.pagination.page);
            }
        } catch (error) {
            console.error('Error fetching conferences:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchConferences(1);
    }, [rankFilter, searchQuery]);

    // Handle page change
    const handlePageChange = (newPage: number) => {
        if (newPage < 1 || newPage > totalPages) return;
        setCurrentPage(newPage);
        fetchConferences(newPage);

        // Scroll to top of page
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // Handle items per page change
    const handleItemsPerPageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newSize = parseInt(e.target.value, 10);
        setPageSize(newSize);
        setCurrentPage(1); // Reset to first page when changing items per page
        fetchConferences(1, newSize);
    };

    // Handle search input
    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchQuery(e.target.value);
    };

    // Handle search submission
    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setCurrentPage(1);
        fetchConferences(1);
    };

    // Handle rank filter change
    const handleRankFilterChange = (rank: string) => {
        setRankFilter(prev => prev === rank ? '' : rank);
        setCurrentPage(1);
        fetchConferences(1, pageSize);
    };

    // Clear all filters
    const clearFilters = () => {
        setRankFilter('');
        setSearchQuery('');
        setCurrentPage(1);
        fetchConferences(1, pageSize);
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold text-hust-red mb-6">Academic Conferences</h1>

            {/* Search and filter bar */}
            <div className="bg-white shadow-md rounded-lg p-4 mb-6">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-grow">
                        <form onSubmit={handleSearch} className="flex">
                            <input
                                type="text"
                                placeholder="Search conferences..."
                                className="w-full px-4 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                value={searchQuery}
                                onChange={handleSearchChange}
                            />
                            <button
                                type="submit"
                                className="bg-blue-600 text-white px-4 py-2 rounded-r-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                Search
                            </button>
                        </form>
                    </div>
                </div>

                <div className="mt-4">
                    <h3 className="font-medium text-gray-700 mb-2">Filter by Rank:</h3>
                    <div className="flex flex-wrap gap-2">
                        {['A*', 'A', 'B', 'C', 'Not ranked'].map(rank => (
                            <button
                                key={rank}
                                onClick={() => handleRankFilterChange(rank)}
                                className={`px-3 py-1 rounded-full border ${rankFilter === rank
                                    ? 'bg-blue-600 text-white border-blue-600'
                                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
                                    }`}
                            >
                                {rank}
                            </button>
                        ))}
                        {rankFilter && (
                            <button
                                onClick={clearFilters}
                                className="px-3 py-1 rounded-full border border-gray-300 text-gray-700 hover:bg-gray-100"
                            >
                                Clear Filters
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Conferences list */}
            {loading ? (
                <div className="flex justify-center items-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
                </div>
            ) : conferences.length === 0 ? (
                <div className="bg-white shadow-md rounded-lg p-6 text-center">
                    <p className="text-lg text-gray-600">No conferences found matching your criteria.</p>
                    <button
                        onClick={clearFilters}
                        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        Clear Filters
                    </button>
                </div>
            ) : (
                <div className="bg-white shadow-md rounded-lg overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Conference
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Abbreviation
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Rank
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Location
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Papers
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {conferences.map((conference) => (
                                    <tr key={conference.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <Link href={`/conferences/${conference.id}`} className="text-hust-red hover:text-red-800 hover:underline">
                                                {conference.name}
                                            </Link>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                            {conference.abbreviation}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${conference.rank === 'A*' ? 'bg-purple-100 text-purple-800' :
                                                conference.rank === 'A' ? 'bg-green-100 text-green-800' :
                                                    conference.rank === 'B' ? 'bg-red-100 text-red-800' :
                                                        conference.rank === 'C' ? 'bg-yellow-100 text-yellow-800' :
                                                            'bg-gray-100 text-gray-800'
                                                }`}>
                                                {conference.rank || 'N/A'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                            {conference.location || 'N/A'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                            {conference.papersCount}
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
                <div className="flex flex-col md:flex-row justify-between items-center mt-6">
                    <nav className="flex items-center space-x-2">
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
                            let pageNum;
                            if (totalPages <= 5) {
                                pageNum = i + 1;
                            } else if (currentPage <= 3) {
                                pageNum = i + 1;
                            } else if (currentPage >= totalPages - 2) {
                                pageNum = totalPages - 4 + i;
                            } else {
                                pageNum = currentPage - 2 + i;
                            }

                            return (
                                <button
                                    key={pageNum}
                                    onClick={() => handlePageChange(pageNum)}
                                    className={`px-3 py-1 rounded-md ${currentPage === pageNum
                                        ? 'bg-hust-red text-white'
                                        : 'bg-white text-hust-red hover:bg-red-50 border border-gray-300'
                                        }`}
                                >
                                    {pageNum}
                                </button>
                            );
                        })}

                        <button
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            className={`px-3 py-1 rounded-md ${currentPage === totalPages
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                : 'bg-white text-hust-red hover:bg-red-50 border border-gray-300'
                                }`}
                        >
                            Next
                        </button>
                    </nav>

                    {/* Items per page selector - moved to bottom of page */}
                    <div className="flex items-center mt-4 md:mt-0">
                        <label className="mr-2 text-gray-700">Items per page:</label>
                        <select
                            value={pageSize}
                            onChange={handleItemsPerPageChange}
                            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="10">10</option>
                            <option value="20">20</option>
                            <option value="50">50</option>
                            <option value="100">100</option>
                        </select>
                    </div>
                </div>
            )}
        </div>
    );
} 