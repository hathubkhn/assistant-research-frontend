'use client';

import { useEffect, useState } from 'react';
import { useTranslation } from '@/utils/useTranslation';

interface StatsData {
    totalPapers: number;
    totalUsers: number;
    totalDatasets: number;
    totalVenues: number;
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
        const fetchStats = async () => {
            setIsLoading(true);
            setError(null);

            try {
                const response = await fetch('/api/stats/home', {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                    },
                });

                if (!response.ok) {
                    throw new Error(`Error fetching statistics: ${response.status}`);
                }

                const data = await response.json();
                setStats(data);
            } catch (err) {
                console.error('Failed to fetch home statistics:', err);
                setError('Failed to load statistics. Please try again later.');
                setStats({
                    totalPapers: 15200,
                    totalUsers: 3400,
                    totalDatasets: 1800,
                    totalVenues: 450
                });
            } finally {
                setIsLoading(false);
            }
        };

        fetchStats();
    }, []);

    const formatNumber = (num: number): string => {
        if (num === 0 && isLoading) return '...';

        if (num >= 1000) {
            return `${(num / 1000).toFixed(1)}k+`;
        }
        return `${num}+`;
    };

    return (
        <div className="grid gap-6 grid-cols-2 sm:grid-cols-2 lg:grid-cols-4">
            <div className="flex flex-col bg-white shadow-sm rounded-xl">
                <div className="p-4 md:p-5 flex justify-center items-center">
                    <div className="flex flex-col items-center">
                        <h3 className="text-3xl font-bold text-black">
                            {formatNumber(stats.totalPapers)}
                        </h3>
                        <p className="mt-1 text-xs sm:text-sm text-gray-600">{t('statistics.papers')}</p>
                    </div>
                </div>
            </div>

            <div className="flex flex-col bg-white shadow-sm rounded-xl">
                <div className="p-4 md:p-5 flex justify-center items-center">
                    <div className="flex flex-col items-center">
                        <h3 className="text-3xl font-bold text-black">
                            {formatNumber(stats.totalUsers)}
                        </h3>
                        <p className="mt-1 text-xs sm:text-sm text-gray-600">{t('statistics.researchers')}</p>
                    </div>
                </div>
            </div>

            <div className="flex flex-col bg-white shadow-sm rounded-xl">
                <div className="p-4 md:p-5 flex justify-center items-center">
                    <div className="flex flex-col items-center">
                        <h3 className="text-3xl font-bold text-black">
                            {formatNumber(stats.totalDatasets)}
                        </h3>
                        <p className="mt-1 text-xs sm:text-sm text-gray-600">{t('statistics.datasets')}</p>
                    </div>
                </div>
            </div>

            <div className="flex flex-col bg-white shadow-sm rounded-xl">
                <div className="p-4 md:p-5 flex justify-center items-center">
                    <div className="flex flex-col items-center">
                        <h3 className="text-3xl font-bold text-black">
                            {formatNumber(stats.totalVenues)}
                        </h3>
                        <p className="mt-1 text-xs sm:text-sm text-gray-600">{t('statistics.venues')}</p>
                    </div>
                </div>
            </div>

            {error && (
                <div className="col-span-4 text-center text-red-500 mt-4">
                    {error}
                </div>
            )}
        </div>
    );
} 