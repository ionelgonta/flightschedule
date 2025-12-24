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
  const [isActive, setIsActive] = useState(false)
  const [adLoaded, setAdLoaded] = useState(false)

  useEffect(() => {
    // Load saved config
    loadAdConfig()
    
    // Always disable demo mode - no demo banners
    localStorage.setItem('demoAdsEnabled', 'false')
    const updatedConfig = adConfig.zones[slot]
    setConfig(updatedConfig)
    setIsActive(updatedConfig.mode === 'active')
    
    console.log(`AdBanner ${slot}: mode=${updatedConfig.mode}, isActive=${updatedConfig.mode === 'active'}`)
    
    setMounted(true)
  }, [slot])

  useEffect(() => {
    if (!mounted || !isActive || !adRef.current || adLoaded) return

    // Use requestIdleCallback to initialize ads only when browser is idle
    // This prevents blocking the main thread and causing "page unresponsive" errors
    const initializeAdWhenIdle = () => {
      if ('requestIdleCallback' in window) {
        requestIdleCallback(() => {
          setTimeout(() => {
            try {
              if (typeof window !== 'undefined' && window.adsbygoogle) {
                window.adsbygoogle.push({})
                setAdLoaded(true)
              }
            } catch (error) {
              console.warn('AdSense initialization error:', error)
              setAdLoaded(true) // Mark as loaded to prevent retries
            }
          }, 3000) // 3 second delay when idle
        }, { timeout: 15000 }) // Max 15 seconds wait for idle
      } else {
        // Fallback for browsers without requestIdleCallback
        setTimeout(() => {
          try {
            if (typeof window !== 'undefined' && window.adsbygoogle) {
              window.adsbygoogle.push({})
              setAdLoaded(true)
            }
          } catch (error) {
            console.warn('AdSense initialization error:', error)
            setAdLoaded(true)
          }
        }, 6000) // 6 second delay as fallback
      }
    }

    initializeAdWhenIdle()
  }, [mounted, isActive, adLoaded])

  // Don't render anything if zone is inactive
  if (!mounted || !isActive) {
    console.log(`AdBanner ${slot}: Not rendering (mounted=${mounted}, isActive=${isActive})`)
    return null
  }

  // Only render if zone is active
  return (
    <div 
      className={`ad-banner adsense-banner ${className}`} 
      ref={adRef}
      suppressHydrationWarning={true}
    >
      <ins
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={adConfig.publisherId}
        data-ad-slot={config.slotId}
        data-ad-format="auto"
        data-full-width-responsive="true"
        data-adtest={process.env.NODE_ENV === 'development' ? 'on' : 'off'}
      />
    </div>
  )
}