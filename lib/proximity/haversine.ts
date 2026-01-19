// Haversine formula for calculating distance between two coordinates

import { Coordinates } from './types'

const EARTH_RADIUS_KM = 6371

/**
 * Calculate the distance between two points on Earth using the Haversine formula
 * @param from Starting coordinates
 * @param to Ending coordinates
 * @returns Distance in kilometers
 */
export function calculateHaversineDistance(from: Coordinates, to: Coordinates): number {
  const dLat = toRadians(to.lat - from.lat)
  const dLng = toRadians(to.lng - from.lng)
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(from.lat)) * Math.cos(toRadians(to.lat)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2)
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  
  return EARTH_RADIUS_KM * c
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180)
}

/**
 * Format seconds into human-readable "X ore Y minute" format
 * @param seconds Total seconds
 * @returns Formatted string in Romanian
 */
export function formatDrivingTime(seconds: number): string {
  if (!seconds || seconds <= 0) return 'N/A'
  
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  
  if (hours === 0) {
    return `${minutes} ${minutes === 1 ? 'minut' : 'minute'}`
  }
  
  if (minutes === 0) {
    return `${hours} ${hours === 1 ? 'oră' : 'ore'}`
  }
  
  return `${hours} ${hours === 1 ? 'oră' : 'ore'} ${minutes} ${minutes === 1 ? 'minut' : 'minute'}`
}

/**
 * Format distance in kilometers
 * @param km Distance in kilometers
 * @returns Formatted string
 */
export function formatDistance(km: number): string {
  if (km < 1) {
    return `${Math.round(km * 1000)} m`
  }
  return `${Math.round(km)} km`
}
