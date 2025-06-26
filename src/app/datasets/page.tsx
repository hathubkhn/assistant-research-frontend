'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { fetchApi } from '@/utils/api';
import { getAuthHeaders } from '@/utils/auth';
import { toast } from 'react-hot-toast';
import InterestingDatasetButton from '../../components/InterestingDatasetButton';
import { useTranslation } from '@/utils/useTranslation';

// Helper function to create URL-friendly slugs from names
function createSlug(name: string): string {
    return name
        .toLowerCase()
        .replace(/[^\w\s-]/g, '') // Remove special characters
        .replace(/\s+/g, '-')     // Replace spaces with hyphens
        .replace(/--+/g, '-')     // Replace multiple hyphens with single hyphen
        .trim();                  // Trim whitespace
}

// Utility function to safely parse tasks array
function parseTasksArray(tasks: any): string[] {
    if (!tasks) return [];

    try {
        if (typeof tasks === 'string') {
            return JSON.parse(tasks);
        }
        if (Array.isArray(tasks)) {
            return tasks;
        }
    } catch (e) {
        console.error('Error parsing tasks:', e);
    }

    return [];
}

// Utility function to safely get the benchmark count
function getBenchmarkCount(benchmarks: any): number {
    if (!benchmarks) return 0;

    try {
        // Handle the case where benchmarks is already a number
        if (typeof benchmarks === 'number') {
            return benchmarks;
        }

        // Handle array 
        if (Array.isArray(benchmarks)) {
            return benchmarks.length;
        }

        // Handle string
        if (typeof benchmarks === 'string') {
            // Try to parse as JSON
            try {
                const parsed = JSON.parse(benchmarks);
                if (typeof parsed === 'number') {
                    return parsed;
                }
                return Array.isArray(parsed) ? parsed.length : 0;
            } catch (e) {
                // If parsing fails, try to convert directly to number
                const num = Number(benchmarks);
                if (!isNaN(num)) {
                    return num;
                }
            }
        }
    } catch (e) {
        console.error('Error parsing benchmarks:', e);
    }

    return 0;
}

interface Dataset {
    id: string;
    name: string;
    abbreviation: string;
    description: string;
    downloadUrl: string;
    link?: string;
    paper_link?: string;
    subtitle?: string;
    paperCount: number;
    language: string;
    category: string;
    tasks: string[];
    thumbnailUrl?: string;
    benchmarks: any[];
    dataloaders?: any[];
    similar_datasets?: any[];
    papers?: any[];
    starred?: boolean;
    isInteresting?: boolean;
    associatedConferences?: string[];
}

export default function DatasetsPage() {
    const router = useRouter();
    const [datasets, setDatasets] = useState<Dataset[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [currentView, setCurrentView] = useState<'grid' | 'list'>('list');
    const [activeFilters, setActiveFilters] = useState<{
        categories: string[];
        tasks: string[];
        languages: string[];
    }>({
        categories: [],
        tasks: [],
        languages: []
    });
    const [sortOption, setSortOption] = useState<string>('best-match');

    // Pagination state
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [pageSize, setPageSize] = useState<number>(20);
    const [totalItems, setTotalItems] = useState<number>(0);
    const [totalPages, setTotalPages] = useState<number>(0);

    // State for conferences and journals data
    const [venues, setVenues] = useState<{
        conferences: Array<{ id: string, name: string, abbreviation: string }>;
        journals: Array<{ id: string, name: string, abbreviation: string }>;
    }>({
        conferences: [],
        journals: [],
    });

    const { t } = useTranslation('datasets');

    const fetchDatasets = async (page: number = 1, size: number = pageSize) => {
        try {
            setLoading(true);

            // Build query parameters including filters and pagination
            let queryParams = `page=${page}&pageSize=${size}`;

            // Add filter parameters if active
            if (activeFilters.categories.length > 0) {
                queryParams += `&category=${encodeURIComponent(activeFilters.categories[0])}`;
            }

            if (activeFilters.languages.length > 0) {
                queryParams += `&language=${encodeURIComponent(activeFilters.languages[0])}`;
            }

            // Add task filter if active
            if (activeFilters.tasks.length > 0) {
                queryParams += `&task=${encodeURIComponent(activeFilters.tasks[0])}`;
            }

            // Add search parameter if present
            if (searchQuery) {
                queryParams += `&search=${encodeURIComponent(searchQuery)}`;
            }

            const response = await fetchApi(`datasets/?${queryParams}`);
            if (response.ok) {
                const data = await response.json();

                // Add debugging to examine dataset structure
                if (data.results && data.results.length > 0) {
                    console.log('Sample dataset structure:', data.results[0]);

                    // Ensure benchmarks are properly handled
                    data.results = data.results.map((dataset: Dataset) => {
                        // Add a check for benchmarks
                        if (typeof dataset.benchmarks === 'number' ||
                            dataset.benchmarks === null ||
                            dataset.benchmarks === undefined) {
                            dataset.benchmarks = [];
                        }
                        return dataset;
                    });
                }

                // Check if the user is logged in
                const hasAuthToken = typeof window !== 'undefined' && (
                    localStorage.getItem('authToken') ||
                    sessionStorage.getItem('authToken') ||
                    localStorage.getItem('token') ||
                    sessionStorage.getItem('token')
                );

                // If logged in, fetch interesting datasets to mark the starred ones
                if (hasAuthToken) {
                    try {
                        const interestingResponse = await fetch('/api/datasets/interesting/', {
                            headers: getAuthHeaders(),
                            credentials: 'include'
                        });

                        if (interestingResponse.ok) {
                            const interestingData = await interestingResponse.json();
                            const interestingIds = Array.isArray(interestingData)
                                ? interestingData.map((dataset: any) => dataset.id)
                                : [];

                            // Mark datasets as starred if they are in the interesting list
                            data.results = data.results.map((dataset: Dataset) => ({
                                ...dataset,
                                starred: interestingIds.includes(dataset.id),
                                isInteresting: interestingIds.includes(dataset.id)
                            }));
                        }
                    } catch (error) {
                        console.error('Error fetching interesting datasets:', error);
                    }
                }

                setDatasets(data.results);
                setTotalItems(data.pagination.totalItems);
                setTotalPages(data.pagination.totalPages);
                setCurrentPage(data.pagination.page);
            }
        } catch (error) {
            console.error('Error fetching datasets:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDatasets(1);
    }, []);

    // Handle page change
    const handlePageChange = (newPage: number) => {
        if (newPage < 1 || newPage > totalPages) return;
        setCurrentPage(newPage);
        fetchDatasets(newPage);

        // Scroll to top of page
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // Handle items per page change
    const handleItemsPerPageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newSize = parseInt(e.target.value, 10);
        setPageSize(newSize);
        setCurrentPage(1); // Reset to first page when changing items per page
        fetchDatasets(1, newSize);
    };

    // Monitor network requests to '/images/datasets/' path
    useEffect(() => {
        // Create a Performance Observer to monitor network requests
        if (typeof window !== 'undefined' && window.PerformanceObserver) {
            const observer = new PerformanceObserver((list) => {
                list.getEntries().forEach((entry) => {
                    if (entry.name.includes('/images/datasets/')) {
                        console.log('Image request:', entry.name, 'Duration:', entry.duration);
                    }
                });
            });

            // Observe resource timing entries
            observer.observe({ entryTypes: ['resource'] });

            return () => {
                observer.disconnect();
            };
        }
    }, []);

    const toggleStar = async (id: string, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        // Check if user is logged in by checking for auth token
        const hasAuthToken = typeof window !== 'undefined' && (
            localStorage.getItem('authToken') ||
            sessionStorage.getItem('authToken') ||
            localStorage.getItem('token') ||
            sessionStorage.getItem('token')
        );

        if (!hasAuthToken) {
            toast.error('You must be logged in to mark datasets as interesting');
            return;
        }

        // First update UI optimistically
        setDatasets(prevDatasets => prevDatasets.map(dataset =>
            dataset.id === id ? { ...dataset, starred: !dataset.starred } : dataset
        ));

        // Get the current state of the dataset
        const dataset = datasets.find(d => d.id === id);
        const isCurrentlyStarred = dataset?.starred || false;

        try {
            const headers = getAuthHeaders(true);

            if (isCurrentlyStarred) {
                // If currently starred, unmark it
                const response = await fetch(`/api/datasets/${id}/unmark-interesting/`, {
                    method: 'DELETE',
                    headers,
                    credentials: 'include'
                });

                if (!response.ok) {
                    throw new Error('Failed to unmark dataset as interesting');
                }

                toast.success('Dataset removed from Interesting Datasets');
            } else {
                // If not starred, mark it as interesting
                const response = await fetch(`/api/datasets/mark-interesting/${id}/`, {
                    method: 'POST',
                    headers,
                    credentials: 'include'
                });

                if (!response.ok) {
                    throw new Error('Failed to mark dataset as interesting');
                }

                toast.success('Dataset added to Interesting Datasets');
            }
        } catch (error) {
            console.error('Error toggling dataset interesting status:', error);
            toast.error('Error updating dataset status. Please try again.');

            // Revert the optimistic update if the API call failed
            setDatasets(prevDatasets => prevDatasets.map(dataset =>
                dataset.id === id ? { ...dataset, starred: !dataset.starred } : dataset
            ));
        }
    };

    // Filter datasets based on search query and category filter
    const filteredDatasets = Array.isArray(datasets) ? datasets.filter(dataset => {
        const matchesSearch = searchQuery === '' ||
            dataset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            dataset.abbreviation.toLowerCase().includes(searchQuery.toLowerCase()) ||
            dataset.description.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesFilter = activeFilters.categories.length === 0 ||
            activeFilters.categories.includes(dataset.category);

        const matchesTaskFilter = activeFilters.tasks.length === 0 ||
            (dataset.tasks && parseTasksArray(dataset.tasks).some(task =>
                activeFilters.tasks.includes(task))
            );

        const matchesLanguageFilter = activeFilters.languages.length === 0 ||
            activeFilters.languages.includes(dataset.language);

        return matchesSearch && matchesFilter && matchesTaskFilter && matchesLanguageFilter;
    }) : [];

    // Get unique categories for filter
    const categories = ['Image', '3D', 'Audio', 'Medical', 'Time series', 'Text'];

    // Get unique tasks for task filter
    const allTasks = new Set<string>();
    if (Array.isArray(datasets)) {
        datasets.forEach(dataset => {
            if (dataset.tasks) {
                const tasksArray = parseTasksArray(dataset.tasks);
                tasksArray.forEach(task => allTasks.add(task));
            }
        });
    }
    const tasks = Array.from(allTasks).sort();

    // Get unique languages for language filter
    const languages = Array.isArray(datasets)
        ? [...new Set(datasets.map(dataset => dataset.language).filter(Boolean))].sort()
        : [];

    // Sort datasets based on selected option
    const sortedDatasets = [...filteredDatasets].sort((a, b) => {
        if (sortOption === 'best-match') {
            return b.paperCount - a.paperCount;
        } else if (sortOption === 'name-asc') {
            return a.name.localeCompare(b.name);
        } else if (sortOption === 'name-desc') {
            return b.name.localeCompare(a.name);
        } else if (sortOption === 'papers-desc') {
            return b.paperCount - a.paperCount;
        } else if (sortOption === 'papers-asc') {
            return a.paperCount - b.paperCount;
        }
        return 0;
    });

    // Toggle filter functions
    const toggleCategoryFilter = (category: string) => {
        setActiveFilters(prev => {
            const newCategories = prev.categories.includes(category)
                ? prev.categories.filter(c => c !== category)
                : [...prev.categories, category];
            return { ...prev, categories: newCategories };
        });
        // Reset to page 1 and refetch with current page size
        setCurrentPage(1);
        fetchDatasets(1, pageSize);
    };

    const toggleTaskFilter = (task: string) => {
        setActiveFilters(prev => {
            const newTasks = prev.tasks.includes(task)
                ? prev.tasks.filter(t => t !== task)
                : [...prev.tasks, task];
            return { ...prev, tasks: newTasks };
        });
        // Reset to page 1 and refetch with current page size
        setCurrentPage(1);
        fetchDatasets(1, pageSize);
    };

    const toggleLanguageFilter = (language: string) => {
        setActiveFilters(prev => {
            const newLanguages = prev.languages.includes(language)
                ? prev.languages.filter(l => l !== language)
                : [...prev.languages, language];
            return { ...prev, languages: newLanguages };
        });
        // Reset to page 1 and refetch with current page size
        setCurrentPage(1);
        fetchDatasets(1, pageSize);
    };

    // Clear all filters
    const clearFilters = () => {
        setActiveFilters({
            categories: [],
            tasks: [],
            languages: []
        });
        // Reset to page 1 and refetch with current page size
        setCurrentPage(1);
        fetchDatasets(1, pageSize);
    };

    // Function to get conference or journal ID from venue name
    const getVenueId = (venueName: string, type: 'conference' | 'journal' = 'conference') => {
        if (!venueName) return undefined;

        const venueList = type === 'conference' ? venues.conferences : venues.journals;
        const venue = venueList.find(v =>
            v.name.toLowerCase() === venueName.toLowerCase() ||
            v.abbreviation?.toLowerCase() === venueName.toLowerCase()
        );
        return venue?.id;
    };

    // Function to navigate to conference detail
    const navigateToConference = (id: string | undefined, e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();

        console.log('Navigating to conference with ID:', id);

        if (id) {
            const url = `/conferences/${id}`;
            console.log('Conference navigation URL:', url);
            router.push(url);
        } else {
            console.log('Cannot navigate - conference ID is undefined');
        }
    };

    // Function to navigate to journal detail
    const navigateToJournal = (id: string | undefined, e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();

        console.log('Navigating to journal with ID:', id);

        if (id) {
            router.push(`/journals/${id}`);
        } else {
            console.log('Cannot navigate - journal ID is undefined');
        }
    };

    // Fetch conferences and journals
    const fetchVenues = async () => {
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

            // Prepare headers
            const headers: HeadersInit = {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            };

            // Fetch conferences
            const conferencesResponse = await fetch(`${apiUrl}/api/conferences/filter/`, {
                method: 'GET',
                headers,
                credentials: 'include'
            });

            // Fetch journals
            const journalsResponse = await fetch(`${apiUrl}/api/journals/filter/`, {
                method: 'GET',
                headers,
                credentials: 'include'
            });

            if (conferencesResponse.ok) {
                const conferencesData = await conferencesResponse.json();
                setVenues(prev => ({ ...prev, conferences: conferencesData }));
            }

            if (journalsResponse.ok) {
                const journalsData = await journalsResponse.json();
                setVenues(prev => ({ ...prev, journals: journalsData }));
            }
        } catch (error) {
            console.error('Error fetching venues:', error);
        }
    };

    // Effect to fetch venues on component mount
    useEffect(() => {
        fetchVenues();
    }, []);

    return (
        <div className="container mx-auto px-4 py-8" suppressHydrationWarning={true}>
            <h1 className="text-3xl font-bold text-hust-red mb-6">{t('datasets')}</h1>

            {/* Search and filter section */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-8" suppressHydrationWarning={true}>
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6" suppressHydrationWarning={true}>
                    <div className="w-full md:w-1/2" suppressHydrationWarning={true}>
                        <div className="relative" suppressHydrationWarning={true}>
                            <input
                                type="text"
                                placeholder={t('searchForDatasets')}
                                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600"
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value);
                                    // Debounce the search to prevent too many requests
                                    const timer = setTimeout(() => {
                                        setCurrentPage(1);
                                        fetchDatasets(1, pageSize);
                                    }, 300);
                                    return () => clearTimeout(timer);
                                }}
                            />
                            <button className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </button>
                        </div>
                    </div>
                    <div className="flex items-center space-x-4" suppressHydrationWarning={true}>
                        <div className="flex border border-gray-300 rounded-md" suppressHydrationWarning={true}>
                            <button
                                className={`px-3 py-1 ${currentView === 'list' ? 'bg-blue-600 text-white' : 'bg-gray-100'} rounded-l-md`}
                                onClick={() => setCurrentView('list')}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                </svg>
                            </button>
                            <button
                                className={`px-3 py-1 ${currentView === 'grid' ? 'bg-blue-600 text-white' : 'bg-gray-100'} rounded-r-md`}
                                onClick={() => setCurrentView('grid')}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                                </svg>
                            </button>
                        </div>
                        <select
                            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600"
                            value={sortOption}
                            onChange={(e) => setSortOption(e.target.value)}
                        >
                            <option value="best-match">{t('bestMatch')}</option>
                            <option value="name-asc">{t('nameAsc')}</option>
                            <option value="name-desc">{t('nameDesc')}</option>
                            <option value="papers-desc">{t('papersDesc')}</option>
                            <option value="papers-asc">{t('papersAsc')}</option>
                        </select>
                    </div>
                </div>

                {/* Filter options */}
                <div className="flex flex-col md:flex-row" suppressHydrationWarning={true}>
                    <div className="w-full md:w-1/4 pr-6" suppressHydrationWarning={true}>
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-semibold text-hust-red hover:text-red-700">{t('filters')}</h2>
                            {(activeFilters.categories.length > 0 || activeFilters.tasks.length > 0 || activeFilters.languages.length > 0) && (
                                <button
                                    onClick={clearFilters}
                                    className="text-sm text-blue-600 hover:text-blue-800"
                                >
                                    {t('clearAll')}
                                </button>
                            )}
                        </div>

                        <h3 className="text-lg font-medium text-gray-700 mb-2">{t('filterByModality')}</h3>
                        <div className="space-y-2">
                            {categories.map((category) => (
                                <div key={category} className="flex items-center">
                                    <input
                                        type="checkbox"
                                        id={`category-${category}`}
                                        checked={activeFilters.categories.includes(category)}
                                        onChange={() => toggleCategoryFilter(category)}
                                        className="h-4 w-4 text-hust-red focus:ring-red-500 border-gray-300 rounded"
                                    />
                                    <label htmlFor={`category-${category}`} className="ml-2 text-sm text-gray-700">
                                        {category}
                                        <span className="ml-2 text-gray-500 text-sm">
                                            {Array.isArray(datasets) ? datasets.filter(d => d.category === category).length : 0}
                                        </span>
                                    </label>
                                </div>
                            ))}
                        </div>

                        <h3 className="text-lg font-medium text-gray-700 mb-2 mt-8">{t('filterByTask')}</h3>
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                            {tasks.map((task) => (
                                <div key={task} className="flex items-center">
                                    <input
                                        type="checkbox"
                                        id={`task-${task}`}
                                        checked={activeFilters.tasks.includes(task)}
                                        onChange={() => toggleTaskFilter(task)}
                                        className="h-4 w-4 text-hust-red focus:ring-red-500 border-gray-300 rounded"
                                    />
                                    <label htmlFor={`task-${task}`} className="ml-2 text-sm text-gray-700">
                                        {task}
                                        <span className="ml-2 text-gray-500 text-sm">
                                            {Array.isArray(datasets) ? datasets.filter(d => {
                                                if (!d.tasks) return false;
                                                return parseTasksArray(d.tasks).includes(task);
                                            }).length : 0}
                                        </span>
                                    </label>
                                </div>
                            ))}
                        </div>

                        <h3 className="text-lg font-medium text-gray-700 mb-2 mt-8">{t('filterByLanguage')}</h3>
                        <div className="space-y-2">
                            {languages.map((language) => (
                                <div key={language} className="flex items-center">
                                    <input
                                        type="checkbox"
                                        id={`language-${language}`}
                                        checked={activeFilters.languages.includes(language)}
                                        onChange={() => toggleLanguageFilter(language)}
                                        className="h-4 w-4 text-hust-red focus:ring-red-500 border-gray-300 rounded"
                                    />
                                    <label htmlFor={`language-${language}`} className="ml-2 text-sm text-gray-700">
                                        {language}
                                        <span className="ml-2 text-gray-500 text-sm">
                                            {Array.isArray(datasets) ? datasets.filter(d => d.language === language).length : 0}
                                        </span>
                                    </label>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Datasets list */}
                    <div className="w-full md:w-3/4" suppressHydrationWarning={true}>
                        {loading ? (
                            <div className="flex justify-center items-center h-64" suppressHydrationWarning={true}>
                                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600" suppressHydrationWarning={true}></div>
                            </div>
                        ) : sortedDatasets.length === 0 ? (
                            <div className="bg-gray-100 rounded-lg p-6 text-center">
                                <p className="text-gray-600">{t('noDatasetsFoundMatchingCriteria')}</p>
                            </div>
                        ) : currentView === 'list' ? (
                            <div className="space-y-6">
                                {sortedDatasets.map((dataset) => (
                                    <div key={dataset.id} className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
                                        <div className="flex flex-col md:flex-row">
                                            <div className="md:w-1/4 flex-shrink-0 bg-gray-100 flex items-center justify-center p-4">
                                                <Link href={`/datasets/${dataset.id}`} className="w-full h-24 bg-gray-200 rounded-lg flex items-center justify-center">
                                                    {dataset.abbreviation && (
                                                        <img
                                                            src={`/images/datasets/${dataset.abbreviation.toLowerCase().replace(/-/g, '')}.png`}
                                                            alt={dataset.abbreviation}
                                                            className="max-w-full max-h-full object-contain"
                                                            onError={(e) => {
                                                                const target = e.target as HTMLImageElement;
                                                                // Set onerror to null to prevent infinite loop
                                                                target.onerror = null;
                                                                // Display fallback text instead of trying other formats
                                                                target.style.display = 'none';
                                                                const parent = target.parentElement;
                                                                if (parent) {
                                                                    parent.innerHTML = `<div class="text-2xl font-bold text-gray-400">${dataset.abbreviation}</div>`;
                                                                }
                                                            }}
                                                        />
                                                    )}
                                                </Link>
                                            </div>
                                            <div className="md:w-3/4 p-4">
                                                <div className="flex justify-between">
                                                    <Link href={`/datasets/${dataset.id}`} className="block">
                                                        <h2 className="text-xl font-semibold text-hust-red hover:text-red-700">{dataset.name}</h2>
                                                        <p className="text-gray-500">{dataset.abbreviation}</p>
                                                    </Link>
                                                    <InterestingDatasetButton
                                                        datasetId={dataset.id}
                                                        initialState={dataset.starred || false}
                                                        className="p-2 rounded-full focus:outline-none transition-colors"
                                                        onToggle={(isInteresting) => {
                                                            setDatasets(prevDatasets => prevDatasets.map(d =>
                                                                d.id === dataset.id ? { ...d, starred: isInteresting } : d
                                                            ));
                                                        }}
                                                    />
                                                </div>
                                                <div className="flex flex-col md:flex-row justify-between mb-2">
                                                    <div>
                                                        <h3 className="text-sm text-gray-500 mt-2 md:mt-0">
                                                            {dataset.paperCount} papers • {getBenchmarkCount(dataset.benchmarks)} benchmarks
                                                        </h3>
                                                    </div>
                                                    <div className="text-sm text-gray-500 mt-2 md:mt-0">
                                                        {dataset.language}
                                                    </div>
                                                </div>
                                                <p className="text-gray-700 mb-4">{dataset.description}</p>
                                                <div className="mb-3">
                                                    <span className="text-sm font-medium text-gray-600">{t('tasks')}: </span>
                                                    <div className="flex flex-wrap gap-1 mt-1">
                                                        {parseTasksArray(dataset.tasks).map((task, index) => (
                                                            <span key={index} className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
                                                                {task}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                                <a
                                                    href={dataset.downloadUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-hust-red hover:text-red-800 font-medium inline-flex items-center"
                                                >
                                                    {t('download')}
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                                    </svg>
                                                </a>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {sortedDatasets.map((dataset) => (
                                    <div key={dataset.id} className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden flex flex-col h-full">
                                        <div className="h-32 bg-gray-100 flex items-center justify-center">
                                            {dataset.abbreviation && (
                                                <img
                                                    src={`/images/datasets/${dataset.abbreviation.toLowerCase().replace(/-/g, '')}.png`}
                                                    alt={dataset.abbreviation}
                                                    className="max-w-full max-h-full object-contain"
                                                    onError={(e) => {
                                                        const target = e.target as HTMLImageElement;
                                                        // Set onerror to null to prevent infinite loop
                                                        target.onerror = null;
                                                        // Display fallback text
                                                        target.style.display = 'none';
                                                        const parent = target.parentElement;
                                                        if (parent) {
                                                            parent.innerHTML = `<div class="text-2xl font-bold text-gray-400">${dataset.abbreviation}</div>`;
                                                        }
                                                    }}
                                                />
                                            )}
                                        </div>
                                        <div className="p-4 flex-grow">
                                            <div className="flex justify-between items-start">
                                                <Link href={`/datasets/${dataset.id}`} className="block">
                                                    <h2 className="text-lg font-semibold text-hust-red hover:text-red-700">{dataset.name}</h2>
                                                    <p className="text-sm text-gray-500">{dataset.abbreviation}</p>
                                                </Link>
                                                <InterestingDatasetButton
                                                    datasetId={dataset.id}
                                                    initialState={dataset.starred || false}
                                                    className="p-1 rounded-full focus:outline-none transition-colors"
                                                    onToggle={(isInteresting) => {
                                                        setDatasets(prevDatasets => prevDatasets.map(d =>
                                                            d.id === dataset.id ? { ...d, starred: isInteresting } : d
                                                        ));
                                                    }}
                                                />
                                            </div>
                                            <p className="text-gray-700 text-sm mt-3 line-clamp-2">{dataset.description}</p>
                                            <div className="mt-3 flex items-center text-xs text-gray-500">
                                                <span>{t('papers')}: {dataset.paperCount}</span>
                                                <span className="mx-2">•</span>
                                                <span>{t('benchmarks')}: {getBenchmarkCount(dataset.benchmarks)}</span>
                                                <span className="mx-2">•</span>
                                                <span>{t('language')}: {dataset.language}</span>
                                            </div>
                                            <div className="mt-3">
                                                {(() => {
                                                    const tasksArray = parseTasksArray(dataset.tasks);
                                                    return (
                                                        <div className="flex flex-wrap gap-1 mt-1">
                                                            {tasksArray.slice(0, 3).map((task, index) => (
                                                                <span key={index} className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
                                                                    {task}
                                                                </span>
                                                            ))}
                                                            {tasksArray.length > 3 && (
                                                                <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
                                                                    +{tasksArray.length - 3}
                                                                </span>
                                                            )}
                                                        </div>
                                                    );
                                                })()}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Add pagination at the bottom */}
            {!loading && (
                <div className="flex justify-center items-center mt-8 space-x-4">
                    <div className="flex items-center space-x-1">
                        <button
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                            className={`px-4 py-2 rounded-md ${currentPage === 1 ? 'text-gray-400 cursor-not-allowed' : 'text-hust-red hover:bg-red-100'}`}
                        >
                            {t('previous')}
                        </button>

                        {Array.from({ length: Math.max(1, Math.min(5, totalPages)) }, (_, i) => {
                            // Show pages around current page
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

                            // Ensure we don't show page numbers beyond totalPages
                            if (pageNum <= totalPages || totalPages === 0) {
                                return (
                                    <button
                                        key={pageNum}
                                        onClick={() => handlePageChange(pageNum)}
                                        className={`px-4 py-2 rounded-md ${currentPage === pageNum ? 'bg-hust-red text-white' : 'text-hust-red hover:bg-red-100'}`}
                                    >
                                        {pageNum}
                                    </button>
                                );
                            }
                            return null;
                        })}

                        <button
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage === totalPages || totalPages === 0}
                            className={`px-4 py-2 rounded-md ${currentPage === totalPages ? 'text-gray-400 cursor-not-allowed' : 'text-hust-red hover:bg-red-100'}`}
                        >
                            {t('next')}
                        </button>
                    </div>

                    {/* Items per page selector - now inline with pagination */}
                    {!loading && sortedDatasets.length > 0 && (
                        <div className="flex items-center text-sm text-gray-600">
                            <span className="mr-2">{t('itemsPerPage')}:</span>
                            <select
                                value={pageSize}
                                onChange={handleItemsPerPageChange}
                                className="border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="5">5</option>
                                <option value="10">10</option>
                                <option value="20">20</option>
                                <option value="50">50</option>
                            </select>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
} 