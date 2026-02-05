'use client'

import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

/**
 * Card Component - Dark Purple Theme
 * ===================================
 * ✅ Background: بنفسجي غامق
 * ✅ Border: بنفسجي أغمق
 * ✅ Radius: متوسط-كبير
 * ✅ Hover: تفتيح خفيف
 */

const Card = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        // Background: بنفسجي أفتح من الخلفية
        'bg-[#3d2d5a]',
        // Border: بنفسجي/رمادي خفيف
        'border border-[#5a4985]/60',
        // Radius: واضح
        'rounded-2xl',
        // Shadow: Glow خفيف جداً
        'shadow-[0_4px_24px_rgba(139,92,246,0.08)]',
        // Hover effect
        'hover:bg-[#453565] hover:shadow-[0_4px_28px_rgba(139,92,246,0.12)] transition-all duration-200',
        className
      )}
      {...props}
    />
  )
)
Card.displayName = 'Card'

const CardHeader = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex flex-col gap-1 p-5', className)}
      {...props}
    />
  )
)
CardHeader.displayName = 'CardHeader'

const CardTitle = forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn(
        'text-base font-semibold text-white leading-tight',
        className
      )}
      {...props}
    />
  )
)
CardTitle.displayName = 'CardTitle'

const CardDescription = forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p
      ref={ref}
      className={cn('text-sm text-[#94a3b8]', className)}
      {...props}
    />
  )
)
CardDescription.displayName = 'CardDescription'

const CardContent = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('p-5 pt-0', className)} {...props} />
  )
)
CardContent.displayName = 'CardContent'

const CardFooter = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'flex items-center p-5 pt-0',
        'border-t border-[#3d3555] mt-4 pt-4',
        className
      )}
      {...props}
    />
  )
)
CardFooter.displayName = 'CardFooter'

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
