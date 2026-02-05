import type { NotificationV2 } from '@/lib/supabase/types-simple'

export type Notification = NotificationV2

export interface NotificationPayload {
  userId: string
  title: string
  message: string
  type?: 'info' | 'warning' | 'success' | 'error'
  link?: string
}

export function formatNotificationTime(date: string): string {
  const now = new Date()
  const notificationDate = new Date(date)
  const diffInSeconds = Math.floor((now.getTime() - notificationDate.getTime()) / 1000)

  if (diffInSeconds < 60) {
    return 'الآن'
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60)
  if (diffInMinutes < 60) {
    return `منذ ${diffInMinutes} دقيقة`
  }

  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) {
    return `منذ ${diffInHours} ساعة`
  }

  const diffInDays = Math.floor(diffInHours / 24)
  if (diffInDays < 7) {
    return `منذ ${diffInDays} يوم`
  }

  return notificationDate.toLocaleDateString('ar-SA')
}

export function getNotificationIcon(type: Notification['type']): string {
  switch (type) {
    case 'success':
      return '✓'
    case 'warning':
      return '⚠'
    case 'error':
      return '✕'
    case 'info':
    default:
      return 'ℹ'
  }
}

export function getNotificationColor(type: Notification['type']): string {
  switch (type) {
    case 'success':
      return 'text-green-600 bg-green-100'
    case 'warning':
      return 'text-yellow-600 bg-yellow-100'
    case 'error':
      return 'text-red-600 bg-red-100'
    case 'info':
    default:
      return 'text-blue-600 bg-blue-100'
  }
}
