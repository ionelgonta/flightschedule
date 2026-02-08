import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import '../globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Boarding Pass Manager - Anyway.ro',
  description: 'Procesează boarding pass-uri PDF și generează link-uri Google Wallet.',
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
  return <>{children}</>
}