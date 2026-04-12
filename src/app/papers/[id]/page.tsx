'use client';

import { Space } from 'antd';
import { useParams } from 'next/navigation';
import PaperDetailsClient from './PaperDetailsClient';

export default function PaperDetailsPage() {
  const params = useParams();
  const paper_id = params.id as string;

  return (
    <Space direction='vertical' size='large' style={{ width: '100%' }}>
      <PaperDetailsClient paper_id={paper_id} />
    </Space>
  );
} 