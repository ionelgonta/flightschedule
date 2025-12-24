interface StructuredDataProps {
  data: Record<string, any>
}

export function StructuredData({ data }: StructuredDataProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}

// Predefined structured data generators
export const generateOrganizationSchema = () => ({
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Orarul Zborurilor România',
  description: 'Platforma românească pentru monitorizarea zborurilor în timp real din aeroporturile majore din România și Moldova',
  url: 'https://anyway.ro',
  logo: 'https://anyway.ro/logo.png',
  foundingDate: '2024',
  areaServed: [
    {
      '@type': 'Country',
      name: 'România'
    },
    {
      '@type': 'Country', 
      name: 'Moldova'
    }
  ],
  serviceType: 'Monitorizare Zboruri în Timp Real',
  contactPoint: {
    '@type': 'ContactPoint',
    contactType: 'customer service',
    availableLanguage: 'Romanian'
  },
  sameAs: [
    'https://anyway.ro'
  ]
})

export const generateWebSiteSchema = () => ({
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'Orarul Zborurilor România',
  description: 'Informații complete și în timp real despre zborurile din România și Moldova',
  url: 'https://anyway.ro',
  potentialAction: {
    '@type': 'SearchAction',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: 'https://anyway.ro/cautare?q={search_term_string}'
    },
    'query-input': 'required name=search_term_string'
  },
  publisher: {
    '@type': 'Organization',
    name: 'Orarul Zborurilor România',
    url: 'https://anyway.ro'
  }
})

export const generateBreadcrumbSchema = (items: Array<{ name: string; url: string }>) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: items.map((item, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: item.name,
    item: item.url
  }))
})

export const generateAirportSchema = (airport: { name: string; city: string; country: string; code: string }) => ({
  '@context': 'https://schema.org',
  '@type': 'Airport',
  name: airport.name,
  iataCode: airport.code,
  address: {
    '@type': 'PostalAddress',
    addressLocality: airport.city,
    addressCountry: airport.country
  },
  url: `https://anyway.ro/aeroport/${airport.city.toLowerCase()}-${airport.name.toLowerCase().replace(/\s+/g, '-')}`,
  description: `Informații în timp real despre zborurile de la ${airport.name} (${airport.code}) din ${airport.city}, ${airport.country}`
})

export const generateFlightScheduleSchema = (airport: { name: string; city: string; code: string }) => ({
  '@context': 'https://schema.org',
  '@type': 'Schedule',
  name: `Program Zboruri ${airport.name}`,
  description: `Program complet al zborurilor de sosiri și plecări de la ${airport.name} (${airport.code})`,
  scheduleTimezone: 'Europe/Bucharest',
  provider: {
    '@type': 'Organization',
    name: 'Orarul Zborurilor România',
    url: 'https://anyway.ro'
  }
})