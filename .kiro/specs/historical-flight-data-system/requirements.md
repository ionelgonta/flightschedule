# Requirements Document

## Introduction

Sistem complet de colectare, stocare și analiză istorică a datelor de zboruri care extinde aplicația existentă pentru a acumula date zilnice, a le stoca persistent și a genera statistici avansate pe baza istoricului acumulat. Sistemul va transforma aplicația într-un instrument puternic de analiză a tendințelor și modelelor de zbor pe termen lung.

## Glossary

- **Daily_Snapshot**: Snapshot complet al răspunsului API pentru o zi specifică
- **Historical_Cache**: Cache persistent care nu expiră, păstrând toate datele istorice
- **Flight_Statistics_Service**: Serviciu dedicat pentru agregarea și analiza datelor istorice
- **Trend_Analysis**: Analiza tendințelor pe mai multe zile/săptămâni/luni
- **Request_Metadata**: Informații despre request (dată, oră, sursă, aeroport)
- **Cache_Hit**: Situația când datele sunt servite din cache în loc de API
- **Redundant_Request**: Request care ar duplica date existente pentru aceeași zi
- **Time_Interval**: Intervale orare pentru analiză (dimineață, prânz, seară, noapte)
- **Delay_Trend**: Tendința întârzierilor pe perioade de timp
- **Traffic_Pattern**: Modelul de trafic aerian pe zile/ore/companii

## Requirements

### Requirement 1

**User Story:** Ca administrator al sistemului, vreau să colectez automat un snapshot complet al datelor de zboruri la fiecare request API, astfel încât să construiesc o bază de date istorică comprehensivă.

#### Acceptance Criteria

1. WHEN un request este făcut către API-ul de zboruri, THE system SHALL salveze un snapshot complet al răspunsului
2. WHEN snapshot-ul este salvat, THE system SHALL atașeze Request_Metadata cu request_date, request_time, airport_iata, type și source
3. THE system SHALL păstra fiecare zi ca o intrare separată în Historical_Cache
4. THE system SHALL evita suprascrierea datelor existente pentru aceeași zi
5. THE system SHALL stoca datele în format structurat pentru analiză ulterioară

### Requirement 2

**User Story:** Ca dezvoltator, vreau un sistem de cache persistent care păstrează toate datele istorice, astfel încât să pot face analize pe termen lung fără să pierd informații valoroase.

#### Acceptance Criteria

1. THE system SHALL implementeze Historical_Cache folosind SQLite pentru persistență optimă
2. THE Historical_Cache SHALL conține câmpurile: id, airport_iata, flight_number, airline, scheduled_time, actual_time, status, delay_minutes, request_date
3. THE system SHALL păstra datele indefinit fără expirare automată
4. THE system SHALL indexa datele pentru căutări rapide după dată și aeroport
5. THE system SHALL asigura integritatea datelor prin validări și constrainte

### Requirement 3

**User Story:** Ca administrator, vreau să evit requesturile redundante către API-uri externe, astfel încât să optimizez costurile și să reduc latența pentru datele existente.

#### Acceptance Criteria

1. WHEN există deja date pentru același aeroport, aceeași zi și același tip, THE system SHALL folosi datele din Historical_Cache
2. WHEN datele sunt servite din cache, THE system SHALL marca răspunsul ca source: cache
3. THE system SHALL evita complet apelarea API-ului extern pentru Redundant_Request
4. THE system SHALL verifica existența datelor înainte de fiecare request API
5. THE system SHALL loga toate deciziile de cache hit vs API call pentru transparență

### Requirement 4

**User Story:** Ca analist de date, vreau un Flight_Statistics_Service dedicat care să agregeze informațiile pe mai multe zile, astfel încât să pot identifica tendințe și modele în traficul aerian.

#### Acceptance Criteria

1. THE Flight_Statistics_Service SHALL citească datele din Historical_Cache și să le grupeze pe zi, companie aeriană, aeroport și Time_Interval
2. THE system SHALL calculeze numărul total de zboruri pe zi pentru fiecare aeroport
3. THE system SHALL calculeze procentul de zboruri întârziate pe zi
4. THE system SHALL calculeze întârzierea medie în minute pe zi
5. THE system SHALL identifice cele mai frecvente ore de întârziere pe zi

### Requirement 5

**User Story:** Ca manager de aeroport, vreau să compar performanțele între diferite perioade de timp, astfel încât să identific îmbunătățiri sau deteriorări în servicii.

#### Acceptance Criteria

1. THE system SHALL permite comparații între azi vs ieri pentru toate metricile
2. THE system SHALL permite comparații pentru ultimele 3 zile vs ultimele 7 zile
3. THE system SHALL permite comparații pentru aceeași zi din săptămână (toate lunile)
4. THE system SHALL identifica creșteri și scăderi de trafic cu procente exacte
5. THE system SHALL identifica Delay_Trend și Traffic_Pattern pe perioade specifice

### Requirement 6

**User Story:** Ca utilizator al aplicației, vreau API-uri interne pentru statistici care să îmi ofere date agregate optimizate, astfel încât să pot vizualiza informațiile în grafice și dashboarduri.

#### Acceptance Criteria

1. THE system SHALL expune endpoint-ul /stats/daily?date=YYYY-MM-DD pentru statistici zilnice
2. THE system SHALL expune endpoint-ul /stats/range?from=YYYY-MM-DD&to=YYYY-MM-DD pentru intervale
3. THE system SHALL expune endpoint-ul /stats/trends?airport=OTP&period=7d pentru analiza tendințelor
4. THE system SHALL returna răspunsuri agregate și optimizate pentru afișare în grafice
5. THE system SHALL ordona toate răspunsurile cronologic cu label-uri clare și unități

### Requirement 7

**User Story:** Ca dezvoltator frontend, vreau datele structurate pentru vizualizare, astfel încât să pot crea grafice liniare, grafice bară și heatmap-uri fără procesare suplimentară.

#### Acceptance Criteria

1. THE system SHALL structura datele pentru grafice liniare cu trafic pe zile
2. THE system SHALL structura datele pentru grafice bară cu întârzieri per companie
3. THE system SHALL structura datele pentru heatmap pe ore cu intensitatea traficului
4. THE system SHALL include label-uri clare și unități (minute, procente) în toate răspunsurile
5. THE system SHALL optimiza formatul datelor pentru librării de grafice populare

### Requirement 8

**User Story:** Ca administrator de sistem, vreau logging complet și transparență în operațiuni, astfel încât să pot monitoriza și optimiza performanțele sistemului.

#### Acceptance Criteria

1. THE system SHALL loga când datele vin din API cu timestamp și detalii request
2. THE system SHALL loga când datele sunt servite din Historical_Cache
3. THE system SHALL loga câte zile de istoric există în sistem la fiecare operațiune
4. THE system SHALL loga toate operațiunile de agregare și calculele statistice
5. THE system SHALL ofere metrici despre utilizarea cache-ului și eficiența sistemului

### Requirement 9

**User Story:** Ca proprietar de produs, vreau ca sistemul să devină mai valoros în timp, astfel încât să ofer utilizatorilor statistici mai precise pe măsură ce acumulez mai multe date.

#### Acceptance Criteria

1. THE system SHALL acumula date zilnic fără întrerupere
2. THE system SHALL îmbunătăți precizia statisticilor pe măsură ce Historical_Cache crește
3. THE system SHALL identifica modele sezoniere după acumularea a cel puțin 30 de zile de date
4. THE system SHALL oferi analize comparative mai bogate după 90 de zile de date
5. THE system SHALL adapta algoritmii de analiză pentru a profita de volumul crescut de date

### Requirement 10

**User Story:** Ca utilizator, vreau să văd evoluția în timp a performanțelor aeroporturilor, astfel încât să pot lua decizii informate despre călătorii.

#### Acceptance Criteria

1. THE system SHALL afișeze grafice cu evoluția întârzierilor pe ultimele 30 de zile
2. THE system SHALL afișeze comparații între companii aeriene pe baza datelor istorice
3. THE system SHALL identifica cele mai bune și cele mai proaste ore pentru zbor
4. THE system SHALL recomande zile ale săptămânii cu risc redus de întârzieri
5. THE system SHALL afișeze tendințe sezoniere când sunt disponibile suficiente date

### Requirement 11

**User Story:** Ca administrator, vreau să pot gestiona și optimiza Historical_Cache, astfel încât să mențin performanțe bune chiar și cu volume mari de date.

#### Acceptance Criteria

1. THE system SHALL ofere instrumente pentru compactarea datelor vechi (>1 an)
2. THE system SHALL permite arhivarea datelor foarte vechi păstrând statisticile agregate
3. THE system SHALL optimiza indexurile pentru căutări rapide în volume mari de date
4. THE system SHALL ofere metrici despre dimensiunea și performanța Historical_Cache
5. THE system SHALL permite backup și restore pentru Historical_Cache

### Requirement 12

**User Story:** Ca analist de business, vreau să identific oportunități și probleme în traficul aerian, astfel încât să pot face recomandări strategice.

#### Acceptance Criteria

1. THE system SHALL identifica rutele cu creștere rapidă a traficului
2. THE system SHALL identifica companiile cu îmbunătățiri sau deteriorări în punctualitate
3. THE system SHALL detecta anomalii în trafic (zile cu trafic neobișnuit de mare/mic)
4. THE system SHALL calculeze corelații între vreme și întârzieri (când sunt disponibile date meteo)
5. THE system SHALL genera rapoarte automate cu insights-uri cheie săptămânal