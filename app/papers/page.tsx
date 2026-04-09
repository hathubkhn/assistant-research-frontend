'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

// Sample paper data structure
interface Paper {
    id: string;
    title: string;
    authors: string[];
    venue: string;
    venueType: 'conference' | 'journal'; // Added to distinguish between conferences and journals
    year: number;
    field: string;
    keywords: string[];
    abstract: string;
    downloadUrl: string;
    doi?: string;
    datasets?: string[];
    impactFactor?: number; // For journals
    quartile?: 'Q1' | 'Q2' | 'Q3' | 'Q4'; // For journals (Q1-Q4 ranking)
}

// Filter types
interface Filters {
    years: number[];
    venues: string[]; // Now storing venue IDs instead of names
    fields: string[];
    venueTypes: Array<'conference' | 'journal'>;
}

// Helper function to create URL-friendly slugs from titles
function createSlug(title: string): string {
    return title
        .toLowerCase()
        .replace(/[^\w\s-]/g, '') // Remove special characters
        .replace(/\s+/g, '-')     // Replace spaces with hyphens
        .replace(/--+/g, '-')     // Replace multiple hyphens with single hyphen
        .trim()                  // Trim whitespace
}

export default function PapersPage() {
    const router = useRouter()
    // State for filters
    const [activeFilters, setActiveFilters] = useState<Filters>({
        years: [],
        venues: [],
        fields: [],
        venueTypes: [],
    })

    // State for papers
    const [papers, setPapers] = useState<Paper[]>([])
    const [filteredPapers, setFilteredPapers] = useState<Paper[]>([])
    const [loading, setLoading] = useState<boolean>(true)
    const [error, setError] = useState<string | null>(null)

    // Pagination state
    const [currentPage, setCurrentPage] = useState<number>(1)
    const [pageSize, setPageSize] = useState<number>(20)
    const [totalItems, setTotalItems] = useState<number>(0)
    const [totalPages, setTotalPages] = useState<number>(0)

    // State for expanded filter sections
    const [expandedFilters, setExpandedFilters] = useState<{
        conferences: boolean;
        journals: boolean;
        fields: boolean;
    }>({
        conferences: false,
        journals: false,
        fields: false,
    })

    // State for conferences and journals
    const [conferences, setConferences] = useState<Array<{ id: string, name: string, abbreviation: string, rank?: string }>>([])
    const [journals, setJournals] = useState<Array<{ id: string, name: string, abbreviation: string, impactFactor?: number, quartile?: string }>>([])
    const [conferenceSearch, setConferenceSearch] = useState('')
    const [journalSearch, setJournalSearch] = useState('')
    const [loadingVenues, setLoadingVenues] = useState(false)
    const [conferencesCount, setConferencesCount] = useState(0)
    const [journalsCount, setJournalsCount] = useState(0)

    // Filtered conferences and journals based on search
    const filteredConferences = conferences.filter(conf =>
        conf.name.toLowerCase().includes(conferenceSearch.toLowerCase()) ||
        conf.abbreviation?.toLowerCase().includes(conferenceSearch.toLowerCase())
    )

    const filteredJournals = journals.filter(journal =>
        journal.name.toLowerCase().includes(journalSearch.toLowerCase()) ||
        journal.abbreviation?.toLowerCase().includes(journalSearch.toLowerCase())
    )

    // Sort journals by impact factor (descending)
    const sortedJournals = [...filteredJournals].sort((a, b) =>
        (b.impactFactor || 0) - (a.impactFactor || 0)
    )

    // Filter top-ranked conferences (A*)
    const topRankedConferences = filteredConferences.filter(conf =>
        conf.rank === 'A*'
    )

    // Journals to display based on expanded state
    const journalsToDisplay = expandedFilters.journals
        ? sortedJournals
        : sortedJournals.slice(0, 100)

    // Conferences to display based on expanded state
    const conferencesToDisplay = expandedFilters.conferences
        ? filteredConferences
        : topRankedConferences

    // Toggle expanded sections
    const toggleExpandedSection = (section: 'conferences' | 'journals' | 'fields') => {
        setExpandedFilters(prev => ({
            ...prev,
            [section]: !prev[section],
        }))
    }

    // Fetch conferences and journals
    const fetchVenues = async () => {
        try {
            setLoadingVenues(true)
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

            // Prepare headers
            const headers: HeadersInit = {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            }

            // Fetch total counts first
            try {
                const countsResponse = await fetch(`${apiUrl}/api/venues/counts/`, {
                    method: 'GET',
                    headers,
                    credentials: 'include',
                })

                if (countsResponse.ok) {
                    const countsData = await countsResponse.json()
                    setConferencesCount(countsData.conferencesCount || 0)
                    setJournalsCount(countsData.journalsCount || 0)
                    console.log('Venues counts from API:', countsData)
                } else {
                    console.error('Failed to fetch venue counts:', countsResponse.status)
                    // Set fallback counts that will be overridden later with actual data lengths
                    setConferencesCount(0)
                    setJournalsCount(0)
                }
            } catch (error) {
                console.error('Error fetching venue counts:', error)
                // Set fallback counts that will be overridden later with actual data lengths
                setConferencesCount(0)
                setJournalsCount(0)
            }

            // Fetch conferences
            const conferencesResponse = await fetch(`${apiUrl}/api/conferences/filter/`, {
                method: 'GET',
                headers,
                credentials: 'include',
            })

            // Fetch journals
            const journalsResponse = await fetch(`${apiUrl}/api/journals/filter/`, {
                method: 'GET',
                headers,
                credentials: 'include',
            })

            if (conferencesResponse.ok) {
                const conferencesData = await conferencesResponse.json()
                setConferences(conferencesData)

                // Use array length if we don't have counts yet
                if (conferencesCount === 0) {
                    setConferencesCount(conferencesData.length)
                    console.log('Using fallback conferences count:', conferencesData.length)
                }
            }

            if (journalsResponse.ok) {
                const journalsData = await journalsResponse.json()

                // Debug log to check highest impact factor
                const sortedByIF = [...journalsData].sort((a, b) =>
                    (b.impactFactor || 0) - (a.impactFactor || 0)
                )

                if (sortedByIF.length > 0) {
                    console.log('Highest impact factor journal:', sortedByIF[0])
                    console.log('Top 5 impact factor journals:', sortedByIF.slice(0, 5).map(j =>
                        `${j.name}: IF=${j.impactFactor}`
                    ))
                }

                setJournals(journalsData)

                // Use array length if we don't have counts yet
                if (journalsCount === 0) {
                    setJournalsCount(journalsData.length)
                    console.log('Using fallback journals count:', journalsData.length)
                }
            }
        } catch (error) {
            console.error('Error fetching venues:', error)
        } finally {
            setLoadingVenues(false)
        }
    }

    // Fetch papers from API with pagination
    const fetchPapers = async (page: number = 1, size: number = pageSize) => {
        try {
            setLoading(true)
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

            // Prepare headers with authentication token if available
            const headers: HeadersInit = {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            }

            if (typeof window !== 'undefined') {
                // Try to get token from various storage locations
                let authToken = localStorage.getItem('authToken') ||
                    sessionStorage.getItem('authToken') ||
                    localStorage.getItem('token') ||
                    sessionStorage.getItem('token')

                // If token already has 'Token ' prefix, remove it to avoid duplication
                if (authToken && authToken.startsWith('Token ')) {
                    authToken = authToken.substring(6)
                }

                if (authToken) {
                    headers['Authorization'] = `Token ${authToken}`
                }
            }

            // Use Django API directly with pagination
            const controller = new AbortController()
            const timeoutId = setTimeout(() => controller.abort(), 10000)

            // Build query parameters including filters and pagination
            let queryParams = `page=${page}&pageSize=${size}`

            // Add filter parameters if active
            if (activeFilters.years.length > 0) {
                queryParams += `&year=${activeFilters.years[0]}`
            }

            if (activeFilters.venues.length > 0) {
                queryParams += `&venue_id=${activeFilters.venues[0]}`
            }

            if (activeFilters.fields.length > 0) {
                queryParams += `&field=${encodeURIComponent(activeFilters.fields[0])}`
            }

            if (activeFilters.venueTypes.length > 0) {
                queryParams += `&venueType=${activeFilters.venueTypes[0]}`
            }

            try {
                // Add pagination parameters
                const response = await fetch(`${apiUrl}/api/papers/?${queryParams}`, {
                    method: 'GET',
                    headers,
                    credentials: 'include',
                    signal: controller.signal,
                    mode: 'cors', // Explicitly set CORS mode
                })

                clearTimeout(timeoutId)

                if (!response.ok) {
                    const errorText = await response.text()
                    console.error(`Server responded with ${response.status}: ${errorText}`)
                    throw new Error(`Failed to fetch papers (${response.status}): ${errorText}`)
                }

                const data = await response.json()
                setPapers(data.results)
                setFilteredPapers(data.results)
                setTotalItems(data.pagination.totalItems)
                setTotalPages(data.pagination.totalPages)
                setCurrentPage(data.pagination.page)
                setError(null)
            } catch (err) {
                clearTimeout(timeoutId)

                // Check if the error is due to network issues vs other problems
                const errorMessage = err instanceof Error ? err.message : String(err)
                console.error('Error fetching papers:', errorMessage)

                if (err instanceof Error && err.name === 'AbortError') {
                    setError('Request timed out. The API server may be unavailable.')
                } else if (errorMessage.includes('Failed to fetch')) {
                    // Log additional diagnostic information
                    console.error('API URL:', apiUrl)
                    console.error('Headers:', JSON.stringify(headers))

                    setError(`Cannot connect to the API server at ${apiUrl}. Make sure the backend is running and CORS is properly configured.`)
                } else {
                    setError('Failed to load papers: ' + errorMessage)
                }

                // Fallback data
                const fallbackPapers = [
                    {
                        id: '1',
                        title: 'Attention Is All You Need',
                        authors: ['Ashish Vaswani', 'Noam Shazeer', 'Niki Parmar', 'Jakob Uszkoreit'],
                        venue: 'NeurIPS',
                        venueType: 'conference' as const,
                        year: 2023,
                        field: 'Artificial Intelligence',
                        keywords: ['Transformer', 'Attention', 'NLP', 'Deep Learning'],
                        abstract: 'We propose a new simple network architecture, the Transformer, based solely on attention mechanisms, dispensing with recurrence and convolutions entirely.',
                        downloadUrl: '#',
                    },
                    {
                        id: '2',
                        title: 'BERT: Pre-training of Deep Bidirectional Transformers for Language Understanding',
                        authors: ['Jacob Devlin', 'Ming-Wei Chang', 'Kenton Lee', 'Kristina Toutanova'],
                        venue: 'NAACL',
                        venueType: 'conference' as const,
                        year: 2022,
                        field: 'Computational Linguistics',
                        keywords: ['BERT', 'Transformers', 'Pre-training', 'NLP'],
                        abstract: 'We introduce a new language representation model called BERT, which stands for Bidirectional Encoder Representations from Transformers.',
                        downloadUrl: '#',
                    },
                    {
                        id: '3',
                        title: 'Deep Residual Learning for Image Recognition',
                        authors: ['Kaiming He', 'Xiangyu Zhang', 'Shaoqing Ren', 'Jian Sun'],
                        venue: 'CVPR',
                        venueType: 'conference' as const,
                        year: 2024,
                        field: 'Computer Vision & Pattern Recognition',
                        keywords: ['ResNet', 'CNN', 'Image Recognition', 'Deep Learning'],
                        abstract: 'Deeper neural networks are more difficult to train. We present a residual learning framework to ease the training of networks that are substantially deeper than those used previously.',
                        downloadUrl: '#',
                    },
                    {
                        id: '4',
                        title: 'Generative Adversarial Networks',
                        authors: ['Ian Goodfellow', 'Jean Pouget-Abadie', 'Mehdi Mirza', 'Bing Xu'],
                        venue: 'IEEE Transactions on Pattern Analysis and Machine Intelligence',
                        venueType: 'journal' as const,
                        year: 2023,
                        field: 'Artificial Intelligence',
                        keywords: ['GANs', 'Generative Models', 'Deep Learning'],
                        abstract: 'We propose a new framework for estimating generative models via an adversarial process, in which we simultaneously train two models: a generative model G that captures the data distribution, and a discriminative model D that estimates the probability that a sample came from the training data rather than G.',
                        downloadUrl: '#',
                        impactFactor: 24.314,
                        quartile: 'Q1' as const,
                    },
                    {
                        id: '5',
                        title: 'A Survey of Large Language Models',
                        authors: ['Wayne Xin Zhao', 'Kun Zhou', 'Junyi Li', 'Tianyi Tang'],
                        venue: 'ACM Computing Surveys',
                        venueType: 'journal' as const,
                        year: 2024,
                        field: 'Computational Linguistics',
                        keywords: ['LLM', 'Survey', 'NLP', 'Deep Learning'],
                        abstract: 'This paper presents a comprehensive survey of Large Language Models (LLMs), which have shown remarkable capabilities in various tasks and have the potential to revolutionize the way humans interact with computers.',
                        downloadUrl: '#',
                        impactFactor: 14.324,
                        quartile: 'Q1' as const,
                    },
                ] as Paper[]

                setPapers(fallbackPapers)
                setFilteredPapers(fallbackPapers)
            }
        } finally {
            setLoading(false)
        }
    }

    // Initial load
    useEffect(() => {
        fetchPapers(1)
        fetchVenues() // Fetch conferences and journals
    }, [])

    // Handle page change
    const handlePageChange = (newPage: number) => {
        if (newPage < 1 || newPage > totalPages) return
        setCurrentPage(newPage)
        fetchPapers(newPage)

        // Scroll to top of page
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    // Handle items per page change
    const handleItemsPerPageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newSize = parseInt(e.target.value, 10)
        setPageSize(newSize)
        setCurrentPage(1) // Reset to first page when changing items per page
        fetchPapers(1, newSize)
    }

    // Filter data
    const researchFields = [
        'Artificial Intelligence',
        'Computational Linguistics',
        'Computer Graphics',
        'Computer Networks & Wireless Communication',
        'Computer Vision & Pattern Recognition',
        'Data Mining & Analysis',
        'Databases & Information Systems',
        'Multimedia',
        'Robotics',
    ]

    const venuesData = {
        conferences: {
            'Artificial Intelligence': ['NeurIPS', 'ICLR', 'ICML', 'AAAI', 'AISTATS', 'CoRL', 'UAI'],
            'Computational Linguistics': ['ACL', 'EMNLP', 'NAACL', 'COLING', 'ARR', 'COLM'],
            'Computer Graphics': ['SIGGRAPH', 'SIGGRAPH Asia'],
            'Computer Networks & Wireless Communication': ['SIGCOMM'],
            'Computer Vision & Pattern Recognition': ['CVPR', 'ICCV', 'ECCV', 'WACV', 'BMVC', '3DV'],
            'Data Mining & Analysis': ['KDD'],
            'Databases & Information Systems': ['WWW', 'SIGIR'],
            'Multimedia': ['ACM-MM'],
            'Robotics': ['ICRA', 'IROS', 'RSS'],
        },
        journals: {
            'Artificial Intelligence': ['IEEE Transactions on Pattern Analysis and Machine Intelligence', 'Journal of Machine Learning Research', 'IEEE Transactions on Neural Networks and Learning Systems'],
            'Computational Linguistics': ['Computational Linguistics', 'ACM Computing Surveys', 'Journal of Artificial Intelligence Research'],
            'Computer Vision & Pattern Recognition': ['International Journal of Computer Vision', 'IEEE Transactions on Image Processing'],
            'Data Mining & Analysis': ['IEEE Transactions on Knowledge and Data Engineering', 'Data Mining and Knowledge Discovery'],
            'Databases & Information Systems': ['ACM Transactions on Database Systems', 'The VLDB Journal'],
        },
    }

    const years = [2021, 2022, 2023, 2024, 2025]

    // Handle filter changes
    const toggleYearFilter = (year: number) => {
        setActiveFilters(prev => {
            const newYears = prev.years.includes(year)
                ? prev.years.filter(y => y !== year)
                : [...prev.years, year]
            return { ...prev, years: newYears }
        })
        // Reset to page 1 and refetch with current page size
        setCurrentPage(1)
        setTimeout(() => {
            fetchPapers(1, pageSize)
        }, 0)
    }

    const toggleVenueFilter = (venue: { id: string, name: string }) => {
        setActiveFilters(prev => {
            const newVenues = prev.venues.includes(venue.id)
                ? prev.venues.filter(v => v !== venue.id)
                : [...prev.venues, venue.id]
            return { ...prev, venues: newVenues }
        })
        // Reset to page 1 and refetch with current page size
        setCurrentPage(1)
        setTimeout(() => {
            fetchPapers(1, pageSize)
        }, 0)
    }

    const toggleFieldFilter = (field: string) => {
        setActiveFilters(prev => {
            const newFields = prev.fields.includes(field)
                ? prev.fields.filter(f => f !== field)
                : [...prev.fields, field]
            return { ...prev, fields: newFields }
        })
        // Reset to page 1 and refetch with current page size
        setCurrentPage(1)
        setTimeout(() => {
            fetchPapers(1, pageSize)
        }, 0)
    }

    const toggleVenueTypeFilter = (type: 'conference' | 'journal') => {
        setActiveFilters(prev => {
            const newVenueTypes = prev.venueTypes.includes(type)
                ? prev.venueTypes.filter(t => t !== type)
                : [...prev.venueTypes, type]
            return { ...prev, venueTypes: newVenueTypes }
        })
        // Reset to page 1 and refetch with current page size
        setCurrentPage(1)
        setTimeout(() => {
            fetchPapers(1, pageSize)
        }, 0)
    }

    const clearFilters = () => {
        setActiveFilters({
            years: [],
            venues: [],
            fields: [],
            venueTypes: [],
        })
        // Reset to page 1 and refetch with current page size
        setCurrentPage(1)
        fetchPapers(1, pageSize)
    }

    // Apply filters
    useEffect(() => {
        let result = [...papers]

        if (activeFilters.years.length > 0) {
            result = result.filter(paper => activeFilters.years.includes(paper.year))
        }

        if (activeFilters.venues.length > 0) {
            result = result.filter(paper => activeFilters.venues.includes(paper.venue))
        }

        if (activeFilters.fields.length > 0) {
            result = result.filter(paper => activeFilters.fields.includes(paper.field))
        }

        if (activeFilters.venueTypes.length > 0) {
            result = result.filter(paper => activeFilters.venueTypes.includes(paper.venueType))
        }

        setFilteredPapers(result)
    }, [activeFilters, papers])

    // Function to get papers by type
    const getPapersByType = (type: 'conference' | 'journal') => {
        return filteredPapers.filter(paper => paper.venueType === type)
    }

    // Function to get conference abbreviation if available
    const getConferenceDisplay = (venueName: string) => {
        // Find the conference in our conferences list
        const conference = conferences.find(conf =>
            conf.name === venueName || conf.abbreviation === venueName
        )

        // If found and has abbreviation, use it, otherwise use the full name
        return conference?.abbreviation || venueName
    }

    // Function to get conference id from name
    const getConferenceId = (venueName: string) => {
        if (!venueName) {
            console.log('Conference venueName is empty or undefined')
            return undefined
        }

        console.log('Searching for conference ID with venue name:', venueName)

        // Tìm kiếm chính xác
        const exactMatch = conferences.find(conf =>
            conf.name === venueName || conf.abbreviation === venueName
        )

        if (exactMatch) {
            console.log('Found exact conference match:', exactMatch.name, 'ID:', exactMatch.id)
            return exactMatch.id
        }

        // Tìm kiếm dựa trên abbreviation trong tên venue
        // Ví dụ: "ICML 2023" sẽ khớp với abbreviation "ICML"
        const abbrevMatch = conferences.find(conf =>
            conf.abbreviation &&
            conf.abbreviation.trim() !== '' &&
            venueName.includes(conf.abbreviation)
        )

        if (abbrevMatch) {
            console.log('Found abbreviation match:', abbrevMatch.name, 'ID:', abbrevMatch.id, 'Abbr:', abbrevMatch.abbreviation)
            return abbrevMatch.id
        }

        // Tìm kiếm mờ - kiểm tra nếu venueName là một phần của conference name
        const partialMatch = conferences.find(conf =>
            (conf.name && venueName.includes(conf.name)) ||
            (conf.name && conf.name.includes(venueName))
        )

        if (partialMatch) {
            console.log('Found partial name match:', partialMatch.name, 'ID:', partialMatch.id)
            return partialMatch.id
        }

        // Nếu không tìm thấy, thử tìm kiếm mờ hơn
        const looseMatch = conferences.find(conf =>
            (conf.abbreviation && conf.abbreviation.includes(venueName)) ||
            venueName.toLowerCase().includes(conf.name.toLowerCase().substring(0, Math.min(10, conf.name.length)))
        )

        console.log('Conference match result for:', venueName, looseMatch
            ? `ID: ${looseMatch.id}, Name: ${looseMatch.name}, Abbr: ${looseMatch.abbreviation}`
            : 'Not found after all checks')

        return looseMatch?.id
    }

    // Function to get journal id from name
    const getJournalId = (venueName: string) => {
        // Tìm kiếm chính xác
        const exactMatch = journals.find(j =>
            j.name === venueName || j.abbreviation === venueName
        )

        if (exactMatch) return exactMatch.id

        // Tìm kiếm mờ - kiểm tra nếu venueName là một phần của journal name
        const partialMatch = journals.find(j =>
            venueName.includes(j.name) ||
            j.name.includes(venueName) ||
            (j.abbreviation && venueName.includes(j.abbreviation)) ||
            (j.abbreviation && j.abbreviation.includes(venueName))
        )

        console.log('Journal match for:', venueName, partialMatch ? `ID: ${partialMatch.id}` : 'Not found')
        return partialMatch?.id
    }

    // Function to navigate to conference detail
    const navigateToConference = (id: string | undefined, e: React.MouseEvent) => {
        e.stopPropagation()
        e.preventDefault()

        console.log('Navigating to conference with ID:', id)

        if (id) {
            const url = `/conferences/${id}`
            console.log('Conference navigation URL:', url)
            router.push(url)
        } else {
            console.log('Cannot navigate - conference ID is undefined')
        }
    }

    // Function to navigate to journal detail
    const navigateToJournal = (id: string | undefined, e: React.MouseEvent) => {
        e.stopPropagation()
        e.preventDefault()

        console.log('Navigating to journal with ID:', id)

        if (id) {
            router.push(`/journals/${id}`)
        } else {
            console.log('Cannot navigate - journal ID is undefined')
        }
    }

    // Effect to fetch venues on component mount
    useEffect(() => {
        fetchVenues()
    }, []) // Empty dependency array means this runs once on mount

    // Effect to fetch papers with filters
    useEffect(() => {
        // When filters change, fetch the first page
        fetchPapers(1)
    }, [activeFilters, pageSize])

    return (
        <main className='min-h-screen flex flex-col'>
            {/* Header section removed */}

            <div className='max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10'>
                <div className='flex flex-col md:flex-row gap-8'>
                    {/* Filters Sidebar */}
                    <div className='w-full md:w-1/4 bg-white p-6 rounded-xl shadow-sm'>
                        <div className='flex justify-between items-center mb-4'>
                            <h2 className='text-xl font-semibold text-gray-800'>Filters</h2>
                            {(activeFilters.years.length > 0 || activeFilters.venues.length > 0 || activeFilters.fields.length > 0 || activeFilters.venueTypes.length > 0) && (
                                <button
                                    onClick={clearFilters}
                                    className='text-sm text-blue-600 hover:text-blue-800'
                                >
                                    Clear all
                                </button>
                            )}
                        </div>

                        {/* Publication Type Filter */}
                        <div className='mb-6'>
                            <h3 className='text-lg font-medium text-gray-700 mb-2'>Publication Type</h3>
                            <div className='space-y-2'>
                                <div className='flex items-center'>
                                    <input
                                        type='checkbox'
                                        id='venue-type-conference'
                                        checked={activeFilters.venueTypes.includes('conference')}
                                        onChange={() => toggleVenueTypeFilter('conference')}
                                        className='h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded'
                                    />
                                    <label htmlFor='venue-type-conference' className='ml-2 text-sm text-gray-700'>
                                        Conferences
                                    </label>
                                </div>
                                <div className='flex items-center'>
                                    <input
                                        type='checkbox'
                                        id='venue-type-journal'
                                        checked={activeFilters.venueTypes.includes('journal')}
                                        onChange={() => toggleVenueTypeFilter('journal')}
                                        className='h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded'
                                    />
                                    <label htmlFor='venue-type-journal' className='ml-2 text-sm text-gray-700'>
                                        Journals
                                    </label>
                                </div>
                            </div>
                        </div>

                        {/* Research Fields Filter */}
                        <div className='mb-6'>
                            <div className='flex justify-between items-center mb-2'>
                                <h3 className='text-lg font-medium text-gray-700'>Research Fields</h3>
                                <span className='text-xs text-gray-500'>{researchFields.length}</span>
                            </div>
                            <div className='space-y-2'>
                                {researchFields.map((field) => (
                                    <div key={field} className='flex items-center'>
                                        <input
                                            type='checkbox'
                                            id={`field-${field}`}
                                            checked={activeFilters.fields.includes(field)}
                                            onChange={() => toggleFieldFilter(field)}
                                            className='h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded'
                                        />
                                        <label htmlFor={`field-${field}`} className='ml-2 text-sm text-gray-700'>
                                            {field}
                                        </label>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Conferences Filter */}
                        <div className='mb-6'>
                            <div className='flex justify-between items-center mb-2'>
                                <h3 className='text-lg font-medium text-gray-700'>Conferences</h3>
                                <span className='text-xs text-gray-500'>
                                    {loadingVenues ?
                                        <span className='inline-flex items-center'>
                                            <span className='animate-pulse'>Loading...</span>
                                        </span> :
                                        conferencesCount
                                    }
                                </span>
                            </div>
                            <div className='mb-2'>
                                <input
                                    type='text'
                                    placeholder='Search conferences...'
                                    value={conferenceSearch}
                                    onChange={(e) => setConferenceSearch(e.target.value)}
                                    className='w-full px-3 py-2 border border-gray-300 rounded-md text-sm'
                                />
                            </div>
                            <div className={`space-y-2 ${!expandedFilters.conferences ? 'max-h-60 overflow-y-auto' : ''}`}>
                                {loadingVenues ? (
                                    <div className='flex justify-center py-4'>
                                        <div className='animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600'></div>
                                    </div>
                                ) : conferencesToDisplay.length > 0 ? (
                                    conferencesToDisplay.map(conf => (
                                        <div key={conf.id} className='flex items-center'>
                                            <input
                                                type='checkbox'
                                                id={`venue-${conf.id}`}
                                                checked={activeFilters.venues.includes(conf.id)}
                                                onChange={() => toggleVenueFilter(conf)}
                                                className='h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded'
                                            />
                                            <label htmlFor={`venue-${conf.id}`} className='ml-2 text-sm text-gray-700 flex-1'>
                                                {conf.abbreviation || conf.name}
                                            </label>
                                            {conf.rank && (
                                                <span className='text-xs text-gray-500 ml-1'>{conf.rank}</span>
                                            )}
                                        </div>
                                    ))
                                ) : (
                                    <p className='text-sm text-gray-500 py-2'>No conferences found</p>
                                )}

                                {(expandedFilters.conferences && filteredConferences.length > topRankedConferences.length) ||
                                    (!expandedFilters.conferences && topRankedConferences.length > 0 && filteredConferences.length > topRankedConferences.length) ? (
                                    <button
                                        onClick={() => toggleExpandedSection('conferences')}
                                        className='w-full text-sm text-blue-600 hover:text-blue-800 mt-2 pt-1 border-t border-gray-100'
                                    >
                                        {expandedFilters.conferences
                                            ? 'Show Only A* Conferences'
                                            : `See More (${filteredConferences.length - topRankedConferences.length} more)`}
                                    </button>
                                ) : null}
                            </div>
                        </div>

                        {/* Journals Filter */}
                        <div className='mb-6'>
                            <div className='flex justify-between items-center mb-2'>
                                <h3 className='text-lg font-medium text-gray-700'>Journals</h3>
                                <span className='text-xs text-gray-500'>
                                    {loadingVenues ?
                                        <span className='inline-flex items-center'>
                                            <span className='animate-pulse'>Loading...</span>
                                        </span> :
                                        journalsCount
                                    }
                                </span>
                            </div>
                            <div className='mb-2'>
                                <input
                                    type='text'
                                    placeholder='Search journals...'
                                    value={journalSearch}
                                    onChange={(e) => setJournalSearch(e.target.value)}
                                    className='w-full px-3 py-2 border border-gray-300 rounded-md text-sm'
                                />
                            </div>
                            <div className={`space-y-2 ${!expandedFilters.journals ? 'max-h-60 overflow-y-auto' : ''}`}>
                                {loadingVenues ? (
                                    <div className='flex justify-center py-4'>
                                        <div className='animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600'></div>
                                    </div>
                                ) : journalsToDisplay.length > 0 ? (
                                    journalsToDisplay.map(journal => (
                                        <div key={journal.id} className='flex items-center'>
                                            <input
                                                type='checkbox'
                                                id={`venue-${journal.id}`}
                                                checked={activeFilters.venues.includes(journal.id)}
                                                onChange={() => toggleVenueFilter(journal)}
                                                className='h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded'
                                            />
                                            <label htmlFor={`venue-${journal.id}`} className='ml-2 text-sm text-gray-700 flex-1 truncate'>
                                                {journal.name}
                                            </label>
                                            {journal.impactFactor && (
                                                <span className='text-xs text-gray-500 whitespace-nowrap ml-1'>
                                                    IF: {Number(journal.impactFactor).toFixed(journal.impactFactor >= 100 ? 0 : 1)}
                                                </span>
                                            )}
                                        </div>
                                    ))
                                ) : (
                                    <p className='text-sm text-gray-500 py-2'>No journals found</p>
                                )}

                                {(expandedFilters.journals && sortedJournals.length > 100) ||
                                    (!expandedFilters.journals && sortedJournals.length > 100) ? (
                                    <button
                                        onClick={() => toggleExpandedSection('journals')}
                                        className='w-full text-sm text-blue-600 hover:text-blue-800 mt-2 pt-1 border-t border-gray-100'
                                    >
                                        {expandedFilters.journals
                                            ? 'Show Top 100 Only'
                                            : `See More (${sortedJournals.length - 100} more)`}
                                    </button>
                                ) : null}
                            </div>
                        </div>

                        {/* Years Filter */}
                        <div>
                            <h3 className='text-lg font-medium text-gray-700 mb-2'>Publication Year</h3>
                            <div className='space-y-2'>
                                {years.map((year) => (
                                    <div key={year} className='flex items-center'>
                                        <input
                                            type='checkbox'
                                            id={`year-${year}`}
                                            checked={activeFilters.years.includes(year)}
                                            onChange={() => toggleYearFilter(year)}
                                            className='h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded'
                                        />
                                        <label htmlFor={`year-${year}`} className='ml-2 text-sm text-gray-700'>
                                            {year}
                                        </label>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Papers List */}
                    <div className='w-full md:w-3/4'>
                        <h1 className='text-3xl font-bold text-gray-800 mb-6'>Research Papers</h1>

                        {/* Loading state */}
                        {loading && (
                            <div className='flex justify-center items-center py-20'>
                                <div className='animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600'></div>
                            </div>
                        )}

                        {/* Error state */}
                        {error && (
                            <div className='bg-red-50 border border-red-200 text-red-800 rounded-lg p-4 mb-6'>
                                <p>{error}</p>
                            </div>
                        )}

                        {/* Results summary */}
                        {!loading && !error && (
                            <div className='text-sm text-gray-600 mb-4 flex justify-between items-center'>
                                <div>
                                    Showing {filteredPapers.length} {filteredPapers.length === 1 ? 'result' : 'results'}
                                    {(activeFilters.years.length > 0 || activeFilters.venues.length > 0 || activeFilters.fields.length > 0 || activeFilters.venueTypes.length > 0) && (
                                        <span> with applied filters</span>
                                    )}
                                </div>
                                <button
                                    onClick={clearFilters}
                                    className={`px-3 py-1 rounded text-sm border ${(activeFilters.years.length > 0 || activeFilters.venues.length > 0 || activeFilters.fields.length > 0 || activeFilters.venueTypes.length > 0)
                                        ? 'bg-blue-100 text-blue-700 border-blue-300 hover:bg-blue-200'
                                        : 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'}`}
                                    disabled={activeFilters.years.length === 0 && activeFilters.venues.length === 0 && activeFilters.fields.length === 0 && activeFilters.venueTypes.length === 0}
                                >
                                    Clear Filter
                                </button>
                            </div>
                        )}

                        {!loading && !error && filteredPapers.length > 0 ? (
                            <>
                                {/* Conference Papers */}
                                {getPapersByType('conference').length > 0 && (
                                    <div className='mb-8'>
                                        <h2 className='text-2xl font-semibold text-gray-800 mb-4'>Conference Publications</h2>
                                        <div className='grid gap-6'>
                                            {getPapersByType('conference').map((paper) => (
                                                <Link
                                                    key={paper.id}
                                                    href={`/papers/${paper.id}`}
                                                    className='block'
                                                >
                                                    <div className='bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow'>
                                                        <div className='flex justify-between'>
                                                            <h2 className='text-xl font-semibold text-gray-800 mb-2 hover:text-blue-600 hover:underline'>
                                                                {paper.title}
                                                            </h2>
                                                            <div className='flex flex-col items-end'>
                                                                {getConferenceId(paper.venue) ? (
                                                                    <button
                                                                        onClick={(e) => navigateToConference(getConferenceId(paper.venue), e)}
                                                                        className='inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-600/20 hover:bg-blue-100 hover:text-blue-800 cursor-pointer'
                                                                        title='View conference details'
                                                                    >
                                                                        {getConferenceDisplay(paper.venue)} 🔗
                                                                    </button>
                                                                ) : (
                                                                    <span className='inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-600/20'>
                                                                        {getConferenceDisplay(paper.venue)}
                                                                    </span>
                                                                )}
                                                                <span className='text-xs text-gray-600 mt-1'>{paper.year}</span>
                                                            </div>
                                                        </div>

                                                        <p className='text-sm text-gray-600 mb-2'>
                                                            <span className='font-medium'>Authors:</span> {paper.authors.join(', ')}
                                                        </p>

                                                        <div className='flex flex-wrap gap-1 mb-3'>
                                                            {paper.keywords.map((keyword, idx) => (
                                                                <span
                                                                    key={idx}
                                                                    className='inline-flex items-center rounded-md bg-orange-50 px-2 py-1 text-xs font-medium text-orange-700 ring-1 ring-inset ring-orange-600/20'
                                                                >
                                                                    {keyword}
                                                                </span>
                                                            ))}
                                                        </div>

                                                        <p className='text-sm text-gray-700 mb-4 line-clamp-2'>{paper.abstract}</p>

                                                        <div className='flex justify-between items-center'>
                                                            <span className='text-xs text-gray-500'>{paper.field}</span>
                                                        </div>
                                                    </div>
                                                </Link>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Journal Papers */}
                                {getPapersByType('journal').length > 0 && (
                                    <div>
                                        <h2 className='text-2xl font-semibold text-gray-800 mb-4'>Journal Publications (Q1-Q2)</h2>
                                        <div className='grid gap-6'>
                                            {getPapersByType('journal').map((paper) => (
                                                <Link
                                                    key={paper.id}
                                                    href={`/papers/${paper.id}`}
                                                    className='block'
                                                >
                                                    <div className='bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow'>
                                                        <div className='flex justify-between'>
                                                            <h2 className='text-xl font-semibold text-gray-800 mb-2 hover:text-blue-600 hover:underline'>
                                                                {paper.title}
                                                            </h2>
                                                            <div className='flex flex-col items-end'>
                                                                {getJournalId(paper.venue) ? (
                                                                    <button
                                                                        onClick={(e) => navigateToJournal(getJournalId(paper.venue), e)}
                                                                        className='inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-700/10 hover:bg-green-100 hover:text-green-800 cursor-pointer'
                                                                        title='View journal details'
                                                                    >
                                                                        {paper.venue} 🔗
                                                                    </button>
                                                                ) : (
                                                                    <span className='inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-700/10'>
                                                                        {paper.venue}
                                                                    </span>
                                                                )}
                                                                <div className='flex items-center mt-1'>
                                                                    <span className='text-xs text-gray-600 mr-2'>{paper.year}</span>
                                                                    {paper.quartile && (
                                                                        <span className='inline-flex items-center rounded-md bg-purple-50 px-2 py-1 text-xs font-medium text-purple-700 ring-1 ring-inset ring-purple-700/10'>
                                                                            {paper.quartile}
                                                                        </span>
                                                                    )}
                                                                    {paper.impactFactor && (
                                                                        <span className='ml-1 text-xs text-gray-600 whitespace-nowrap'>
                                                                            IF: {Number(paper.impactFactor).toFixed(paper.impactFactor >= 100 ? 0 : 1)}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <p className='text-sm text-gray-600 mb-2'>
                                                            <span className='font-medium'>Authors:</span> {paper.authors.join(', ')}
                                                        </p>

                                                        <div className='flex flex-wrap gap-1 mb-3'>
                                                            {paper.keywords.map((keyword, idx) => (
                                                                <span
                                                                    key={idx}
                                                                    className='inline-flex items-center rounded-md bg-orange-50 px-2 py-1 text-xs font-medium text-orange-700 ring-1 ring-inset ring-orange-600/20'
                                                                >
                                                                    {keyword}
                                                                </span>
                                                            ))}
                                                        </div>

                                                        <p className='text-sm text-gray-700 mb-4 line-clamp-2'>{paper.abstract}</p>

                                                        <div className='flex justify-between items-center'>
                                                            <span className='text-xs text-gray-500'>{paper.field}</span>
                                                        </div>
                                                    </div>
                                                </Link>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </>
                        ) : (
                            !loading && !error && (
                                <div className='text-center py-12'>
                                    <svg className='mx-auto h-12 w-12 text-gray-400' fill='none' viewBox='0 0 24 24' stroke='currentColor' aria-hidden='true'>
                                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' />
                                    </svg>
                                    <h3 className='mt-2 text-sm font-medium text-gray-900'>No papers found</h3>
                                    <p className='mt-1 text-sm text-gray-500'>Try adjusting your filters to find what you're looking for.</p>
                                </div>
                            )
                        )}

                        {/* Pagination */}
                        {!loading && !error && (
                            <div className='flex justify-center items-center mt-8 space-x-4'>
                                <div className='flex items-center space-x-1'>
                                    <button
                                        onClick={() => handlePageChange(currentPage - 1)}
                                        disabled={currentPage === 1}
                                        className={`px-4 py-2 rounded-md ${currentPage === 1 ? 'text-gray-400 cursor-not-allowed' : 'text-blue-600 hover:bg-blue-100'}`}
                                    >
                                        Previous
                                    </button>

                                    {Array.from({ length: Math.max(1, Math.min(5, totalPages)) }, (_, i) => {
                                        // Show pages around current page
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

                                        // Ensure we don't show page numbers beyond totalPages
                                        if (pageNum <= totalPages || totalPages === 0) {
                                            return (
                                                <button
                                                    key={pageNum}
                                                    onClick={() => handlePageChange(pageNum)}
                                                    className={`px-4 py-2 rounded-md ${currentPage === pageNum ? 'bg-blue-600 text-white' : 'text-blue-600 hover:bg-blue-100'}`}
                                                >
                                                    {pageNum}
                                                </button>
                                            )
                                        }
                                        return null
                                    })}

                                    <button
                                        onClick={() => handlePageChange(currentPage + 1)}
                                        disabled={currentPage === totalPages || totalPages === 0}
                                        className={`px-4 py-2 rounded-md ${currentPage === totalPages || totalPages === 0 ? 'text-gray-400 cursor-not-allowed' : 'text-blue-600 hover:bg-blue-100'}`}
                                    >
                                        Next
                                    </button>
                                </div>

                                {/* Items per page selector - now inline with pagination */}
                                {!loading && !error && filteredPapers.length > 0 && (
                                    <div className='flex items-center text-sm text-gray-600'>
                                        <span className='mr-2'>Items per page:</span>
                                        <select
                                            value={pageSize}
                                            onChange={handleItemsPerPageChange}
                                            className='border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500'
                                        >
                                            <option value='5'>5</option>
                                            <option value='10'>10</option>
                                            <option value='20'>20</option>
                                            <option value='50'>50</option>
                                        </select>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </main>
    )
}
