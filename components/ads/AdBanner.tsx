'use client'

import { useEffect, useRef } from 'react'
import { adConfig } from '@/lib/adConfig'

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
  const config = adConfig.zones[slot]

  useEffect(() => {
    if (!config.active || !adRef.current) return

    try {
      // Initialize AdSense
      if (typeof window !== 'undefined' && window.adsbygoogle) {
        window.adsbygoogle.push({})
      }
    } catch (error) {
      console.error('AdSense error:', error)
    }
  }, [config.active])

  if (!config.active) {
    return null
  }

  // If custom HTML is provided, use it
  if (config.customHtml) {
    return (
      <div 
        className={`ad-banner ${className}`}
        dangerouslySetInnerHTML={{ __html: config.customHtml }}
      />
    )
  }

  // Default AdSense banner
  return (
    <div className={`ad-banner ${className}`} ref={adRef}>
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