import * as React from "react"

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'success' | 'warning' | 'error' | 'info' | 'neutral'
}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant = 'neutral', ...props }, ref) => {
    const variants = {
      // Success (On Time)
      success: "bg-primary-container text-on-primary-container",
      
      // Warning (Delayed)
      warning: "bg-tertiary-container text-on-tertiary-container",
      
      // Error (Cancelled)
      error: "bg-error-container text-on-error-container",
      
      // Info (Boarding)
      info: "bg-secondary-container text-on-secondary-container",
      
      // Neutral (Unknown/Default)
      neutral: "bg-surface-container-high text-on-surface-variant",
    }

    return (
      <div
        ref={ref}
        className={`inline-flex items-center rounded-lg px-3 py-1 label-small font-medium transition-colors duration-200 ${variants[variant]} ${className || ''}`}
        {...props}
      />
    )
  }
)
Badge.displayName = "Badge"

// Flight Status Badge with semantic colors
export interface FlightStatusBadgeProps extends Omit<BadgeProps, 'variant'> {
  status: 'on-time' | 'delayed' | 'cancelled' | 'boarding' | 'departed' | 'arrived' | 'unknown' | 'estimated'
}

const FlightStatusBadge = React.forwardRef<HTMLDivElement, FlightStatusBadgeProps>(
  ({ status, className, children, ...props }, ref) => {
    const statusVariants = {
      'on-time': 'success',
      'delayed': 'warning',
      'cancelled': 'error',
      'boarding': 'info',
      'departed': 'success',
      'arrived': 'success',
      'unknown': 'neutral',
      'estimated': 'info',
    } as const

    const statusLabels = {
      'on-time': 'La timp',
      'delayed': 'Întârziat',
      'cancelled': 'Anulat',
      'boarding': 'Îmbarcare',
      'departed': 'Plecat',
      'arrived': 'Sosit',
      'unknown': 'Necunoscut',
      'estimated': 'Estimat',
    }

    return (
      <Badge
        ref={ref}
        variant={statusVariants[status]}
        className={className}
        {...props}
      >
        {children || statusLabels[status]}
      </Badge>
    )
  }
)
FlightStatusBadge.displayName = "FlightStatusBadge"

export { Badge, FlightStatusBadge }