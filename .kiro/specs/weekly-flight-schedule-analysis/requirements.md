# Requirements Document

## Introduction

Sistem de analiză a programului săptămânal de zboruri bazat pe datele existente din cache și baza de date locală. Sistemul va extrage informațiile despre zboruri din datele deja stocate și va crea un tabel cu programul săptămânal pentru fiecare aeroport și destinație, fără a face apeluri externe la AeroDataBox.

## Glossary

- **Flight_Cache**: Cache-ul local care conține datele de zboruri din ultimele 3 luni
- **Weekly_Schedule_Table**: Tabelul generat care conține programul săptămânal de zboruri
- **Airport_Database**: Baza de date locală cu cele 16 aeroporturi românești și moldovenești
- **Historical_Data**: Datele istorice de zboruri din ultimele 3 luni stocate local
- **Day_Pattern**: Modelul zilelor săptămânii în care operează un zbor (Luni, Marți, etc.)
- **Route_Analysis**: Analiza rutelor de zbor între aeroporturi
- **Schedule_Generator**: Componenta care generează tabelul programului săptămânal

## Requirements

### Requirement 1

**User Story:** Ca administrator al sistemului, vreau să analizez datele existente din cache pentru a genera un program săptămânal de zboruri, astfel încât să pot vedea modelele de zbor fără a face apeluri externe.

#### Acceptance Criteria

1. WHEN Schedule_Generator rulează, THE system SHALL parcurge toate aeroporturile din Airport_Database
2. WHEN un aeroport este procesat, THE system SHALL extrage toate zborurile din Flight_Cache pentru acel aeroport
3. WHEN datele de zbor sunt procesate, THE system SHALL convertească data și ora programată în zilele săptămânii
4. WHEN conversiile sunt complete, THE system SHALL stoca rezultatele în Weekly_Schedule_Table
5. THE system SHALL folosească doar datele din Historical_Data din ultimele 3 luni

### Requirement 2

**User Story:** Ca utilizator al sistemului, vreau să văd un tabel cu programul săptămânal de zboruri pentru fiecare aeroport și destinație, astfel încât să știu în ce zile ale săptămânii operează zborurile.

#### Acceptance Criteria

1. THE Weekly_Schedule_Table SHALL conține coloana pentru aeroport de origine
2. THE Weekly_Schedule_Table SHALL conține coloana pentru destinație
3. THE Weekly_Schedule_Table SHALL conține coloane pentru fiecare zi a săptămânii (Luni, Marți, Miercuri, Joi, Vineri, Sâmbătă, Duminică)
4. WHEN un zbor operează într-o anumită zi, THE system SHALL marca acea zi în tabel
5. THE system SHALL afișeze informații despre compania aeriană și numărul zborului pentru fiecare rută

### Requirement 3

**User Story:** Ca administrator, vreau ca tabelul să fie actualizat automat pe baza datelor din cache, astfel încât să reflect întotdeauna informațiile disponibile local fără apeluri externe.

#### Acceptance Criteria

1. WHEN scriptul rulează, THE system SHALL verifica dacă Weekly_Schedule_Table există
2. IF Weekly_Schedule_Table nu există, THEN THE system SHALL creeze tabelul cu structura specificată
3. IF Weekly_Schedule_Table există deja, THEN THE system SHALL actualizeze datele existente
4. THE system SHALL sincronizeze tabelul cu toate zborurile disponibile din Flight_Cache
5. THE system SHALL păstra istoricul ultimelor 3 luni de date pentru analiză

### Requirement 4

**User Story:** Ca utilizator, vreau să văd statistici despre frecvența zborurilor pe zile ale săptămânii, astfel încât să înțeleg modelele de operare ale aeroporturilor.

#### Acceptance Criteria

1. THE system SHALL calculeze frecvența zborurilor pentru fiecare zi a săptămânii
2. THE system SHALL afișeze numărul total de zboruri pentru fiecare rută
3. WHEN o rută operează în multiple zile, THE system SHALL afișeze toate zilele respective
4. THE system SHALL grupeze zborurile după aeroport de origine și destinație
5. THE system SHALL afișeze companiile aeriene care operează pe fiecare rută

### Requirement 5

**User Story:** Ca dezvoltator, vreau ca sistemul să funcționeze independent de sursele externe, astfel încât să pot rula analiza oricând fără dependențe de API-uri externe.

#### Acceptance Criteria

1. THE system SHALL folosească exclusiv datele din Flight_Cache local
2. THE system SHALL accesa doar Airport_Database pentru lista aeroporturilor
3. THE system SHALL evita complet apelurile către AeroDataBox sau alte API-uri externe
4. WHEN datele din cache sunt insuficiente, THE system SHALL afișa un mesaj informativ
5. THE system SHALL funcționa offline complet pe baza datelor stocate local

### Requirement 6

**User Story:** Ca administrator, vreau să pot exporta tabelul programului săptămânal în diferite formate, astfel încât să pot folosi datele în alte aplicații.

#### Acceptance Criteria

1. THE system SHALL permite exportul tabelului în format JSON
2. THE system SHALL permite exportul tabelului în format CSV
3. THE system SHALL include metadate despre perioada analizată în export
4. WHEN exportul este generat, THE system SHALL include timestamp-ul generării
5. THE system SHALL optimiza formatul exportului pentru ușurința citirii

### Requirement 7

**User Story:** Ca utilizator, vreau să văd o interfață web pentru vizualizarea programului săptămânal, astfel încât să pot naviga ușor prin datele de zboruri.

#### Acceptance Criteria

1. THE system SHALL creeze o pagină web pentru afișarea Weekly_Schedule_Table
2. THE system SHALL permite filtrarea după aeroport de origine
3. THE system SHALL permite filtrarea după destinație
4. THE system SHALL permite sortarea după diferite criterii (aeroport, destinație, frecvență)
5. THE system SHALL afișeze datele într-un format tabelar ușor de citit cu design responsive