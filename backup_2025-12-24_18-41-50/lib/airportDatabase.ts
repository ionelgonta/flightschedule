/**
 * Airport Database Service - Managementul bazei de date de aeroporturi
 * Stochează și gestionează informații complete despre aeroporturi
 */

import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import AeroDataBoxService, { Airport as AeroDataBoxAirport } from './aerodataboxService';

export interface AirportRecord {
  id?: number;
  iata_code: string;
  icao_code?: string;
  name: string;
  short_name?: string;
  city?: string;
  municipality_name?: string;
  country_code?: string;
  country_name?: string;
  timezone?: string;
  latitude?: number;
  longitude?: number;
  elevation_feet?: number;
  source: string;
  discovered_from_cache: boolean;
  last_updated: string;
  created_at: string;
  is_active: boolean;
  has_flight_data: boolean;
  last_flight_check?: string;
  website?: string;
  phone?: string;
  email?: string;
}

export interface AirportUpdateRecord {
  id?: number;
  iata_code: string;
  update_type: 'discovered' | 'updated' | 'verified';
  source: string;
  details?: string;
  created_at: string;
}

class AirportDatabaseService {
  private db: Database.Database;
  private aeroDataBoxService: AeroDataBoxService;

  constructor(dbPath?: string) {
    const defaultPath = path.join(process.cwd(), 'data', 'airports.db');
    this.db = new Database(dbPath || defaultPath);
    
    // Initialize AeroDataBox service
    this.aeroDataBoxService = new AeroDataBoxService({
      apiKey: process.env.AERODATABOX_API_KEY || '',
      baseUrl: 'https://prod.api.market/api/v1/aedbx/aerodatabox',
      rateLimit: 100
    });

    this.initializeDatabase();
  }

  private initializeDatabase(): void {
    try {
      // Read and execute schema
      const schemaPath = path.join(process.cwd(), 'lib', 'schema-airports.sql');
      const schema = fs.readFileSync(schemaPath, 'utf8');
      
      // Execute schema statements
      const statements = schema.split(';').filter(stmt => stmt.trim());
      for (const statement of statements) {
        if (statement.trim()) {
          this.db.exec(statement);
        }
      }
      
      console.log('[Airport DB] Database initialized successfully');
    } catch (error) {
      console.error('[Airport DB] Failed to initialize database:', error);
      throw error;
    }
  }

  /**
   * Extrage toate codurile IATA unice din cache
   */
  async extractIataCodesFromCache(): Promise<string[]> {
    try {
      const cachePath = path.join(process.cwd(), 'data', 'cache-data.json');
      
      if (!fs.existsSync(cachePath)) {
        console.warn('[Airport DB] Cache file not found');
        return [];
      }

      const cacheData = JSON.parse(fs.readFileSync(cachePath, 'utf8'));
      const iataCodes = new Set<string>();

      // Extrage coduri IATA din chei de cache (format: IATA_type)
      Object.keys(cacheData).forEach(key => {
        if (key.includes('_arrivals') || key.includes('_departures')) {
          const iataCode = key.split('_')[0];
          if (iataCode && iataCode.length === 3) {
            iataCodes.add(iataCode);
          }
        }
      });

      // Extrage coduri IATA din datele de zboruri
      Object.values(cacheData).forEach((entry: any) => {
        if (entry.data && Array.isArray(entry.data)) {
          entry.data.forEach((flight: any) => {
            // Extrage din origin și destination
            if (flight.origin?.code) {
              iataCodes.add(flight.origin.code);
            }
            if (flight.destination?.code) {
              iataCodes.add(flight.destination.code);
            }
          });
        }
      });

      const uniqueCodes = Array.from(iataCodes).filter(code => 
        code.length === 3 && /^[A-Z]{3}$/.test(code)
      );

      console.log(`[Airport DB] Extracted ${uniqueCodes.length} unique IATA codes from cache`);
      return uniqueCodes.sort();
    } catch (error) {
      console.error('[Airport DB] Failed to extract IATA codes from cache:', error);
      return [];
    }
  }

  /**
   * Obține informații despre un aeroport din AeroDataBox
   */
  async fetchAirportFromAeroDataBox(iataCode: string): Promise<AirportRecord | null> {
    try {
      console.log(`[Airport DB] Fetching airport info for ${iataCode} from AeroDataBox...`);
      
      const airportInfo = await this.aeroDataBoxService.getAirportInfo(iataCode);
      
      if (!airportInfo) {
        console.warn(`[Airport DB] No airport info found for ${iataCode}`);
        return null;
      }

      // Convert AeroDataBox format to our database format
      const airportRecord: AirportRecord = {
        iata_code: iataCode,
        icao_code: airportInfo.icao || undefined,
        name: airportInfo.name || `Airport ${iataCode}`,
        short_name: airportInfo.shortName || undefined,
        city: airportInfo.municipalityName || undefined,
        municipality_name: airportInfo.municipalityName || undefined,
        country_code: airportInfo.countryCode || undefined,
        country_name: undefined, // Will be populated separately if needed
        timezone: airportInfo.timeZone || undefined,
        latitude: airportInfo.location?.lat || undefined,
        longitude: airportInfo.location?.lon || undefined,
        elevation_feet: undefined, // Not provided by AeroDataBox in basic info
        source: 'aerodatabox',
        discovered_from_cache: true,
        last_updated: new Date().toISOString(),
        created_at: new Date().toISOString(),
        is_active: true,
        has_flight_data: false, // Will be updated when we check for flights
        last_flight_check: undefined
      };

      console.log(`[Airport DB] Successfully fetched info for ${iataCode}: ${airportRecord.name}`);
      return airportRecord;
    } catch (error) {
      console.error(`[Airport DB] Failed to fetch airport info for ${iataCode}:`, error);
      return null;
    }
  }

  /**
   * Salvează un aeroport în baza de date
   */
  async saveAirport(airport: AirportRecord): Promise<boolean> {
    try {
      const stmt = this.db.prepare(`
        INSERT OR REPLACE INTO airports (
          iata_code, icao_code, name, short_name, city, municipality_name,
          country_code, country_name, timezone, latitude, longitude, elevation_feet,
          source, discovered_from_cache, last_updated, created_at,
          is_active, has_flight_data, last_flight_check,
          website, phone, email
        ) VALUES (
          ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?,
          ?, ?, ?,
          ?, ?, ?
        )
      `);

      stmt.run(
        airport.iata_code,
        airport.icao_code,
        airport.name,
        airport.short_name,
        airport.city,
        airport.municipality_name,
        airport.country_code,
        airport.country_name,
        airport.timezone,
        airport.latitude,
        airport.longitude,
        airport.elevation_feet,
        airport.source,
        airport.discovered_from_cache ? 1 : 0,
        airport.last_updated,
        airport.created_at,
        airport.is_active ? 1 : 0,
        airport.has_flight_data ? 1 : 0,
        airport.last_flight_check,
        airport.website,
        airport.phone,
        airport.email
      );

      // Log the update
      await this.logAirportUpdate(airport.iata_code, 'updated', 'aerodatabox', {
        name: airport.name,
        city: airport.city,
        country: airport.country_code
      });

      console.log(`[Airport DB] Saved airport ${airport.iata_code}: ${airport.name}`);
      return true;
    } catch (error) {
      console.error(`[Airport DB] Failed to save airport ${airport.iata_code}:`, error);
      return false;
    }
  }

  /**
   * Obține un aeroport din baza de date
   */
  getAirport(iataCode: string): AirportRecord | null {
    try {
      const stmt = this.db.prepare('SELECT * FROM airports WHERE iata_code = ?');
      const result = stmt.get(iataCode) as AirportRecord | undefined;
      
      if (result) {
        // Convert boolean fields
        result.discovered_from_cache = Boolean(result.discovered_from_cache);
        result.is_active = Boolean(result.is_active);
        result.has_flight_data = Boolean(result.has_flight_data);
      }
      
      return result || null;
    } catch (error) {
      console.error(`[Airport DB] Failed to get airport ${iataCode}:`, error);
      return null;
    }
  }

  /**
   * Obține toate aeroporturile din baza de date
   */
  getAllAirports(): AirportRecord[] {
    try {
      const stmt = this.db.prepare('SELECT * FROM airports ORDER BY iata_code');
      const results = stmt.all() as AirportRecord[];
      
      // Convert boolean fields
      return results.map(result => ({
        ...result,
        discovered_from_cache: Boolean(result.discovered_from_cache),
        is_active: Boolean(result.is_active),
        has_flight_data: Boolean(result.has_flight_data)
      }));
    } catch (error) {
      console.error('[Airport DB] Failed to get all airports:', error);
      return [];
    }
  }

  /**
   * Caută aeroporturi după diverse criterii
   */
  searchAirports(query: string): AirportRecord[] {
    try {
      const stmt = this.db.prepare(`
        SELECT * FROM airports 
        WHERE iata_code LIKE ? 
           OR icao_code LIKE ? 
           OR name LIKE ? 
           OR city LIKE ?
           OR country_code LIKE ?
        ORDER BY iata_code
      `);
      
      const searchTerm = `%${query}%`;
      const results = stmt.all(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm) as AirportRecord[];
      
      return results.map(result => ({
        ...result,
        discovered_from_cache: Boolean(result.discovered_from_cache),
        is_active: Boolean(result.is_active),
        has_flight_data: Boolean(result.has_flight_data)
      }));
    } catch (error) {
      console.error(`[Airport DB] Failed to search airports with query "${query}":`, error);
      return [];
    }
  }

  /**
   * Înregistrează o actualizare pentru un aeroport
   */
  async logAirportUpdate(
    iataCode: string, 
    updateType: 'discovered' | 'updated' | 'verified',
    source: string,
    details?: any
  ): Promise<void> {
    try {
      const stmt = this.db.prepare(`
        INSERT INTO airport_updates (iata_code, update_type, source, details, created_at)
        VALUES (?, ?, ?, ?, ?)
      `);

      stmt.run(
        iataCode,
        updateType,
        source,
        details ? JSON.stringify(details) : null,
        new Date().toISOString()
      );
    } catch (error) {
      console.error(`[Airport DB] Failed to log update for ${iataCode}:`, error);
    }
  }

  /**
   * Procesează toate codurile IATA din cache și le salvează în baza de date
   */
  async processAllCacheAirports(): Promise<{
    processed: number;
    successful: number;
    failed: number;
    skipped: number;
    errors: string[];
  }> {
    console.log('[Airport DB] Starting to process all airports from cache...');
    
    const iataCodes = await this.extractIataCodesFromCache();
    const results = {
      processed: 0,
      successful: 0,
      failed: 0,
      skipped: 0,
      errors: [] as string[]
    };

    for (const iataCode of iataCodes) {
      results.processed++;
      
      try {
        // Check if airport already exists
        const existing = this.getAirport(iataCode);
        if (existing) {
          console.log(`[Airport DB] Airport ${iataCode} already exists, skipping...`);
          results.skipped++;
          continue;
        }

        // Fetch from AeroDataBox
        const airportInfo = await this.fetchAirportFromAeroDataBox(iataCode);
        
        if (!airportInfo) {
          console.warn(`[Airport DB] Could not fetch info for ${iataCode}`);
          results.failed++;
          results.errors.push(`Failed to fetch info for ${iataCode}`);
          continue;
        }

        // Save to database
        const saved = await this.saveAirport(airportInfo);
        
        if (saved) {
          results.successful++;
          console.log(`[Airport DB] Successfully processed ${iataCode}`);
        } else {
          results.failed++;
          results.errors.push(`Failed to save ${iataCode} to database`);
        }

        // Rate limiting - wait between requests
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        results.failed++;
        const errorMsg = `Error processing ${iataCode}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        results.errors.push(errorMsg);
        console.error(`[Airport DB] ${errorMsg}`);
      }
    }

    console.log('[Airport DB] Processing complete:', results);
    return results;
  }

  /**
   * Obține statistici despre baza de date
   */
  getStats(): {
    totalAirports: number;
    activeAirports: number;
    airportsWithFlightData: number;
    countriesCount: number;
    lastUpdated: string | null;
  } {
    try {
      const totalStmt = this.db.prepare('SELECT COUNT(*) as count FROM airports');
      const activeStmt = this.db.prepare('SELECT COUNT(*) as count FROM airports WHERE is_active = 1');
      const flightDataStmt = this.db.prepare('SELECT COUNT(*) as count FROM airports WHERE has_flight_data = 1');
      const countriesStmt = this.db.prepare('SELECT COUNT(DISTINCT country_code) as count FROM airports WHERE country_code IS NOT NULL');
      const lastUpdatedStmt = this.db.prepare('SELECT MAX(last_updated) as last_updated FROM airports');

      const total = totalStmt.get() as { count: number };
      const active = activeStmt.get() as { count: number };
      const flightData = flightDataStmt.get() as { count: number };
      const countries = countriesStmt.get() as { count: number };
      const lastUpdated = lastUpdatedStmt.get() as { last_updated: string | null };

      return {
        totalAirports: total.count,
        activeAirports: active.count,
        airportsWithFlightData: flightData.count,
        countriesCount: countries.count,
        lastUpdated: lastUpdated.last_updated
      };
    } catch (error) {
      console.error('[Airport DB] Failed to get stats:', error);
      return {
        totalAirports: 0,
        activeAirports: 0,
        airportsWithFlightData: 0,
        countriesCount: 0,
        lastUpdated: null
      };
    }
  }

  /**
   * Închide conexiunea la baza de date
   */
  close(): void {
    this.db.close();
  }
}

export default AirportDatabaseService;