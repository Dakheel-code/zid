'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Bell, 
  Check,
  CheckCheck,
  Store,
  CheckSquare,
  Megaphone,
  Calendar,
  X
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
type NotificationTypeV2 = 'task' | 'store' | 'announcement' | 'meeting'
type NotificationPriorityV2 = 'normal' | 'important' | 'urgent'

// Check if Supabase is configured
const isSupabaseConfigured = () => {
  return !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
}

// Format time ago helper
const formatTimeAgo = (dateString: string): string => {
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

// Mock notification type for when Supabase is not configured
interface MockNotification {
  id: string
  type: NotificationTypeV2
  title: string
  body: string | null
  priority: NotificationPriorityV2
  link_url: string | null
  is_read: boolean
  created_at: string
}

export function NotificationBell() {
  const router = useRouter()
  const [notifications, setNotifications] = useState<MockNotification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [isOpen, setIsOpen] = useState(false)

  // Fetch notifications from database
  const fetchNotifications = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      setNotifications([])
      setUnreadCount(0)
      setLoading(false)
      return
    }

    // Fetch directly from notifications table
    try {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setNotifications([])
        setUnreadCount(0)
        setLoading(false)
        return
      }

      const { data, error } = await supabase
        .from('notifications_v2')
        .select('*')
        .eq('recipient_user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10)

      if (error) {
        console.error('Error fetching notifications:', error)
        setNotifications([])
        setUnreadCount(0)
      } else {
        const notifs = (data || []).map(n => ({
          id: n.id,
          type: n.type || 'task',
          title: n.title,
          body: n.body,
          priority: n.priority || 'normal',
          link_url: n.link_url,
          is_read: n.is_read,
          created_at: n.created_at
        })) as MockNotification[]
        
        setNotifications(notifs)
        setUnreadCount(notifs.filter(n => !n.is_read).length)
      }
    } catch (error) {
      console.error('Error fetching notifications:', error)
      setNotifications([])
      setUnreadCount(0)
    }
    setLoading(false)
  }, [])

  // Initial fetch
  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  // Handle mark as read
  const handleMarkAsRead = async (notification: MockNotification) => {
    if (notification.is_read) return
    
    // Update local state first for immediate UI feedback
    setNotifications(prev => 
      prev.map(n => n.id === notification.id ? { ...n, is_read: true } : n)
    )
    setUnreadCount(prev => Math.max(0, prev - 1))
    
    // Save to database if Supabase is configured
    if (isSupabaseConfigured()) {
      try {
        const { createClient } = await import('@/lib/supabase/client')
        const supabase = createClient()
        await supabase
          .from('notifications_v2')
          .update({ is_read: true })
          .eq('id', notification.id)
      } catch (error) {
        console.error('Error marking notification as read:', error)
      }
    }
  }

  // Handle mark all as read
  const handleMarkAllAsRead = async () => {
    // Update local state first for immediate UI feedback
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
    setUnreadCount(0)
    
    // Save to database if Supabase is configured
    if (isSupabaseConfigured()) {
      try {
        const { createClient } = await import('@/lib/supabase/client')
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          await supabase
            .from('notifications_v2')
            .update({ is_read: true })
            .eq('recipient_user_id', user.id)
            .eq('is_read', false)
        }
      } catch (error) {
        console.error('Error marking all notifications as read:', error)
      }
    }
  }

  // Handle notification click
  const handleNotificationClick = async (notification: MockNotification) => {
    await handleMarkAsRead(notification)
    setIsOpen(false)
    
    if (notification.link_url) {
      router.push(notification.link_url)
    }
  }

  // Get icon for notification type
  const getNotificationIcon = (type: NotificationTypeV2) => {
    switch (type) {
      case 'store':
        return <Store className="h-4 w-4" />
      case 'task':
        return <CheckSquare className="h-4 w-4" />
      case 'announcement':
        return <Megaphone className="h-4 w-4" />
      case 'meeting':
        return <Calendar className="h-4 w-4" />
      default:
        return <Bell className="h-4 w-4" />
    }
  }

  // Get color for priority
  const getPriorityColor = (priority: NotificationPriorityV2) => {
    switch (priority) {
      case 'urgent':
        return 'text-red-500 bg-red-50'
      case 'important':
        return 'text-amber-500 bg-amber-50'
      default:
        return 'text-blue-500 bg-blue-50'
    }
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 p-0 bg-[#3d2d5a] text-[#c4b5fd] hover:bg-[#4a3968] hover:text-white">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-medium">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0 bg-[#1a1230] border border-[#3d2d5a] shadow-2xl rounded-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#3d2d5a]">
          <h3 className="font-semibold text-white">الإشعارات</h3>
          {unreadCount > 0 && (
            <button 
              className="text-xs text-[#a855f7] hover:text-[#c084fc] font-medium transition-colors"
              onClick={handleMarkAllAsRead}
            >
              <CheckCheck className="h-3 w-3 inline ml-1" />
              تحديد الكل كمقروء
            </button>
          )}
        </div>

        {/* Notifications List */}
        <div className="max-h-96 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#a855f7]"></div>
            </div>
          ) : notifications.length > 0 ? (
            <div className="divide-y divide-[#3d2d5a]">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 hover:bg-[#2d1f4e] cursor-pointer transition-colors ${
                    !notification.is_read ? 'bg-[#2d1f4e]/50' : ''
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      notification.priority === 'urgent' ? 'bg-red-500/20 text-red-400' :
                      notification.priority === 'important' ? 'bg-amber-500/20 text-amber-400' :
                      'bg-[#a855f7]/20 text-[#a855f7]'
                    }`}>
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-sm text-white ${!notification.is_read ? 'font-semibold' : 'font-normal'}`}>
                          {notification.title}
                        </p>
                        {!notification.is_read && (
                          <span className="w-2 h-2 rounded-full bg-[#a855f7] flex-shrink-0 mt-1.5"></span>
                        )}
                      </div>
                      {notification.body && (
                        <p className="text-xs text-[#c4b5fd] line-clamp-2 mt-0.5">
                          {notification.body}
                        </p>
                      )}
                      <p className="text-xs text-[#8b7fad] mt-1">
                        {formatTimeAgo(notification.created_at)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-[#8b7fad]">
              <Bell className="h-8 w-8 mb-2" />
              <p className="text-sm">لا توجد إشعارات</p>
            </div>
          )}
        </div>

        {/* Footer */}
        {notifications.length > 0 && (
          <div className="p-3 border-t border-[#3d2d5a]">
            <button 
              className="w-full text-center text-sm text-[#a855f7] hover:text-[#c084fc] font-medium py-2 rounded-lg hover:bg-[#2d1f4e] transition-colors"
              onClick={() => {
                setIsOpen(false)
                router.push('/manager/notifications')
              }}
            >
              عرض جميع الإشعارات
            </button>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
