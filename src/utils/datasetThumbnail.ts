interface DatasetThumbnailSource {
  thumbnailUrl?: string | null
}

export function getDatasetThumbnailSrc(dataset: DatasetThumbnailSource): string | null {
  const url = dataset.thumbnailUrl?.trim()
  return url || null
}

export function getDatasetThumbnailFallback(abbreviation?: string | null): string | undefined {
  if (!abbreviation) {
    return undefined
  }

  return `data:image/svg+xml;base64,${btoa(
    `<svg width="80" height="80" xmlns="http://www.w3.org/2000/svg"><rect width="80" height="80" fill="#f0f0f0"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" font-size="24" fill="#999">${abbreviation}</text></svg>`,
  )}`
}
