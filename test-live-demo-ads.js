// Script de testare pentru demo ads pe site-ul live
// Copiază și rulează în browser console pe anyway.ro

console.log('🎨 Testing Live Demo Ads Functionality');

// Test 1: Activează demo mode
function enableDemoAds() {
    localStorage.setItem('demoAdsEnabled', 'true');
    
    // Încearcă să încărce configurația existentă
    let adConfig;
    try {
        adConfig = JSON.parse(localStorage.getItem('adConfig') || '{}');
    } catch (e) {
        console.log('No existing adConfig, creating new one...');
        adConfig = { zones: {} };
    }
    
    // Definește zonele cu demo mode
    const zones = [
        'header-banner', 'sidebar-right', 'sidebar-square', 
        'inline-banner', 'footer-banner', 'mobile-banner',
        'partner-banner-1', 'partner-banner-2'
    ];
    
    zones.forEach(zone => {
        if (!adConfig.zones) adConfig.zones = {};
        if (!adConfig.zones[zone]) adConfig.zones[zone] = {};
        adConfig.zones[zone].mode = 'demo';
    });
    
    localStorage.setItem('adConfig', JSON.stringify(adConfig));
    
    console.log('✅ Demo ads enabled in localStorage');
    console.log('🔄 Reloading page to apply changes...');
    
    setTimeout(() => {
        location.reload();
    }, 1000);
}

// Test 2: Dezactivează demo mode
function disableDemoAds() {
    localStorage.setItem('demoAdsEnabled', 'false');
    
    let adConfig;
    try {
        adConfig = JSON.parse(localStorage.getItem('adConfig') || '{}');
    } catch (e) {
        adConfig = { zones: {} };
    }
    
    const zones = [
        'header-banner', 'sidebar-right', 'sidebar-square', 
        'inline-banner', 'footer-banner', 'mobile-banner',
        'partner-banner-1', 'partner-banner-2'
    ];
    
    zones.forEach(zone => {
        if (adConfig.zones && adConfig.zones[zone]) {
            adConfig.zones[zone].mode = 'active';
        }
    });
    
    localStorage.setItem('adConfig', JSON.stringify(adConfig));
    
    console.log('❌ Demo ads disabled in localStorage');
    console.log('🔄 Reloading page to apply changes...');
    
    setTimeout(() => {
        location.reload();
    }, 1000);
}

// Test 3: Verifică starea curentă
function checkDemoState() {
    const demoEnabled = localStorage.getItem('demoAdsEnabled');
    const adConfig = localStorage.getItem('adConfig');
    
    console.log('📊 Current Demo State:');
    console.log('- demoAdsEnabled:', demoEnabled);
    
    if (adConfig) {
        try {
            const config = JSON.parse(adConfig);
            console.log('- adConfig zones:', Object.keys(config.zones || {}));
            
            Object.keys(config.zones || {}).forEach(zone => {
                console.log(`  - ${zone}:`, config.zones[zone].mode);
            });
        } catch (e) {
            console.log('- adConfig: Invalid JSON');
        }
    } else {
        console.log('- adConfig: Not found');
    }
    
    // Verifică dacă există bannere demo pe pagină
    const demoBanners = document.querySelectorAll('.demo-banner');
    console.log(`- Demo banners on page: ${demoBanners.length}`);
    
    demoBanners.forEach((banner, index) => {
        console.log(`  - Banner ${index + 1}:`, banner.innerHTML.substring(0, 100) + '...');
    });
}

// Test 4: Forțează refresh al bannerelor
function forceRefreshBanners() {
    console.log('🔄 Force refreshing all ad banners...');
    
    // Trigger re-render prin modificarea DOM
    const adBanners = document.querySelectorAll('.ad-banner');
    adBanners.forEach(banner => {
        banner.style.display = 'none';
        setTimeout(() => {
            banner.style.display = '';
        }, 100);
    });
    
    console.log(`Refreshed ${adBanners.length} ad banners`);
}

// Exportă funcțiile pentru utilizare
window.demoAdsTest = {
    enable: enableDemoAds,
    disable: disableDemoAds,
    check: checkDemoState,
    refresh: forceRefreshBanners
};

console.log('🚀 Demo Ads Test Functions Available:');
console.log('- window.demoAdsTest.enable() - Activează demo ads');
console.log('- window.demoAdsTest.disable() - Dezactivează demo ads');
console.log('- window.demoAdsTest.check() - Verifică starea curentă');
console.log('- window.demoAdsTest.refresh() - Forțează refresh bannere');

// Rulează verificarea automată
checkDemoState();