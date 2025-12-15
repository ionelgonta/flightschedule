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

// Simple demo content generator
function getDemoContent(slot: string): string {
  const demos = {
    'header-banner': `
      <div style="width: 728px; height: 90px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px; display: flex; align-items: center; justify-content: center; color: white; font-family: Arial, sans-serif;">
        <div style="text-align: center;">
          <div style="font-size: 18px; font-weight: bold;">ZBOR.MD</div>
          <div style="font-size: 12px; opacity: 0.9;">Bilete de avion la prețuri avantajoase</div>
        </div>
      </div>
    `,
    'sidebar-right': `
      <div style="width: 300px; height: 600px; background: linear-gradient(180deg, #ff6b6b 0%, #ee5a24 100%); border-radius: 12px; display: flex; flex-direction: column; align-items: center; justify-content: center; color: white; font-family: Arial, sans-serif; text-align: center;">
        <div style="font-size: 28px; font-weight: bold; margin-bottom: 10px;">ZBOR24.RO</div>
        <div style="font-size: 16px;">Cele mai bune oferte pentru călătorii</div>
      </div>
    `,
    'sidebar-square': `
      <div style="width: 300px; height: 250px; background: linear-gradient(45deg, #2ecc71 0%, #27ae60 100%); border-radius: 10px; display: flex; flex-direction: column; align-items: center; justify-content: center; color: white; font-family: Arial, sans-serif; text-align: center;">
        <div style="font-size: 24px; font-weight: bold; margin-bottom: 8px;">OOZH.COM</div>
        <div style="font-size: 14px;">Turism și călătorii</div>
      </div>
    `
  }
  
  return demos[slot as keyof typeof demos] || `
    <div style="width: 300px; height: 250px; background: linear-gradient(45deg, #3498db 0%, #2980b9 100%); border-radius: 8px; display: flex; align-items: center; justify-content: center; color: white; font-family: Arial, sans-serif;">
      <div style="text-align: center;">
        <div style="font-size: 16px; font-weight: bold;">DEMO AD</div>
        <div style="font-size: 12px; opacity: 0.8;">${slot}</div>
      </div>
    </div>
  `
}

export function AdBanner({ slot, size, className = '' }: AdBannerProps) {
  const adRef = useRef<HTMLDivElement>(null)
  const [config, setConfig] = useState(adConfig.zones[slot])

  useEffect(() => {
    // Load saved config
    loadAdConfig()
    
    // Check if demo mode is enabled
    const demoEnabled = localStorage.getItem('demoAdsEnabled')
    if (demoEnabled === 'true') {
      // Show demo content instead of AdSense
      setConfig({
        ...adConfig.zones[slot],
        mode: 'demo' as any
      })
    } else {
      setConfig(adConfig.zones[slot])
    }
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

  // If demo mode is enabled, show simple demo banner
  if ((config.mode as any) === 'demo') {
    const demoContent = getDemoContent(slot)
    return (
      <div 
        className={`ad-banner demo-banner ${className}`}
        style={{ display: 'flex', justifyContent: 'center', margin: '10px 0' }}
        dangerouslySetInnerHTML={{ __html: demoContent }}
      />
    )
  }



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