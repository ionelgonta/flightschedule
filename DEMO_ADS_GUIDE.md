# 🎨 Ghid Anunțuri Demo - Agenții de Bilete

## Descriere
Am adăugat în panoul de admin o funcționalitate pentru a afișa anunțuri demo generate aleatoriu pentru brandurile de agenții de bilete de avion: **Zbor.md**, **Zbor24.ro**, și **Oozh.com**.

## Cum să folosești funcționalitatea

### 1. Accesează panoul de admin
- Navighează la `/admin` în browser
- Vei vedea interfața de administrare cu mai multe tab-uri

### 2. Găsește secțiunea "Anunțuri Demo"
- În tab-ul "AdSense Toggle" vei găsi o secțiune nouă cu titlul:
  **🎨 Anunțuri Demo - Agenții de Bilete**
- Această secțiune are un design violet/roz și se află în partea de sus

### 3. Activează anunțurile demo
- Folosește toggle-ul (switch-ul) pentru a activa/dezactiva anunțurile demo
- Când este activat, toggle-ul devine violet și afișează "Activat"
- Când este dezactivat, toggle-ul este gri și afișează "Dezactivat"

### 4. Verifică rezultatul
Când anunțurile demo sunt activate:
- **Toate zonele de anunțuri** de pe site vor afișa bannere demo în loc de AdSense real
- Anunțurile includ design-uri atractive cu gradienți și icoane SVG
- Fiecare brand are propriul său design și mesaj

## Brandurile incluse

### 🟦 Zbor.md
- **Culori**: Gradient albastru-violet (#667eea → #764ba2)
- **Mesaj**: "Bilete de avion la prețuri avantajoase"
- **Design**: Icoane de avion, fundal cu pattern

### 🟥 Zbor24.ro  
- **Culori**: Gradient roșu-portocaliu (#ff6b6b → #ee5a24)
- **Mesaj**: "Cele mai bune oferte pentru călătorii"
- **Design**: Icoane stea, liste cu servicii

### 🟢 Oozh.com
- **Culori**: Gradient verde (#2ecc71 → #27ae60)
- **Mesaj**: "Turism și călătorii" / "Experiențe de călătorie de neuitat"
- **Design**: Icoane check, elemente circulare

## Zonele de anunțuri afectate

Când demo-ul este activat, următoarele zone vor afișa anunțuri demo:

1. **Header Banner** (728x90) - Zbor.md
2. **Sidebar Right** (300x600) - Zbor24.ro  
3. **Sidebar Square** (300x250) - Oozh.com
4. **Inline Banner** (728x90) - Zbor.md
5. **Footer Banner** (970x90) - Zbor24.ro
6. **Mobile Banner** (320x50) - Oozh.com
7. **Partner Banner 1** (728x90) - Zbor.md
8. **Partner Banner 2** (300x250) - Oozh.com

## Caracteristici tehnice

### Persistență
- Starea toggle-ului se salvează în `localStorage`
- Setarea rămâne activă între sesiuni de browser
- Se salvează automat la fiecare modificare

### Design responsiv
- Anunțurile demo sunt optimizate pentru diferite dimensiuni
- Folosesc CSS modern cu gradienți și animații
- Includ hover effects și tranziții

### Compatibilitate
- Funcționează în toate browserele moderne
- Nu interferează cu AdSense real când este dezactivat
- Se integrează perfect cu sistemul existent de toggle

## Avantaje

✅ **Testare ușoară**: Poți vedea cum arată site-ul cu anunțuri fără să ai nevoie de AdSense real  
✅ **Design atractiv**: Anunțurile demo au design-uri profesionale și atractive  
✅ **Branduri relevante**: Folosește branduri din industria de călătorii/zboruri  
✅ **Control complet**: Activezi/dezactivezi instant din admin  
✅ **Fără impact**: Nu afectează performanța sau AdSense real  

## Notă importantă

Această funcționalitate este destinată **doar pentru testare și demonstrație**. Când vrei să folosești AdSense real pentru monetizare, asigură-te că toggle-ul demo este **dezactivat**.

---

**Implementat cu succes!** 🚀  
Funcționalitatea este gata de utilizare și testare.