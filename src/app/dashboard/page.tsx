'use client'

import { Layout } from 'antd'
import DashboardClient from './DashboardClient'
import { useTranslation } from '@/utils/useTranslation'

export default function DashboardPage() {
    const { t } = useTranslation('dashboard')

    return (
        <Layout style={{ minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
            <div style={{ maxWidth: '1280px', width: '100%', margin: '0 auto', padding: '20px 16px' }}>
                <h1 className='text-3xl font-bold mb-8'>{t('title')}</h1>
                <DashboardClient />
            </div>
        </Layout>
    )
}
