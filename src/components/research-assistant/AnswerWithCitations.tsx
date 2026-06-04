'use client'

import React, { useState } from 'react'
import Link from 'next/link'

export interface Citation {
    index: number
    paper_id: string
    title: string
    snippet?: string
    score?: number
    doi?: string
    url?: string
}

interface AnswerWithCitationsProps {
    answer: string
    citations: Citation[]
}

function truncateTitle(title: string, max = 42): string {
    if (title.length <= max) return title
    return title.slice(0, max - 3) + '...'
}

function CitationBadge({ citation }: { citation: Citation }) {
    const [open, setOpen] = useState(false)
    const href = citation.paper_id ? `/papers/${citation.paper_id}` : '#'

    return (
        <span
            className='relative inline-flex align-middle mx-0.5'
            onMouseEnter={() => setOpen(true)}
            onMouseLeave={() => setOpen(false)}
        >
            <Link
                href={href}
                className='inline-flex items-center px-1.5 py-0.5 rounded bg-gray-200 hover:bg-gray-300 text-xs font-medium text-gray-700 border border-gray-300 transition-colors'
                title={citation.title}
            >
                Paper
            </Link>
            {open && (
                <span
                    className='absolute left-0 top-full z-50 mt-1 w-72 rounded-lg border border-gray-200 bg-white p-3 shadow-lg text-left'
                    role='tooltip'
                >
                    <span className='flex items-start gap-2'>
                        <span className='flex h-8 w-8 shrink-0 items-center justify-center rounded bg-[#d9363e]/10 text-[#d9363e] text-xs font-bold'>
                            Paper
                        </span>
                        <span className='min-w-0 flex-1'>
                            <Link
                                href={href}
                                className='block text-sm font-medium text-gray-900 hover:text-[#d9363e] leading-snug'
                            >
                                {truncateTitle(citation.title, 48)}
                            </Link>
                            {citation.snippet && (
                                <p className='mt-1 text-xs text-gray-600 italic leading-relaxed'>
                                    &ldquo;{citation.snippet}&rdquo;
                                </p>
                            )}
                        </span>
                    </span>
                </span>
            )}
        </span>
    )
}

const CITE_PATTERN = /(\[\d+\])/g
const CITE_INDEX_PATTERN = /^\[(\d+)\]$/

function renderLine(line: string, citationByIndex: Map<number, Citation>): React.ReactNode[] {
    const parts = line.split(CITE_PATTERN).filter((p) => p.length > 0)
    return parts.map((part, i) => {
        const match = part.match(CITE_INDEX_PATTERN)
        if (match) {
            const idx = parseInt(match[1], 10)
            const citation = citationByIndex.get(idx)
            if (citation) {
                return <CitationBadge key={`cite-${i}-${idx}`} citation={citation} />
            }
        }
        return <span key={`text-${i}`}>{part}</span>
    })
}

export default function AnswerWithCitations({ answer, citations }: AnswerWithCitationsProps) {
    const citationByIndex = new Map(citations.map((c) => [c.index, c]))
    const lines = answer.split('\n')

    return (
        <div className='prose max-w-none text-gray-900'>
            {lines.map((line, lineIndex) => {
                if (!line.trim()) {
                    return <br key={`br-${lineIndex}`} />
                }
                const isBullet = /^\s*[-•*]\s/.test(line) || /^\s*\d+\.\s/.test(line)
                const content = renderLine(line, citationByIndex)
                if (isBullet) {
                    return (
                        <p key={lineIndex} className='mb-3 pl-1 leading-relaxed'>
                            {content}
                        </p>
                    )
                }
                return (
                    <p key={lineIndex} className='mb-4 leading-relaxed'>
                        {content}
                    </p>
                )
            })}
        </div>
    )
}
