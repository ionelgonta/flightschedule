'use client'

import Script from 'next/script'
import { useEffect, useState } from 'react'
import { adConfig } from '@/lib/adConfig'

export function AdSenseScript() {
  // AdSense Publisher ID for site verification and ads
  const ADSENSE_PUBLISHER_ID = 'ca-pub-2305349540791838'
  const [shouldLoadAds, setShouldLoadAds] = useState(false)
  const [hasActiveZones, setHasActiveZones] = useState(false)
  
  useEffect(() => {
    // Check if any ad zones are active
    const checkActiveZones = () => {
      const activeZones = Object.values(adConfig.zones).filter(zone => zone.mode === 'active')
      const hasActive = activeZones.length > 0
      setHasActiveZones(hasActive)
      
      console.log(`AdSense: Found ${activeZones.length} active zones out of ${Object.keys(adConfig.zones).length}`)
      
      if (!hasActive) {
        console.log('AdSense: No active zones found - skipping script load')
        return
      }
      
      // Use requestIdleCallback to load ads only when browser is idle
      // This prevents blocking the main thread and causing "page unresponsive" errors
      const loadAdsWhenIdle = () => {
        if ('requestIdleCallback' in window) {
          requestIdleCallback(() => {
            setTimeout(() => setShouldLoadAds(true), 5000) // 5 second delay when idle
          }, { timeout: 10000 }) // Max 10 seconds wait for idle
        } else {
          // Fallback for browsers without requestIdleCallback
          setTimeout(() => setShouldLoadAds(true), 8000) // 8 second delay as fallback
        }
      }
      
      // Wait for page to be fully loaded and interactive
      if (document.readyState === 'complete') {
        loadAdsWhenIdle()
      } else {
        window.addEventListener('load', loadAdsWhenIdle, { once: true })
      }
    }
    
    checkActiveZones()
    
    return () => {
      window.removeEventListener('load', () => {})
    }
  }, [])
  
  // Only show preconnect links if we have active zones
  if (!hasActiveZones) {
    return null
  }
  
  return (
    <>
      {/* Preconnect to AdSense domains for better performance */}
      <link rel="preconnect" href="https://pagead2.googlesyndication.com" />
      <link rel="preconnect" href="https://googleads.g.doubleclick.net" />
      <link rel="preconnect" href="https://tpc.googlesyndication.com" />
      <link rel="preconnect" href="https://ams.creativecdn.com" />
      
      {shouldLoadAds && (
        <Script
          id="adsense-script"
          async
          src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_PUBLISHER_ID}`}
          crossOrigin="anonymous"
          strategy="lazyOnload"
          onError={(e) => {
            console.warn('AdSense script failed to load:', e)
          }}
          onLoad={() => {
            console.log('AdSense script loaded successfully')
          }}
        />
      )}
    </>
  )
}