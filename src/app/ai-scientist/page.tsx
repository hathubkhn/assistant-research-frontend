'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useTranslation } from '@/utils/useTranslation'

interface ResearchIdea {
    id: string;
    title: string;
    description: string;
    status: string;
    createdAt: string;
}

interface ExperimentRun {
    id: string;
    status: string;
}

export default function AiScientistDashboard() {
    const { t } = useTranslation('ai-scientist')
    const [recentIdeas, setRecentIdeas] = useState<ResearchIdea[]>([])
    const [stats, setStats] = useState({
        totalIdeas: 0,
        totalExperiments: 0,
        completedExperiments: 0,
        failedExperiments: 0,
        runningExperiments: 0,
    })
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true)
                setError(null)

                // Mock data for now - will be replaced with actual API calls
                const ideas = [
                    {
                        id: '1',
                        title: 'Novel Algorithm for Quantum Computing Optimization',
                        description: 'Research into optimizing quantum algorithms for practical applications in cryptography.',
                        status: 'active',
                        createdAt: '2024-03-15T10:30:00Z',
                    },
                    {
                        id: '2',
                        title: 'AI-Enhanced Materials Discovery',
                        description: 'Using machine learning to predict and discover new materials with specific properties.',
                        status: 'active',
                        createdAt: '2024-03-10T14:20:00Z',
                    },
                    {
                        id: '3',
                        title: 'Climate Model Improvements',
                        description: 'Improving climate prediction models with advanced neural network architectures.',
                        status: 'completed',
                        createdAt: '2024-02-28T09:15:00Z',
                    },
                    {
                        id: '4',
                        title: 'Natural Language Processing for Scientific Literature',
                        description: 'Developing NLP techniques specific to scientific literature analysis.',
                        status: 'active',
                        createdAt: '2024-02-25T11:45:00Z',
                    },
                    {
                        id: '5',
                        title: 'Protein Folding Prediction Enhancements',
                        description: 'Improving the accuracy of protein structure prediction algorithms.',
                        status: 'failed',
                        createdAt: '2024-02-20T16:30:00Z',
                    },
                ]

                setRecentIdeas(ideas.slice(0, 5)) // Get most recent 5 ideas

                // Mock experiment data
                const experiments = [
                    { id: 'e1', status: 'completed' },
                    { id: 'e2', status: 'completed' },
                    { id: 'e3', status: 'failed' },
                    { id: 'e4', status: 'pending' },
                    { id: 'e5', status: 'running' },
                    { id: 'e6', status: 'running' },
                    { id: 'e7', status: 'completed' },
                ]

                // Calculate stats
                const completedExperiments = experiments.filter(exp => exp.status === 'completed')
                const failedExperiments = experiments.filter(exp => exp.status === 'failed')
                const runningExperiments = experiments.filter(exp => ['pending', 'running'].includes(exp.status))

                setStats({
                    totalIdeas: ideas.length,
                    totalExperiments: experiments.length,
                    completedExperiments: completedExperiments.length,
                    failedExperiments: failedExperiments.length,
                    runningExperiments: runningExperiments.length,
                })

                setLoading(false)
            } catch (error) {
                console.error('Error fetching dashboard data:', error)
                setError('Failed to load dashboard data. Please try again later.')
                setLoading(false)
            }
        }

        fetchData()
    }, [])

    if (loading) {
        return (
            <div className='flex justify-center items-center h-80vh'>
                <div className='animate-spin h-8 w-8 border-4 border-blue-600 rounded-full border-t-transparent'></div>
            </div>
        )
    }

    if (error) {
        return (
            <div className='flex flex-col justify-center items-center h-80vh'>
                <svg className='w-12 h-12 text-red-500 mb-4' fill='none' stroke='currentColor' viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'></path>
                </svg>
                <h2 className='text-xl font-semibold text-red-500 mb-2'>{error}</h2>
                <button
                    className='mt-4 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-xl'
                    onClick={() => window.location.reload()}
                >
                    Retry
                </button>
            </div>
        )
    }

    return (
        <div className='max-w-[85rem] px-4 py-10 sm:px-6 lg:px-8 lg:py-14 mx-auto'>
            <div className='flex justify-between items-center mb-8 flex-wrap gap-4'>
                <h1 className='text-3xl font-semibold text-gray-800'>
                    {t('title')}
                </h1>
                <Link href='/ai-scientist/ideas/create' className='bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-xl flex items-center'>
                    <svg className='w-5 h-5 mr-2' fill='none' stroke='currentColor' viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg'>
                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M12 6v6m0 0v6m0-6h6m-6 0H6'></path>
                    </svg>
                    {t('createNewIdea')}
                </Link>
            </div>

            {/* Stats Section */}
            <div className='grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10'>
                <div className='bg-white shadow rounded-xl p-6 border border-gray-200 transition duration-300 hover:shadow-lg hover:translate-y-[-4px] hover:border-blue-200'>
                    <div className='w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mb-4'>
                        <svg className='w-6 h-6 text-hust-red' fill='none' stroke='currentColor' viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg'>
                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z'></path>
                        </svg>
                    </div>
                    <h2 className='text-3xl font-semibold mb-2'>{stats.totalIdeas}</h2>
                    <p className='text-gray-600'>{t('researchIdeas')}</p>
                </div>

                <div className='bg-white shadow rounded-xl p-6 border border-gray-200 transition duration-300 hover:shadow-lg hover:translate-y-[-4px] hover:border-blue-200'>
                    <div className='w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center mb-4'>
                        <svg className='w-6 h-6 text-indigo-600' fill='none' stroke='currentColor' viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg'>
                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z'></path>
                        </svg>
                    </div>
                    <h2 className='text-3xl font-semibold mb-2'>{stats.totalExperiments}</h2>
                    <p className='text-gray-600'>{t('totalExperiments')}</p>
                </div>

                <div className='bg-white shadow rounded-xl p-6 border border-gray-200 transition duration-300 hover:shadow-lg hover:translate-y-[-4px] hover:border-blue-200'>
                    <div className='w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mb-4'>
                        <svg className='w-6 h-6 text-green-600' fill='none' stroke='currentColor' viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg'>
                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z'></path>
                        </svg>
                    </div>
                    <h2 className='text-3xl font-semibold mb-2'>{stats.completedExperiments}</h2>
                    <p className='text-gray-600'>{t('completedExperiments')}</p>
                </div>
            </div>

            {/* Detailed Stats */}
            <div className='bg-white shadow rounded-xl p-6 mb-10 border border-gray-200'>
                <h2 className='text-xl font-semibold mb-4'>{t('experimentStatusOverview')}</h2>
                <div className='grid sm:grid-cols-3 gap-4'>
                    <div className='flex items-center'>
                        <svg className='w-5 h-5 text-green-500 mr-2' fill='none' stroke='currentColor' viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg'>
                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'></path>
                        </svg>
                        <span>{t('completed')}: {stats.completedExperiments}</span>
                    </div>
                    <div className='flex items-center'>
                        <svg className='w-5 h-5 text-yellow-500 mr-2' fill='none' stroke='currentColor' viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg'>
                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z'></path>
                        </svg>
                        <span>{t('running')}: {stats.runningExperiments}</span>
                    </div>
                    <div className='flex items-center'>
                        <svg className='w-5 h-5 text-red-500 mr-2' fill='none' stroke='currentColor' viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg'>
                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z'></path>
                        </svg>
                        <span>{t('failed')}: {stats.failedExperiments}</span>
                    </div>
                </div>
            </div>

            {/* Recent Ideas */}
            <div>
                <div className='flex justify-between items-center mb-4'>
                    <h2 className='text-xl font-semibold'>{t('recentResearchIdeas')}</h2>
                    <Link href='/ai-scientist/ideas' className='text-hust-red hover:text-red-800 font-medium'>
                        {t('viewAll')}
                    </Link>
                </div>

                <div className='grid gap-4'>
                    {recentIdeas.map((idea) => (
                        <div key={idea.id} className='bg-white shadow rounded-xl p-6 border border-gray-200 hover:shadow-lg transition duration-300'>
                            <div className='flex justify-between items-start'>
                                <h3 className='text-lg font-semibold text-gray-800 mb-2'>
                                    <Link href={`/ai-scientist/ideas/${idea.id}`} className='hover:text-hust-red'>
                                        {idea.title}
                                    </Link>
                                </h3>
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${idea.status === 'active' ? 'bg-green-100 text-green-800' :
                                    idea.status === 'completed' ? 'bg-red-100 text-red-800' :
                                        'bg-red-100 text-red-800'
                                    }`}>
                                    {idea.status.charAt(0).toUpperCase() + idea.status.slice(1)}
                                </span>
                            </div>
                            <p className='text-gray-600 mb-4 line-clamp-2'>{idea.description}</p>
                            <div className='flex justify-between items-center'>
                                <span className='text-sm text-gray-500'>
                                    {new Date(idea.createdAt).toLocaleDateString()}
                                </span>
                                <Link href={`/ai-scientist/ideas/${idea.id}`} className='text-hust-red hover:text-red-800 text-sm font-medium'>
                                    {t('viewDetails')} →
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
