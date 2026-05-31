'use client'

import { getAuthHeaders } from '@/utils/auth'
import { StarFilled, StarOutlined } from '@ant-design/icons'
import { Card, Space, Spin } from 'antd'
import axios from 'axios'
import { useEffect, useState } from 'react'
import { toast } from 'react-hot-toast'

interface InterestingButtonProps {
  paperId: string;
  initialState?: boolean;
  onToggle?: (isInteresting: boolean) => void;
}

const InterestingButton = ({
  paperId,
  initialState = false,
  onToggle,
}: InterestingButtonProps) => {
  const [isInteresting, setIsInteresting] = useState(initialState)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    setIsInteresting(initialState)
  }, [paperId, initialState, onToggle])

  const updateState = (newState: boolean) => {
    setIsInteresting(newState)
    onToggle?.(newState)
  }

  const toggleInteresting = async () => {
    if (isLoading) return

    try {
      setIsLoading(true)

      const newState = !isInteresting

      const hasToken =
        localStorage.getItem('authToken') ||
        sessionStorage.getItem('authToken') ||
        localStorage.getItem('token') ||
        sessionStorage.getItem('token')

      if (!hasToken) {
        throw new Error('You must be logged in to mark papers as interesting')
      }

      const API_URL = process.env.NEXT_PUBLIC_API_URL
      const method = newState ? 'POST' : 'DELETE'
      const endpoint = newState
        ? `/api/papers/mark-interesting/${paperId}/`
        : `/api/papers/${paperId}/unmark-interesting/`

      await axios({
        method,
        url: `${API_URL}${endpoint}`,
        headers: getAuthHeaders(true) as Record<string, string>,
        withCredentials: true,
      })

      updateState(newState)

      toast.success(
        newState
          ? 'Paper added to your interests'
          : 'Paper removed from your interests',
      )
    } catch (error) {
      const errorMessage = axios.isAxiosError(error)
        ? error.response?.status === 401
          ? 'Authentication failed. Please log in again.'
          : error.response?.data?.message ||
            error.response?.data?.error ||
            'Failed to toggle interesting state'
        : error instanceof Error
          ? error.message
          : 'An error occurred'

      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card
      hoverable
      onClick={toggleInteresting}
      style={{
        borderColor: isInteresting ? '#FFC107' : '#d9d9d9',
        backgroundColor: isInteresting ? '#fffbf0' : '#ffffff',
        cursor: isLoading ? 'not-allowed' : 'pointer',
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
        {isLoading ? (
          <Spin size='small' />
        ) : isInteresting ? (
          <StarFilled style={{ color: '#FFC107', fontSize: '16px' }} />
        ) : (
          <StarOutlined style={{ color: '#8c8c8c', fontSize: '16px' }} />
        )}
        <span
          style={{
            color: isInteresting ? '#FFC107' : '#8c8c8c',
            fontWeight: isInteresting ? 500 : 400,
            fontSize: '14px',
          }}
        >
          {isInteresting ? 'Interested' : 'Mark as Interesting'}
        </span>
      </Space>
    </Card>
  )
}

export default InterestingButton
