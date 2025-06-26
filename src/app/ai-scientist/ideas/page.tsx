import React from 'react';
import Link from 'next/link';

interface ResearchIdea {
    id: string;
    title: string;
    description: string;
    status: string;
    createdAt: string;
    domain: string;
}

export default function AllIdeas() {
    // Mock data for research ideas
    const ideas: ResearchIdea[] = [
        {
            id: '1',
            title: 'Novel Algorithm for Quantum Computing Optimization',
            description: 'Research into optimizing quantum algorithms for practical applications in cryptography.',
            status: 'active',
            createdAt: '2024-03-15T10:30:00Z',
            domain: 'Computer Science'
        },
        {
            id: '2',
            title: 'AI-Enhanced Materials Discovery',
            description: 'Using machine learning to predict and discover new materials with specific properties.',
            status: 'active',
            createdAt: '2024-03-10T14:20:00Z',
            domain: 'Materials Science'
        },
        {
            id: '3',
            title: 'Climate Model Improvements',
            description: 'Improving climate prediction models with advanced neural network architectures.',
            status: 'completed',
            createdAt: '2024-02-28T09:15:00Z',
            domain: 'Environmental Science'
        },
        {
            id: '4',
            title: 'Natural Language Processing for Scientific Literature',
            description: 'Developing NLP techniques specific to scientific literature analysis.',
            status: 'active',
            createdAt: '2024-02-25T11:45:00Z',
            domain: 'Computer Science'
        },
        {
            id: '5',
            title: 'Protein Folding Prediction Enhancements',
            description: 'Improving the accuracy of protein structure prediction algorithms.',
            status: 'failed',
            createdAt: '2024-02-20T16:30:00Z',
            domain: 'Biology'
        },
        {
            id: '6',
            title: 'Renewable Energy Storage Solutions',
            description: 'Researching novel materials and methods for efficient energy storage.',
            status: 'active',
            createdAt: '2024-02-15T13:20:00Z',
            domain: 'Energy Science'
        },
        {
            id: '7',
            title: 'Neural Networks for Medical Imaging',
            description: 'Developing specialized neural network architectures for analyzing medical images.',
            status: 'completed',
            createdAt: '2024-02-10T09:45:00Z',
            domain: 'Medical Imaging'
        },
        {
            id: '8',
            title: 'Quantum Cryptography Protocols',
            description: 'Designing and analyzing new quantum-resistant cryptographic protocols.',
            status: 'active',
            createdAt: '2024-02-05T11:30:00Z',
            domain: 'Computer Science'
        }
    ];

    return (
        <div className="max-w-[85rem] px-4 py-10 sm:px-6 lg:px-8 lg:py-14 mx-auto">
            <div className="mb-8">
                <Link href="/ai-scientist" className="text-blue-600 hover:text-blue-800 flex items-center mb-6">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
                    </svg>
                    Back to Dashboard
                </Link>

                <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
                    <h1 className="text-3xl font-semibold text-gray-800">
                        Research Ideas
                    </h1>
                    <Link href="/ai-scientist/ideas/create" className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-xl flex items-center">
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                        </svg>
                        Create New Idea
                    </Link>
                </div>

                {/* Filters */}
                <div className="bg-white p-4 rounded-xl shadow-sm mb-6 border border-gray-200">
                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div>
                            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
                                Search
                            </label>
                            <input
                                type="text"
                                id="search"
                                className="block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                placeholder="Search ideas..."
                            />
                        </div>

                        <div>
                            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                                Status
                            </label>
                            <select
                                id="status"
                                className="block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            >
                                <option value="">All Statuses</option>
                                <option value="active">Active</option>
                                <option value="completed">Completed</option>
                                <option value="failed">Failed</option>
                            </select>
                        </div>

                        <div>
                            <label htmlFor="domain" className="block text-sm font-medium text-gray-700 mb-1">
                                Domain
                            </label>
                            <select
                                id="domain"
                                className="block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            >
                                <option value="">All Domains</option>
                                <option value="computer_science">Computer Science</option>
                                <option value="biology">Biology</option>
                                <option value="materials_science">Materials Science</option>
                                <option value="environmental_science">Environmental Science</option>
                                <option value="energy_science">Energy Science</option>
                                <option value="medical_imaging">Medical Imaging</option>
                            </select>
                        </div>

                        <div>
                            <label htmlFor="sort" className="block text-sm font-medium text-gray-700 mb-1">
                                Sort By
                            </label>
                            <select
                                id="sort"
                                className="block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            >
                                <option value="newest">Newest First</option>
                                <option value="oldest">Oldest First</option>
                                <option value="alphabetical">Alphabetical</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Ideas List */}
                <div className="grid gap-4">
                    {ideas.map((idea) => (
                        <div key={idea.id} className="bg-white shadow rounded-xl p-6 border border-gray-200 hover:shadow-lg transition duration-300">
                            <div className="flex justify-between items-start">
                                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                                    <Link href={`/ai-scientist/ideas/${idea.id}`} className="hover:text-blue-600">
                                        {idea.title}
                                    </Link>
                                </h3>
                                <div className="flex gap-2">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${idea.status === 'active' ? 'bg-green-100 text-green-800' :
                                            idea.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                                                'bg-red-100 text-red-800'
                                        }`}>
                                        {idea.status.charAt(0).toUpperCase() + idea.status.slice(1)}
                                    </span>
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                        {idea.domain}
                                    </span>
                                </div>
                            </div>

                            <p className="text-gray-600 mb-4 line-clamp-2">{idea.description}</p>

                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-500">
                                    {new Date(idea.createdAt).toLocaleDateString()}
                                </span>
                                <Link href={`/ai-scientist/ideas/${idea.id}`} className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                                    View Details →
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Pagination */}
                <div className="flex justify-center items-center space-x-2 mt-8">
                    <button className="px-3 py-1 rounded border border-gray-300 text-gray-600 hover:bg-gray-50" disabled>
                        Previous
                    </button>
                    <button className="px-3 py-1 rounded bg-blue-600 text-white">1</button>
                    <button className="px-3 py-1 rounded border border-gray-300 text-gray-600 hover:bg-gray-50">2</button>
                    <button className="px-3 py-1 rounded border border-gray-300 text-gray-600 hover:bg-gray-50">3</button>
                    <span className="px-3 py-1">...</span>
                    <button className="px-3 py-1 rounded border border-gray-300 text-gray-600 hover:bg-gray-50">8</button>
                    <button className="px-3 py-1 rounded border border-gray-300 text-gray-600 hover:bg-gray-50">
                        Next
                    </button>
                </div>
            </div>
        </div>
    );
} 