'use client'
import DataPagination from '@/app/components/DataPagination'
import { useTranslation } from '@/utils/useTranslation'
import { ClearOutlined, LinkOutlined, SearchOutlined } from '@ant-design/icons'
import {
  Alert,
  Button,
  Card,
  Checkbox,
  Col,
  Input,
  Layout,
  Row,
  Select,
  Space,
  Spin,
  Tag,
  Typography,
} from 'antd'
import axios from 'axios'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useRef, useState } from 'react'

const { Title, Text, Paragraph } = Typography
const { Search } = Input

const API_URL = process.env.NEXT_PUBLIC_API_URL

interface Venue {
  id: string;
  name: string;
  abbreviation: string | null;
  rank?: string;
  impactFactor?: number;
  quartile?: string;
}

interface Paper {
  id: string;
  title: string;
  authors: string[];
  venue: Venue | null;
  venueType: 'conference' | 'journal';
  year: number;
  field: string;
  keywords: string[];
  abstract: string;
  downloadUrl: string;
  doi?: string;
  datasets?: string[];
  impactFactor?: number;
  quartile?: 'Q1' | 'Q2' | 'Q3' | 'Q4';
}

interface Filters {
  years: number[];
  venues: string[];
  fields: string[];
  venueTypes: Array<'conference' | 'journal'>;
}

interface Conference {
  id: string;
  name: string;
  abbreviation: string;
  rank?: string;
}
interface Journal {
  id: string;
  name: string;
  abbreviation: string;
  impactFactor?: number;
  quartile?: string;
}

const CONFERENCE_TOP_RANKS = new Set(['A*', 'A'])
const VENUE_TOP_PAGE_SIZE = 100
const VENUE_OTHER_PAGE_SIZE = 200

function conferenceDisplayName(conf: Conference): string {
  return conf.abbreviation || conf.name
}

function sortConferencesByRank(conferences: Conference[]) {
  const rankOrder: Record<string, number> = {
    'A*': 0,
    A: 1,
    B: 2,
    C: 3,
  }
  const isTop = (c: Conference) =>
    Boolean(c.rank) && CONFERENCE_TOP_RANKS.has(c.rank!)
  const topTier = conferences.filter(isTop)
  const other = conferences.filter((c) => !isTop(c))
  const byRankThenName = (a: Conference, b: Conference) => {
    const ra = rankOrder[a.rank ?? ''] ?? 50
    const rb = rankOrder[b.rank ?? ''] ?? 50
    if (ra !== rb) return ra - rb
    return conferenceDisplayName(a).localeCompare(conferenceDisplayName(b))
  }
  topTier.sort(byRankThenName)
  other.sort((a, b) =>
    conferenceDisplayName(a).localeCompare(conferenceDisplayName(b)),
  )
  return { topTier, other }
}

function sortJournalsByQuartile(journals: Journal[]) {
  const quartileOrder: Record<string, number> = {
    Q1: 0,
    Q2: 1,
    Q3: 2,
    Q4: 3,
  }
  const q1Journals = journals.filter((j) => j.quartile === 'Q1')
  const otherJournals = journals.filter((j) => j.quartile !== 'Q1')
  q1Journals.sort((a, b) => a.name.localeCompare(b.name))
  otherJournals.sort((a, b) => {
    const qa = quartileOrder[a.quartile ?? ''] ?? 50
    const qb = quartileOrder[b.quartile ?? ''] ?? 50
    if (qa !== qb) return qa - qb
    return a.name.localeCompare(b.name)
  })
  return { q1Journals, otherJournals }
}

async function countVenues() {
  try {
    const response = await axios.get(`${API_URL}/api/venues/counts/`, {
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      withCredentials: true,
    })
    console.log('Venues counts response:', response.data)
    return response.data
  } catch (error) {
    console.error('Error fetching venues counts:', error)
    return { conferencesCount: 0, journalsCount: 0 }
  }
}

async function fetchPapers(
  page: number = 1,
  size: number = 20,
  searchQuery: string = '',
  activeFilters: Filters,
) {
  try {
    const params: Record<string, string> = {
      page: page.toString(),
      pageSize: size.toString(),
    }

    if (searchQuery.trim()) {
      params.search = searchQuery.trim()
    }

    if (activeFilters.years.length > 0) {
      params.year = activeFilters.years[0].toString()
    }

    if (activeFilters.venues.length > 0) {
      params.venue_id = activeFilters.venues[0]
    }

    if (activeFilters.fields.length > 0) {
      params.field = activeFilters.fields[0]
    }

    if (activeFilters.venueTypes.length > 0) {
      params.venueType = activeFilters.venueTypes[0]
    }

    const response = await axios.get(`${API_URL}/api/papers/`, {
      params,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      withCredentials: true,
    })
    console.log('Papers response:', response.data)
    return response.data
  } catch (error) {
    console.error('Error fetching papers:', error)
    return { results: [], count: 0, next: null, previous: null }
  }
}

interface VenuesApiResponse {
  results: Conference[] | Journal[];
  pagination?: {
    totalItems: number;
    totalPages: number;
    page: number;
    pageSize: number;
  };
}

async function fetchConferences(options?: {
  tier?: 'top' | 'other';
  search?: string;
  page?: number;
  pageSize?: number;
}): Promise<VenuesApiResponse> {
  try {
    const params: Record<string, string | number> = {
      page: options?.page ?? 1,
      pageSize: options?.pageSize ?? VENUE_TOP_PAGE_SIZE,
    }
    if (options?.tier) params.tier = options.tier
    if (options?.search?.trim()) params.search = options.search.trim()

    const response = await axios.get(`${API_URL}/api/conferences/`, {
      params,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      withCredentials: true,
    })
    return response.data
  } catch (error) {
    console.error('Error fetching conferences:', error)
    return { results: [] }
  }
}

async function fetchJournals(options?: {
  tier?: 'top' | 'other';
  search?: string;
  page?: number;
  pageSize?: number;
}): Promise<VenuesApiResponse> {
  try {
    const params: Record<string, string | number> = {
      page: options?.page ?? 1,
      pageSize: options?.pageSize ?? VENUE_TOP_PAGE_SIZE,
    }
    if (options?.tier) params.tier = options.tier
    if (options?.search?.trim()) params.search = options.search.trim()

    const response = await axios.get(`${API_URL}/api/journals/`, {
      params,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      withCredentials: true,
    })
    return response.data
  } catch (error) {
    console.error('Error fetching journals:', error)
    return { results: [] }
  }
}

export default function PapersPage() {
  const router = useRouter()
  const { t } = useTranslation('papers')

  const [activeFilters, setActiveFilters] = useState<Filters>({
    years: [],
    venues: [],
    fields: [],
    venueTypes: [],
  })

  const [papers, setPapers] = useState<Paper[]>([])
  const [filteredPapers, setFilteredPapers] = useState<Paper[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  const [currentPage, setCurrentPage] = useState<number>(1)
  const [pageSize, setPageSize] = useState<number>(20)
  const [totalItems, setTotalItems] = useState<number>(0)
  const [searchQuery, setSearchQuery] = useState<string>('')

  const [expandedFilters, setExpandedFilters] = useState<{
    conferences: boolean;
    journals: boolean;
    fields: boolean;
    sidebar: boolean;
  }>({
    conferences: false,
    journals: false,
    fields: false,
    sidebar: true,
  })

  const [conferences, setConferences] = useState<Array<Conference>>([])
  const [otherConferencesList, setOtherConferencesList] = useState<
    Array<Conference>
  >([])
  const [otherConferencesTotal, setOtherConferencesTotal] = useState(0)
  const [otherConferencesLoaded, setOtherConferencesLoaded] = useState(false)
  const [otherConferencesPage, setOtherConferencesPage] = useState(0)
  const [loadingOtherConferences, setLoadingOtherConferences] = useState(false)

  const [journals, setJournals] = useState<Array<Journal>>([])
  const [otherJournalsList, setOtherJournalsList] = useState<Array<Journal>>([])
  const [otherJournalsTotal, setOtherJournalsTotal] = useState(0)
  const [otherJournalsLoaded, setOtherJournalsLoaded] = useState(false)
  const [otherJournalsPage, setOtherJournalsPage] = useState(0)
  const [loadingOtherJournals, setLoadingOtherJournals] = useState(false)
  const [conferenceSearch, setConferenceSearch] = useState('')
  const [journalSearch, setJournalSearch] = useState('')
  const [loadingConferences, setLoadingConferences] = useState(false)
  const [loadingJournals, setLoadingJournals] = useState(false)
  const [conferencesCount, setConferencesCount] = useState(0)
  const [journalsCount, setJournalsCount] = useState(0)
  const currentYear = new Date().getFullYear()
  const years = Array.from(
    { length: currentYear - 2000 + 3 },
    (_, i) => 2000 + i,
  ).reverse()

  const filteredConferences = useMemo(
    () =>
      conferences.filter(
        (conf) =>
          conf.name.toLowerCase().includes(conferenceSearch.toLowerCase()) ||
          conf.abbreviation
            ?.toLowerCase()
            .includes(conferenceSearch.toLowerCase()),
      ),
    [conferences, conferenceSearch],
  )

  const { topTier: topTierConferences } = useMemo(
    () => sortConferencesByRank(filteredConferences),
    [filteredConferences],
  )

  const filteredOtherConferences = useMemo(
    () =>
      otherConferencesList.filter(
        (conf) =>
          conf.name.toLowerCase().includes(conferenceSearch.toLowerCase()) ||
          conf.abbreviation
            ?.toLowerCase()
            .includes(conferenceSearch.toLowerCase()),
      ),
    [otherConferencesList, conferenceSearch],
  )

  const { other: sortedOtherConferences } = useMemo(
    () => sortConferencesByRank(filteredOtherConferences),
    [filteredOtherConferences],
  )

  const conferencesToDisplay = expandedFilters.conferences
    ? [...topTierConferences, ...sortedOtherConferences]
    : topTierConferences

  const seeMoreConferencesCount = conferenceSearch.trim()
    ? otherConferencesTotal
    : otherConferencesTotal > 0
      ? otherConferencesTotal
      : Math.max(conferencesCount - topTierConferences.length, 0)

  const filteredJournals = useMemo(
    () =>
      journals.filter(
        (journal) =>
          journal.name.toLowerCase().includes(journalSearch.toLowerCase()) ||
          journal.abbreviation
            ?.toLowerCase()
            .includes(journalSearch.toLowerCase()),
      ),
    [journals, journalSearch],
  )

  const { q1Journals } = useMemo(
    () => sortJournalsByQuartile(filteredJournals),
    [filteredJournals],
  )

  const filteredOtherJournals = useMemo(
    () =>
      otherJournalsList.filter(
        (journal) =>
          journal.name.toLowerCase().includes(journalSearch.toLowerCase()) ||
          journal.abbreviation
            ?.toLowerCase()
            .includes(journalSearch.toLowerCase()),
      ),
    [otherJournalsList, journalSearch],
  )

  const { otherJournals: sortedOtherJournals } = useMemo(
    () => sortJournalsByQuartile(filteredOtherJournals),
    [filteredOtherJournals],
  )

  const journalsToDisplay = expandedFilters.journals
    ? [...q1Journals, ...sortedOtherJournals]
    : q1Journals

  const seeMoreJournalsCount = journalSearch.trim()
    ? otherJournalsTotal
    : otherJournalsTotal > 0
      ? otherJournalsTotal
      : Math.max(journalsCount - q1Journals.length, 0)

  const loadOtherConferences = async (search?: string, append = false) => {
    setLoadingOtherConferences(true)
    try {
      const nextPage = append ? otherConferencesPage + 1 : 1
      const response = await fetchConferences({
        tier: 'other',
        search,
        page: nextPage,
        pageSize: VENUE_OTHER_PAGE_SIZE,
      })
      const results = response.results as Conference[]
      setOtherConferencesList((prev) =>
        append ? [...prev, ...results] : results,
      )
      setOtherConferencesPage(nextPage)
      setOtherConferencesTotal(
        response.pagination?.totalItems ?? results.length,
      )
      setOtherConferencesLoaded(true)
    } finally {
      setLoadingOtherConferences(false)
    }
  }

  const loadOtherJournals = async (search?: string, append = false) => {
    setLoadingOtherJournals(true)
    try {
      const nextPage = append ? otherJournalsPage + 1 : 1
      const response = await fetchJournals({
        tier: 'other',
        search,
        page: nextPage,
        pageSize: VENUE_OTHER_PAGE_SIZE,
      })
      const results = response.results as Journal[]
      setOtherJournalsList((prev) => (append ? [...prev, ...results] : results))
      setOtherJournalsPage(nextPage)
      setOtherJournalsTotal(response.pagination?.totalItems ?? results.length)
      setOtherJournalsLoaded(true)
    } finally {
      setLoadingOtherJournals(false)
    }
  }

  const remainingOtherConferences = Math.max(
    otherConferencesTotal - otherConferencesList.length,
    0,
  )
  const remainingOtherJournals = Math.max(
    otherJournalsTotal - otherJournalsList.length,
    0,
  )

  const reloadConferenceFilters = async (search?: string) => {
    setLoadingConferences(true)
    setOtherConferencesLoaded(false)
    setOtherConferencesPage(0)
    setOtherConferencesList([])
    setExpandedFilters((prev) => ({
      ...prev,
      conferences: false,
    }))
    try {
      const [topConferencesRes, otherConferencesMeta] = await Promise.all([
        fetchConferences({ tier: 'top', search, pageSize: VENUE_TOP_PAGE_SIZE }),
        fetchConferences({ tier: 'other', search, pageSize: 1 }),
      ])
      setConferences(topConferencesRes.results as Conference[])
      setOtherConferencesTotal(otherConferencesMeta.pagination?.totalItems ?? 0)
    } catch (error) {
      console.error('Error reloading conference filters:', error)
      setConferences([])
      setOtherConferencesTotal(0)
    } finally {
      setLoadingConferences(false)
    }
  }

  const reloadJournalFilters = async (search?: string) => {
    setLoadingJournals(true)
    setOtherJournalsLoaded(false)
    setOtherJournalsPage(0)
    setOtherJournalsList([])
    setExpandedFilters((prev) => ({
      ...prev,
      journals: false,
    }))
    try {
      const [topJournalsRes, otherJournalsMeta] = await Promise.all([
        fetchJournals({ tier: 'top', search, pageSize: VENUE_TOP_PAGE_SIZE }),
        fetchJournals({ tier: 'other', search, pageSize: 1 }),
      ])
      setJournals(topJournalsRes.results as Journal[])
      setOtherJournalsTotal(otherJournalsMeta.pagination?.totalItems ?? 0)
    } catch (error) {
      console.error('Error reloading journal filters:', error)
      setJournals([])
      setOtherJournalsTotal(0)
    } finally {
      setLoadingJournals(false)
    }
  }

  const handleConferenceSeeMore = async () => {
    if (expandedFilters.conferences) {
      setExpandedFilters((prev) => ({ ...prev, conferences: false }))
      return
    }
    if (!otherConferencesLoaded) {
      await loadOtherConferences(conferenceSearch)
    }
    setExpandedFilters((prev) => ({ ...prev, conferences: true }))
  }

  const handleJournalSeeMore = async () => {
    if (expandedFilters.journals) {
      setExpandedFilters((prev) => ({ ...prev, journals: false }))
      return
    }
    if (!otherJournalsLoaded) {
      await loadOtherJournals(journalSearch)
    }
    setExpandedFilters((prev) => ({ ...prev, journals: true }))
  }

  const toggleExpandedSection = (
    section: 'conferences' | 'journals' | 'fields',
  ) => {
    if (section === 'conferences') {
      void handleConferenceSeeMore()
      return
    }
    if (section === 'journals') {
      void handleJournalSeeMore()
      return
    }
    setExpandedFilters((prev) => ({
      ...prev,
      [section]: !prev[section],
    }))
  }

  const venuesInitialized = useRef(false)

  useEffect(() => {
    if (venuesInitialized.current) return
    venuesInitialized.current = true

    const loadVenueFilters = async () => {
      try {
        const countsResponse = await countVenues()
        setConferencesCount(countsResponse.conferencesCount || 0)
        setJournalsCount(countsResponse.journalsCount || 0)
      } catch (error) {
        console.error('Error fetching venue counts:', error)
      }
      await Promise.all([
        reloadConferenceFilters(),
        reloadJournalFilters(),
      ])
    }

    void loadVenueFilters()
  }, [])

  useEffect(() => {
    if (!venuesInitialized.current) return

    const timer = setTimeout(() => {
      void reloadConferenceFilters(conferenceSearch)
    }, 400)

    return () => clearTimeout(timer)
  }, [conferenceSearch])

  useEffect(() => {
    if (!venuesInitialized.current) return

    const timer = setTimeout(() => {
      void reloadJournalFilters(journalSearch)
    }, 400)

    return () => clearTimeout(timer)
  }, [journalSearch])

  const handleFetchPapers = async (
    page: number = 1,
    size: number = pageSize,
    searchQuery: string = '',
    activeFilters: Filters,
  ) => {
    try {
      setLoading(true)
      try {
        const paperData = await fetchPapers(
          page,
          size,
          searchQuery,
          activeFilters,
        )
        console.log('Paper data:', paperData)
        setPapers(paperData.results)
        setFilteredPapers(paperData.results)
        setTotalItems(
          paperData.pagination ? paperData.pagination.totalItems : 0,
        )
        setCurrentPage(paperData.pagination ? paperData.pagination.page : 1)
        setError(null)
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err)
        console.error('Error fetching papers:', errorMessage)

        if (axios.isAxiosError(err)) {
          if (err.code === 'ECONNABORTED') {
            setError('Request timed out. The API server may be unavailable.')
          } else if (err.response) {
            setError(
              `Failed to fetch papers (${err.response.status}): ${err.response.data}`,
            )
          } else if (err.request) {
            setError(
              `Cannot connect to the API server at ${API_URL}. Make sure the backend is running and CORS is properly configured.`,
            )
          } else {
            setError('Failed to load papers: ' + errorMessage)
          }
        } else {
          setError('Failed to load papers: ' + errorMessage)
        }
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void handleFetchPapers(1, pageSize, searchQuery, activeFilters)
  }, [activeFilters, pageSize])

  const handlePageChange = (page: number, size: number) => {
    setCurrentPage(page)
    if (size !== pageSize) {
      setPageSize(size)
    }
    handleFetchPapers(page, size, searchQuery, activeFilters)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const toggleVenueFilter = (venue: { id: string; name: string }) => {
    setActiveFilters((prev) => ({
      ...prev,
      venues: prev.venues.includes(venue.id) ? [] : [venue.id],
    }))
    setCurrentPage(1)
  }

  const toggleVenueTypeFilter = (type: 'conference' | 'journal') => {
    setActiveFilters((prev) => ({
      ...prev,
      venueTypes: prev.venueTypes.includes(type)
        ? prev.venueTypes.filter((t) => t !== type)
        : [type],
    }))
    setCurrentPage(1)
  }

  const clearFilters = () => {
    const emptyFilters: Filters = {
      years: [],
      venues: [],
      fields: [],
      venueTypes: [],
    }
    setActiveFilters(emptyFilters)
    setSearchQuery('')
    setCurrentPage(1)
    void handleFetchPapers(1, pageSize, '', emptyFilters)
  }

  const handleSearch = (value?: string) => {
    const query = value !== undefined ? value : searchQuery
    setSearchQuery(query)
    setCurrentPage(1)
    void handleFetchPapers(1, pageSize, query, activeFilters)
  }

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchQuery(value)

    if (value === '') {
      setCurrentPage(1)
      void handleFetchPapers(1, pageSize, '', activeFilters)
    }
  }

  const navigateToConference = (
    id: string | undefined,
    e: React.MouseEvent,
  ) => {
    e.stopPropagation()
    e.preventDefault()

    console.log('Navigating to conference with ID:', id)

    if (id) {
      const url = `/conferences/${id}`
      console.log('Conference navigation URL:', url)
      router.push(url)
    } else {
      console.log('Cannot navigate - conference ID is undefined')
    }
  }

  const navigateToJournal = (id: string | undefined, e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()

    console.log('Navigating to journal with ID:', id)

    if (id) {
      router.push(`/journals/${id}`)
    } else {
      console.log('Cannot navigate - journal ID is undefined')
    }
  }

  const filtersContent = (
    <Space direction='vertical' size='middle' style={{ width: '100%' }}>
      <>
        <Title level={5} style={{ marginBottom: 8 }}>
          Publication Type
        </Title>
        <Space direction='vertical' size='small'>
          <Checkbox
            checked={activeFilters.venueTypes.includes('conference')}
            onChange={() => toggleVenueTypeFilter('conference')}
          >
            Conferences
          </Checkbox>
          <Checkbox
            checked={activeFilters.venueTypes.includes('journal')}
            onChange={() => toggleVenueTypeFilter('journal')}
          >
            Journals
          </Checkbox>
        </Space>
      </>

      <>
        <Space
          style={{
            width: '100%',
            justifyContent: 'space-between',
            marginBottom: 8,
          }}
        >
          <Title level={5} style={{ margin: 0 }}>
            Conferences
          </Title>
          <Text type='secondary' style={{ fontSize: '12px' }}>
            {loadingConferences ? 'Loading...' : conferencesCount}
          </Text>
        </Space>
        <Space direction='vertical' size='small' style={{ width: '100%' }}>
          <Search
            placeholder='Search conferences...'
            value={conferenceSearch}
            onChange={(e) => {
              setConferenceSearch(e.target.value)
              setCurrentPage(1)
            }}
            size='small'
            prefix={<SearchOutlined />}
            allowClear
          />
          <div
            style={{
              maxHeight: !expandedFilters.conferences ? '240px' : 'auto',
              overflowY: 'auto',
            }}
          >
            {loadingConferences ? (
              <div style={{ textAlign: 'center', padding: '16px' }}>
                <Spin size='small' />
              </div>
            ) : conferencesToDisplay.length > 0 ? (
              <Space direction='vertical' size='small'>
                {conferencesToDisplay.map((conf) => (
                  <Space
                    key={conf.id}
                    style={{ width: '100%', justifyContent: 'space-between' }}
                  >
                    <Checkbox
                      checked={activeFilters.venues.includes(conf.id)}
                      onChange={() => toggleVenueFilter(conf)}
                      style={{ flex: 1 }}
                    >
                      <Text style={{ fontSize: '12px' }}>
                        {conf.abbreviation || conf.name}
                      </Text>
                    </Checkbox>
                    {conf.rank ? (
                      <Tag color='blue'>{conf.rank}</Tag>
                    ) : (
                      <Tag>Not ranked</Tag>
                    )}
                  </Space>
                ))}
              </Space>
            ) : seeMoreConferencesCount > 0 ? (
              <Text type='secondary' style={{ fontSize: '12px' }}>
                No A*/A conferences match your search. Use See More below.
              </Text>
            ) : (
              <Space direction='vertical' size='small'>
                <Text type='secondary' style={{ fontSize: '12px' }}>
                  No conferences found
                </Text>
                <Text type='secondary' style={{ fontSize: '11px' }}>
                  Try clearing your search or check network connection
                </Text>
              </Space>
            )}
          </div>

          {seeMoreConferencesCount > 0 && !expandedFilters.conferences && (
            <Button
              type='link'
              size='small'
              loading={loadingOtherConferences}
              onClick={() => void handleConferenceSeeMore()}
              style={{
                width: '100%',
                marginTop: '8px',
                padding: 0,
                height: 'auto',
              }}
            >
              {`See More (${seeMoreConferencesCount} more)`}
            </Button>
          )}
          {expandedFilters.conferences && (
            <Space direction='vertical' size='small' style={{ width: '100%' }}>
              {remainingOtherConferences > 0 && (
                <Button
                  type='link'
                  size='small'
                  loading={loadingOtherConferences}
                  onClick={() =>
                    void loadOtherConferences(conferenceSearch, true)
                  }
                  style={{ width: '100%', padding: 0, height: 'auto' }}
                >
                  {`Load more (${remainingOtherConferences} more)`}
                </Button>
              )}
              <Button
                type='link'
                size='small'
                onClick={() => void handleConferenceSeeMore()}
                style={{ width: '100%', padding: 0, height: 'auto' }}
              >
                Show A*/A Only
              </Button>
            </Space>
          )}
        </Space>
      </>

      <>
        <Space
          style={{
            width: '100%',
            justifyContent: 'space-between',
            marginBottom: 8,
          }}
        >
          <Title level={5} style={{ margin: 0 }}>
            Journals
          </Title>
          <Text type='secondary' style={{ fontSize: '12px' }}>
            {loadingJournals ? 'Loading...' : journalsCount}
          </Text>
        </Space>
        <Space direction='vertical' size='small' style={{ width: '100%' }}>
          <Search
            placeholder='Search journals...'
            value={journalSearch}
            onChange={(e) => setJournalSearch(e.target.value)}
            size='small'
            prefix={<SearchOutlined />}
            allowClear
          />
          <div
            style={{
              maxHeight: !expandedFilters.journals ? '240px' : 'auto',
              overflowY: 'auto',
            }}
          >
            {loadingJournals ? (
              <div style={{ textAlign: 'center', padding: '16px' }}>
                <Spin size='small' />
              </div>
            ) : journalsToDisplay.length > 0 ? (
              <Space direction='vertical' size='small'>
                {journalsToDisplay.map((journal) => (
                  <Space
                    key={journal.id}
                    style={{ width: '100%', justifyContent: 'space-between' }}
                  >
                    <Checkbox
                      checked={activeFilters.venues.includes(journal.id)}
                      onChange={() => toggleVenueFilter(journal)}
                      style={{ flex: 1 }}
                    >
                      <Text
                        style={{ fontSize: '12px' }}
                        ellipsis={{ tooltip: true }}
                      >
                        {journal.name}
                      </Text>
                    </Checkbox>
                    {journal.quartile ? (
                      <Tag
                        color={
                          journal.quartile === 'Q1'
                            ? 'green'
                            : journal.quartile === 'Q2'
                              ? 'blue'
                              : 'default'
                        }
                      >
                        {journal.quartile}
                      </Tag>
                    ) : null}
                  </Space>
                ))}
              </Space>
            ) : seeMoreJournalsCount > 0 ? (
              <Text type='secondary' style={{ fontSize: '12px' }}>
                No Q1 journals match your search. Use See More below.
              </Text>
            ) : (
              <Text type='secondary' style={{ fontSize: '12px' }}>
                No journals found
              </Text>
            )}
          </div>

          {seeMoreJournalsCount > 0 && !expandedFilters.journals && (
            <Button
              type='link'
              size='small'
              loading={loadingOtherJournals}
              onClick={() => void handleJournalSeeMore()}
              style={{
                width: '100%',
                marginTop: '8px',
                padding: 0,
                height: 'auto',
              }}
            >
              {`See More (${seeMoreJournalsCount} more)`}
            </Button>
          )}
          {expandedFilters.journals && (
            <Space direction='vertical' size='small' style={{ width: '100%' }}>
              {remainingOtherJournals > 0 && (
                <Button
                  type='link'
                  size='small'
                  loading={loadingOtherJournals}
                  onClick={() => void loadOtherJournals(journalSearch, true)}
                  style={{ width: '100%', padding: 0, height: 'auto' }}
                >
                  {`Load more (${remainingOtherJournals} more)`}
                </Button>
              )}
              <Button
                type='link'
                size='small'
                onClick={() => void handleJournalSeeMore()}
                style={{ width: '100%', padding: 0, height: 'auto' }}
              >
                Show Q1 Only
              </Button>
            </Space>
          )}
        </Space>
      </>

      <>
        <Title level={5} style={{ marginBottom: 8 }}>
          Publication Year
        </Title>
        <Select
          placeholder='Select publication year'
          value={activeFilters.years[0]}
          onChange={(selectedYear) => {
            setActiveFilters((prev) => ({
              ...prev,
              years: selectedYear ? [selectedYear] : [],
            }))
            setCurrentPage(1)
          }}
          style={{ width: '100%' }}
          size='small'
          allowClear
          showSearch
          filterOption={(input, option) =>
            option?.label
              ?.toString()
              .toLowerCase()
              .includes(input.toLowerCase()) ?? false
          }
          options={years.map((year) => ({
            label: year.toString(),
            value: year,
          }))}
          styles={{
            popup: {
              root: { maxHeight: 200, overflow: 'auto' },
            },
          }}
        />
      </>
    </Space>
  )

  return (
    <Layout style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      <Space
        direction='vertical'
        style={{
          maxWidth: '1280px',
          width: '100%',
          margin: '0 auto',
          padding: '20px 16px',
        }}
      >
        <Row gutter={[16, 24]}>
          <Col xs={0} sm={0} md={8} lg={6} xl={6}>
            <Card
              title={
                <Space
                  style={{ width: '100%', justifyContent: 'space-between' }}
                >
                  <Title level={4} style={{ margin: 0 }}>
                    Filters
                  </Title>
                  {(activeFilters.years.length > 0 ||
                    activeFilters.venues.length > 0 ||
                    activeFilters.fields.length > 0 ||
                    activeFilters.venueTypes.length > 0) && (
                    <Button
                      type='link'
                      size='small'
                      icon={<ClearOutlined />}
                      onClick={clearFilters}
                    >
                      Clear all
                    </Button>
                  )}
                </Space>
              }
              size='small'
            >
              {filtersContent}
            </Card>
          </Col>

          <Col xs={24} sm={24} md={16} lg={18} xl={18}>
            <Space direction='vertical' size='large' style={{ width: '100%' }}>
              <Space
                style={{
                  width: '100%',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <Title level={2} style={{ margin: 0 }}>
                  {t('title')}
                </Title>
              </Space>

              <Search
                placeholder='Search papers by title...'
                value={searchQuery}
                onChange={handleSearchChange}
                onSearch={handleSearch}
                size='large'
                style={{ width: '100%', maxWidth: 600 }}
                enterButton='Search'
                allowClear
              />

              {loading && (
                <div style={{ textAlign: 'center', padding: '80px 0' }}>
                  <Spin size='large' />
                </div>
              )}

              {error && (
                <Alert
                  message='Error'
                  description={error}
                  type='error'
                  showIcon
                  closable
                />
              )}

              {!loading && !error && filteredPapers.length > 0 ? (
                <Space
                  direction='vertical'
                  size='large'
                  style={{ width: '100%' }}
                >
                  <Text type='secondary'>
                    Showing {filteredPapers.length}{' '}
                    {filteredPapers.length === 1 ? 'result' : 'results'}
                    {searchQuery.trim() && (
                      <span> for "{searchQuery.trim()}"</span>
                    )}
                    {(activeFilters.years.length > 0 ||
                      activeFilters.venues.length > 0 ||
                      activeFilters.fields.length > 0 ||
                      activeFilters.venueTypes.length > 0) && (
                      <span> with applied filters</span>
                    )}
                  </Text>
                  <Space
                    direction='vertical'
                    size='middle'
                    style={{ width: '100%' }}
                  >
                    {filteredPapers.map((paper) => (
                      <Link
                        key={paper.id}
                        href={`/papers/${paper.id}`}
                        style={{ textDecoration: 'none' }}
                      >
                        <Card
                          hoverable
                          style={{ width: '100%' }}
                          styles={{ body: { padding: '24px' } }}
                        >
                          <Space
                            direction='vertical'
                            size='middle'
                            style={{ width: '100%' }}
                          >
                            <Space
                              style={{
                                width: '100%',
                                justifyContent: 'space-between',
                                alignItems: 'flex-start',
                              }}
                            >
                              <Title
                                level={4}
                                style={{
                                  margin: 0,
                                  color: '#1890ff',
                                  cursor: 'pointer',
                                }}
                              >
                                {paper.title}
                              </Title>
                              <Space direction='vertical' align='end'>
                                {paper.venue ? (
                                  <Button
                                    type='primary'
                                    size='small'
                                    icon={<LinkOutlined />}
                                    onClick={(e) => {
                                      if (paper.venueType === 'conference') {
                                        navigateToConference(
                                          paper.venue?.id,
                                          e,
                                        )
                                      } else {
                                        navigateToJournal(paper.venue?.id, e)
                                      }
                                    }}
                                  >
                                    {paper.venue.abbreviation ||
                                      paper.venue.name}
                                  </Button>
                                ) : (
                                  <Tag color='blue'>Venue: Unknown</Tag>
                                )}
                                <Text
                                  type='secondary'
                                  style={{ fontSize: '12px' }}
                                >
                                  {paper.year}
                                </Text>
                              </Space>
                            </Space>

                            <Text type='secondary'>
                              <Text strong>Authors:</Text>{' '}
                              {paper.authors.join(', ')}
                            </Text>

                            <Space wrap size='small'>
                              {paper.keywords.map((keyword, idx) => (
                                <Tag key={idx} color='orange'>
                                  {keyword}
                                </Tag>
                              ))}
                            </Space>

                            <Paragraph
                              ellipsis={{ rows: 2, expandable: false }}
                            >
                              {paper.abstract}
                            </Paragraph>

                            <Space
                              style={{
                                width: '100%',
                                justifyContent: 'space-between',
                              }}
                            >
                              <Text
                                type='secondary'
                                style={{ fontSize: '12px' }}
                              >
                                {paper.field}
                              </Text>
                            </Space>
                          </Space>
                        </Card>
                      </Link>
                    ))}
                  </Space>
                </Space>
              ) : (
                !loading &&
                !error &&
                filteredPapers.length === 0 && (
                  <Space
                    direction='vertical'
                    size='middle'
                    style={{ width: '100%', alignItems: 'center' }}
                  >
                    <div style={{ fontSize: '48px', color: '#d9d9d9' }}>📄</div>
                    <Title level={4} type='secondary'>
                      No papers found
                    </Title>
                    <Text type='secondary'>
                      Try adjusting your filters to find what you're looking
                      for.
                    </Text>
                  </Space>
                )
              )}

              {!loading && !error && (
                <DataPagination
                  current={currentPage}
                  total={totalItems}
                  pageSize={pageSize}
                  onChange={handlePageChange}
                  itemName='papers'
                  loading={loading}
                />
              )}
            </Space>
          </Col>
        </Row>
      </Space>
    </Layout>
  )
}
