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

export default function ConferenceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [conference, setConference] = useState<Conference | null>(null);
  const [papers, setPapers] = useState<Paper[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchConferenceDetails = async () => {
      try {
        setLoading(true);
        const apiUrl =
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

        // Try the API endpoint
        let response = await fetch(`${apiUrl}/api/conferences/${id}/`);

        if (response.status === 404) {
          console.error(`Conference not found with ID: ${id}`);
          setLoading(false);
          return;
        }

        if (response.ok) {
          const data = await response.json();
          console.log("Conference data received:", data);
          setConference(data);
          setPapers(data.papers || []);
        } else {
          console.error(
            `Error fetching conference details: ${response.status} ${response.statusText}`
          );
        }
      } catch (error) {
        console.error("Error fetching conference details:", error);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      console.log("Fetching conference with ID:", id);
      fetchConferenceDetails();
    }
  }, [id]);

  const handleViewMorePapers = () => {
    router.push(`/papers?venueType=conference&venue_id=${id}`);
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

  // Get rank tag color
  const getRankColor = (rank: string) => {
    switch (rank) {
      case "A*":
        return "purple";
      case "A":
        return "green";
      case "B":
        return "blue";
      case "C":
        return "gold";
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

  if (!conference) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert
          message="Conference not found"
          description={
            <div>
              <p>Please check the URL and try again.</p>
              <Link href="/conferences">
                <Button type="link" className="p-0 mt-2">
                  Go back to Conferences
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
        <Link href="/conferences">
          <Button type="link" icon={<ArrowLeftOutlined />} className="p-0">
            Back to Conferences
          </Button>
        </Link>
      </div>

      {/* Conference header */}
      <Card className="mb-6">
        <Space direction="vertical" size="large" style={{ width: "100%" }}>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <Title level={2} className="!mb-2">
                {conference.name}
              </Title>
              <Text type="secondary" className="text-lg">
                {conference.abbreviation}
              </Text>
            </div>
            {conference.url && (
              <Button
                type="primary"
                icon={<LinkOutlined />}
                href={conference.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                Visit Conference
              </Button>
            )}
          </div>

          <Row gutter={[16, 16]}>
            <Col xs={24} sm={8}>
              <Card>
                <Statistic
                  title="RANK"
                  value={conference.rank || "N/A"}
                  valueRender={(value) => (
                    <Tag
                      color={getRankColor(conference.rank)}
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
                  title="LOCATION"
                  value={conference.location || "Various Locations"}
                />
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card>
                <Statistic
                  title="TOTAL PAPERS"
                  value={conference.papersCount}
                />
              </Card>
            </Col>
          </Row>
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
          <Text type="secondary">No papers found for this conference.</Text>
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
