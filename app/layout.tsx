import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/components/ThemeProvider'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { AdSenseScript } from '@/components/ads/AdSenseScript'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: {
    default: 'Flight Schedule - Real-Time Flight Information',
    template: '%s | Flight Schedule'
  },
  description: 'Finding reliable, real-time flight information is essential for every traveler, whether you are preparing for a departure, waiting for an arrival, or monitoring flight activity. Our platform offers continuous updates on arrivals and departures from major airports worldwide.',
  keywords: ['flight schedule', 'airport arrivals', 'airport departures', 'real-time flights', 'flight tracking', 'airline information'],
  authors: [{ name: 'Flight Schedule' }],
  creator: 'Flight Schedule',
  publisher: 'Flight Schedule',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://flight-schedule.vercel.app'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://flight-schedule.vercel.app',
    title: 'Flight Schedule - Real-Time Flight Information',
    description: 'Real-time flight arrivals and departures from major airports worldwide. Track flights, check status, and get detailed airline information.',
    siteName: 'Flight Schedule',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Flight Schedule - Real-Time Flight Information',
    description: 'Real-time flight arrivals and departures from major airports worldwide.',
    creator: '@flightschedule',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <AdSenseScript />
      </head>
      <body className={inter.className}>
        <ThemeProvider>
          <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
            <Navbar />
            <main className="pt-16">
              {children}
            </main>
            <Footer />
          </div>
        </ThemeProvider>
      </body>
    </html>
  )
}