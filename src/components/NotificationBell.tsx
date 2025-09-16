'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Link from 'next/link';
import { Badge, Button, Dropdown, List, Spin, Typography } from 'antd';
import { BellOutlined } from '@ant-design/icons';

const { Text } = Typography;

interface RecommendedPaper {
  id: string;
  title: string;
  authors: string[];
  keywords: string[];
  addedDate: string;
  venue_name?: string;
  conference?: string;
}

export default function NotificationBell() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [recommendedPapers, setRecommendedPapers] = useState<RecommendedPaper[]>([]);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownRef]);

  useEffect(() => {
    if (user) {
      fetchRecommendedPapers();
    }
  }, [user]);

  const fetchRecommendedPapers = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const token = localStorage.getItem('authToken');

      if (!token) {
        console.error('Authentication token not found');
        setLoading(false);
        return;
      }

      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const response = await fetch(`${API_URL}/api/my-library/?section=recommended`, {
        headers: {
          'Authorization': token.startsWith('Token ') ? token : `Token ${token}`
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Failed to fetch paper recommendations: ${response.status} - ${errorText}`);
        setLoading(false);
        return;
      }

      const papersData = await response.json();

      const filteredPapers = papersData.slice(0, 5);

      setRecommendedPapers(filteredPapers.map((paper: any) => ({
        id: paper.id,
        title: paper.title,
        authors: paper.authors || [],
        keywords: paper.keywords || [],
        addedDate: paper.created_at || paper.addedDate || new Date().toISOString(),
        venue_name: paper.venue_name || paper.venue || '',
        conference: paper.conference || ''
      })));
    } catch (error) {
      console.error('Error fetching recommended papers:', error);
    } finally {
      setLoading(false);
    }
  };

  const newPapersCount = recommendedPapers.length;

  const dropdownContent = (
    <div style={{ width: '288px' }}>
      <div style={{
        padding: '12px 16px',
        borderBottom: '1px solid #f0f0f0',
        fontWeight: 600,
        fontSize: '14px'
      }}>
        Paper Recommendations
      </div>

      {loading ? (
        <div style={{
          padding: '24px',
          textAlign: 'center'
        }}>
          <Spin size="default" />
        </div>
      ) : recommendedPapers.length > 0 ? (
        <div style={{ maxHeight: '384px', overflowY: 'auto' }}>
          <List
            dataSource={recommendedPapers}
            renderItem={(paper) => (
              <List.Item
                style={{
                  padding: '8px 16px',
                  borderBottom: '1px solid #f0f0f0',
                  cursor: 'pointer'
                }}
                onClick={() => setIsOpen(false)}
              >
                <Link
                  href={`/papers/${paper.id}`}
                  style={{
                    display: 'block',
                    width: '100%',
                    textDecoration: 'none',
                    color: 'inherit'
                  }}
                >
                  <div>
                    <Text
                      style={{
                        fontSize: '14px',
                        fontWeight: 500,
                        color: '#1f2937',
                        display: 'block',
                        marginBottom: '4px'
                      }}
                    >
                      {paper.title}
                    </Text>
                    <Text
                      style={{
                        fontSize: '12px',
                        color: '#6b7280'
                      }}
                    >
                      {paper.venue_name || paper.conference || "Unknown Venue"}
                    </Text>
                  </div>
                </Link>
              </List.Item>
            )}
          />
          <div style={{
            textAlign: 'center',
            padding: '12px 16px'
          }}>
            <Link
              href={`/my-library?section=recommended&t=${Date.now()}`}
              onClick={() => setIsOpen(false)}
              style={{
                color: '#1890ff',
                fontSize: '14px',
                fontWeight: 500,
                textDecoration: 'none'
              }}
            >
              View all recommendations
            </Link>
          </div>
        </div>
      ) : (
        <div style={{
          padding: '24px 16px',
          textAlign: 'center',
          fontSize: '14px',
          color: '#6b7280'
        }}>
          No new paper recommendations found.
        </div>
      )}
    </div>
  );

  return (
    <div ref={dropdownRef}>
      <Dropdown
        overlay={dropdownContent}
        trigger={['click']}
        open={isOpen}
        onOpenChange={setIsOpen}
        placement="bottomRight"
      >
        <Badge
          count={newPapersCount > 9 ? '9+' : newPapersCount}
          size="small"
          style={{
            backgroundColor: '#ff4d4f'
          }}
        >
          <Button
            type="text"
            icon={<BellOutlined />}
            style={{
              color: 'white',
              border: 'none',
              fontSize: '16px'
            }}
            aria-label="Notifications"
          />
        </Badge>
      </Dropdown>
    </div>
  );
} 