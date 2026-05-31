'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../contexts/AuthContext'
import Link from 'next/link'
import { Badge, Button, Dropdown, Spin, Typography } from 'antd'
import { BellOutlined } from '@ant-design/icons'
import {
  fetchRecommendedPapersFromApi,
  getRecommendedVenueLabel,
  type RecommendedPaperApiItem,
} from '@/utils/recommendations'

const { Text } = Typography

const DROPDOWN_WIDTH = 360
const LIST_MAX_HEIGHT = 320

export default function NotificationBell() {
  const { user } = useAuth()
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [recommendedPapers, setRecommendedPapers] = useState<
    RecommendedPaperApiItem[]
  >([])
  const [loading, setLoading] = useState(false)

  const fetchRecommendedPapers = async () => {
    if (!user) return

    setLoading(true)
    try {
      const papers = await fetchRecommendedPapersFromApi()
      setRecommendedPapers(papers.slice(0, 8))
    } catch (error) {
      console.error('Error fetching recommended papers:', error)
      setRecommendedPapers([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user) {
      fetchRecommendedPapers()
    }
  }, [user])

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open)
    if (open && user) {
      fetchRecommendedPapers()
    }
  }

  const handlePaperClick = (paperId: string) => {
    setIsOpen(false)
    router.push(`/papers/${paperId}`)
  }

  const newPapersCount = recommendedPapers.length

  const dropdownContent = (
    <div
      style={{
        width: DROPDOWN_WIDTH,
        backgroundColor: '#ffffff',
        borderRadius: 8,
        boxShadow:
          '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        border: '1px solid #e5e7eb',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          padding: '12px 16px',
          borderBottom: '1px solid #f0f0f0',
          fontWeight: 600,
          fontSize: '14px',
          color: '#111827',
          backgroundColor: '#ffffff',
        }}
      >
        Paper Recommendations
      </div>

      {loading ? (
        <div
          style={{
            padding: '32px 16px',
            textAlign: 'center',
            backgroundColor: '#ffffff',
          }}
        >
          <Spin size='default' />
        </div>
      ) : recommendedPapers.length > 0 ? (
        <>
          <div
            style={{
              maxHeight: LIST_MAX_HEIGHT,
              overflowY: 'auto',
              backgroundColor: '#ffffff',
            }}
          >
            {recommendedPapers.map((paper, index) => (
              <button
                key={paper.id}
                type='button'
                onClick={() => handlePaperClick(paper.id)}
                style={{
                  display: 'block',
                  width: '100%',
                  padding: '12px 16px',
                  textAlign: 'left',
                  border: 'none',
                  borderBottom:
                    index < recommendedPapers.length - 1
                      ? '1px solid #f3f4f6'
                      : 'none',
                  backgroundColor: '#ffffff',
                  cursor: 'pointer',
                  transition: 'background-color 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f9fafb'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#ffffff'
                }}
              >
                <Text
                  style={{
                    fontSize: '14px',
                    fontWeight: 500,
                    color: '#111827',
                    display: 'block',
                    marginBottom: '4px',
                    lineHeight: 1.4,
                  }}
                >
                  {paper.title}
                </Text>
                <Text
                  style={{
                    fontSize: '12px',
                    color: '#6b7280',
                  }}
                >
                  {getRecommendedVenueLabel(paper)}
                </Text>
              </button>
            ))}
          </div>
          <div
            style={{
              textAlign: 'center',
              padding: '12px 16px',
              borderTop: '1px solid #f0f0f0',
              backgroundColor: '#ffffff',
            }}
          >
            <Link
              href={`/my-library?section=interesting&t=${Date.now()}`}
              onClick={() => setIsOpen(false)}
              style={{
                color: '#1890ff',
                fontSize: '14px',
                fontWeight: 500,
                textDecoration: 'none',
              }}
            >
              View all in My Library
            </Link>
          </div>
        </>
      ) : (
        <div
          style={{
            padding: '24px 16px',
            textAlign: 'center',
            fontSize: '14px',
            color: '#6b7280',
            backgroundColor: '#ffffff',
          }}
        >
          No new paper recommendations found.
        </div>
      )}
    </div>
  )

  return (
    <Dropdown
      popupRender={() => dropdownContent}
      trigger={['click']}
      open={isOpen}
      onOpenChange={handleOpenChange}
      placement='bottomRight'
    >
      <Badge
        count={newPapersCount > 9 ? '9+' : newPapersCount}
        size='small'
        style={{
          backgroundColor: '#ff4d4f',
        }}
      >
        <Button
          type='text'
          icon={<BellOutlined />}
          style={{
            color: 'white',
            border: 'none',
            fontSize: '16px',
          }}
          aria-label='Notifications'
        />
      </Badge>
    </Dropdown>
  )
}
