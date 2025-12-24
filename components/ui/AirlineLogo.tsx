/**
 * AirlineLogo - Componentă pentru afișarea logo-ului companiei aeriene
 * Cu fallback inteligent: GitHub → Wikimedia Commons → Inițiale
 */

'use client'

import { useState } from 'react'
import { getAirlineInfo } from '@/lib/airlineMapping'
import { Plane } from 'lucide-react'

interface AirlineLogoProps {
  airlineCode: string
  airlineName?: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
  showName?: boolean
}

export function AirlineLogo({ 
  airlineCode, 
  airlineName, 
  size = 'md', 
  className = '',
  showName = false 
}: AirlineLogoProps) {
  const [primaryError, setPrimaryError] = useState(false)
  const [fallbackError, setFallbackError] = useState(false)
  const airlineInfo = getAirlineInfo(airlineCode || '')
  
  const displayName = airlineName || airlineInfo.name
  const primaryLogoUrl = airlineInfo.logo

  // Wikimedia Commons fallback URLs for major airlines
  const wikimediaFallbacks: { [key: string]: string } = {
    'RO': 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6a/Tarom_logo.svg/200px-Tarom_logo.svg.png',
    '0B': 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7f/Blue_Air_logo.svg/200px-Blue_Air_logo.svg.png',
    'W4': 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/Wizz_Air_logo.svg/200px-Wizz_Air_logo.svg.png',
    'W6': 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/Wizz_Air_logo.svg/200px-Wizz_Air_logo.svg.png',
    'FR': 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/bb/Ryanair_logo.svg/200px-Ryanair_logo.svg.png',
    'LH': 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b8/Lufthansa_Logo_2018.svg/200px-Lufthansa_Logo_2018.svg.png',
    'AF': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/44/Air_France_Logo.svg/200px-Air_France_Logo.svg.png',
    'KL': 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c7/KLM_logo.svg/200px-KLM_logo.svg.png',
    'BA': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/42/British_Airways_Logo.svg/200px-British_Airways_Logo.svg.png',
    'TK': 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/09/Turkish_Airlines_logo_2019_compact.svg/200px-Turkish_Airlines_logo_2019_compact.svg.png',
    'QR': 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9b/Qatar_Airways_Logo.svg/200px-Qatar_Airways_Logo.svg.png',
    'EK': 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d0/Emirates_logo.svg/200px-Emirates_logo.svg.png',
    'U2': 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2d/EasyJet_logo.svg/200px-EasyJet_logo.svg.png',
    'VY': 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/71/Vueling_logo-2013.svg/200px-Vueling_logo-2013.svg.png'
  }

  const fallbackLogoUrl = airlineCode ? wikimediaFallbacks[airlineCode.toUpperCase()] : undefined

  // Size configurations
  const sizeClasses = {
    sm: 'w-6 h-6 text-xs',
    md: 'w-8 h-8 text-sm', 
    lg: 'w-12 h-12 text-base'
  }

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-6 w-6'
  }

  // Generate initials from airline name
  const getInitials = (name: string) => {
    if (!name) return 'XX' // Fallback pentru nume undefined
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .substring(0, 2)
      .toUpperCase()
  }

  const initials = getInitials(displayName)

  // Fallback component when no logo or error loading
  const FallbackLogo = () => (
    <div className={`${sizeClasses[size]} bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center text-white font-semibold shadow-sm ${className}`}>
      {initials.length > 0 ? (
        <span className="font-bold">{initials}</span>
      ) : (
        <Plane className={iconSizes[size]} />
      )}
    </div>
  )

  // Primary logo component (GitHub)
  const PrimaryLogo = () => (
    <img
      src={primaryLogoUrl || ''}
      alt={`${displayName} logo`}
      className={`${sizeClasses[size]} object-contain rounded-lg shadow-sm ${className}`}
      onError={() => setPrimaryError(true)}
      loading="lazy"
    />
  )

  // Fallback logo component (Wikimedia Commons)
  const SecondaryLogo = () => (
    <img
      src={fallbackLogoUrl || ''}
      alt={`${displayName} logo`}
      className={`${sizeClasses[size]} object-contain rounded-lg shadow-sm ${className}`}
      onError={() => setFallbackError(true)}
      loading="lazy"
    />
  )

  // Determine which logo to show
  const LogoComponent = () => {
    // If primary logo failed and we have a fallback, try fallback
    if (primaryError && fallbackLogoUrl && !fallbackError) {
      return <SecondaryLogo />
    }
    
    // If both failed or no logo available, show initials
    if (primaryError || !primaryLogoUrl) {
      return <FallbackLogo />
    }
    
    // Show primary logo
    return <PrimaryLogo />
  }

  return showName ? (
    <div className="flex items-center space-x-2">
      <LogoComponent />
      <span className="text-sm font-medium text-gray-900">
        {displayName}
      </span>
    </div>
  ) : (
    <LogoComponent />
  )
}

export default AirlineLogo