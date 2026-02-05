'use client'

import { cn } from '@/lib/utils'

/**
 * Badge / Status Pills - Dark Purple Theme
 * =========================================
 * البادجات هي اللي تعطي حياة!
 * ✅ نشط → أخضر
 * ✅ جديد → أزرق
 * ✅ متوقف → برتقالي
 * ✅ منتهي → أحمر
 * ✅ أولوية عالية → برتقالي
 * ✅ أولوية منخفضة → رمادي
 * ❌ لا بادجات رمادية كلها
 */

type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'info' | 'purple' | 'muted'
type BadgeSize = 'sm' | 'md'

interface BadgeProps {
  children: React.ReactNode
  variant?: BadgeVariant
  size?: BadgeSize
  className?: string
}

const variantStyles: Record<BadgeVariant, string> = {
  // Success/نشط: أخضر واضح
  success: 'bg-[#22c55e]/20 text-[#4ade80] border-[#22c55e]/40',
  
  // Info/جديد: أزرق واضح
  info: 'bg-[#3b82f6]/20 text-[#60a5fa] border-[#3b82f6]/40',
  
  // Warning/متوقف/أولوية عالية: برتقالي واضح
  warning: 'bg-[#f97316]/20 text-[#fb923c] border-[#f97316]/40',
  
  // Error/منتهي: أحمر واضح
  error: 'bg-[#ef4444]/20 text-[#f87171] border-[#ef4444]/40',
  
  // Purple: بنفسجي
  purple: 'bg-[#a855f7]/20 text-[#c084fc] border-[#a855f7]/40',
  
  // Default: بنفسجي فاتح
  default: 'bg-[#5a4985]/30 text-[#c4b5fd] border-[#5a4985]/50',
  
  // Muted/أولوية منخفضة: رمادي
  muted: 'bg-[#475569]/20 text-[#94a3b8] border-[#475569]/40',
}

const sizeStyles: Record<BadgeSize, string> = {
  sm: 'px-2 py-0.5 text-[11px]',
  md: 'px-2.5 py-1 text-[12px]',
}

export function Badge({ children, variant = 'default', size = 'md', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center justify-center',
        'rounded-full border',
        'font-medium whitespace-nowrap',
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
    >
      {children}
    </span>
  )
}

/**
 * Status Dot - نقطة حالة صغيرة
 */
interface StatusDotProps {
  status: 'success' | 'warning' | 'error' | 'info' | 'default'
  className?: string
}

const dotColors: Record<StatusDotProps['status'], string> = {
  default: 'bg-[#9ca3af]',
  success: 'bg-[#22c55e]',
  warning: 'bg-[#f59e0b]',
  error: 'bg-[#ef4444]',
  info: 'bg-[#3b82f6]',
}

export function StatusDot({ status = 'default', className }: StatusDotProps) {
  return (
    <span
      className={cn(
        'inline-block w-2 h-2 rounded-full',
        dotColors[status],
        className
      )}
    />
  )
}
