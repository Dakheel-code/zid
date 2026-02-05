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
    case 'task':
      return '📋'
    case 'store':
      return '🏪'
    case 'announcement':
      return '📢'
    case 'meeting':
      return '📅'
    default:
      return 'ℹ'
  }
}

export function getNotificationColor(type: Notification['type']): string {
  switch (type) {
    case 'task':
      return 'text-blue-600 bg-blue-100'
    case 'store':
      return 'text-green-600 bg-green-100'
    case 'announcement':
      return 'text-purple-600 bg-purple-100'
    case 'meeting':
      return 'text-orange-600 bg-orange-100'
    default:
      return 'text-gray-600 bg-gray-100'
  }
}
