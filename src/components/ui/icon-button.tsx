'use client'

import { forwardRef } from 'react'
import { cn } from '@/lib/utils'
import { LucideIcon } from 'lucide-react'

type IconButtonVariant = 'default' | 'ghost' | 'outline' | 'destructive'
type IconButtonSize = 'sm' | 'md' | 'lg'

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: LucideIcon
  variant?: IconButtonVariant
  size?: IconButtonSize
  label?: string
}

const variantStyles: Record<IconButtonVariant, string> = {
  default: 'bg-[#4F46E5] text-white hover:bg-[#4338ca] active:bg-[#3730a3]',
  ghost: 'bg-transparent text-fg-secondary hover:bg-neutral-100 hover:text-fg-primary',
  outline: 'bg-transparent border border-border text-fg-secondary hover:bg-neutral-50 hover:text-fg-primary',
  destructive: 'bg-error-500 text-white hover:bg-error-600 active:bg-error-600',
}

const sizeStyles: Record<IconButtonSize, { button: string; icon: string }> = {
  sm: { button: 'h-8 w-8', icon: 'h-4 w-4' },
  md: { button: 'h-10 w-10', icon: 'h-5 w-5' },
  lg: { button: 'h-12 w-12', icon: 'h-6 w-6' },
}

const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ icon: Icon, variant = 'default', size = 'md', label, className, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4F46E5] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
          variantStyles[variant],
          sizeStyles[size].button,
          className
        )}
        aria-label={label}
        {...props}
      >
        <Icon className={sizeStyles[size].icon} />
      </button>
    )
  }
)
IconButton.displayName = 'IconButton'

export { IconButton }
