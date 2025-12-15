# 🎯 Script Console pentru AdSense Toggle (Activ/Inactiv/Demo)

## Instrucțiuni

### 1. Deschide pagina admin
Mergi la: **https://anyway.ro/admin**

### 2. Deschide Developer Console
- **Chrome/Edge**: F12 sau Ctrl+Shift+I
- **Firefox**: F12 sau Ctrl+Shift+K
- Selectează tab-ul "Console"

### 3. Copiază și execută acest script:

```javascript
// Script pentru gestionarea completă a bannerelor AdSense cu 3 moduri: Activ, Inactiv, Demo
(function() {
    // Verifică dacă secțiunea AdSense există deja
    if (document.getElementById('adsense-toggle-section')) {
        console.log('❌ Secțiunea AdSense Toggle există deja!');
        return;
    }
    
    // Găsește containerul principal
    const container = document.querySelector('.bg-white.dark\\:bg-gray-800.rounded-lg.shadow-xl') || 
                     document.querySelector('main') || 
                     document.body;
    
    if (!container) {
        console.log('❌ Nu s-a găsit containerul pentru AdSense!');
        return;
    }
    
    // Configurația zonelor de publicitate
    const adZones = {
        'header-banner': { name: 'Header Banner', size: '728x90', description: 'Banner în partea de sus a paginii' },
        'sidebar-right': { name: 'Sidebar Dreapta', size: '300x600', description: 'Banner în sidebar-ul din dreapta' },
        'sidebar-square': { name: 'Sidebar Pătrat', size: '300x250', description: 'Banner pătrat în sidebar' },
        'inline-banner': { name: 'Banner Inline', size: '728x90', description: 'Banner între secțiuni' },
        'footer-banner': { name: 'Footer Banner', size: '970x90', description: 'Banner în footer' },
        'mobile-banner': { name: 'Banner Mobil', size: '320x50', description: 'Banner pentru dispozitive mobile' },
        'partner-banner-1': { name: 'Banner Partener 1', size: '728x90', description: 'Banner personalizat partener' },
        'partner-banner-2': { name: 'Banner Partener 2', size: '300x250', description: 'Banner personalizat partener' }
    };
    
    // Creează secțiunea AdSense Toggle
    const adsenseDiv = document.createElement('div');
    adsenseDiv.id = 'adsense-toggle-section';
    adsenseDiv.style.cssText = 'margin-top: 20px; padding: 20px; background: white; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); border: 1px solid #e5e7eb; max-width: 1000px;';
    
    let zonesHtml = '';
    Object.keys(adZones).forEach(zoneKey => {
        const zone = adZones[zoneKey];
        zonesHtml += `
            <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin-bottom: 16px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                    <div>
                        <h4 style="margin: 0 0 4px 0; font-size: 16px; font-weight: 600; color: #374151;">${zone.name}</h4>
                        <p style="margin: 0; font-size: 14px; color: #6b7280;">${zone.size} - ${zone.description}</p>
                    </div>
                    <div style="display: flex; gap: 8px;">
                        <button 
                            class="mode-btn" 
                            data-zone="${zoneKey}" 
                            data-mode="active"
                            style="padding: 6px 12px; border: 1px solid #10b981; background: #10b981; color: white; border-radius: 4px; font-size: 12px; cursor: pointer;"
                        >
                            Activ
                        </button>
                        <button 
                            class="mode-btn" 
                            data-zone="${zoneKey}" 
                            data-mode="inactive"
                            style="padding: 6px 12px; border: 1px solid #6b7280; background: transparent; color: #6b7280; border-radius: 4px; font-size: 12px; cursor: pointer;"
                        >
                            Inactiv
                        </button>
                        <button 
                            class="mode-btn" 
                            data-zone="${zoneKey}" 
                            data-mode="demo"
                            style="padding: 6px 12px; border: 1px solid #f59e0b; background: transparent; color: #f59e0b; border-radius: 4px; font-size: 12px; cursor: pointer;"
                        >
                            Demo
                        </button>
                    </div>
                </div>
                <div id="status-${zoneKey}" style="font-size: 12px; color: #10b981; font-weight: 500;">
                    Status: Activ (AdSense)
                </div>
            </div>
        `;
    });
    
    adsenseDiv.innerHTML = `
        <div style="margin-bottom: 20px; padding: 16px; background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px;">
            <h3 style="margin: 0 0 8px 0; color: #1e40af; font-size: 20px; font-weight: 600;">
                🎯 Gestionare Zone Publicitate AdSense
            </h3>
            <p style="margin: 0; color: #1d4ed8; font-size: 14px;">
                Controlează toate zonele de publicitate: <strong>Activ</strong> (AdSense), <strong>Inactiv</strong> (ascuns), <strong>Demo</strong> (bannere agenții turism)
            </p>
        </div>
        
        <div style="margin-bottom: 20px;">
            <div style="display: flex; gap: 12px; margin-bottom: 16px;">
                <button 
                    id="set-all-active"
                    style="padding: 8px 16px; background: #10b981; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 500;"
                >
                    Toate Active
                </button>
                <button 
                    id="set-all-inactive"
                    style="padding: 8px 16px; background: #6b7280; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 500;"
                >
                    Toate Inactive
                </button>
                <button 
                    id="set-all-demo"
                    style="padding: 8px 16px; background: #f59e0b; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 500;"
                >
                    Toate Demo
                </button>
                <button 
                    id="refresh-page"
                    style="padding: 8px 16px; background: #3b82f6; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 500;"
                >
                    Refresh Pagină
                </button>
            </div>
        </div>
        
        <div style="margin-bottom: 20px;">
            ${zonesHtml}
        </div>
        
        <div style="padding: 16px; background: #f3f4f6; border: 1px solid #e5e7eb; border-radius: 8px;">
            <h4 style="margin: 0 0 12px 0; color: #374151; font-size: 16px; font-weight: 500;">
                📊 Informații Moduri
            </h4>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; font-size: 14px;">
                <div>
                    <h5 style="margin: 0 0 8px 0; color: #10b981; font-weight: 500;">🟢 Activ</h5>
                    <ul style="margin: 0; padding-left: 16px; color: #6b7280;">
                        <li>Afișează AdSense real</li>
                        <li>Generează venituri</li>
                        <li>Publisher ID: ca-pub-2305349540791838</li>
                    </ul>
                </div>
                
                <div>
                    <h5 style="margin: 0 0 8px 0; color: #6b7280; font-weight: 500;">⚫ Inactiv</h5>
                    <ul style="margin: 0; padding-left: 16px; color: #6b7280;">
                        <li>Nu afișează nimic</li>
                        <li>Zona este ascunsă</li>
                        <li>Economisește spațiu</li>
                    </ul>
                </div>
                
                <div>
                    <h5 style="margin: 0 0 8px 0; color: #f59e0b; font-weight: 500;">🟡 Demo</h5>
                    <ul style="margin: 0; padding-left: 16px; color: #6b7280;">
                        <li>Bannere agenții turism</li>
                        <li>Zbor.md, Zbor24.ro, Oozh.com</li>
                        <li>Design personalizat</li>
                    </ul>
                </div>
            </div>
        </div>
        
        <div style="margin-top: 16px; padding: 12px; background: #fef3c7; border: 1px solid #fbbf24; border-radius: 6px;">
            <p style="margin: 0; color: #92400e; font-size: 13px;">
                <strong>💡 Notă:</strong> Modificările se salvează în localStorage. Pentru a vedea efectul, refresh pagina sau navighează pe site.
            </p>
        </div>
    `;
    
    // Adaugă secțiunea în pagină
    container.appendChild(adsenseDiv);
    
    // Funcționalitate pentru gestionarea modurilor
    let currentConfig = JSON.parse(localStorage.getItem('adConfig') || '{}');
    
    // Inițializează configurația dacă nu există
    if (!currentConfig.zones) {
        currentConfig = {
            publisherId: 'ca-pub-2305349540791838',
            zones: {}
        };
        Object.keys(adZones).forEach(zoneKey => {
            currentConfig.zones[zoneKey] = { mode: 'active' };
        });
    }
    
    // Funcție pentru actualizarea statusului vizual
    function updateZoneStatus(zoneKey, mode) {
        const statusElement = document.getElementById(`status-${zoneKey}`);
        const buttons = document.querySelectorAll(`[data-zone="${zoneKey}"]`);
        
        // Resetează toate butoanele
        buttons.forEach(btn => {
            const btnMode = btn.getAttribute('data-mode');
            if (btnMode === mode) {
                if (mode === 'active') {
                    btn.style.background = '#10b981';
                    btn.style.color = 'white';
                } else if (mode === 'inactive') {
                    btn.style.background = '#6b7280';
                    btn.style.color = 'white';
                } else if (mode === 'demo') {
                    btn.style.background = '#f59e0b';
                    btn.style.color = 'white';
                }
            } else {
                btn.style.background = 'transparent';
                if (btnMode === 'active') {
                    btn.style.color = '#10b981';
                } else if (btnMode === 'inactive') {
                    btn.style.color = '#6b7280';
                } else if (btnMode === 'demo') {
                    btn.style.color = '#f59e0b';
                }
            }
        });
        
        // Actualizează statusul
        if (statusElement) {
            let statusText = '';
            let statusColor = '';
            
            switch(mode) {
                case 'active':
                    statusText = 'Status: Activ (AdSense)';
                    statusColor = '#10b981';
                    break;
                case 'inactive':
                    statusText = 'Status: Inactiv (Ascuns)';
                    statusColor = '#6b7280';
                    break;
                case 'demo':
                    statusText = 'Status: Demo (Agenții Turism)';
                    statusColor = '#f59e0b';
                    break;
            }
            
            statusElement.textContent = statusText;
            statusElement.style.color = statusColor;
        }
    }
    
    // Funcție pentru setarea modului unei zone
    function setZoneMode(zoneKey, mode) {
        currentConfig.zones[zoneKey] = { mode: mode };
        localStorage.setItem('adConfig', JSON.stringify(currentConfig));
        updateZoneStatus(zoneKey, mode);
        console.log(`✅ ${adZones[zoneKey].name} setat pe modul: ${mode}`);
    }
    
    // Inițializează statusul vizual pentru toate zonele
    Object.keys(adZones).forEach(zoneKey => {
        const currentMode = currentConfig.zones[zoneKey]?.mode || 'active';
        updateZoneStatus(zoneKey, currentMode);
    });
    
    // Event listeners pentru butoanele individuale
    document.querySelectorAll('.mode-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const zoneKey = this.getAttribute('data-zone');
            const mode = this.getAttribute('data-mode');
            setZoneMode(zoneKey, mode);
        });
    });
    
    // Event listeners pentru butoanele globale
    document.getElementById('set-all-active').addEventListener('click', function() {
        Object.keys(adZones).forEach(zoneKey => {
            setZoneMode(zoneKey, 'active');
        });
        console.log('✅ Toate zonele setate pe ACTIV');
    });
    
    document.getElementById('set-all-inactive').addEventListener('click', function() {
        Object.keys(adZones).forEach(zoneKey => {
            setZoneMode(zoneKey, 'inactive');
        });
        console.log('✅ Toate zonele setate pe INACTIV');
    });
    
    document.getElementById('set-all-demo').addEventListener('click', function() {
        Object.keys(adZones).forEach(zoneKey => {
            setZoneMode(zoneKey, 'demo');
        });
        console.log('✅ Toate zonele setate pe DEMO');
    });
    
    document.getElementById('refresh-page').addEventListener('click', function() {
        window.location.reload();
    });
    
    console.log('✅ Panoul de control AdSense a fost adăugat cu succes!');
    console.log('🎯 Poți controla toate zonele de publicitate cu 3 moduri:');
    console.log('   🟢 ACTIV - AdSense real');
    console.log('   ⚫ INACTIV - Ascuns');
    console.log('   🟡 DEMO - Bannere agenții turism');
})();
```

### 4. Apasă Enter pentru a executa scriptul

### 5. Utilizare

#### Moduri Disponibile:
- **🟢 Activ**: Afișează AdSense real cu Publisher ID-ul tău
- **⚫ Inactiv**: Ascunde complet zona de publicitate
- **🟡 Demo**: Afișează bannere personalizate pentru agenții de turism

#### Butoane Globale:
- **Toate Active**: Setează toate zonele pe AdSense
- **Toate Inactive**: Ascunde toate bannerele
- **Toate Demo**: Afișează bannere demo pentru toate zonele
- **Refresh Pagină**: Reîncarcă pagina pentru a vedea modificările

#### Zone Disponibile:
1. **Header Banner** (728x90) - Banner în partea de sus
2. **Sidebar Dreapta** (300x600) - Banner în sidebar
3. **Sidebar Pătrat** (300x250) - Banner pătrat
4. **Banner Inline** (728x90) - Banner între secțiuni
5. **Footer Banner** (970x90) - Banner în footer
6. **Banner Mobil** (320x50) - Banner pentru mobile
7. **Banner Partener 1** (728x90) - Banner personalizat
8. **Banner Partener 2** (300x250) - Banner personalizat

### 6. Bannere Demo Incluse

Bannerele demo sunt create pentru:
- **Zbor.md** - Bilete de avion
- **Zbor24.ro** - Turism și călătorii
- **Oozh.com** - Experiențe de călătorie

Toate bannerele demo au design personalizat cu:
- Gradienturi colorate
- Iconuri SVG
- Animații CSS
- Link-uri către site-urile respective
- Dimensiuni corespunzătoare fiecărei zone

### 7. Rezultat

✅ **Control complet** asupra tuturor zonelor de publicitate
✅ **3 moduri** pentru fiecare zonă
✅ **Bannere demo** profesionale pentru agenții de turism
✅ **Salvare automată** în localStorage
✅ **Interface intuitivă** cu butoane colorate
✅ **Actualizare în timp real** a statusului

**Această soluție îți oferă control total asupra publicității pe site, cu opțiuni demo profesionale pentru agenții de turism!**