'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useTranslation } from '@/utils/useTranslation'
import axios from 'axios'
import {
  Card,
  Table,
  Button,
  Typography,
  Space,
  Input,
  Spin,
  Tag,
  Row,
  Col,
  Layout,
} from 'antd'
import {
  ClearOutlined,
  LinkOutlined,
} from '@ant-design/icons'
import DataPagination from '@/app/components/DataPagination'

const { Title, Text } = Typography
const { Search } = Input
const { Content } = Layout

// API Functions
const API_URL = process.env.NEXT_PUBLIC_API_URL

interface JournalsResponse {
  results: Journal[];
  pagination: {
    totalItems: number;
    totalPages: number;
    page: number;
    pageSize: number;
  };
}

interface FetchJournalsParams {
  page?: number;
  pageSize?: number;
  quartile?: string;
  impactMin?: number;
  impactMax?: number;
  search?: string;
}

const fetchJournalsAPI = async (params: FetchJournalsParams): Promise<JournalsResponse> => {
  try {
    const queryParams = new URLSearchParams()

    if (params.page) queryParams.append('page', params.page.toString())
    if (params.pageSize) queryParams.append('pageSize', params.pageSize.toString())
    if (params.quartile) queryParams.append('quartile', params.quartile)
    if (params.impactMin !== undefined) queryParams.append('impactMin', params.impactMin.toString())
    if (params.impactMax !== undefined) queryParams.append('impactMax', params.impactMax.toString())
    if (params.search) queryParams.append('search', params.search)

    const response = await axios.get(`${API_URL}/api/journals/?${queryParams.toString()}`)
    return response.data
  } catch (error) {
    console.error('Error fetching journals:', error)
    throw error
  }
}

interface Journal {
  id: string;
  name: string;
  abbreviation: string;
  impactFactor: number;
  quartile: string;
  publisher: string;
  url: string;
  papersCount: number;
}


interface ImpactRange {
  min: number;
  max: number | null;
  label: string;
}

export default function JournalsPage() {
  const { t } = useTranslation('journals')
  const [journals, setJournals] = useState<Journal[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  const [currentPage, setCurrentPage] = useState<number>(1)
  const [pageSize, setPageSize] = useState<number>(20)
  const [totalItems, setTotalItems] = useState<number>(0)

  const [quartileFilter, setQuartileFilter] = useState<string>('')
  const [impactFilter, setImpactFilter] = useState<string>('')

  const impactRanges: ImpactRange[] = [
    { min: 0, max: 3, label: '0~3' },
    { min: 3, max: 5, label: '3~5' },
    { min: 5, max: 7, label: '5~7' },
    { min: 7, max: null, label: '7+' },
  ]

  const fetchJournals = async (page: number = 1, size: number = pageSize, quartileValue: string = quartileFilter, impactValue: string = impactFilter, searchValue: string = searchQuery) => {
    try {
      setLoading(true)

      const params: FetchJournalsParams = {
        page,
        pageSize: size,
      }

      if (quartileValue) {
        params.quartile = quartileValue
      }

      if (impactValue) {
        const selectedRange = impactRanges.find(range => range.label === impactValue)
        if (selectedRange) {
          params.impactMin = selectedRange.min
          if (selectedRange.max !== null) {
            params.impactMax = selectedRange.max
          }
        }
      }

      if (searchValue) {
        params.search = searchValue
      }

      const data = await fetchJournalsAPI(params)
      setJournals(data.results)
      setTotalItems(data.pagination.totalItems)
      setCurrentPage(data.pagination.page)
    } catch (error) {
      console.error('Error fetching journals:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchJournals(1, pageSize, quartileFilter, impactFilter, searchQuery)
  }, [])


  const handlePageChange = (page: number, size: number) => {
    setCurrentPage(page)
    if (size !== pageSize) {
      setPageSize(size)
    }
    fetchJournals(page, size, quartileFilter, impactFilter, searchQuery)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
  }


  const handleSearch = (value?: string) => {
    const searchValue = value !== undefined ? value : searchQuery
    setSearchQuery(searchValue)
    setCurrentPage(1)
    fetchJournals(1, pageSize, quartileFilter, impactFilter, searchValue)
  }


  const handleQuartileFilterChange = (quartile: string) => {

    const newQuartileValue = quartileFilter === quartile ? '' : quartile
    setQuartileFilter(newQuartileValue)
    setCurrentPage(1)

    fetchJournals(1, pageSize, newQuartileValue, impactFilter, searchQuery)
  }


  const handleImpactFilterChange = (impact: string) => {
    const newImpactValue = impactFilter === impact ? '' : impact
    setImpactFilter(newImpactValue)
    setCurrentPage(1)

    fetchJournals(1, pageSize, quartileFilter, newImpactValue, searchQuery)
  }


  const clearFilters = () => {
    setQuartileFilter('')
    setImpactFilter('')
    setSearchQuery('')
    setCurrentPage(1)
    fetchJournals(1, pageSize, '', '', '')
  }


  const columns = [
    {
      title: t('table.journal'),
      dataIndex: 'name',
      key: 'name',
      sorter: (a: Journal, b: Journal) => a.name.localeCompare(b.name),
      render: (text: string, record: Journal) => (
        <Link href={`/journals/${record.id}`}>
          <Text strong style={{ color: '#1890ff', cursor: 'pointer' }}>
            {text}
          </Text>
        </Link>
      ),
    },
    {
      title: t('table.abbreviation'),
      dataIndex: 'abbreviation',
      key: 'abbreviation',
      width: 150,
    },
    {
      title: t('table.impactFactor'),
      dataIndex: 'impactFactor',
      key: 'impactFactor',
      width: 120,
      sorter: (a: Journal, b: Journal) => a.impactFactor - b.impactFactor,
      render: (value: number) => value.toFixed(2),
    },
    {
      title: t('table.quartile'),
      dataIndex: 'quartile',
      key: 'quartile',
      width: 100,
      render: (quartile: string) => {
        const colors = {
          Q1: 'green',
          Q2: 'blue',
          Q3: 'orange',
          Q4: 'red',
        }
        return <Tag color={colors[quartile as keyof typeof colors]}>{quartile}</Tag>
      },
    },
    {
      title: t('table.publisher'),
      dataIndex: 'publisher',
      key: 'publisher',
      ellipsis: true,
    },
    {
      title: t('table.papers'),
      dataIndex: 'papersCount',
      key: 'papersCount',
      width: 100,
      sorter: (a: Journal, b: Journal) => a.papersCount - b.papersCount,
    },
    {
      title: '',
      key: 'actions',
      width: 120,
      render: (record: Journal) =>
        record.url ? (
          <Button
            type='link'
            icon={<LinkOutlined />}
            href={record.url}
            target='_blank'
            rel='noopener noreferrer'
          >
            {t('visitJournal')}
          </Button>
        ) : null,
    },
  ]

  return (
    <Content style={{ padding: '24px', minHeight: '100vh' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <Title level={2} style={{ marginBottom: 24 }}>
          {t('title')}
        </Title>

        <Card style={{ marginBottom: 24 }}>
          <Space direction='vertical' size='large' style={{ width: '100%' }}>
            <Row gutter={[16, 16]}>
              <Col xs={24} md={18}>
                <Search
                  placeholder={t('search.placeholder')}
                  allowClear
                  enterButton={t('search.button')}
                  size='large'
                  value={searchQuery}
                  onChange={handleSearchChange}
                  onSearch={handleSearch}
                />
              </Col>
            </Row>
            <div>
              <Text strong style={{ marginBottom: 8, display: 'block' }}>
                {t('filters.quartile.title')}:
              </Text>
              <Space wrap>
                {['Q1', 'Q2', 'Q3', 'Q4'].map(quartile => (
                  <Button
                    key={quartile}
                    type={quartileFilter === quartile ? 'primary' : 'default'}
                    onClick={() => handleQuartileFilterChange(quartile)}
                    size='small'
                  >
                    {quartile}
                  </Button>
                ))}
              </Space>
            </div>

            <div>
              <Text strong style={{ marginBottom: 8, display: 'block' }}>
                {t('filters.impact.title')}:
              </Text>
              <Space wrap>
                {impactRanges.map(range => (
                  <Button
                    key={range.label}
                    type={impactFilter === range.label ? 'primary' : 'default'}
                    onClick={() => handleImpactFilterChange(range.label)}
                    size='small'
                  >
                    {range.label}
                  </Button>
                ))}
                {(quartileFilter || impactFilter || searchQuery) && (
                  <Button
                    icon={<ClearOutlined />}
                    onClick={clearFilters}
                    size='small'
                  >
                    {t('filters.clearFilters')}
                  </Button>
                )}
              </Space>
            </div>
          </Space>
        </Card>

        <Card>
          <Spin spinning={loading}>
            {journals.length === 0 && !loading ? (
              <div style={{ textAlign: 'center', padding: '48px 0' }}>
                <Text type='secondary' style={{ fontSize: 16 }}>
                  {t('noResults')}
                </Text>
                <br />
                <Button
                  type='primary'
                  onClick={clearFilters}
                  style={{ marginTop: 16 }}
                >
                  {t('filters.clearFilters')}
                </Button>
              </div>
            ) : (
              <>
                <Table
                  columns={columns}
                  dataSource={journals}
                  rowKey='id'
                  pagination={false}
                  scroll={{ x: 800 }}
                  size='middle'
                />
                <div style={{ marginTop: 16 }}>
                  <DataPagination
                    current={currentPage}
                    total={totalItems}
                    pageSize={pageSize}
                    onChange={handlePageChange}
                    itemName='journals'
                    loading={loading}
                  />
                </div>
              </>
            )}
          </Spin>
        </Card>
      </div>
    </Content>
  )
}
