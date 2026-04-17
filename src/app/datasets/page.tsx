'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { getAuthHeaders } from '@/utils/auth'
import { toast } from 'react-hot-toast'
import InterestingDatasetButton from '../../components/InterestingDatasetButton'
import { useTranslation } from '@/utils/useTranslation'
import DataPagination from '@/app/components/DataPagination'
import axios from 'axios'
import {
  Layout,
  Card,
  Input,
  Button,
  Typography,
  Space,
  Row,
  Col,
  Checkbox,
  Select,
  Spin,
  Tag,
  Segmented,
  Divider,
  Image,
  Badge,
} from 'antd'
import {
  SearchOutlined,
  AppstoreOutlined,
  BarsOutlined,
  DownloadOutlined,
  ClearOutlined,
  ExportOutlined,
} from '@ant-design/icons'

const { Title, Text, Paragraph } = Typography
const { Search } = Input
const { Content } = Layout

const API_URL = process.env.NEXT_PUBLIC_API_URL

interface Dataset {
  id: string;
  name: string;
  description: string;
  tasks: string[];
  benchmarks: any[];
  starred?: boolean;
  [key: string]: any;
}

interface DatasetsResponse {
  results: Dataset[];
  pagination: {
    totalItems: number;
    totalPages: number;
    page: number;
    pageSize: number;
  };
}

interface FetchDatasetsParams {
  page?: number;
  pageSize?: number;
  search?: string;
  task?: string;
  field?: string;
  venue?: string;
  venueType?: string;
  year?: string;
}

const fetchDatasetsAPI = async (params: FetchDatasetsParams): Promise<DatasetsResponse> => {
  try {
    const queryParams = new URLSearchParams()

    if (params.page) queryParams.append('page', params.page.toString())
    if (params.pageSize) queryParams.append('pageSize', params.pageSize.toString())
    if (params.search) queryParams.append('search', params.search)
    if (params.task) queryParams.append('task', params.task)
    if (params.field) queryParams.append('field', params.field)
    if (params.venue) queryParams.append('venue', params.venue)
    if (params.venueType) queryParams.append('venueType', params.venueType)
    if (params.year) queryParams.append('year', params.year)

    const response = await axios.get(`${API_URL}/api/datasets/?${queryParams.toString()}`)
    return response.data
  } catch (error) {
    console.error('Error fetching datasets:', error)
    throw error
  }
}

const fetchInterestingDatasetsAPI = async (): Promise<Dataset[]> => {
  try {
    const authHeaders = getAuthHeaders()
    const response = await axios.get('/api/datasets/interesting/', {
      headers: authHeaders as Record<string, string>,
      withCredentials: true,
    })
    return response.data
  } catch (error) {
    console.error('Error fetching interesting datasets:', error)
    throw error
  }
}

const markDatasetInterestingAPI = async (id: string): Promise<void> => {
  try {
    const authHeaders = getAuthHeaders(true)
    await axios.post(`/api/datasets/mark-interesting/${id}/`, {}, {
      headers: authHeaders as Record<string, string>,
      withCredentials: true,
    })
  } catch (error) {
    console.error('Error marking dataset as interesting:', error)
    throw error
  }
}

const unmarkDatasetInterestingAPI = async (id: string): Promise<void> => {
  try {
    const authHeaders = getAuthHeaders(true)
    await axios.delete(`/api/datasets/${id}/unmark-interesting/`, {
      headers: authHeaders as Record<string, string>,
      withCredentials: true,
    })
  } catch (error) {
    console.error('Error unmarking dataset as interesting:', error)
    throw error
  }
}

const fetchConferencesFilterAPI = async (): Promise<any[]> => {
  try {
    const response = await axios.get(`${API_URL}/api/conferences/filter/`, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      withCredentials: true,
    })
    return response.data
  } catch (error) {
    console.error('Error fetching conferences filter:', error)
    throw error
  }
}

const fetchJournalsFilterAPI = async (): Promise<any[]> => {
  try {
    const response = await axios.get(`${API_URL}/api/journals/filter/`, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      withCredentials: true,
    })
    return response.data
  } catch (error) {
    console.error('Error fetching journals filter:', error)
    throw error
  }
}

function parseTasksArray(tasks: any): string[] {
  if (!tasks) return []

  try {
    if (typeof tasks === 'string') {
      return JSON.parse(tasks)
    }
    if (Array.isArray(tasks)) {
      return tasks
    }
  } catch (e) {
    console.error('Error parsing tasks:', e)
  }
  return []
}

function getBenchmarkCount(benchmarks: any): number {
  if (!benchmarks) return 0
  try {
    if (typeof benchmarks === 'number') {
      return benchmarks
    }

    if (Array.isArray(benchmarks)) {
      return benchmarks.length
    }

    if (typeof benchmarks === 'string') {
      try {
        const parsed = JSON.parse(benchmarks)
        if (typeof parsed === 'number') {
          return parsed
        }
        return Array.isArray(parsed) ? parsed.length : 0
      } catch (e) {
        const num = Number(benchmarks)
        if (!isNaN(num)) {
          return num
        }
      }
    }
  } catch (e) {
    console.error('Error parsing benchmarks:', e)
  }
  return 0
}

interface Dataset {
  id: string;
  name: string;
  abbreviation: string;
  description: string;
  downloadUrl: string;
  link?: string;
  paper_link?: string;
  subtitle?: string;
  paperCount: number;
  language: string;
  category: string;
  tasks: string[];
  thumbnailUrl?: string;
  benchmarks: any[];
  dataloaders?: any[];
  similar_datasets?: any[];
  papers?: any[];
  starred?: boolean;
  isInteresting?: boolean;
  associatedConferences?: string[];
}

export default function DatasetsPage() {
  const [datasets, setDatasets] = useState<Dataset[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [currentView, setCurrentView] = useState<'grid' | 'list'>('list')
  const [activeFilters, setActiveFilters] = useState<{
    categories: string[];
    tasks: string[];
    languages: string[];
  }>({
    categories: [],
    tasks: [],
    languages: [],
  })
  const [sortOption, setSortOption] = useState<string>('best-match')
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [pageSize, setPageSize] = useState<number>(20)
  const [totalPages, setTotalPages] = useState<number>(0)
  const { t } = useTranslation('datasets')

  const fetchDatasets = async (page: number = 1, size: number = pageSize) => {
    try {
      setLoading(true)
      let queryParams = `page=${page}&pageSize=${size}`
      if (activeFilters.categories.length > 0) {
        queryParams += `&category=${encodeURIComponent(activeFilters.categories[0])}`
      }
      if (activeFilters.languages.length > 0) {
        queryParams += `&language=${encodeURIComponent(activeFilters.languages[0])}`
      }
      if (activeFilters.tasks.length > 0) {
        queryParams += `&task=${encodeURIComponent(activeFilters.tasks[0])}`
      }
      if (searchQuery) {
        queryParams += `&search=${encodeURIComponent(searchQuery)}`
      }
      const params: FetchDatasetsParams = {
        page,
        pageSize: size,
      }
      if (activeFilters.categories.length > 0) {
        params.field = activeFilters.categories[0]
      }
      if (activeFilters.languages.length > 0) {
        params.field = params.field ? `${params.field},${activeFilters.languages[0]}` : activeFilters.languages[0]
      }
      if (activeFilters.tasks.length > 0) {
        params.task = activeFilters.tasks[0]
      }
      if (searchQuery) {
        params.search = searchQuery
      }
      const data = await fetchDatasetsAPI(params)
      if (data.results && data.results.length > 0) {
        console.log('Sample dataset structure:', data.results[0])
        data.results = data.results.map((dataset: Dataset) => {

          if (typeof dataset.benchmarks === 'number' ||
            dataset.benchmarks === null ||
            dataset.benchmarks === undefined) {
            dataset.benchmarks = []
          }
          return dataset
        })
      }
      const hasAuthToken = typeof window !== 'undefined' && (
        localStorage.getItem('authToken') ||
        sessionStorage.getItem('authToken') ||
        localStorage.getItem('token') ||
        sessionStorage.getItem('token')
      )
      if (hasAuthToken) {
        try {
          const interestingData = await fetchInterestingDatasetsAPI()
          const interestingIds = Array.isArray(interestingData)
            ? interestingData.map((dataset: any) => dataset.id)
            : []
          data.results = data.results.map((dataset: Dataset) => ({
            ...dataset,
            starred: interestingIds.includes(dataset.id),
            isInteresting: interestingIds.includes(dataset.id),
          }))
        } catch (error) {
          console.error('Error fetching interesting datasets:', error)
        }
      }
      setDatasets(data.results)
      setTotalPages(data.pagination.totalPages)
      setCurrentPage(data.pagination.page)
    } catch (error) {
      console.error('Error fetching datasets:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDatasets(1)
  }, [])

  const handlePageChange = (page: number, size: number) => {
    setCurrentPage(page)
    if (size !== pageSize) {
      setPageSize(size)
    }
    fetchDatasets(page, size)


    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  useEffect(() => {

    if (typeof window !== 'undefined' && window.PerformanceObserver) {
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (entry.name.includes('/images/datasets/')) {
            console.log('Image request:', entry.name, 'Duration:', entry.duration)
          }
        })
      })


      observer.observe({ entryTypes: ['resource'] })

      return () => {
        observer.disconnect()
      }
    }
  }, [])

  const filteredDatasets = Array.isArray(datasets) ? datasets.filter(dataset => {
    const matchesSearch = searchQuery === '' ||
      dataset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dataset.abbreviation.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dataset.description.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesFilter = activeFilters.categories.length === 0 ||
      activeFilters.categories.includes(dataset.category)

    const matchesTaskFilter = activeFilters.tasks.length === 0 ||
      (dataset.tasks && parseTasksArray(dataset.tasks).some(task =>
        activeFilters.tasks.includes(task))
      )

    const matchesLanguageFilter = activeFilters.languages.length === 0 ||
      activeFilters.languages.includes(dataset.language)

    return matchesSearch && matchesFilter && matchesTaskFilter && matchesLanguageFilter
  }) : []

  const categories = ['Image', '3D', 'Audio', 'Medical', 'Time series', 'Text']

  const allTasks = new Set<string>()
  if (Array.isArray(datasets)) {
    datasets.forEach(dataset => {
      if (dataset.tasks) {
        const tasksArray = parseTasksArray(dataset.tasks)
        tasksArray.forEach(task => allTasks.add(task))
      }
    })
  }
  const tasks = Array.from(allTasks).sort()


  const languages = Array.isArray(datasets)
    ? [...new Set(datasets.map(dataset => dataset.language).filter(Boolean))].sort()
    : []

  const sortedDatasets = [...filteredDatasets].sort((a, b) => {
    if (sortOption === 'best-match') {
      return b.paperCount - a.paperCount
    } else if (sortOption === 'name-asc') {
      return a.name.localeCompare(b.name)
    } else if (sortOption === 'name-desc') {
      return b.name.localeCompare(a.name)
    } else if (sortOption === 'papers-desc') {
      return b.paperCount - a.paperCount
    } else if (sortOption === 'papers-asc') {
      return a.paperCount - b.paperCount
    }
    return 0
  })

  const toggleCategoryFilter = (category: string) => {
    setActiveFilters(prev => {
      const newCategories = prev.categories.includes(category)
        ? prev.categories.filter(c => c !== category)
        : [...prev.categories, category]
      return { ...prev, categories: newCategories }
    })

    setCurrentPage(1)
    fetchDatasets(1, pageSize)
  }

  const toggleTaskFilter = (task: string) => {
    setActiveFilters(prev => {
      const newTasks = prev.tasks.includes(task)
        ? prev.tasks.filter(t => t !== task)
        : [...prev.tasks, task]
      return { ...prev, tasks: newTasks }
    })

    setCurrentPage(1)
    fetchDatasets(1, pageSize)
  }

  const toggleLanguageFilter = (language: string) => {
    setActiveFilters(prev => {
      const newLanguages = prev.languages.includes(language)
        ? prev.languages.filter(l => l !== language)
        : [...prev.languages, language]
      return { ...prev, languages: newLanguages }
    })

    setCurrentPage(1)
    fetchDatasets(1, pageSize)
  }

  const clearFilters = () => {
    setActiveFilters({
      categories: [],
      tasks: [],
      languages: [],
    })
    setCurrentPage(1)
    fetchDatasets(1, pageSize)
  }

  return (
    <Content style={{ padding: '24px', minHeight: '100vh' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <Title level={2} style={{ marginBottom: 24 }}>
          {t('datasets')}
        </Title>

        <Card style={{ marginBottom: 24 }}>
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col xs={24} md={12}>
              <Search
                placeholder={t('searchForDatasets')}
                allowClear
                size='large'
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  const timer = setTimeout(() => {
                    setCurrentPage(1)
                    fetchDatasets(1, pageSize)
                  }, 300)
                  return () => clearTimeout(timer)
                }}
                onSearch={() => {
                  setCurrentPage(1)
                  fetchDatasets(1, pageSize)
                }}
              />
            </Col>
            <Col xs={24} md={12}>
              <Space size='middle' style={{ width: '100%', justifyContent: 'flex-end' }}>
                <Segmented
                  value={currentView}
                  onChange={(value) => setCurrentView(value as 'grid' | 'list')}
                  options={[
                    { label: <BarsOutlined />, value: 'list' },
                    { label: <AppstoreOutlined />, value: 'grid' },
                  ]}
                />
                <Select
                  value={sortOption}
                  onChange={setSortOption}
                  style={{ width: 160 }}
                  options={[
                    { value: 'best-match', label: t('bestMatch') },
                    { value: 'name-asc', label: t('nameAsc') },
                    { value: 'name-desc', label: t('nameDesc') },
                    { value: 'papers-desc', label: t('papersDesc') },
                    { value: 'papers-asc', label: t('papersAsc') },
                  ]}
                />
              </Space>
            </Col>
          </Row>

          <Row gutter={24}>
            <Col xs={24} md={6}>
              <div style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <Title level={4} style={{ margin: 0 }}>{t('filters')}</Title>
                  {(activeFilters.categories.length > 0 || activeFilters.tasks.length > 0 || activeFilters.languages.length > 0) && (
                    <Button
                      type='link'
                      size='small'
                      icon={<ClearOutlined />}
                      onClick={clearFilters}
                    >
                      {t('clearAll')}
                    </Button>
                  )}
                </div>

                <div style={{ marginBottom: 24 }}>
                  <Text strong style={{ marginBottom: 8, display: 'block' }}>{t('filterByModality')}</Text>
                  <Space direction='vertical' size='small' style={{ width: '100%' }}>
                    {categories.map((category) => (
                      <Checkbox
                        key={category}
                        checked={activeFilters.categories.includes(category)}
                        onChange={() => toggleCategoryFilter(category)}
                      >
                        {category}
                        <Badge
                          count={Array.isArray(datasets) ? datasets.filter(d => d.category === category).length : 0}
                          style={{ marginLeft: 8 }}
                          showZero
                        />
                      </Checkbox>
                    ))}
                  </Space>
                </div>

                <div style={{ marginBottom: 24 }}>
                  <Text strong style={{ marginBottom: 8, display: 'block' }}>{t('filterByTask')}</Text>
                  <div style={{ maxHeight: 240, overflowY: 'auto' }}>
                    <Space direction='vertical' size='small' style={{ width: '100%' }}>
                      {tasks.map((task) => (
                        <Checkbox
                          key={task}
                          checked={activeFilters.tasks.includes(task)}
                          onChange={() => toggleTaskFilter(task)}
                        >
                          {task}
                          <Badge
                            count={Array.isArray(datasets) ? datasets.filter(d => {
                              if (!d.tasks) return false
                              return parseTasksArray(d.tasks).includes(task)
                            }).length : 0}
                            style={{ marginLeft: 8 }}
                            showZero
                          />
                        </Checkbox>
                      ))}
                    </Space>
                  </div>
                </div>

                <div>
                  <Text strong style={{ marginBottom: 8, display: 'block' }}>{t('filterByLanguage')}</Text>
                  <Space direction='vertical' size='small' style={{ width: '100%' }}>
                    {languages.map((language) => (
                      <Checkbox
                        key={language}
                        checked={activeFilters.languages.includes(language)}
                        onChange={() => toggleLanguageFilter(language)}
                      >
                        {language}
                        <Badge
                          count={Array.isArray(datasets) ? datasets.filter(d => d.language === language).length : 0}
                          style={{ marginLeft: 8 }}
                          showZero
                        />
                      </Checkbox>
                    ))}
                  </Space>
                </div>
              </div>
            </Col>
            <Col xs={24} md={18}>
              <Spin spinning={loading}>
                {sortedDatasets.length === 0 && !loading ? (
                  <div style={{ textAlign: 'center', padding: '48px 0', marginBottom: 24, marginTop: 24 }}>
                    <Text type='secondary' style={{ fontSize: 16 }}>
                      {t('noDatasetsFoundMatchingCriteria')}
                    </Text>
                  </div>
                ) : currentView === 'list' ? (
                  <Space direction='vertical' size='middle' style={{ width: '100%' }}>
                    {sortedDatasets.map((dataset) => (
                      <Card key={dataset.id} hoverable>
                        <Row gutter={16}>
                          <Col xs={24} sm={6}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 96, backgroundColor: '#f5f5f5', borderRadius: 8 }}>
                              <Link href={`/datasets/${dataset.id}`}>
                                {dataset.abbreviation ? (
                                  <Image
                                    src={`/images/datasets/${dataset.abbreviation.toLowerCase().replace(/-/g, '')}.png`}
                                    alt={dataset.abbreviation}
                                    style={{ maxWidth: '100%', maxHeight: '100%' }}
                                    fallback={`data:image/svg+xml;base64,${btoa(`<svg width="80" height="80" xmlns="http://www.w3.org/2000/svg"><rect width="80" height="80" fill="#f0f0f0"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" font-size="24" fill="#999">${dataset.abbreviation}</text></svg>`)}`}
                                    preview={false}
                                  />
                                ) : (
                                  <div style={{ fontSize: 24, color: '#999' }}>No Image</div>
                                )}
                              </Link>
                            </div>
                          </Col>
                          <Col xs={24} sm={18}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                              <div>
                                <Link href={`/datasets/${dataset.id}`}>
                                  <Title level={4} style={{ margin: 0, color: '#d32f2f' }}>
                                    {dataset.name}
                                  </Title>
                                  <Text type='secondary'>{dataset.abbreviation}</Text>
                                </Link>
                              </div>
                              <InterestingDatasetButton
                                datasetId={dataset.id}
                                initialState={dataset.starred || false}
                                onToggle={(isInteresting) => {
                                  setDatasets(prevDatasets => prevDatasets.map(d =>
                                    d.id === dataset.id ? { ...d, starred: isInteresting } : d,
                                  ))
                                }}
                              />
                            </div>
                            <div style={{ margin: '8px 0' }}>
                              <Text type='secondary'>
                                {dataset.paperCount} papers • {getBenchmarkCount(dataset.benchmarks)} benchmarks • {dataset.language}
                              </Text>
                            </div>
                            <Paragraph ellipsis={{ rows: 2 }}>{dataset.description}</Paragraph>
                            <div style={{ marginBottom: 12 }}>
                              <Text strong>{t('tasks')}: </Text>
                              <Space wrap>
                                {parseTasksArray(dataset.tasks).map((task, index) => (
                                  <Tag key={index} color='red'>{task}</Tag>
                                ))}
                              </Space>
                            </div>
                            <Button
                              type='link'
                              icon={<DownloadOutlined />}
                              href={dataset.downloadUrl}
                              target='_blank'
                              rel='noopener noreferrer'
                              style={{ padding: 0, color: '#d32f2f' }}
                            >
                              {t('download')}
                            </Button>
                          </Col>
                        </Row>
                      </Card>
                    ))}
                  </Space>
                ) : (
                  <Row gutter={[16, 16]}>
                    {sortedDatasets.map((dataset) => (
                      <Col xs={24} sm={12} lg={8} key={dataset.id}>
                        <Card
                          hoverable
                          style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
                          bodyStyle={{ flex: 1, display: 'flex', flexDirection: 'column' }}
                          cover={
                            <div style={{ height: 128, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f5f5f5' }}>
                              {dataset.abbreviation ? (
                                <Image
                                  src={`/images/datasets/${dataset.abbreviation.toLowerCase().replace(/-/g, '')}.png`}
                                  alt={dataset.abbreviation}
                                  style={{ maxWidth: '100%', maxHeight: '100%' }}
                                  fallback={`data:image/svg+xml;base64,${btoa(`<svg width="80" height="80" xmlns="http://www.w3.org/2000/svg"><rect width="80" height="80" fill="#f0f0f0"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" font-size="24" fill="#999">${dataset.abbreviation}</text></svg>`)}`}
                                  preview={false}
                                />
                              ) : (
                                <div style={{ fontSize: 24, color: '#999' }}>No Image</div>
                              )}
                            </div>
                          }
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                            <div style={{ flex: 1 }}>
                              <Link href={`/datasets/${dataset.id}`}>
                                <Title level={5} style={{ margin: 0, color: '#d32f2f' }}>
                                  {dataset.name}
                                </Title>
                                <Text type='secondary' style={{ fontSize: 12 }}>{dataset.abbreviation}</Text>
                              </Link>
                            </div>
                            <InterestingDatasetButton
                              datasetId={dataset.id}
                              initialState={dataset.starred || false}
                              onToggle={(isInteresting) => {
                                setDatasets(prevDatasets => prevDatasets.map(d =>
                                  d.id === dataset.id ? { ...d, starred: isInteresting } : d,
                                ))
                              }}
                            />
                          </div>
                          <Paragraph ellipsis={{ rows: 2 }} style={{ fontSize: 12, flex: 1 }}>
                            {dataset.description}
                          </Paragraph>
                          <div style={{ fontSize: 11, color: '#666', marginBottom: 8 }}>
                            <Text type='secondary'>
                              {t('papers')}: {dataset.paperCount} • {t('benchmarks')}: {getBenchmarkCount(dataset.benchmarks)} • {t('language')}: {dataset.language}
                            </Text>
                          </div>
                          <div style={{ marginBottom: 8 }}>
                            <Space wrap size='small'>
                              {parseTasksArray(dataset.tasks).slice(0, 3).map((task, index) => (
                                <Tag key={index} color='red' style={{ fontSize: 10 }}>{task}</Tag>
                              ))}
                              {parseTasksArray(dataset.tasks).length > 3 && (
                                <Tag style={{ fontSize: 10 }}>+{parseTasksArray(dataset.tasks).length - 3}</Tag>
                              )}
                            </Space>
                          </div>
                        </Card>
                      </Col>
                    ))}
                  </Row>
                )
                }
                <div style={{ marginTop: 24, marginBottom: 24 }}>
                  <DataPagination
                    current={currentPage}
                    total={totalPages * pageSize}
                    pageSize={pageSize}
                    onChange={handlePageChange}
                    itemName='datasets'
                    loading={loading}
                  />
                </div>
              </Spin>
            </Col>
          </Row>
        </Card>
      </div>
    </Content>
  )
}
