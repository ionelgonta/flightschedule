import { MetadataRoute } from 'next'
import { MAJOR_AIRPORTS } from '@/lib/airports'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://anyway.ro'
  
  // Static pages
  const staticPages = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 1,
    },
    {
      url: `${baseUrl}/aeroporturi`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/airports`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/despre`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    },
    {
      url: `${baseUrl}/analize`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/statistici-aeroporturi`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/program-zboruri`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/parcari-otopeni`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    },
    {
      url: `${baseUrl}/analize-istorice`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    },
    {
      url: `${baseUrl}/analize-rute`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    },
    {
      url: `${baseUrl}/program-saptamanal`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    },
    {
      url: `${baseUrl}/cautare`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    },
    {
      url: `${baseUrl}/search`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    },
    {
      url: `${baseUrl}/aeronave`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    },
    {
      url: `${baseUrl}/planificator-zboruri`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    },
  ]

  // Airport pages - Romanian URLs
  const romanianAirportPages = MAJOR_AIRPORTS.flatMap(airport => {
    const slug = airport.name.toLowerCase()
      .replace(/aeroportul internațional /gi, '')
      .replace(/aeroportul /gi, '')
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
    
    const citySlug = airport.city.toLowerCase()
      .replace(/ă/g, 'a').replace(/â/g, 'a').replace(/î/g, 'i')
      .replace(/ș/g, 's').replace(/ț/g, 't')
      .replace(/\s+/g, '-')
    
    const airportSlug = `${citySlug}-${slug}`.replace(/--+/g, '-')
    
    return [
      {
        url: `${baseUrl}/aeroport/${airportSlug}`,
        lastModified: new Date(),
        changeFrequency: 'daily' as const,
        priority: 0.9,
      },
      {
        url: `${baseUrl}/aeroport/${airportSlug}/sosiri`,
        lastModified: new Date(),
        changeFrequency: 'hourly' as const,
        priority: 0.8,
      },
      {
        url: `${baseUrl}/aeroport/${airportSlug}/plecari`,
        lastModified: new Date(),
        changeFrequency: 'hourly' as const,
        priority: 0.8,
      },
      {
        url: `${baseUrl}/aeroport/${airportSlug}/statistici`,
        lastModified: new Date(),
        changeFrequency: 'daily' as const,
        priority: 0.7,
      },
      {
        url: `${baseUrl}/aeroport/${airportSlug}/program-zboruri`,
        lastModified: new Date(),
        changeFrequency: 'daily' as const,
        priority: 0.7,
      },
      {
        url: `${baseUrl}/aeroport/${airportSlug}/istoric-zboruri`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.6,
      },
      {
        url: `${baseUrl}/aeroport/${airportSlug}/analize-zboruri`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.6,
      },
    ]
  })

  // English airport pages for international SEO
  const englishAirportPages = MAJOR_AIRPORTS.flatMap(airport => [
    {
      url: `${baseUrl}/airport/${airport.code.toLowerCase()}`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/airport/${airport.code.toLowerCase()}/arrivals`,
      lastModified: new Date(),
      changeFrequency: 'hourly' as const,
      priority: 0.7,
    },
    {
      url: `${baseUrl}/airport/${airport.code.toLowerCase()}/departures`,
      lastModified: new Date(),
      changeFrequency: 'hourly' as const,
      priority: 0.7,
    },
  ])

  return [...staticPages, ...romanianAirportPages, ...englishAirportPages]
}