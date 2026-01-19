// OSRM (Open Source Routing Machine) Provider - via server-side API

import { Coordinates, DrivingProvider } from './types'

export class OSRMProvider implements DrivingProvider {
  getName(): string {
    return 'OSRM (Open Source Routing Machine)'
  }

  async getDrivingTime(from: Coordinates, to: Coordinates): Promise<{ durationSeconds: number; distanceMeters: number } | null> {
    try {
      // Use our server-side API to avoid CSP issues
      const params = new URLSearchParams({
        fromLat: from.lat.toString(),
        fromLng: from.lng.toString(),
        toLat: to.lat.toString(),
        toLng: to.lng.toString(),
      })

      const response = await fetch(`/api/proximity/driving?${params}`)

      if (!response.ok) {
        console.error(`[OSRM] API error: ${response.status}`)
        return null
      }

      const data = await response.json()

      if (!data.success || !data.data) {
        console.log(`[OSRM] No route found`)
        return null
      }

      return {
        durationSeconds: data.data.durationSeconds,
        distanceMeters: data.data.distanceMeters,
      }
    } catch (error) {
      console.error(`[OSRM] Error calculating route:`, error)
      return null
    }
  }
}

// Singleton instance
let osrmInstance: OSRMProvider | null = null

export function getOSRMProvider(): OSRMProvider {
  if (!osrmInstance) {
    osrmInstance = new OSRMProvider()
  }
  return osrmInstance
}
