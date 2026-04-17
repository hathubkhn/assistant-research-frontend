'use client'

import Link from 'next/link'
import { HomeStatistics } from './components/HomeStatistics'
import { useTranslation } from '@/utils/useTranslation'
import { Row, Col, Card, Typography, Space, Button } from 'antd'
import { FileTextOutlined, RobotOutlined, CalendarOutlined, ExperimentOutlined, ArrowRightOutlined } from '@ant-design/icons'

const { Title, Paragraph } = Typography

export default function Home() {
  const { t } = useTranslation('home')

  return (
    <main style={{ minHeight: '100vh' }}>
      <Space
        direction='vertical'
        style={{
          background: 'linear-gradient(to bottom, #d9363e, #b91c1c)',
          padding: '96px 0',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Space
          direction='vertical'
          align='center'
          style={{
            width: '100%',
            margin: '0 auto',
            padding: '0 24px',
            textAlign: 'center',
          }}
        >
          <Title
            level={1}
            style={{
              color: 'white',
              fontSize: 'clamp(2.5rem, 5vw, 4.5rem)',
              fontWeight: 500,
              margin: 0,
            }}
          >
            {t('hero.title')}
          </Title>
          <Paragraph
            style={{
              color: 'rgba(255, 255, 255, 0.8)',
              fontSize: '18px',
              margin: 0,
              maxWidth: '768px',
            }}
          >
            {t('hero.subtitle')}
          </Paragraph>
        </Space>
      </Space>

      <Space
        direction='vertical'
        style={{
          margin: '0 auto',
          padding: '40px 24px 56px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          width: '75%',
        }}
      >
        <Row gutter={[24, 24]} style={{ width: '100%' }}>
          <Col xs={24} sm={12} lg={6}>
            <Card hoverable style={{ height: '100%', width: '100%' }} styles={{ body: { padding: 0 } }}>
              <div style={{
                height: '208px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#d9363e',
              }}>
                <FileTextOutlined style={{ fontSize: '112px', color: 'white' }} />
              </div>
              <div style={{ padding: '24px' }}>
                <Title level={4} style={{ margin: 0 }}>{t('features.papers.title')}</Title>
                <Paragraph style={{ color: '#6b7280', margin: '12px 0 0' }}>
                  {t('features.papers.description')}
                </Paragraph>
              </div>
            </Card>
          </Col>

          <Col xs={24} sm={12} lg={6}>
            <Card hoverable style={{ height: '100%', width: '100%' }} styles={{ body: { padding: 0 } }}>
              <div style={{
                height: '208px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#d9363e',
              }}>
                <RobotOutlined style={{ fontSize: '112px', color: 'white' }} />
              </div>
              <div style={{ padding: '24px' }}>
                <Title level={4} style={{ margin: 0 }}>{t('features.ai.title')}</Title>
                <Paragraph style={{ color: '#6b7280', margin: '12px 0 0' }}>
                  {t('features.ai.description')}
                </Paragraph>
              </div>
            </Card>
          </Col>

          <Col xs={24} sm={12} lg={6}>
            <Card hoverable style={{ height: '100%', width: '100%' }} styles={{ body: { padding: 0 } }}>
              <div style={{
                height: '208px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#d9363e',
              }}>
                <CalendarOutlined style={{ fontSize: '112px', color: 'white' }} />
              </div>
              <div style={{ padding: '24px' }}>
                <Title level={4} style={{ margin: 0 }}>{t('features.network.title')}</Title>
                <Paragraph style={{ color: '#6b7280', margin: '12px 0 0' }}>
                  {t('features.network.description')}
                </Paragraph>
              </div>
            </Card>
          </Col>

          <Col xs={24} sm={12} lg={6}>
            <Card hoverable style={{ height: '100%', width: '100%' }} styles={{ body: { padding: 0 } }}>
              <div style={{
                height: '208px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#d9363e',
              }}>
                <ExperimentOutlined style={{ fontSize: '112px', color: 'white' }} />
              </div>
              <div style={{ padding: '24px' }}>
                <Title level={4} style={{ margin: 0 }}>{t('features.scientist.title')}</Title>
                <Paragraph style={{ color: '#6b7280', margin: '12px 0 0' }}>
                  {t('features.scientist.description')}
                </Paragraph>
                <Link href='/ai-scientist'>
                  <Button
                    type='link'
                    style={{
                      color: '#d9363e',
                      padding: 0,
                      fontWeight: 600,
                      fontSize: '14px',
                    }}
                    icon={<ArrowRightOutlined />}
                    iconPosition='end'
                  >
                    {t('features.scientist.tryNow')}
                  </Button>
                </Link>
              </div>
            </Card>
          </Col>
        </Row>
      </Space>

      <Space style={{
        background: '#f9fafb',
        padding: '40px 24px 56px',
        marginTop: 'auto',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
      }}>
        <Space
          direction='vertical'
          align='center'
          style={{
            width: '100%',
            margin: '0 auto',
            alignItems: 'center',
          }}>
          <Space
            direction='vertical'
            align='center'
            style={{
              margin: '0 auto 40px',
              textAlign: 'center',
              width: '100%',
            }
            }>
            <Title level={2} style={{
              fontSize: 'clamp(1.875rem, 2.5vw, 3rem)',
              fontWeight: 700,
              color: '#1f2937',
              margin: 0,
            }}>
              {t('statistics.title')}
            </Title>
            <Paragraph style={{
              marginTop: '12px',
              color: '#4b5563',
              fontSize: '16px',
            }}>
              {t('statistics.subtitle')}
            </Paragraph>
          </Space>
          <HomeStatistics />
        </Space>
      </Space>

      <Card style={{
        backgroundColor: '#d9363e',
        padding: '40px 24px',
        width: '100%',
        border: 'none',
        borderRadius: 0,
      }}>
        <Space
          direction='vertical'
          align='center'
          style={{
            width: '100%',
            margin: '0 auto',
            textAlign: 'center',
          }}>
          <Space direction='vertical' size='small'>
            <Title level={3} style={{
              color: 'white',
              fontWeight: 600,
              margin: 0,
            }}>
              Research Assistant
            </Title>
            <Paragraph style={{
              color: 'rgba(255, 255, 255, 0.8)',
              margin: 0,
            }}>
              {t('footer.copyright')}
            </Paragraph>
          </Space>
        </Space>
      </Card>
    </main>
  )
}
