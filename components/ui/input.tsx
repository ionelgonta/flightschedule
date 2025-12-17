import * as React from "react"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  variant?: 'filled' | 'outlined'
  error?: boolean
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, variant = 'outlined', error = false, ...props }, ref) => {
    const baseClasses = "flex w-full body-large text-on-surface transition-all duration-200 file:border-0 file:bg-transparent file:body-large file:font-medium placeholder:text-on-surface-variant focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-38"
    
    const variants = {
      // Filled Text Field
      filled: `h-14 px-4 pt-6 pb-2 rounded-t-lg bg-surface-container-highest border-b-2 ${
        error 
          ? 'border-error focus:border-error' 
          : 'border-outline focus:border-primary-40'
      } hover:bg-surface-container-high focus:bg-surface-container-highest`,
      
      // Outlined Text Field
      outlined: `h-14 px-4 rounded-lg bg-surface border ${
        error 
          ? 'border-error focus:border-error focus:border-2' 
          : 'border-outline focus:border-primary-40 focus:border-2'
      } hover:border-on-surface focus:bg-surface`,
    }
    
    return (
      <input
        type={type}
        className={`${baseClasses} ${variants[variant]} ${className || ''}`}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

// Text Field with Floating Label
export interface TextFieldProps extends InputProps {
  label?: string
  supportingText?: string
}

const TextField = React.forwardRef<HTMLInputElement, TextFieldProps>(
  ({ className, label, supportingText, error, variant = 'outlined', ...props }, ref) => {
    const [focused, setFocused] = React.useState(false)
    const [hasValue, setHasValue] = React.useState(false)
    
    const handleFocus = () => setFocused(true)
    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setFocused(false)
      setHasValue(e.target.value.length > 0)
    }
    
    const labelFloated = focused || hasValue || props.value || props.defaultValue
    
    return (
      <div className="relative">
        <Input
          ref={ref}
          variant={variant}
          error={error}
          onFocus={handleFocus}
          onBlur={handleBlur}
          className={`peer ${className || ''}`}
          {...props}
        />
        {label && (
          <label
            className={`absolute left-4 transition-all duration-200 pointer-events-none ${
              variant === 'filled' 
                ? labelFloated 
                  ? 'top-2 body-small text-on-surface-variant' 
                  : 'top-5 body-large text-on-surface-variant'
                : labelFloated 
                  ? '-top-2 px-1 bg-surface body-small text-on-surface-variant' 
                  : 'top-4 body-large text-on-surface-variant'
            } ${error ? 'text-error' : focused ? 'text-primary-40' : ''}`}
          >
            {label}
          </label>
        )}
        {supportingText && (
          <div className={`mt-1 px-4 body-small ${error ? 'text-error' : 'text-on-surface-variant'}`}>
            {supportingText}
          </div>
        )}
      </div>
    )
  }
)
TextField.displayName = "TextField"

export { Input, TextField }