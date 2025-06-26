'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTranslation } from '../../utils/useTranslation';

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
    const { t } = useTranslation('journals');
    const [journals, setJournals] = useState<Journal[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    // Pagination state
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [pageSize, setPageSize] = useState<number>(20);
    const [totalItems, setTotalItems] = useState<number>(0);
    const [totalPages, setTotalPages] = useState<number>(0);

    // Filter state
    const [quartileFilter, setQuartileFilter] = useState<string>('');
    const [impactFilter, setImpactFilter] = useState<string>('');

    // Define impact factor ranges
    const impactRanges: ImpactRange[] = [
        { min: 0, max: 3, label: '0~3' },
        { min: 3, max: 5, label: '3~5' },
        { min: 5, max: 7, label: '5~7' },
        { min: 7, max: null, label: '7+' }
    ];

    const fetchJournals = async (page: number = 1, size: number = pageSize, quartileValue: string = quartileFilter, impactValue: string = impactFilter, searchValue: string = searchQuery) => {
        try {
            setLoading(true);
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

            // Build query parameters including filters and pagination
            let queryParams = `page=${page}&pageSize=${size}`;

            // Add filter parameters if active
            if (quartileValue) {
                queryParams += `&quartile=${encodeURIComponent(quartileValue)}`;
            }

            // Add impact factor filter if active
            if (impactValue) {
                const selectedRange = impactRanges.find(range => range.label === impactValue);
                if (selectedRange) {
                    queryParams += `&impactMin=${selectedRange.min}`;
                    if (selectedRange.max !== null) {
                        queryParams += `&impactMax=${selectedRange.max}`;
                    }
                }
            }

            // Add search parameter if present
            if (searchValue) {
                queryParams += `&search=${encodeURIComponent(searchValue)}`;
            }

            const response = await fetch(`${apiUrl}/api/journals/?${queryParams}`);
            if (response.ok) {
                const data = await response.json();
                setJournals(data.results);
                setTotalItems(data.pagination.totalItems);
                setTotalPages(data.pagination.totalPages);
                setCurrentPage(data.pagination.page);
            }
        } catch (error) {
            console.error('Error fetching journals:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // Only fetch on initial load - filtering is handled by individual handlers
        fetchJournals(1, pageSize, quartileFilter, impactFilter, searchQuery);
    }, []);  // Empty dependency array means this only runs once on mount

    // Handle page change
    const handlePageChange = (newPage: number) => {
        if (newPage < 1 || newPage > totalPages) return;
        setCurrentPage(newPage);
        fetchJournals(newPage, pageSize, quartileFilter, impactFilter, searchQuery);

        // Scroll to top of page
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // Handle items per page change
    const handleItemsPerPageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newSize = parseInt(e.target.value, 10);
        setPageSize(newSize);
        setCurrentPage(1); // Reset to first page when changing items per page
        fetchJournals(1, newSize, quartileFilter, impactFilter, searchQuery);
    };

    // Handle search input
    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchQuery(e.target.value);
    };

    // Handle search submission
    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setCurrentPage(1);
        fetchJournals(1, pageSize, quartileFilter, impactFilter, searchQuery);
    };

    // Handle quartile filter change
    const handleQuartileFilterChange = (quartile: string) => {
        // Toggle quartile filter - if same quartile is clicked, remove filter
        const newQuartileValue = quartileFilter === quartile ? '' : quartile;
        setQuartileFilter(newQuartileValue);
        setCurrentPage(1);
        // Pass the new quartile value directly to fetchJournals
        fetchJournals(1, pageSize, newQuartileValue, impactFilter, searchQuery);
    };

    // Handle impact factor filter change
    const handleImpactFilterChange = (impact: string) => {
        const newImpactValue = impactFilter === impact ? '' : impact;
        setImpactFilter(newImpactValue);
        setCurrentPage(1);
        // Pass the new impact value directly to fetchJournals
        fetchJournals(1, pageSize, quartileFilter, newImpactValue, searchQuery);
    };

    // Clear all filters
    const clearFilters = () => {
        setQuartileFilter('');
        setImpactFilter('');
        setSearchQuery('');
        setCurrentPage(1);
        fetchJournals(1, pageSize, '', '', '');
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold text-hust-red mb-6">{t('title')}</h1>

            {/* Search and filter bar */}
            <div className="bg-white shadow-md rounded-lg p-4 mb-6">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-grow">
                        <form onSubmit={handleSearch} className="flex">
                            <input
                                type="text"
                                placeholder={t('search.placeholder')}
                                className="w-full px-4 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                value={searchQuery}
                                onChange={handleSearchChange}
                            />
                            <button
                                type="submit"
                                className="bg-blue-600 text-white px-4 py-2 rounded-r-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                {t('search.button')}
                            </button>
                        </form>
                    </div>
                </div>

                <div className="mt-4">
                    <h3 className="font-medium text-gray-700 mb-2">{t('filters.quartile.title')}:</h3>
                    <div className="flex flex-wrap gap-2">
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

                <div className="mt-4">
                    <h3 className="font-medium text-gray-700 mb-2">{t('filters.impact.title')}:</h3>
                    <div className="flex flex-wrap gap-2">
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
                                className="px-3 py-1 rounded-full border border-gray-300 text-gray-700 hover:bg-gray-100"
                            >
                                {t('filters.clearFilters')}
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Journals list */}
            {loading ? (
                <div className="flex justify-center items-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
                </div>
            ) : journals.length === 0 ? (
                <div className="bg-white shadow-md rounded-lg p-6 text-center">
                    <p className="text-lg text-gray-600">{t('noResults')}</p>
                    <button
                        onClick={clearFilters}
                        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        {t('filters.clearFilters')}
                    </button>
                </div>
            ) : (
                <div className="bg-white shadow-md rounded-lg overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        {t('table.journal')}
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        {t('table.abbreviation')}
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        {t('table.impactFactor')}
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        {t('table.quartile')}
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        {t('table.publisher')}
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        {t('table.papers')}
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {journals.map((journal) => (
                                    <tr key={journal.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {journal.name}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {journal.abbreviation}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {journal.impactFactor.toFixed(2)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${journal.quartile === 'Q1' ? 'bg-green-100 text-green-800' :
                                                    journal.quartile === 'Q2' ? 'bg-blue-100 text-blue-800' :
                                                        journal.quartile === 'Q3' ? 'bg-yellow-100 text-yellow-800' :
                                                            'bg-red-100 text-red-800'
                                                }`}>
                                                {journal.quartile}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {journal.publisher}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {journal.papersCount}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            {journal.url && (
                                                <Link
                                                    href={journal.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-blue-600 hover:text-blue-900"
                                                >
                                                    {t('visitJournal')}
                                                </Link>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                        <div className="flex-1 flex justify-between sm:hidden">
                            <button
                                onClick={() => handlePageChange(currentPage - 1)}
                                disabled={currentPage === 1}
                                className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${currentPage === 1
                                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                        : 'bg-white text-gray-700 hover:bg-gray-50'
                                    }`}
                            >
                                {t('pagination.previous')}
                            </button>
                            <button
                                onClick={() => handlePageChange(currentPage + 1)}
                                disabled={currentPage === totalPages}
                                className={`ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${currentPage === totalPages
                                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                        : 'bg-white text-gray-700 hover:bg-gray-50'
                                    }`}
                            >
                                {t('pagination.next')}
                            </button>
                        </div>
                        <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                            <div>
                                <p className="text-sm text-gray-700">
                                    {t('pagination.show')}
                                    <select
                                        value={pageSize}
                                        onChange={handleItemsPerPageChange}
                                        className="mx-1 border-gray-300 rounded-md"
                                    >
                                        <option value="10">10</option>
                                        <option value="20">20</option>
                                        <option value="50">50</option>
                                        <option value="100">100</option>
                                    </select>
                                    {t('pagination.perPage')}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-700">
                                    {t('pagination.page')} <span className="font-medium">{currentPage}</span> {t('pagination.of')}{' '}
                                    <span className="font-medium">{totalPages}</span> ({totalItems} {t('pagination.results')})
                                </p>
                            </div>
                            <div>
                                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                                    <button
                                        onClick={() => handlePageChange(1)}
                                        disabled={currentPage === 1}
                                        className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${currentPage === 1
                                                ? 'text-gray-300 cursor-not-allowed'
                                                : 'text-gray-500 hover:bg-gray-50'
                                            }`}
                                    >
                                        <span className="sr-only">{t('pagination.first')}</span>
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M15.707 15.707a1 1 0 01-1.414 0l-5-5a1 1 0 010-1.414l5-5a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 010 1.414zm-6 0a1 1 0 01-1.414 0l-5-5a1 1 0 010-1.414l5-5a1 1 0 011.414 1.414L5.414 10l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                                        </svg>
                                    </button>
                                    <button
                                        onClick={() => handlePageChange(currentPage - 1)}
                                        disabled={currentPage === 1}
                                        className={`relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium ${currentPage === 1
                                                ? 'text-gray-300 cursor-not-allowed'
                                                : 'text-gray-500 hover:bg-gray-50'
                                            }`}
                                    >
                                        <span className="sr-only">{t('pagination.previous')}</span>
                                        <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                            <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                    </button>

                                    {/* Page numbers */}
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
                                            pageNum > 0 && pageNum <= totalPages && (
                                                <button
                                                    key={pageNum}
                                                    onClick={() => handlePageChange(pageNum)}
                                                    className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${currentPage === pageNum
                                                            ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                                                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                                                        }`}
                                                >
                                                    {pageNum}
                                                </button>
                                            )
                                        );
                                    })}

                                    <button
                                        onClick={() => handlePageChange(currentPage + 1)}
                                        disabled={currentPage === totalPages}
                                        className={`relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium ${currentPage === totalPages
                                                ? 'text-gray-300 cursor-not-allowed'
                                                : 'text-gray-500 hover:bg-gray-50'
                                            }`}
                                    >
                                        <span className="sr-only">{t('pagination.next')}</span>
                                        <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                        </svg>
                                    </button>
                                    <button
                                        onClick={() => handlePageChange(totalPages)}
                                        disabled={currentPage === totalPages}
                                        className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${currentPage === totalPages
                                                ? 'text-gray-300 cursor-not-allowed'
                                                : 'text-gray-500 hover:bg-gray-50'
                                            }`}
                                    >
                                        <span className="sr-only">{t('pagination.last')}</span>
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M4.293 15.707a1 1 0 001.414 0l5-5a1 1 0 000-1.414l-5-5a1 1 0 00-1.414 1.414L8.586 10 4.293 14.293a1 1 0 000 1.414zm6 0a1 1 0 001.414 0l5-5a1 1 0 000-1.414l-5-5a1 1 0 00-1.414 1.414L14.586 10l-4.293 4.293a1 1 0 000 1.414z" clipRule="evenodd" />
                                        </svg>
                                    </button>
                                </nav>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
} 