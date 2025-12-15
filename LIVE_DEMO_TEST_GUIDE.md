# 🔧 Ghid Testare Demo Ads pe Site Live

## Problema identificată
Toggle-ul apare în admin dar anunțurile demo nu se afișează pe site-ul live.

## Soluția aplicată
Am adăugat debug logging și forțarea încărcării configurației demo în componenta AdBanner.

## 🧪 Cum să testezi ACUM:

### Metoda 1: Prin Admin Panel
1. **Accesează:** https://anyway.ro/admin
2. **Activează:** Toggle-ul "Anunțuri Demo - Agenții de Bilete"
3. **Verifică:** Deschide Console (F12) pentru debug logs
4. **Vizitează:** https://anyway.ro pentru a vedea anunțurile

### Metoda 2: Prin Browser Console (Recomandată)
1. **Deschide:** https://anyway.ro
2. **Console:** Apasă F12 → Console tab
3. **Copiază și rulează:** Conținutul din `test-live-demo-ads.js`
4. **Activează:** `window.demoAdsTest.enable()`
5. **Verifică:** Pagina se va reîncărca cu demo ads

### Comenzi Console Disponibile:
```javascript
// Activează demo ads
window.demoAdsTest.enable()

// Dezactivează demo ads  
window.demoAdsTest.disable()

// Verifică starea curentă
window.demoAdsTest.check()

// Forțează refresh bannere
window.demoAdsTest.refresh()
```

## 🔍 Debug Information

### Ce să cauți în Console:
```
AdBanner header-banner: {
  mode: "demo",
  demoEnabled: "true", 
  hasDemoHtml: true
}
Rendering demo banner for header-banner: <div style="width: 728px...
```

### Verificări localStorage:
```javascript
// Verifică starea demo
localStorage.getItem('demoAdsEnabled')  // should be "true"

// Verifică configurația
JSON.parse(localStorage.getItem('adConfig'))
```

## 🎯 Ce ar trebui să vezi:

### Când demo ads sunt ACTIVE:
- **Header:** Banner Zbor.md (gradient albastru-violet)
- **Sidebar:** Banner Zbor24.ro (gradient roșu-portocaliu)  
- **Footer:** Banner Zbor24.ro (gradient albastru)
- **Mobile:** Banner Oozh.com (compact)

### Brandurile în demo:
- **Zbor.md** - "Bilete de avion la prețuri avantajoase"
- **Zbor24.ro** - "Cele mai bune oferte pentru călătorii"
- **Oozh.com** - "Turism și călătorii"

## 🚨 Troubleshooting

### Dacă nu vezi anunțuri demo:
1. **Verifică Console:** Caută erori JavaScript
2. **Verifică localStorage:** Rulează `window.demoAdsTest.check()`
3. **Forțează refresh:** Rulează `window.demoAdsTest.refresh()`
4. **Reîncarcă pagina:** Ctrl+F5 pentru hard refresh

### Dacă toggle-ul nu funcționează în admin:
1. **Activează manual:** Folosește console commands
2. **Verifică admin:** Deschide Console în admin pentru erori
3. **Test direct:** Folosește `window.demoAdsTest.enable()`

## ✅ Status Update

### Modificări aplicate:
- ✅ AdBanner component actualizat cu debug logging
- ✅ Forțarea încărcării configurației demo din localStorage  
- ✅ Build și restart pe server complet
- ✅ Script de testare creat pentru debugging

### Următorii pași:
1. **Testează** folosind metodele de mai sus
2. **Raportează** rezultatele din Console
3. **Verifică** dacă anunțurile apar pe site

**Demo ads ar trebui să funcționeze acum pe anyway.ro!** 🎉