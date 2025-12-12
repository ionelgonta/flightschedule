import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/components/ThemeProvider'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { AdSenseScript } from '@/components/ads/AdSenseScript'
import { FlightSchedulerProvider } from '@/components/FlightSchedulerProvider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: {
    default: 'Orarul Zborurilor România - Informații Zboruri în Timp Real',
    template: '%s | Orarul Zborurilor România'
  },
  description: 'Informații complete și în timp real despre zborurile din România și Moldova. Monitorizează sosirile și plecările de la aeroporturile OTP Otopeni, CLJ Cluj, TSR Timișoara, IAS Iași, RMO Chișinău și toate aeroporturile românești.',
  keywords: ['orarul zborurilor', 'aeroporturi romania', 'zboruri otopeni', 'zboruri cluj', 'zboruri timisoara', 'zboruri iasi', 'zboruri chisinau', 'sosiri plecari', 'informatii zboruri', 'OTP', 'CLJ', 'TSR', 'IAS', 'RMO'],
  authors: [{ name: 'Flight Schedule' }],
  creator: 'Flight Schedule',
  publisher: 'Flight Schedule',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://anyway.ro'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'ro_RO',
    url: 'https://anyway.ro',
    title: 'Orarul Zborurilor România - Informații Zboruri în Timp Real',
    description: 'Informații în timp real despre sosirile și plecările zborurilor din aeroporturile majore din România și Moldova. Urmărește zborurile, verifică statusul și obține informații detaliate.',
    siteName: 'Orarul Zborurilor România',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Orarul Zborurilor România - Informații Zboruri în Timp Real',
    description: 'Informații în timp real despre zborurile din România și Moldova.',
    creator: '@zboruriromania',
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
          <FlightSchedulerProvider>
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
              <Navbar />
              <main className="pt-16">
                {children}
              </main>
              <Footer />
            </div>
          </FlightSchedulerProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}