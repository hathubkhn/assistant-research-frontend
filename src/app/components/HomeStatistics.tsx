'use client';

import { useEffect, useState } from 'react';
import { useTranslation } from '@/utils/useTranslation';
import { Row, Col, Card, Statistic, Alert } from 'antd';
import axios from 'axios';

const apiUrl = process.env.NEXT_PUBLIC_API_URL;

interface StatsData {
  totalPapers: number;
  totalUsers: number;
  totalDatasets: number;
  totalVenues: number;
}

async function fetchHomeStatistics(): Promise<StatsData> {
  try {
    const response = await axios.get(`${apiUrl}/api/stats/home/`, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    return response.data;
  } catch (error) {
    console.error('Failed to fetch home statistics:', error);
    throw new Error('Failed to load statistics. Please try again later.');
  }
}

export function HomeStatistics() {
  const { t } = useTranslation('home');
  const [stats, setStats] = useState<StatsData>({
    totalPapers: 0,
    totalUsers: 0,
    totalDatasets: 0,
    totalVenues: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadStats = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const data = await fetchHomeStatistics();
        setStats(data);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load statistics. Please try again later.';
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    loadStats();
  }, []);

  const formatNumber = (num: number): string => {
    if (num === 0 && isLoading) return '...';

    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}k+`;
    }
    return `${num}+`;
  };

  return (
    <>
      <Row gutter={[24, 24]} align="stretch">
        <Col xs={12} sm={12} lg={6}>
          <Card style={{
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center'
          }}>
            <Statistic
              title={t('statistics.papers')}
              value={formatNumber(stats.totalPapers)}
              valueStyle={{
                color: '#000',
                fontSize: '30px',
                fontWeight: 'bold',
                lineHeight: 1.2
              }}
              style={{
                textAlign: 'center',
                width: '100%'
              }}
            />
          </Card>
        </Col>

        <Col xs={12} sm={12} lg={6}>
          <Card style={{
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center'
          }}>
            <Statistic
              title={t('statistics.researchers')}
              value={formatNumber(stats.totalUsers)}
              valueStyle={{
                color: '#000',
                fontSize: '30px',
                fontWeight: 'bold',
                lineHeight: 1.2
              }}
              style={{
                textAlign: 'center',
                width: '100%'
              }}
            />
          </Card>
        </Col>

        <Col xs={12} sm={12} lg={6}>
          <Card style={{
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center'
          }}>
            <Statistic
              title={t('statistics.datasets')}
              value={formatNumber(stats.totalDatasets)}
              valueStyle={{
                color: '#000',
                fontSize: '30px',
                fontWeight: 'bold',
                lineHeight: 1.2
              }}
              style={{
                textAlign: 'center',
                width: '100%'
              }}
            />
          </Card>
        </Col>

        <Col xs={12} sm={12} lg={6}>
          <Card style={{
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center'
          }}>
            <Statistic
              title={t('statistics.venues')}
              value={formatNumber(stats.totalVenues)}
              valueStyle={{
                color: '#000',
                fontSize: '30px',
                fontWeight: 'bold',
                lineHeight: 1.2
              }}
              style={{
                textAlign: 'center',
                width: '100%'
              }}
            />
          </Card>
        </Col>
      </Row>

      {error && (
        <Alert
          message={error}
          type="error"
          showIcon
          style={{ marginTop: '16px' }}
        />
      )}
    </>
  );
} 