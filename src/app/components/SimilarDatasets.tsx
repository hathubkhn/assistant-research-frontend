import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Dataset {
    id: string;
    name: string;
    abbreviation: string;
    description: string;
    downloadUrl: string;
    paperCount: number;
    language: string;
    category: string;
    tasks: string[];
    thumbnailUrl?: string;
    benchmarks: number;
}

interface SimilarDatasetsProps {
    datasetId: string;
    className?: string;
}

export default function SimilarDatasets({ datasetId, className = '' }: SimilarDatasetsProps) {
    const [similarDatasets, setSimilarDatasets] = useState<Dataset[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchSimilarDatasets = async () => {
            try {
                setLoading(true);
                const response = await fetch(`http://localhost:8000/api/datasets/${datasetId}/`);

                if (!response.ok) {
                    throw new Error(`Failed to fetch similar datasets: ${response.status}`);
                }

                const data = await response.json();
                setSimilarDatasets(data.similarDatasets || []);
            } catch (err) {
                console.error('Error fetching similar datasets:', err);
                setError(err instanceof Error ? err.message : 'Failed to fetch similar datasets');
            } finally {
                setLoading(false);
            }
        };

        if (datasetId) {
            fetchSimilarDatasets();
        }
    }, [datasetId]);

    if (loading) {
        return (
            <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
                <h2 className='text-2xl font-bold text-blue-900 mb-4'>Similar Datasets</h2>
                <div className='animate-pulse'>
                    <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className='border border-gray-200 rounded-md p-4 flex items-start gap-3'>
                                <div className='w-12 h-12 bg-gray-200 rounded-md flex-shrink-0'></div>
                                <div className='w-full'>
                                    <div className='h-4 bg-gray-200 rounded w-3/4 mb-2'></div>
                                    <div className='h-3 bg-gray-200 rounded w-full mb-1'></div>
                                    <div className='h-3 bg-gray-200 rounded w-2/3'></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
                <h2 className='text-2xl font-bold text-blue-900 mb-4'>Similar Datasets</h2>
                <p className='text-red-500'>Error: {error}</p>
            </div>
        );
    }

    return (
        <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
            <h2 className='text-2xl font-bold text-blue-900 mb-4'>Similar Datasets</h2>
            {similarDatasets.length > 0 ? (
                <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
                    {similarDatasets.map(ds => (
                        <Link
                            key={ds.id}
                            href={`/datasets/${ds.id}`}
                            className='border border-gray-200 rounded-md p-4 hover:bg-gray-50 flex items-start gap-3'
                        >
                            <div className='w-12 h-12 bg-gray-100 rounded-md flex items-center justify-center flex-shrink-0'>
                                {ds.abbreviation && (
                                    <div className='text-lg font-bold text-gray-400'>{ds.abbreviation}</div>
                                )}
                            </div>
                            <div>
                                <h3 className='font-medium text-blue-600'>{ds.name}</h3>
                                <p className='text-gray-600 text-sm mt-1 line-clamp-2'>{ds.description}</p>
                            </div>
                        </Link>
                    ))}
                </div>
            ) : (
                <p className='text-gray-600'>No similar datasets found.</p>
            )}
        </div>
    );
} 