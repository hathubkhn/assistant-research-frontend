'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useTranslation } from '../../utils/useTranslation';

// The API URL with a fallback to localhost
const RESEARCH_ASSISTANT_API_URL = process.env.NEXT_PUBLIC_RESEARCH_API_URL || 'http://localhost:8090';

// Add function to check if the API is available
const checkApiAvailability = async () => {
    try {
        const response = await fetch(`${RESEARCH_ASSISTANT_API_URL}/health`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            // Add a timeout to avoid long waits
            signal: AbortSignal.timeout(3000)
        });
        return response.ok;
    } catch (error) {
        console.error('API health check failed:', error);
        return false;
    }
};

interface Paper {
    paper_id: string;
    title: string;
    abstract: string;
    keywords: string[];
    score: number;
    user_id: string;
}

interface QueryResponse {
    query: string;
    answer: string;
    papers: Paper[];
    using_fallback?: boolean;
}

export default function ResearchAssistant() {
    const { t } = useTranslation('research-assistant');
    const [query, setQuery] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [response, setResponse] = useState<QueryResponse | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'search' | 'sources'>('search');
    const [apiStatus, setApiStatus] = useState<'unknown' | 'connected' | 'disconnected'>('unknown');
    const [isCheckingConnection, setIsCheckingConnection] = useState(false);

    // Function to check API connection
    const checkConnection = async () => {
        setIsCheckingConnection(true);
        try {
            const isAvailable = await checkApiAvailability();
            setApiStatus(isAvailable ? 'connected' : 'disconnected');
        } catch (err) {
            setApiStatus('disconnected');
        } finally {
            setIsCheckingConnection(false);
        }
    };

    // Check connection on initial load
    useEffect(() => {
        checkConnection();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim()) return;

        setIsLoading(true);
        setError(null);

        try {
            // Check if the API is available first
            const isApiAvailable = await checkApiAvailability();

            if (!isApiAvailable) {
                throw new Error('Research Assistant API is currently unavailable. Please check if the service is running.');
            }

            // Directly connect to the FastAPI backend service
            console.log('Sending request to:', `${RESEARCH_ASSISTANT_API_URL}/query`);
            const response = await fetch(`${RESEARCH_ASSISTANT_API_URL}/query`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    query,
                    // Optional user_id for filtering (can be added later)
                }),
            });

            console.log('Response status:', response.status);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Error response:', errorText);
                throw new Error(`Error: ${response.status} - ${errorText}`);
            }

            const data = await response.json();
            console.log('Research assistant response data:', JSON.stringify(data, null, 2));

            // Check that the data has the expected structure
            if (!data.answer) {
                console.error('Invalid response format:', data);
                throw new Error('The API response is missing the expected answer field');
            }

            if (data.papers && !Array.isArray(data.papers)) {
                console.error('Invalid papers array:', data.papers);
                data.papers = []; // Ensure we have an array even if the API returns something unexpected
            }

            setResponse(data);
        } catch (err) {
            console.error('Error querying research assistant:', err);
            // Provide more specific error messages
            if (err instanceof Error) {
                setError(`Failed to get response: ${err.message}`);
            } else {
                setError('Failed to get response. Please try again.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    // Check if the response appears to be from fallback mode
    const isUsingFallback = response?.using_fallback ||
        (response?.answer && response.answer.includes("This is a summary based on the semantic search results")) ||
        (response?.answer && response.answer.includes("OpenAI API is currently unavailable"));

    return (
        <div className="bg-gray-100 min-h-screen text-gray-900 p-6">
            <div className="max-w-4xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-4xl font-bold text-[#d9363e]">{t('title')}</h1>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center text-sm">
                            <span className="mr-2">API:</span>
                            {apiStatus === 'unknown' && (
                                <span className="flex items-center">
                                    <span className="h-2 w-2 rounded-full bg-gray-400 mr-1"></span>
                                    <span className="text-gray-600">Checking...</span>
                                </span>
                            )}
                            {apiStatus === 'connected' && (
                                <span className="flex items-center">
                                    <span className="h-2 w-2 rounded-full bg-green-500 mr-1"></span>
                                    <span className="text-green-700">Connected</span>
                                </span>
                            )}
                            {apiStatus === 'disconnected' && (
                                <span className="flex items-center">
                                    <span className="h-2 w-2 rounded-full bg-red-500 mr-1"></span>
                                    <span className="text-red-700">Disconnected</span>
                                    <button
                                        onClick={checkConnection}
                                        className="ml-2 text-xs text-red-700 hover:text-red-900 underline"
                                        disabled={isCheckingConnection}
                                    >
                                        {isCheckingConnection ? 'Checking...' : 'Retry'}
                                    </button>
                                </span>
                            )}
                        </div>
                        <Link href="/research-assistant/admin" className="bg-[#d9363e] hover:bg-red-700 text-white px-4 py-2 rounded">
                            Admin
                        </Link>
                    </div>
                </div>

                {/* Fallback Mode Notice */}
                {isUsingFallback && (
                    <div className="mb-6 p-3 bg-red-100 border border-red-300 rounded-lg">
                        <p className="text-red-700 flex items-center">
                            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9a1 1 0 00-1-1z" clipRule="evenodd"></path>
                            </svg>
                            Running with enhanced summaries: AI-generated answers based on relevant research papers
                        </p>
                    </div>
                )}

                {/* Search Tabs */}
                <div className="mb-8 border-b border-gray-300">
                    <div className="flex gap-6 mb-2">
                        <button
                            className={`flex items-center gap-2 py-2 border-b-2 ${activeTab === 'search' ? 'border-[#d9363e] text-[#d9363e]' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                            onClick={() => setActiveTab('search')}
                        >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd"></path>
                            </svg>
                            Search
                        </button>
                        {response && response.papers && (
                            <button
                                className={`flex items-center gap-2 py-2 ${activeTab === 'sources' ? 'border-b-2 border-[#d9363e] text-[#d9363e]' : 'border-b-2 border-transparent text-gray-500 hover:text-gray-700'}`}
                                onClick={() => setActiveTab('sources')}
                            >
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z"></path>
                                </svg>
                                Sources <span className="ml-1 px-1.5 py-0.5 bg-gray-200 rounded-full text-xs">{response.papers.length}</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* Search Bar */}
                <form onSubmit={handleSubmit} className="relative bg-white border border-gray-300 rounded-lg p-2 flex items-center mb-8 shadow-sm">
                    <button type="submit" className="p-2 text-gray-400">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                            <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd"></path>
                        </svg>
                    </button>
                    <input
                        type="text"
                        placeholder="Ask anything about research papers..."
                        className="bg-transparent border-none outline-none flex-1 px-2 text-gray-900"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        disabled={isLoading}
                    />
                    <div className="flex items-center gap-2">
                        {isLoading ? (
                            <div className="p-2">
                                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-[#d9363e]"></div>
                            </div>
                        ) : (
                            <button type="submit" className="bg-[#d9363e] hover:bg-red-700 rounded-full p-2 ml-1 text-white" disabled={!query.trim()}>
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"></path>
                                </svg>
                            </button>
                        )}
                    </div>
                </form>

                {/* Error Message */}
                {error && (
                    <div className="mb-8 p-4 bg-red-100 rounded-lg border border-red-300">
                        <p className="text-red-700">{error}</p>
                        {error.includes('API is currently unavailable') && (
                            <div className="mt-3 flex flex-col gap-2">
                                <p className="text-red-700 text-sm">Possible solutions:</p>
                                <ul className="list-disc pl-5 text-sm text-red-700">
                                    <li>Make sure the research assistant service is running</li>
                                    <li>Check that the environment variable NEXT_PUBLIC_RESEARCH_API_URL is set correctly</li>
                                    <li>If using Docker, make sure the research-assistant container is running</li>
                                </ul>
                                <div className="mt-2 flex items-center gap-3">
                                    <button
                                        onClick={checkConnection}
                                        disabled={isCheckingConnection}
                                        className="flex items-center px-3 py-1 bg-red-700 text-white text-sm rounded hover:bg-red-800"
                                    >
                                        {isCheckingConnection ? (
                                            <>
                                                <span className="mr-2 inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                                                Checking...
                                            </>
                                        ) : (
                                            'Check Connection'
                                        )}
                                    </button>
                                    <div className="flex items-center">
                                        <span className="text-sm mr-2">Status:</span>
                                        {apiStatus === 'unknown' && <span className="h-2 w-2 rounded-full bg-gray-400"></span>}
                                        {apiStatus === 'connected' && <span className="h-2 w-2 rounded-full bg-green-500"></span>}
                                        {apiStatus === 'disconnected' && <span className="h-2 w-2 rounded-full bg-red-500"></span>}
                                        <span className="ml-1 text-sm">{apiStatus === 'unknown' ? 'Checking...' : apiStatus === 'connected' ? 'Connected' : 'Disconnected'}</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Response Content Based on Active Tab */}
                {response && (
                    <>
                        {/* Answer Tab Content */}
                        {activeTab === 'search' && (
                            <div className="mb-8">
                                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-300">
                                    <h2 className="text-xl font-semibold mb-4 text-[#d9363e]">Answer</h2>
                                    <div className="prose max-w-none">
                                        {response.answer.split('\n').map((paragraph, index) => (
                                            <p key={index} className="mb-4">{paragraph}</p>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Sources Tab Content */}
                        {activeTab === 'sources' && response.papers && response.papers.length > 0 && (
                            <div className="mb-8">
                                <h2 className="text-xl font-semibold mb-4 text-[#d9363e]">Sources</h2>
                                <div className="grid grid-cols-1 gap-4">
                                    {response.papers.map((paper, index) => (
                                        <div key={`paper-${index}-${paper.paper_id || 'unknown'}`} className="bg-white p-4 rounded-lg shadow-sm border border-gray-300">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="w-8 h-8 bg-[#d9363e] rounded-full flex items-center justify-center text-white">
                                                    {index + 1}
                                                </span>
                                                <span className="text-sm text-gray-500">Relevance: {(paper.score ? (paper.score * 100).toFixed(1) : 0)}%</span>
                                            </div>
                                            <h3 className="font-medium mb-2">{paper.title || 'Untitled Paper'}</h3>

                                            {paper.abstract && (
                                                <div className="mt-2">
                                                    <h4 className="text-sm text-gray-500">Abstract</h4>
                                                    <p className="text-sm mt-1">{paper.abstract}</p>
                                                </div>
                                            )}

                                            {paper.keywords && Array.isArray(paper.keywords) && paper.keywords.length > 0 && (
                                                <div className="mt-2">
                                                    <h4 className="text-sm text-gray-500">Keywords</h4>
                                                    <div className="flex flex-wrap gap-2 mt-1">
                                                        {paper.keywords.map((keyword, idx) => (
                                                            <span key={idx} className="px-2 py-1 bg-gray-200 rounded-full text-xs">
                                                                {keyword}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
                )}

                {/* Information About Research Assistant (Only shown when no results) */}
                {!response && (
                    <div className="mb-8">
                        <p className="text-xl mb-4">
                            {t('description')}
                        </p>

                        <h2 className="text-2xl font-bold mb-4">Features</h2>
                        <ul className="space-y-6">
                            <li className="flex gap-4">
                                <span className="text-gray-500">•</span>
                                <div>
                                    <h3 className="font-semibold mb-1">Semantic Search:</h3>
                                    <p>Advanced vector search finds the most relevant papers to your query.</p>
                                </div>
                            </li>
                            <li className="flex gap-4">
                                <span className="text-gray-500">•</span>
                                <div>
                                    <h3 className="font-semibold mb-1">AI-Generated Answers:</h3>
                                    <p>Get comprehensive answers synthesized from multiple research papers.</p>
                                </div>
                            </li>
                            <li className="flex gap-4">
                                <span className="text-gray-500">•</span>
                                <div>
                                    <h3 className="font-semibold mb-1">Source Attribution:</h3>
                                    <p>See which papers were used to generate each answer.</p>
                                </div>
                            </li>
                        </ul>
                    </div>
                )}
            </div>
        </div>
    );
} 