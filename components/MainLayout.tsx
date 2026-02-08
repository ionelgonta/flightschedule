'use client';

import { usePathname } from 'next/navigation';
import { Navbar } from './Navbar';
import { Footer } from './Footer';

interface MainLayoutProps {
  children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const pathname = usePathname();
  
  // Don't show navigation and footer for boarding-pass pages
  const isBoardingPassPage = pathname?.startsWith('/boarding-pass');
  
  if (isBoardingPassPage) {
    return <>{children}</>;
  }
  
  return (
    <div className="min-h-screen relative">
      {/* Subtle dots overlay (weather-app style) */}
      <div className="weather-dots-bg" aria-hidden>
        {[...Array(20)].map((_, i) => (
          <span
            key={i}
            className="absolute w-1.5 h-1.5 rounded-full bg-white/40 animate-weather-dots"
            style={{
              left: `${3 + (i * 5)}%`,
              top: 0,
              animationDelay: `${i * 0.5}s`,
              animationDuration: `${12 + (i % 4)}s`,
            }}
          />
        ))}
      </div>
      <Navbar />
      <main className="relative z-10 pt-16">
        {children}
      </main>
      <Footer />
    </div>
  );
}