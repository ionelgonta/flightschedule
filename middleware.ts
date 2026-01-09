import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Redirect English URLs to Romanian URLs with proper 301 redirects
  // This consolidates all English pages to Romanian equivalents for better SEO
  
  if (pathname.startsWith('/airports')) {
    const newUrl = new URL(pathname.replace('/airports', '/aeroporturi'), request.url)
    return NextResponse.redirect(newUrl, 301)
  }

  if (pathname.startsWith('/search')) {
    const newUrl = new URL(pathname.replace('/search', '/cautare'), request.url)
    return NextResponse.redirect(newUrl, 301)
  }

  if (pathname.startsWith('/airport/')) {
    // Single redirect from /airport/... to /aeroport/... with proper slug conversion
    let newPath = pathname.replace('/airport/', '/aeroport/')
    
    // Handle arrivals/departures redirects in one step
    if (pathname.includes('/arrivals')) {
      newPath = newPath.replace('/arrivals', '/sosiri')
    } else if (pathname.includes('/departures')) {
      newPath = newPath.replace('/departures', '/plecari')
    }
    
    // Convert airport code to proper Romanian slug if needed
    // This handles cases like /airport/otp -> /aeroport/bucuresti-henri-coanda
    const airportCodeMatch = newPath.match(/\/aeroport\/([a-z]{3})(\/|$)/)
    if (airportCodeMatch) {
      const code = airportCodeMatch[1].toUpperCase()
      const airportSlugs: { [key: string]: string } = {
        'OTP': 'bucuresti-henri-coanda',
        'BBU': 'bucuresti-aurel-vlaicu', 
        'CLJ': 'cluj-napoca',
        'TSR': 'timisoara',
        'IAS': 'iasi',
        'CND': 'constanta',
        'SBZ': 'sibiu',
        'CRA': 'craiova',
        'BCM': 'bacau',
        'BAY': 'baia-mare',
        'OMR': 'oradea',
        'SCV': 'suceava',
        'TGM': 'targu-mures',
        'ARW': 'arad',
        'SUJ': 'satu-mare',
        'RMO': 'chisinau'
      }
      
      if (airportSlugs[code]) {
        newPath = newPath.replace(`/aeroport/${code.toLowerCase()}`, `/aeroport/${airportSlugs[code]}`)
      }
    }
    
    const newUrl = new URL(newPath, request.url)
    return NextResponse.redirect(newUrl, 301)
  }

  // Add security headers for better SEO and security
  const response = NextResponse.next()
  
  // Security headers
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  
  // SEO headers
  response.headers.set('X-Robots-Tag', 'index, follow')
  
  return response
}

export const config = {
  matcher: [
    '/airports/:path*',
    '/search/:path*', 
    '/airport/:path*',
    '/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)',
  ]
}