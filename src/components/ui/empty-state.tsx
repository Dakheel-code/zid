'use client'

import { cn } from '@/lib/utils'
import { LucideIcon } from 'lucide-react'

interface EmptyStateProps {
  icon?: LucideIcon
  title: string
  description?: string
  children?: React.ReactNode
  className?: string
}

export function EmptyState({ icon: Icon, title, description, children, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-12 px-4 text-center', className)}>
      {Icon && (
        <div className="mb-4 rounded-full bg-[#f3f4f6] p-4">
          <Icon className="h-8 w-8 text-[#6b7280]" />
        </div>
      )}
      <h3 className="text-heading-5 text-fg-primary font-semibold mb-2">{title}</h3>
      {description && (
        <p className="text-body-sm text-fg-muted max-w-sm mb-6">{description}</p>
      )}
      {children && (
        <div className="flex items-center gap-3">
          {children}
        </div>
      )}
    </div>
  )
}
