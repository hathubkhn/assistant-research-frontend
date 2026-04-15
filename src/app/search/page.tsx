'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import InterestingButton from '@/components/InterestingButton'
import DataPagination from '@/app/components/DataPagination'
import axios from 'axios'
import {
  Layout,
  Card,
  Input,
  Typography,
  Space,
  Row,
  Col,
  Select,
  Spin,
  Alert,
  Avatar,
  Empty,
  Tag,
} from 'antd'
import { UserOutlined, FileTextOutlined } from '@ant-design/icons'

const { Title, Text } = Typography
const { Search } = Input
const { Content } = Layout
const { Option } = Select

const API_URL = process.env.NEXT_PUBLIC_API_URL

interface UserResult {
  id: number;
  type: 'user';
  username: string;
  full_name: string;
  faculty_institute: string;
  position: string;
  avatar_url: string | null;
  keywords: string;
}

interface PaperResult {
  id: number;
  type: 'paper';
  title: string;
  authors: string;
  journal: string;
  year: number;
  url: string;
  isInteresting?: boolean;
}

type SearchResult = UserResult | PaperResult;

interface SearchParams {
  query: string;
  type: string;
  page: number;
  pageSize: number;
}

interface SearchResponse {
  results: {
    papers: SearchResult[];
  };
  pagination: {
    totalItems: number;
    totalPages: number;
    page: number;
  };
}

// API Functions
const performSearchAPI = async (
  params: SearchParams,
): Promise<SearchResponse> => {
  try {
    const queryParams = new URLSearchParams({
      q: params.query,
      type: params.type,
      page: params.page.toString(),
      pageSize: params.pageSize.toString(),
    })

    const response = await axios.get(
      `${API_URL}/api/search/?${queryParams.toString()}`,
    )
    return response.data
  } catch (error) {
    console.error('Search error:', error)
    throw new Error(
      'An error occurred while searching. Please try again later.',
    )
  }
}

function SearchPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const queryParam = searchParams.get('query') || ''
  const typeParam = searchParams.get('type') || 'all'
  const pageParam = searchParams.get('page') || '1'
  const sizeParam = searchParams.get('pageSize') || '10'

  const [searchQuery, setSearchQuery] = useState(queryParam)
  const [searchType, setSearchType] = useState(typeParam)
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [currentPage, setCurrentPage] = useState(parseInt(pageParam, 10))
  const [pageSize, setPageSize] = useState(parseInt(sizeParam, 10))
  const [totalItems, setTotalItems] = useState(0)
  const [totalPages, setTotalPages] = useState(0)

  useEffect(() => {
    if (queryParam) {
      performSearch(
        queryParam,
        typeParam,
        parseInt(pageParam, 10),
        parseInt(sizeParam, 10),
      )
    }
  }, [queryParam, typeParam, pageParam, sizeParam])

  const performSearch = async (
    query: string,
    type: string,
    page: number = 1,
    size: number = pageSize,
  ) => {
    setLoading(true)
    setError('')
    try {
      const data = await performSearchAPI({
        query,
        type,
        page,
        pageSize: size,
      })
      setResults(data.results.papers || [])

      if (data.pagination) {
        setTotalItems(data.pagination.totalItems)
        setTotalPages(data.pagination.totalPages)
        setCurrentPage(data.pagination.page)
      }
    } catch (err: any) {
      setError(
        err.message ||
          'An error occurred while searching. Please try again later.',
      )
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (value: string) => {
    if (!value.trim()) return

    setSearchQuery(value)
    router.push(
      `/search?query=${encodeURIComponent(value)}&type=${searchType}&page=1&pageSize=${pageSize}`,
    )
    performSearch(value, searchType, 1, pageSize)
  }

  const handleTypeChange = (newType: string) => {
    setSearchType(newType)

    if (searchQuery.trim()) {
      router.push(
        `/search?query=${encodeURIComponent(searchQuery)}&type=${newType}&page=1&pageSize=${pageSize}`,
      )
      performSearch(searchQuery, newType, 1, pageSize)
    }
  }

  const handlePageChange = (newPage: number, newPageSize: number) => {
    setCurrentPage(newPage)
    if (newPageSize !== pageSize) {
      setPageSize(newPageSize)
    }

    router.push(
      `/search?query=${encodeURIComponent(searchQuery)}&type=${searchType}&page=${newPage}&pageSize=${newPageSize}`,
    )
    performSearch(searchQuery, searchType, newPage, newPageSize)

    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const renderUserResult = (result: UserResult) => (
    <Card
      key={`user-${result.id}`}
      style={{ marginBottom: 16 }}
      bodyStyle={{ padding: 16 }}
    >
      <Row gutter={16} align='middle'>
        <Col flex='none'>
          <Avatar size={64} src={result.avatar_url} icon={<UserOutlined />}>
            {!result.avatar_url && result.full_name.charAt(0).toUpperCase()}
          </Avatar>
        </Col>
        <Col flex='auto'>
          <Space direction='vertical' size='small' style={{ width: '100%' }}>
            <Link href={`/profile/${result.username}`}>
              <Title level={4} style={{ margin: 0, color: '#1890ff' }}>
                {result.full_name}
              </Title>
            </Link>
            <Text type='secondary'>
              {result.position} - {result.faculty_institute}
            </Text>
            <Text type='secondary' style={{ fontSize: 12 }}>
              {result.keywords}
            </Text>
          </Space>
        </Col>
        <Col flex='none'>
          <Tag color='blue' icon={<UserOutlined />}>
            User
          </Tag>
        </Col>
      </Row>
    </Card>
  )

  const renderPaperResult = (result: PaperResult) => (
    <Card
      key={`paper-${result.id}`}
      style={{ marginBottom: 16 }}
      bodyStyle={{ padding: 16 }}
    >
      <Row justify='space-between' align='top'>
        <Col flex='auto'>
          <Space direction='vertical' size='small' style={{ width: '100%' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
              }}
            >
              <a href={result.url} target='_blank' rel='noopener noreferrer'>
                <Title level={4} style={{ margin: 0, color: '#1890ff' }}>
                  {result.title}
                </Title>
              </a>
              <InterestingButton
                paperId={result.id.toString()}
                initialState={result.isInteresting}
              />
            </div>
            <Text type='secondary'>{result.authors}</Text>
            <Text type='secondary'>
              <Text strong>{result.journal}</Text> ({result.year})
            </Text>
          </Space>
        </Col>
        <Col flex='none'>
          <Tag color='green' icon={<FileTextOutlined />}>
            Paper
          </Tag>
        </Col>
      </Row>
    </Card>
  )

  return (
    <Content
      style={{
        padding: '24px',
        minHeight: '100vh',
        backgroundColor: '#f5f5f5',
      }}
    >
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <Card style={{ marginBottom: 24 }}>
          <Title level={2} style={{ marginBottom: 24 }}>
            Search
          </Title>

          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col xs={24} md={16}>
              <Search
                placeholder='Enter search keywords...'
                size='large'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onSearch={handleSearch}
                enterButton='Search'
              />
            </Col>
            <Col xs={24} md={8}>
              <Select
                value={searchType}
                onChange={handleTypeChange}
                style={{ width: '100%' }}
                size='large'
              >
                <Option value='all'>All</Option>
                <Option value='users'>Users</Option>
                <Option value='papers'>Papers</Option>
              </Select>
            </Col>
          </Row>

          {error && (
            <Alert
              message='Search Error'
              description={error}
              type='error'
              showIcon
              style={{ marginBottom: 24 }}
            />
          )}

          <Spin spinning={loading}>
            {!loading && !error && (
              <>
                {results.length > 0 ? (
                  <>
                    <div style={{ marginBottom: 24 }}>
                      <Title level={4} style={{ margin: 0 }}>
                        Search Results ({totalItems})
                      </Title>
                    </div>

                    <div style={{ marginBottom: 24 }}>
                      {results.map((result) =>
                        result.type === 'user'
                          ? renderUserResult(result)
                          : renderPaperResult(result),
                      )}
                    </div>

                    {results.length > 0 && (
                      <Space
                        direction='vertical'
                        style={{
                          width: '100%',
                          marginTop: 24,
                          marginBottom: 24,
                        }}
                      >
                        <DataPagination
                          current={currentPage}
                          total={totalItems}
                          pageSize={pageSize}
                          onChange={handlePageChange}
                          itemName='results'
                          loading={loading}
                        />
                      </Space>
                    )}
                  </>
                ) : (
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description={
                      <span>
                        No results found
                        <br />
                        Try searching with different keywords
                      </span>
                    }
                  />
                )}
              </>
            )}
          </Spin>
        </Card>
      </div>
    </Content>
  )
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <Content
          style={{
            padding: '24px',
            minHeight: '100vh',
            backgroundColor: '#f5f5f5',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              minHeight: '50vh',
            }}
          >
            <Spin size='large' />
          </div>
        </Content>
      }
    >
      <SearchPageContent />
    </Suspense>
  )
}
