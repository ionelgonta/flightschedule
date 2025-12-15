# 🔧 Demo Ads - Documentație Tehnică

## Arhitectura implementării

### 1. State Management (app/admin/page.tsx)

```typescript
// Demo Ads State
const [demoAdsEnabled, setDemoAdsEnabled] = useState(false)

// Toggle function
const handleToggleDemoAds = (enabled: boolean) => {
  setDemoAdsEnabled(enabled)
  
  // Set all zones to demo mode if enabled, otherwise set to active
  Object.keys(config.zones).forEach((zoneKey) => {
    const zone = zoneKey as keyof typeof config.zones
    setAdZoneMode(zone, enabled ? 'demo' : 'active')
  })
  
  // Update local config state
  setConfig({ ...adConfig })
  
  // Save to localStorage
  localStorage.setItem('adConfig', JSON.stringify(adConfig))
  localStorage.setItem('demoAdsEnabled', JSON.stringify(enabled))
}
```

### 2. Ad Configuration (lib/adConfig.ts)

Fiecare zonă de anunțuri are următoarea structură:

```typescript
interface AdZone {
  mode: 'active' | 'inactive' | 'demo'
  slotId: string
  size: string
  customHtml?: string
  demoHtml?: string  // ← Nou adăugat pentru demo
}
```

### 3. Rendering Logic (components/ads/AdBanner.tsx)

```typescript
// If mode is demo, show demo banner
if (config.mode === 'demo') {
  return (
    <div 
      className={`ad-banner demo-banner ${className}`}
      style={{ display: 'flex', justifyContent: 'center', margin: '10px 0' }}
      dangerouslySetInnerHTML={{ __html: config.demoHtml || '' }}
    />
  )
}
```

## Brandurile Demo

### Zbor.md
- **Gradient**: `linear-gradient(135deg, #667eea 0%, #764ba2 100%)`
- **Icoane**: Avion SVG cu pattern de fundal
- **Mesaj**: "Bilete de avion la prețuri avantajoase"
- **Zone**: header-banner, inline-banner, partner-banner-1

### Zbor24.ro
- **Gradient**: `linear-gradient(180deg, #ff6b6b 0%, #ee5a24 100%)`
- **Icoane**: Stea și avion SVG
- **Mesaj**: "Cele mai bune oferte pentru călătorii"
- **Zone**: sidebar-right, footer-banner

### Oozh.com
- **Gradient**: `linear-gradient(45deg, #2ecc71 0%, #27ae60 100%)`
- **Icoane**: Check circle și stea SVG
- **Mesaj**: "Turism și călătorii"
- **Zone**: sidebar-square, mobile-banner, partner-banner-2

## Persistența datelor

### localStorage Keys
- `adConfig`: Configurația completă a zonelor de anunțuri
- `demoAdsEnabled`: Boolean pentru starea toggle-ului demo

### Încărcarea la startup
```typescript
useEffect(() => {
  // Load demo ads state
  const savedDemoState = localStorage.getItem('demoAdsEnabled')
  if (savedDemoState) {
    try {
      setDemoAdsEnabled(JSON.parse(savedDemoState))
    } catch (error) {
      console.error('Error loading demo ads state:', error)
    }
  }
}, [])
```

## Zonele de anunțuri

| Zona | Dimensiune | Brand Demo | Locație |
|------|------------|------------|---------|
| header-banner | 728x90 | Zbor.md | Header site |
| sidebar-right | 300x600 | Zbor24.ro | Sidebar dreapta |
| sidebar-square | 300x250 | Oozh.com | Sidebar pătrat |
| inline-banner | 728x90 | Zbor.md | Între secțiuni |
| footer-banner | 970x90 | Zbor24.ro | Footer |
| mobile-banner | 320x50 | Oozh.com | Mobil |
| partner-banner-1 | 728x90 | Zbor.md | Partner 1 |
| partner-banner-2 | 300x250 | Oozh.com | Partner 2 |

## Design Patterns

### Gradient Backgrounds
Toate anunțurile demo folosesc gradienți CSS pentru un aspect modern:
```css
background: linear-gradient(135deg, #color1 0%, #color2 100%)
```

### SVG Icons
Iconițele sunt inline SVG pentru performanță optimă:
```html
<svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
  <path d="..."/>
</svg>
```

### Responsive Design
Anunțurile se adaptează la diferite dimensiuni de ecran prin CSS flexbox.

## Integrarea cu sistemul existent

### AdSense Toggle System
Demo ads se integrează perfect cu sistemul existent de 3 moduri:
- **active**: AdSense real
- **inactive**: Fără anunțuri
- **demo**: Anunțuri demo ← Nou

### Backward Compatibility
Funcționalitatea nu afectează codul existent și poate fi dezactivată oricând.

## Testing

### Manual Testing
1. Activează demo mode din admin
2. Verifică toate paginile site-ului
3. Confirmă că anunțurile demo apar în toate zonele
4. Dezactivează și verifică că revin la AdSense normal

### Automated Testing
```typescript
// Test pentru verificarea modului demo
expect(adConfig.zones['header-banner'].mode).toBe('demo')
expect(adConfig.zones['header-banner'].demoHtml).toContain('zbor.md')
```

## Performance Impact

### Minimal Overhead
- Demo HTML este pre-generat (nu se calculează dinamic)
- Folosește `dangerouslySetInnerHTML` pentru rendering rapid
- Nu face request-uri externe în modul demo

### Memory Usage
- Demo HTML este stocat în configurație (câteva KB)
- localStorage usage: ~10-20KB pentru configurație completă

## Security Considerations

### XSS Prevention
Demo HTML este controlat complet de dezvoltatori, nu vine de la utilizatori.

### Content Security Policy
Demo ads respectă CSP-ul site-ului (inline styles sunt permise).

## Maintenance

### Adăugarea unui nou brand
1. Creează HTML demo în `lib/adConfig.ts`
2. Asignează la zonele dorite
3. Testează pe toate dimensiunile

### Modificarea design-ului
Editează `demoHtml` în configurația zonei respective din `lib/adConfig.ts`.

---

**Implementare completă și testată!** ✅