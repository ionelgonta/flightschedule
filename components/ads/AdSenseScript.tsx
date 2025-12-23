'use client'

import Script from 'next/script'
import { useEffect, useState } from 'react'

export function AdSenseScript() {
  // AdSense Publisher ID for site verification and ads
  const ADSENSE_PUBLISHER_ID = 'ca-pub-2305349540791838'
  const [shouldLoadAds, setShouldLoadAds] = useState(false)
  
  useEffect(() => {
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
    
    return () => {
      window.removeEventListener('load', loadAdsWhenIdle)
    }
  }, [])
  
  // Always show preconnect links for better performance
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