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
    <div className="min-h-screen bg-surface transition-colors duration-200">
      <Navbar />
      <main className="pt-16">
        {children}
      </main>
      <Footer />
    </div>
  );
}