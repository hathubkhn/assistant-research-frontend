import { fetchWithAuth } from './auth'

export interface RecommendedPaperApiItem {
  id: string
  title: string
  authors?: string[] | string
  keywords?: string[] | string
  created_at?: string
  venue_name?: string
  venue?: string | { name?: string; abbreviation?: string }
  conference_details?: { name?: string; abbreviation?: string }
  journal_details?: { name?: string; abbreviation?: string }
  year?: number
  publication_date?: string
  abstract?: string
  downloadUrl?: string
  pdf_url?: string
  doi?: string
  field?: string
}

export function getRecommendedVenueLabel(
  paper: RecommendedPaperApiItem,
): string {
  if (paper.venue_name?.trim()) {
    return paper.venue_name.trim()
  }

  const conference = paper.conference_details
  if (conference?.abbreviation || conference?.name) {
    return conference.abbreviation || conference.name || 'Unknown Venue'
  }

  const journal = paper.journal_details
  if (journal?.abbreviation || journal?.name) {
    return journal.abbreviation || journal.name || 'Unknown Venue'
  }

  if (typeof paper.venue === 'string' && paper.venue.trim()) {
    return paper.venue.trim()
  }

  if (paper.venue && typeof paper.venue === 'object') {
    return paper.venue.abbreviation || paper.venue.name || 'Unknown Venue'
  }

  return 'Unknown Venue'
}

export async function fetchRecommendedPapersFromApi(): Promise<
  RecommendedPaperApiItem[]
> {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
  const response = await fetchWithAuth(
    `${API_URL}/api/my-library/?section=recommended`,
  )

  if (!response.ok) {
    return []
  }

  const data = await response.json()
  return Array.isArray(data) ? data : []
}
