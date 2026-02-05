// ============================================
// ZID Dashboard - Phase 3: Notification Service
// منطق الإشعارات مع Realtime
// ============================================

import { createClient } from '@/lib/supabase/client'
import type { 
  NotificationV2,
  NotificationTypeV2,
  NotificationPriorityV2
} from '@/lib/supabase/types-simple'
import { RealtimeChannel } from '@supabase/supabase-js'

// ============================================
// TYPES
// ============================================

export interface NotificationWithMeta extends NotificationV2 {
  time_ago?: string
}

// ============================================
// NOTIFICATION QUERIES
// ============================================

/**
 * Get notifications with pagination
 */
export async function getNotifications(options?: {
  limit?: number
  offset?: number
  unread_only?: boolean
}): Promise<{
  notifications: NotificationV2[]
  error?: string
}> {
  const supabase = createClient()

  try {
    const { data, error } = await supabase.rpc('get_notifications', {
      p_limit: options?.limit || 20,
      p_offset: options?.offset || 0,
      p_unread_only: options?.unread_only || false
    })

    if (error) {
      return { notifications: [], error: error.message }
    }

    return { notifications: data || [] }
  } catch (error) {
    return {
      notifications: [],
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Get unread notification count
 */
export async function getUnreadCount(): Promise<number> {
  const supabase = createClient()

  try {
    const { data, error } = await supabase.rpc('get_unread_notification_count')

    if (error) {
      console.error('Error getting unread count:', error)
      return 0
    }

    return data || 0
  } catch {
    return 0
  }
}

// ============================================
// NOTIFICATION ACTIONS
// ============================================

/**
 * Mark notification as read
 */
export async function markAsRead(notificationId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient()

  try {
    const { data, error } = await supabase.rpc('mark_notification_read_v2', {
      p_notification_id: notificationId
    })

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: data }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Mark all notifications as read
 */
export async function markAllAsRead(): Promise<{ success: boolean; count?: number; error?: string }> {
  const supabase = createClient()

  try {
    const { data, error } = await supabase.rpc('mark_all_notifications_read_v2')

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, count: data }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Delete a notification
 */
export async function deleteNotification(notificationId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient()

  try {
    const { error } = await supabase
      .from('notifications_v2')
      .delete()
      .eq('id', notificationId)

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

// ============================================
// REALTIME SUBSCRIPTION
// ============================================

/**
 * Subscribe to realtime notifications
 */
export function subscribeToNotifications(
  userId: string,
  onNewNotification: (notification: NotificationV2) => void
): RealtimeChannel {
  const supabase = createClient()

  const channel = supabase
    .channel(`notifications:${userId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications_v2',
        filter: `recipient_user_id=eq.${userId}`
      },
      (payload) => {
        onNewNotification(payload.new as NotificationV2)
      }
    )
    .subscribe()

  return channel
}

/**
 * Unsubscribe from notifications
 */
export async function unsubscribeFromNotifications(channel: RealtimeChannel): Promise<void> {
  const supabase = createClient()
  await supabase.removeChannel(channel)
}

// ============================================
// NOTIFICATION HELPERS
// ============================================

/**
 * Get notification icon based on type
 */
export function getNotificationIcon(type: NotificationTypeV2): string {
  switch (type) {
    case 'task':
      return 'CheckSquare'
    case 'store':
      return 'Store'
    case 'announcement':
      return 'Megaphone'
    case 'meeting':
      return 'Calendar'
    default:
      return 'Bell'
  }
}

/**
 * Get notification color based on priority
 */
export function getNotificationColor(priority: NotificationPriorityV2): string {
  switch (priority) {
    case 'urgent':
      return 'text-red-500'
    case 'important':
      return 'text-amber-500'
    case 'normal':
    default:
      return 'text-blue-500'
  }
}

/**
 * Format time ago
 */
export function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'الآن'
  if (diffMins < 60) return `منذ ${diffMins} دقيقة`
  if (diffHours < 24) return `منذ ${diffHours} ساعة`
  if (diffDays < 7) return `منذ ${diffDays} يوم`
  
  return date.toLocaleDateString('ar-SA')
}
