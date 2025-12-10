import Link from 'next/link'
import { Plane } from 'lucide-react'
import { AdBanner } from './ads/AdBanner'

export function Footer() {
  return (
    <footer className="bg-gray-900 text-white">
      {/* Footer Banner Ad */}
      <div className="border-b border-gray-800">
        <AdBanner 
          slot="footer-banner"
          size="970x90"
          className="max-w-7xl mx-auto"
        />
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <div className="p-2 bg-primary-600 rounded-lg">
                <Plane className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold">Flight Schedule</span>
            </div>
            <p className="text-gray-400 mb-4 max-w-md">
              Finding reliable, real-time flight information is essential for every traveler. 
              Our platform offers continuous updates on arrivals and departures from major airports worldwide.
            </p>
            <p className="text-sm text-gray-500">
              © 2024 Flight Schedule. All rights reserved.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-gray-400 hover:text-white transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/airports" className="text-gray-400 hover:text-white transition-colors">
                  Airports
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-gray-400 hover:text-white transition-colors">
                  About
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-gray-400 hover:text-white transition-colors">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Popular Airports */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Popular Airports</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/airport/JFK" className="text-gray-400 hover:text-white transition-colors">
                  JFK - New York
                </Link>
              </li>
              <li>
                <Link href="/airport/LAX" className="text-gray-400 hover:text-white transition-colors">
                  LAX - Los Angeles
                </Link>
              </li>
              <li>
                <Link href="/airport/LHR" className="text-gray-400 hover:text-white transition-colors">
                  LHR - London
                </Link>
              </li>
              <li>
                <Link href="/airport/CDG" className="text-gray-400 hover:text-white transition-colors">
                  CDG - Paris
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
          <p className="text-sm">
            Flight information is provided for informational purposes only. 
            Please verify with airlines for the most current information.
          </p>
        </div>
      </div>
    </footer>
  )
}