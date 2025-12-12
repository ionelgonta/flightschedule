# 🎯 Ghid Admin Publicitate - Flight Schedule

## 📋 Accesare Panou Admin

### 🔐 Login
- **URL**: `/admin`
- **Parolă Demo**: `admin123`
- **Link în Navbar**: "Admin" (vizibil în meniu)

### 🛡️ Securitate
- Parolă protejată cu localStorage
- Sesiune persistentă până la logout
- În producție: înlocuiește cu autentificare reală

## 🎛️ Funcționalități Admin

### 📊 **Tab 1: Google AdSense**

#### Zone AdSense Disponibile:
1. **Header Banner** (728x90) - Banner în partea de sus
2. **Sidebar Dreapta** (300x600) - Banner în sidebar
3. **Sidebar Pătrat** (300x250) - Banner pătrat în sidebar
4. **Banner Inline** (728x90) - Banner între secțiuni
5. **Footer Banner** (970x90) - Banner în footer
6. **Banner Mobil** (320x50) - Banner pentru mobile

#### Configurare AdSense:
- **Publisher ID**: Actualizează în `components/ads/AdSenseScript.tsx`
- **Slot IDs**: Configurează pentru fiecare zonă în `lib/adConfig.ts`
- **Activare/Dezactivare**: Toggle pentru fiecare zonă

### 🎨 **Tab 2: Bannere Parteneri**

#### Zone Parteneri:
1. **Banner Partener 1** (728x90) - Banner personalizat
2. **Banner Partener 2** (300x250) - Banner personalizat

#### Funcționalități:
- **HTML Personalizat**: Adaugă cod HTML pentru bannere
- **Preview Live**: Vezi cum arată bannerul înainte de salvare
- **Activare/Dezactivare**: Control individual pentru fiecare banner
- **Ștergere**: Elimină bannerul cu un click

## 💻 Exemple de Cod HTML pentru Parteneri

### 🖼️ **Banner Simplu cu Imagine**
```html
<a href="https://partener.com" target="_blank">
  <img src="/banner-partener.jpg" alt="Partener" style="width:100%;height:auto;" />
</a>
```

### 📊 **Banner cu Tracking**
```html
<a href="https://partener.com?utm_source=flightschedule&utm_medium=banner" 
   target="_blank" 
   onclick="gtag('event', 'click', {'event_category': 'banner', 'event_label': 'partener1'});">
  <img src="/banner-partener.jpg" alt="Partener" style="width:100%;height:auto;" />
</a>
```

### 🎯 **Banner Responsive**
```html
<div style="text-align:center;background:#f0f0f0;padding:20px;border-radius:8px;">
  <a href="https://partener.com" target="_blank" style="text-decoration:none;">
    <img src="/logo-partener.png" alt="Partener" style="max-width:200px;height:auto;margin-bottom:10px;" />
    <div style="color:#333;font-weight:bold;font-size:16px;">Ofertă Specială!</div>
    <div style="color:#666;font-size:14px;">Reducere 20% pentru călătorii</div>
  </a>
</div>
```

### 🎬 **Banner cu Video**
```html
<div style="position:relative;width:100%;height:250px;overflow:hidden;border-radius:8px;">
  <video autoplay muted loop style="width:100%;height:100%;object-fit:cover;">
    <source src="/video-partener.mp4" type="video/mp4">
  </video>
  <div style="position:absolute;bottom:10px;left:10px;right:10px;background:rgba(0,0,0,0.7);color:white;padding:10px;border-radius:4px;">
    <a href="https://partener.com" target="_blank" style="color:white;text-decoration:none;">
      <strong>Descoperă Ofertele Noastre!</strong>
    </a>
  </div>
</div>
```

## 📍 Zone de Plasare pe Site

### 🏠 **Homepage**
- Header Banner (top)
- Sidebar Right (dreapta)
- Inline Banner (între secțiuni)
- Sidebar Square (dreapta jos)
- Footer Banner (jos)

### ✈️ **Pagini Aeroporturi**
- Header Banner
- Sidebar Right
- Sidebar Square
- Footer Banner

### 📱 **Mobile**
- Mobile Banner (adaptat automat)
- Bannere responsive

## ⚙️ Configurare Tehnică

### 📁 **Fișiere Importante**
- `lib/adConfig.ts` - Configurația principală
- `components/ads/AdBanner.tsx` - Componenta de afișare
- `app/admin/page.tsx` - Panoul de administrare
- `app/admin/layout.tsx` - Autentificare admin

### 💾 **Salvare Configurație**
- **localStorage**: Configurația se salvează automat în browser
- **Persistență**: Setările rămân după refresh
- **Backup**: Exportă configurația din localStorage

### 🔄 **Actualizare Live**
- Schimbările se aplică imediat
- Nu necesită restart server
- Cache-ul se actualizează automat

## 📈 Optimizare Performanță

### ⚡ **Lazy Loading**
- Bannerele se încarcă doar când sunt vizibile
- Performanța site-ului nu este afectată
- Încărcare progresivă pe scroll

### 📊 **Măsurarea Performanței**
```javascript
// Adaugă în HTML-ul bannerului pentru tracking
onclick="gtag('event', 'click', {
  'event_category': 'banner',
  'event_label': 'partener_name',
  'value': 1
});"
```

### 🎯 **Best Practices**
- Folosește imagini optimizate (WebP, dimensiuni corecte)
- Adaugă `target="_blank"` pentru linkuri externe
- Include `alt` text pentru accesibilitate
- Testează pe dispozitive mobile
- Monitorizează rata de click (CTR)

## 🚀 Deployment

### 📤 **Publicare Schimbări**
1. Configurează bannerele în admin
2. Testează pe localhost
3. Deploy pe serverul Hetzner
4. Verifică funcționarea pe producție

### 🔍 **Verificare Post-Deployment**
- [ ] Bannerele se afișează corect
- [ ] Linkurile funcționează
- [ ] Tracking-ul este activ
- [ ] Responsive pe mobile
- [ ] Performanța nu este afectată

## 📞 Support

Pentru probleme tehnice:
- Verifică consola browser pentru erori
- Testează în modul incognito
- Verifică configurația în localStorage
- Contactează dezvoltatorul pentru suport avansat

---

**🎉 Panoul de admin este gata pentru gestionarea completă a publicității pe site-ul de zboruri!**