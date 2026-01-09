import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import '../globals.css'
import { ThemeProvider } from '@/components/ThemeProvider'
import { AdSenseScript } from '@/components/ads/AdSenseScript'
import { FlightSchedulerProvider } from '@/components/FlightSchedulerProvider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Colibri AI Agent Tools - Boarding Pass Processor',
  description: 'Procesează boarding pass-uri PDF și generează link-uri Google Wallet cu Colibri AI Agent Tools.',
  robots: {
    index: false,
    follow: false,
  },
}

export default function BoardingPassLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      {/* Titlu centrat pentru Colibri AI Agent Tools */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-center text-gray-900">
            Colibri AI Agent Tools
          </h1>
        </div>
      </div>
      {children}
    </>
  )
}