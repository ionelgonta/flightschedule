import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Redirect English URLs to Romanian URLs
  if (pathname.startsWith('/airports')) {
    const newUrl = new URL(pathname.replace('/airports', '/aeroporturi'), request.url)
    return NextResponse.redirect(newUrl, 301)
  }

  if (pathname.startsWith('/search')) {
    const newUrl = new URL(pathname.replace('/search', '/cautare'), request.url)
    return NextResponse.redirect(newUrl, 301)
  }

  if (pathname.startsWith('/airport/')) {
    // Redirect /airport/... to /aeroport/...
    const newUrl = new URL(pathname.replace('/airport/', '/aeroport/'), request.url)
    
    // Also handle arrivals/departures redirects
    if (pathname.includes('/arrivals')) {
      newUrl.pathname = newUrl.pathname.replace('/arrivals', '/sosiri')
    }
    if (pathname.includes('/departures')) {
      newUrl.pathname = newUrl.pathname.replace('/departures', '/plecari')
    }
    
    return NextResponse.redirect(newUrl, 301)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/airports/:path*',
    '/search/:path*',
    '/airport/:path*'
  ]
}