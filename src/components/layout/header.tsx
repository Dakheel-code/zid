'use client'

import { NotificationBell } from '@/components/notifications'

/**
 * Header - Dark Purple Theme
 * ===========================
 * ✅ خلفية: شفافة/داكنة
 * ✅ Border سفلي بنفسجي
 */

export function Header() {
  return (
    <header className="sticky top-0 z-40 h-14 border-b border-[#5a4985] bg-[#2d1f4e]">
      <div className="flex h-full items-center justify-end px-6">
        {/* Actions */}
        <div className="flex items-center gap-2">
          <NotificationBell />
        </div>
      </div>
    </header>
  )
}
