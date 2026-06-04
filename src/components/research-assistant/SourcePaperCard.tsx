'use client'

import React from 'react'
import Link from 'next/link'

export interface SourcePaper {
    paper_id: string
    title: string
    abstract?: string
    keywords?: string[]
    score?: number
}

interface SourcePaperCardProps {
    paper: SourcePaper
    index: number
}

export default function SourcePaperCard({ paper, index }: SourcePaperCardProps) {
    const href = paper.paper_id ? `/papers/${paper.paper_id}` : '#'

    return (
        <div className='bg-white p-4 rounded-lg shadow-sm border border-gray-300 hover:border-[#d9363e]/40 transition-colors'>
            <div className='flex items-center gap-2 mb-2'>
                <span className='w-8 h-8 bg-[#d9363e] rounded-full flex items-center justify-center text-white text-sm'>
                    {index + 1}
                </span>
                <span className='text-sm text-gray-500'>
                    Relevance: {paper.score != null ? (paper.score * 100).toFixed(1) : '0'}%
                </span>
            </div>
            <Link href={href} className='font-medium mb-2 block text-gray-900 hover:text-[#d9363e]'>
                {paper.title || 'Untitled Paper'}
            </Link>

            {paper.abstract && (
                <div className='mt-2'>
                    <h4 className='text-sm text-gray-500'>Abstract</h4>
                    <p className='text-sm mt-1 text-gray-700'>{paper.abstract}</p>
                </div>
            )}

            {paper.keywords && Array.isArray(paper.keywords) && paper.keywords.length > 0 && (
                <div className='mt-2'>
                    <h4 className='text-sm text-gray-500'>Keywords</h4>
                    <div className='flex flex-wrap gap-2 mt-1'>
                        {paper.keywords.map((keyword, idx) => (
                            <span key={idx} className='px-2 py-1 bg-gray-200 rounded-full text-xs'>
                                {keyword}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {paper.paper_id && (
                <Link
                    href={href}
                    className='inline-block mt-3 text-sm text-[#d9363e] hover:underline font-medium'
                >
                    View paper details →
                </Link>
            )}
        </div>
    )
}
