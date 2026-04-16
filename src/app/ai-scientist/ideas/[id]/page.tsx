import React from 'react';
import Link from 'next/link';

interface Params {
    id: string;
}

interface Props {
    params: Promise<Params>;
}

export default async function IdeaDetails({ params }: Props) {
    const { id: ideaId } = await params;

    // Mock data for a single idea
    const idea = {
        id: ideaId,
        title: ideaId === '1'
            ? 'Novel Algorithm for Quantum Computing Optimization'
            : 'Research Idea ' + ideaId,
        description: 'This research proposes a novel approach to optimize quantum computing algorithms, specifically focusing on their application in cryptography. The methodology combines principles from quantum mechanics, information theory, and computational complexity to achieve higher efficiency in quantum operations while maintaining security guarantees.',
        status: 'active',
        createdAt: '2024-03-15T10:30:00Z',
        domain: 'Computer Science',
        keywords: ['quantum computing', 'algorithm optimization', 'cryptography', 'quantum security'],
        experiments: [
            {
                id: 'e1',
                title: 'Baseline Performance Evaluation',
                status: 'completed',
                startDate: '2024-03-16T09:00:00Z',
                endDate: '2024-03-18T17:00:00Z',
            },
            {
                id: 'e2',
                title: 'Parameter Optimization',
                status: 'running',
                startDate: '2024-03-20T09:00:00Z',
                endDate: null,
            },
            {
                id: 'e3',
                title: 'Security Analysis',
                status: 'pending',
                startDate: null,
                endDate: null,
            }
        ]
    };

    return (
        <div className='max-w-[85rem] px-4 py-10 sm:px-6 lg:px-8 lg:py-14 mx-auto'>
            <div className='mb-8'>
                <Link href='/ai-scientist' className='text-blue-600 hover:text-blue-800 flex items-center mb-6'>
                    <svg className='w-5 h-5 mr-2' fill='none' stroke='currentColor' viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg'>
                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M10 19l-7-7m0 0l7-7m-7 7h18'></path>
                    </svg>
                    Back to Dashboard
                </Link>

                <div className='flex justify-between items-start flex-wrap gap-4 mb-6'>
                    <div>
                        <h1 className='text-3xl font-semibold text-gray-800 mb-2'>{idea.title}</h1>
                        <div className='flex items-center gap-4 flex-wrap'>
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${idea.status === 'active' ? 'bg-green-100 text-green-800' :
                                    idea.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                                        'bg-red-100 text-red-800'
                                }`}>
                                {idea.status.charAt(0).toUpperCase() + idea.status.slice(1)}
                            </span>
                            <span className='text-gray-500 text-sm'>
                                Created on {new Date(idea.createdAt).toLocaleDateString()}
                            </span>
                            <span className='text-gray-700 text-sm bg-gray-100 px-3 py-1 rounded-full'>
                                {idea.domain}
                            </span>
                        </div>
                    </div>

                    <div className='flex gap-3'>
                        <button className='px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'>
                            Run Experiment
                        </button>
                        <button className='px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'>
                            Edit Idea
                        </button>
                    </div>
                </div>

                {/* Idea Details */}
                <div className='bg-white shadow-sm rounded-xl p-6 mb-8 border border-gray-200'>
                    <h2 className='text-xl font-semibold mb-4'>Description</h2>
                    <p className='text-gray-700 mb-6'>{idea.description}</p>

                    <h3 className='text-lg font-medium mb-2'>Keywords</h3>
                    <div className='flex flex-wrap gap-2 mb-6'>
                        {idea.keywords.map((keyword, index) => (
                            <span key={index} className='bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm'>
                                {keyword}
                            </span>
                        ))}
                    </div>
                </div>

                {/* Experiments */}
                <div className='bg-white shadow-sm rounded-xl p-6 border border-gray-200'>
                    <div className='flex justify-between items-center mb-6'>
                        <h2 className='text-xl font-semibold'>Experiments</h2>
                        <button className='text-blue-600 hover:text-blue-800 text-sm font-medium'>
                            View All Experiments
                        </button>
                    </div>

                    <div className='space-y-4'>
                        {idea.experiments.map((experiment) => (
                            <div key={experiment.id} className='border border-gray-200 rounded-lg p-4 hover:shadow-md transition duration-300'>
                                <div className='flex justify-between items-start'>
                                    <h3 className='font-medium text-gray-800'>{experiment.title}</h3>
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${experiment.status === 'completed' ? 'bg-green-100 text-green-800' :
                                            experiment.status === 'running' ? 'bg-blue-100 text-blue-800' :
                                                'bg-yellow-100 text-yellow-800'
                                        }`}>
                                        {experiment.status.charAt(0).toUpperCase() + experiment.status.slice(1)}
                                    </span>
                                </div>

                                <div className='mt-2 text-sm text-gray-600'>
                                    {experiment.startDate ? (
                                        <>
                                            Started: {new Date(experiment.startDate).toLocaleDateString()}
                                            {experiment.endDate && (
                                                <> • Completed: {new Date(experiment.endDate).toLocaleDateString()}</>
                                            )}
                                        </>
                                    ) : (
                                        'Not started yet'
                                    )}
                                </div>

                                <div className='mt-3'>
                                    <button className='text-blue-600 hover:text-blue-800 text-sm font-medium'>
                                        View Details →
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
} 