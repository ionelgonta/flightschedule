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