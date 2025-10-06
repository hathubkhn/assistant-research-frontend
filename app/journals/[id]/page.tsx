"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Card,
  Button,
  Spin,
  Alert,
  Typography,
  Row,
  Col,
  Statistic,
  Tag,
  List,
  Space,
} from "antd";
import { ArrowLeftOutlined, LinkOutlined } from "@ant-design/icons";

const { Title, Text } = Typography;

interface Journal {
  id: string;
  name: string;
  abbreviation: string;
  impactFactor: number;
  quartile: string;
  publisher: string;
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

export default function JournalDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [journal, setJournal] = useState<Journal | null>(null);
  const [papers, setPapers] = useState<Paper[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchJournalDetails = async () => {
      try {
        setLoading(true);
        const apiUrl =
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
        const response = await fetch(`${apiUrl}/api/journals/${id}/`);

        if (response.status === 404) {
          console.error(`Journal not found with ID: ${id}`);
          setLoading(false);
          return;
        }

        if (response.ok) {
          const data = await response.json();
          setJournal(data);
          setPapers(data.papers || []);
        } else {
          console.error(
            `Error fetching journal details: ${response.status} ${response.statusText}`
          );
        }
      } catch (error) {
        console.error("Error fetching journal details:", error);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchJournalDetails();
    }
  }, [id]);

  const handleViewMorePapers = () => {
    router.push(`/papers?venueType=journal&venue_id=${id}`);
  };

  // Format authors for display
  const formatAuthors = (authors: string[] | string): string => {
    if (typeof authors === "string") {
      try {
        const parsedAuthors = JSON.parse(authors);
        if (Array.isArray(parsedAuthors)) {
          return parsedAuthors.join(", ");
        }
        return authors;
      } catch {
        return authors;
      }
    } else if (Array.isArray(authors)) {
      return authors.join(", ");
    }
    return "Unknown";
  };

  // Get quartile tag color
  const getQuartileColor = (quartile: string) => {
    switch (quartile) {
      case "Q1":
        return "green";
      case "Q2":
        return "blue";
      case "Q3":
        return "gold";
      case "Q4":
        return "red";
      default:
        return "default";
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 flex justify-center items-center min-h-[60vh]">
        <Spin size="large" />
      </div>
    );
  }

  if (!journal) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert
          message="Journal not found"
          description={
            <div>
              <p>Please check the URL and try again.</p>
              <Link href="/journals">
                <Button type="link" className="p-0 mt-2">
                  Go back to Journals
                </Button>
              </Link>
            </div>
          }
          type="error"
          showIcon
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Back button */}
      <div className="mb-6">
        <Link href="/journals">
          <Button type="link" icon={<ArrowLeftOutlined />} className="p-0">
            Back to Journals
          </Button>
        </Link>
      </div>

      {/* Journal header */}
      <Card className="mb-6">
        <Space direction="vertical" size="large" style={{ width: "100%" }}>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <Title level={2} className="!mb-2">
                {journal.name}
              </Title>
              <Text type="secondary" className="text-lg">
                {journal.abbreviation}
              </Text>
            </div>
            {journal.url && (
              <Button
                type="primary"
                icon={<LinkOutlined />}
                href={journal.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                Visit Journal
              </Button>
            )}
          </div>

          <Row gutter={[16, 16]}>
            <Col xs={24} sm={8}>
              <Card>
                <Statistic
                  title="IMPACT FACTOR"
                  value={
                    journal.impactFactor
                      ? journal.impactFactor.toFixed(2)
                      : "N/A"
                  }
                />
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card>
                <Statistic
                  title="QUARTILE"
                  value={journal.quartile || "N/A"}
                  valueRender={(value) => (
                    <Tag
                      color={getQuartileColor(journal.quartile)}
                      className="text-sm"
                    >
                      {value}
                    </Tag>
                  )}
                />
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card>
                <Statistic
                  title="PUBLISHER"
                  value={journal.publisher || "N/A"}
                />
              </Card>
            </Col>
          </Row>

          <Card>
            <Statistic title="TOTAL PAPERS" value={journal.papersCount} />
          </Card>
        </Space>
      </Card>

      {/* Recent papers */}
      <Card
        title={
          <Title level={4} className="!mb-0">
            Recent Papers
          </Title>
        }
        extra={
          <Button type="link" onClick={handleViewMorePapers}>
            View All
          </Button>
        }
      >
        {papers.length === 0 ? (
          <Text type="secondary">No papers found for this journal.</Text>
        ) : (
          <List
            dataSource={papers}
            renderItem={(paper) => (
              <List.Item>
                <List.Item.Meta
                  title={
                    <Link
                      href={`/papers/${paper.id}`}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      {paper.title}
                    </Link>
                  }
                  description={
                    <Space split="•" size="small">
                      <Text type="secondary">
                        {formatAuthors(paper.authors)}
                      </Text>
                      <Text type="secondary">{paper.year}</Text>
                    </Space>
                  }
                />
              </List.Item>
            )}
          />
        )}
      </Card>
    </div>
  );
}
