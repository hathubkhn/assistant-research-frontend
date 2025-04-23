"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import InterestingButton from "@/components/InterestingButton";

interface CitationData {
    year: number;
    count: number;
}

interface CitingPaper {
    id: string;
    title: string;
    authors: string[];
    year: number;
}

interface Paper {
    id: string;
    title: string;
    authors: string[];
    conference?: string;
    venue?: string;
    venueType?: 'conference' | 'journal';
    year: number;
    field: string;
    keywords: string[];
    abstract: string;
    downloadUrl: string;
    method?: string;
    results?: string;
    conclusions?: string;
    citingPapers?: CitingPaper[];
    references?: string[];
    doi?: string;         // DOI identifier for the paper
    bibtex?: string;      // BibTeX citation format
    sourceCode?: string;  // Link to source code repository
    impactFactor?: number;
    quartile?: 'Q1' | 'Q2' | 'Q3' | 'Q4';
    citationsByYear?: CitationData[];
    datasets?: {
        id: string;
        name: string;
        abbreviation?: string;
        description: string;
        category?: string;
        data_type?: string;
        size?: string;
        format?: string;
        source_url?: string;
        license?: string;
    }[];  // Datasets used in the paper
    isInteresting?: boolean;
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

export default function PaperDetailsClient({ slug }: { slug: string }) {
    const router = useRouter();
    const [paper, setPaper] = useState<Paper | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showBibtexModal, setShowBibtexModal] = useState(false);

    useEffect(() => {
        const fetchPaper = async () => {
            try {
                setLoading(true);
                if (!slug) {
                    throw new Error('Invalid paper identifier');
                }

                const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
                let response;

                // API đã được cải thiện để xử lý cả ID và slug từ tiêu đề
                response = await fetch(`${apiUrl}/api/papers/by-slug/${slug}/`);

                if (!response.ok) {
                    if (response.status === 404) {
                        throw new Error('Paper not found');
                    }
                    throw new Error('Failed to fetch paper details');
                }

                const data = await response.json();
                setPaper(data);
                setError(null);
            } catch (err) {
                console.error('Error fetching paper:', err);
                setError(err instanceof Error ? err.message : 'An error occurred');
                setPaper(null);
            } finally {
                setLoading(false);
            }
        };

        fetchPaper();
    }, [slug]);

    const copyBibtex = () => {
        if (paper?.bibtex) {
            navigator.clipboard.writeText(paper.bibtex);
            // Here you could add a toast notification
        }
    };

    if (loading) {
        return (
            <div className="container mx-auto p-6 flex justify-center items-center min-h-screen">
                <div className="animate-pulse flex flex-col w-full max-w-3xl">
                    <div className="h-10 bg-gray-200 rounded w-3/4 mb-4"></div>
                    <div className="h-6 bg-gray-200 rounded w-1/2 mb-8"></div>
                    <div className="h-40 bg-gray-200 rounded mb-6"></div>
                    <div className="grid grid-cols-1 gap-4">
                        <div className="h-24 bg-gray-200 rounded"></div>
                        <div className="h-72 bg-gray-200 rounded"></div>
                        <div className="h-36 bg-gray-200 rounded"></div>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="container mx-auto p-6">
                <div className="flex justify-between items-center mb-6">
                    <button
                        onClick={() => router.push('/papers')}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 inline-flex items-center"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                        </svg>
                        Back to Papers
                    </button>
                </div>
                <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4">
                    <h2 className="text-xl font-semibold">Error</h2>
                    <p>{error}</p>
                </div>
            </div>
        );
    }

    if (!paper) {
        return (
            <div className="container mx-auto p-6">
                <div className="flex justify-between items-center mb-6">
                    <button
                        onClick={() => router.push('/papers')}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 inline-flex items-center"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                        </svg>
                        Back to Papers
                    </button>
                </div>
                <div className="text-center py-12">
                    <h2 className="text-2xl font-semibold text-gray-700">Paper not found</h2>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-6">
            {/* BibTeX Modal */}
            {showBibtexModal && paper?.bibtex && (
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full m-4">
                        <div className="flex justify-between items-center p-4 border-b">
                            <h3 className="text-lg font-semibold">BibTeX Citation</h3>
                            <button
                                onClick={() => setShowBibtexModal(false)}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <div className="p-4">
                            <pre className="bg-gray-50 p-4 rounded-lg overflow-x-auto text-sm font-mono whitespace-pre-wrap break-words">
                                {paper.bibtex}
                            </pre>
                            <div className="mt-4 flex justify-end">
                                <button
                                    onClick={copyBibtex}
                                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 inline-flex items-center"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                        <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                                        <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                                    </svg>
                                    Copy to Clipboard
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex justify-between items-center mb-6">
                <button
                    onClick={() => router.push('/papers')}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 inline-flex items-center"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                    </svg>
                    Back to Papers
                </button>

                <div className="flex space-x-2">
                    {/* Interesting button */}
                    {paper && (
                        <InterestingButton
                            paperId={paper.id}
                            className="px-4 py-2 text-yellow-500 bg-white border border-yellow-500 rounded hover:bg-yellow-50 inline-flex items-center"
                            initialState={paper.isInteresting || false}
                        />
                    )}

                    {/* Download Paper button */}
                    <a
                        href={paper?.downloadUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 inline-flex items-center"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                        Download Paper
                    </a>
                </div>
            </div>

            <div className="bg-white shadow rounded-lg overflow-hidden">
                {/* Paper Title and Authors */}
                <div className="p-6 border-b">
                    <div className="flex-grow">
                        <h1 className="text-3xl font-bold text-gray-900">{paper.title}</h1>
                        <div className="mt-4 space-y-2">
                            <p className="text-xl text-gray-600">
                                {paper.authors.join(", ")}
                            </p>
                            <div className="flex flex-wrap gap-2 mt-2">
                                {paper.keywords.map((keyword, index) => (
                                    <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                                        {keyword}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Publication Details */}
                <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4 border-b bg-gray-50">
                    <div className="col-span-1">
                        <h3 className="text-sm font-medium text-gray-500">{paper.venueType === 'journal' ? 'Journal' : 'Conference'}</h3>
                        <p className="mt-1 text-sm text-gray-900">{paper.venue || paper.conference}</p>
                    </div>
                    <div className="col-span-1">
                        <h3 className="text-sm font-medium text-gray-500">Year</h3>
                        <p className="mt-1 text-sm text-gray-900">{paper.year}</p>
                    </div>
                    <div className="col-span-1">
                        <h3 className="text-sm font-medium text-gray-500">Field</h3>
                        <p className="mt-1 text-sm text-gray-900">{paper.field}</p>
                    </div>
                    {paper.doi && (
                        <div className="col-span-1">
                            <h3 className="text-sm font-medium text-gray-500">DOI</h3>
                            <p className="mt-1 text-sm text-gray-900">
                                <a
                                    href={`https://doi.org/${paper.doi}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:underline"
                                >
                                    {paper.doi}
                                </a>
                            </p>
                        </div>
                    )}
                    {paper.bibtex && (
                        <div className="col-span-1">
                            <h3 className="text-sm font-medium text-gray-500">BibTeX</h3>
                            <p className="mt-1 text-sm text-gray-900">
                                <button
                                    onClick={() => setShowBibtexModal(true)}
                                    className="text-blue-600 hover:underline inline-flex items-center"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                        <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                                        <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                                    </svg>
                                    View & Copy Citation
                                </button>
                            </p>
                        </div>
                    )}
                    {paper.sourceCode && (
                        <div className="col-span-1">
                            <h3 className="text-sm font-medium text-gray-500">Source Code</h3>
                            <p className="mt-1 text-sm text-gray-900">
                                <a
                                    href={paper.sourceCode}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:underline inline-flex items-center"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                                    </svg>
                                    GitHub Repository
                                </a>
                            </p>
                        </div>
                    )}
                    {paper.impactFactor && (
                        <div className="col-span-1">
                            <h3 className="text-sm font-medium text-gray-500">Impact Factor</h3>
                            <p className="mt-1 text-sm text-gray-900">{paper.impactFactor.toFixed(2)}</p>
                        </div>
                    )}
                    {paper.quartile && (
                        <div className="col-span-1">
                            <h3 className="text-sm font-medium text-gray-500">Quartile</h3>
                            <p className="mt-1 text-sm text-gray-900">{paper.quartile}</p>
                        </div>
                    )}
                </div>

                {/* Abstract */}
                <div className="p-6 border-b">
                    <h2 className="text-2xl font-semibold mb-4">Abstract</h2>
                    <p className="text-gray-700 leading-relaxed">{paper.abstract}</p>
                </div>

                {/* Datasets */}
                <div className="p-6 border-b">
                    <h2 className="text-2xl font-semibold mb-4">Datasets</h2>
                    <div className="space-y-4">
                        {paper.datasets && paper.datasets.length > 0 ? (
                            paper.datasets.map((dataset, idx) => (
                                <div key={idx} className="border border-gray-200 rounded-md p-4">
                                    <h3 className="font-medium text-lg">
                                        <span
                                            className="cursor-pointer text-blue-600 hover:text-blue-800 hover:underline"
                                            onClick={() => router.push(`/datasets/${dataset.id}`)}
                                        >
                                            {dataset.name} {dataset.abbreviation && `(${dataset.abbreviation})`}
                                        </span>
                                    </h3>

                                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {dataset.size && (
                                            <div>
                                                <h4 className="text-sm font-medium text-gray-500">Size</h4>
                                                <p className="text-sm">{dataset.size}</p>
                                            </div>
                                        )}
                                        {dataset.license && (
                                            <div>
                                                <h4 className="text-sm font-medium text-gray-500">License</h4>
                                                <p className="text-sm">{dataset.license}</p>
                                            </div>
                                        )}
                                    </div>

                                    {dataset.source_url && (
                                        <div className="mt-3">
                                            <a
                                                href={dataset.source_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-blue-600 hover:text-blue-800 text-sm inline-flex items-center"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                                </svg>
                                                Download Dataset
                                            </a>
                                        </div>
                                    )}
                                </div>
                            ))
                        ) : (
                            <p className="text-gray-500">No dataset information available.</p>
                        )}
                    </div>
                </div>

                {/* Citation Metrics Section */}
                <div className="bg-white shadow-md rounded-lg p-6 mb-6">
                    <h2 className="text-xl font-semibold mb-4">Citation Metrics</h2>

                    {paper.citationsByYear && paper.citationsByYear.length > 0 ? (
                        <div className="h-80">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={paper.citationsByYear.map(item => ({
                                        year: item.year.toString(),
                                        citations: item.count
                                    }))}
                                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="year" />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Bar dataKey="citations" fill="#8884d8" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <p className="text-gray-500">No citation data available for this paper.</p>
                    )}
                </div>

                {/* Method */}
                <div className="p-6 border-b">
                    <h2 className="text-2xl font-semibold mb-4">Method</h2>
                    <div className="prose max-w-none text-gray-700 leading-relaxed">
                        {paper.method?.split('\n\n').map((paragraph, idx) => (
                            <p key={idx} className="mb-4">{paragraph}</p>
                        )) || <p>No method information available.</p>}
                    </div>
                </div>

                {/* Results */}
                <div className="p-6 border-b">
                    <h2 className="text-2xl font-semibold mb-4">Results</h2>
                    <div className="prose max-w-none text-gray-700 leading-relaxed">
                        {paper.results?.split('\n\n').map((paragraph, idx) => (
                            <p key={idx} className="mb-4">{paragraph}</p>
                        )) || <p>No results information available.</p>}
                    </div>
                </div>

                {/* Conclusions */}
                <div className="p-6 border-b">
                    <h2 className="text-2xl font-semibold mb-4">Conclusions</h2>
                    <div className="prose max-w-none text-gray-700 leading-relaxed">
                        {paper.conclusions?.split('\n\n').map((paragraph, idx) => (
                            <p key={idx} className="mb-4">{paragraph}</p>
                        )) || <p>No conclusions information available.</p>}
                    </div>
                </div>

                {/* Citing Papers */}
                <div className="p-6 border-b">
                    <h2 className="text-2xl font-semibold mb-4">Citing Papers</h2>
                    <div className="space-y-4">
                        {paper.citingPapers && paper.citingPapers.length > 0 ? (
                            paper.citingPapers.map((citingPaper, idx) => (
                                <div key={idx} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                                    <h3 className="text-lg font-medium text-blue-600 hover:underline cursor-pointer"
                                        onClick={() => router.push(`/papers/${citingPaper.id}`)}>
                                        {citingPaper.title}
                                    </h3>
                                    <p className="text-sm text-gray-600 mt-1">
                                        {citingPaper.authors.join(", ")} ({citingPaper.year})
                                    </p>
                                </div>
                            ))
                        ) : (
                            <p className="text-gray-600">No citing papers found.</p>
                        )}
                    </div>
                </div>

                {/* References */}
                <div className="p-6 border-b">
                    <h2 className="text-2xl font-semibold mb-4">References</h2>
                    {paper.references && paper.references.length > 0 ? (
                        <ul className="list-decimal pl-5 space-y-2">
                            {paper.references.map((reference, idx) => (
                                <li key={idx} className="text-gray-700">{reference}</li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-gray-600">No references found.</p>
                    )}
                </div>
            </div>
        </div>
    );
} 