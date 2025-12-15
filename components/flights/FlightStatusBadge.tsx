import { FlightStatus } from '@/types/flight'
import { 
  Clock, 
  Plane, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Navigation 
} from 'lucide-react'

interface FlightStatusBadgeProps {
  status: FlightStatus
}

const statusConfig = {
  scheduled: {
    label: 'Programat',
    icon: Clock,
    className: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
  },
  active: {
    label: 'În Zbor',
    icon: Plane,
    className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
  },
  landed: {
    label: 'Aterizat',
    icon: CheckCircle,
    className: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
  },
  cancelled: {
    label: 'Anulat',
    icon: XCircle,
    className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
  },
  delayed: {
    label: 'Întârziat',
    icon: AlertTriangle,
    className: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300'
  },
  diverted: {
    label: 'Deviat',
    icon: Navigation,
    className: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300'
  },
  unknown: {
    label: 'Necunoscut',
    icon: Clock,
    className: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
  }
}

export function FlightStatusBadge({ status }: FlightStatusBadgeProps) {
  const config = statusConfig[status]
  const Icon = config.icon

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.className}`}>
      <Icon className="w-3 h-3 mr-1" />
      {config.label}
    </span>
  )
}