'use client'

import { useState, useRef, useEffect } from 'react'
import { Bell, Check, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatNotificationTime, getNotificationColor } from '@/lib/notifications'
import type { Notification } from '@/lib/notifications'

interface BellNotificationsDropdownProps {
  notifications: Notification[]
  onMarkAsRead?: (id: string) => void
  onMarkAllAsRead?: () => void
  onDelete?: (id: string) => void
  className?: string
}

export function BellNotificationsDropdown({
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onDelete,
  className,
}: BellNotificationsDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const unreadCount = notifications.filter((n) => !n.is_read).length

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className={cn('relative', className)} ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg bg-[#3d2d5a] text-[#c4b5fd] hover:bg-[#4a3968] hover:text-white transition-colors"
        aria-label="الإشعارات"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 h-5 w-5 rounded-full bg-error-500 text-[10px] font-bold text-white flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute left-0 top-full mt-2 w-80 rounded-xl border border-border bg-bg-card shadow-xl z-50">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border p-4">
            <h3 className="text-heading-5 font-semibold text-fg-primary">الإشعارات</h3>
            {unreadCount > 0 && onMarkAllAsRead && (
              <button
                onClick={onMarkAllAsRead}
                className="text-caption text-[#4F46E5] hover:text-[#4338ca] font-medium"
              >
                تحديد الكل كمقروء
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="py-8 text-center">
                <Bell className="h-8 w-8 text-fg-muted mx-auto mb-2" />
                <p className="text-body-sm text-fg-muted">لا توجد إشعارات</p>
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {notifications.map((notification) => (
                  <li
                    key={notification.id}
                    className={cn(
                      'p-4 hover:bg-bg-secondary transition-colors',
                      !notification.is_read && 'bg-[#eef2ff]/50'
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={cn(
                          'mt-0.5 h-2 w-2 rounded-full flex-shrink-0',
                          notification.is_read ? 'bg-transparent' : 'bg-[#4F46E5]'
                        )}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-body-sm font-medium text-fg-primary truncate">
                          {notification.title}
                        </p>
                        <p className="text-caption text-fg-secondary mt-0.5 line-clamp-2">
                          {notification.message}
                        </p>
                        <p className="text-caption text-fg-muted mt-1">
                          {formatNotificationTime(notification.created_at)}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        {!notification.is_read && onMarkAsRead && (
                          <button
                            onClick={() => onMarkAsRead(notification.id)}
                            className="p-1 rounded hover:bg-neutral-200 text-fg-muted hover:text-success-600"
                            title="تحديد كمقروء"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                        )}
                        {onDelete && (
                          <button
                            onClick={() => onDelete(notification.id)}
                            className="p-1 rounded hover:bg-neutral-200 text-fg-muted hover:text-error-600"
                            title="حذف"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="border-t border-border p-3">
              <button className="w-full text-center text-body-sm text-[#4F46E5] hover:text-[#4338ca] font-medium">
                عرض جميع الإشعارات
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
