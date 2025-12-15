#!/usr/bin/env pwsh

Write-Host "Fixing Demo Ads on Live Server" -ForegroundColor Cyan
Write-Host "==============================" -ForegroundColor Cyan

$SERVER = "anyway.ro"
$USER = "root"
$REMOTE_PATH = "/opt/anyway-flight-schedule"

Write-Host "`nStep 1: Checking current AdBanner component..." -ForegroundColor Yellow

# Check if AdBanner loads config correctly
ssh "${USER}@${SERVER}" "grep -A 5 -B 5 'loadAdConfig' ${REMOTE_PATH}/components/ads/AdBanner.tsx"

Write-Host "`nStep 2: Updating AdBanner to force config reload..." -ForegroundColor Yellow

# Create a fixed version of AdBanner that forces config reload
$fixedAdBanner = @'
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

  useEffect(() => {
    // Load saved config and force refresh
    loadAdConfig()
    
    // Check localStorage for demo state
    const demoEnabled = localStorage.getItem('demoAdsEnabled')
    if (demoEnabled === 'true') {
      // Force demo mode if enabled
      adConfig.zones[slot].mode = 'demo'
    }
    
    setConfig(adConfig.zones[slot])
    
    // Debug logging
    console.log(`AdBanner ${slot}:`, {
      mode: adConfig.zones[slot].mode,
      demoEnabled: demoEnabled,
      hasDemoHtml: !!adConfig.zones[slot].demoHtml
    })
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

  // If mode is demo, show demo banner
  if (config.mode === 'demo') {
    console.log(`Rendering demo banner for ${slot}:`, config.demoHtml?.substring(0, 100))
    return (
      <div 
        className={`ad-banner demo-banner ${className}`}
        style={{ display: 'flex', justifyContent: 'center', margin: '10px 0' }}
        dangerouslySetInnerHTML={{ __html: config.demoHtml || '' }}
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
'@

# Write the fixed AdBanner to a temporary file
$fixedAdBanner | Out-File -FilePath "AdBanner-fixed.tsx" -Encoding UTF8

Write-Host "Uploading fixed AdBanner component..." -ForegroundColor White
scp "AdBanner-fixed.tsx" "${USER}@${SERVER}:${REMOTE_PATH}/components/ads/AdBanner.tsx"

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Fixed AdBanner uploaded successfully" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to upload fixed AdBanner" -ForegroundColor Red
    exit 1
}

Write-Host "`nStep 3: Rebuilding and restarting..." -ForegroundColor Yellow

ssh "${USER}@${SERVER}" "cd ${REMOTE_PATH} && npm run build && pm2 restart anyway-ro"

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Server rebuilt and restarted successfully" -ForegroundColor Green
} else {
    Write-Host "❌ Server rebuild failed" -ForegroundColor Red
}

# Cleanup
Remove-Item "AdBanner-fixed.tsx" -ErrorAction SilentlyContinue

Write-Host "`n🎉 Demo Ads Fix Applied!" -ForegroundColor Green
Write-Host "========================" -ForegroundColor Green

Write-Host "`n📋 Test Instructions:" -ForegroundColor Cyan
Write-Host "1. Go to https://anyway.ro/admin" -ForegroundColor White
Write-Host "2. Enable demo ads toggle" -ForegroundColor White
Write-Host "3. Open browser console (F12)" -ForegroundColor White
Write-Host "4. Look for AdBanner debug logs" -ForegroundColor White
Write-Host "5. Visit https://anyway.ro to see demo banners" -ForegroundColor White

Write-Host "Demo ads should now appear on the live site" -ForegroundColor Green