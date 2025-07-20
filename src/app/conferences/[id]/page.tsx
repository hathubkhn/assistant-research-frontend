'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';
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
  Tag
} from 'antd';
import {
  ArrowLeftOutlined,
  ExportOutlined,
  CalendarOutlined,
  TeamOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;

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

const fetchConferenceById = async (id: string): Promise<Conference & { papers: Paper[] }> => {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  try {
    const response = await axios.get(`${apiUrl}/api/conferences/${id}/`);
    return response.data;
  } catch (error: any) {
    if (error.response?.status === 404) {
      throw new Error(`Conference not found with ID: ${id}`);
    }
    throw new Error(`Error fetching conference details: ${error.response?.status} ${error.response?.statusText || error.message}`);
  }
};

export default function ConferenceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [conference, setConference] = useState<Conference | null>(null);
  const [papers, setPapers] = useState<Paper[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadConferenceData = async () => {
      if (!id) return;

      try {
        setLoading(true);
        console.log("Fetching conference with ID:", id);

        const data = await fetchConferenceById(id);
        console.log("Conference data received:", data);

        setConference(data);
        setPapers(data.papers || []);
      } catch (error: any) {
        console.error(error.message);
      } finally {
        setLoading(false);
      }
    };

    loadConferenceData();
  }, [id]);

  const handleViewMorePapers = () => {
    router.push(`/papers?venueType=conference&venue_id=${id}`);
  };

  const getRankColor = (rank: string) => {
    switch (rank) {
      case 'A*': return 'purple';
      case 'A': return 'green';
      case 'B': return 'blue';
      case 'C': return 'orange';
      default: return 'default';
    }
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '60vh',
        padding: '32px'
      }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!conference) {
    return (
      <div style={{ padding: '32px' }}>
        <Alert
          message="Conference Not Found"
          description="Conference not found. Please check the URL and try again."
          type="error"
          showIcon
          action={
            <Link href="/conferences">
              <Button type="primary">Go back to Conferences</Button>
            </Link>
          }
        />
      </div>
    );
  }

  // Format authors for display
  const formatAuthors = (authors: string[] | string): string => {
    if (typeof authors === 'string') {
      try {
        const parsedAuthors = JSON.parse(authors);
        if (Array.isArray(parsedAuthors)) {
          return parsedAuthors.join(', ');
        }
        return authors;
      } catch {
        return authors;
      }
    } else if (Array.isArray(authors)) {
      return authors.join(', ');
    }
    return 'Unknown';
  };

  return (
    <div style={{ padding: '32px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Back button */}
      <Space style={{ marginBottom: '24px' }}>
        <Link href="/conferences">
          <Button icon={<ArrowLeftOutlined />} type="link">
            Back to Conferences
          </Button>
        </Link>
      </Space>

      {/* Conference header */}
      <Card style={{ marginBottom: '32px' }}>
        <Row justify="space-between" align="top" gutter={[16, 16]}>
          <Col xs={24} md={18}>
            <Space direction="vertical" size="small">
              <Title level={1} style={{ marginBottom: 0, color: '#1890ff' }}>
                {conference.name}
              </Title>
              <Text type="secondary" style={{ fontSize: '18px' }}>
                {conference.abbreviation}
              </Text>
            </Space>
          </Col>
          <Col xs={24} md={6} style={{ textAlign: 'right' }}>
            {conference.url && (
              <Button
                type="primary"
                icon={<ExportOutlined />}
                href={conference.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                Visit Conference
              </Button>
            )}
          </Col>
        </Row>

        <Divider />

        <Row gutter={[24, 16]}>
          <Col xs={24} sm={8}>
            <Card size="small" style={{ backgroundColor: '#fafafa' }}>
              <Space direction="vertical" size="small">
                <Text type="secondary" strong style={{ textTransform: 'uppercase', fontSize: '12px' }}>
                  Rank
                </Text>
                <Tag color={getRankColor(conference.rank)} style={{ fontSize: '14px', fontWeight: 600 }}>
                  {conference.rank || 'N/A'}
                </Tag>
              </Space>
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card size="small" style={{ backgroundColor: '#fafafa' }}>
              <Space direction="vertical" size="small">
                <Text type="secondary" strong style={{ textTransform: 'uppercase', fontSize: '12px' }}>
                  Location
                </Text>
                <Text strong>{conference.location || 'Various Locations'}</Text>
              </Space>
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card size="small" style={{ backgroundColor: '#fafafa' }}>
              <Space direction="vertical" size="small">
                <Text type="secondary" strong style={{ textTransform: 'uppercase', fontSize: '12px' }}>
                  Total Papers
                </Text>
                <Text strong style={{ fontSize: '18px' }}>{conference.papersCount}</Text>
              </Space>
            </Card>
          </Col>
        </Row>
      </Card>

      {/* Recent papers */}
      <Card>
        <Row justify="space-between" align="middle" style={{ marginBottom: '16px' }}>
          <Col>
            <Title level={3} style={{ marginBottom: 0 }}>Recent Papers</Title>
          </Col>
          <Col>
            <Button type="link" onClick={handleViewMorePapers}>
              View All
            </Button>
          </Col>
        </Row>

        {papers.length === 0 ? (
          <Text type="secondary">No papers found for this conference.</Text>
        ) : (
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            {papers.map((paper, index) => (
              <div key={paper.id}>
                <Space direction="vertical" size="small" style={{ width: '100%' }}>
                  <Link href={`/papers/${paper.id}`}>
                    <Text strong style={{ color: '#1890ff', cursor: 'pointer' }}>
                      {paper.title}
                    </Text>
                  </Link>
                  <Space size="small" wrap>
                    <Space size="small">
                      <TeamOutlined />
                      <Text type="secondary">{formatAuthors(paper.authors)}</Text>
                    </Space>
                    <Text type="secondary">•</Text>
                    <Space size="small">
                      <CalendarOutlined />
                      <Text type="secondary">{paper.year}</Text>
                    </Space>
                  </Space>
                </Space>
                {index < papers.length - 1 && <Divider />}
              </div>
            ))}
          </Space>
        )}
      </Card>
    </div>
  );
} 