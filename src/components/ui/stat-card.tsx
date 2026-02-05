'use client'

import { cn } from '@/lib/utils'
import { LucideIcon } from 'lucide-react'

interface StatCardProps {
  title: string
  value: string | number
  description?: string
  icon?: LucideIcon
  trend?: {
    value: number
    isPositive: boolean
  }
  className?: string
}

export function StatCard({ title, value, description, icon: Icon, trend, className }: StatCardProps) {
  return (
    <div className={cn(
      'rounded-xl border border-border bg-bg-card p-6 shadow-sm transition-shadow hover:shadow-md',
      className
    )}>
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-body-sm text-fg-secondary font-medium">{title}</p>
          <p className="text-heading-2 text-fg-primary font-bold">{value}</p>
          {description && (
            <p className="text-caption text-fg-muted">{description}</p>
          )}
          {trend && (
            <div className={cn(
              'flex items-center gap-1 text-caption font-medium',
              trend.isPositive ? 'text-success-600' : 'text-error-600'
            )}>
              <span>{trend.isPositive ? '↑' : '↓'}</span>
              <span>{Math.abs(trend.value)}%</span>
            </div>
          )}
        </div>
        {Icon && (
          <div className="rounded-lg bg-[#eef2ff] p-3">
            <Icon className="h-6 w-6 text-[#4F46E5]" />
          </div>
        )}
      </div>
    </div>
  )
}
