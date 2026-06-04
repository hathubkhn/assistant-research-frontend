'use client'

import React, { useEffect, useRef } from 'react'
import AnswerWithCitations, { type Citation } from './AnswerWithCitations'
import SourcePaperCard from './SourcePaperCard'
import type { ChatMessageRecord } from '@/utils/researchAssistantChat'

interface ChatThreadProps {
  messages: ChatMessageRecord[]
  hasMore: boolean
  isLoadingOlder: boolean
  onLoadOlder: () => void
  expandedSourcesId: string | null
  onToggleSources: (messageId: string) => void
  /** Scroll container for infinite scroll (parent with overflow-y-auto). */
  scrollContainerRef?: React.RefObject<HTMLDivElement | null>
}

export default function ChatThread({
  messages,
  hasMore,
  isLoadingOlder,
  onLoadOlder,
  expandedSourcesId,
  onToggleSources,
  scrollContainerRef,
}: ChatThreadProps) {
  const topSentinelRef = useRef<HTMLDivElement>(null)
  const prevScrollHeightRef = useRef(0)

  useEffect(() => {
    const el = topSentinelRef.current
    const root = scrollContainerRef?.current
    if (!el || !hasMore || !root) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !isLoadingOlder) {
          onLoadOlder()
        }
      },
      { root, threshold: 0.1 },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [hasMore, isLoadingOlder, onLoadOlder, scrollContainerRef])

  useEffect(() => {
    const container = scrollContainerRef?.current
    if (!container || isLoadingOlder) return
    if (prevScrollHeightRef.current > 0) {
      const delta = container.scrollHeight - prevScrollHeightRef.current
      container.scrollTop += delta
      prevScrollHeightRef.current = 0
    }
  }, [messages, isLoadingOlder, scrollContainerRef])

  const handleLoadOlderClick = () => {
    const container = scrollContainerRef?.current
    if (container) {
      prevScrollHeightRef.current = container.scrollHeight
    }
    onLoadOlder()
  }

  return (
    <div className='px-4 pt-6 pb-36'>
      <div ref={topSentinelRef} className='h-1' />
      {hasMore && (
        <div className='flex justify-center mb-4'>
          <button
            type='button'
            onClick={handleLoadOlderClick}
            disabled={isLoadingOlder}
            className='text-sm text-[#d9363e] hover:underline disabled:opacity-50'
          >
            {isLoadingOlder ? 'Loading older messages...' : 'Load older messages'}
          </button>
        </div>
      )}
      <div className='max-w-3xl mx-auto space-y-6'>
        {messages.map((msg) => (
          <div key={msg.id}>
            {msg.role === 'user' ? (
              <div className='flex justify-end'>
                <div className='max-w-[85%] rounded-2xl bg-[#d9363e] text-white px-4 py-3 text-sm leading-relaxed'>
                  {msg.content}
                </div>
              </div>
            ) : (
              <div className='rounded-xl border border-gray-200 bg-white p-4 shadow-sm'>
                <AnswerWithCitations
                  answer={msg.content}
                  citations={(msg.citations as Citation[]) || []}
                />
                {msg.papers && msg.papers.length > 0 && (
                  <div className='mt-3 pt-3 border-t border-gray-100'>
                    <button
                      type='button'
                      onClick={() => onToggleSources(msg.id)}
                      className='text-sm text-[#d9363e] hover:underline font-medium'
                    >
                      {expandedSourcesId === msg.id ? 'Hide sources' : `Sources (${msg.papers.length})`}
                    </button>
                    {expandedSourcesId === msg.id && (
                      <div className='mt-3 grid gap-3'>
                        {msg.papers.map((paper, idx) => (
                          <SourcePaperCard
                            key={`${msg.id}-paper-${idx}`}
                            paper={paper}
                            index={idx}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
