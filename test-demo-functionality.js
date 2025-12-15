// Test script pentru funcționalitatea demo ads
// Rulează în browser console pe pagina /admin

console.log('🎨 Testing Demo Ads Functionality');

// Test 1: Verifică dacă toggle-ul există
const demoToggle = document.querySelector('input[type="checkbox"]');
if (demoToggle) {
    console.log('✅ Demo toggle found');
} else {
    console.log('❌ Demo toggle not found');
}

// Test 2: Verifică localStorage pentru demo state
const demoState = localStorage.getItem('demoAdsEnabled');
console.log('📱 Demo state in localStorage:', demoState);

// Test 3: Verifică adConfig în localStorage
const adConfigState = localStorage.getItem('adConfig');
if (adConfigState) {
    try {
        const config = JSON.parse(adConfigState);
        console.log('📋 AdConfig zones:', Object.keys(config.zones));
        
        // Verifică dacă zonele au demoHtml
        const zonesWithDemo = Object.keys(config.zones).filter(zone => 
            config.zones[zone].demoHtml && config.zones[zone].demoHtml.length > 0
        );
        console.log('🎯 Zones with demo HTML:', zonesWithDemo);
        
        // Verifică brandurile în demo HTML
        const brands = ['zbor.md', 'zbor24.ro', 'oozh.com'];
        brands.forEach(brand => {
            const found = Object.values(config.zones).some(zone => 
                zone.demoHtml && zone.demoHtml.toLowerCase().includes(brand)
            );
            console.log(`🏷️ Brand ${brand}:`, found ? '✅ Found' : '❌ Not found');
        });
        
    } catch (error) {
        console.log('❌ Error parsing adConfig:', error);
    }
} else {
    console.log('❌ AdConfig not found in localStorage');
}

// Test 4: Simulează activarea demo mode
console.log('🔄 Simulating demo mode activation...');

// Funcție pentru a activa demo mode (copiază din admin page)
function activateDemoMode() {
    const config = JSON.parse(localStorage.getItem('adConfig') || '{}');
    if (config.zones) {
        Object.keys(config.zones).forEach(zone => {
            config.zones[zone].mode = 'demo';
        });
        localStorage.setItem('adConfig', JSON.stringify(config));
        localStorage.setItem('demoAdsEnabled', 'true');
        console.log('✅ Demo mode activated');
        return true;
    }
    return false;
}

// Funcție pentru a dezactiva demo mode
function deactivateDemoMode() {
    const config = JSON.parse(localStorage.getItem('adConfig') || '{}');
    if (config.zones) {
        Object.keys(config.zones).forEach(zone => {
            config.zones[zone].mode = 'active';
        });
        localStorage.setItem('adConfig', JSON.stringify(config));
        localStorage.setItem('demoAdsEnabled', 'false');
        console.log('✅ Demo mode deactivated');
        return true;
    }
    return false;
}

// Exportă funcțiile pentru testare manuală
window.testDemoAds = {
    activate: activateDemoMode,
    deactivate: deactivateDemoMode,
    checkState: () => {
        console.log('Demo enabled:', localStorage.getItem('demoAdsEnabled'));
        const config = JSON.parse(localStorage.getItem('adConfig') || '{}');
        if (config.zones) {
            Object.keys(config.zones).forEach(zone => {
                console.log(`Zone ${zone}:`, config.zones[zone].mode);
            });
        }
    }
};

console.log('🚀 Test complete! Use window.testDemoAds.activate() or window.testDemoAds.deactivate() to test manually.');
console.log('📋 Use window.testDemoAds.checkState() to check current state.');