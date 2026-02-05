'use client'

import { useEffect, useState } from 'react'
import { 
  Calendar, 
  Clock,
  Link2,
  Copy,
  Plus,
  Settings,
  CalendarOff,
  User
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { createBrowserClient } from '@supabase/ssr'

interface Meeting {
  id: string
  start_at: string
  end_at: string
  guest_name: string
  guest_email: string
  status: 'booked' | 'cancelled'
}

interface AvailabilityRule {
  id: string
  day_of_week: number
  start_time: string
  end_time: string
}

export default function ManagerMeetingsPage() {
  const [activeTab, setActiveTab] = useState<'upcoming' | 'settings' | 'availability' | 'timeoff'>('upcoming')
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [availabilityRules, setAvailabilityRules] = useState<AvailabilityRule[]>([])
  const [bookingSlug, setBookingSlug] = useState<string>('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchUserSlug = async () => {
      try {
        const supabase = createBrowserClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        )
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('email, name')
            .eq('id', user.id)
            .single()
          
          if (profile) {
            // Generate slug from email (before @)
            const emailSlug = profile.email.split('@')[0].replace(/\./g, '-')
            setBookingSlug(emailSlug)
          }
        }
      } catch (error) {
        console.error('Error fetching user:', error)
      }
    }
    
    fetchUserSlug()
    
    // TODO: Fetch from API
    const mockMeetings: Meeting[] = [
      {
        id: '1',
        start_at: new Date(Date.now() + 3600000).toISOString(),
        end_at: new Date(Date.now() + 5400000).toISOString(),
        guest_name: 'أحمد محمد',
        guest_email: 'ahmed@example.com',
        status: 'booked'
      },
      {
        id: '2',
        start_at: new Date(Date.now() + 86400000).toISOString(),
        end_at: new Date(Date.now() + 88200000).toISOString(),
        guest_name: 'سارة علي',
        guest_email: 'sara@example.com',
        status: 'booked'
      }
    ]
    
    const mockRules: AvailabilityRule[] = [
      { id: '1', day_of_week: 0, start_time: '09:00', end_time: '17:00' },
      { id: '2', day_of_week: 1, start_time: '09:00', end_time: '17:00' },
      { id: '3', day_of_week: 2, start_time: '09:00', end_time: '17:00' },
      { id: '4', day_of_week: 3, start_time: '09:00', end_time: '17:00' },
      { id: '5', day_of_week: 4, start_time: '09:00', end_time: '17:00' }
    ]
    
    setMeetings(mockMeetings)
    setAvailabilityRules(mockRules)
    setLoading(false)
  }, [])

  const dayNames = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت']

  const copyBookingLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/book/${bookingSlug}`)
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('ar-SA', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-SA', { 
      weekday: 'long',
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">الاجتماعات</h1>
          <p className="text-muted-foreground">إدارة مواعيدك واجتماعاتك</p>
        </div>
      </div>

      {/* Booking Link */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link2 className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">رابط الحجز الخاص بك</p>
                <code className="text-xs bg-muted px-2 py-1 rounded">
                  {window.location.origin}/book/{bookingSlug}
                </code>
              </div>
            </div>
            <Button variant="secondary" size="sm" onClick={copyBookingLink}>
              <Copy className="h-4 w-4 ml-2" />
              نسخ الرابط
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        {[
          { key: 'upcoming', label: 'الاجتماعات القادمة', icon: Calendar },
          { key: 'availability', label: 'ساعات العمل', icon: Clock },
          { key: 'timeoff', label: 'أوقات الراحة', icon: CalendarOff },
          { key: 'settings', label: 'الإعدادات', icon: Settings }
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as typeof activeTab)}
            className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-colors ${
              activeTab === tab.key
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'upcoming' && (
        <div className="space-y-4">
          {meetings.length > 0 ? (
            meetings.map((meeting) => (
              <Card key={meeting.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                        <User className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold">{meeting.guest_name}</p>
                        <p className="text-sm text-muted-foreground">{meeting.guest_email}</p>
                      </div>
                    </div>
                    <div className="text-left">
                      <p className="font-medium">{formatDate(meeting.start_at)}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatTime(meeting.start_at)} - {formatTime(meeting.end_at)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">لا توجد اجتماعات قادمة</h3>
              <p className="text-muted-foreground">شارك رابط الحجز مع عملائك</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'availability' && (
        <Card>
          <CardHeader>
            <CardTitle>ساعات العمل</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {dayNames.map((day, index) => {
                const rule = availabilityRules.find(r => r.day_of_week === index)
                return (
                  <div 
                    key={index}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                  >
                    <span className="font-medium">{day}</span>
                    {rule ? (
                      <span className="text-sm">
                        {rule.start_time} - {rule.end_time}
                      </span>
                    ) : (
                      <span className="text-sm text-muted-foreground">مغلق</span>
                    )}
                  </div>
                )
              })}
            </div>
            <Button className="w-full mt-4">
              <Plus className="h-4 w-4 ml-2" />
              تعديل ساعات العمل
            </Button>
          </CardContent>
        </Card>
      )}

      {activeTab === 'timeoff' && (
        <Card>
          <CardHeader>
            <CardTitle>أوقات الراحة والإجازات</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <CalendarOff className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">لا توجد إجازات مجدولة</p>
            </div>
            <Button className="w-full">
              <Plus className="h-4 w-4 ml-2" />
              إضافة وقت راحة
            </Button>
          </CardContent>
        </Card>
      )}

      {activeTab === 'settings' && (
        <Card>
          <CardHeader>
            <CardTitle>إعدادات الاجتماعات</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div>
                  <p className="font-medium">مدة الاجتماع</p>
                  <p className="text-sm text-muted-foreground">المدة الافتراضية لكل اجتماع</p>
                </div>
                <span className="font-medium">30 دقيقة</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div>
                  <p className="font-medium">المنطقة الزمنية</p>
                  <p className="text-sm text-muted-foreground">التوقيت المستخدم للمواعيد</p>
                </div>
                <span className="font-medium">Asia/Riyadh</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div>
                  <p className="font-medium">الحد الأدنى للحجز المسبق</p>
                  <p className="text-sm text-muted-foreground">أقل وقت قبل الاجتماع للحجز</p>
                </div>
                <span className="font-medium">24 ساعة</span>
              </div>
            </div>
            <Button className="w-full mt-4">
              <Settings className="h-4 w-4 ml-2" />
              تعديل الإعدادات
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
