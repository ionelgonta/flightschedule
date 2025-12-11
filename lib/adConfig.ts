interface AdZone {
  active: boolean
  slotId: string
  size: string
  customHtml?: string
}

interface AdConfig {
  publisherId: string
  zones: {
    'header-banner': AdZone
    'sidebar-right': AdZone
    'sidebar-square': AdZone
    'inline-banner': AdZone
    'footer-banner': AdZone
    'mobile-banner': AdZone
    'partner-banner-1': AdZone
    'partner-banner-2': AdZone
  }
}

export const adConfig: AdConfig = {
  // Replace with your actual AdSense publisher ID
  publisherId: 'ca-pub-XXXXXXXXXXXXXXXX',
  
  zones: {
    'header-banner': {
      active: true,
      slotId: '1234567890',
      size: '728x90',
      customHtml: undefined
    },
    'sidebar-right': {
      active: true,
      slotId: '1234567891',
      size: '300x600',
      customHtml: undefined
    },
    'sidebar-square': {
      active: true,
      slotId: '1234567892',
      size: '300x250',
      customHtml: undefined
    },
    'inline-banner': {
      active: true,
      slotId: '1234567893',
      size: '728x90',
      customHtml: undefined
    },
    'footer-banner': {
      active: true,
      slotId: '1234567894',
      size: '970x90',
      customHtml: undefined
    },
    'mobile-banner': {
      active: true,
      slotId: '1234567895',
      size: '320x50',
      customHtml: undefined
    },
    // Partner banner zones (can be activated with custom HTML)
    'partner-banner-1': {
      active: false,
      slotId: '',
      size: '728x90',
      customHtml: undefined
      // Example custom HTML:
      // customHtml: '<a href="https://partner.com" target="_blank"><img src="/partner-banner.jpg" alt="Partner" class="w-full h-auto" /></a>'
    },
    'partner-banner-2': {
      active: false,
      slotId: '',
      size: '300x250',
      customHtml: undefined
    }
  }
}

// Helper function to toggle ad zones
export const toggleAdZone = (zone: keyof typeof adConfig.zones, active: boolean): void => {
  adConfig.zones[zone].active = active
  // Salvează în localStorage pentru persistență
  if (typeof window !== 'undefined') {
    localStorage.setItem('adConfig', JSON.stringify(adConfig))
  }
}

// Helper function to set custom HTML for partner banners
export const setCustomBanner = (zone: keyof typeof adConfig.zones, html: string): void => {
  adConfig.zones[zone].customHtml = html
  adConfig.zones[zone].active = html.length > 0
  // Salvează în localStorage pentru persistență
  if (typeof window !== 'undefined') {
    localStorage.setItem('adConfig', JSON.stringify(adConfig))
  }
}

// Helper function to load config from localStorage
export const loadAdConfig = (): void => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('adConfig')
    if (saved) {
      try {
        const savedConfig = JSON.parse(saved)
        Object.assign(adConfig.zones, savedConfig.zones)
      } catch (error) {
        console.error('Error loading ad config:', error)
      }
    }
  }
}

// Initialize config on load
if (typeof window !== 'undefined') {
  loadAdConfig()
}