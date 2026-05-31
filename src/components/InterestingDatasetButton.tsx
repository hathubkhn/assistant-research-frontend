'use client'

import { getAuthHeaders } from '@/utils/auth'
import { StarFilled, StarOutlined } from '@ant-design/icons'
import { Card, Space, Spin } from 'antd'
import { useEffect, useState } from 'react'
import { toast } from 'react-hot-toast'

interface InterestingDatasetButtonProps {
  datasetId: string
  initialState?: boolean
  variant?: 'default' | 'icon'
  onToggle?: (isInteresting: boolean) => void
}

const InterestingDatasetButton = ({
  datasetId,
  initialState = false,
  variant = 'default',
  onToggle,
}: InterestingDatasetButtonProps) => {
  const [isInteresting, setIsInteresting] = useState(initialState)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    setIsInteresting(initialState)
  }, [datasetId, initialState])

  const updateState = (newState: boolean) => {
    setIsInteresting(newState)
    onToggle?.(newState)
  }

  const toggleInteresting = async () => {
    if (isLoading) return

    try {
      setIsLoading(true)

      const newState = !isInteresting

      if (
        typeof window !== 'undefined' &&
        !(
          localStorage.getItem('authToken') ||
          sessionStorage.getItem('authToken') ||
          localStorage.getItem('token') ||
          sessionStorage.getItem('token')
        )
      ) {
        throw new Error(
          'You must be logged in to mark datasets as interesting',
        )
      }

      const method = newState ? 'POST' : 'DELETE'
      const API_URL = process.env.NEXT_PUBLIC_API_URL || ''
      const endpoint = newState
        ? `/api/datasets/mark-interesting/${datasetId}/`
        : `/api/datasets/${datasetId}/unmark-interesting/`

      const response = await fetch(`${API_URL}${endpoint}`, {
        method,
        headers: getAuthHeaders(),
        credentials: 'include',
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        const errorMessage =
          errorData.message ||
          errorData.error ||
          'Failed to toggle interesting state'

        if (response.status === 401) {
          throw new Error('Authentication failed. Please log in again.')
        }

        throw new Error(errorMessage)
      }

      updateState(newState)

      if (typeof window !== 'undefined') {
        localStorage.setItem(`dataset-starred-${datasetId}`, String(newState))
      }

      toast.success(
        newState
          ? 'Dataset added to your interests'
          : 'Dataset removed from your interests',
      )
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'An error occurred'
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  if (variant === 'icon') {
    return (
      <button
        type='button'
        onClick={toggleInteresting}
        disabled={isLoading}
        aria-label={
          isInteresting ? 'Remove from interesting' : 'Mark as interesting'
        }
        style={{
          border: 'none',
          background: 'transparent',
          cursor: isLoading ? 'not-allowed' : 'pointer',
          padding: '4px',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {isLoading ? (
          <Spin size='small' />
        ) : isInteresting ? (
          <StarFilled style={{ color: '#FFC107', fontSize: '20px' }} />
        ) : (
          <StarOutlined style={{ color: '#8c8c8c', fontSize: '20px' }} />
        )}
      </button>
    )
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

export default InterestingDatasetButton
