'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import axios from 'axios'
import {
  Card,
  Button,
  Typography,
  Space,
  Row,
  Col,
  Spin,
  Alert,
  Divider,
  Tag,
} from 'antd'
import {
  ExportOutlined,
  CalendarOutlined,
  TeamOutlined,
} from '@ant-design/icons'
import BackNavigationButton from '@/components/BackNavigationButton'
import DataPagination from '@/app/components/DataPagination'

const { Title, Text } = Typography
const API_URL = process.env.NEXT_PUBLIC_API_URL

interface Conference {
  id: string;
  name: string;
  abbreviation: string;
  rank: string;
  location: string;
  url: string;
  papersCount: number;
  created_at: string;
}

interface Paper {
  id: string;
  title: string;
  year: number;
  authors: string[] | string;
}

interface PapersResponse {
  results: Paper[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
}

const fetchConferenceById = async (id: string): Promise<Conference> => {
  const response = await axios.get(`${API_URL}/api/conferences/${id}/`)
  return response.data
}

const fetchConferencePapers = async (
  id: string,
  page: number,
  pageSize: number,
): Promise<PapersResponse> => {
  const response = await axios.get(`${API_URL}/api/conferences/${id}/papers/`, {
    params: { page, pageSize },
  })
  return response.data
}

export default function ConferenceDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [conference, setConference] = useState<Conference | null>(null)
  const [papers, setPapers] = useState<Paper[]>([])
  const [loading, setLoading] = useState(true)
  const [papersLoading, setPapersLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [totalItems, setTotalItems] = useState(0)

  useEffect(() => {
    const loadConferenceData = async () => {
      if (!id) return

      try {
        setLoading(true)
        const data = await fetchConferenceById(id)
        setConference(data)
      } catch (error: any) {
        if (error.response?.status === 404) {
          console.error(`Conference not found with ID: ${id}`)
        } else {
          console.error(error.message)
        }
      } finally {
        setLoading(false)
      }
    }

    loadConferenceData()
  }, [id])

  const loadPapers = useCallback(async () => {
    if (!id) return

    try {
      setPapersLoading(true)
      const data = await fetchConferencePapers(id, currentPage, pageSize)
      setPapers(data.results || [])
      setTotalItems(data.pagination?.totalItems ?? 0)
    } catch (error) {
      console.error('Error fetching conference papers:', error)
      setPapers([])
      setTotalItems(0)
    } finally {
      setPapersLoading(false)
    }
  }, [id, currentPage, pageSize])

  useEffect(() => {
    loadPapers()
  }, [loadPapers])

  const handlePageChange = (page: number, size: number) => {
    setCurrentPage(page)
    setPageSize(size)
  }

  const handleViewMorePapers = () => {
    router.push(`/papers?venueType=conference&venue_id=${id}`)
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

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '60vh',
        padding: '32px',
      }}>
        <Spin size='large' />
      </div>
    )
  }

  if (!conference) {
    return (
      <div style={{ padding: '32px' }}>
        <Alert
          message='Conference Not Found'
          description='Conference not found. Please check the URL and try again.'
          type='error'
          showIcon
          action={
            <Link href='/conferences'>
              <Button type='primary'>Go back to Conferences</Button>
            </Link>
          }
        />
      </div>
    )
  }

  const formatAuthors = (authors: string[] | string): string => {
    if (typeof authors === 'string') {
      try {
        const parsedAuthors = JSON.parse(authors)
        if (Array.isArray(parsedAuthors)) {
          return parsedAuthors.join(', ')
        }
        return authors
      } catch {
        return authors
      }
    } else if (Array.isArray(authors)) {
      return authors.join(', ')
    }
    return 'Unknown'
  }

  return (
    <div style={{ padding: '32px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: '24px' }}>
        <BackNavigationButton
          href='/conferences'
          label='Back to Conferences'
        />
      </div>

      <Card style={{ marginBottom: '32px' }}>
        <Row justify='space-between' align='top' gutter={[16, 16]}>
          <Col xs={24} md={18}>
            <Space direction='vertical' size='small'>
              <Title level={1} style={{ marginBottom: 0, color: '#1890ff' }}>
                {conference.name}
              </Title>
              <Text type='secondary' style={{ fontSize: '18px' }}>
                {conference.abbreviation}
              </Text>
            </Space>
          </Col>
          <Col xs={24} md={6} style={{ textAlign: 'right' }}>
            {conference.url && (
              <Button
                type='primary'
                icon={<ExportOutlined />}
                href={conference.url}
                target='_blank'
                rel='noopener noreferrer'
              >
                Visit Conference
              </Button>
            )}
          </Col>
        </Row>

        <Divider />

        <Row gutter={[24, 16]}>
          <Col xs={24} sm={8}>
            <Card size='small' style={{ backgroundColor: '#fafafa' }}>
              <Space direction='vertical' size='small'>
                <Text type='secondary' strong style={{ textTransform: 'uppercase', fontSize: '12px' }}>
                  Rank
                </Text>
                <Tag color={getRankColor(conference.rank)} style={{ fontSize: '14px', fontWeight: 600 }}>
                  {conference.rank || 'Not ranked'}
                </Tag>
              </Space>
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card size='small' style={{ backgroundColor: '#fafafa' }}>
              <Space direction='vertical' size='small'>
                <Text type='secondary' strong style={{ textTransform: 'uppercase', fontSize: '12px' }}>
                  Location
                </Text>
                <Text strong>{conference.location || 'Various Locations'}</Text>
              </Space>
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card size='small' style={{ backgroundColor: '#fafafa' }}>
              <Space direction='vertical' size='small'>
                <Text type='secondary' strong style={{ textTransform: 'uppercase', fontSize: '12px' }}>
                  Total Papers
                </Text>
                <Text strong style={{ fontSize: '18px' }}>{conference.papersCount}</Text>
              </Space>
            </Card>
          </Col>
        </Row>
      </Card>

      <Card>
        <Row justify='space-between' align='middle' style={{ marginBottom: '16px' }}>
          <Col>
            <Title level={3} style={{ marginBottom: 0 }}>Papers</Title>
          </Col>
          <Col>
            <Button type='link' onClick={handleViewMorePapers}>
              View All
            </Button>
          </Col>
        </Row>

        <Spin spinning={papersLoading}>
          {papers.length === 0 && !papersLoading ? (
            <Text type='secondary'>No papers found for this conference.</Text>
          ) : (
            <>
              <Space direction='vertical' size='large' style={{ width: '100%' }}>
                {papers.map((paper, index) => (
                  <div key={paper.id}>
                    <Space direction='vertical' size='small' style={{ width: '100%' }}>
                      <Link href={`/papers/${paper.id}`}>
                        <Text strong style={{ color: '#1890ff', cursor: 'pointer' }}>
                          {paper.title}
                        </Text>
                      </Link>
                      <Space size='small' wrap>
                        <Space size='small'>
                          <TeamOutlined />
                          <Text type='secondary'>{formatAuthors(paper.authors)}</Text>
                        </Space>
                        <Text type='secondary'>•</Text>
                        <Space size='small'>
                          <CalendarOutlined />
                          <Text type='secondary'>{paper.year}</Text>
                        </Space>
                      </Space>
                    </Space>
                    {index < papers.length - 1 && <Divider />}
                  </div>
                ))}
              </Space>
              <div style={{ marginTop: 16 }}>
                <DataPagination
                  current={currentPage}
                  total={totalItems}
                  pageSize={pageSize}
                  onChange={handlePageChange}
                  itemName='papers'
                  loading={papersLoading}
                />
              </div>
            </>
          )}
        </Spin>
      </Card>
    </div>
  )
}
