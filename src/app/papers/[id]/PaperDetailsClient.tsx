'use client'

import InterestingButton from '@/components/InterestingButton'
import {
  ArrowLeftOutlined,
  CopyOutlined,
  DownloadOutlined,
  GithubOutlined,
  LinkOutlined,
} from '@ant-design/icons'
import {
  Alert,
  Button,
  Card,
  Col,
  Descriptions,
  Divider,
  List,
  Modal,
  Row,
  Space,
  Spin,
  Tag,
  Typography,
} from 'antd'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { toast } from 'react-hot-toast'
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

const { Title, Paragraph, Text } = Typography
const API_URL = process.env.NEXT_PUBLIC_API_URL

async function fetchPaperDetails(paper_id: string): Promise<Paper> {
  const response = await fetch(`${API_URL}/api/papers/${paper_id}/`)

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('Paper not found')
    }
    throw new Error('Failed to fetch paper details')
  }

  return await response.json()
}

interface CitationData {
  year: number;
  count: number;
}

interface CitingPaper {
  id: string;
  title: string;
  authors: string[];
  year: number;
}

interface Paper {
  id: string;
  title: string;
  authors: string[];
  conference?: string;
  venue?: string;
  venueType?: 'conference' | 'journal';
  year: number;
  field: string;
  keywords: string[];
  abstract: string;
  downloadUrl: string;
  method?: string;
  results?: string;
  conclusions?: string;
  citingPapers?: CitingPaper[];
  references?: string[];
  doi?: string;
  bibtex?: string;
  sourceCode?: string;
  impactFactor?: number;
  quartile?: 'Q1' | 'Q2' | 'Q3' | 'Q4';
  citationsByYear?: CitationData[];
  datasets?: {
    id: string;
    name: string;
    abbreviation?: string;
    description: string;
    category?: string;
    data_type?: string;
    size?: string;
    format?: string;
    source_url?: string;
    license?: string;
    tasks?: string[];
    language?: string;
    downloadUrl?: string;
  }[];
  isInteresting?: boolean;
}

const PaperHeader = ({ paper }: { paper: Paper }) => (
  <Space direction='vertical' size='middle' style={{ width: '100%' }}>
    <Title level={1} style={{ margin: 0 }}>
      {paper?.title || 'No title found.'}
    </Title>
    <Paragraph style={{ fontSize: '20px', color: '#6b7280', margin: 0 }}>
      {paper?.authors?.join(', ') || 'No authors found.'}
    </Paragraph>
    <Space wrap>
      {paper?.keywords && paper?.keywords.length > 0 ? (
        paper?.keywords.map((keyword, index) => (
          <Tag key={index} color='blue'>
            {keyword}
          </Tag>
        ))
      ) : (
        <Paragraph style={{ color: '#6b7280' }}>No keywords found.</Paragraph>
      )}
    </Space>
  </Space>
)


const PublicationDetails = ({ paper, onShowBibtex }: { paper: Paper; onShowBibtex: () => void }) => (
  <Descriptions
    title='Publication Details'
    bordered
    column={{ xxl: 3, xl: 3, lg: 3, md: 2, sm: 1, xs: 1 }}
    size='small'
  >
    <Descriptions.Item label={paper?.venueType === 'journal' ? 'Journal' : 'Conference'}>
      <div style={{ display: 'flex', justifyContent: 'left', alignItems: 'left' }}>
        <Paragraph style={{ color: '#6b7280', margin: 0 }}>{paper?.venue || paper?.conference || 'No venue found.'}</Paragraph>
      </div>
    </Descriptions.Item>
    <Descriptions.Item label='Year'>
      <div style={{ display: 'flex', justifyContent: 'left', alignItems: 'left' }}>
        <Paragraph style={{ color: '#6b7280', margin: 0 }}>{paper?.year || 'No year found.'}</Paragraph>
      </div>
    </Descriptions.Item>
    <Descriptions.Item label='Field'>
      <div style={{ display: 'flex', justifyContent: 'left', alignItems: 'left' }}>
        <Paragraph style={{ color: '#6b7280', margin: 0 }}>{paper?.field || 'No field found.'}</Paragraph>
      </div>
    </Descriptions.Item>
    <Descriptions.Item label='DOI'>
      <div style={{ display: 'flex', justifyContent: 'left', alignItems: 'left' }}>
        {paper?.doi ? (
          <Typography.Link
            href={`https://doi.org/${paper?.doi}`}
            target='_blank'
            rel='noopener noreferrer'
            style={{ display: 'flex', alignItems: 'left', gap: '4px' }}
          >
            <LinkOutlined />
            {paper?.doi}
          </Typography.Link>
        ) : (
          <Paragraph style={{ color: '#6b7280', margin: 0 }}>No DOI found.</Paragraph>
        )}
      </div>
    </Descriptions.Item>

    <Descriptions.Item label='BibTeX'>
      <div style={{ display: 'flex', justifyContent: 'left', alignItems: 'left' }}>
        {paper?.bibtex ? (
          <Typography.Link
            onClick={onShowBibtex}
            style={{ display: 'flex', alignItems: 'left', gap: '4px', cursor: 'pointer' }}
          >
            <CopyOutlined />
            View & Copy Citation
          </Typography.Link>
        ) : (
          <Paragraph style={{ color: '#6b7280', margin: 0 }}>No bibtex found.</Paragraph>
        )}
      </div>
    </Descriptions.Item>
    <Descriptions.Item label='Source Code'>
      <div style={{ display: 'flex', justifyContent: 'left', alignItems: 'left' }}>
        {paper?.sourceCode ? (
          <Typography.Link
            href={paper?.sourceCode}
            target='_blank'
            rel='noopener noreferrer'
            style={{ display: 'flex', alignItems: 'left', gap: '4px' }}
          >
            <GithubOutlined />
            GitHub Repository
          </Typography.Link>
        ) : (
          <Paragraph style={{ color: '#6b7280', margin: 0 }}>No source code found.</Paragraph>
        )}
      </div>
    </Descriptions.Item>
    {paper?.impactFactor ? (
      <Descriptions.Item label='Impact Factor'>
        <div style={{ display: 'flex', justifyContent: 'left', alignItems: 'left' }}>
          <span style={{ color: '#374151', fontWeight: 500 }}>{paper?.impactFactor.toFixed(2)}</span>
        </div>
      </Descriptions.Item>
    ) : (
      <Descriptions.Item label='Impact Factor'>
        <div style={{ display: 'flex', justifyContent: 'left', alignItems: 'left' }}>
          <Paragraph style={{ color: '#6b7280', margin: 0 }}>No impact factor found.</Paragraph>
        </div>
      </Descriptions.Item>
    )}
    {paper?.quartile ? (
      <Descriptions.Item label='Quartile'>
        <div style={{ display: 'flex', justifyContent: 'left', alignItems: 'left' }}>
          <Tag color='blue'>{paper?.quartile}</Tag>
        </div>
      </Descriptions.Item>
    ) : (
      <Descriptions.Item label='Quartile'>
        <div style={{ display: 'flex', justifyContent: 'left', alignItems: 'left' }}>
          <Paragraph style={{ color: '#6b7280', margin: 0 }}>No quartile found.</Paragraph>
        </div>
      </Descriptions.Item>
    )}
  </Descriptions>
)

const PaperAbstract = ({ abstract }: { abstract?: string }) => (
  <>
    <Title level={2}>Abstract</Title>
    <Paragraph style={{ fontSize: '16px', lineHeight: '1.6' }}>
      {abstract || 'No abstract found.'}
    </Paragraph>
  </>
)

const PaperDatasets = ({ datasets, router }: { datasets?: Paper['datasets']; router: any }) => (
  <>
    <Title level={2}>Datasets</Title>
    {datasets && datasets.length > 0 ? (
      <List
        dataSource={datasets}
        renderItem={(dataset, idx) => (
          <List.Item key={idx}>
            <Card
              size='small'
              title={
                <Button
                  type='link'
                  onClick={() => router.push(`/datasets/${dataset.id}`)}
                  style={{ padding: 0, fontSize: '18px', fontWeight: 500 }}
                >
                  {dataset.name} {dataset.abbreviation && `(${dataset.abbreviation})`}
                </Button>
              }
              style={{ width: '100%' }}
            >
              {dataset.description && (
                <Paragraph style={{ color: '#6b7280', marginBottom: '16px' }}>
                  {dataset.description}
                </Paragraph>
              )}

              <Descriptions size='small' column={3}>
                {dataset.size && (
                  <Descriptions.Item label='Size'>{dataset.size}</Descriptions.Item>
                )}
                {dataset.license && (
                  <Descriptions.Item label='License'>
                    <Tag color='blue'>{dataset.license}</Tag>
                  </Descriptions.Item>
                )}
                {dataset.category && (
                  <Descriptions.Item label='Category'>{dataset.category}</Descriptions.Item>
                )}
                {dataset.language && (
                  <Descriptions.Item label='Language'>{dataset.language}</Descriptions.Item>
                )}
              </Descriptions>

              {dataset.tasks && Array.isArray(dataset.tasks) && dataset.tasks.length > 0 && (
                <div style={{ marginTop: '16px' }}>
                  <Text strong style={{ color: '#6b7280', fontSize: '14px' }}>Tasks:</Text>
                  <div style={{ marginTop: '8px' }}>
                    {dataset.tasks.map((task, taskIdx) => (
                      <Tag key={taskIdx} color='blue'>
                        {task}
                      </Tag>
                    ))}
                  </div>
                </div>
              )}

              {dataset.downloadUrl && (
                <div style={{ marginTop: '16px' }}>
                  <Button
                    type='link'
                    href={dataset.downloadUrl}
                    target='_blank'
                    rel='noopener noreferrer'
                    icon={<DownloadOutlined />}
                    style={{ padding: 0 }}
                  >
                    Download Dataset
                  </Button>
                </div>
              )}
            </Card>
          </List.Item>
        )}
      />
    ) : (
      <Paragraph style={{ color: '#6b7280' }}>No datasets associated with this paper.</Paragraph>
    )}
  </>
)

const CitationMetrics = ({ citationsByYear }: { citationsByYear?: CitationData[] }) => (
  <>
    <Title level={2}>Citation Metrics</Title>
    {citationsByYear && citationsByYear.length > 0 ? (
      <div style={{ height: '320px' }}>
        <ResponsiveContainer width='100%' height='100%'>
          <BarChart
            data={citationsByYear.map(item => ({
              year: item.year.toString(),
              citations: item.count,
            }))}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray='3 3' />
            <XAxis dataKey='year' />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey='citations' fill='#1890ff' />
          </BarChart>
        </ResponsiveContainer>
      </div>
    ) : (
      <Paragraph style={{ color: '#6b7280' }}>No citation data available for this paper.</Paragraph>
    )}
  </>
)

const PaperSection = ({ title, content }: { title: string; content?: string }) => (
  <>
    <Title level={2}>{title}</Title>
    <div style={{ fontSize: '16px', lineHeight: '1.6', color: '#374151' }}>
      {content ?
        content.split('\n\n').map((paragraph, idx) => (
          <Paragraph key={idx} style={{ marginBottom: '16px' }}>{paragraph}</Paragraph>
        ))
        :
        <Paragraph style={{ color: '#6b7280' }}>No {title.toLowerCase()} information available.</Paragraph>
      }
    </div>
  </>
)

const CitingPapers = ({ citingPapers, router }: { citingPapers?: CitingPaper[]; router: any }) => (
  <>
    <Title level={2}>Citing Papers</Title>
    {citingPapers && citingPapers.length > 0 ? (
      <List
        dataSource={citingPapers}
        renderItem={(citingPaper, idx) => (
          <List.Item key={idx}>
            <Card
              hoverable
              size='small'
              onClick={() => router.push(`/papers/${citingPaper.id}`)}
              style={{ width: '100%', cursor: 'pointer' }}
            >
              <Card.Meta
                title={
                  <Text style={{ color: '#1890ff', fontSize: '18px' }}>
                    {citingPaper.title}
                  </Text>
                }
                description={
                  <Text style={{ color: '#6b7280' }}>
                    {citingPaper.authors.join(', ')} ({citingPaper.year})
                  </Text>
                }
              />
            </Card>
          </List.Item>
        )}
      />
    ) : (
      <Paragraph style={{ color: '#6b7280' }}>No citing papers found.</Paragraph>
    )}
  </>
)

const PaperReferences = ({ references }: { references?: string[] }) => (
  <>
    <Title level={2}>References</Title>
    {references && references.length > 0 ? (
      <List
        dataSource={references}
        renderItem={(reference, idx) => (
          <List.Item key={idx}>
            <Text style={{ color: '#374151' }}>
              {idx + 1}. {reference}
            </Text>
          </List.Item>
        )}
      />
    ) : (
      <Paragraph style={{ color: '#6b7280' }}>No references found.</Paragraph>
    )}
  </>
)

export default function PaperDetailsClient({ paper_id }: { paper_id: string }) {
  const router = useRouter()
  const [paper, setPaper] = useState<Paper | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showBibtexModal, setShowBibtexModal] = useState(false)

  useEffect(() => {
    const fetchPaper = async () => {
      try {
        setLoading(true)
        const data = await fetchPaperDetails(paper_id)
        setPaper(data)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
        setPaper(null)
      } finally {
        setLoading(false)
      }
    }

    fetchPaper()
  }, [paper_id])

  const copyBibtex = () => {
    if (paper?.bibtex) {
      navigator.clipboard.writeText(paper.bibtex)
      toast.success('BibTeX citation copied to clipboard')
    }
  }
  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', width: '100%', minHeight: '100vh' }}>
        <Space direction='vertical' style={{ width: '80%' }}>
          <Row justify='space-between' style={{ paddingTop: '24px' }} align='middle'>
            <Col>
              <Card
                hoverable
                onClick={() => router.push('/papers')}
                style={{
                  cursor: 'pointer',
                  backgroundColor: '#1890ff',
                  borderColor: '#1890ff',
                  height: '40px',
                  minWidth: '160px',
                  transition: 'all 0.3s ease',
                }}
                styles={{
                  body: {
                    padding: '8px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100%',
                  },
                }}
              >
                <Space align='center' size={8}>
                  <ArrowLeftOutlined style={{ color: '#ffffff', fontSize: '16px' }} />
                  <span style={{ color: '#ffffff', fontWeight: 500, fontSize: '14px' }}>
                    Back to Papers
                  </span>
                </Space>
              </Card>
            </Col>
          </Row>
          <Space style={{ flex: 1, justifyContent: 'center', alignItems: 'center', width: '100%' }}>
            <Space direction='vertical' size='large' align='center'>
              <Spin size='large' tip='Loading paper details...' />
            </Space>
          </Space>
        </Space>
      </div>
    )
  }

  if (error && !loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', width: '100%', minHeight: '100vh' }}>
        <Space direction='vertical' style={{ width: '80%' }}>
          <Row justify='space-between' style={{ paddingTop: '24px' }} align='middle'>
            <Col>
              <Card
                hoverable
                onClick={() => router.push('/papers')}
                style={{
                  cursor: 'pointer',
                  backgroundColor: '#1890ff',
                  borderColor: '#1890ff',
                  height: '40px',
                  minWidth: '160px',
                  transition: 'all 0.3s ease',
                }}
                styles={{
                  body: {
                    padding: '8px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100%',
                  },
                }}
              >
                <Space align='center' size={8}>
                  <ArrowLeftOutlined style={{ color: '#ffffff', fontSize: '16px' }} />
                  <span style={{ color: '#ffffff', fontWeight: 500, fontSize: '14px' }}>
                    Back to Papers
                  </span>
                </Space>
              </Card>
            </Col>
          </Row>
          <Space style={{ flex: 1, justifyContent: 'center', alignItems: 'center', width: '100%' }}>
            <Space direction='vertical' size='large' align='center'>
              <Alert message='Error' description={error} type='error' showIcon />
            </Space>
          </Space>
        </Space>
      </div>
    )
  }

  if (!paper && !loading && !error) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', width: '100%', minHeight: '100vh' }}>
        <Space direction='vertical' style={{ width: '80%' }}>
          <Row justify='space-between' style={{ paddingTop: '24px' }} align='middle'>
            <Col>
              <Card
                hoverable
                onClick={() => router.push('/papers')}
                style={{
                  cursor: 'pointer',
                  backgroundColor: '#1890ff',
                  borderColor: '#1890ff',
                  height: '40px',
                  minWidth: '160px',
                  transition: 'all 0.3s ease',
                }}
                styles={{
                  body: {
                    padding: '8px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100%',
                  },
                }}
              >
                <Space align='center' size={8}>
                  <ArrowLeftOutlined style={{ color: '#ffffff', fontSize: '16px' }} />
                  <span style={{ color: '#ffffff', fontWeight: 500, fontSize: '14px' }}>
                    Back to Papers
                  </span>
                </Space>
              </Card>
            </Col>
          </Row>
          <Space style={{ flex: 1, justifyContent: 'center', alignItems: 'center', width: '100%' }}>
            <Space direction='vertical' size='large' align='center'>
              <Title level={1} style={{ color: '#6b7280', textAlign: 'center', margin: 0 }}>
                Paper not found
              </Title>
              <Paragraph style={{ color: '#9ca3af', textAlign: 'center', fontSize: '16px', margin: 0 }}>
                The paper you're looking for doesn't exist or may have been removed.
              </Paragraph>
            </Space>
          </Space>
        </Space>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center', width: '100%', minHeight: '100vh' }}>
      <Space direction='vertical' size='large' style={{ width: '80%' }}>
        <Modal
          title='BibTeX Citation'
          open={showBibtexModal}
          onCancel={() => setShowBibtexModal(false)}
          footer={[
            <Button key='copy' type='primary' icon={<CopyOutlined />} onClick={copyBibtex}>
              Copy to Clipboard
            </Button>,
          ]}
        >
          <pre style={{
            background: '#f9fafb',
            padding: '16px',
            borderRadius: '8px',
            overflow: 'auto',
            fontSize: '14px',
            fontFamily: 'monospace',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
          }}>
            {paper?.bibtex}
          </pre>
        </Modal>

        <Space direction='vertical' size='large' style={{ width: '100%' }}>
          <Row justify='space-between' style={{ paddingTop: '24px' }} align='middle'>
            <Col>
              <Card
                hoverable
                onClick={() => router.push('/papers')}
                style={{
                  cursor: 'pointer',
                  backgroundColor: '#1890ff',
                  borderColor: '#1890ff',
                  height: '40px',
                  minWidth: '160px',
                  transition: 'all 0.3s ease',
                }}
                styles={{
                  body: {
                    padding: '8px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100%',
                  },
                }}
              >
                <Space align='center' size={8}>
                  <ArrowLeftOutlined style={{ color: '#ffffff', fontSize: '16px' }} />
                  <span style={{ color: '#ffffff', fontWeight: 500, fontSize: '14px' }}>
                    Back to Papers
                  </span>
                </Space>
              </Card>
            </Col>
            <Col>
              <Space>
                {paper && (
                  <InterestingButton
                    paperId={paper.id}
                    initialState={paper.isInteresting || false}
                  />
                )}

                <Card
                  hoverable
                  onClick={() => paper?.downloadUrl && window.open(paper.downloadUrl, '_blank', 'noopener noreferrer')}
                  style={{
                    cursor: 'pointer',
                    backgroundColor: '#16a34a',
                    borderColor: '#16a34a',
                    height: '40px',
                    minWidth: '160px',
                    transition: 'all 0.3s ease',
                  }}
                  styles={{
                    body: {
                      padding: '8px 16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      height: '100%',
                    },
                  }}
                >
                  <Space align='center' size={8}>
                    <DownloadOutlined style={{ color: '#ffffff', fontSize: '16px' }} />
                    <span style={{ color: '#ffffff', fontWeight: 500, fontSize: '14px' }}>
                      Download Paper
                    </span>
                  </Space>
                </Card>
              </Space>
            </Col>
          </Row>

          <Card>
            {paper && (
              <>
                <PaperHeader paper={paper} />
                <Divider />
                <PublicationDetails paper={paper} onShowBibtex={() => setShowBibtexModal(true)} />
                <Divider />
                <PaperAbstract abstract={paper?.abstract} />
                <Divider />
                <PaperDatasets datasets={paper?.datasets} router={router} />
                <Divider />
                <CitationMetrics citationsByYear={paper?.citationsByYear} />
                <Divider />
                <PaperSection title='Method' content={paper?.method} />
                <Divider />
                <PaperSection title='Results' content={paper?.results} />
                <Divider />
                <PaperSection title='Conclusions' content={paper?.conclusions} />
                <Divider />
                <CitingPapers citingPapers={paper?.citingPapers} router={router} />
                <Divider />
                <PaperReferences references={paper?.references} />
              </>
            )}
          </Card>
        </Space>
      </Space>
    </div>
  )
}
