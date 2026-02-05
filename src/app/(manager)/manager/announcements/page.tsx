'use client'

import { useEffect, useState } from 'react'
import { 
  Megaphone, 
  AlertTriangle,
  Clock,
  Check
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { createBrowserClient } from '@supabase/ssr'

interface Announcement {
  id: string
  title: string
  content: string
  type: 'normal' | 'urgent_popup'
  priority: 'low' | 'normal' | 'high'
  sent_at: string
  is_read: boolean
}

export default function ManagerAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        // جلب المستخدم الحالي
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          setCurrentUserId(user.id)
        }

        // جلب التعاميم المرسلة فقط
        const { data: announcementsData, error } = await supabase
          .from('announcements')
          .select('*')
          .eq('status', 'sent')
          .order('sent_at', { ascending: false })

        if (error) throw error

        // جلب التعاميم التي قرأها المستخدم
        let readAnnouncementIds: string[] = []
        if (user) {
          const { data: viewsData } = await supabase
            .from('announcement_views')
            .select('announcement_id')
            .eq('user_id', user.id)

          readAnnouncementIds = viewsData?.map(v => v.announcement_id) || []
        }

        // دمج البيانات
        const formattedAnnouncements = (announcementsData || []).map(a => ({
          id: a.id,
          title: a.title,
          content: a.content,
          type: a.type || 'normal',
          priority: a.priority || 'normal',
          sent_at: a.sent_at || a.created_at,
          is_read: readAnnouncementIds.includes(a.id)
        }))

        setAnnouncements(formattedAnnouncements)
      } catch (err) {
        console.error('Error fetching announcements:', err)
      }
      setLoading(false)
    }

    fetchAnnouncements()
  }, [])

  const markAsRead = async (id: string) => {
    if (!currentUserId) return

    try {
      // حفظ في قاعدة البيانات
      await supabase
        .from('announcement_views')
        .upsert({
          announcement_id: id,
          user_id: currentUserId,
          read_at: new Date().toISOString()
        }, { onConflict: 'announcement_id,user_id' })

      // تحديث الحالة المحلية
      setAnnouncements(prev => 
        prev.map(a => a.id === id ? { ...a, is_read: true } : a)
      )
    } catch (err) {
      console.error('Error marking as read:', err)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  const unreadCount = announcements.filter(a => !a.is_read).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">التعاميم</h1>
          <p className="text-muted-foreground">
            {unreadCount > 0 ? `لديك ${unreadCount} تعميم غير مقروء` : 'جميع التعاميم مقروءة'}
          </p>
        </div>
      </div>

      {/* Announcements List */}
      <div className="space-y-4">
        {announcements.map((announcement) => (
          <Card 
            key={announcement.id}
            className={`transition-colors ${!announcement.is_read ? 'border-primary/50 bg-primary/5' : ''}`}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {announcement.type === 'urgent_popup' && (
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                    )}
                    <h3 className="font-semibold">{announcement.title}</h3>
                    {announcement.priority === 'high' && (
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                        عاجل
                      </span>
                    )}
                    {!announcement.is_read && (
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                        جديد
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    {announcement.content}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>{formatDate(announcement.sent_at)}</span>
                  </div>
                </div>
                {!announcement.is_read && (
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => markAsRead(announcement.id)}
                  >
                    <Check className="h-4 w-4 ml-2" />
                    تم القراءة
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {announcements.length === 0 && (
        <div className="text-center py-12">
          <Megaphone className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">لا توجد تعاميم</h3>
          <p className="text-muted-foreground">ستظهر التعاميم الجديدة هنا</p>
        </div>
      )}
    </div>
  )
}
