type AdMode = 'active' | 'inactive'

interface AdZone {
  mode: AdMode
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
  // AdSense Publisher ID for site verification and ads
  publisherId: 'ca-pub-2305349540791838',
  
  zones: {
    'header-banner': {
      mode: 'inactive',
      slotId: '1234567890',
      size: '728x90',
      customHtml: undefined
    },
    'sidebar-right': {
      mode: 'inactive',
      slotId: '1234567891',
      size: '300x600',
      customHtml: undefined
    },
    'sidebar-square': {
      mode: 'inactive',
      slotId: '1234567892',
      size: '300x250',
      customHtml: undefined
    },
    'inline-banner': {
      mode: 'inactive',
      slotId: '1234567893',
      size: '728x90',
      customHtml: undefined
    },
    'footer-banner': {
      mode: 'inactive',
      slotId: '1234567894',
      size: '970x90',
      customHtml: undefined
    },
    'mobile-banner': {
      mode: 'inactive',
      slotId: '1234567895',
      size: '320x50',
      customHtml: undefined
    },
    'partner-banner-1': {
      mode: 'inactive',
      slotId: '',
      size: '728x90',
      customHtml: undefined
    },
    'partner-banner-2': {
      mode: 'inactive',
      slotId: '',
      size: '300x250',
      customHtml: undefined
    }
  }
}

// Helper function to set ad zone mode
export const setAdZoneMode = (zone: keyof typeof adConfig.zones, mode: AdMode): void => {
  adConfig.zones[zone].mode = mode
  // Salvează în localStorage pentru persistență
  if (typeof window !== 'undefined') {
    localStorage.setItem('adConfig', JSON.stringify(adConfig))
  }
}

// Helper function to toggle ad zones (backward compatibility)
export const toggleAdZone = (zone: keyof typeof adConfig.zones, active: boolean): void => {
  adConfig.zones[zone].mode = active ? 'active' : 'inactive'
  // Salvează în localStorage pentru persistență
  if (typeof window !== 'undefined') {
    localStorage.setItem('adConfig', JSON.stringify(adConfig))
  }
}

// Helper function to set custom HTML for partner banners
export const setCustomBanner = (zone: keyof typeof adConfig.zones, html: string): void => {
  adConfig.zones[zone].customHtml = html
  adConfig.zones[zone].mode = html.length > 0 ? 'active' : 'inactive'
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