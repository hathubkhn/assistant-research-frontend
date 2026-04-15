'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import axios from 'axios'
import {
  Card,
  Table,
  Button,
  Typography,
  Space,
  Input,
  Spin,
  Alert,
  Tag,
  Row,
  Col,
  Select,
} from 'antd'
import {
  SearchOutlined,
  ClearOutlined,
  ExportOutlined,
} from '@ant-design/icons'
import DataPagination from '@/app/components/DataPagination'

const { Title, Text } = Typography
const { Search } = Input
const API_URL = process.env.NEXT_PUBLIC_API_URL

interface Conference {
  id: string;
  name: string;
  abbreviation: string;
  rank: string;
  location: string;
  url: string;
  papersCount: number;
}

interface ConferencesResponse {
  results: Conference[];
  pagination: {
    totalItems: number;
    totalPages: number;
    page: number;
  };
}

interface FetchConferencesParams {
  page?: number;
  pageSize?: number;
  rankFilter?: string;
  searchQuery?: string;
}

const fetchConferences = async (params: FetchConferencesParams): Promise<ConferencesResponse> => {
  try {
    const queryParams = new URLSearchParams()

    queryParams.append('page', (params.page || 1).toString())
    queryParams.append('pageSize', (params.pageSize || 20).toString())

    if (params.rankFilter) {
      if (params.rankFilter === 'Not ranked') {
        queryParams.append('rank', 'null')
      } else {
        queryParams.append('rank', params.rankFilter)
      }
    }

    if (params.searchQuery) {
      queryParams.append('search', params.searchQuery)
    }

    const response = await axios.get(`${API_URL}/api/conferences/?${queryParams.toString()}`)
    return response.data
  } catch (error: any) {
    throw new Error(`Error fetching conferences: ${error.response?.status} ${error.response?.statusText || error.message}`)
  }
}

export default function ConferencesPage() {
  const [conferences, setConferences] = useState<Conference[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  const [currentPage, setCurrentPage] = useState<number>(1)
  const [pageSize, setPageSize] = useState<number>(20)
  const [totalItems, setTotalItems] = useState<number>(0)

  const [rankFilter, setRankFilter] = useState<string>('')

  const loadConferences = async (page: number = 1, size: number = pageSize) => {
    try {
      setLoading(true)

      const data = await fetchConferences({
        page,
        pageSize: size,
        rankFilter,
        searchQuery,
      })

      setConferences(data.results)
      setTotalItems(data.pagination.totalItems)
      setCurrentPage(data.pagination.page)
    } catch (error: any) {
      console.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadConferences(1)
  }, [rankFilter, searchQuery])

  const handlePageChange = (page: number, size?: number) => {
    setCurrentPage(page)
    if (size && size !== pageSize) {
      setPageSize(size)
    }
    loadConferences(page, size || pageSize)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleSearch = (value: string) => {
    setSearchQuery(value)
    setCurrentPage(1)
    loadConferences(1)
  }

  const handleRankFilterChange = (rank: string) => {
    setRankFilter(prev => prev === rank ? '' : rank)
    setCurrentPage(1)
    loadConferences(1, pageSize)
  }

  const clearFilters = () => {
    setRankFilter('')
    setSearchQuery('')
    setCurrentPage(1)
    loadConferences(1, pageSize)
  }

  const getRankColor = (rank: string) => {
    switch (rank) {
      case 'A*': return 'purple'
      case 'A': return 'green'
      case 'B': return 'blue'
      case 'C': return 'orange'
      default: return 'default'
    }
  }

  const columns = [
    {
      title: 'Conference',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: Conference) => (
        <Link href={`/conferences/${record.id}`}>
          <Text style={{ color: '#1890ff', cursor: 'pointer' }}>
            {text}
          </Text>
        </Link>
      ),
    },
    {
      title: 'Abbreviation',
      dataIndex: 'abbreviation',
      key: 'abbreviation',
    },
    {
      title: 'Rank',
      dataIndex: 'rank',
      key: 'rank',
      render: (rank: string) => (
        <Tag color={getRankColor(rank)}>
          {rank || 'N/A'}
        </Tag>
      ),
    },
    {
      title: 'Location',
      dataIndex: 'location',
      key: 'location',
      render: (location: string) => location || 'N/A',
    },
    {
      title: 'Papers',
      dataIndex: 'papersCount',
      key: 'papersCount',
      align: 'right' as const,
    },
    {
      title: 'Action',
      key: 'action',
      render: (text: any, record: Conference) => (
        record.url && (
          <Button
            type='link'
            icon={<ExportOutlined />}
            href={record.url}
            target='_blank'
            rel='noopener noreferrer'
            size='small'
          >
            Visit
          </Button>
        )
      ),
    },
  ]

  return (
    <div style={{ padding: '32px', maxWidth: '1400px', margin: '0 auto' }}>
      <Title level={2} style={{ color: '#d9363e', marginBottom: '24px' }}>
        Academic Conferences
      </Title>

      <Card style={{ marginBottom: '24px' }}>
        <Space direction='vertical' size='large' style={{ width: '100%' }}>
          <Row gutter={[16, 16]}>
            <Col xs={24} md={16}>
              <Search
                placeholder='Search conferences...'
                allowClear
                enterButton={<SearchOutlined />}
                size='large'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onSearch={handleSearch}
              />
            </Col>
          </Row>

          <div>
            <Text strong style={{ marginBottom: '8px', display: 'block' }}>
              Filter by Rank:
            </Text>
            <Space size='small' wrap>
              {['A*', 'A', 'B', 'C', 'Not ranked'].map(rank => (
                <Button
                  key={rank}
                  type={rankFilter === rank ? 'primary' : 'default'}
                  onClick={() => handleRankFilterChange(rank)}
                  size='small'
                >
                  {rank}
                </Button>
              ))}
              {rankFilter && (
                <Button
                  icon={<ClearOutlined />}
                  onClick={clearFilters}
                  size='small'
                >
                  Clear Filters
                </Button>
              )}
            </Space>
          </div>
        </Space>
      </Card>

      <Card>
        {loading ? (
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '300px',
          }}>
            <Spin size='large' />
          </div>
        ) : conferences.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <Alert
              message='No conferences found'
              description='No conferences found matching your criteria.'
              type='info'
              showIcon
              action={
                <Button onClick={clearFilters} type='primary'>
                  Clear Filters
                </Button>
              }
            />
          </div>
        ) : (
          <>
            <Table
              columns={columns}
              dataSource={conferences}
              rowKey='id'
              pagination={false}
              scroll={{ x: 800 }}
            />

            <DataPagination
              current={currentPage}
              total={totalItems}
              pageSize={pageSize}
              onChange={handlePageChange}
              itemName='conferences'
              loading={loading}
            />
          </>
        )}
      </Card>
    </div>
  )
}
