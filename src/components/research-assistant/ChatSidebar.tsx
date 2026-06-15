'use client'

import React, { useEffect, useRef, useState } from 'react'
import type { ChatSessionSummary } from '@/utils/researchAssistantChat'
import DeleteChatConfirmModal from '@/components/research-assistant/DeleteChatConfirmModal'

interface ChatSidebarProps {
  sessions: ChatSessionSummary[]
  activeSessionId: string | null
  onSelectSession: (id: string) => void
  onNewChat: () => void
  onRenameSession: (id: string, title: string) => Promise<void>
  onDeleteSession: (id: string) => Promise<void>
  isLoading?: boolean
  labels?: {
    newChat: string
    recent: string
    loading: string
    noChats: string
    rename: string
  delete: string
  deleteConfirm: string
  deleteCancel: string
    renamePlaceholder: string
    save: string
    cancel: string
    sessionActions: string
  }
}

const defaultLabels = {
  newChat: '+ New chat',
  recent: 'Recent',
  loading: 'Loading...',
  noChats: 'No chats yet',
  rename: 'Rename',
  delete: 'Delete',
  deleteConfirm: 'Are you sure you want to delete this chat?',
  deleteCancel: 'Cancel',
  renamePlaceholder: 'Chat title',
  save: 'Save',
  cancel: 'Cancel',
  sessionActions: 'Session actions',
}

export default function ChatSidebar({
  sessions,
  activeSessionId,
  onSelectSession,
  onNewChat,
  onRenameSession,
  onDeleteSession,
  isLoading,
  labels: labelOverrides,
}: ChatSidebarProps) {
  const labels = { ...defaultLabels, ...labelOverrides }
  const [menuSessionId, setMenuSessionId] = useState<string | null>(null)
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [hoveredSessionId, setHoveredSessionId] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<ChatSessionSummary | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const editInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuSessionId(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (editingSessionId && editInputRef.current) {
      editInputRef.current.focus()
      editInputRef.current.select()
    }
  }, [editingSessionId])

  const startRename = (session: ChatSessionSummary) => {
    setMenuSessionId(null)
    setEditingSessionId(session.id)
    setEditTitle(session.title)
  }

  const cancelRename = () => {
    setEditingSessionId(null)
    setEditTitle('')
  }

  const submitRename = async () => {
    if (!editingSessionId || !editTitle.trim() || actionLoading) return
    setActionLoading(true)
    try {
      await onRenameSession(editingSessionId, editTitle.trim())
      cancelRename()
    } finally {
      setActionLoading(false)
    }
  }

  const openDeleteConfirm = (session: ChatSessionSummary) => {
    setMenuSessionId(null)
    setDeleteTarget(session)
  }

  const cancelDelete = () => {
    if (actionLoading) return
    setDeleteTarget(null)
  }

  const confirmDelete = async () => {
    if (!deleteTarget || actionLoading) return
    setActionLoading(true)
    try {
      await onDeleteSession(deleteTarget.id)
      setDeleteTarget(null)
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <>
      <DeleteChatConfirmModal
        open={!!deleteTarget}
        message={labels.deleteConfirm}
        cancelLabel={labels.deleteCancel}
        deleteLabel={labels.delete}
        loading={actionLoading}
        onCancel={cancelDelete}
        onConfirm={confirmDelete}
      />
    <aside className='w-64 shrink-0 border-r border-gray-300 bg-white flex flex-col h-full'>
      <div className='p-3 border-b border-gray-200'>
        <button
          type='button'
          onClick={onNewChat}
          className='w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50 hover:border-[#d9363e]/40 transition-colors'
        >
          {labels.newChat}
        </button>
      </div>
      <div className='flex-1 overflow-y-auto p-2'>
        <p className='px-2 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wide'>
          {labels.recent}
        </p>
        {isLoading && (
          <p className='px-2 py-4 text-sm text-gray-500'>{labels.loading}</p>
        )}
        {!isLoading && sessions.length === 0 && (
          <p className='px-2 py-4 text-sm text-gray-500'>{labels.noChats}</p>
        )}
        <ul className='space-y-0.5'>
          {sessions.map((s) => {
            const isActive = activeSessionId === s.id
            const isHovered = hoveredSessionId === s.id
            const isEditing = editingSessionId === s.id
            const showMenuButton = (isHovered || menuSessionId === s.id) && !isEditing

            if (isEditing) {
              return (
                <li key={s.id} className='px-1 py-0.5'>
                  <div className='rounded-lg border border-gray-300 bg-white p-2 space-y-2'>
                    <input
                      ref={editInputRef}
                      type='text'
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') submitRename()
                        if (e.key === 'Escape') cancelRename()
                      }}
                      placeholder={labels.renamePlaceholder}
                      className='w-full rounded border border-gray-300 px-2 py-1 text-sm outline-none focus:border-[#d9363e]'
                      disabled={actionLoading}
                    />
                    <div className='flex gap-2'>
                      <button
                        type='button'
                        onClick={submitRename}
                        disabled={!editTitle.trim() || actionLoading}
                        className='flex-1 rounded bg-[#d9363e] px-2 py-1 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50'
                      >
                        {labels.save}
                      </button>
                      <button
                        type='button'
                        onClick={cancelRename}
                        disabled={actionLoading}
                        className='flex-1 rounded border border-gray-300 px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50'
                      >
                        {labels.cancel}
                      </button>
                    </div>
                  </div>
                </li>
              )
            }

            return (
              <li
                key={s.id}
                className='relative group'
                onMouseEnter={() => setHoveredSessionId(s.id)}
                onMouseLeave={() => {
                  if (menuSessionId !== s.id) setHoveredSessionId(null)
                }}
              >
                <div
                  className={`flex items-center rounded-lg transition-colors ${
                    isActive ? 'bg-gray-200' : 'hover:bg-gray-100'
                  }`}
                >
                  <button
                    type='button'
                    onClick={() => onSelectSession(s.id)}
                    className={`flex-1 min-w-0 text-left px-3 py-2 text-sm truncate ${
                      isActive ? 'text-gray-900 font-medium' : 'text-gray-700'
                    }`}
                    title={s.title}
                  >
                    {s.title}
                  </button>
                  {showMenuButton && (
                    <div className='relative pr-1' ref={menuSessionId === s.id ? menuRef : undefined}>
                      <button
                        type='button'
                        aria-label={labels.sessionActions}
                        onClick={(e) => {
                          e.stopPropagation()
                          setMenuSessionId((cur) => (cur === s.id ? null : s.id))
                        }}
                        className='flex h-7 w-7 items-center justify-center rounded-md text-gray-500 hover:bg-gray-200 hover:text-gray-800'
                      >
                        <svg className='h-4 w-4' viewBox='0 0 20 20' fill='currentColor' aria-hidden>
                          <path d='M4 10a1.5 1.5 0 113 0 1.5 1.5 0 01-3 0zm5 0a1.5 1.5 0 113 0 1.5 1.5 0 01-3 0zm5 0a1.5 1.5 0 113 0 1.5 1.5 0 01-3 0z' />
                        </svg>
                      </button>
                      {menuSessionId === s.id && (
                        <div className='absolute right-0 top-full z-30 mt-1 w-40 rounded-lg border border-gray-200 bg-white py-1 shadow-lg'>
                          <button
                            type='button'
                            onClick={() => startRename(s)}
                            className='flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50'
                          >
                            <svg className='h-4 w-4 shrink-0' viewBox='0 0 20 20' fill='currentColor' aria-hidden>
                              <path d='M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z' />
                            </svg>
                            {labels.rename}
                          </button>
                          <button
                            type='button'
                            onClick={() => openDeleteConfirm(s)}
                            className='flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50'
                          >
                            <svg className='h-4 w-4 shrink-0' viewBox='0 0 20 20' fill='currentColor' aria-hidden>
                              <path
                                fillRule='evenodd'
                                d='M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z'
                                clipRule='evenodd'
                              />
                            </svg>
                            {labels.delete}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      </div>
    </aside>
    </>
  )
}
