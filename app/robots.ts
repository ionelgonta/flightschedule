import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/admin/',
          '/_next/',
          '/debug/',
          '*.json',
          '/backup*',
          '/data/',
          '/scripts/',
          '/test*',
          '/fix*'
        ],
      }
    ],
    sitemap: 'https://anyway.ro/sitemap.xml',
    host: 'https://anyway.ro'
  }
}