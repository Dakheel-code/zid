'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AccordionItemProps {
  title: string
  children: React.ReactNode
  defaultOpen?: boolean
  className?: string
}

export function AccordionItem({ title, children, defaultOpen = false, className }: AccordionItemProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <div className={cn('border-b border-border', className)}>
      <button
        type="button"
        className="flex w-full items-center justify-between py-4 text-right font-medium text-fg-primary hover:text-fg-accent transition-colors"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
      >
        <span className="text-body font-semibold">{title}</span>
        <ChevronDown 
          className={cn(
            'h-5 w-5 text-fg-muted transition-transform duration-200',
            isOpen && 'rotate-180'
          )} 
        />
      </button>
      <div
        className={cn(
          'overflow-hidden transition-all duration-200',
          isOpen ? 'max-h-[1000px] pb-4' : 'max-h-0'
        )}
      >
        <div className="text-body-sm text-fg-secondary">
          {children}
        </div>
      </div>
    </div>
  )
}

interface AccordionProps {
  children: React.ReactNode
  className?: string
}

export function Accordion({ children, className }: AccordionProps) {
  return (
    <div className={cn('divide-y divide-border rounded-lg border border-border', className)}>
      {children}
    </div>
  )
}
