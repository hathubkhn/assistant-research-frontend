'use client'

import React from 'react'
import type { ChatSessionSummary } from '@/utils/researchAssistantChat'

interface ChatSidebarProps {
  sessions: ChatSessionSummary[]
  activeSessionId: string | null
  onSelectSession: (id: string) => void
  onNewChat: () => void
  isLoading?: boolean
}

export default function ChatSidebar({
  sessions,
  activeSessionId,
  onSelectSession,
  onNewChat,
  isLoading,
}: ChatSidebarProps) {
  return (
    <aside className='w-64 shrink-0 border-r border-gray-300 bg-white flex flex-col h-full'>
      <div className='p-3 border-b border-gray-200'>
        <button
          type='button'
          onClick={onNewChat}
          className='w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50 hover:border-[#d9363e]/40 transition-colors'
        >
          + New chat
        </button>
      </div>
      <div className='flex-1 overflow-y-auto p-2'>
        <p className='px-2 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wide'>
          Recent
        </p>
        {isLoading && (
          <p className='px-2 py-4 text-sm text-gray-500'>Loading...</p>
        )}
        {!isLoading && sessions.length === 0 && (
          <p className='px-2 py-4 text-sm text-gray-500'>No chats yet</p>
        )}
        <ul className='space-y-0.5'>
          {sessions.map((s) => (
            <li key={s.id}>
              <button
                type='button'
                onClick={() => onSelectSession(s.id)}
                className={`w-full text-left rounded-lg px-3 py-2 text-sm truncate transition-colors ${
                  activeSessionId === s.id
                    ? 'bg-gray-200 text-gray-900 font-medium'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
                title={s.title}
              >
                {s.title}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  )
}
