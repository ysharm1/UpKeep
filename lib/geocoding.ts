/**
 * Geocoding service for converting addresses to coordinates
 * Uses OpenCage Geocoding API (free tier: 2,500 requests/day)
 */

export interface Coordinates {
  latitude: number
  longitude: number
}

export interface Address {
  street: string
  city: string
  state: string
  zipCode: string
}

const OPENCAGE_API_KEY = process.env.OPENCAGE_API_KEY

/**
 * Geocode an address to get latitude/longitude
 */
export async function geocodeAddress(address: Address): Promise<Coordinates | null> {
  try {
    // If no API key, return null (will skip geocoding)
    if (!OPENCAGE_API_KEY) {
      console.warn('⚠️ OPENCAGE_API_KEY not configured. Skipping geocoding.')
      return null
    }

    const query = `${address.street}, ${address.city}, ${address.state} ${address.zipCode}`
    const url = `https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(query)}&key=${OPENCAGE_API_KEY}&limit=1`

    const response = await fetch(url)
    const data = await response.json()

    if (data.results && data.results.length > 0) {
      const result = data.results[0]
      return {
        latitude: result.geometry.lat,
        longitude: result.geometry.lng,
      }
    }

    console.warn('⚠️ No geocoding results for address:', query)
    return null
  } catch (error) {
    console.error('❌ Geocoding error:', error)
    return null
  }
}

/**
 * Calculate distance between two coordinates using Haversine formula
 * Returns distance in miles
 */
export function calculateDistance(coord1: Coordinates, coord2: Coordinates): number {
  const R = 3959 // Earth's radius in miles
  const dLat = toRad(coord2.latitude - coord1.latitude)
  const dLon = toRad(coord2.longitude - coord1.longitude)

  const lat1 = toRad(coord1.latitude)
  const lat2 = toRad(coord2.latitude)

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  const distance = R * c

  return Math.round(distance * 10) / 10 // Round to 1 decimal place
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180)
}

/**
 * Format distance for display
 */
export function formatDistance(miles: number): string {
  if (miles < 1) {
    return '< 1 mile'
  }
  return `${miles} miles`
}
