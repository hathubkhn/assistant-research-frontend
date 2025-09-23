"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import InterestingButton from "@/components/InterestingButton";
import { 
  Card, 
  Button, 
  Typography, 
  Space, 
  Row, 
  Col, 
  Tag, 
  Modal, 
  Spin, 
  Alert, 
  Descriptions, 
  List, 
  Divider 
} from 'antd';
import { 
  ArrowLeftOutlined, 
  DownloadOutlined, 
  CopyOutlined, 
  CloseOutlined, 
  GithubOutlined,
  LinkOutlined
} from '@ant-design/icons';

const { Title, Paragraph, Text } = Typography;
const API_URL = process.env.NEXT_PUBLIC_API_URL;

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
    doi?: string;         // DOI identifier for the paper
    bibtex?: string;      // BibTeX citation format
    sourceCode?: string;  // Link to source code repository
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

export default function PaperDetailsClient({ slug }: { slug: string }) {
    const router = useRouter();
    const [paper, setPaper] = useState<Paper | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showBibtexModal, setShowBibtexModal] = useState(false);

    useEffect(() => {
        const fetchPaper = async () => {
            try {
                setLoading(true);
                if (!slug) {
                    throw new Error('Invalid paper identifier');
                }
                let response;
                response = await fetch(`${API_URL}/api/papers/by-slug/${slug}/`);

                if (!response.ok) {
                    if (response.status === 404) {
                        throw new Error('Paper not found');
                    }
                    throw new Error('Failed to fetch paper details');
                }

                const data = await response.json();
                setPaper(data);
                setError(null);
            } catch (err) {
                console.error('Error fetching paper:', err);
                setError(err instanceof Error ? err.message : 'An error occurred');
                setPaper(null);
            } finally {
                setLoading(false);
            }
        };

        fetchPaper();
    }, [slug]);

    const copyBibtex = () => {
        if (paper?.bibtex) {
            navigator.clipboard.writeText(paper.bibtex);
            // Here you could add a toast notification
        }
    };

    if (loading) {
        return (
            <div style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                minHeight: '100vh',
                padding: '24px'
            }}>
                <Spin size="large" tip="Loading paper details..." />
            </div>
        );
    }

    if (error) {
        return (
            <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px' }}>
                <Space direction="vertical" size="large" style={{ width: '100%' }}>
                    <Button
                        onClick={() => router.push('/papers')}
                        icon={<ArrowLeftOutlined />}
                        type="primary"
                    >
                        Back to Papers
                    </Button>
                    <Alert
                        message="Error"
                        description={error}
                        type="error"
                        showIcon
                    />
                </Space>
            </div>
        );
    }

    if (!paper) {
        return (
            <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px' }}>
                <Space direction="vertical" size="large" style={{ width: '100%' }}>
                    <Button
                        onClick={() => router.push('/papers')}
                        icon={<ArrowLeftOutlined />}
                        type="primary"
                    >
                        Back to Papers
                    </Button>
                    <div style={{ textAlign: 'center', padding: '48px 0' }}>
                        <Title level={2} style={{ color: '#6b7280' }}>
                            Paper not found
                        </Title>
                    </div>
                </Space>
            </div>
        );
    }

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px' }}>
            {/* BibTeX Modal */}
            <Modal
                title="BibTeX Citation"
                open={showBibtexModal}
                onCancel={() => setShowBibtexModal(false)}
                footer={[
                    <Button key="copy" type="primary" icon={<CopyOutlined />} onClick={copyBibtex}>
                        Copy to Clipboard
                    </Button>
                ]}
                width={800}
            >
                <pre style={{ 
                    background: '#f9fafb', 
                    padding: '16px', 
                    borderRadius: '8px', 
                    overflow: 'auto',
                    fontSize: '14px',
                    fontFamily: 'monospace',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word'
                }}>
                    {paper?.bibtex}
                </pre>
            </Modal>

            <Space direction="vertical" size="large" style={{ width: '100%' }}>
                <Row justify="space-between" align="middle">
                    <Col>
                        <Button
                            onClick={() => router.push('/papers')}
                            icon={<ArrowLeftOutlined />}
                            type="primary"
                            size="large"
                        >
                            Back to Papers
                        </Button>
                    </Col>
                    <Col>
                        <Space>
                            {/* Interesting button */}
                            {paper && (
                                <InterestingButton
                                    paperId={paper.id}
                                    className="px-4 py-2 text-yellow-500 bg-white border border-yellow-500 rounded hover:bg-yellow-50 inline-flex items-center"
                                    initialState={paper.isInteresting || false}
                                />
                            )}

                            {/* Download Paper button */}
                            <Button
                                href={paper?.downloadUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                icon={<DownloadOutlined />}
                                type="primary"
                                style={{ backgroundColor: '#16a34a' }}
                                size="large"
                            >
                                Download Paper
                            </Button>
                        </Space>
                    </Col>
                </Row>

                <Card>
                    {/* Paper Title and Authors */}
                    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                        <Title level={1} style={{ margin: 0 }}>
                            {paper.title}
                        </Title>
                        <Paragraph style={{ fontSize: '20px', color: '#6b7280', margin: 0 }}>
                            {paper.authors.join(", ")}
                        </Paragraph>
                        <Space wrap>
                            {paper.keywords.map((keyword, index) => (
                                <Tag key={index} color="blue">
                                    {keyword}
                                </Tag>
                            ))}
                        </Space>
                    </Space>

                    <Divider />

                    {/* Publication Details */}
                    <Descriptions 
                        title="Publication Details" 
                        bordered 
                        column={{ xxl: 3, xl: 3, lg: 3, md: 2, sm: 1, xs: 1 }}
                        size="small"
                    >
                        <Descriptions.Item label={paper.venueType === 'journal' ? 'Journal' : 'Conference'}>
                            {paper.venue || paper.conference}
                        </Descriptions.Item>
                        <Descriptions.Item label="Year">
                            {paper.year}
                        </Descriptions.Item>
                        <Descriptions.Item label="Field">
                            {paper.field}
                        </Descriptions.Item>
                        {paper.doi && (
                            <Descriptions.Item label="DOI">
                                <Button
                                    type="link"
                                    href={`https://doi.org/${paper.doi}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    icon={<LinkOutlined />}
                                    style={{ padding: 0 }}
                                >
                                    {paper.doi}
                                </Button>
                            </Descriptions.Item>
                        )}
                        {paper.bibtex && (
                            <Descriptions.Item label="BibTeX">
                                <Button
                                    type="link"
                                    onClick={() => setShowBibtexModal(true)}
                                    icon={<CopyOutlined />}
                                    style={{ padding: 0 }}
                                >
                                    View & Copy Citation
                                </Button>
                            </Descriptions.Item>
                        )}
                        {paper.sourceCode && (
                            <Descriptions.Item label="Source Code">
                                <Button
                                    type="link"
                                    href={paper.sourceCode}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    icon={<GithubOutlined />}
                                    style={{ padding: 0 }}
                                >
                                    GitHub Repository
                                </Button>
                            </Descriptions.Item>
                        )}
                        {paper.impactFactor && (
                            <Descriptions.Item label="Impact Factor">
                                {paper.impactFactor.toFixed(2)}
                            </Descriptions.Item>
                        )}
                        {paper.quartile && (
                            <Descriptions.Item label="Quartile">
                                <Tag color="blue">{paper.quartile}</Tag>
                            </Descriptions.Item>
                        )}
                    </Descriptions>

                    <Divider />

                    {/* Abstract */}
                    <Title level={2}>Abstract</Title>
                    <Paragraph style={{ fontSize: '16px', lineHeight: '1.6' }}>
                        {paper.abstract}
                    </Paragraph>

                    <Divider />

                    {/* Datasets */}
                    <Title level={2}>Datasets</Title>
                    {paper.datasets && paper.datasets.length > 0 ? (
                        <List
                            dataSource={paper.datasets}
                            renderItem={(dataset, idx) => (
                                <List.Item key={idx}>
                                    <Card
                                        size="small"
                                        title={
                                            <Button
                                                type="link"
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
                                        
                                        <Descriptions size="small" column={3}>
                                            {dataset.size && (
                                                <Descriptions.Item label="Size">{dataset.size}</Descriptions.Item>
                                            )}
                                            {dataset.license && (
                                                <Descriptions.Item label="License">{dataset.license}</Descriptions.Item>
                                            )}
                                            {dataset.category && (
                                                <Descriptions.Item label="Category">{dataset.category}</Descriptions.Item>
                                            )}
                                            {dataset.language && (
                                                <Descriptions.Item label="Language">{dataset.language}</Descriptions.Item>
                                            )}
                                        </Descriptions>

                                        {dataset.tasks && Array.isArray(dataset.tasks) && dataset.tasks.length > 0 && (
                                            <div style={{ marginTop: '16px' }}>
                                                <Text strong style={{ color: '#6b7280', fontSize: '14px' }}>Tasks:</Text>
                                                <div style={{ marginTop: '8px' }}>
                                                    {dataset.tasks.map((task, taskIdx) => (
                                                        <Tag key={taskIdx} color="blue">
                                                            {task}
                                                        </Tag>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {dataset.downloadUrl && (
                                            <div style={{ marginTop: '16px' }}>
                                                <Button
                                                    type="link"
                                                    href={dataset.downloadUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
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

                    <Divider />

                    {/* Citation Metrics Section */}
                    <Title level={2}>Citation Metrics</Title>
                    {paper.citationsByYear && paper.citationsByYear.length > 0 ? (
                        <div style={{ height: '320px' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={paper.citationsByYear.map(item => ({
                                        year: item.year.toString(),
                                        citations: item.count
                                    }))}
                                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="year" />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Bar dataKey="citations" fill="#1890ff" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <Paragraph style={{ color: '#6b7280' }}>No citation data available for this paper.</Paragraph>
                    )}

                    <Divider />

                    {/* Method */}
                    <Title level={2}>Method</Title>
                    <div style={{ fontSize: '16px', lineHeight: '1.6', color: '#374151' }}>
                        {paper.method?.split('\n\n').map((paragraph, idx) => (
                            <Paragraph key={idx} style={{ marginBottom: '16px' }}>{paragraph}</Paragraph>
                        )) || <Paragraph style={{ color: '#6b7280' }}>No method information available.</Paragraph>}
                    </div>

                    <Divider />

                    {/* Results */}
                    <Title level={2}>Results</Title>
                    <div style={{ fontSize: '16px', lineHeight: '1.6', color: '#374151' }}>
                        {paper.results?.split('\n\n').map((paragraph, idx) => (
                            <Paragraph key={idx} style={{ marginBottom: '16px' }}>{paragraph}</Paragraph>
                        )) || <Paragraph style={{ color: '#6b7280' }}>No results information available.</Paragraph>}
                    </div>

                    <Divider />

                    {/* Conclusions */}
                    <Title level={2}>Conclusions</Title>
                    <div style={{ fontSize: '16px', lineHeight: '1.6', color: '#374151' }}>
                        {paper.conclusions?.split('\n\n').map((paragraph, idx) => (
                            <Paragraph key={idx} style={{ marginBottom: '16px' }}>{paragraph}</Paragraph>
                        )) || <Paragraph style={{ color: '#6b7280' }}>No conclusions information available.</Paragraph>}
                    </div>

                    <Divider />

                    {/* Citing Papers */}
                    <Title level={2}>Citing Papers</Title>
                    {paper.citingPapers && paper.citingPapers.length > 0 ? (
                        <List
                            dataSource={paper.citingPapers}
                            renderItem={(citingPaper, idx) => (
                                <List.Item key={idx}>
                                    <Card
                                        hoverable
                                        size="small"
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
                                                    {citingPaper.authors.join(", ")} ({citingPaper.year})
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

                    <Divider />

                    {/* References */}
                    <Title level={2}>References</Title>
                    {paper.references && paper.references.length > 0 ? (
                        <List
                            dataSource={paper.references}
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
                </Card>
            </Space>
        </div>
    );
} 