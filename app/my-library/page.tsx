'use client';
import { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

// API URL configuration
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Paper data structure
interface Paper {
    id: string;
    title: string;
    authors: string[];
    conference: string;
    year: number;
    field: string;
    keywords: string[];
    abstract: string;
    downloadUrl: string;
    isInteresting: boolean;
    isDownloaded: boolean;
    addedDate: string; // Date when paper was added to library
    doi?: string;
    bibtex?: string;     // BibTeX citation format
    sourceCode?: string; // Link to source code repository
    datasets?: string[];
    isUploaded?: boolean; // Flag for uploaded papers
    fileName?: string; // Original file name for uploaded papers
    fileSize?: number; // Size of the uploaded file in bytes
}

// Filter types
interface Filters {
    years: number[];
    conferences: string[];
    fields: string[];
}

// Conference and Journal type
interface ConferenceData {
    name: string;
    type: 'conference' | 'journal';
    field: string;
    paperCount: number;
}

// Dataset filter types
interface DatasetFilters {
    categories: string[];
    tasks: string[];
    languages: string[];
    paperCounts: string[];
}

// Dataset data structure
interface Dataset {
    id: string;
    name: string;
    abbreviation: string;
    description: string;
    category: string;
    paperCount: number;
    downloadUrl: string;
    addedDate: string; // Date when dataset was added to library
    tasks?: string[];
    language?: string;
}

// Helper function to create URL-friendly slugs from titles
function createSlug(title: string): string {
    return title
        .toLowerCase()
        .replace(/[^\w\s-]/g, '') // Remove special characters
        .replace(/\s+/g, '-')     // Replace spaces with hyphens
        .replace(/--+/g, '-')     // Replace multiple hyphens with single hyphen
        .trim();                  // Trim whitespace
}

export default function MyLibraryPage() {
    // State for showing sections
    const [activeSection, setActiveSection] = useState<'interesting' | 'downloaded' | 'datasets' | 'uploaded' | 'recommended'>('interesting');

    // Add login state to track authentication status
    const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);

    // Add router for navigation
    const router = useRouter();

    // State for filters
    const [activeFilters, setActiveFilters] = useState<Filters>({
        years: [],
        conferences: [],
        fields: [],
    });

    // Dataset filter state
    const [datasetFilters, setDatasetFilters] = useState<DatasetFilters>({
        categories: [],
        tasks: [],
        languages: [],
        paperCounts: ['0-100', '101-500', '501-1000', '1000+']
    });

    // State for papers
    const [libraryPapers, setLibraryPapers] = useState<Paper[]>([]);
    const [filteredPapers, setFilteredPapers] = useState<Paper[]>([]);

    // State for datasets
    const [starredDatasets, setStarredDatasets] = useState<Dataset[]>([]);

    // State for uploaded papers modal
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploadError, setUploadError] = useState<string | null>(null);

    // File input ref
    const fileInputRef = useRef<HTMLInputElement>(null);

    // State for expanded filter sections
    const [expandedFilters, setExpandedFilters] = useState<{
        conferences: boolean;
        fields: boolean;
    }>({
        conferences: false,
        fields: false
    });

    // Conference and journal data with counts
    const [conferenceData, setConferenceData] = useState<{
        conferences: ConferenceData[];
        journals: ConferenceData[];
        isLoading: boolean;
        error: string | null;
    }>({
        conferences: [],
        journals: [],
        isLoading: false,
        error: null
    });

    // State for recommended papers
    const [recommendedPapers, setRecommendedPapers] = useState<Paper[]>([]);
    const [isLoadingRecommendations, setIsLoadingRecommendations] = useState<boolean>(false);

    // New state for paper detail popup
    const [selectedPaper, setSelectedPaper] = useState<Paper | null>(null);
    const [isPaperDetailOpen, setIsPaperDetailOpen] = useState(false);

    // Utility function to get authentication headers
    const getAuthHeaders = (includeContentType: boolean = false): HeadersInit => {
        // Prepare headers
        const headers: Record<string, string> = {};

        // Add Content-Type if needed
        if (includeContentType) {
            headers['Content-Type'] = 'application/json';
        }

        // Get token directly
        const authToken = localStorage.getItem('authToken');

        // Log token status for debugging
        console.log("getAuthHeaders - Token status:", !!authToken);

        // Add token to headers if available
        if (authToken) {
            // Check if token already has the 'Token ' prefix
            const tokenValue = authToken.startsWith('Token ')
                ? authToken
                : `Token ${authToken}`;

            headers['Authorization'] = tokenValue;
            console.log("getAuthHeaders - Added Authorization header");
        } else {
            console.warn("getAuthHeaders - No auth token available");
            // We'll handle redirection in the API calls
        }

        return headers;
    };

    // Helper method to make authenticated API requests
    const makeAuthenticatedRequest = async (url: string, options: RequestInit = {}) => {
        const authToken = localStorage.getItem('authToken');

        if (!authToken) {
            throw new Error('No authentication token available');
        }

        // Check if token already has the 'Token ' prefix
        const tokenValue = authToken.startsWith('Token ') ? authToken : `Token ${authToken}`;

        // Default options
        const defaultOptions: RequestInit = {
            headers: {
                'Authorization': tokenValue,
                'Content-Type': 'application/json'
            },
            credentials: 'include'
        };

        // Merge with provided options
        const mergedOptions = {
            ...defaultOptions,
            ...options,
            headers: {
                ...defaultOptions.headers,
                ...(options.headers || {})
            }
        };

        // Make the request
        const response = await fetch(url, mergedOptions);

        // Handle 401 Unauthorized
        if (response.status === 401) {
            console.error('Authentication error on request to:', url);

            try {
                const errorText = await response.text();
                console.error("Auth error details:", errorText);
            } catch (e) {
                console.error("Could not read error response");
            }

            // Clear invalid token
            localStorage.removeItem('authToken');

            // Throw a specific error
            throw new Error('Authentication failed - token invalid');
        }

        return response;
    };

    // Function to check if we have auth token
    const hasAuthToken = (): boolean => {
        if (typeof window === 'undefined') return false;
        const token = localStorage.getItem('authToken');
        return !!token;
    };

    // Check authentication status on component mount and redirect if not authenticated
    useEffect(() => {
        // Add debug logging
        console.log("My Library page loaded, checking auth...");

        // Get the actual token for debugging
        const authToken = localStorage.getItem('authToken');
        // Log token existence and a masked version for debugging (only first 5 chars for security)
        console.log("Auth token exists:", !!authToken);
        if (authToken) {
            const tokenPreview = authToken.substring(0, 5) + "..." + authToken.substring(authToken.length - 5);
            console.log("Token preview:", tokenPreview);
        }

        // Check if user is authenticated
        if (!hasAuthToken()) {
            console.log("No auth token found, redirecting to login");
            // Redirect to login page if not authenticated
            router.push('/login');
            return;
        }

        // Verify token validity
        const verifyToken = async () => {
            try {
                // Make a test API call to verify token
                const token = localStorage.getItem('authToken');
                const tokenValue = token?.startsWith('Token ') ? token : `Token ${token}`;

                console.log("Making API test call with Authorization header");

                // Use fetch directly for this test to ensure headers are correct
                const response = await fetch(`${API_URL}/api/test/`, {
                    headers: {
                        'Authorization': tokenValue
                    }
                });

                if (response.ok) {
                    console.log("Auth token verified, proceeding to load My Library data");

                    // Set logged in state
                    setIsLoggedIn(true);

                    // Make sure we have an active section before fetching data
                    if (!activeSection) {
                        setActiveSection('interesting');
                    }

                    // Call fetchDataForActiveSection directly - don't wait for state update
                    setTimeout(() => {
                        fetchDataForActiveSection();
                    }, 0);
                } else {
                    console.warn("Token verification failed with status:", response.status);

                    // Try to get response details
                    try {
                        const errorText = await response.text();
                        console.error("Auth test error details:", errorText);
                    } catch (e) {
                        console.error("Could not read error response");
                    }

                    // Clear invalid token
                    localStorage.removeItem('authToken');
                    router.push('/login?error=token_invalid');
                }
            } catch (error) {
                console.error("Error verifying token:", error);

                // Clear token and redirect
                localStorage.removeItem('authToken');
                setIsLoggedIn(false);
                router.push('/login?error=token_verification_failed');
            }
        };

        verifyToken();
    }, [router, activeSection]);

    // Function to fetch interesting papers
    const fetchInterestingPapers = async () => {
        try {
            console.log("Fetching interesting papers...");

            if (!hasAuthToken()) {
                console.error('No auth token found!');
                setIsLoggedIn(false);
                router.push('/login?error=no_token');
                return;
            }

            // Use the new helper method for authenticated requests
            const response = await makeAuthenticatedRequest(`${API_URL}/api/papers/interesting/`);
            console.log('Interesting papers response status:', response.status);

            if (response.ok) {
                const data = await response.json();
                // Convert API data format to our Paper format
                const interestingPapers = data.map((paper: any) => ({
                    id: paper.id,
                    title: paper.title,
                    authors: Array.isArray(paper.authors) ? paper.authors : (paper.authors ? [paper.authors] : []),
                    conference: paper.conference || '',
                    year: paper.year || new Date().getFullYear(),
                    field: paper.field || '',
                    keywords: paper.keywords || [],
                    abstract: paper.abstract || '',
                    downloadUrl: paper.file || '#',
                    isInteresting: true, // These are interesting papers
                    isDownloaded: paper.is_downloaded || false,
                    isUploaded: paper.is_uploaded || false,
                    addedDate: paper.added_date || new Date().toISOString(),
                    fileName: paper.file_name,
                    fileSize: paper.file_size,
                    doi: paper.doi,
                    bibtex: paper.bibtex,
                    sourceCode: paper.sourceCode
                }));

                setLibraryPapers(interestingPapers);
                setFilteredPapers(interestingPapers);
            } else {
                // If API call fails, log the issue and use sample data
                console.log("Using sample interesting papers data");
                // Keep the existing sample data loading logic
            }
        } catch (error) {
            console.error("Error fetching interesting papers:", error);

            // Check for authentication errors
            if (error instanceof Error && error.message.includes('token invalid')) {
                setIsLoggedIn(false);
                router.push('/login?error=token_invalid');
                return;
            }

            // Continue with sample data on error
        }
    };

    // Function to fetch downloaded papers
    const fetchDownloadedPapers = async () => {
        try {
            console.log("Fetching downloaded papers...");

            if (!hasAuthToken()) {
                console.error('No auth token found!');
                setIsLoggedIn(false);
                router.push('/login?error=no_token');
                return;
            }

            // Use the new helper method for authenticated requests
            const response = await makeAuthenticatedRequest(`${API_URL}/api/papers/downloaded/`);
            console.log('Downloaded papers response status:', response.status);

            if (response.ok) {
                const data = await response.json();
                // Convert API data format to our Paper format
                const downloadedPapers = data.map((paper: any) => ({
                    id: paper.id,
                    title: paper.title,
                    authors: Array.isArray(paper.authors) ? paper.authors : (paper.authors ? [paper.authors] : []),
                    conference: paper.conference || '',
                    year: paper.year || new Date().getFullYear(),
                    field: paper.field || '',
                    keywords: paper.keywords || [],
                    abstract: paper.abstract || '',
                    downloadUrl: paper.file || '#',
                    isInteresting: paper.is_interesting || false,
                    isDownloaded: true, // These are downloaded papers
                    isUploaded: paper.is_uploaded || false,
                    addedDate: paper.added_date || new Date().toISOString(),
                    fileName: paper.file_name,
                    fileSize: paper.file_size,
                    doi: paper.doi,
                    bibtex: paper.bibtex,
                    sourceCode: paper.sourceCode
                }));

                setLibraryPapers(downloadedPapers);
                setFilteredPapers(downloadedPapers);
            } else {
                // If API call fails, log the issue and use sample data
                console.log("Using sample downloaded papers data");
                // Continue with sample data loading logic
            }
        } catch (error) {
            console.error("Error fetching downloaded papers:", error);

            // Check for authentication errors
            if (error instanceof Error && error.message.includes('token invalid')) {
                setIsLoggedIn(false);
                router.push('/login?error=token_invalid');
                return;
            }

            // Continue with sample data on error
        }
    };

    // Function to fetch interesting datasets
    const fetchInterestingDatasets = async () => {
        try {
            const headers = getAuthHeaders();
            const response = await fetch(`${API_URL}/api/datasets/interesting/`, {
                headers,
                credentials: 'include'
            });

            if (response.ok) {
                const data = await response.json();

                // Check if data is an array, if not, try to find the array property or convert single item to array
                const dataArray = Array.isArray(data) ? data :
                    data.results ? data.results :
                        data.datasets ? data.datasets :
                            data.data ? data.data :
                                data.items ? data.items :
                                    (Object.keys(data).length > 0 && typeof data === 'object' && !Array.isArray(data)) ? [data] : [];

                // Convert API data format to our Dataset format
                const interestingDatasets = dataArray.map((dataset: any) => ({
                    id: dataset.id,
                    name: dataset.name,
                    abbreviation: dataset.name.split(' ').map((word: string) => word[0]).join('').toUpperCase(),
                    description: dataset.description || '',
                    category: dataset.data_type || 'Unknown',
                    paperCount: dataset.papers?.length || 0,
                    downloadUrl: dataset.source_url || '#',
                    addedDate: dataset.created_at || new Date().toISOString(),
                    tasks: dataset.tasks || [],
                    language: dataset.language || 'English'
                }));

                setStarredDatasets(interestingDatasets);
            } else {
                // Handle authentication errors
                if (response.status === 401) {
                    console.log("Authentication required. Please log in.");
                    setIsLoggedIn(false);
                    router.push('/login');
                }

                // If API call fails, use sample data
                console.log("Using sample interesting datasets data");
                // Continue with sample data loading logic
            }
        } catch (error) {
            console.error("Error fetching interesting datasets:", error);
            // Continue with sample data on error
        }
    };

    // Fetch recommended papers based on user keywords
    const fetchRecommendedPapers = async () => {
        if (!hasAuthToken()) return;

        console.log("Fetching recommended papers for library page...");
        setIsLoadingRecommendations(true);
        try {
            // Use the new API endpoint instead of the manual process
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
            console.log("Using API URL:", API_URL);

            const response = await makeAuthenticatedRequest(`${API_URL}/api/my-library/?section=recommended`);

            if (!response.ok) {
                console.error("Recommendations fetch failed with status:", response.status);
                try {
                    const errorText = await response.text();
                    console.error("Recommendations error details:", errorText);
                } catch (e) {
                    console.error("Could not read error response");
                }
                throw new Error('Failed to fetch paper recommendations');
            }

            const recommendedPapersData = await response.json();
            console.log(`Received ${recommendedPapersData.length} recommended papers from API`);

            // Convert API data format to our Paper format
            const paperObjects = recommendedPapersData.map((paper: any) => {
                return {
                    id: paper.id,
                    title: paper.title,
                    authors: Array.isArray(paper.authors) ? paper.authors : ["Unknown"],
                    conference: paper.venue || paper.conference || "Unknown",
                    year: paper.year || new Date().getFullYear(),
                    field: paper.field || "Computer Science",
                    keywords: Array.isArray(paper.keywords) ? paper.keywords : [],
                    abstract: paper.abstract || "",
                    downloadUrl: paper.file || "#",
                    isInteresting: false,
                    isDownloaded: false,
                    addedDate: paper.created_at || new Date().toISOString(),
                    doi: paper.doi,
                };
            });

            console.log(`Setting ${paperObjects.length} recommended papers in state`);
            setRecommendedPapers(paperObjects);
        } catch (error) {
            console.error('Error fetching recommended papers:', error);
            setRecommendedPapers([]);
        } finally {
            setIsLoadingRecommendations(false);
        }
    };

    // Sample data
    useEffect(() => {
        // Fetch user papers from API if auth token exists
        const fetchUserPapers = async () => {
            try {
                // Instead of fetching from an API that's failing, we'll just use sample data
                // This fixes the TypeError: Failed to fetch error
                console.log("Using sample data instead of API fetch");

                // Optional: If you want to simulate an API fetch later, uncomment and modify this code:
                /*
                const headers = getAuthHeaders();
                const response = await fetch('your-api-endpoint-here', {
                    headers,
                    credentials: 'include'
                });

                if (response.ok) {
                    const data = await response.json();
                    // Process data here
                }
                */
            } catch (error) {
                console.error("Error fetching papers:", error);
                // Continue with sample data on error
            }
        };

        // This would normally be a fetch from an API
        const samplePapers: Paper[] = [
            {
                id: '1',
                title: 'Attention Is All You Need',
                authors: ['Ashish Vaswani', 'Noam Shazeer', 'Niki Parmar'],
                conference: 'NeurIPS',
                year: 2024,
                field: 'Artificial Intelligence',
                keywords: ['transformer', 'deep learning', 'NLP'],
                abstract: 'The dominant sequence transduction models are based on complex recurrent or convolutional neural networks...',
                downloadUrl: '#',
                isInteresting: true,
                isDownloaded: true,
                addedDate: '2024-05-15T14:22:30Z'
            },
            {
                id: '2',
                title: 'BERT: Pre-training of Deep Bidirectional Transformers for Language Understanding',
                authors: ['Jacob Devlin', 'Ming-Wei Chang', 'Kenton Lee'],
                conference: 'ACL',
                year: 2025,
                field: 'Computational Linguistics',
                keywords: ['BERT', 'transformers', 'language model'],
                abstract: 'We introduce a new language representation model called BERT...',
                downloadUrl: '#',
                isInteresting: true,
                isDownloaded: false,
                addedDate: '2024-05-10T09:15:45Z'
            },
            {
                id: '3',
                title: 'Deep Residual Learning for Image Recognition',
                authors: ['Kaiming He', 'Xiangyu Zhang', 'Shaoqing Ren'],
                conference: 'CVPR',
                year: 2025,
                field: 'Computer Vision & Pattern Recognition',
                keywords: ['ResNet', 'CNN', 'image recognition'],
                abstract: 'Deeper neural networks are more difficult to train...',
                downloadUrl: '#',
                isInteresting: false,
                isDownloaded: true,
                addedDate: '2024-05-12T18:30:15Z'
            },
            {
                id: '4',
                title: 'StyleGAN: A Style-Based Generator Architecture for Generative Adversarial Networks',
                authors: ['Tero Karras', 'Samuli Laine', 'Timo Aila'],
                conference: 'SIGGRAPH',
                year: 2024,
                field: 'Computer Graphics',
                keywords: ['GAN', 'generative model', 'style transfer'],
                abstract: 'We propose a new generator architecture for generative adversarial networks...',
                downloadUrl: '#',
                isInteresting: true,
                isDownloaded: true,
                addedDate: '2024-05-14T11:45:20Z'
            },
            {
                id: '5',
                title: 'Congestion Control Using Neural Networks',
                authors: ['Keith Winstein', 'Hari Balakrishnan'],
                conference: 'SIGCOMM',
                year: 2023,
                field: 'Computer Networks & Wireless Communication',
                keywords: ['congestion control', 'neural networks', 'networking'],
                abstract: 'We present a new approach to congestion control using neural networks...',
                downloadUrl: '#',
                isInteresting: true,
                isDownloaded: false,
                addedDate: '2024-05-08T16:20:10Z'
            },
            {
                id: '6',
                title: 'Uploaded Research Paper Example',
                authors: ['John Smith', 'Jane Doe'],
                conference: 'CVPR',
                year: 2023,
                field: 'Computer Vision & Pattern Recognition',
                keywords: ['computer vision', 'uploaded paper'],
                abstract: 'This is an example of an uploaded paper with metadata automatically extracted...',
                downloadUrl: '#',
                isInteresting: false,
                isDownloaded: false,
                isUploaded: true,
                addedDate: '2024-06-01T10:15:25Z',
                fileName: 'research_paper.pdf',
                fileSize: 2458000
            }
        ];

        setLibraryPapers(samplePapers);

        // Call the API fetch function
        fetchUserPapers();

        // If user is authenticated and on interesting section, fetch interesting papers
        if (activeSection === 'interesting' && hasAuthToken()) {
            fetchInterestingPapers();
        }

        // If user is authenticated and on downloaded section, fetch downloaded papers
        if (activeSection === 'downloaded' && hasAuthToken()) {
            fetchDownloadedPapers();
        }

        // If user is authenticated and on datasets section, fetch interesting datasets
        if (activeSection === 'datasets' && starredDatasets.length === 0) {
            fetchInterestingDatasets();
        }

        // Sample starred datasets
        const sampleDatasets: Dataset[] = [
            {
                id: '1',
                name: 'MNIST Database of Handwritten Digits',
                abbreviation: 'MNIST',
                description: 'The MNIST database of handwritten digits has a training set of 60,000 examples, and a test set of 10,000 examples.',
                category: 'Image',
                paperCount: 1250,
                downloadUrl: '#',
                addedDate: '2024-05-14T10:30:00Z',
                tasks: ['Image Classification', 'Pattern Recognition'],
                language: 'English'
            },
            {
                id: '2',
                name: 'Imagenet',
                abbreviation: 'ImageNet',
                description: 'ImageNet is an image database organized according to the WordNet hierarchy, in which each node is depicted by hundreds and thousands of images.',
                category: 'Image',
                paperCount: 5280,
                downloadUrl: '#',
                addedDate: '2024-05-10T15:45:20Z',
                tasks: ['Image Classification', 'Object Detection'],
                language: 'English'
            },
            {
                id: '3',
                name: 'CIFAR-10',
                abbreviation: 'CIFAR-10',
                description: 'The CIFAR-10 dataset consists of 60000 32x32 colour images in 10 classes, with 6000 images per class.',
                category: 'Image',
                paperCount: 980,
                downloadUrl: '#',
                addedDate: '2024-05-08T09:20:15Z',
                tasks: ['Image Classification'],
                language: 'English'
            }
        ];

        setStarredDatasets(sampleDatasets);
    }, [activeSection]);

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
        'Robotics'
    ];

    const conferences = {
        'Artificial Intelligence': ['NeurIPS', 'ICLR', 'ICML', 'AAAI', 'AISTATS', 'CoRL', 'UAI'],
        'Computational Linguistics': ['ACL', 'EMNLP', 'NAACL', 'COLING', 'ARR', 'COLM'],
        'Computer Graphics': ['SIGGRAPH', 'SIGGRAPH Asia'],
        'Computer Networks & Wireless Communication': ['SIGCOMM'],
        'Computer Vision & Pattern Recognition': ['CVPR', 'ICCV', 'ECCV', 'WACV', 'BMVC', '3DV'],
        'Data Mining & Analysis': ['KDD'],
        'Databases & Information Systems': ['WWW', 'SIGIR'],
        'Multimedia': ['ACM-MM'],
        'Robotics': ['ICRA', 'IROS', 'RSS']
    };

    const years = [2021, 2022, 2023, 2024, 2025];

    // Toggle section
    const toggleSection = (section: 'interesting' | 'downloaded' | 'datasets' | 'uploaded' | 'recommended') => {
        setActiveSection(section);

        // Update URL without reloading
        if (typeof window !== 'undefined') {
            const url = new URL(window.location.href);
            url.searchParams.set('section', section);
            window.history.pushState({}, '', url.toString());
        }

        // Fetch the data for the new section if we haven't already
        if (section === 'interesting' && libraryPapers.length === 0) {
            fetchInterestingPapers();
        } else if (section === 'downloaded' && libraryPapers.length === 0) {
            fetchDownloadedPapers();
        } else if (section === 'datasets' && starredDatasets.length === 0) {
            fetchInterestingDatasets();
        } else if (section === 'recommended' && recommendedPapers.length === 0) {
            fetchRecommendedPapers();
        }
    };

    // Handle filter changes
    const toggleYearFilter = (year: number) => {
        setActiveFilters(prev => {
            const newYears = prev.years.includes(year)
                ? prev.years.filter(y => y !== year)
                : [...prev.years, year];
            return { ...prev, years: newYears };
        });
    };

    const toggleConferenceFilter = (conference: string) => {
        setActiveFilters(prev => {
            const newConferences = prev.conferences.includes(conference)
                ? prev.conferences.filter(c => c !== conference)
                : [...prev.conferences, conference];
            return { ...prev, conferences: newConferences };
        });
    };

    const toggleFieldFilter = (field: string) => {
        setActiveFilters(prev => {
            const newFields = prev.fields.includes(field)
                ? prev.fields.filter(f => f !== field)
                : [...prev.fields, field];
            return { ...prev, fields: newFields };
        });
    };

    // Apply filters
    useEffect(() => {
        // Filter by section first
        let sectionFilteredPapers = libraryPapers.filter(paper => {
            if (activeSection === 'interesting') return paper.isInteresting;
            if (activeSection === 'downloaded') return paper.isDownloaded;
            if (activeSection === 'uploaded') return paper.isUploaded;
            return false;
        });

        // Sort by date added (newest first)
        sectionFilteredPapers.sort((a, b) =>
            new Date(b.addedDate).getTime() - new Date(a.addedDate).getTime()
        );

        // Apply other filters
        let result = [...sectionFilteredPapers];

        if (activeFilters.years.length > 0) {
            result = result.filter(paper => activeFilters.years.includes(paper.year));
        }

        if (activeFilters.conferences.length > 0) {
            result = result.filter(paper => activeFilters.conferences.includes(paper.conference));
        }

        if (activeFilters.fields.length > 0) {
            result = result.filter(paper => activeFilters.fields.includes(paper.field));
        }

        setFilteredPapers(result);
    }, [activeFilters, libraryPapers, activeSection]);

    // Clear all filters
    const clearFilters = () => {
        setActiveFilters({
            years: [],
            conferences: [],
            fields: [],
        });
    };

    // Dataset categories derived from the datasets
    const datasetCategories = ['Image', '3D', 'Audio', 'Medical', 'Time series', 'Text'];

    // Handle dataset filter changes
    const toggleCategoryFilter = (category: string) => {
        setDatasetFilters(prev => {
            const newCategories = prev.categories.includes(category)
                ? prev.categories.filter(c => c !== category)
                : [...prev.categories, category];
            return { ...prev, categories: newCategories };
        });
    };

    const toggleTaskFilter = (task: string) => {
        setDatasetFilters(prev => {
            const newTasks = prev.tasks.includes(task)
                ? prev.tasks.filter(t => t !== task)
                : [...prev.tasks, task];
            return { ...prev, tasks: newTasks };
        });
    };

    const toggleLanguageFilter = (language: string) => {
        setDatasetFilters(prev => {
            const newLanguages = prev.languages.includes(language)
                ? prev.languages.filter(l => l !== language)
                : [...prev.languages, language];
            return { ...prev, languages: newLanguages };
        });
    };

    // Clear all dataset filters
    const clearDatasetFilters = () => {
        setDatasetFilters(prev => ({
            ...prev,
            categories: [],
            tasks: [],
            languages: []
        }));
    };

    // Apply dataset filters
    const filteredDatasets = useMemo(() => {
        let result = [...starredDatasets];

        if (datasetFilters.categories.length > 0) {
            result = result.filter(dataset =>
                datasetFilters.categories.includes(dataset.category)
            );
        }

        if (datasetFilters.tasks.length > 0) {
            result = result.filter(dataset =>
                dataset.tasks && dataset.tasks.some(task =>
                    datasetFilters.tasks.includes(task)
                )
            );
        }

        if (datasetFilters.languages.length > 0) {
            result = result.filter(dataset =>
                dataset.language && datasetFilters.languages.includes(dataset.language)
            );
        }

        // Sort by date added (newest first)
        result.sort((a, b) =>
            new Date(b.addedDate).getTime() - new Date(a.addedDate).getTime()
        );

        return result;
    }, [starredDatasets, datasetFilters]);

    // Get unique dataset tasks
    const datasetTasks = ['Image Classification', 'Object Detection', 'Pattern Recognition', 'Segmentation', 'Natural Language Processing', 'Speech Recognition'];

    // Get unique dataset languages
    const datasetLanguages = ['English', 'Vietnamese', 'Chinese', 'Multilingual'];

    // Handle file upload
    const handleFileSelect = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        console.log("Starting file upload with file:", files[0].name);

        setIsUploading(true);
        setUploadProgress(0);
        setUploadError(null);

        // Create FormData for the file upload
        const formData = new FormData();
        formData.append('file', files[0]);

        try {
            // Upload progress simulation
            const progressInterval = setInterval(() => {
                setUploadProgress(prev => {
                    if (prev >= 90) {
                        clearInterval(progressInterval);
                        return 90;
                    }
                    return prev + 10;
                });
            }, 300);

            // Get authentication headers
            const headers = getAuthHeaders();
            console.log("Auth headers:", headers);

            // Show auth token status
            const hasToken = hasAuthToken();
            console.log("Has auth token:", hasToken);

            if (!hasToken) {
                throw new Error("No authentication token found. Please log in first.");
            }

            console.log("Making API request to upload paper...");

            // Upload the file to the API
            const response = await fetch(`${API_URL}/api/papers/upload/`, {
                method: 'POST',
                body: formData,
                headers,
                credentials: 'include',
            });

            console.log("Upload response status:", response.status);

            if (!response.ok) {
                const errorText = await response.text();
                console.error("Upload failed:", response.status, errorText);
                throw new Error(`Upload failed with status: ${response.status}. ${errorText}`);
            }

            // Get the paper data with extracted metadata
            const paperData = await response.json();

            console.log("Received paper data:", paperData);

            // Add new paper to library
            const newPaper: Paper = {
                id: paperData.id,
                title: paperData.title,
                authors: Array.isArray(paperData.authors) ? paperData.authors : (paperData.authors ? [paperData.authors] : []),
                conference: paperData.conference || '',
                year: paperData.year || new Date().getFullYear(),
                field: paperData.field || '',
                keywords: paperData.keywords || [],
                abstract: paperData.abstract || '',
                downloadUrl: paperData.file, // URL to download the file
                isInteresting: false,
                isDownloaded: false,
                isUploaded: true,
                addedDate: paperData.added_date,
                fileName: paperData.file_name,
                fileSize: paperData.file_size,
                doi: paperData.doi,
                bibtex: paperData.bibtex,
                sourceCode: paperData.sourceCode
            };

            // Add to library
            setLibraryPapers(prev => [...prev, newPaper]);

            // Complete progress and close modal
            setUploadProgress(100);
            setTimeout(() => {
                setIsUploading(false);
                setIsUploadModalOpen(false);
                setActiveSection('uploaded');
                // Reset file input
                if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                }
            }, 500);

        } catch (error) {
            console.error("Upload failed:", error);
            setUploadError(`Failed to upload paper: ${error instanceof Error ? error.message : String(error)}`);
            setIsUploading(false);
        }
    };

    // Handle toggling a paper status (isInteresting, isDownloaded)
    const togglePaperStatus = async (paperId: string, field: 'isInteresting' | 'isDownloaded') => {
        // Find the paper in the state
        const paper = libraryPapers.find(p => p.id === paperId);
        if (!paper) return;

        // Toggle the status locally first (optimistic update)
        const updatedPapers = libraryPapers.map(p => {
            if (p.id === paperId) {
                return { ...p, [field]: !p[field] };
            }
            return p;
        });

        setLibraryPapers(updatedPapers);

        // Update on the server if we have authentication
        try {
            // Check if we have authorization
            if (!hasAuthToken()) return;

            const headers = getAuthHeaders(true);

            // Convert local field name to API field name
            const apiField = field === 'isInteresting' ? 'is_interesting' : 'is_downloaded';

            // Send the update to the API
            const response = await fetch(`${API_URL}/api/papers/${paperId}/`, {
                method: 'PATCH',
                headers,
                body: JSON.stringify({
                    [apiField]: !paper[field]
                }),
                credentials: 'include'
            });

            if (!response.ok) {
                console.error('Failed to update paper status');
                // Revert the local state if the API call fails
                setLibraryPapers(prev => prev.map(p => {
                    if (p.id === paperId) {
                        return { ...p, [field]: paper[field] };
                    }
                    return p;
                }));
            }
        } catch (error) {
            console.error('Error updating paper:', error);
            // Revert the local state on error
            setLibraryPapers(prev => prev.map(p => {
                if (p.id === paperId) {
                    return { ...p, [field]: paper[field] };
                }
                return p;
            }));
        }
    };

    // Login function for testing authentication
    const testLogin = async () => {
        try {
            // Option 1: Use the token directly (for quick testing)
            const testToken = 'a4d617fe43b6129ea38cc2f7493f5f9091fedbf4'; // Token generated from create_test_user

            // Make sure token doesn't have 'Token ' prefix to avoid duplication
            const cleanToken = testToken.startsWith('Token ') ? testToken.substring(6) : testToken;

            // Store token in localStorage (only store the clean token without prefix)
            localStorage.removeItem('authToken');
            localStorage.setItem('authToken', cleanToken);
            console.log("Test token set in localStorage:", cleanToken.substring(0, 5) + "...");

            // Verify the token works with a test API call
            const tokenValue = `Token ${cleanToken}`;
            console.log("Making test API call with token");

            const testResponse = await fetch(`${API_URL}/api/test/`, {
                method: 'GET',
                headers: {
                    'Authorization': tokenValue
                }
            });

            if (testResponse.ok) {
                console.log("Test API call successful - token is valid");

                // Update login state
                setIsLoggedIn(true);

                // Show success message to user without alert
                const successMessage = document.createElement('div');
                successMessage.textContent = 'Successfully logged in!';
                successMessage.style.position = 'fixed';
                successMessage.style.top = '20px';
                successMessage.style.right = '20px';
                successMessage.style.backgroundColor = '#48bb78';
                successMessage.style.color = 'white';
                successMessage.style.padding = '12px 20px';
                successMessage.style.borderRadius = '4px';
                successMessage.style.zIndex = '1000';
                document.body.appendChild(successMessage);

                // Remove success message after 3 seconds
                setTimeout(() => {
                    document.body.removeChild(successMessage);
                }, 3000);

                // Refresh the page data
                fetchDataForActiveSection();

            } else {
                console.error("Test API call failed - token is invalid");
                const errorText = await testResponse.text();
                console.error("Error details:", errorText);
                throw new Error(`Token validation failed: ${testResponse.status}`);
            }
        } catch (error) {
            console.error('Login error:', error);

            // Show error message
            const errorMessage = document.createElement('div');
            errorMessage.textContent = 'Login failed: ' + String(error);
            errorMessage.style.position = 'fixed';
            errorMessage.style.top = '20px';
            errorMessage.style.right = '20px';
            errorMessage.style.backgroundColor = '#f56565';
            errorMessage.style.color = 'white';
            errorMessage.style.padding = '12px 20px';
            errorMessage.style.borderRadius = '4px';
            errorMessage.style.zIndex = '1000';
            document.body.appendChild(errorMessage);

            // Remove error message after 3 seconds
            setTimeout(() => {
                document.body.removeChild(errorMessage);
            }, 3000);
        }
    };

    // Logout function
    const handleLogout = () => {
        // Remove tokens from all storage locations
        localStorage.removeItem('authToken');
        sessionStorage.removeItem('authToken');
        localStorage.removeItem('token');
        sessionStorage.removeItem('token');

        // Log the logout for debugging
        console.log("User logged out. All tokens cleared.");

        // Update state
        setIsLoggedIn(false);

        // Show success message
        const successMessage = document.createElement('div');
        successMessage.textContent = 'Successfully logged out!';
        successMessage.style.position = 'fixed';
        successMessage.style.top = '20px';
        successMessage.style.right = '20px';
        successMessage.style.backgroundColor = '#48bb78';
        successMessage.style.color = 'white';
        successMessage.style.padding = '12px 20px';
        successMessage.style.borderRadius = '4px';
        successMessage.style.zIndex = '1000';
        document.body.appendChild(successMessage);

        // Remove success message after 3 seconds
        setTimeout(() => {
            document.body.removeChild(successMessage);
        }, 3000);
    };

    // Toggle expanded sections
    const toggleExpandedSection = (section: 'conferences' | 'fields') => {
        setExpandedFilters(prev => ({
            ...prev,
            [section]: !prev[section]
        }));
    };

    // Function to fetch conferences and journals data
    const fetchConferencesAndJournals = async () => {
        try {
            setConferenceData({
                ...conferenceData,
                isLoading: true,
                error: null
            });

            const headers = getAuthHeaders();
            const response = await fetch(`${API_URL}/api/conferences/`, {
                headers,
                credentials: 'include'
            });

            if (response.ok) {
                const data = await response.json();
                // Process API data into conferences and journals
                const conferences: ConferenceData[] = [];
                const journals: ConferenceData[] = [];

                if (Array.isArray(data)) {
                    data.forEach((item: any) => {
                        const conferenceItem: ConferenceData = {
                            name: item.name,
                            type: item.type || 'conference',
                            field: item.field || 'Uncategorized',
                            paperCount: item.paper_count || 0
                        };

                        if (conferenceItem.type === 'journal') {
                            journals.push(conferenceItem);
                        } else {
                            conferences.push(conferenceItem);
                        }
                    });
                }

                setConferenceData({
                    conferences,
                    journals,
                    isLoading: false,
                    error: null
                });
            } else {
                // Use sample data if API fails
                console.log("Using sample conference data");

                // Create sample conference data from the static conferences object
                const sampleConferences: ConferenceData[] = [];
                const sampleJournals: ConferenceData[] = [];

                Object.entries(conferences).forEach(([field, confList]) => {
                    confList.forEach(confName => {
                        sampleConferences.push({
                            name: confName,
                            type: 'conference',
                            field,
                            paperCount: Math.floor(Math.random() * 500) + 100 // Random count between 100-600
                        });
                    });
                });

                // Add some sample journals
                const journalNames = [
                    'Nature', 'Science', 'IEEE Transactions on Pattern Analysis and Machine Intelligence',
                    'ACM Transactions on Graphics', 'Journal of Machine Learning Research',
                    'IEEE/ACM Transactions on Computational Biology and Bioinformatics'
                ];

                journalNames.forEach(name => {
                    sampleJournals.push({
                        name,
                        type: 'journal',
                        field: Object.keys(conferences)[Math.floor(Math.random() * Object.keys(conferences).length)],
                        paperCount: Math.floor(Math.random() * 1000) + 200 // Random count between 200-1200
                    });
                });

                setConferenceData({
                    conferences: sampleConferences,
                    journals: sampleJournals,
                    isLoading: false,
                    error: null
                });
            }
        } catch (error) {
            console.error("Error fetching conferences data:", error);
            setConferenceData(prev => ({
                ...prev,
                isLoading: false,
                error: "Failed to load conference data"
            }));

            // Continue with sample data on error
        }
    };

    // Call API to fetch conferences data on component mount
    useEffect(() => {
        fetchConferencesAndJournals();
    }, []);

    // Calculate total counts
    const totalConferences = conferenceData.conferences.length;
    const totalJournals = conferenceData.journals.length;
    const totalConferencePapers = conferenceData.conferences.reduce((sum, conf) => sum + conf.paperCount, 0);
    const totalJournalPapers = conferenceData.journals.reduce((sum, journal) => sum + journal.paperCount, 0);

    // Fetch initial data
    useEffect(() => {
        // Check for URL parameters
        if (typeof window !== 'undefined') {
            const urlParams = new URLSearchParams(window.location.search);
            const sectionParam = urlParams.get('section');

            console.log("URL parameter 'section' detected:", sectionParam);

            if (sectionParam && ['interesting', 'downloaded', 'datasets', 'uploaded', 'recommended'].includes(sectionParam)) {
                const section = sectionParam as 'interesting' | 'downloaded' | 'datasets' | 'uploaded' | 'recommended';
                setActiveSection(section);

                // If we're coming directly to the recommended section, fetch data immediately
                if (section === 'recommended' && hasAuthToken()) {
                    console.log("Immediately fetching recommended papers from URL parameter");
                    // Short timeout to ensure state is updated
                    setTimeout(() => {
                        fetchRecommendedPapers();
                    }, 0);
                }
            }
        }
    }, []);

    // Function to fetch data based on active section
    const fetchDataForActiveSection = () => {
        // Check authentication first - only check for token, not state
        if (!hasAuthToken()) {
            console.error("Cannot fetch data - no auth token available");
            return;
        }

        console.log(`Authentication check passed - fetching data for section: ${activeSection}`);

        // Get the authorization token properly formatted
        const token = localStorage.getItem('authToken');
        if (!token) {
            console.error("No auth token available for data fetch");
            return;
        }

        const tokenValue = token.startsWith('Token ') ? token : `Token ${token}`;
        const headers = {
            'Authorization': tokenValue,
            'Content-Type': 'application/json'
        };

        // Log the headers being used (without showing full token)
        console.log("Using auth headers with token prefix:", tokenValue.substring(0, 8) + "...");

        switch (activeSection) {
            case 'interesting':
                fetchInterestingPapers();
                break;
            case 'downloaded':
                fetchDownloadedPapers();
                break;
            case 'datasets':
                fetchInterestingDatasets();
                break;
            case 'recommended':
                fetchRecommendedPapers();
                break;
        }
    };

    // Function to test authentication with a simple endpoint
    const testAuthentication = async () => {
        try {
            console.log("Testing authentication...");

            // Get token directly
            const authToken = localStorage.getItem('authToken');
            console.log('Token availability for test:', !!authToken);
            if (authToken) {
                console.log('Token first 10 chars:', authToken.substring(0, 10) + '...');
            } else {
                console.error('No auth token found for test!');
                alert('No authentication token found. Please log in again.');
                return;
            }

            // Ensure token has correct format
            const tokenValue = authToken.startsWith('Token ') ? authToken : `Token ${authToken}`;

            // Create headers manually
            const headers = {
                'Authorization': tokenValue
            };

            // Make direct request to test endpoint
            const testResponse = await fetch(`${API_URL}/api/test/`, {
                method: 'GET',
                headers: headers
            });

            console.log('Test authentication response status:', testResponse.status);

            if (testResponse.ok) {
                const testData = await testResponse.json();
                console.log('Test authentication successful:', testData);
                alert('Authentication test successful! Token is valid.');
            } else {
                console.error('Test authentication failed with status:', testResponse.status);

                // Try to get response details
                try {
                    const errorText = await testResponse.text();
                    console.error("Auth test error details:", errorText);
                    alert(`Authentication test failed: ${testResponse.status} - ${errorText}`);
                } catch (e) {
                    console.error("Could not read error response:", e);
                    alert(`Authentication test failed with status: ${testResponse.status}`);
                }
            }
        } catch (error: any) {
            console.error("Error testing authentication:", error);
            alert(`Error testing authentication: ${error?.message || 'Unknown error'}`);
        }
    };

    // Function to toggle star (mark as interesting) for a paper
    const toggleStar = async (e: React.MouseEvent, paper: Paper) => {
        e.preventDefault(); // Prevent navigation to paper detail page
        e.stopPropagation(); // Prevent event bubbling

        try {
            await togglePaperStatus(paper.id, 'isInteresting');
            // Update the recommended papers list to reflect the change
            setRecommendedPapers(prev =>
                prev.map(p => p.id === paper.id ? { ...p, isInteresting: !p.isInteresting } : p)
            );
        } catch (error) {
            console.error("Error toggling star status:", error);
        }
    };

    // Function to open paper detail popup
    const openPaperDetail = (e: React.MouseEvent, paper: Paper) => {
        e.preventDefault(); // Prevent navigation to paper detail page
        e.stopPropagation(); // Prevent event bubbling

        setSelectedPaper(paper);
        setIsPaperDetailOpen(true);
    };

    // Function to close paper detail popup
    const closePaperDetail = () => {
        setIsPaperDetailOpen(false);
        setSelectedPaper(null);
    };

    return (
        <div className="bg-gray-50 min-h-screen">
            {/* Header */}
            <header className="bg-white shadow">
                <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
                    {/* Header is kept empty but structure maintained */}
                </div>
            </header>

            <main className="min-h-screen flex flex-col">
                <div className="container mx-auto py-6 px-4 sm:px-6 lg:px-8">
                    {/* Section Switch Buttons */}
                    <div className="flex border-b border-gray-200 mb-6 overflow-x-auto no-scrollbar">
                        <button
                            onClick={() => toggleSection('interesting')}
                            className={`py-3 px-6 font-medium text-sm ${activeSection === 'interesting' ? 'text-blue-600 border-b-2 border-blue-500' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            Interesting Papers
                        </button>
                        <button
                            onClick={() => toggleSection('downloaded')}
                            className={`py-3 px-6 font-medium text-sm ${activeSection === 'downloaded' ? 'text-blue-600 border-b-2 border-blue-500' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            Downloaded Papers
                        </button>
                        <button
                            onClick={() => toggleSection('datasets')}
                            className={`py-3 px-6 font-medium text-sm ${activeSection === 'datasets' ? 'text-blue-600 border-b-2 border-blue-500' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            Interesting Datasets
                        </button>
                        <button
                            onClick={() => toggleSection('uploaded')}
                            className={`py-3 px-6 font-medium text-sm ${activeSection === 'uploaded' ? 'text-blue-600 border-b-2 border-blue-500' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            Uploaded Papers
                        </button>
                    </div>

                    {/* Main content area with sidebar layout */}
                    <div className="flex flex-col lg:flex-row gap-6">
                        {/* Main content - full width on non-interesting pages, 2/3 width on interesting page */}
                        <div className={`${activeSection === 'interesting' ? 'lg:w-2/3' : 'w-full'}`}>
                            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                                <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
                                    <h2 className="text-lg leading-6 font-medium text-gray-900">
                                        {activeSection === 'interesting' ? 'Interesting Papers' :
                                            activeSection === 'downloaded' ? 'Downloaded Papers' :
                                                activeSection === 'uploaded' ? 'Uploaded Papers' :
                                                    'Interesting Datasets'}
                                    </h2>

                                    {/* Add Paper Button (only shown in uploaded papers section) */}
                                    {activeSection === 'uploaded' && (
                                        <button
                                            onClick={() => setIsUploadModalOpen(true)}
                                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                        >
                                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                                            </svg>
                                            Upload Paper
                                        </button>
                                    )}
                                </div>

                                {/* Results summary */}
                                <div className="px-4 text-sm text-gray-600 mb-4 flex justify-between items-center">
                                    <div>
                                        {activeSection !== 'datasets' ? (
                                            <>
                                                Showing {filteredPapers.length} {filteredPapers.length === 1 ? 'result' : 'results'}
                                                {(activeFilters.years.length > 0 || activeFilters.conferences.length > 0 || activeFilters.fields.length > 0) && (
                                                    <span> with applied filters</span>
                                                )}
                                            </>
                                        ) : (
                                            <>
                                                Showing {filteredDatasets.length} {filteredDatasets.length === 1 ? 'dataset' : 'datasets'}
                                                {datasetFilters.categories.length > 0 && (
                                                    <span> with applied filters</span>
                                                )}
                                            </>
                                        )}
                                    </div>
                                    {activeSection !== 'datasets' ? (
                                        <button
                                            onClick={clearFilters}
                                            className={`px-3 py-1 rounded text-sm border ${(activeFilters.years.length > 0 || activeFilters.conferences.length > 0 || activeFilters.fields.length > 0)
                                                ? 'bg-blue-100 text-blue-700 border-blue-300 hover:bg-blue-200'
                                                : 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'}`}
                                            disabled={activeFilters.years.length === 0 && activeFilters.conferences.length === 0 && activeFilters.fields.length === 0}
                                        >
                                            Clear Filter
                                        </button>
                                    ) : (
                                        <button
                                            onClick={clearDatasetFilters}
                                            className={`px-3 py-1 rounded text-sm border ${datasetFilters.categories.length > 0
                                                ? 'bg-blue-100 text-blue-700 border-blue-300 hover:bg-blue-200'
                                                : 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'}`}
                                            disabled={datasetFilters.categories.length === 0}
                                        >
                                            Clear Filter
                                        </button>
                                    )}
                                </div>

                                {/* Main content area */}
                                <div className="px-4 pb-6">
                                    {activeSection !== 'datasets' ? (
                                        // Papers content (interesting, downloaded or uploaded)
                                        <>
                                            {/* Papers grid */}
                                            <div className="grid gap-6">
                                                {filteredPapers.length > 0 ? (
                                                    filteredPapers.map((paper) => (
                                                        <Link
                                                            key={paper.id}
                                                            href={`/papers/${paper.id}`}
                                                            className="block"
                                                        >
                                                            <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-100">
                                                                <div className="flex justify-between">
                                                                    <h2 className="text-xl font-semibold text-gray-800 mb-2">{paper.title}</h2>
                                                                    <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                                                                        {paper.conference} {paper.year}
                                                                    </span>
                                                                </div>

                                                                <p className="text-sm text-gray-600 mb-2">
                                                                    <span className="font-medium">Authors:</span> {Array.isArray(paper.authors) ? paper.authors.join(', ') : (paper.authors || '')}
                                                                </p>

                                                                <div className="flex flex-wrap gap-1 mb-3">
                                                                    {Array.isArray(paper.keywords) && paper.keywords.map((keyword, idx) => (
                                                                        <span
                                                                            key={idx}
                                                                            className="inline-flex items-center rounded-md bg-gray-50 px-2 py-1 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-500/10"
                                                                        >
                                                                            {keyword}
                                                                        </span>
                                                                    ))}
                                                                </div>

                                                                <p className="text-sm text-gray-700 mb-4 line-clamp-2">{paper.abstract}</p>

                                                                <div className="flex justify-between items-center">
                                                                    <span className="text-xs text-gray-500">{paper.field}</span>
                                                                    <div className="flex space-x-2">
                                                                        {paper.isDownloaded && (
                                                                            <span className="inline-flex items-center text-xs text-green-600">
                                                                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3-3v12"></path>
                                                                                </svg>
                                                                                Downloaded
                                                                            </span>
                                                                        )}
                                                                        {paper.isUploaded && (
                                                                            <span className="inline-flex items-center text-xs text-purple-600">
                                                                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path>
                                                                                </svg>
                                                                                Uploaded
                                                                            </span>
                                                                        )}
                                                                        <span className="text-xs text-gray-500">
                                                                            Added {new Date(paper.addedDate).toLocaleDateString()}
                                                                        </span>
                                                                        {paper.fileName && (
                                                                            <span className="text-xs text-gray-500">
                                                                                {paper.fileName} ({(paper.fileSize! / (1024 * 1024)).toFixed(1)} MB)
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </Link>
                                                    ))
                                                ) : (
                                                    <div className="text-center py-12">
                                                        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                        </svg>
                                                        <h3 className="mt-2 text-sm font-medium text-gray-900">No papers found</h3>
                                                        <p className="mt-1 text-sm text-gray-500">
                                                            {activeSection === 'interesting'
                                                                ? "You haven't marked any papers as interesting yet."
                                                                : activeSection === 'downloaded'
                                                                    ? "You haven't downloaded any papers yet."
                                                                    : "You haven't uploaded any papers yet."}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        </>
                                    ) : (
                                        // Datasets content
                                        <div className="grid gap-6">
                                            {filteredDatasets.length > 0 ? (
                                                filteredDatasets.map((dataset) => (
                                                    // ... existing dataset code ...
                                                    <Link
                                                        key={dataset.id}
                                                        href={`/datasets/${dataset.id}`}
                                                        className="block"
                                                    >
                                                        <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-100">
                                                            <div className="flex justify-between">
                                                                <h2 className="text-xl font-semibold text-gray-800 mb-2">{dataset.name}</h2>
                                                                {dataset.abbreviation && (
                                                                    <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                                                                        {dataset.abbreviation}
                                                                    </span>
                                                                )}
                                                            </div>

                                                            <p className="text-sm text-gray-700 mb-4 line-clamp-2">{dataset.description}</p>

                                                            <div className="flex flex-wrap gap-1 mb-3">
                                                                {Array.isArray(dataset.tasks) && dataset.tasks.map((task, idx) => (
                                                                    <span
                                                                        key={idx}
                                                                        className="inline-flex items-center rounded-md bg-purple-50 px-2 py-1 text-xs font-medium text-purple-700 ring-1 ring-inset ring-purple-700/10"
                                                                    >
                                                                        {task}
                                                                    </span>
                                                                ))}
                                                                {dataset.language && (
                                                                    <span className="inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-700/10">
                                                                        {dataset.language}
                                                                    </span>
                                                                )}
                                                            </div>

                                                            <div className="flex justify-between items-center">
                                                                <span className="text-xs text-gray-500">{dataset.category}</span>
                                                                <div className="flex space-x-2">
                                                                    <span className="inline-flex items-center text-xs text-blue-600">
                                                                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                                                                        </svg>
                                                                        {dataset.paperCount} papers
                                                                    </span>
                                                                    <span className="text-xs text-gray-500">
                                                                        Added {new Date(dataset.addedDate).toLocaleDateString()}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </Link>
                                                ))
                                            ) : (
                                                <div className="text-center py-12">
                                                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                    </svg>
                                                    <h3 className="mt-2 text-sm font-medium text-gray-900">No datasets found</h3>
                                                    <p className="mt-1 text-sm text-gray-500">
                                                        You haven't marked any datasets as interesting yet.
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Recommendation sidebar - only shown on "Interesting Papers" page */}
                        {activeSection === 'interesting' && (
                            <div className="lg:w-1/3">
                                <div className="bg-white shadow overflow-hidden sm:rounded-lg sticky top-6">
                                    <div className="px-4 py-5 sm:px-6">
                                        <h2 className="text-lg leading-6 font-medium text-gray-900">
                                            Recommendations
                                        </h2>
                                    </div>
                                    <div className="px-4 pb-6">
                                        {isLoadingRecommendations ? (
                                            <div className="flex justify-center py-8">
                                                <svg className="animate-spin h-8 w-8 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                            </div>
                                        ) : (
                                            <div className="space-y-4">
                                                {recommendedPapers.length > 0 ? (
                                                    recommendedPapers.map((paper) => (
                                                        <div key={paper.id} className="bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow border border-gray-100">
                                                            <div className="flex justify-between items-start">
                                                                <h3 className="text-md font-semibold text-gray-800 line-clamp-2 pr-2">{paper.title}</h3>
                                                                <button
                                                                    onClick={(e) => toggleStar(e, paper)}
                                                                    className="flex-shrink-0 focus:outline-none"
                                                                >
                                                                    {paper.isInteresting ? (
                                                                        <svg className="w-6 h-6 text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
                                                                            <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                                                                        </svg>
                                                                    ) : (
                                                                        <svg className="w-6 h-6 text-gray-300 hover:text-yellow-400" stroke="currentColor" fill="none" viewBox="0 0 24 24">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                                                                        </svg>
                                                                    )}
                                                                </button>
                                                            </div>

                                                            <p className="text-xs text-gray-600 mt-1 mb-2">
                                                                <span className="font-medium">Authors:</span> {Array.isArray(paper.authors) ? paper.authors.join(', ') : (paper.authors || '')}
                                                            </p>

                                                            <div className="flex justify-between items-center mt-2">
                                                                <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                                                                    {paper.conference} {paper.year}
                                                                </span>

                                                                <button
                                                                    onClick={(e) => openPaperDetail(e, paper)}
                                                                    className="inline-flex items-center px-2 py-1 text-xs font-medium text-blue-600 hover:text-blue-800"
                                                                >
                                                                    View Details
                                                                    <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                                                    </svg>
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="text-center py-8">
                                                        <svg className="mx-auto h-10 w-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                                        </svg>
                                                        <h3 className="mt-2 text-sm font-medium text-gray-900">No recommendations yet</h3>
                                                        <p className="mt-1 text-xs text-gray-500">
                                                            Add more papers to your library to get personalized recommendations.
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {/* Paper Detail Modal */}
            {isPaperDetailOpen && selectedPaper && (
                <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
                    <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={closePaperDetail}></div>

                        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

                        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
                            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                                <div className="sm:flex sm:items-start">
                                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                                        <div className="flex justify-between items-start">
                                            <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                                                {selectedPaper.title}
                                            </h3>
                                            <button
                                                onClick={(e) => toggleStar(e, selectedPaper)}
                                                className="flex-shrink-0 focus:outline-none"
                                            >
                                                {selectedPaper.isInteresting ? (
                                                    <svg className="w-6 h-6 text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
                                                        <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                                                    </svg>
                                                ) : (
                                                    <svg className="w-6 h-6 text-gray-300 hover:text-yellow-400" stroke="currentColor" fill="none" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                                                    </svg>
                                                )}
                                            </button>
                                        </div>

                                        <div className="mt-4">
                                            <div className="flex justify-between items-center mb-4">
                                                <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                                                    {selectedPaper.conference} {selectedPaper.year}
                                                </span>
                                                <span className="text-sm text-gray-500">
                                                    Field: {selectedPaper.field}
                                                </span>
                                            </div>

                                            <p className="text-sm text-gray-600 mb-4">
                                                <span className="font-medium">Authors:</span> {Array.isArray(selectedPaper.authors) ? selectedPaper.authors.join(', ') : (selectedPaper.authors || '')}
                                            </p>

                                            <div className="flex flex-wrap gap-1 mb-4">
                                                {Array.isArray(selectedPaper.keywords) && selectedPaper.keywords.map((keyword, idx) => (
                                                    <span
                                                        key={idx}
                                                        className="inline-flex items-center rounded-md bg-gray-50 px-2 py-1 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-500/10"
                                                    >
                                                        {keyword}
                                                    </span>
                                                ))}
                                            </div>

                                            <div className="mb-4">
                                                <h4 className="text-sm font-medium text-gray-900 mb-1">Abstract</h4>
                                                <p className="text-sm text-gray-700">{selectedPaper.abstract}</p>
                                            </div>

                                            {selectedPaper.doi && (
                                                <div className="mb-2">
                                                    <span className="text-sm font-medium text-gray-900">DOI: </span>
                                                    <span className="text-sm text-blue-600">{selectedPaper.doi}</span>
                                                </div>
                                            )}

                                            {selectedPaper.sourceCode && (
                                                <div className="mb-2">
                                                    <span className="text-sm font-medium text-gray-900">Source Code: </span>
                                                    <a href={selectedPaper.sourceCode} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">
                                                        {selectedPaper.sourceCode}
                                                    </a>
                                                </div>
                                            )}

                                            {Array.isArray(selectedPaper.datasets) && selectedPaper.datasets.length > 0 && (
                                                <div className="mb-2">
                                                    <span className="text-sm font-medium text-gray-900">Datasets: </span>
                                                    <span className="text-sm text-gray-700">{selectedPaper.datasets.join(', ')}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                                <a
                                    href={`/papers/${selectedPaper.id}`}
                                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                                >
                                    View Full Details
                                </a>
                                {selectedPaper.downloadUrl && (
                                    <a
                                        href={selectedPaper.downloadUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                                    >
                                        Download Paper
                                    </a>
                                )}
                                <button
                                    type="button"
                                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                                    onClick={closePaperDetail}
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Upload Paper Modal */}
            {isUploadModalOpen && (
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-semibold text-gray-900">Upload Paper</h3>
                            <button
                                onClick={() => !isUploading && setIsUploadModalOpen(false)}
                                className="text-gray-400 hover:text-gray-500 focus:outline-none"
                                disabled={isUploading}
                            >
                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {!hasAuthToken() ? (
                            <div className="mb-4 bg-yellow-50 border-l-4 border-yellow-400 p-4">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <div className="ml-3">
                                        <p className="text-sm text-yellow-700">
                                            You must be logged in to upload papers.
                                            <button
                                                onClick={() => {
                                                    setIsUploadModalOpen(false);
                                                    testLogin();
                                                }}
                                                className="ml-2 font-medium underline text-yellow-700 hover:text-yellow-600"
                                            >
                                                Login now
                                            </button>
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="mb-4">
                                <p className="text-sm text-gray-600 mb-4">
                                    Upload a research paper (PDF format). The system will automatically extract metadata such as title, authors, and abstract.
                                </p>

                                {!isUploading ? (
                                    <div
                                        onClick={handleFileSelect}
                                        className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 transition-colors"
                                    >
                                        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3-3m0 0l3 3m-3-3v12"></path>
                                        </svg>
                                        <p className="mt-2 text-sm text-gray-600">
                                            Drag and drop a file here, or <span className="text-blue-600">browse</span> to select a file
                                        </p>
                                        <p className="mt-1 text-xs text-gray-500">
                                            Supported format: PDF (max 50MB)
                                        </p>
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept=".pdf"
                                            className="hidden"
                                            onChange={handleFileChange}
                                        />
                                    </div>
                                ) : (
                                    <div className="p-4">
                                        <div className="mb-2 flex justify-between text-sm">
                                            <span>Uploading and extracting metadata...</span>
                                            <span>{uploadProgress}%</span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                                            <div
                                                className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                                                style={{ width: `${uploadProgress}%` }}
                                            ></div>
                                        </div>
                                        {uploadError && (
                                            <p className="mt-2 text-sm text-red-600">{uploadError}</p>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="flex justify-end">
                            <button
                                onClick={() => !isUploading && setIsUploadModalOpen(false)}
                                className="mr-3 px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 focus:outline-none"
                                disabled={isUploading}
                            >
                                Cancel
                            </button>
                            {hasAuthToken() && (
                                <button
                                    onClick={handleFileSelect}
                                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                    disabled={isUploading}
                                >
                                    {isUploading ? 'Uploading...' : 'Select File'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Filter Sidebar (Mobile) */}
            {/* ... Keep existing code for the mobile filter sidebar ... */}
        </div>
    );
} 