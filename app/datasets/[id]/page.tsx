'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import InterestingDatasetButton from '../../../components/InterestingDatasetButton';

interface Dataset {
    id: string;
    name: string;
    abbreviation: string;
    description: string;
    downloadUrl: string;
    paperCount: number;
    language: string;
    category: string;
    tasks: string;
    thumbnailUrl?: string;
    benchmarks: number;
    isStarred: boolean;
}

interface Paper {
    id: string;
    title: string;
    authors: string;
    conference: string;
    year: number;
}

export default function DatasetDetailPage() {
    const params = useParams();
    const id = params.id as string;

    const [dataset, setDataset] = useState<Dataset | null>(null);
    const [relatedPapers, setRelatedPapers] = useState<Paper[]>([]);
    const [similarDatasets, setSimilarDatasets] = useState<Dataset[]>([]);
    const [loading, setLoading] = useState(true);
    const [isStarred, setIsStarred] = useState(false);

    // Get auth token from local storage
    const getAuthHeaders = () => {
        if (typeof window === 'undefined') return {
            'Content-Type': 'application/json'
        };

        // Try to get token from various storage locations
        let authToken = localStorage.getItem('authToken') ||
            sessionStorage.getItem('authToken') ||
            localStorage.getItem('token') ||
            sessionStorage.getItem('token');

        // If token already has 'Token ' prefix, remove it to avoid duplication
        if (authToken && authToken.startsWith('Token ')) {
            authToken = authToken.substring(6);
        }

        // Return headers with or without Authorization
        return {
            'Authorization': authToken ? `Token ${authToken}` : '',
            'Content-Type': 'application/json'
        };
    };

    // Fetch dataset details and check if it's already starred
    useEffect(() => {
        const fetchDatasetDetails = async () => {
            try {
                console.log(`Attempting to fetch dataset with ID: ${id}`);
                const response = await fetch(`http://localhost:8000/api/datasets/${id}/`);

                if (response.status === 404) {
                    console.error(`Dataset not found with ID: ${id}`);
                    console.error('Please check the PostgreSQL database to ensure this dataset exists');
                    setLoading(false);
                    return;
                }

                if (response.ok) {
                    const data = await response.json();
                    if (data.dataset) {
                        console.log(`Successfully found dataset: ${data.dataset.name}`);
                        setDataset(data.dataset);
                        setRelatedPapers(data.relatedPapers || []);
                        setSimilarDatasets(data.similarDatasets || []);

                        // Check if this dataset is already starred
                        if (data.dataset.isStarred) {
                            setIsStarred(true);
                        }
                    } else {
                        console.error('Dataset response is missing dataset data');
                        setLoading(false);
                    }
                } else {
                    console.error(`Error fetching dataset details: ${response.status} ${response.statusText}`);
                }
            } catch (error) {
                console.error('Error fetching dataset details:', error);
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchDatasetDetails();
        }
    }, [id]);

    if (loading) {
        return (
            <div className="container mx-auto px-4 py-8 flex justify-center items-center min-h-[60vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!dataset) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
                    <p>Dataset not found. Please check the URL and try again.</p>
                </div>
            </div>
        );
    }

    // Parse tasks from JSON string
    let tasks = [];
    if (dataset.tasks) {
        try {
            tasks = JSON.parse(dataset.tasks);
        } catch (error) {
            // If JSON parsing fails, treat tasks as a comma-separated string
            if (typeof dataset.tasks === 'string') {
                tasks = dataset.tasks.split(',').map(task => task.trim());
            } else if (Array.isArray(dataset.tasks)) {
                tasks = dataset.tasks;
            } else {
                tasks = [];
            }
        }
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="mb-4 flex justify-between items-center">
                <Link href="/datasets" className="text-blue-600 hover:text-blue-800 flex items-center gap-1">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Back to Datasets
                </Link>
                <InterestingDatasetButton
                    datasetId={dataset.id}
                    initialState={isStarred}
                    className="p-2 text-yellow-500 hover:text-yellow-600"
                    onToggle={(newState) => setIsStarred(newState)}
                />
            </div>

            <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
                <div className="flex flex-col md:flex-row">
                    {/* Dataset image/logo */}
                    <div className="md:w-1/4 bg-gray-100 p-6 flex items-center justify-center">
                        <div className="w-full h-48 bg-gray-200 rounded-lg flex items-center justify-center">
                            {dataset.abbreviation && (
                                <img
                                    src={`/images/datasets/${dataset.abbreviation.toLowerCase().replace(/-/g, '')}.png`}
                                    alt={dataset.abbreviation}
                                    className="max-w-full max-h-full object-contain"
                                    onError={(e) => {
                                        const target = e.target as HTMLImageElement;
                                        target.onerror = null;
                                        target.style.display = 'none';
                                        const parent = target.parentElement;
                                        if (parent) {
                                            parent.innerHTML = `<div class="text-3xl font-bold text-gray-400">${dataset.abbreviation}</div>`;
                                        }
                                    }}
                                />
                            )}
                        </div>
                    </div>

                    {/* Dataset info */}
                    <div className="md:w-3/4 p-6">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-gray-500 text-lg">{dataset.abbreviation}</p>
                            </div>
                            <a
                                href={dataset.downloadUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center gap-2"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                                Download
                            </a>
                        </div>

                        <p className="mt-4 text-gray-700">{dataset.description}</p>

                        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-gray-50 p-4 rounded-md">
                                <h3 className="text-sm font-medium text-gray-500 uppercase">Category</h3>
                                <p className="mt-1 font-medium">{dataset.category}</p>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-md">
                                <h3 className="text-sm font-medium text-gray-500 uppercase">Language</h3>
                                <p className="mt-1 font-medium">{dataset.language}</p>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-md">
                                <h3 className="text-sm font-medium text-gray-500 uppercase">Papers</h3>
                                <p className="mt-1 font-medium">{dataset.paperCount}</p>
                            </div>
                        </div>

                        <div className="mt-6">
                            <h3 className="text-lg font-semibold mb-2">Tasks</h3>
                            <div className="flex flex-wrap gap-2">
                                {tasks.map((task: string, index: number) => (
                                    <span key={index} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                                        {task}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Related Papers Section */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                <h2 className="text-2xl font-bold text-blue-900 mb-4">Related Papers</h2>
                {relatedPapers.length > 0 ? (
                    <div className="space-y-4">
                        {relatedPapers.map(paper => (
                            <div key={paper.id} className="border border-gray-200 rounded-md p-4 hover:bg-gray-50">
                                <h3 className="font-medium text-lg">
                                    <Link href={`/papers/${paper.id}`} className="text-blue-600 hover:text-blue-800">
                                        {paper.title}
                                    </Link>
                                </h3>
                                <p className="text-gray-600 mt-1">{paper.authors}</p>
                                <div className="flex items-center mt-2 text-sm text-gray-500">
                                    <span>{paper.conference}</span>
                                    <span className="mx-2">•</span>
                                    <span>{paper.year}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-gray-600">No papers found using this dataset.</p>
                )}
            </div>

            {/* Similar Datasets Section */}
            <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-2xl font-bold text-blue-900 mb-4">Similar Datasets</h2>
                {similarDatasets.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {similarDatasets.map(ds => (
                            <Link
                                key={ds.id}
                                href={`/datasets/${ds.id}`}
                                className="border border-gray-200 rounded-md p-4 hover:bg-gray-50 flex items-start gap-3"
                            >
                                <div className="w-12 h-12 bg-gray-100 rounded-md flex items-center justify-center flex-shrink-0">
                                    {ds.abbreviation && (
                                        <div className="text-lg font-bold text-gray-400">{ds.abbreviation}</div>
                                    )}
                                </div>
                                <div>
                                    <h3 className="font-medium text-blue-600">{ds.name}</h3>
                                    <p className="text-gray-600 text-sm mt-1 line-clamp-2">{ds.description}</p>
                                </div>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <p className="text-gray-600">No similar datasets found.</p>
                )}
            </div>
        </div>
    );
} 