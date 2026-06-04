import { fetchWithAuth } from './auth'
import type { Citation } from '@/components/research-assistant/AnswerWithCitations'

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000').replace(/\/$/, '')

export interface ChatSessionSummary {
  id: string
  title: string
  created_at: string
  updated_at: string
  message_count: number
}

export interface ChatMessageRecord {
  id: string
  role: 'user' | 'assistant'
  content: string
  papers?: Array<{
    paper_id: string
    title: string
    abstract?: string
    keywords?: string[]
    score?: number
  }>
  citations?: Citation[]
  using_fallback?: boolean | null
  created_at: string
}

export interface QueryChatResponse {
  session_id: string
  session_title: string
  answer: string
  papers: ChatMessageRecord['papers']
  citations: Citation[]
  using_fallback?: boolean
  user_message: ChatMessageRecord
  assistant_message: ChatMessageRecord
}

export async function listChatSessions(): Promise<ChatSessionSummary[]> {
  const res = await fetchWithAuth(`${API_BASE}/api/research-assistant/chat/sessions/`)
  if (!res.ok) {
    throw new Error(`Failed to load sessions (${res.status})`)
  }
  const data = await res.json()
  return data.sessions || []
}

export async function loadChatMessages(
  sessionId: string,
  options?: { limit?: number; before?: string },
): Promise<{ messages: ChatMessageRecord[]; has_more: boolean }> {
  const params = new URLSearchParams()
  if (options?.limit) params.set('limit', String(options.limit))
  if (options?.before) params.set('before', options.before)
  const qs = params.toString() ? `?${params.toString()}` : ''
  const res = await fetchWithAuth(
    `${API_BASE}/api/research-assistant/chat/sessions/${sessionId}/messages/${qs}`,
  )
  if (!res.ok) {
    throw new Error(`Failed to load messages (${res.status})`)
  }
  return res.json()
}

export async function sendChatQuery(
  query: string,
  sessionId?: string | null,
): Promise<QueryChatResponse> {
  const res = await fetchWithAuth(`${API_BASE}/api/research-assistant/chat/query/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query,
      ...(sessionId ? { session_id: sessionId } : {}),
    }),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || `Query failed (${res.status})`)
  }
  return res.json()
}

export const ACTIVE_SESSION_STORAGE_KEY = 'ra_active_session_id'
