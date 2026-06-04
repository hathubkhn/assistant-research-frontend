'use client'

import React, { useState } from 'react'
import Link from 'next/link'

interface Paper {
    paper_id: string;
    title: string;
    abstract: string;
    keywords: string[];
    user_id: string;
}

export default function ResearchAssistantAdmin() {
    const [paperData, setPaperData] = useState<Paper>({
        paper_id: '',
        title: '',
        abstract: '',
        keywords: [],
        user_id: '',
    })

    const [keywordsInput, setKeywordsInput] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null)

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target
        setPaperData(prev => ({ ...prev, [name]: value }))
    }

    const handleKeywordsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setKeywordsInput(e.target.value)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        // Validate form
        if (!paperData.paper_id || !paperData.title || !paperData.abstract || !paperData.user_id) {
            setMessage({ text: 'All fields except keywords are required', type: 'error' })
            return
        }

        // Format keywords
        const keywords = keywordsInput.split(',').map(kw => kw.trim()).filter(kw => kw)

        setIsLoading(true)
        setMessage(null)

        try {
            // Connect directly to the FastAPI backend
            const apiBase = (process.env.NEXT_PUBLIC_RESEARCH_API_URL || 'http://localhost:8001').replace(/\/$/, '')
            const res = await fetch(`${apiBase}/papers`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ...paperData,
                    keywords,
                }),
            })

            if (!res.ok) {
                throw new Error(`Error: ${res.status}`)
            }

            const data = await res.json()
            setMessage({ text: `Paper added successfully! ID: ${data.paper_id}`, type: 'success' })

            // Reset form
            setPaperData({
                paper_id: '',
                title: '',
                abstract: '',
                keywords: [],
                user_id: '',
            })
            setKeywordsInput('')
        } catch (err) {
            console.error('Error adding paper:', err)
            setMessage({ text: 'Failed to add paper. Please try again.', type: 'error' })
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className='bg-gray-900 min-h-screen text-white p-6'>
            <div className='max-w-4xl mx-auto'>
                <div className='flex justify-between items-center mb-8'>
                    <h1 className='text-4xl font-bold'>Research Assistant Admin</h1>
                    <Link href='/research-assistant' className='bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded'>
                        Back to Search
                    </Link>
                </div>

                {message && (
                    <div className={`mb-6 p-4 rounded-lg ${message.type === 'success' ? 'bg-green-900/30 border border-green-700' : 'bg-red-900/30 border border-red-700'}`}>
                        <p className={message.type === 'success' ? 'text-green-400' : 'text-red-400'}>{message.text}</p>
                    </div>
                )}

                <div className='bg-gray-800 p-6 rounded-lg shadow-lg mb-8'>
                    <h2 className='text-xl font-semibold mb-4'>Add New Research Paper</h2>

                    <form onSubmit={handleSubmit}>
                        <div className='grid grid-cols-1 md:grid-cols-2 gap-6 mb-6'>
                            <div>
                                <label className='block text-sm font-medium text-gray-400 mb-1'>Paper ID</label>
                                <input
                                    type='text'
                                    name='paper_id'
                                    value={paperData.paper_id}
                                    onChange={handleChange}
                                    className='w-full bg-gray-700 border border-gray-600 rounded-md p-3 text-white'
                                    placeholder='Unique identifier (e.g., paper123)'
                                />
                            </div>

                            <div>
                                <label className='block text-sm font-medium text-gray-400 mb-1'>User ID</label>
                                <input
                                    type='text'
                                    name='user_id'
                                    value={paperData.user_id}
                                    onChange={handleChange}
                                    className='w-full bg-gray-700 border border-gray-600 rounded-md p-3 text-white'
                                    placeholder="Owner's user ID"
                                />
                            </div>
                        </div>

                        <div className='mb-6'>
                            <label className='block text-sm font-medium text-gray-400 mb-1'>Title</label>
                            <input
                                type='text'
                                name='title'
                                value={paperData.title}
                                onChange={handleChange}
                                className='w-full bg-gray-700 border border-gray-600 rounded-md p-3 text-white'
                                placeholder='Paper title'
                            />
                        </div>

                        <div className='mb-6'>
                            <label className='block text-sm font-medium text-gray-400 mb-1'>Abstract</label>
                            <textarea
                                name='abstract'
                                value={paperData.abstract}
                                onChange={handleChange}
                                rows={5}
                                className='w-full bg-gray-700 border border-gray-600 rounded-md p-3 text-white'
                                placeholder='Paper abstract...'
                            />
                        </div>

                        <div className='mb-6'>
                            <label className='block text-sm font-medium text-gray-400 mb-1'>Keywords (comma separated)</label>
                            <input
                                type='text'
                                value={keywordsInput}
                                onChange={handleKeywordsChange}
                                className='w-full bg-gray-700 border border-gray-600 rounded-md p-3 text-white'
                                placeholder='AI, machine learning, NLP'
                            />
                        </div>

                        <div className='flex justify-end'>
                            <button
                                type='submit'
                                disabled={isLoading}
                                className='bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-md font-medium disabled:opacity-50'
                            >
                                {isLoading ? 'Adding...' : 'Add Paper'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}
