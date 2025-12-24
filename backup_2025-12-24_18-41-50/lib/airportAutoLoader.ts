/**
 * Airport Auto Loader - Sistem automat pentru încărcarea aeroporturilor noi
 * Detectează coduri IATA noi în datele de zboruri și le adaugă automat în baza de date
 */

import AirportDatabaseService from './airportDatabase'

class AirportAutoLoader {
  private static instance: AirportAutoLoader
  private processingQueue: Set<string> = new Set()
  private lastProcessTime: number = 0
  private readonly PROCESS_INTERVAL = 5 * 60 * 1000 // 5 minute

  private constructor() {}

  static getInstance(): AirportAutoLoader {
    if (!AirportAutoLoader.instance) {
      AirportAutoLoader.instance = new AirportAutoLoader()
    }
    return AirportAutoLoader.instance
  }

  /**
   * Detectează și procesează coduri IATA noi din datele de zboruri
   */
  async processFlightData(flights: any[]): Promise<void> {
    if (!flights || flights.length === 0) return

    const now = Date.now()
    if (now - this.lastProcessTime < this.PROCESS_INTERVAL) {
      return // Nu procesează prea des
    }

    const newCodes = this.extractIataCodes(flights)
    if (newCodes.length === 0) return

    console.log(`[Airport Auto Loader] Found ${newCodes.length} potential new IATA codes:`, newCodes)

    // Procesează în background
    this.processCodesInBackground(newCodes)
    this.lastProcessTime = now
  }

  /**
   * Extrage codurile IATA din datele de zboruri
   */
  private extractIataCodes(flights: any[]): string[] {
    const codes = new Set<string>()

    flights.forEach(flight => {
      // Extrage din origin
      if (flight.origin?.code && this.isValidIataCode(flight.origin.code)) {
        codes.add(flight.origin.code.toUpperCase())
      }

      // Extrage din destination
      if (flight.destination?.code && this.isValidIataCode(flight.destination.code)) {
        codes.add(flight.destination.code.toUpperCase())
      }

      // Extrage din departure/arrival (format alternativ)
      if (flight.departure?.iata && this.isValidIataCode(flight.departure.iata)) {
        codes.add(flight.departure.iata.toUpperCase())
      }

      if (flight.arrival?.iata && this.isValidIataCode(flight.arrival.iata)) {
        codes.add(flight.arrival.iata.toUpperCase())
      }
    })

    return Array.from(codes)
  }

  /**
   * Verifică dacă un cod este un IATA code valid
   */
  private isValidIataCode(code: string): boolean {
    return typeof code === 'string' && 
           code.length === 3 && 
           /^[A-Z]{3}$/.test(code.toUpperCase())
  }

  /**
   * Procesează codurile în background
   */
  private async processCodesInBackground(codes: string[]): Promise<void> {
    try {
      const airportDb = new AirportDatabaseService()

      for (const code of codes) {
        if (this.processingQueue.has(code)) {
          continue // Deja în procesare
        }

        // Verifică dacă există deja în baza de date
        const existing = airportDb.getAirport(code)
        if (existing) {
          continue // Există deja
        }

        this.processingQueue.add(code)

        try {
          console.log(`[Airport Auto Loader] Fetching new airport: ${code}`)
          
          const airportInfo = await airportDb.fetchAirportFromAeroDataBox(code)
          if (airportInfo) {
            const saved = await airportDb.saveAirport(airportInfo)
            if (saved) {
              console.log(`[Airport Auto Loader] ✅ Successfully added ${code}: ${airportInfo.name} (${airportInfo.city})`)
            } else {
              console.warn(`[Airport Auto Loader] ❌ Failed to save ${code}`)
            }
          } else {
            console.warn(`[Airport Auto Loader] ❌ No data found for ${code}`)
          }

          // Rate limiting
          await new Promise(resolve => setTimeout(resolve, 1000))

        } catch (error) {
          console.error(`[Airport Auto Loader] Error processing ${code}:`, error)
        } finally {
          this.processingQueue.delete(code)
        }
      }

      airportDb.close()
    } catch (error) {
      console.error('[Airport Auto Loader] Error in background processing:', error)
    }
  }

  /**
   * Forțează procesarea unui cod IATA specific
   */
  async forceProcessCode(code: string): Promise<boolean> {
    if (!this.isValidIataCode(code)) {
      return false
    }

    const upperCode = code.toUpperCase()
    
    try {
      const airportDb = new AirportDatabaseService()
      
      // Verifică dacă există deja
      const existing = airportDb.getAirport(upperCode)
      if (existing) {
        airportDb.close()
        return true
      }

      // Încearcă să îl obțină de la AeroDataBox
      const airportInfo = await airportDb.fetchAirportFromAeroDataBox(upperCode)
      if (airportInfo) {
        const saved = await airportDb.saveAirport(airportInfo)
        airportDb.close()
        
        if (saved) {
          console.log(`[Airport Auto Loader] Force processed ${upperCode}: ${airportInfo.name}`)
          return true
        }
      }

      airportDb.close()
      return false
    } catch (error) {
      console.error(`[Airport Auto Loader] Error force processing ${upperCode}:`, error)
      return false
    }
  }

  /**
   * Obține statistici despre procesare
   */
  getStats(): { queueSize: number; lastProcessTime: number } {
    return {
      queueSize: this.processingQueue.size,
      lastProcessTime: this.lastProcessTime
    }
  }
}

export default AirportAutoLoader