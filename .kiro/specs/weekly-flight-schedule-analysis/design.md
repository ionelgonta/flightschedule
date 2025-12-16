# Design Document - Weekly Flight Schedule Analysis

## Overview

Sistemul de analiză a programului săptămânal de zboruri va procesa datele existente din cache-ul local pentru a genera un tabel comprehensiv cu modelele de zbor pe zilele săptămânii. Sistemul va funcționa complet offline, folosind doar datele istorice din ultimele 3 luni stocate local, fără a face apeluri externe la AeroDataBox sau alte API-uri.

## Architecture

### High-Level Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Flight Cache  │    │  Airport Database│    │ Weekly Schedule │
│   (Local Data)  │───▶│   (16 Airports)  │───▶│     Table       │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                        │                        │
         ▼                        ▼                        ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│ Historical Data │    │ Schedule Generator│    │   Web Interface │
│  (3 months)     │───▶│    (Processor)   │───▶│  (Visualization)│
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

### Component Architecture

1. **Data Layer**: Flight Cache + Airport Database
2. **Processing Layer**: Schedule Generator + Route Analyzer
3. **Storage Layer**: Weekly Schedule Table + Export Manager
4. **Presentation Layer**: Web Interface + API Endpoints

## Components and Interfaces

### 1. WeeklyScheduleAnalyzer
**Responsabilitate**: Componenta principală care orchestrează analiza datelor

```typescript
interface WeeklyScheduleAnalyzer {
  analyzeFlightPatterns(): Promise<WeeklyScheduleData>
  updateScheduleTable(): Promise<void>
  exportSchedule(format: 'json' | 'csv'): Promise<string>
}
```

### 2. CacheDataExtractor
**Responsabilitate**: Extrage și procesează datele din cache-ul local

```typescript
interface CacheDataExtractor {
  getAllCachedFlights(): Promise<CachedFlightData[]>
  getFlightsByAirport(airportCode: string): Promise<CachedFlightData[]>
  getHistoricalData(months: number): Promise<CachedFlightData[]>
}
```

### 3. DayPatternGenerator
**Responsabilitate**: Convertește datele de zbor în modele săptămânale

```typescript
interface DayPatternGenerator {
  extractDayOfWeek(flightDate: string): DayOfWeek
  generateWeeklyPattern(flights: FlightData[]): WeeklyPattern
  aggregatePatterns(patterns: WeeklyPattern[]): AggregatedPattern
}
```

### 4. ScheduleTableManager
**Responsabilitate**: Gestionează tabelul cu programul săptămânal

```typescript
interface ScheduleTableManager {
  createTable(): Promise<void>
  updateTable(data: WeeklyScheduleData): Promise<void>
  getScheduleData(): Promise<WeeklyScheduleData>
  clearTable(): Promise<void>
}
```

## Data Models

### WeeklyScheduleData
```typescript
interface WeeklyScheduleData {
  airport: string
  destination: string
  airline: string
  flightNumber: string
  weeklyPattern: {
    monday: boolean
    tuesday: boolean
    wednesday: boolean
    thursday: boolean
    friday: boolean
    saturday: boolean
    sunday: boolean
  }
  frequency: number
  lastUpdated: string
  dataSource: 'cache' | 'historical'
}
```

### FlightPattern
```typescript
interface FlightPattern {
  route: {
    origin: string
    destination: string
  }
  schedule: {
    dayOfWeek: DayOfWeek
    scheduledTime: string
    airline: string
    flightNumber: string
  }[]
  statistics: {
    totalFlights: number
    averagePerWeek: number
    operatingDays: DayOfWeek[]
  }
}
```

### AggregatedSchedule
```typescript
interface AggregatedSchedule {
  routes: FlightPattern[]
  summary: {
    totalRoutes: number
    totalFlights: number
    airportsAnalyzed: string[]
    dataRange: {
      from: string
      to: string
    }
  }
  generatedAt: string
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Cache Data Completeness
*For any* airport in the Airport_Database, when the system processes flight data, all cached flights for that airport should be included in the analysis
**Validates: Requirements 1.1, 1.2**

### Property 2: Day Pattern Accuracy
*For any* flight with a scheduled date and time, the extracted day of week should correctly correspond to the actual day of that date
**Validates: Requirements 1.3**

### Property 3: Weekly Schedule Consistency
*For any* route between two airports, if flights exist on specific days in the cache data, those days should be accurately reflected in the Weekly_Schedule_Table
**Validates: Requirements 2.4**

### Property 4: No External API Calls
*For any* execution of the Schedule_Generator, no HTTP requests should be made to external APIs like AeroDataBox
**Validates: Requirements 5.1, 5.2, 5.3**

### Property 5: Historical Data Boundary
*For any* flight data processed, the flight date should be within the last 3 months from the current date
**Validates: Requirements 1.5, 3.5**

### Property 6: Table Structure Integrity
*For any* generated Weekly_Schedule_Table, it should contain exactly the required columns: airport, destination, and seven day columns
**Validates: Requirements 2.1, 2.2, 2.3**

### Property 7: Data Synchronization
*For any* update operation, if the Weekly_Schedule_Table exists, all data should be synchronized with the current Flight_Cache contents
**Validates: Requirements 3.4**

### Property 8: Export Format Validity
*For any* export operation, the generated JSON or CSV should be valid and parseable according to the respective format specifications
**Validates: Requirements 6.1, 6.2**

## Error Handling

### Data Availability Errors
- **Empty Cache**: Dacă cache-ul este gol, sistemul va afișa mesaj informativ
- **Incomplete Data**: Dacă datele pentru un aeroport lipsesc, se va nota în rezultate
- **Corrupted Cache**: Validarea datelor din cache înainte de procesare

### Processing Errors
- **Date Parsing Errors**: Gestionarea datelor invalide cu logging detaliat
- **Memory Constraints**: Procesarea în batch-uri pentru volume mari de date
- **Concurrent Access**: Locking pentru actualizările tabelului

### Export Errors
- **File System Errors**: Gestionarea erorilor de scriere pentru export
- **Format Errors**: Validarea datelor înainte de export
- **Permission Errors**: Verificarea permisiunilor pentru directoarele de export

## Testing Strategy

### Unit Testing
- **CacheDataExtractor**: Testarea extragerii datelor din cache-ul mock
- **DayPatternGenerator**: Testarea conversiei datelor în modele săptămânale
- **ScheduleTableManager**: Testarea operațiunilor CRUD pe tabel
- **Export Functions**: Testarea generării formatelor JSON și CSV

### Property-Based Testing
Sistemul va folosi **fast-check** pentru JavaScript/TypeScript pentru testarea proprietăților.

**Property Test 1: Cache Data Completeness**
```typescript
// **Feature: weekly-flight-schedule-analysis, Property 1: Cache Data Completeness**
fc.assert(fc.property(
  fc.array(mockFlightData()),
  fc.constantFrom(...AIRPORT_CODES),
  (flightData, airportCode) => {
    const analyzer = new WeeklyScheduleAnalyzer(flightData);
    const result = analyzer.analyzeFlightPatterns();
    const airportFlights = flightData.filter(f => f.airport === airportCode);
    return result.routes.every(route => 
      route.route.origin === airportCode || 
      airportFlights.some(f => f.destination === route.route.destination)
    );
  }
));
```

**Property Test 2: Day Pattern Accuracy**
```typescript
// **Feature: weekly-flight-schedule-analysis, Property 2: Day Pattern Accuracy**
fc.assert(fc.property(
  fc.date(),
  (flightDate) => {
    const generator = new DayPatternGenerator();
    const extractedDay = generator.extractDayOfWeek(flightDate.toISOString());
    const expectedDay = flightDate.getDay();
    return extractedDay === expectedDay;
  }
));
```

**Property Test 3: Weekly Schedule Consistency**
```typescript
// **Feature: weekly-flight-schedule-analysis, Property 3: Weekly Schedule Consistency**
fc.assert(fc.property(
  fc.array(mockFlightDataWithDates()),
  (flightData) => {
    const analyzer = new WeeklyScheduleAnalyzer(flightData);
    const schedule = analyzer.analyzeFlightPatterns();
    
    return flightData.every(flight => {
      const route = schedule.routes.find(r => 
        r.route.origin === flight.origin && 
        r.route.destination === flight.destination
      );
      if (!route) return false;
      
      const flightDay = new Date(flight.scheduledTime).getDay();
      const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      return route.schedule.some(s => s.dayOfWeek === dayNames[flightDay]);
    });
  }
));
```

**Property Test 4: No External API Calls**
```typescript
// **Feature: weekly-flight-schedule-analysis, Property 4: No External API Calls**
fc.assert(fc.property(
  fc.array(mockCacheData()),
  (cacheData) => {
    const networkSpy = jest.spyOn(global, 'fetch');
    const analyzer = new WeeklyScheduleAnalyzer(cacheData);
    analyzer.analyzeFlightPatterns();
    
    return networkSpy.mock.calls.length === 0;
  }
));
```

**Property Test 5: Historical Data Boundary**
```typescript
// **Feature: weekly-flight-schedule-analysis, Property 5: Historical Data Boundary**
fc.assert(fc.property(
  fc.array(mockFlightDataWithRandomDates()),
  (flightData) => {
    const analyzer = new WeeklyScheduleAnalyzer(flightData);
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    
    const processedData = analyzer.getHistoricalData(3);
    return processedData.every(flight => 
      new Date(flight.scheduledTime) >= threeMonthsAgo
    );
  }
));
```

**Property Test 6: Table Structure Integrity**
```typescript
// **Feature: weekly-flight-schedule-analysis, Property 6: Table Structure Integrity**
fc.assert(fc.property(
  fc.array(mockFlightData()),
  (flightData) => {
    const manager = new ScheduleTableManager();
    const table = manager.generateTable(flightData);
    
    const requiredColumns = ['airport', 'destination', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    return requiredColumns.every(col => table.columns.includes(col));
  }
));
```

**Property Test 7: Data Synchronization**
```typescript
// **Feature: weekly-flight-schedule-analysis, Property 7: Data Synchronization**
fc.assert(fc.property(
  fc.array(mockFlightData()),
  fc.array(mockFlightData()),
  (initialData, updatedData) => {
    const manager = new ScheduleTableManager();
    manager.createTable(initialData);
    manager.updateTable(updatedData);
    
    const finalTable = manager.getScheduleData();
    return updatedData.every(flight => 
      finalTable.some(row => 
        row.airport === flight.origin && 
        row.destination === flight.destination
      )
    );
  }
));
```

**Property Test 8: Export Format Validity**
```typescript
// **Feature: weekly-flight-schedule-analysis, Property 8: Export Format Validity**
fc.assert(fc.property(
  fc.array(mockScheduleData()),
  (scheduleData) => {
    const analyzer = new WeeklyScheduleAnalyzer(scheduleData);
    
    const jsonExport = analyzer.exportSchedule('json');
    const csvExport = analyzer.exportSchedule('csv');
    
    const isValidJson = () => {
      try { JSON.parse(jsonExport); return true; } 
      catch { return false; }
    };
    
    const isValidCsv = () => csvExport.includes(',') && csvExport.includes('\n');
    
    return isValidJson() && isValidCsv();
  }
));
```

### Integration Testing
- **End-to-End Workflow**: Testarea completă de la cache la export
- **Database Integration**: Testarea cu date reale din cache
- **Web Interface**: Testarea interfaței cu date generate

### Performance Testing
- **Large Dataset Processing**: Testarea cu 3 luni de date pentru toate aeroporturile
- **Memory Usage**: Monitorizarea consumului de memorie
- **Export Performance**: Testarea vitezei de export pentru volume mari