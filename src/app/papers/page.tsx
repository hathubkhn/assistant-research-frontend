'use client';
import DataPagination from '@/app/components/DataPagination';
import { useTranslation } from '@/utils/useTranslation';
import { ClearOutlined, LinkOutlined, SearchOutlined } from '@ant-design/icons';
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
  Typography
} from 'antd';
import axios from 'axios';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

const { Title, Text, Paragraph } = Typography;
const { Search } = Input;

const API_URL = process.env.NEXT_PUBLIC_API_URL;

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

async function countVenues() {
  try {
    const response = await axios.get(`${API_URL}/api/venues/counts/`, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      withCredentials: true
    });
    console.log("Venues counts response:", response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching venues counts:', error);
    return { conferencesCount: 0, journalsCount: 0 };
  }
}

async function fetchPapers(page: number = 1, size: number = 20, searchQuery: string = '', activeFilters: Filters) {
  try {
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

    const response = await axios.get(`${API_URL}/api/papers/`, {
      params,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      withCredentials: true
    });
    console.log("Papers response:", response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching papers:', error);
    return { results: [], count: 0, next: null, previous: null };
  }
}

async function fetchConferences() {
  try {
    const response = await axios.get(`${API_URL}/api/conferences/`, {
      params: {
        page: 1,
        pageSize: 100
      },
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      withCredentials: true
    });
    console.log("Conferences response:", response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching conferences:', error);
    return { results: [] };
  }
}

async function fetchJournals() {
  try {
    const response = await axios.get(`${API_URL}/api/journals/`, {
      params: {
        page: 1,
        pageSize: 100
      },
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      withCredentials: true
    });
    console.log("Journals response:", response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching journals:', error);
    return { results: [] };
  }
}

export default function PapersPage() {
  const router = useRouter();
  const { t } = useTranslation('papers');

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
  const [searchQuery, setSearchQuery] = useState<string>('');

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

  const [conferences, setConferences] = useState<Array<Conference>>([]);
  const [journals, setJournals] = useState<Array<Journal>>([]);
  const [conferenceSearch, setConferenceSearch] = useState('');
  const [journalSearch, setJournalSearch] = useState('');
  const [loadingVenues, setLoadingVenues] = useState(false);
  const [conferencesCount, setConferencesCount] = useState(0);
  const [journalsCount, setJournalsCount] = useState(0);
  const [filteredConferences, setFilteredConferences] = useState<Array<Conference>>([]);
  const [topRankedConferences, setTopRankedConferences] = useState<Array<Conference>>([]);

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 2000 + 3 }, (_, i) => 2000 + i).reverse();


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

  useEffect(() => {
    const fetchVenues = async () => {
      try {
        setLoadingVenues(true);
        const countsResponse = await countVenues();
        setConferencesCount(countsResponse.conferencesCount || 0);
        setJournalsCount(countsResponse.journalsCount || 0);

        const conferencesResponse = await fetchConferences();
        const conferencesData = conferencesResponse.results;
        setConferences(conferencesData);

        const journalsResponse = await fetchJournals();
        const journalsData = journalsResponse.results;
        setJournals(journalsData);
      } catch (error) {
        console.error('Error in fetchVenues:', error);
        setConferences([]);
        setJournals([]);
      } finally {
        setLoadingVenues(false);
      }
    };

    fetchVenues();
  }, []);

  const handleFetchPapers = async (page: number = 1, size: number = pageSize, searchQuery: string = '', activeFilters: Filters) => {
    try {
      setLoading(true);
      try {
        const paperData = await fetchPapers(page, size, searchQuery, activeFilters);
        console.log("Paper data:", paperData);
        setPapers(paperData.results);
        setFilteredPapers(paperData.results);
        setTotalItems(paperData.pagination ? paperData.pagination.totalItems : 0);
        setCurrentPage(paperData.pagination ? paperData.pagination.page : 1);
        setError(null);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        console.error('Error fetching papers:', errorMessage);

        if (axios.isAxiosError(err)) {
          if (err.code === 'ECONNABORTED') {
            setError('Request timed out. The API server may be unavailable.');
          } else if (err.response) {
            setError(`Failed to fetch papers (${err.response.status}): ${err.response.data}`);
          } else if (err.request) {
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
        await handleFetchPapers(1, pageSize, searchQuery, activeFilters);
      } catch (error) {
        console.error('Error in initial papers fetch:', error);
        if (!isMounted) return;
      }
    };
    safelyFetchPapers();
    return () => {
      isMounted = false;
    };
  }, []);

  const handlePageChange = (page: number, size: number) => {
    setCurrentPage(page);
    if (size !== pageSize) {
      setPageSize(size);
    }
    handleFetchPapers(page, size, searchQuery, activeFilters);
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
      handleFetchPapers(1, pageSize, searchQuery, activeFilters);
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
      handleFetchPapers(1, pageSize, searchQuery, activeFilters);
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
    handleFetchPapers(1, pageSize, searchQuery, activeFilters);
  };

  const handleSearch = (value?: string) => {
    const query = value !== undefined ? value : searchQuery;
    setSearchQuery(query);
    setCurrentPage(1);
    handleFetchPapers(1, pageSize, searchQuery, activeFilters);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);

    if (value === '') {
      setCurrentPage(1);
      handleFetchPapers(1, pageSize, searchQuery, activeFilters);
    }
  };

  useEffect(() => {
    let result = [...papers];

    if (activeFilters.years.length > 0) {
      result = result.filter(paper => activeFilters.years.includes(paper.year));
    }

    if (activeFilters.venues.length > 0) {
      result = result.filter(paper => activeFilters.venues.includes(paper.venue?.name || ''));
    }

    if (activeFilters.fields.length > 0) {
      result = result.filter(paper => activeFilters.fields.includes(paper.field));
    }

    if (activeFilters.venueTypes.length > 0) {
      result = result.filter(paper => activeFilters.venueTypes.includes(paper.venueType));
    }

    setFilteredPapers(result);
  }, [activeFilters, papers]);

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
    handleFetchPapers(1, pageSize, searchQuery, activeFilters);
  }, [activeFilters, pageSize]);

  const filtersContent = (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      <>
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
      </>

      <>
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
            onChange={(e) => {
              setConferenceSearch(e.target.value);
              setCurrentPage(1);
              fetchConferences(1, pageSize, conferenceSearch);
            }}
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
      </>

      <>
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
      </>

      <>
        <Title level={5} style={{ marginBottom: 8 }}>Publication Year</Title>
        <Select
          mode="multiple"
          placeholder="Select publication years"
          value={activeFilters.years}
          onChange={(selectedYears) => {
            setActiveFilters(prev => ({ ...prev, years: selectedYears }));
            setCurrentPage(1);
            setTimeout(() => {
              handleFetchPapers(1, pageSize, searchQuery, { ...activeFilters, years: selectedYears });
            }, 0);
          }}
          style={{ width: '100%' }}
          size="small"
          maxTagCount="responsive"
          allowClear
          showSearch
          filterOption={(input, option) =>
            option?.label?.toString().toLowerCase().includes(input.toLowerCase()) ?? false
          }
          options={years.map(year => ({
            label: year.toString(),
            value: year
          }))}
          styles={{
            popup: {
              root: { maxHeight: 200, overflow: 'auto' }
            }
          }}
        />
      </>
    </Space>
  );

  return (
    <Layout style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      <Space direction="vertical" style={{ maxWidth: '1280px', width: '100%', margin: '0 auto', padding: '20px 16px' }}>
        <Row gutter={[16, 24]}>
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

          <Col xs={24} sm={24} md={16} lg={18} xl={18}>
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
              <Space style={{ width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
                <Title level={2} style={{ margin: 0 }}>{t('title')}</Title>
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

              {!loading && !error && filteredPapers.length > 0 ? (
                <Space direction="vertical" size="large" style={{ width: '100%' }}>
                  <Text type="secondary">
                    Showing {filteredPapers.length} {filteredPapers.length === 1 ? 'result' : 'results'}
                    {searchQuery.trim() && (
                      <span> for "{searchQuery.trim()}"</span>
                    )}
                    {(activeFilters.years.length > 0 || activeFilters.venues.length > 0 || activeFilters.fields.length > 0 || activeFilters.venueTypes.length > 0) && (
                      <span> with applied filters</span>
                    )}
                  </Text>
                  <Space direction="vertical" size="middle" style={{ width: '100%' }}>
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
                          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                            <Space style={{ width: '100%', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                              <Title level={4} style={{ margin: 0, color: '#1890ff', cursor: 'pointer' }}>
                                {paper.title}
                              </Title>
                              <Space direction="vertical" align="end">
                                {paper.venue ? (
                                  <Button
                                    type="primary"
                                    size="small"
                                    icon={<LinkOutlined />}
                                    onClick={(e) => {
                                      if (paper.venueType === 'conference') {
                                        navigateToConference(paper.venue?.id, e);
                                      } else {
                                        navigateToJournal(paper.venue?.id, e);
                                      }
                                    }}
                                  >
                                    {paper.venue.abbreviation || paper.venue.name}
                                  </Button>
                                ) : (
                                  <Tag color="blue">
                                    Venue: Unknown
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
                </Space>
              ) : (!loading && !error && filteredPapers.length === 0 && (
                <Space direction="vertical" size="middle" style={{ width: '100%', alignItems: 'center' }}>
                  <div style={{ fontSize: '48px', color: '#d9d9d9' }}>📄</div>
                  <Title level={4} type="secondary">No papers found</Title>
                  <Text type="secondary">Try adjusting your filters to find what you're looking for.</Text>
                </Space>
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
      </Space>
    </Layout>
  );
} 