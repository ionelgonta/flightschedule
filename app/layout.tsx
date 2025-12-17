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
  description: 'Platforma românească #1 pentru monitorizarea zborurilor în timp real. Informații complete despre sosiri și plecări de la toate aeroporturile din România și Moldova: OTP Otopeni, CLJ Cluj, TSR Timișoara, IAS Iași, RMO Chișinău. Date actualizate la fiecare minut, statistici detaliate și analize complete.',
  keywords: [
    'orarul zborurilor romania',
    'aeroporturi romania timp real', 
    'zboruri otopeni live',
    'zboruri cluj napoca',
    'zboruri timisoara',
    'zboruri iasi',
    'zboruri chisinau moldova',
    'sosiri plecari aeroporturi',
    'informatii zboruri romania',
    'program zboruri romania',
    'statusuri zboruri',
    'intarzieri zboruri',
    'monitorizare aviatie romania',
    'OTP BBU CLJ TSR IAS CND SBZ RMO',
    'flight tracker romania',
    'aeroportul henri coanda',
    'aeroportul cluj napoca',
    'aeroportul timisoara',
    'aeroportul iasi',
    'aeroportul chisinau'
  ],
  authors: [{ name: 'Orarul Zborurilor România' }],
  creator: 'Orarul Zborurilor România',
  publisher: 'Orarul Zborurilor România',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://anyway.ro'),
  alternates: {
    canonical: '/',
    languages: {
      'ro': 'https://anyway.ro',
      'x-default': 'https://anyway.ro'
    }
  },
  openGraph: {
    type: 'website',
    locale: 'ro_RO',
    url: 'https://anyway.ro',
    title: 'Orarul Zborurilor România - Informații Zboruri în Timp Real',
    description: 'Platforma românească pentru monitorizarea zborurilor în timp real din toate aeroporturile majore din România și Moldova. Informații actualizate la fiecare minut, statistici detaliate și analize complete.',
    siteName: 'Orarul Zborurilor România',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Orarul Zborurilor România - Monitorizare Zboruri în Timp Real'
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Orarul Zborurilor România - Informații Zboruri în Timp Real',
    description: 'Platforma românească pentru monitorizarea zborurilor în timp real din România și Moldova.',
    creator: '@zboruriromania',
    images: ['/twitter-image.jpg']
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
  verification: {
    google: 'your-google-verification-code',
  },
  category: 'Travel & Transportation'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="google-adsense-account" content="ca-pub-2305349540791838" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <AdSenseScript />
      </head>
      <body className={inter.className}>
        <ThemeProvider>
          <FlightSchedulerProvider>
            <div className="min-h-screen bg-surface transition-colors duration-200">
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