'use client'

import { useEffect, useState } from 'react'

declare global {
  interface Window {
    adsbygoogle: any[]
    adsenseLoaded?: boolean
  }
}

export function AdSenseManager() {
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    // Prevent multiple loads
    if (window.adsenseLoaded) {
      setIsLoaded(true)
      return
    }

    // Initialize AdSense array if not exists
    if (!window.adsbygoogle) {
      window.adsbygoogle = []
    }

    // Add timeout to prevent indefinite blocking
    const timeout = setTimeout(() => {
      console.warn('AdSense loading timeout - continuing without ads')
      setIsLoaded(true)
    }, 10000) // 10 second timeout

    // Listen for AdSense script load
    const checkAdSense = () => {
      if (window.adsbygoogle && Array.isArray(window.adsbygoogle)) {
        clearTimeout(timeout)
        window.adsenseLoaded = true
        setIsLoaded(true)
      }
    }

    // Check periodically
    const interval = setInterval(checkAdSense, 500)

    // Cleanup
    return () => {
      clearTimeout(timeout)
      clearInterval(interval)
    }
  }, [])

  return null // This component doesn't render anything
}