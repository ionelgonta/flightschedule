-- Historical Flight Data System - Database Schema
-- SQLite database schema for persistent historical flight data storage

-- Main historical flights table
CREATE TABLE IF NOT EXISTS historical_flights (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  airport_iata TEXT NOT NULL,
  flight_number TEXT NOT NULL,
  airline_code TEXT NOT NULL,
  airline_name TEXT,
  origin_code TEXT NOT NULL,
  origin_name TEXT,
  destination_code TEXT NOT NULL,
  destination_name TEXT,
  scheduled_time DATETIME NOT NULL,
  actual_time DATETIME,
  estimated_time DATETIME,
  status TEXT NOT NULL,
  delay_minutes INTEGER DEFAULT 0,
  flight_type TEXT NOT NULL CHECK (flight_type IN ('arrival', 'departure')),
  request_date DATE NOT NULL,
  request_time TIME NOT NULL,
  data_source TEXT NOT NULL CHECK (data_source IN ('api', 'cache')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  -- Ensure uniqueness per airport, date, flight, and type
  UNIQUE(airport_iata, request_date, flight_number, scheduled_time, flight_type)
);

-- Indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_airport_date ON historical_flights(airport_iata, request_date);
CREATE INDEX IF NOT EXISTS idx_date_range ON historical_flights(request_date);
CREATE INDEX IF NOT EXISTS idx_airline ON historical_flights(airline_code);
CREATE INDEX IF NOT EXISTS idx_scheduled_time ON historical_flights(scheduled_time);
CREATE INDEX IF NOT EXISTS idx_status ON historical_flights(status);
CREATE INDEX IF NOT EXISTS idx_flight_type ON historical_flights(flight_type);
CREATE INDEX IF NOT EXISTS idx_data_source ON historical_flights(data_source);

-- Daily aggregated statistics (pre-computed for performance)
CREATE TABLE IF NOT EXISTS daily_statistics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  airport_iata TEXT NOT NULL,
  stat_date DATE NOT NULL,
  total_flights INTEGER NOT NULL,
  on_time_flights INTEGER NOT NULL,
  delayed_flights INTEGER NOT NULL,
  cancelled_flights INTEGER NOT NULL,
  average_delay_minutes REAL NOT NULL,
  on_time_percentage REAL NOT NULL,
  delay_index REAL NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(airport_iata, stat_date)
);

CREATE INDEX IF NOT EXISTS idx_airport_stat_date ON daily_statistics(airport_iata, stat_date);

-- Hourly traffic patterns
CREATE TABLE IF NOT EXISTS hourly_patterns (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  airport_iata TEXT NOT NULL,
  hour_of_day INTEGER NOT NULL CHECK (hour_of_day >= 0 AND hour_of_day <= 23),
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0=Monday, 6=Sunday
  avg_flights REAL NOT NULL,
  avg_delay_minutes REAL NOT NULL,
  sample_size INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(airport_iata, hour_of_day, day_of_week)
);

CREATE INDEX IF NOT EXISTS idx_airport_patterns ON hourly_patterns(airport_iata);

-- Airline performance metrics
CREATE TABLE IF NOT EXISTS airline_performance (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  airport_iata TEXT NOT NULL,
  airline_code TEXT NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  total_flights INTEGER NOT NULL,
  on_time_flights INTEGER NOT NULL,
  delayed_flights INTEGER NOT NULL,
  cancelled_flights INTEGER NOT NULL,
  average_delay_minutes REAL NOT NULL,
  on_time_percentage REAL NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_airline_perf ON airline_performance(airport_iata, airline_code, period_start);

-- Database metadata and migration tracking
CREATE TABLE IF NOT EXISTS schema_migrations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  version TEXT NOT NULL UNIQUE,
  applied_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  description TEXT
);

-- Insert initial migration record
INSERT OR IGNORE INTO schema_migrations (version, description) 
VALUES ('001_initial_schema', 'Initial historical flight data schema');