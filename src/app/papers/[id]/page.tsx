'use client';

import { Suspense } from 'react';
import { useParams } from 'next/navigation';
import PaperDetailsClient from './PaperDetailsClient';

export default function PaperDetailsPage() {
    const params = useParams();
    const slug = params.id as string;

    return (
        <Suspense fallback={<div className="container mx-auto p-6">Loading...</div>}>
            <PaperDetailsClient slug={slug} />
        </Suspense>
    );
} 