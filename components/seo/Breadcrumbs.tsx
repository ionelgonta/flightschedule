import Link from 'next/link'
import { ChevronRight, Home } from 'lucide-react'

interface BreadcrumbItem {
  name: string
  href?: string
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[]
  className?: string
}

export function Breadcrumbs({ items, className = '' }: BreadcrumbsProps) {
  return (
    <nav className={`flex items-center space-x-1 text-sm text-gray-600 dark:text-gray-400 ${className}`} aria-label="Breadcrumb">
      <Link 
        href="/" 
        className="flex items-center hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
        aria-label="Acasă"
      >
        <Home className="h-4 w-4" />
      </Link>
      
      {items.map((item, index) => (
        <div key={index} className="flex items-center space-x-1">
          <ChevronRight className="h-4 w-4 text-gray-400" />
          {item.href && index < items.length - 1 ? (
            <Link 
              href={item.href}
              className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
            >
              {item.name}
            </Link>
          ) : (
            <span className="text-gray-900 dark:text-white font-medium">
              {item.name}
            </span>
          )}
        </div>
      ))}
    </nav>
  )
}