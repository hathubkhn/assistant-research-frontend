'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

interface Conference {
    id: string;
    name: string;
    abbreviation: string;
    rank: string;
    location: string;
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

export default function ConferenceDetailPage() {
    const params = useParams();
    const router = useRouter();
    const id = params.id as string;

    const [conference, setConference] = useState<Conference | null>(null);
    const [papers, setPapers] = useState<Paper[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchConferenceDetails = async () => {
            try {
                setLoading(true);
                const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

                // Try the API endpoint
                let response = await fetch(`${apiUrl}/api/conferences/${id}/`);

                if (response.status === 404) {
                    console.error(`Conference not found with ID: ${id}`);
                    setLoading(false);
                    return;
                }

                if (response.ok) {
                    const data = await response.json();
                    console.log("Conference data received:", data);
                    setConference(data);
                    setPapers(data.papers || []);
                } else {
                    console.error(`Error fetching conference details: ${response.status} ${response.statusText}`);
                }
            } catch (error) {
                console.error('Error fetching conference details:', error);
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            console.log("Fetching conference with ID:", id);
            fetchConferenceDetails();
        }
    }, [id]);

    const handleViewMorePapers = () => {
        router.push(`/papers?venueType=conference&venue_id=${id}`);
    };

    if (loading) {
        return (
            <div className="container mx-auto px-4 py-8 flex justify-center items-center min-h-[60vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!conference) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
                    <p>Conference not found. Please check the URL and try again.</p>
                    <Link href="/conferences" className="mt-2 inline-block text-blue-600 hover:text-blue-800">
                        Go back to Conferences
                    </Link>
                </div>
            </div>
        );
    }

    // Format authors for display
    const formatAuthors = (authors: string[] | string): string => {
        if (typeof authors === 'string') {
            try {
                const parsedAuthors = JSON.parse(authors);
                if (Array.isArray(parsedAuthors)) {
                    return parsedAuthors.join(', ');
                }
                return authors;
            } catch {
                return authors;
            }
        } else if (Array.isArray(authors)) {
            return authors.join(', ');
        }
        return 'Unknown';
    };

    return (
        <div className="container mx-auto px-4 py-8">
            {/* Back button */}
            <div className="mb-6">
                <Link href="/conferences" className="text-blue-600 hover:text-blue-800 flex items-center gap-1">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Back to Conferences
                </Link>
            </div>

            {/* Conference header */}
            <div className="bg-white shadow-md rounded-lg overflow-hidden mb-8">
                <div className="p-6">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                        <div>
                            <h1 className="text-3xl font-bold text-blue-900">{conference.name}</h1>
                            <p className="text-gray-500 text-lg">{conference.abbreviation}</p>
                        </div>
                        {conference.url && (
                            <a
                                href={conference.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center gap-2"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                                    <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
                                </svg>
                                Visit Conference
                            </a>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div className="bg-gray-50 p-4 rounded-md">
                            <h3 className="text-sm font-medium text-gray-500 uppercase">Rank</h3>
                            <p className="mt-1 font-medium">
                                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${conference.rank === 'A*' ? 'bg-purple-100 text-purple-800' :
                                    conference.rank === 'A' ? 'bg-green-100 text-green-800' :
                                        conference.rank === 'B' ? 'bg-blue-100 text-blue-800' :
                                            conference.rank === 'C' ? 'bg-yellow-100 text-yellow-800' :
                                                'bg-gray-100 text-gray-800'
                                    }`}>
                                    {conference.rank || 'N/A'}
                                </span>
                            </p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-md">
                            <h3 className="text-sm font-medium text-gray-500 uppercase">Location</h3>
                            <p className="mt-1 font-medium">{conference.location || 'Various Locations'}</p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-md">
                            <h3 className="text-sm font-medium text-gray-500 uppercase">Total Papers</h3>
                            <p className="mt-1 font-medium text-lg">{conference.papersCount}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Recent papers */}
            <div className="bg-white shadow-md rounded-lg overflow-hidden">
                <div className="p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold text-gray-800">Recent Papers</h2>
                        <button
                            onClick={handleViewMorePapers}
                            className="text-blue-600 hover:text-blue-800"
                        >
                            View All
                        </button>
                    </div>

                    {papers.length === 0 ? (
                        <p className="text-gray-600">No papers found for this conference.</p>
                    ) : (
                        <div className="space-y-4">
                            {papers.map((paper) => (
                                <div key={paper.id} className="border-b border-gray-200 pb-4 last:border-b-0 last:pb-0">
                                    <Link href={`/papers/${paper.id}`} className="text-blue-600 hover:text-blue-800 hover:underline">
                                        <h3 className="font-medium">{paper.title}</h3>
                                    </Link>
                                    <div className="text-sm text-gray-500 mt-1 flex flex-wrap gap-x-2">
                                        <span>{formatAuthors(paper.authors)}</span>
                                        <span>•</span>
                                        <span>{paper.year}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
} 