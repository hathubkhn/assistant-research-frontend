'use client'

import { useEffect, useState } from 'react'
import { getDatasetThumbnailFallback } from '@/utils/datasetThumbnail'

type DatasetThumbnailVariant = 'list' | 'grid' | 'detail'

const HEIGHTS: Record<DatasetThumbnailVariant, number> = {
  list: 96,
  grid: 128,
  detail: 160,
}

interface DatasetThumbnailProps {
  src: string
  alt: string
  abbreviation?: string | null
  variant?: DatasetThumbnailVariant
  className?: string
}

export default function DatasetThumbnail({
  src,
  alt,
  abbreviation,
  variant = 'list',
  className = '',
}: DatasetThumbnailProps) {
  const [imgSrc, setImgSrc] = useState(src)

  useEffect(() => {
    setImgSrc(src)
  }, [src])

  const handleError = () => {
    const fallback = getDatasetThumbnailFallback(abbreviation || alt)
    if (fallback && imgSrc !== fallback) {
      setImgSrc(fallback)
    }
  }

  return (
    <div
      className={className}
      style={{
        width: '100%',
        height: HEIGHTS[variant],
        overflow: 'hidden',
        borderRadius: 8,
        backgroundColor: '#f5f5f5',
        flexShrink: 0,
      }}
    >
      <img
        src={imgSrc}
        alt={alt}
        onError={handleError}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          objectPosition: 'center',
          display: 'block',
        }}
      />
    </div>
  )
}
