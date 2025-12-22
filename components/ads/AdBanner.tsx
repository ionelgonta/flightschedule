'use client'

import { useEffect, useRef, useState } from 'react'
import { adConfig, loadAdConfig } from '@/lib/adConfig'

interface AdBannerProps {
  slot: keyof typeof adConfig.zones
  size?: string
  className?: string
}

declare global {
  interface Window {
    adsbygoogle: any[]
  }
}

export function AdBanner({ slot, size, className = '' }: AdBannerProps) {
  const adRef = useRef<HTMLDivElement>(null)
  const [config, setConfig] = useState(adConfig.zones[slot])
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // Load saved config
    loadAdConfig()
    
    // Always disable demo mode - no demo banners
    localStorage.setItem('demoAdsEnabled', 'false')
    setConfig(adConfig.zones[slot])
    
    setMounted(true)
  }, [slot])

  useEffect(() => {
    if (config.mode !== 'active' || !adRef.current) return

    try {
      // Initialize AdSense
      if (typeof window !== 'undefined' && window.adsbygoogle) {
        window.adsbygoogle.push({})
      }
    } catch (error) {
      console.error('AdSense error:', error)
    }
  }, [config.mode])

  // If mode is inactive, don't show anything
  if (config.mode === 'inactive') {
    return null
  }

  // During SSR or before mounting, always render AdSense banner to prevent hydration mismatch
  if (!mounted) {
    return (
      <div className={`ad-banner adsense-banner ${className}`} ref={adRef}>
        <ins
          className="adsbygoogle"
          style={{ display: 'block' }}
          data-ad-client={adConfig.publisherId}
          data-ad-slot={config.slotId}
          data-ad-format="auto"
          data-full-width-responsive="true"
        />
      </div>
    )
  }

  // After mounting, only show AdSense or custom banners (no demo mode)
  // If custom HTML is provided for active mode, use it
  if (config.customHtml && config.mode === 'active') {
    return (
      <div 
        className={`ad-banner custom-banner ${className}`}
        dangerouslySetInnerHTML={{ __html: config.customHtml }}
      />
    )
  }

  // Default AdSense banner for active mode
  return (
    <div className={`ad-banner adsense-banner ${className}`} ref={adRef}>
      <ins
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={adConfig.publisherId}
        data-ad-slot={config.slotId}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  )
}