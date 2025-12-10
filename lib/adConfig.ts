export const adConfig = {
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
export const toggleAdZone = (zone: keyof typeof adConfig.zones, active: boolean) => {
  adConfig.zones[zone].active = active
}

// Helper function to set custom HTML for partner banners
export const setCustomBanner = (zone: keyof typeof adConfig.zones, html: string) => {
  adConfig.zones[zone].customHtml = html
  adConfig.zones[zone].active = true
}