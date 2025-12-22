/**
 * AirlineLogo - Componentă pentru afișarea logo-ului companiei aeriene
 * Cu fallback la inițiale dacă logo-ul nu se încarcă
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
  const [imageError, setImageError] = useState(false)
  const airlineInfo = getAirlineInfo(airlineCode)
  
  const displayName = airlineName || airlineInfo.name
  const logoUrl = airlineInfo.logo

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

  // If no logo URL available, show fallback
  if (!logoUrl || imageError) {
    return showName ? (
      <div className="flex items-center space-x-2">
        <FallbackLogo />
        {showName && (
          <span className="text-sm font-medium text-gray-900">
            {displayName}
          </span>
        )}
      </div>
    ) : (
      <FallbackLogo />
    )
  }

  // Show logo with fallback on error
  const LogoImage = () => (
    <img
      src={logoUrl}
      alt={`${displayName} logo`}
      className={`${sizeClasses[size]} object-contain rounded-lg shadow-sm ${className}`}
      onError={() => setImageError(true)}
      loading="lazy"
    />
  )

  return showName ? (
    <div className="flex items-center space-x-2">
      <LogoImage />
      <span className="text-sm font-medium text-gray-900">
        {displayName}
      </span>
    </div>
  ) : (
    <LogoImage />
  )
}

export default AirlineLogo