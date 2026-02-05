'use client'

import { forwardRef } from 'react'
import { cn } from '@/lib/utils'
import { LucideIcon } from 'lucide-react'

/**
 * Button System - Dark Purple Theme
 * ==================================
 * Primary: بنفسجي فاقع + نص أبيض + Hover أغمق
 * Secondary: Border بنفسجي + Background شفاف
 * Ghost: Background شفاف + Hover بنفسجي غامق
 * Danger: Red accent
 */

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  leftIcon?: LucideIcon
  rightIcon?: LucideIcon
  isLoading?: boolean
}

const variantStyles = {
  // Primary: بنفسجي فاقع + نص أبيض + Hover أغمق + خط أنحف
  primary: [
    'bg-[#a855f7] text-white font-normal',
    'hover:bg-[#9333ea]',
    'active:bg-[#7c3aed]',
    'shadow-[0_0_20px_rgba(168,85,247,0.35)]',
  ].join(' '),
  
  // Secondary: Border بنفسجي + Background شفاف + خط أنحف
  secondary: [
    'bg-transparent text-[#c4b5fd] font-normal',
    'border-2 border-[#a855f7]',
    'hover:bg-[#a855f7]/10 hover:text-white',
    'active:bg-[#a855f7]/20',
  ].join(' '),
  
  // Ghost/Icon: Background شفاف + Hover بنفسجي غامق
  ghost: [
    'bg-transparent text-[#c4b5fd]',
    'hover:bg-[#3d2d5a] hover:text-white',
    'active:bg-[#453565]',
  ].join(' '),
  
  // Danger: Red accent
  danger: [
    'bg-[rgba(239,68,68,0.15)] text-[#f87171]',
    'border border-[rgba(239,68,68,0.3)]',
    'hover:bg-[rgba(239,68,68,0.25)]',
    'active:bg-[rgba(239,68,68,0.35)]',
  ].join(' '),
}

const sizeStyles = {
  sm: 'h-8 px-3 text-[13px] gap-1.5 rounded-md',
  md: 'h-9 px-4 text-[14px] gap-2 rounded-md',
  lg: 'h-11 px-5 text-[15px] gap-2 rounded-lg',
}

const iconSizes = {
  sm: 'h-4 w-4',
  md: 'h-4 w-4',
  lg: 'h-5 w-5',
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', leftIcon: LeftIcon, rightIcon: RightIcon, isLoading, children, disabled, ...props }, ref) => {
    return (
      <button
        className={cn(
          'inline-flex items-center justify-center rounded-lg font-medium transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4F46E5] focus-visible:ring-offset-2',
          'disabled:pointer-events-none disabled:opacity-50',
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        ref={ref}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        ) : (
          <>
            {LeftIcon && <LeftIcon className={iconSizes[size]} />}
            {children}
            {RightIcon && <RightIcon className={iconSizes[size]} />}
          </>
        )}
      </button>
    )
  }
)
Button.displayName = 'Button'

// Alias exports for convenience
const PrimaryButton = forwardRef<HTMLButtonElement, Omit<ButtonProps, 'variant'>>((props, ref) => (
  <Button ref={ref} variant="primary" {...props} />
))
PrimaryButton.displayName = 'PrimaryButton'

const SecondaryButton = forwardRef<HTMLButtonElement, Omit<ButtonProps, 'variant'>>((props, ref) => (
  <Button ref={ref} variant="secondary" {...props} />
))
SecondaryButton.displayName = 'SecondaryButton'

export { Button, PrimaryButton, SecondaryButton }
