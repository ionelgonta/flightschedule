/**
 * Flight utility functions
 */

/**
 * Format delay in Romanian language
 * @param delay - Delay in minutes (positive for late, negative for early)
 * @returns Formatted delay string in Romanian
 */
export function formatDelayInRomanian(delay: number | null | undefined): string {
  if (!delay || delay === 0) {
    return 'La timp'
  }
  
  if (delay > 0) {
    if (delay === 1) {
      return `Întârziere de ${delay} minut`
    } else if (delay < 20) {
      return `Întârziere de ${delay} minute`
    } else {
      return `Întârziere de ${delay} de minute`
    }
  } else {
    const earlyMinutes = Math.abs(delay)
    if (earlyMinutes === 1) {
      return `Devreme cu ${earlyMinutes} minut`
    } else if (earlyMinutes < 20) {
      return `Devreme cu ${earlyMinutes} minute`
    } else {
      return `Devreme cu ${earlyMinutes} de minute`
    }
  }
}

/**
 * Format date in Romanian format (e.g., "20 decembrie")
 * @param dateString - Date string or Date object
 * @returns Formatted date string in Romanian
 */
export function formatDateInRomanian(dateString: string | Date): string {
  try {
    const date = new Date(dateString)
    
    const romanianMonths = [
      'ianuarie', 'februarie', 'martie', 'aprilie', 'mai', 'iunie',
      'iulie', 'august', 'septembrie', 'octombrie', 'noiembrie', 'decembrie'
    ]
    
    const day = date.getDate()
    const month = romanianMonths[date.getMonth()]
    
    return `${day} ${month}`
  } catch {
    return ''
  }
}

/**
 * Format time in HH:MM format
 * @param timeString - Time string
 * @returns Formatted time string
 */
export function formatTime(timeString: string): string {
  try {
    const date = new Date(timeString)
    return date.toLocaleTimeString('ro-RO', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    })
  } catch {
    return timeString
  }
}