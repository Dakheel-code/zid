'use client'

import { useState, useEffect } from 'react'
import { Bell, Check, CheckCheck, Trash2 } from 'lucide-react'
import { createBrowserClient } from '@supabase/ssr'

interface Notification {
  id: string
  title: string
  body: string | null
  type: 'task' | 'store' | 'announcement' | 'meeting'
  is_read: boolean
  created_at: string
  link_url: string | null
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'unread'>('all')

  useEffect(() => {
    fetchNotifications()
  }, [])

  const fetchNotifications = async () => {
    try {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('recipient_user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching notifications:', error)
        // Use mock data if table doesn't exist
        setNotifications(getMockNotifications())
      } else {
        setNotifications(data || [])
      }
    } catch (error) {
      console.error('Error:', error)
      setNotifications(getMockNotifications())
    } finally {
      setLoading(false)
    }
  }

  const getMockNotifications = (): Notification[] => [
    {
      id: '1',
      title: 'تغيير حالة المهمة',
      body: 'تم تغيير حالة المهمة "إعداد الشحن" إلى done',
      type: 'task',
      is_read: false,
      created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      link_url: null
    },
    {
      id: '2',
      title: 'تغيير حالة المهمة',
      body: 'تم تغيير حالة المهمة "إضافة طرق الدفع" إلى done',
      type: 'task',
      is_read: false,
      created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      link_url: null
    },
    {
      id: '3',
      title: 'تغيير حالة المهمة',
      body: 'تم تغيير حالة المهمة "مراجعة إعدادات المتجر" إلى done',
      type: 'task',
      is_read: true,
      created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      link_url: null
    },
    {
      id: '4',
      title: 'تغيير حالة المهمة',
      body: 'تم تغيير حالة المهمة "مراجعة إعدادات المتجر" إلى new',
      type: 'task',
      is_read: true,
      created_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
      link_url: null
    },
    {
      id: '5',
      title: 'متجر جديد',
      body: 'تم إسناد متجر جديد "متجر الأزياء" إليك',
      type: 'store',
      is_read: true,
      created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      link_url: null
    },
    {
      id: '6',
      title: 'تعميم جديد',
      body: 'تم نشر تعميم جديد: تحديث سياسة الشحن',
      type: 'announcement',
      is_read: true,
      created_at: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
      link_url: null
    }
  ]

  const markAsRead = async (id: string) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, is_read: true } : n)
    )
  }

  const markAllAsRead = async () => {
    setNotifications(prev =>
      prev.map(n => ({ ...n, is_read: true }))
    )
  }

  const deleteNotification = async (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 60) return `منذ ${diffMins} دقيقة`
    if (diffHours < 24) return `منذ ${diffHours} ساعة`
    if (diffDays < 7) return `منذ ${diffDays} يوم`
    return date.toLocaleDateString('ar-SA')
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'task': return '📋'
      case 'store': return '🏪'
      case 'announcement': return '📢'
      case 'meeting': return '📅'
      default: return '🔔'
    }
  }

  const filteredNotifications = filter === 'unread'
    ? notifications.filter(n => !n.is_read)
    : notifications

  const unreadCount = notifications.filter(n => !n.is_read).length

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Bell className="h-6 w-6 text-purple-400" />
          <h1 className="text-2xl font-bold text-white">الإشعارات</h1>
          {unreadCount > 0 && (
            <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
              {unreadCount} جديد
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="flex items-center gap-2 text-sm text-purple-400 hover:text-purple-300 transition-colors"
          >
            <CheckCheck className="h-4 w-4" />
            تحديد الكل كمقروء
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filter === 'all'
              ? 'bg-purple-600 text-white'
              : 'bg-[#2d2640] text-gray-400 hover:bg-[#3d3555]'
          }`}
        >
          الكل ({notifications.length})
        </button>
        <button
          onClick={() => setFilter('unread')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filter === 'unread'
              ? 'bg-purple-600 text-white'
              : 'bg-[#2d2640] text-gray-400 hover:bg-[#3d3555]'
          }`}
        >
          غير مقروء ({unreadCount})
        </button>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {filteredNotifications.length === 0 ? (
          <div className="text-center py-12 bg-[#2d2640] rounded-xl">
            <Bell className="h-12 w-12 text-gray-500 mx-auto mb-4" />
            <p className="text-gray-400">لا توجد إشعارات</p>
          </div>
        ) : (
          filteredNotifications.map((notification) => (
            <div
              key={notification.id}
              className={`p-4 rounded-xl border transition-colors ${
                notification.is_read
                  ? 'bg-[#2d2640] border-[#3d3555]'
                  : 'bg-[#3d2d5a] border-purple-500/30'
              }`}
            >
              <div className="flex items-start gap-4">
                {/* Icon */}
                <div className="text-2xl">{getTypeIcon(notification.type)}</div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium text-white">{notification.title}</h3>
                    {!notification.is_read && (
                      <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                    )}
                  </div>
                  <p className="text-gray-400 text-sm mb-2">{notification.body}</p>
                  <p className="text-gray-500 text-xs">{formatTime(notification.created_at)}</p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  {!notification.is_read && (
                    <button
                      onClick={() => markAsRead(notification.id)}
                      className="p-2 text-gray-400 hover:text-green-400 hover:bg-green-500/10 rounded-lg transition-colors"
                      title="تحديد كمقروء"
                    >
                      <Check className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    onClick={() => deleteNotification(notification.id)}
                    className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                    title="حذف"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
