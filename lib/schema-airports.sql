-- Schema pentru baza de date de aeroporturi
-- Stochează informații complete despre aeroporturi obținute din AeroDataBox

CREATE TABLE IF NOT EXISTS airports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    iata_code TEXT UNIQUE NOT NULL,
    icao_code TEXT,
    name TEXT NOT NULL,
    short_name TEXT,
    city TEXT,
    municipality_name TEXT,
    country_code TEXT,
    country_name TEXT,
    timezone TEXT,
    latitude REAL,
    longitude REAL,
    elevation_feet INTEGER,
    
    -- Metadata
    source TEXT DEFAULT 'aerodatabox',
    discovered_from_cache BOOLEAN DEFAULT 1,
    last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    -- Status tracking
    is_active BOOLEAN DEFAULT 1,
    has_flight_data BOOLEAN DEFAULT 0,
    last_flight_check DATETIME,
    
    -- Additional info
    website TEXT,
    phone TEXT,
    email TEXT,
    
    UNIQUE(iata_code)
);

-- Index pentru căutări rapide
CREATE INDEX IF NOT EXISTS idx_airports_iata ON airports(iata_code);
CREATE INDEX IF NOT EXISTS idx_airports_icao ON airports(icao_code);
CREATE INDEX IF NOT EXISTS idx_airports_country ON airports(country_code);
CREATE INDEX IF NOT EXISTS idx_airports_city ON airports(city);
CREATE INDEX IF NOT EXISTS idx_airports_active ON airports(is_active);

-- Tabel pentru tracking-ul actualizărilor
CREATE TABLE IF NOT EXISTS airport_updates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    iata_code TEXT NOT NULL,
    update_type TEXT NOT NULL, -- 'discovered', 'updated', 'verified'
    source TEXT NOT NULL,
    details TEXT, -- JSON cu detalii despre actualizare
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (iata_code) REFERENCES airports(iata_code)
);

CREATE INDEX IF NOT EXISTS idx_airport_updates_iata ON airport_updates(iata_code);
CREATE INDEX IF NOT EXISTS idx_airport_updates_type ON airport_updates(update_type);