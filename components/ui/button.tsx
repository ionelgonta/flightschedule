import * as React from "react"

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'filled' | 'outlined' | 'text' | 'elevated' | 'tonal'
  size?: 'default' | 'large' | 'small'
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'filled', size = 'default', ...props }, ref) => {
    const baseClasses = "state-layer inline-flex items-center justify-center font-medium transition-all duration-200 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-38 relative overflow-hidden"
    
    const variants = {
      // Filled Button (Primary Action)
      filled: "bg-primary-40 text-on-primary shadow-elevation-0 hover:shadow-elevation-1 active:shadow-elevation-0",
      
      // Outlined Button (Secondary Action)
      outlined: "border border-outline text-primary-40 bg-transparent hover:bg-primary-40/8 active:bg-primary-40/12",
      
      // Text Button (Low Emphasis)
      text: "text-primary-40 bg-transparent hover:bg-primary-40/8 active:bg-primary-40/12",
      
      // Elevated Button (Alternative to Filled)
      elevated: "bg-surface-container-low text-primary-40 shadow-elevation-1 hover:shadow-elevation-2 active:shadow-elevation-1",
      
      // Tonal Button (Medium Emphasis)
      tonal: "bg-secondary-container text-on-secondary-container shadow-elevation-0 hover:shadow-elevation-1 active:shadow-elevation-0",
    }
    
    const sizes = {
      small: "h-10 px-3 rounded-lg label-medium min-w-16",
      default: "h-12 px-6 rounded-xl label-large min-w-16",
      large: "h-14 px-8 rounded-xl label-large min-w-16",
    }
    
    return (
      <button
        className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className || ''}`}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }