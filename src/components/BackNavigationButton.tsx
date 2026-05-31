'use client'

import { ArrowLeftOutlined } from '@ant-design/icons'
import { Card, Space } from 'antd'
import { useRouter } from 'next/navigation'

interface BackNavigationButtonProps {
  href: string
  label: string
}

export default function BackNavigationButton({
  href,
  label,
}: BackNavigationButtonProps) {
  const router = useRouter()

  return (
    <Card
      hoverable
      onClick={() => router.push(href)}
      style={{
        cursor: 'pointer',
        backgroundColor: '#1890ff',
        borderColor: '#1890ff',
        height: '40px',
        width: 'fit-content',
        display: 'inline-block',
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
        <ArrowLeftOutlined style={{ color: '#ffffff', fontSize: '16px' }} />
        <span
          style={{
            color: '#ffffff',
            fontWeight: 500,
            fontSize: '14px',
          }}
        >
          {label}
        </span>
      </Space>
    </Card>
  )
}
