# Requirements Document - Persistent Flight System

## Introduction

Reconstruirea completă a sistemului de procesare a zborurilor pentru aeroporturile din România și Moldova cu focus pe persistența datelor și generarea unui program săptămânal precis bazat pe date istorice reale.

## Glossary

- **Flight_System**: Sistemul complet de gestionare a zborurilor
- **Persistent_Cache**: Cache-ul permanent care nu se șterge la restart
- **Historical_Database**: Baza de date istorică cu toate zborurile procesate
- **Master_Schedule**: Programul săptămânal generat din datele istorice
- **UPSERT**: Operație de inserare sau actualizare (nu suprascriere)
- **Codeshare_Flight**: Zbor operat de o companie dar vândut sub numărul altei companii
- **Weather_Cache**: Cache-ul persistent pentru datele meteorologice
- **Daily_Backup**: Backup zilnic automat al cache-ului persistent

## Requirements

### Requirement 1

**User Story:** Ca administrator de sistem, vreau un sistem de stocare persistent care să nu se șteargă niciodată la restart, astfel încât să păstrez toate datele istorice de zboruri.

#### Acceptance Criteria

1. WHEN sistemul pornește THEN Historical_Database SHALL încărca datele existente fără a le șterge
2. WHEN un zbor este procesat THEN Flight_System SHALL salva zborul în Historical_Database folosind logica UPSERT
3. WHEN un zbor există deja (identificat prin număr zbor și dată) THEN Flight_System SHALL actualiza statusul fără a crea duplicat
4. WHEN un zbor nou este detectat THEN Flight_System SHALL adăuga zborul în Historical_Database
5. WHEN sistemul se oprește neașteptat THEN Historical_Database SHALL păstra toate datele salvate anterior

### Requirement 2

**User Story:** Ca analist de date, vreau colectarea și filtrarea inteligentă a datelor de zboruri, astfel încât să obțin informații precise despre rutele și operatorii.

#### Acceptance Criteria

1. WHEN Flight_System monitorizează aeroporturile THEN sistemul SHALL extrage toate zborurile din România și Moldova
2. WHEN sunt detectate zboruri duplicate THEN Flight_System SHALL exclude automat duplicatele
3. WHEN sunt detectate zboruri Codeshare THEN Flight_System SHALL păstra doar operatorul principal/numeric
4. WHEN procesează datele de zbor THEN Flight_System SHALL folosi ora din câmpul Scheduled pentru acuratețe
5. WHEN agregă datele THEN Flight_System SHALL grupa pe rute, operatori și frecvență săptămânală

### Requirement 3

**User Story:** Ca utilizator al aplicației, vreau un program săptămânal precis generat din datele istorice, astfel încât să pot planifica călătoriile eficient.

#### Acceptance Criteria

1. WHEN se generează Master_Schedule THEN Flight_System SHALL folosi exclusiv datele din Historical_Database
2. WHEN creează programul săptămânal THEN Flight_System SHALL genera intrări de tipul [Zi | Rută | Operator | Oră]
3. WHEN afișează programul THEN Flight_System SHALL grupa zborurile pe zile și rute
4. WHEN există multiple operatori pe aceeași rută THEN Flight_System SHALL afișa separat fiecare operator
5. WHEN programul este accesat THEN Flight_System SHALL returna date din cache-ul persistent

### Requirement 4

**User Story:** Ca utilizator, vreau informații meteorologice actualizate pentru destinații, astfel încât să pot lua decizii informate despre călătorii.

#### Acceptance Criteria

1. WHEN se identifică o destinație unică THEN Flight_System SHALL menține un Weather_Cache persistent
2. WHEN datele meteo sunt mai vechi de 30 minute THEN Flight_System SHALL verifica API-ul OpenWeatherMap
3. WHEN API-ul meteo este indisponibil THEN Flight_System SHALL folosi ultima valoare salvată din cache
4. WHEN se actualizează datele meteo THEN Flight_System SHALL salva noile date în Weather_Cache
5. WHEN se afișează informații meteo THEN Flight_System SHALL indica vârsta datelor

### Requirement 5

**User Story:** Ca administrator, vreau backup-uri zilnice automate ale cache-ului persistent, astfel încât să pot restaura datele în caz de probleme.

#### Acceptance Criteria

1. WHEN este ora 00:00 zilnic THEN Flight_System SHALL crea automat un Daily_Backup
2. WHEN creează backup-ul THEN Flight_System SHALL păstra ultimele 7 zile de backup-uri
3. WHEN există mai mult de 7 backup-uri THEN Flight_System SHALL șterge backup-ul cel mai vechi
4. WHEN administratorul solicită restore THEN Flight_System SHALL permite restaurarea din orice backup din ultimele 7 zile
5. WHEN se face restore THEN Flight_System SHALL păstra backup-ul curent înainte de restaurare

### Requirement 6

**User Story:** Ca dezvoltator, vreau ca modulele existente (Statistici, Planificator) să citească exclusiv din cache-ul persistent, astfel încât să mențin consistența datelor.

#### Acceptance Criteria

1. WHEN modulele de Statistici accesează date THEN acestea SHALL citi exclusiv din Historical_Database
2. WHEN Planificatorul generează opțiuni THEN acesta SHALL folosi doar datele din Persistent_Cache
3. WHEN se afișează paginile de sosiri/plecări THEN acestea SHALL păstra designul actual dar să folosească noul sistem
4. WHEN se accesează analizele THEN acestea SHALL folosi datele din cache-ul persistent
5. WHEN se generează statistici THEN acestea SHALL reflecta datele istorice complete

### Requirement 7

**User Story:** Ca administrator de sistem, vreau verificarea și încărcarea automată a bazei de date la pornire, astfel încât sistemul să fie întotdeauna funcțional.

#### Acceptance Criteria

1. WHEN sistemul pornește THEN Flight_System SHALL verifica existența fișierului de bază de date
2. WHEN baza de date există THEN Flight_System SHALL încărca datele existente
3. WHEN baza de date nu există THEN Flight_System SHALL crea o bază de date nouă cu schema corectă
4. WHEN încarcă datele THEN Flight_System SHALL valida integritatea datelor
5. WHEN detectează corupție THEN Flight_System SHALL încerca restaurarea din ultimul backup valid

### Requirement 8

**User Story:** Ca utilizator final, vreau ca toate funcționalitățile existente să rămână neschimbate vizual, astfel încât să nu fie nevoie să învăț o interfață nouă.

#### Acceptance Criteria

1. WHEN accesez paginile de sosiri/plecări THEN acestea SHALL păstra designul și funcționalitatea actuală
2. WHEN navighează prin program săptămânal THEN interfața SHALL rămâne identică cu cea actuală
3. WHEN vizualizez analizele THEN layout-ul și funcționalitățile SHALL fi neschimbate
4. WHEN accesez statisticile THEN prezentarea datelor SHALL păstra formatul actual
5. WHEN folosesc planificatorul THEN experiența utilizatorului SHALL rămâne consistentă