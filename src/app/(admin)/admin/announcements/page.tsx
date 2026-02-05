'use client'

import { useEffect, useState } from 'react'
import { 
  Megaphone, 
  Plus, 
  Clock,
  Send,
  AlertTriangle,
  MoreVertical,
  Users,
  User,
  X,
  Loader2
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
  status: 'draft' | 'scheduled' | 'sent'
  target_type: 'all' | 'specific'
  send_at: string | null
  sent_at: string | null
  created_by_id: string | null
  created_at: string
  updated_at: string
  target_count?: number
}

export default function AdminAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'all' | 'draft' | 'scheduled' | 'sent'>('all')
  const [showAddModal, setShowAddModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [newAnnouncement, setNewAnnouncement] = useState({
    title: '',
    content: '',
    type: 'normal' as 'normal' | 'urgent_popup',
    priority: 'normal' as 'low' | 'normal' | 'high',
    target_type: 'all' as 'all' | 'specific'
  })
  const [managers, setManagers] = useState<{id: string, name: string, email: string}[]>([])
  const [selectedManagers, setSelectedManagers] = useState<string[]>([])
  const [sendTime, setSendTime] = useState<'now' | 'scheduled'>('now')
  const [scheduledDate, setScheduledDate] = useState('')
  const [scheduledTime, setScheduledTime] = useState('')
  const [menuOpen, setMenuOpen] = useState<string | null>(null)
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null)
  const [showViewersModal, setShowViewersModal] = useState(false)
  const [selectedAnnouncementId, setSelectedAnnouncementId] = useState<string | null>(null)
  const [viewers, setViewers] = useState<{id: string, name: string, email: string, read_at: string}[]>([])

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const fetchAnnouncements = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setAnnouncements(data || [])
    } catch (err) {
      console.error('Error fetching announcements:', err)
    }
    setLoading(false)
  }

  const fetchManagers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, email')
        .order('name')

      if (error) throw error
      console.log('Fetched managers:', data)
      setManagers(data || [])
    } catch (err) {
      console.error('Error fetching managers:', err)
    }
  }

  // فحص وإرسال التعاميم المجدولة التي حان وقتها
  const checkAndSendScheduledAnnouncements = async () => {
    try {
      const now = new Date().toISOString()
      
      // جلب التعاميم المجدولة التي حان وقتها
      const { data: dueAnnouncements, error } = await supabase
        .from('announcements')
        .select('id')
        .eq('status', 'scheduled')
        .lte('send_at', now)

      if (error) throw error

      // تحديث حالتها إلى مرسلة
      if (dueAnnouncements && dueAnnouncements.length > 0) {
        const ids = dueAnnouncements.map(a => a.id)
        await supabase
          .from('announcements')
          .update({ status: 'sent' })
          .in('id', ids)
        
        console.log(`تم إرسال ${dueAnnouncements.length} تعميم مجدول`)
        await fetchAnnouncements()
      }
    } catch (err) {
      console.error('Error checking scheduled announcements:', err)
    }
  }

  useEffect(() => {
    fetchAnnouncements()
    fetchManagers()
    
    // فحص التعاميم المجدولة عند التحميل
    checkAndSendScheduledAnnouncements()
    
    // فحص كل دقيقة
    const interval = setInterval(checkAndSendScheduledAnnouncements, 60000)
    return () => clearInterval(interval)
  }, [])

  const filteredAnnouncements = announcements.filter(a => 
    activeTab === 'all' || a.status === activeTab
  )

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      draft: 'bg-[#5a4985]/30 text-[#c4b5fd]',
      scheduled: 'bg-[#3b82f6]/20 text-[#60a5fa]',
      sent: 'bg-[#22c55e]/20 text-[#4ade80]'
    }
    const labels: Record<string, string> = {
      draft: 'مسودة',
      scheduled: 'مجدول',
      sent: '✓ تم الإرسال'
    }
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${styles[status]}`}>
        {labels[status]}
      </span>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">التعاميم</h1>
          <p className="text-muted-foreground">إدارة التعاميم والإشعارات</p>
        </div>
        <Button onClick={() => setShowAddModal(true)}>
          <Plus className="h-4 w-4 ml-2" />
          إنشاء تعميم
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        {[
          { key: 'all', label: 'الكل' },
          { key: 'draft', label: 'المسودات' },
          { key: 'scheduled', label: 'المجدولة' },
          { key: 'sent', label: 'المرسلة' }
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as typeof activeTab)}
            className={`px-4 py-2 border-b-2 transition-colors ${
              activeTab === tab.key
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Announcements List */}
      <div className="space-y-4">
        {filteredAnnouncements.map((announcement) => (
          <Card key={announcement.id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {announcement.type === 'urgent_popup' && (
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                    )}
                    <h3 className="font-semibold">{announcement.title}</h3>
                    {getStatusBadge(announcement.status)}
                    {announcement.priority === 'high' && (
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                        عالية الأهمية
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                    {announcement.content}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      {announcement.target_type === 'all' ? (
                        <Users className="h-3 w-3" />
                      ) : (
                        <User className="h-3 w-3" />
                      )}
                      {announcement.target_type === 'all' 
                        ? 'جميع المدراء' 
                        : `${announcement.target_count} مدير`}
                    </span>
                    {announcement.status === 'scheduled' && announcement.send_at && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(announcement.send_at).toLocaleDateString('ar-SA')}
                      </span>
                    )}
                    {announcement.status === 'sent' && announcement.sent_at && (
                      <span className="flex items-center gap-1">
                        <Send className="h-3 w-3" />
                        أُرسل {new Date(announcement.sent_at).toLocaleDateString('ar-SA')}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {/* زر إرسال للمسودات */}
                  {announcement.status === 'draft' && (
                    <Button 
                      size="sm"
                      onClick={async () => {
                        try {
                          await supabase
                            .from('announcements')
                            .update({ status: 'sent' })
                            .eq('id', announcement.id)
                          await fetchAnnouncements()
                        } catch (err) {
                          console.error('Error sending:', err)
                        }
                      }}
                    >
                      <Send className="h-4 w-4 ml-2" />
                      إرسال
                    </Button>
                  )}
                  {/* زر إرسال للمجدولة التي حان وقتها */}
                  {announcement.status === 'scheduled' && (
                    <Button 
                      size="sm"
                      className="bg-[#22c55e] hover:bg-[#16a34a]"
                      onClick={async () => {
                        try {
                          await supabase
                            .from('announcements')
                            .update({ status: 'sent' })
                            .eq('id', announcement.id)
                          await fetchAnnouncements()
                        } catch (err) {
                          console.error('Error sending:', err)
                        }
                      }}
                    >
                      <Send className="h-4 w-4 ml-2" />
                      إرسال الآن
                    </Button>
                  )}
                  <div className="relative">
                    <button 
                      className="p-1 hover:bg-[#3d2d5a] rounded"
                      onClick={() => setMenuOpen(menuOpen === announcement.id ? null : announcement.id)}
                    >
                      <MoreVertical className="h-4 w-4" />
                    </button>
                    
                    {/* القائمة المنسدلة */}
                    {menuOpen === announcement.id && (
                      <div className="absolute left-0 top-8 bg-[#2d1f4e] border border-[#5a4985]/40 rounded-lg shadow-lg z-10 min-w-[150px]">
                        <button
                          className="w-full px-4 py-2 text-right text-sm text-white hover:bg-[#3d2d5a] flex items-center gap-2"
                          onClick={() => {
                            setEditingAnnouncement(announcement)
                            setNewAnnouncement({
                              title: announcement.title,
                              content: announcement.content,
                              type: announcement.type,
                              priority: announcement.priority,
                              target_type: announcement.target_type
                            })
                            setShowAddModal(true)
                            setMenuOpen(null)
                          }}
                        >
                          ✏️ تعديل
                        </button>
                        <button
                          className="w-full px-4 py-2 text-right text-sm text-white hover:bg-[#3d2d5a] flex items-center gap-2"
                          onClick={async () => {
                            setSelectedAnnouncementId(announcement.id)
                            // جلب المشاهدين من جدول announcement_views
                            try {
                              const { data, error } = await supabase
                                .from('announcement_views')
                                .select('profiles(id, name, email), read_at')
                                .eq('announcement_id', announcement.id)
                              
                              if (error) {
                                console.error('Error fetching viewers:', error)
                                // إذا لم يوجد الجدول، نعرض قائمة فارغة
                                setViewers([])
                              } else {
                                const viewersList = (data || []).map((v: any) => ({
                                  id: v.profiles?.id || '',
                                  name: v.profiles?.name || '',
                                  email: v.profiles?.email || '',
                                  read_at: v.read_at
                                }))
                                setViewers(viewersList)
                              }
                            } catch (err) {
                              console.error('Error:', err)
                              setViewers([])
                            }
                            setShowViewersModal(true)
                            setMenuOpen(null)
                          }}
                        >
                          👁️ من شاهد
                        </button>
                        <button
                          className="w-full px-4 py-2 text-right text-sm text-red-400 hover:bg-[#3d2d5a] flex items-center gap-2"
                          onClick={async () => {
                            if (confirm('هل أنت متأكد من حذف هذا التعميم؟')) {
                              try {
                                await supabase
                                  .from('announcements')
                                  .delete()
                                  .eq('id', announcement.id)
                                await fetchAnnouncements()
                              } catch (err) {
                                console.error('Error deleting:', err)
                              }
                            }
                            setMenuOpen(null)
                          }}
                        >
                          🗑️ حذف
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredAnnouncements.length === 0 && (
        <div className="text-center py-12">
          <Megaphone className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">لا توجد تعاميم</h3>
          <p className="text-muted-foreground">ابدأ بإنشاء تعميم جديد</p>
        </div>
      )}

      {/* Add Announcement Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[#2d1f4e] border border-[#5a4985]/40 rounded-xl p-6 w-full max-w-lg mx-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">
                {editingAnnouncement ? 'تعديل التعميم' : 'إنشاء تعميم جديد'}
              </h2>
              <button
                onClick={() => {
                  setShowAddModal(false)
                  setEditingAnnouncement(null)
                  setNewAnnouncement({
                    title: '',
                    content: '',
                    type: 'normal',
                    priority: 'normal',
                    target_type: 'all'
                  })
                }}
                className="p-2 hover:bg-[#3d2d5a] rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-[#8b7fad]" />
              </button>
            </div>

            <form onSubmit={async (e) => {
              e.preventDefault()
              setSaving(true)
              try {
                if (editingAnnouncement) {
                  // تعديل تعميم موجود
                  const { error } = await supabase
                    .from('announcements')
                    .update({
                      title: newAnnouncement.title,
                      content: newAnnouncement.content,
                      type: newAnnouncement.type,
                      priority: newAnnouncement.priority,
                      target_type: newAnnouncement.target_type
                    })
                    .eq('id', editingAnnouncement.id)

                  if (error) throw error
                } else {
                  // إنشاء تعميم جديد
                  const { error } = await supabase
                    .from('announcements')
                    .insert({
                      title: newAnnouncement.title,
                      content: newAnnouncement.content,
                      type: newAnnouncement.type,
                      priority: newAnnouncement.priority,
                      target_type: newAnnouncement.target_type,
                      status: 'draft'
                    })

                  if (error) throw error
                }

                await fetchAnnouncements()
                setShowAddModal(false)
                setEditingAnnouncement(null)
                setNewAnnouncement({
                  title: '',
                  content: '',
                  type: 'normal',
                  priority: 'normal',
                  target_type: 'all'
                })
              } catch (err) {
                console.error('Error creating announcement:', err)
                alert('حدث خطأ أثناء إنشاء التعميم')
              }
              setSaving(false)
            }} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#c4b5fd] mb-2">العنوان</label>
                <input
                  type="text"
                  value={newAnnouncement.title}
                  onChange={(e) => setNewAnnouncement({ ...newAnnouncement, title: e.target.value })}
                  className="w-full h-10 px-4 text-[14px] bg-[#1a1230] border border-[#5a4985]/60 rounded-lg text-white placeholder:text-[#8b7fad] focus:outline-none focus:border-[#a855f7]"
                  placeholder="عنوان التعميم"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#c4b5fd] mb-2">المحتوى</label>
                <textarea
                  value={newAnnouncement.content}
                  onChange={(e) => setNewAnnouncement({ ...newAnnouncement, content: e.target.value })}
                  className="w-full h-32 px-4 py-3 text-[14px] bg-[#1a1230] border border-[#5a4985]/60 rounded-lg text-white placeholder:text-[#8b7fad] focus:outline-none focus:border-[#a855f7] resize-none"
                  placeholder="محتوى التعميم..."
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#c4b5fd] mb-2">النوع</label>
                  <select
                    value={newAnnouncement.type}
                    onChange={(e) => setNewAnnouncement({ ...newAnnouncement, type: e.target.value as 'normal' | 'urgent_popup' })}
                    className="w-full h-10 px-4 text-[14px] bg-[#1a1230] border border-[#5a4985]/60 rounded-lg text-white focus:outline-none focus:border-[#a855f7]"
                  >
                    <option value="normal">عادي</option>
                    <option value="urgent_popup">عاجل (منبثق)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#c4b5fd] mb-2">الأهمية</label>
                  <select
                    value={newAnnouncement.priority}
                    onChange={(e) => setNewAnnouncement({ ...newAnnouncement, priority: e.target.value as 'low' | 'normal' | 'high' })}
                    className="w-full h-10 px-4 text-[14px] bg-[#1a1230] border border-[#5a4985]/60 rounded-lg text-white focus:outline-none focus:border-[#a855f7]"
                  >
                    <option value="low">منخفضة</option>
                    <option value="normal">عادية</option>
                    <option value="high">عالية</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#c4b5fd] mb-2">المستهدفين</label>
                <select
                  value={newAnnouncement.target_type}
                  onChange={(e) => {
                    setNewAnnouncement({ ...newAnnouncement, target_type: e.target.value as 'all' | 'specific' })
                    if (e.target.value === 'all') setSelectedManagers([])
                  }}
                  className="w-full h-10 px-4 text-[14px] bg-[#1a1230] border border-[#5a4985]/60 rounded-lg text-white focus:outline-none focus:border-[#a855f7]"
                >
                  <option value="all">جميع المدراء</option>
                  <option value="specific">مدراء محددين</option>
                </select>
              </div>

              {/* اختيار المدراء المحددين */}
              {newAnnouncement.target_type === 'specific' && (
                <div>
                  <label className="block text-sm font-medium text-[#c4b5fd] mb-2">
                    اختر المدراء ({selectedManagers.length} محدد)
                  </label>
                  <div className="max-h-40 overflow-y-auto bg-[#1a1230] border border-[#5a4985]/60 rounded-lg p-2 space-y-1">
                    {managers.map((manager) => (
                      <label
                        key={manager.id}
                        className="flex items-center gap-3 p-2 hover:bg-[#2d1f4e] rounded-lg cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedManagers.includes(manager.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedManagers([...selectedManagers, manager.id])
                            } else {
                              setSelectedManagers(selectedManagers.filter(id => id !== manager.id))
                            }
                          }}
                          className="w-4 h-4 rounded border-[#5a4985] bg-[#1a1230] text-[#a855f7] focus:ring-[#a855f7]"
                        />
                        <div>
                          <p className="text-sm text-white">{manager.name || manager.email.split('@')[0]}</p>
                          <p className="text-xs text-[#8b7fad]">{manager.email}</p>
                        </div>
                      </label>
                    ))}
                    {managers.length === 0 && (
                      <p className="text-sm text-[#8b7fad] text-center py-2">لا يوجد مدراء</p>
                    )}
                  </div>
                </div>
              )}

              {/* خيار الجدولة */}
              <div>
                <label className="block text-sm font-medium text-[#c4b5fd] mb-2">وقت الإرسال</label>
                <div className="flex gap-3">
                  <label className={`flex items-center gap-2 p-3 border rounded-lg cursor-pointer flex-1 ${sendTime === 'now' ? 'bg-[#a855f7]/20 border-[#a855f7]' : 'bg-[#1a1230] border-[#5a4985]/60'}`}>
                    <input
                      type="radio"
                      name="sendTime"
                      value="now"
                      checked={sendTime === 'now'}
                      onChange={() => setSendTime('now')}
                      className="w-4 h-4 text-[#a855f7] focus:ring-[#a855f7]"
                    />
                    <span className="text-sm text-white">إرسال الآن</span>
                  </label>
                  <label className={`flex items-center gap-2 p-3 border rounded-lg cursor-pointer flex-1 ${sendTime === 'scheduled' ? 'bg-[#a855f7]/20 border-[#a855f7]' : 'bg-[#1a1230] border-[#5a4985]/60'}`}>
                    <input
                      type="radio"
                      name="sendTime"
                      value="scheduled"
                      checked={sendTime === 'scheduled'}
                      onChange={() => setSendTime('scheduled')}
                      className="w-4 h-4 text-[#a855f7] focus:ring-[#a855f7]"
                    />
                    <span className="text-sm text-white">جدولة</span>
                  </label>
                </div>
              </div>

              {/* حقول التاريخ والوقت عند اختيار جدولة */}
              {sendTime === 'scheduled' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-[#c4b5fd] mb-2">التاريخ</label>
                    <input
                      type="date"
                      value={scheduledDate}
                      onChange={(e) => setScheduledDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full h-10 px-4 text-[14px] bg-[#1a1230] border border-[#5a4985]/60 rounded-lg text-white focus:outline-none focus:border-[#a855f7]"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#c4b5fd] mb-2">الوقت</label>
                    <input
                      type="time"
                      value={scheduledTime}
                      onChange={(e) => setScheduledTime(e.target.value)}
                      className="w-full h-10 px-4 text-[14px] bg-[#1a1230] border border-[#5a4985]/60 rounded-lg text-white focus:outline-none focus:border-[#a855f7]"
                      required
                    />
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                {/* زر حفظ كمسودة - يظهر دائماً */}
                <Button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-[#a855f7] hover:bg-[#9333ea] text-white"
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                      جاري الحفظ...
                    </>
                  ) : (
                    'حفظ كمسودة'
                  )}
                </Button>

                {/* زر إرسال/جدولة - يتغير حسب الاختيار */}
                <Button
                  type="button"
                  disabled={saving || (sendTime === 'scheduled' && (!scheduledDate || !scheduledTime))}
                  onClick={async () => {
                    setSaving(true)
                    try {
                      // تحديد وقت الإرسال للجدولة
                      const sendAtTime = sendTime === 'scheduled' && scheduledDate && scheduledTime
                        ? new Date(`${scheduledDate}T${scheduledTime}`).toISOString()
                        : null

                      const { error } = await supabase
                        .from('announcements')
                        .insert({
                          title: newAnnouncement.title,
                          content: newAnnouncement.content,
                          type: newAnnouncement.type,
                          priority: newAnnouncement.priority,
                          target_type: newAnnouncement.target_type,
                          status: sendTime === 'now' ? 'sent' : 'scheduled',
                          send_at: sendAtTime
                        })

                      if (error) throw error

                      await fetchAnnouncements()
                      setShowAddModal(false)
                      setNewAnnouncement({
                        title: '',
                        content: '',
                        type: 'normal',
                        priority: 'normal',
                        target_type: 'all'
                      })
                      setSendTime('now')
                      setScheduledDate('')
                      setScheduledTime('')
                    } catch (err: any) {
                      console.error('Error sending announcement:', err)
                      alert('حدث خطأ أثناء إرسال التعميم: ' + (err?.message || JSON.stringify(err)))
                    }
                    setSaving(false)
                  }}
                  className={`flex-1 ${sendTime === 'now' ? 'bg-[#22c55e] hover:bg-[#16a34a]' : 'bg-[#3b82f6] hover:bg-[#2563eb]'} text-white`}
                >
                  <Send className="h-4 w-4 ml-2" />
                  {sendTime === 'now' ? 'إرسال الآن' : 'جدولة الإرسال'}
                </Button>

                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setShowAddModal(false)}
                  className="border-[#5a4985] text-[#c4b5fd] hover:bg-[#3d2d5a]"
                >
                  إلغاء
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* نافذة من شاهد التعميم */}
      {showViewersModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[#2d1f4e] border border-[#5a4985]/40 rounded-xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">من شاهد التعميم</h2>
              <button
                onClick={() => {
                  setShowViewersModal(false)
                  setViewers([])
                }}
                className="p-2 hover:bg-[#3d2d5a] rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-[#8b7fad]" />
              </button>
            </div>

            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {viewers.length > 0 ? (
                viewers.map((viewer) => (
                  <div key={viewer.id} className="flex items-center justify-between p-3 bg-[#1a1230] rounded-lg">
                    <div>
                      <p className="text-white font-medium">{viewer.name || viewer.email?.split('@')[0]}</p>
                      <p className="text-xs text-[#8b7fad]">{viewer.email}</p>
                    </div>
                    <div className="text-left">
                      <p className="text-xs text-[#4ade80]">✓ شاهد</p>
                      <p className="text-xs text-[#8b7fad]">
                        {viewer.read_at ? new Date(viewer.read_at).toLocaleDateString('ar-SA') : ''}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <p className="text-[#8b7fad]">لم يشاهد أحد هذا التعميم بعد</p>
                </div>
              )}
            </div>

            <div className="mt-4 pt-4 border-t border-[#5a4985]/40">
              <p className="text-sm text-[#8b7fad] text-center">
                إجمالي المشاهدات: <span className="text-white font-bold">{viewers.length}</span>
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
