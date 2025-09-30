import Image from "next/image";
import Link from "next/link";
import { HomeStatistics } from "./components/HomeStatistics";
import { Card, Row, Col, Button, Typography, Space, Statistic } from "antd";
import {
  FileTextOutlined,
  RobotOutlined,
  ShareAltOutlined,
  ArrowRightOutlined,
} from "@ant-design/icons";

const { Title, Paragraph } = Typography;

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col">
      {/* Hero Section */}
      <div className="bg-gradient-to-b from-blue-800 to-blue-900">
        <div className="bg-gradient-to-b from-blue-600/[.15] via-transparent">
          <div className="max-w-[85rem] mx-auto px-4 sm:px-6 lg:px-8 py-24 space-y-8">
            <div className="max-w-3xl text-center mx-auto">
              <Title
                level={1}
                className="font-medium text-white !mb-0"
                style={{ color: "white", fontSize: "3.5rem" }}
              >
                AI-Powered Research Assistant
              </Title>
            </div>

            <div className="max-w-3xl text-center mx-auto">
              <Paragraph className="text-lg text-blue-100">
                Your personalized guide to discovering, connecting, and
                utilizing academic research through an intelligent network of
                papers, datasets, and publications.
              </Paragraph>
            </div>

            <div className="flex justify-center gap-4">
              <Link href="/papers">
                <Button type="primary" size="large" icon={<FileTextOutlined />}>
                  Browse Papers
                </Button>
              </Link>
              <Link href="/research-assistant">
                <Button
                  size="large"
                  icon={<RobotOutlined />}
                  style={{ backgroundColor: "white", color: "#1e40af" }}
                >
                  Try AI Assistant
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-[85rem] px-4 py-10 sm:px-6 lg:px-8 lg:py-14 mx-auto">
        <Row gutter={[24, 24]}>
          {/* Feature Card 1 */}
          <Col xs={24} sm={24} lg={8}>
            <Card
              hoverable
              className="h-full"
              cover={
                <div className="h-52 flex flex-col justify-center items-center bg-blue-600 rounded-t-xl">
                  <FileTextOutlined
                    style={{ fontSize: "80px", color: "white" }}
                  />
                </div>
              }
            >
              <Card.Meta
                title={<Title level={4}>Find Research Papers</Title>}
                description={
                  <Paragraph>
                    Efficiently search through thousands of academic papers with
                    our advanced search technology to find exactly what you
                    need.
                  </Paragraph>
                }
              />
            </Card>
          </Col>

          {/* Feature Card 2 */}
          <Col xs={24} sm={24} lg={8}>
            <Card
              hoverable
              className="h-full"
              cover={
                <div className="h-52 flex flex-col justify-center items-center bg-blue-500 rounded-t-xl">
                  <RobotOutlined style={{ fontSize: "80px", color: "white" }} />
                </div>
              }
            >
              <Card.Meta
                title={<Title level={4}>Personalized AI Assistance</Title>}
                description={
                  <Paragraph>
                    Get customized explanations, summaries, and insights
                    tailored to your research interests and profile.
                  </Paragraph>
                }
              />
            </Card>
          </Col>

          {/* Feature Card 3 */}
          <Col xs={24} sm={24} lg={8}>
            <Card
              hoverable
              className="h-full"
              cover={
                <div className="h-52 flex flex-col justify-center items-center bg-blue-400 rounded-t-xl">
                  <ShareAltOutlined
                    style={{ fontSize: "80px", color: "white" }}
                  />
                </div>
              }
            >
              <Card.Meta
                title={<Title level={4}>Connected Research Network</Title>}
                description={
                  <Paragraph>
                    Discover the interconnections between papers, datasets,
                    conferences, and journals in our comprehensive research
                    network.
                  </Paragraph>
                }
              />
            </Card>
          </Col>
        </Row>
      </div>

      {/* Statistics Section */}
      <div className="max-w-[85rem] px-4 py-10 sm:px-6 lg:px-8 lg:py-14 mx-auto bg-gray-50">
        <div className="mx-auto max-w-2xl mb-10 text-center">
          <Title level={2}>Research Impact Statistics</Title>
          <Paragraph className="text-gray-600">
            Explore our growing research ecosystem
          </Paragraph>
        </div>

        <HomeStatistics />
      </div>

      {/* Call to Action Section */}
      <div className="max-w-[85rem] px-4 py-10 sm:px-6 lg:px-8 lg:py-14 mx-auto">
        <Card className="bg-gradient-to-r from-blue-600 to-blue-700 border-none">
          <div className="text-center">
            <Title level={2} style={{ color: "white" }}>
              Ready to Accelerate Your Research?
            </Title>
            <Paragraph
              style={{ color: "rgba(255, 255, 255, 0.9)", fontSize: "16px" }}
              className="mb-6"
            >
              Join thousands of researchers using our platform to discover and
              manage academic literature
            </Paragraph>
            <Space size="middle">
              <Link href="/signup">
                <Button type="primary" size="large" ghost>
                  Get Started Free
                </Button>
              </Link>
              <Link href="/dashboard">
                <Button
                  size="large"
                  style={{ backgroundColor: "white", color: "#1e40af" }}
                  icon={<ArrowRightOutlined />}
                >
                  Explore Dashboard
                </Button>
              </Link>
            </Space>
          </div>
        </Card>
      </div>

      {/* Footer */}
      <footer
        className="mt-auto w-full max-w-[85rem] py-10 px-4 sm:px-6 lg:px-8 mx-auto"
        style={{ backgroundColor: "#1e40af" }}
      >
        <div className="text-center">
          <div>
            <a
              className="flex-none text-xl font-semibold text-white"
              href="#"
              aria-label="Brand"
            >
              Research Assistant
            </a>
          </div>

          <div className="mt-3">
            <Paragraph
              style={{ color: "rgba(255, 255, 255, 0.8)", marginBottom: 0 }}
            >
              © Research Assistant. 2025. Made by The Center of Digital
              Transformation, HUST.
            </Paragraph>
          </div>
        </div>
      </footer>
    </main>
  );
}
