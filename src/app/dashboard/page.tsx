'use client';

import DashboardClient from './DashboardClient';
import { useTranslation } from '@/utils/useTranslation';

export default function DashboardPage() {
    const { t } = useTranslation('dashboard');

    return (
        <div className="container mx-auto py-8">
            <h1 className="text-3xl font-bold mb-8">{t('title')}</h1>
            <DashboardClient />
        </div>
    );
} 