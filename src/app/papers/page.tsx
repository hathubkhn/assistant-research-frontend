'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/utils/useTranslation';
import axios from 'axios';
import {
  Layout,
  Card,
  Checkbox,
  Input,
  Button,
  Typography,
  Space,
  Row,
  Col,
  Select,
  Spin,
  Alert,
  Tag,
  Divider,
  Drawer,
  Grid
} from 'antd';
import { SearchOutlined, ClearOutlined, LinkOutlined, FilterOutlined } from '@ant-design/icons';
import DataPagination from '@/app/components/DataPagination';

const { Title, Text, Paragraph } = Typography;
const { Search } = Input;
const { useBreakpoint } = Grid;

const API_URL = process.env.NEXT_PUBLIC_API_URL;

interface Paper {
  id: string;
  title: string;
  authors: string[];
  venue: string;
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

export default function PapersPage() {
  const router = useRouter();
  const { t } = useTranslation('papers');
  const screens = useBreakpoint();
  const isMobile = !screens.md;
  const [activeFilters, setActiveFilters] = useState<Filters>({
    years: [],
    venues: [],
    fields: [],
    venueTypes: [],
  });

  const [papers, setPapers] = useState<Paper[]>([]);
  const [filteredPapers, setFilteredPapers] = useState<Paper[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(20);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [mobileFiltersVisible, setMobileFiltersVisible] = useState<boolean>(false);

  const [expandedFilters, setExpandedFilters] = useState<{
    conferences: boolean;
    journals: boolean;
    fields: boolean;
    sidebar: boolean;
  }>({
    conferences: false,
    journals: false,
    fields: false,
    sidebar: true
  });

  const [conferences, setConferences] = useState<Array<{ id: string, name: string, abbreviation: string, rank?: string }>>([]);
  const [journals, setJournals] = useState<Array<{ id: string, name: string, abbreviation: string, impactFactor?: number, quartile?: string }>>([]);
  const [conferenceSearch, setConferenceSearch] = useState('');
  const [journalSearch, setJournalSearch] = useState('');
  const [loadingVenues, setLoadingVenues] = useState(false);
  const [conferencesCount, setConferencesCount] = useState(0);
  const [journalsCount, setJournalsCount] = useState(0);
  const [filteredConferences, setFilteredConferences] = useState<Array<{ id: string, name: string, abbreviation: string, rank?: string }>>([]);
  const [topRankedConferences, setTopRankedConferences] = useState<Array<{ id: string, name: string, abbreviation: string, rank?: string }>>([]);

  useEffect(() => {
    const filtered = conferences.filter(conf =>
      conf.name.toLowerCase().includes(conferenceSearch.toLowerCase()) ||
      conf.abbreviation?.toLowerCase().includes(conferenceSearch.toLowerCase())
    );
    setFilteredConferences(filtered);

    const topRanked = filtered.filter(conf => conf.rank === 'A*');
    setTopRankedConferences(topRanked);

    console.log("Filtered conferences updated:", filtered.length, "with", topRanked.length, "top-ranked conferences");
  }, [conferences, conferenceSearch]);

  const filteredJournals = journals.filter(journal =>
    journal.name.toLowerCase().includes(journalSearch.toLowerCase()) ||
    journal.abbreviation?.toLowerCase().includes(journalSearch.toLowerCase())
  );

  const sortedJournals = [...filteredJournals].sort((a, b) =>
    (b.impactFactor || 0) - (a.impactFactor || 0)
  );

  const journalsToDisplay = expandedFilters.journals
    ? sortedJournals
    : sortedJournals.slice(0, 10);

  const conferencesToDisplay = expandedFilters.conferences
    ? filteredConferences
    : (topRankedConferences.length > 0
      ? topRankedConferences.slice(0, 10)
      : (filteredConferences.length > 0
        ? filteredConferences.slice(0, 10)
        : []));

  useEffect(() => {
    if (conferences.length > 0 && filteredConferences.length > 0 && conferencesToDisplay.length === 0) {
      console.log("Conferences loaded but none displayed, forcing update...");
      setExpandedFilters(prev => ({
        ...prev,
        conferences: true
      }));

      setTimeout(() => {
        setExpandedFilters(prev => ({
          ...prev,
          conferences: false
        }));
      }, 100);
    }
  }, [conferences, filteredConferences, conferencesToDisplay]);

  const toggleExpandedSection = (section: 'conferences' | 'journals' | 'fields') => {
    setExpandedFilters(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const fetchVenues = async () => {
    try {
      setLoadingVenues(true);

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      };

      if (typeof window !== 'undefined') {
        let authToken = localStorage.getItem('authToken') ||
          sessionStorage.getItem('authToken') ||
          localStorage.getItem('token') ||
          sessionStorage.getItem('token');

        if (authToken && authToken.startsWith('Token ')) {
          authToken = authToken.substring(6);
        }

        if (authToken) {
          headers['Authorization'] = `Token ${authToken}`;
        }
      }

      const axiosConfig = {
        headers,
        withCredentials: true,
        timeout: 10000
      };

      try {
        const countsResponse = await axios.get(`${API_URL}/api/venues/counts/`, axiosConfig);
        setConferencesCount(countsResponse.data.conferencesCount || 0);
        setJournalsCount(countsResponse.data.journalsCount || 0);
      } catch (error) {
        console.error('Error fetching venue counts:', error);
        setConferencesCount(0);
        setJournalsCount(0);
      }

      try {
        console.log("Fetching conferences from API:", `${API_URL}/api/conferences/filter/`);
        const conferencesResponse = await axios.get(`${API_URL}/api/conferences/filter/`, axiosConfig);

        const conferencesData = conferencesResponse.data;
        console.log("Conferences fetched successfully:", conferencesData.length);

        if (conferencesData.length > 0) {
          console.log("First conference sample:", conferencesData[0]);
        }

        setConferences(conferencesData);

        if (conferencesCount === 0) {
          setConferencesCount(conferencesData.length);
        }
      } catch (error) {
        console.error('Error fetching conferences:', error);
        if (axios.isAxiosError(error)) {
          console.error('Error details:', error.response?.data);
          console.error('Status:', error.response?.status);
        }
        setConferences([]);
      }

      try {
        const journalsResponse = await axios.get(`${API_URL}/api/journals/filter/`, axiosConfig);
        const journalsData = journalsResponse.data;

        const sortedByIF = [...journalsData].sort((a, b) =>
          (b.impactFactor || 0) - (a.impactFactor || 0)
        );

        if (sortedByIF.length > 0) {
          console.log("Highest impact factor journal:", sortedByIF[0]);
          console.log("Top 5 impact factor journals:", sortedByIF.slice(0, 5).map(j =>
            `${j.name}: IF=${j.impactFactor}`
          ));
        }

        setJournals(journalsData);

        if (journalsCount === 0) {
          setJournalsCount(journalsData.length);
        }
      } catch (error) {
        console.error('Error fetching journals:', error);
        if (axios.isAxiosError(error)) {
          console.error('Error details:', error.response?.data);
          console.error('Status:', error.response?.status);
        }
        setJournals([]);
      }
    } catch (error) {
      console.error('Error in fetchVenues:', error);
      setConferences([]);
      setJournals([]);
    } finally {
      setLoadingVenues(false);
    }
  };

  const fetchPapers = async (page: number = 1, size: number = pageSize) => {
    try {
      setLoading(true);

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      };

      if (typeof window !== 'undefined') {
        let authToken = localStorage.getItem('authToken') ||
          sessionStorage.getItem('authToken') ||
          localStorage.getItem('token') ||
          sessionStorage.getItem('token');

        if (authToken && authToken.startsWith('Token ')) {
          authToken = authToken.substring(6);
        }

        if (authToken) {
          headers['Authorization'] = `Token ${authToken}`;
        }
      }

      const params: Record<string, string> = {
        page: page.toString(),
        pageSize: size.toString()
      };

      if (searchQuery.trim()) {
        params.search = searchQuery.trim();
      }

      if (activeFilters.years.length > 0) {
        params.year = activeFilters.years[0].toString();
      }

      if (activeFilters.venues.length > 0) {
        params.venue_id = activeFilters.venues[0];
      }

      if (activeFilters.fields.length > 0) {
        params.field = activeFilters.fields[0];
      }

      if (activeFilters.venueTypes.length > 0) {
        params.venueType = activeFilters.venueTypes[0];
      }

      try {
        const response = await axios.get(`${API_URL}/api/papers/`, {
          params,
          headers,
          withCredentials: true
        });

        console.log("Response:", response);

        const data = (await response).data;
        setPapers(data.results);
        setFilteredPapers(data.results);
        setTotalItems(data.pagination.totalItems);
        setTotalPages(data.pagination.totalPages);
        setCurrentPage(data.pagination.page);
        setError(null);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        console.error('Error fetching papers:', errorMessage);

        if (axios.isAxiosError(err)) {
          if (err.code === 'ECONNABORTED') {
            setError('Request timed out. The API server may be unavailable.');
          } else if (err.response) {
            console.error(`Server responded with ${err.response.status}: ${err.response.data}`);
            setError(`Failed to fetch papers (${err.response.status}): ${err.response.data}`);
          } else if (err.request) {
            console.error('API URL:', API_URL);
            console.error('Headers:', JSON.stringify(headers));
            console.error('User-Agent:', navigator.userAgent);
            console.error('Is Online:', navigator.onLine);

            setError(`Cannot connect to the API server at ${API_URL}. Make sure the backend is running and CORS is properly configured.`);
          } else {
            setError('Failed to load papers: ' + errorMessage);
          }
        } else {
          setError('Failed to load papers: ' + errorMessage);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    const safelyFetchPapers = async () => {
      try {
        await fetchPapers(1);
      } catch (error) {
        console.error('Error in initial papers fetch:', error);
        if (!isMounted) return;
      }
    };

    const safelyFetchVenues = async () => {
      try {
        await fetchVenues();
      } catch (error) {
        console.error('Error in initial venues fetch:', error);
        if (!isMounted) return;
      }
    };

    safelyFetchPapers();
    safelyFetchVenues();

    return () => {
      isMounted = false;
    };
  }, []);

  const handlePageChange = (page: number, size: number) => {
    setCurrentPage(page);
    if (size !== pageSize) {
      setPageSize(size);
    }
    fetchPapers(page, size);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const years = [2021, 2022, 2023, 2024, 2025];

  const toggleYearFilter = (year: number) => {
    setActiveFilters(prev => {
      const newYears = prev.years.includes(year)
        ? prev.years.filter(y => y !== year)
        : [...prev.years, year];
      return { ...prev, years: newYears };
    });
    setCurrentPage(1);
    setTimeout(() => {
      fetchPapers(1, pageSize);
    }, 0);
  };

  const toggleVenueFilter = (venue: { id: string, name: string }) => {
    setActiveFilters(prev => {
      const newVenues = prev.venues.includes(venue.id)
        ? prev.venues.filter(v => v !== venue.id)
        : [...prev.venues, venue.id];
      return { ...prev, venues: newVenues };
    });
    setCurrentPage(1);
    setTimeout(() => {
      fetchPapers(1, pageSize);
    }, 0);
  };

  const toggleVenueTypeFilter = (type: 'conference' | 'journal') => {
    setActiveFilters(prev => {
      const newVenueTypes = prev.venueTypes.includes(type)
        ? prev.venueTypes.filter(t => t !== type)
        : [...prev.venueTypes, type];
      return { ...prev, venueTypes: newVenueTypes };
    });
    setCurrentPage(1);
    setTimeout(() => {
      fetchPapers(1, pageSize);
    }, 0);
  };

  const clearFilters = () => {
    setActiveFilters({
      years: [],
      venues: [],
      fields: [],
      venueTypes: [],
    });
    setSearchQuery('');
    setCurrentPage(1);
    fetchPapers(1, pageSize);
  };

  const handleSearch = (value?: string) => {
    const query = value !== undefined ? value : searchQuery;
    setSearchQuery(query);
    setCurrentPage(1);
    fetchPapers(1, pageSize);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);

    // Only clear search results if the input is completely cleared
    if (value === '') {
      setCurrentPage(1);
      fetchPapers(1, pageSize);
    }
  };

  useEffect(() => {
    let result = [...papers];

    if (activeFilters.years.length > 0) {
      result = result.filter(paper => activeFilters.years.includes(paper.year));
    }

    if (activeFilters.venues.length > 0) {
      result = result.filter(paper => activeFilters.venues.includes(paper.venue));
    }

    if (activeFilters.fields.length > 0) {
      result = result.filter(paper => activeFilters.fields.includes(paper.field));
    }

    if (activeFilters.venueTypes.length > 0) {
      result = result.filter(paper => activeFilters.venueTypes.includes(paper.venueType));
    }

    setFilteredPapers(result);
  }, [activeFilters, papers]);

  const getPapersByType = (type: 'conference' | 'journal') => {
    return filteredPapers.filter(paper => paper.venueType === type);
  };

  const getConferenceDisplay = (venueName: string) => {
    const conference = conferences.find(conf =>
      conf.name === venueName || conf.abbreviation === venueName
    );

    return conference?.abbreviation || venueName;
  };

  const getConferenceId = (venueName: string) => {
    if (!venueName) {
      console.log('Conference venueName is empty or undefined');
      return undefined;
    }

    console.log('Searching for conference ID with venue name:', venueName);

    const exactMatch = conferences.find(conf =>
      conf.name === venueName || conf.abbreviation === venueName
    );

    if (exactMatch) {
      console.log('Found exact conference match:', exactMatch.name, 'ID:', exactMatch.id);
      return exactMatch.id;
    }

    const abbrevMatch = conferences.find(conf =>
      conf.abbreviation &&
      conf.abbreviation.trim() !== '' &&
      venueName.includes(conf.abbreviation)
    );

    if (abbrevMatch) {
      console.log('Found abbreviation match:', abbrevMatch.name, 'ID:', abbrevMatch.id, 'Abbr:', abbrevMatch.abbreviation);
      return abbrevMatch.id;
    }

    const partialMatch = conferences.find(conf =>
      (conf.name && venueName.includes(conf.name)) ||
      (conf.name && conf.name.includes(venueName))
    );

    if (partialMatch) {
      console.log('Found partial name match:', partialMatch.name, 'ID:', partialMatch.id);
      return partialMatch.id;
    }

    const looseMatch = conferences.find(conf =>
      (conf.abbreviation && conf.abbreviation.includes(venueName)) ||
      venueName.toLowerCase().includes(conf.name.toLowerCase().substring(0, Math.min(10, conf.name.length)))
    );

    console.log('Conference match result for:', venueName, looseMatch
      ? `ID: ${looseMatch.id}, Name: ${looseMatch.name}, Abbr: ${looseMatch.abbreviation}`
      : 'Not found after all checks');

    return looseMatch?.id;
  };

  const getJournalId = (venueName: string) => {
    const exactMatch = journals.find(j =>
      j.name === venueName || j.abbreviation === venueName
    );

    if (exactMatch) return exactMatch.id;

    const partialMatch = journals.find(j =>
      venueName.includes(j.name) ||
      j.name.includes(venueName) ||
      (j.abbreviation && venueName.includes(j.abbreviation)) ||
      (j.abbreviation && j.abbreviation.includes(venueName))
    );

    console.log('Journal match for:', venueName, partialMatch ? `ID: ${partialMatch.id}` : 'Not found');
    return partialMatch?.id;
  };

  const navigateToConference = (id: string | undefined, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    console.log('Navigating to conference with ID:', id);

    if (id) {
      const url = `/conferences/${id}`;
      console.log('Conference navigation URL:', url);
      router.push(url);
    } else {
      console.log('Cannot navigate - conference ID is undefined');
    }
  };

  const navigateToJournal = (id: string | undefined, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    console.log('Navigating to journal with ID:', id);

    if (id) {
      router.push(`/journals/${id}`);
    } else {
      console.log('Cannot navigate - journal ID is undefined');
    }
  };

  useEffect(() => {
    fetchPapers(1);
  }, [activeFilters, pageSize]);

  const filtersContent = (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      <div>
        <Title level={5} style={{ marginBottom: 8 }}>Publication Type</Title>
        <Space direction="vertical" size="small">
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
      </div>

      <div>
        <Space style={{ width: '100%', justifyContent: 'space-between', marginBottom: 8 }}>
          <Title level={5} style={{ margin: 0 }}>Conferences</Title>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {loadingVenues ? 'Loading...' : conferencesCount}
          </Text>
        </Space>
        <Space direction="vertical" size="small" style={{ width: '100%' }}>
          <Search
            placeholder="Search conferences..."
            value={conferenceSearch}
            onChange={(e) => setConferenceSearch(e.target.value)}
            size="small"
            prefix={<SearchOutlined />}
            allowClear
          />
          <div style={{ maxHeight: !expandedFilters.conferences ? '240px' : 'auto', overflowY: 'auto' }}>
            {loadingVenues ? (
              <div style={{ textAlign: 'center', padding: '16px' }}>
                <Spin size="small" />
              </div>
            ) : conferencesToDisplay.length > 0 ? (
              <Space direction="vertical" size="small">
                {conferencesToDisplay.map(conf => (
                  <Space key={conf.id} style={{ width: '100%', justifyContent: 'space-between' }}>
                    <Checkbox
                      checked={activeFilters.venues.includes(conf.id)}
                      onChange={() => toggleVenueFilter(conf)}
                      style={{ flex: 1 }}
                    >
                      <Text style={{ fontSize: '12px' }}>
                        {conf.abbreviation || conf.name}
                      </Text>
                    </Checkbox>
                    {conf.rank && (
                      <Tag color="blue">{conf.rank}</Tag>
                    )}
                  </Space>
                ))}
              </Space>
            ) : conferences.length > 0 ? (
              <Space direction="vertical" size="small">
                {conferences.slice(0, 100).map(conf => (
                  <Space key={conf.id} style={{ width: '100%', justifyContent: 'space-between' }}>
                    <Checkbox
                      checked={activeFilters.venues.includes(conf.id)}
                      onChange={() => toggleVenueFilter(conf)}
                      style={{ flex: 1 }}
                    >
                      <Text style={{ fontSize: '12px' }}>
                        {conf.abbreviation || conf.name}
                      </Text>
                    </Checkbox>
                    {conf.rank && (
                      <Tag color="blue">{conf.rank}</Tag>
                    )}
                  </Space>
                ))}
              </Space>
            ) : (
              <Space direction="vertical" size="small">
                <Text type="secondary" style={{ fontSize: '12px' }}>No conferences found</Text>
                <Text type="secondary" style={{ fontSize: '11px' }}>Try clearing your search or check network connection</Text>
              </Space>
            )}
          </div>

          {(conferences.length > 0 || filteredConferences.length > 0) && (
            <Button
              type="link"
              size="small"
              onClick={() => toggleExpandedSection('conferences')}
              style={{ width: '100%', marginTop: '8px', padding: 0, height: 'auto' }}
            >
              {expandedFilters.conferences
                ? (topRankedConferences.length > 0 ? 'Show Top 10 A* Only' : 'Show Less')
                : `Show All (${filteredConferences.length || conferences.length} conferences)`}
            </Button>
          )}
        </Space>
      </div>

      <div>
        <Space style={{ width: '100%', justifyContent: 'space-between', marginBottom: 8 }}>
          <Title level={5} style={{ margin: 0 }}>Journals</Title>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {loadingVenues ? 'Loading...' : journalsCount}
          </Text>
        </Space>
        <Space direction="vertical" size="small" style={{ width: '100%' }}>
          <Search
            placeholder="Search journals..."
            value={journalSearch}
            onChange={(e) => setJournalSearch(e.target.value)}
            size="small"
            prefix={<SearchOutlined />}
            allowClear
          />
          <div style={{ maxHeight: !expandedFilters.journals ? '240px' : 'auto', overflowY: 'auto' }}>
            {loadingVenues ? (
              <div style={{ textAlign: 'center', padding: '16px' }}>
                <Spin size="small" />
              </div>
            ) : journalsToDisplay.length > 0 ? (
              <Space direction="vertical" size="small">
                {journalsToDisplay.map(journal => (
                  <Space key={journal.id} style={{ width: '100%', justifyContent: 'space-between' }}>
                    <Checkbox
                      checked={activeFilters.venues.includes(journal.id)}
                      onChange={() => toggleVenueFilter(journal)}
                      style={{ flex: 1 }}
                    >
                      <Text style={{ fontSize: '12px' }} ellipsis={{ tooltip: true }}>
                        {journal.name}
                      </Text>
                    </Checkbox>
                    {journal.impactFactor && (
                      <Tag color="green">
                        IF: {Number(journal.impactFactor).toFixed(journal.impactFactor >= 100 ? 0 : 1)}
                      </Tag>
                    )}
                  </Space>
                ))}
              </Space>
            ) : (
              <Text type="secondary" style={{ fontSize: '12px' }}>No journals found</Text>
            )}
          </div>

          {((expandedFilters.journals && sortedJournals.length > 10) ||
            (!expandedFilters.journals && sortedJournals.length > 10)) && (
              <Button
                type="link"
                size="small"
                onClick={() => toggleExpandedSection('journals')}
                style={{ width: '100%', marginTop: '8px', padding: 0, height: 'auto' }}
              >
                {expandedFilters.journals
                  ? 'Show Top 10 Only'
                  : `See More (${sortedJournals.length - 10} more)`}
              </Button>
            )}
        </Space>
      </div>

      <div>
        <Title level={5} style={{ marginBottom: 8 }}>Publication Year</Title>
        <Space direction="vertical" size="small">
          {years.map((year) => (
            <Checkbox
              key={year}
              checked={activeFilters.years.includes(year)}
              onChange={() => toggleYearFilter(year)}
            >
              {year}
            </Checkbox>
          ))}
        </Space>
      </div>
    </Space>
  );

  return (
    <Layout style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      <div style={{ maxWidth: '1280px', width: '100%', margin: '0 auto', padding: '20px 16px' }}>
        <Row gutter={[16, 24]}>
          {!isMobile && (
            <Col xs={0} sm={0} md={8} lg={6} xl={6}>
              <Card
                title={
                  <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                    <Title level={4} style={{ margin: 0 }}>Filters</Title>
                    {(activeFilters.years.length > 0 || activeFilters.venues.length > 0 || activeFilters.fields.length > 0 || activeFilters.venueTypes.length > 0) && (
                      <Button
                        type="link"
                        size="small"
                        icon={<ClearOutlined />}
                        onClick={clearFilters}
                      >
                        Clear all
                      </Button>
                    )}
                  </Space>
                }
                size="small"
              >
                {filtersContent}
              </Card>
            </Col>
          )}

          <Col xs={24} sm={24} md={isMobile ? 24 : 16} lg={isMobile ? 24 : 18} xl={isMobile ? 24 : 18}>

            <Space direction="vertical" size="large" style={{ width: '100%' }}>
              <Space style={{ width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
                <Title level={2} style={{ margin: 0 }}>{t('title')}</Title>
                {isMobile && (
                  <Button
                    type="primary"
                    icon={<FilterOutlined />}
                    onClick={() => setMobileFiltersVisible(true)}
                  >
                    Filters
                  </Button>
                )}
              </Space>

              <Search
                placeholder="Search papers by title..."
                value={searchQuery}
                onChange={handleSearchChange}
                onSearch={handleSearch}
                size="large"
                style={{ width: '100%', maxWidth: 600 }}
                enterButton="Search"
                allowClear
              />

              {loading && (
                <div style={{ textAlign: 'center', padding: '80px 0' }}>
                  <Spin size="large" />
                </div>
              )}

              {error && (
                <Alert
                  message="Error"
                  description={error}
                  type="error"
                  showIcon
                  closable
                />
              )}

              {!loading && !error && (
                <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                  <Text type="secondary">
                    Showing {filteredPapers.length} {filteredPapers.length === 1 ? 'result' : 'results'}
                    {searchQuery.trim() && (
                      <span> for "{searchQuery.trim()}"</span>
                    )}
                    {(activeFilters.years.length > 0 || activeFilters.venues.length > 0 || activeFilters.fields.length > 0 || activeFilters.venueTypes.length > 0) && (
                      <span> with applied filters</span>
                    )}
                  </Text>
                  <Button
                    onClick={clearFilters}
                    disabled={activeFilters.years.length === 0 && activeFilters.venues.length === 0 && activeFilters.fields.length === 0 && activeFilters.venueTypes.length === 0}
                    icon={<ClearOutlined />}
                    size="small"
                  >
                    Clear Filter
                  </Button>
                </Space>
              )}

              {!loading && !error && filteredPapers.length > 0 ? (
                <Space direction="vertical" size="large" style={{ width: '100%' }}>
                  {getPapersByType('conference').length > 0 && (
                    <div>
                      <Title level={isMobile ? 4 : 3} style={{ marginBottom: 16 }}>Conference Publications</Title>
                      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                        {getPapersByType('conference').map((paper) => (
                          <Link
                            key={paper.id}
                            href={`/papers/${paper.id}`}
                            style={{ textDecoration: 'none' }}
                          >
                            <Card
                              hoverable
                              style={{ width: '100%' }}
                              bodyStyle={{ padding: isMobile ? '16px' : '24px' }}
                            >
                              <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                                <Space style={{ width: '100%', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                  <Title level={4} style={{ margin: 0, color: '#1890ff', cursor: 'pointer' }}>
                                    {paper.title}
                                  </Title>
                                  <Space direction="vertical" align="end">
                                    {getConferenceId(paper.venue) ? (
                                      <Button
                                        type="primary"
                                        size="small"
                                        icon={<LinkOutlined />}
                                        onClick={(e) => navigateToConference(getConferenceId(paper.venue), e)}
                                      >
                                        {getConferenceDisplay(paper.venue)}
                                      </Button>
                                    ) : (
                                      <Tag color="blue">
                                        {getConferenceDisplay(paper.venue)}
                                      </Tag>
                                    )}
                                    <Text type="secondary" style={{ fontSize: '12px' }}>{paper.year}</Text>
                                  </Space>
                                </Space>

                                <Text type="secondary">
                                  <Text strong>Authors:</Text> {paper.authors.join(', ')}
                                </Text>

                                <Space wrap size="small">
                                  {paper.keywords.map((keyword, idx) => (
                                    <Tag key={idx} color="orange">
                                      {keyword}
                                    </Tag>
                                  ))}
                                </Space>

                                <Paragraph ellipsis={{ rows: 2, expandable: false }}>
                                  {paper.abstract}
                                </Paragraph>

                                <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                                  <Text type="secondary" style={{ fontSize: '12px' }}>{paper.field}</Text>
                                </Space>
                              </Space>
                            </Card>
                          </Link>
                        ))}
                      </Space>
                    </div>
                  )}

                  {getPapersByType('journal').length > 0 && (
                    <div>
                      <Title level={isMobile ? 4 : 3} style={{ marginBottom: 16 }}>Journal Publications (Q1-Q2)</Title>
                      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                        {getPapersByType('journal').map((paper) => (
                          <Link
                            key={paper.id}
                            href={`/papers/${paper.id}`}
                            style={{ textDecoration: 'none' }}
                          >
                            <Card
                              hoverable
                              style={{ width: '100%' }}
                              bodyStyle={{ padding: isMobile ? '16px' : '24px' }}
                            >
                              <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                                <Space style={{ width: '100%', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                  <Title level={4} style={{ margin: 0, color: '#1890ff', cursor: 'pointer' }}>
                                    {paper.title}
                                  </Title>
                                  <Space direction="vertical" align="end">
                                    {getJournalId(paper.venue) ? (
                                      <Button
                                        type="primary"
                                        size="small"
                                        icon={<LinkOutlined />}
                                        onClick={(e) => navigateToJournal(getJournalId(paper.venue), e)}
                                        style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
                                      >
                                        {paper.venue}
                                      </Button>
                                    ) : (
                                      <Tag color="green">
                                        {paper.venue}
                                      </Tag>
                                    )}
                                    <Space size="small">
                                      <Text type="secondary" style={{ fontSize: '12px' }}>{paper.year}</Text>
                                      {paper.quartile && (
                                        <Tag color="purple">{paper.quartile}</Tag>
                                      )}
                                      {paper.impactFactor && (
                                        <Text type="secondary" style={{ fontSize: '12px' }}>
                                          IF: {Number(paper.impactFactor).toFixed(paper.impactFactor >= 100 ? 0 : 1)}
                                        </Text>
                                      )}
                                    </Space>
                                  </Space>
                                </Space>

                                <Text type="secondary">
                                  <Text strong>Authors:</Text> {paper.authors.join(', ')}
                                </Text>

                                <Space wrap size="small">
                                  {paper.keywords.map((keyword, idx) => (
                                    <Tag key={idx} color="orange">
                                      {keyword}
                                    </Tag>
                                  ))}
                                </Space>

                                <Paragraph ellipsis={{ rows: 2, expandable: false }}>
                                  {paper.abstract}
                                </Paragraph>

                                <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                                  <Text type="secondary" style={{ fontSize: '12px' }}>{paper.field}</Text>
                                </Space>
                              </Space>
                            </Card>
                          </Link>
                        ))}
                      </Space>
                    </div>
                  )}
                </Space>
              ) : (
                !loading && !error && (
                  <div style={{ textAlign: 'center', padding: '48px 0' }}>
                    <Space direction="vertical" size="middle">
                      <div style={{ fontSize: '48px', color: '#d9d9d9' }}>📄</div>
                      <Title level={4} type="secondary">No papers found</Title>
                      <Text type="secondary">Try adjusting your filters to find what you're looking for.</Text>
                    </Space>
                  </div>
                )
              )}

              {!loading && !error && (
                <DataPagination
                  current={currentPage}
                  total={totalItems}
                  pageSize={pageSize}
                  onChange={handlePageChange}
                  itemName="papers"
                  loading={loading}
                />
              )}
            </Space>
          </Col>
        </Row>
      </div>

      <Drawer
        title={
          <Space style={{ width: '100%', justifyContent: 'space-between' }}>
            <span>Filters</span>
            {(activeFilters.years.length > 0 || activeFilters.venues.length > 0 || activeFilters.fields.length > 0 || activeFilters.venueTypes.length > 0) && (
              <Button
                type="link"
                size="small"
                icon={<ClearOutlined />}
                onClick={() => {
                  clearFilters();
                  setMobileFiltersVisible(false);
                }}
              >
                Clear all
              </Button>
            )}
          </Space>
        }
        placement="left"
        onClose={() => setMobileFiltersVisible(false)}
        open={mobileFiltersVisible}
        width={320}
        bodyStyle={{ padding: '16px' }}
      >
        {filtersContent}
      </Drawer>
    </Layout>
  );
} 