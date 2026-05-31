export interface PaperVenue {
  id: string;
  name: string;
  abbreviation?: string | null;
  impactFactor?: number;
  rank?: string;
}

export type PaperVenueField = string | PaperVenue | null | undefined;

export function getPaperVenueLabel(
  venue?: PaperVenueField,
  fallback?: string,
): string {
  if (venue && typeof venue === 'object') {
    return venue.abbreviation || venue.name || fallback || 'No venue found.'
  }
  if (typeof venue === 'string' && venue.trim()) {
    return venue.trim()
  }
  if (fallback?.trim()) {
    return fallback.trim()
  }
  return 'No venue found.'
}

export function getPaperVenueRank(
  venue?: PaperVenueField,
  fallback?: string,
): string | undefined {
  if (venue && typeof venue === 'object' && venue.rank) {
    return venue.rank
  }
  return fallback || undefined
}
