'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTranslation } from '@/utils/useTranslation'
import { useAuth } from '@/contexts/AuthContext'
import { hasAuthToken } from '@/utils/auth'
import ChatSidebar from '@/components/research-assistant/ChatSidebar'
import ChatThread from '@/components/research-assistant/ChatThread'
import {
  ACTIVE_SESSION_STORAGE_KEY,
  listChatSessions,
  loadChatMessages,
  sendChatQuery,
  type ChatMessageRecord,
  type ChatSessionSummary,
} from '@/utils/researchAssistantChat'

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000').replace(
  /\/$/,
  '',
)

const INITIAL_MESSAGE_LIMIT = 6
/** Set on F5/reload while a chat is open; cleared when leaving via header/nav (SPA). */
const RESTORE_SESSION_ON_RELOAD_KEY = 'ra_restore_session_on_reload'

const checkApiAvailability = async () => {
  try {
    const response = await fetch(`${API_BASE}/api/research-assistant/health/`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(5000),
    })
    if (!response.ok) return false
    const data = await response.json()
    return data.vector_db === 'available'
  } catch {
    return false
  }
}

function FeaturesIntro({ description }: { description: string }) {
  return (
    <div className='max-w-2xl mx-auto text-center px-4'>
      <p className='text-lg text-gray-600 mb-8'>{description}</p>
      <h2 className='text-xl font-bold mb-6 text-gray-900'>Features</h2>
      <ul className='space-y-5 text-left text-gray-700'>
        <li>
          <h3 className='font-semibold text-gray-900'>Semantic Search</h3>
          <p className='text-sm'>Vector search finds the most relevant papers for your question.</p>
        </li>
        <li>
          <h3 className='font-semibold text-gray-900'>AI-Generated Answers</h3>
          <p className='text-sm'>Answers synthesized from multiple research papers.</p>
        </li>
        <li>
          <h3 className='font-semibold text-gray-900'>Source Attribution</h3>
          <p className='text-sm'>
            <span className='font-medium'>Paper</span> badges link to paper details with previews.
          </p>
        </li>
      </ul>
    </div>
  )
}

export default function ResearchAssistantPage() {
  const { t } = useTranslation('research-assistant')
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()

  const [sessions, setSessions] = useState<ChatSessionSummary[]>([])
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessageRecord[]>([])
  const [hasMore, setHasMore] = useState(false)
  const [isLoadingOlder, setIsLoadingOlder] = useState(false)
  const [sessionsLoading, setSessionsLoading] = useState(false)
  const [messagesLoading, setMessagesLoading] = useState(false)

  const [query, setQuery] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expandedSourcesId, setExpandedSourcesId] = useState<string | null>(null)

  const [apiStatus, setApiStatus] = useState<'unknown' | 'connected' | 'disconnected'>('unknown')
  const [isCheckingConnection, setIsCheckingConnection] = useState(false)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const activeSessionIdRef = useRef<string | null>(null)

  const isAuthenticated = !!user && hasAuthToken()

  useEffect(() => {
    activeSessionIdRef.current = activeSessionId
  }, [activeSessionId])

  const checkConnection = async () => {
    setIsCheckingConnection(true)
    try {
      const ok = await checkApiAvailability()
      setApiStatus(ok ? 'connected' : 'disconnected')
    } catch {
      setApiStatus('disconnected')
    } finally {
      setIsCheckingConnection(false)
    }
  }

  const refreshSessions = useCallback(async (): Promise<ChatSessionSummary[]> => {
    if (!isAuthenticated) return []
    setSessionsLoading(true)
    try {
      const list = await listChatSessions()
      setSessions(list)
      return list
    } catch (e) {
      console.error(e)
      return []
    } finally {
      setSessionsLoading(false)
    }
  }, [isAuthenticated])

  const loadSessionMessages = useCallback(
    async (sessionId: string, before?: string) => {
      setMessagesLoading(!before)
      setIsLoadingOlder(!!before)
      try {
        const data = await loadChatMessages(sessionId, {
          limit: INITIAL_MESSAGE_LIMIT,
          before,
        })
        if (before) {
          setMessages((prev) => [...data.messages, ...prev])
        } else {
          setMessages(data.messages)
        }
        setHasMore(data.has_more)
      } catch (e) {
        console.error(e)
        setError('Failed to load chat history.')
        throw e
      } finally {
        setMessagesLoading(false)
        setIsLoadingOlder(false)
      }
    },
    [],
  )

  const startNewChat = useCallback(() => {
    setActiveSessionId(null)
    setMessages([])
    setHasMore(false)
    setError(null)
    setExpandedSourcesId(null)
    setQuery('')
    if (typeof window !== 'undefined') {
      localStorage.removeItem(ACTIVE_SESSION_STORAGE_KEY)
    }
  }, [])

  const selectSession = useCallback(
    async (sessionId: string) => {
      setActiveSessionId(sessionId)
      setError(null)
      setExpandedSourcesId(null)
      if (typeof window !== 'undefined') {
        localStorage.setItem(ACTIVE_SESSION_STORAGE_KEY, sessionId)
      }
      try {
        await loadSessionMessages(sessionId)
      } catch {
        startNewChat()
      }
    },
    [loadSessionMessages, startNewChat],
  )

  useEffect(() => {
    checkConnection()
  }, [])

  // F5 / browser reload on this page → allow restoring the open chat on next mount.
  useEffect(() => {
    const markReloadRestore = () => {
      if (activeSessionIdRef.current) {
        sessionStorage.setItem(RESTORE_SESSION_ON_RELOAD_KEY, '1')
      }
    }
    window.addEventListener('beforeunload', markReloadRestore)
    return () => {
      window.removeEventListener('beforeunload', markReloadRestore)
      sessionStorage.removeItem(RESTORE_SESSION_ON_RELOAD_KEY)
    }
  }, [])

  useEffect(() => {
    if (authLoading) return
    if (!isAuthenticated) return

    const shouldRestore =
      typeof window !== 'undefined' &&
      sessionStorage.getItem(RESTORE_SESSION_ON_RELOAD_KEY) === '1'
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem(RESTORE_SESSION_ON_RELOAD_KEY)
    }

    if (shouldRestore) {
      refreshSessions().then(async (list) => {
        const stored =
          typeof window !== 'undefined'
            ? localStorage.getItem(ACTIVE_SESSION_STORAGE_KEY)
            : null
        if (stored && list.some((s) => s.id === stored)) {
          await selectSession(stored)
        } else {
          startNewChat()
        }
      })
    } else {
      startNewChat()
      refreshSessions()
    }
  }, [authLoading, isAuthenticated, refreshSessions, selectSession, startNewChat])

  const handleLoadOlder = () => {
    if (!activeSessionId || !messages.length || isLoadingOlder) return
    loadSessionMessages(activeSessionId, messages[0].id)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim() || isLoading) return

    if (!isAuthenticated) {
      router.push('/login')
      return
    }

    const isApiAvailable = await checkApiAvailability()
    if (!isApiAvailable) {
      setError('Research Assistant API is unavailable. Check Docker / research-assistant service.')
      setApiStatus('disconnected')
      return
    }

    setIsLoading(true)
    setError(null)
    const text = query.trim()
    setQuery('')

    const optimisticUser: ChatMessageRecord = {
      id: `temp-user-${Date.now()}`,
      role: 'user',
      content: text,
      created_at: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, optimisticUser])

    try {
      const sessionForQuery =
        activeSessionId && sessions.some((s) => s.id === activeSessionId)
          ? activeSessionId
          : null
      const data = await sendChatQuery(text, sessionForQuery)
      const sid = data.session_id

      if (!activeSessionId) {
        setActiveSessionId(sid)
        if (typeof window !== 'undefined') {
          localStorage.setItem(ACTIVE_SESSION_STORAGE_KEY, sid)
        }
      }

      setMessages((prev) => {
        const withoutTemp = prev.filter((m) => m.id !== optimisticUser.id)
        const hasUser = withoutTemp.some((m) => m.id === data.user_message.id)
        const hasAssistant = withoutTemp.some((m) => m.id === data.assistant_message.id)
        let next = withoutTemp
        if (!hasUser) next = [...next, data.user_message]
        if (!hasAssistant) next = [...next, data.assistant_message]
        return next
      })

      await refreshSessions()
      setApiStatus('connected')
    } catch (err) {
      setMessages((prev) => prev.filter((m) => m.id !== optimisticUser.id))
      setQuery(text)
      setError(err instanceof Error ? err.message : 'Failed to get response.')
    } finally {
      setIsLoading(false)
    }
  }

  const showIntro = messages.length === 0 && !messagesLoading

  if (authLoading) {
    return (
      <div className='flex h-[calc(100vh-64px)] items-center justify-center bg-gray-100'>
        <p className='text-gray-600'>Loading...</p>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className='bg-gray-100 min-h-[calc(100vh-64px)] flex flex-col items-center justify-center p-6'>
        <h1 className='text-3xl font-bold text-[#d9363e] mb-4'>{t('title')}</h1>
        <p className='text-gray-700 mb-6 text-center max-w-md'>
          Sign in to save chat history and continue conversations across visits.
        </p>
        <Link
          href='/login'
          className='bg-[#d9363e] hover:bg-red-700 text-white px-6 py-2 rounded-lg font-medium'
        >
          Sign in
        </Link>
      </div>
    )
  }

  return (
    <div className='flex h-[calc(100vh-64px)] bg-gray-100 text-gray-900'>
      <ChatSidebar
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSelectSession={selectSession}
        onNewChat={startNewChat}
        isLoading={sessionsLoading}
      />

      <div className='relative flex flex-1 flex-col min-w-0 min-h-0 bg-gray-100'>
        <div
          role='toolbar'
          className='flex shrink-0 items-center justify-between border-b border-gray-200 bg-gray-100 px-4 py-2.5'
        >
          <h1 className='text-sm font-semibold text-gray-800 truncate max-w-[60%]'>
            {activeSessionId
              ? sessions.find((s) => s.id === activeSessionId)?.title || 'New chat'
              : 'New chat'}
          </h1>
          <div className='flex items-center gap-2 text-xs text-gray-600'>
            <span className='flex items-center gap-1.5 rounded-md border border-gray-200 bg-white px-2 py-1'>
              <span
                className={`h-2 w-2 rounded-full ${
                  apiStatus === 'connected'
                    ? 'bg-green-500'
                    : apiStatus === 'disconnected'
                      ? 'bg-red-500'
                      : 'bg-gray-400'
                }`}
              />
              <span>RAG {apiStatus === 'connected' ? 'online' : apiStatus}</span>
              {apiStatus === 'disconnected' && (
                <button
                  type='button'
                  onClick={checkConnection}
                  disabled={isCheckingConnection}
                  className='text-[#d9363e] hover:underline'
                >
                  Retry
                </button>
              )}
            </span>
            <Link
              href='/research-assistant/admin'
              className='rounded-md border border-gray-200 bg-white px-2 py-1 text-gray-700 hover:bg-gray-100'
            >
              Admin
            </Link>
          </div>
        </div>

        {error && (
          <div className='mx-4 mt-3 rounded-lg border border-red-300 bg-red-50 px-4 py-2 text-sm text-red-700'>
            {error}
          </div>
        )}

        <div ref={scrollAreaRef} className='flex-1 min-h-0 overflow-y-auto'>
          {messagesLoading && messages.length === 0 ? (
            <div className='flex min-h-full items-center justify-center text-gray-500'>
              Loading conversation...
            </div>
          ) : showIntro ? (
            <div className='flex min-h-full items-center justify-center px-4 py-16 pb-36'>
              <FeaturesIntro description={t('description')} />
            </div>
          ) : messages.length > 0 ? (
            <ChatThread
              messages={messages}
              hasMore={hasMore}
              isLoadingOlder={isLoadingOlder}
              onLoadOlder={handleLoadOlder}
              scrollContainerRef={scrollAreaRef}
              expandedSourcesId={expandedSourcesId}
              onToggleSources={(id) =>
                setExpandedSourcesId((cur) => (cur === id ? null : id))
              }
            />
          ) : null}
        </div>

        {/* Floating composer + scroll fade (ChatGPT-style) */}
        <div className='pointer-events-none absolute inset-x-0 bottom-0 z-20'>
          <div className='mx-auto w-full max-w-3xl px-4'>
            <div
              className='h-[5.5rem] bg-gradient-to-t from-gray-100 from-[12%] via-gray-100/75 via-[40%] to-transparent'
              aria-hidden
            />
            <form
              onSubmit={handleSubmit}
              className='pointer-events-auto -mt-[4.25rem] pb-3'
            >
              <div className='flex items-center gap-2 rounded-full border border-gray-200/90 bg-white/95 backdrop-blur-sm px-3 py-2 shadow-[0_2px_16px_rgba(0,0,0,0.08)] transition-shadow focus-within:shadow-[0_4px_24px_rgba(0,0,0,0.1)] focus-within:border-gray-300'>
                <input
                  type='text'
                  placeholder='Ask anything about research papers...'
                  className='flex-1 min-w-0 bg-transparent border-none outline-none text-sm text-gray-900 placeholder:text-gray-400 py-1'
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  disabled={isLoading}
                />
                {isLoading ? (
                  <div className='h-8 w-8 shrink-0 flex items-center justify-center'>
                    <div className='h-4 w-4 animate-spin rounded-full border-2 border-[#d9363e] border-t-transparent' />
                  </div>
                ) : (
                  <button
                    type='submit'
                    disabled={!query.trim()}
                    className='h-8 w-8 shrink-0 rounded-full bg-[#d9363e] text-white flex items-center justify-center hover:bg-red-700 disabled:opacity-40 transition-colors'
                    aria-label='Send'
                  >
                    <svg className='h-3.5 w-3.5' fill='currentColor' viewBox='0 0 20 20'>
                      <path d='M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z' />
                    </svg>
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
