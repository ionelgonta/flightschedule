import { MetadataRoute } from 'next'
import { MAJOR_AIRPORTS } from '@/lib/airports'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://flight-schedule.vercel.app'
  
  // Static pages
  const staticPages = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 1,
    },
    {
      url: `${baseUrl}/airports`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    },
  ]

  // Airport pages
  const airportPages = MAJOR_AIRPORTS.flatMap(airport => [
    {
      url: `${baseUrl}/airport/${airport.code}`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/airport/${airport.code}/arrivals`,
      lastModified: new Date(),
      changeFrequency: 'hourly' as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/airport/${airport.code}/departures`,
      lastModified: new Date(),
      changeFrequency: 'hourly' as const,
      priority: 0.8,
    },
  ])

  return [...staticPages, ...airportPages]
}