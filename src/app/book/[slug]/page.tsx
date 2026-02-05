'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { 
  Clock,
  User,
  Mail,
  Phone,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  ChevronLeft,
  Globe,
  Video
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createBrowserClient } from '@supabase/ssr'

interface ManagerData {
  id: string
  name: string | null
  role: string | null
  avatar_url: string | null
  meeting_duration: number
  timezone: string
}

interface TimeSlot {
  time: string
  available: boolean
}

interface BookingState {
  step: 'select' | 'form' | 'success'
  selectedDate: Date | null
  selectedTime: string | null
  guestName: string
  guestEmail: string
  guestPhone: string
  storeUrl: string
}

export default function BookingPage() {
  const params = useParams()
  const slug = params.slug as string
  
  const [manager, setManager] = useState<ManagerData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([])
  const [submitting, setSubmitting] = useState(false)
  
  const [booking, setBooking] = useState<BookingState>({
    step: 'select',
    selectedDate: null,
    selectedTime: null,
    guestName: '',
    guestEmail: '',
    guestPhone: '',
    storeUrl: ''
  })

  useEffect(() => {
    const fetchManager = async () => {
      try {
        const supabase = createBrowserClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        )

        console.log('Searching for manager with slug:', slug)

        // محاولة 1: البحث بـ booking_slug
        let { data: profile } = await supabase
          .from('profiles')
          .select('id, name, avatar_url, booking_slug, email')
          .eq('booking_slug', slug)
          .single()

        // محاولة 2: البحث بالـ email (الجزء قبل @)
        if (!profile) {
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, name, avatar_url, booking_slug, email')

          // البحث في البريد الإلكتروني
          profile = profiles?.find(p => {
            const emailPrefix = p.email?.split('@')[0]?.toLowerCase()
            return emailPrefix === slug.toLowerCase() || 
                   emailPrefix?.replace('.', '') === slug.toLowerCase().replace('.', '')
          }) || null
        }

        if (!profile) {
          console.log('Manager not found')
          setError('لم يتم العثور على صفحة الحجز')
          setLoading(false)
          return
        }

        console.log('Found manager:', profile)

        const managerName = profile.name || profile.email?.split('@')[0] || 'مدير العلاقة'
        
        setManager({
          id: profile.id,
          name: managerName,
          role: 'مدير العلاقة',
          avatar_url: profile.avatar_url,
          meeting_duration: 30,
          timezone: 'Asia/Riyadh'
        })

        // تحديث عنوان الصفحة
        document.title = `حجز اجتماع مع ${managerName}`
        
        setLoading(false)
      } catch (err) {
        console.error('Error fetching manager:', err)
        setError('لم يتم العثور على صفحة الحجز')
        setLoading(false)
      }
    }

    fetchManager()
  }, [slug])

  const fetchAvailableSlots = async (date: Date) => {
    const mockSlots: TimeSlot[] = [
      { time: '9:00 ص', available: true },
      { time: '9:40 ص', available: true },
      { time: '10:20 ص', available: true },
      { time: '11:00 ص', available: true },
      { time: '11:40 ص', available: true },
      { time: '12:20 م', available: true },
      { time: '1:00 م', available: true },
      { time: '1:40 م', available: true },
      { time: '2:20 م', available: true },
      { time: '3:00 م', available: true },
      { time: '3:40 م', available: true },
      { time: '4:20 م', available: true },
    ]
    setAvailableSlots(mockSlots)
  }

  const handleDateSelect = (date: Date) => {
    setBooking(prev => ({ ...prev, selectedDate: date, selectedTime: null }))
    fetchAvailableSlots(date)
  }

  const handleTimeSelect = (time: string) => {
    setBooking(prev => ({ 
      ...prev, 
      selectedTime: prev.selectedTime === time ? null : time 
    }))
  }

  const handleNext = () => {
    if (booking.selectedDate && booking.selectedTime) {
      setBooking(prev => ({ ...prev, step: 'form' }))
    }
  }

  const handleSubmit = async () => {
    if (!booking.guestName || !booking.guestEmail || !manager) return
    
    setSubmitting(true)
    try {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )

      // البحث عن المتجر إذا تم إدخال رابط
      let storeId: string | null = null
      if (booking.storeUrl) {
        // تنظيف الرابط - إزالة البروتوكول والـ trailing slash
        let cleanUrl = booking.storeUrl.trim().toLowerCase()
          .replace('https://', '')
          .replace('http://', '')
          .replace(/\/$/, '') // إزالة / من النهاية
        
        console.log('Searching for store with URL:', cleanUrl)
        
        // البحث عن المتجر بالرابط
        const { data: stores } = await supabase
          .from('stores')
          .select('id, store_url')
        
        // البحث يدوياً للتأكد من المطابقة
        if (stores) {
          const matchedStore = stores.find(s => {
            const storeCleanUrl = s.store_url
              .toLowerCase()
              .replace('https://', '')
              .replace('http://', '')
              .replace(/\/$/, '')
            return storeCleanUrl.includes(cleanUrl) || cleanUrl.includes(storeCleanUrl)
          })
          
          if (matchedStore) {
            storeId = matchedStore.id
            console.log('Found store:', matchedStore.id)
          } else {
            console.log('Store not found for URL:', cleanUrl)
          }
        }
      }

      // حساب وقت الاجتماع
      const meetingDate = booking.selectedDate!
      const timeMatch = booking.selectedTime!.match(/(\d+):(\d+)/)
      if (timeMatch) {
        const hours = parseInt(timeMatch[1])
        const minutes = parseInt(timeMatch[2])
        const isPM = booking.selectedTime!.includes('م')
        meetingDate.setHours(isPM && hours !== 12 ? hours + 12 : hours, minutes, 0, 0)
      }

      // إنشاء الاجتماع
      const { data: meeting, error: meetingError } = await supabase
        .from('meetings')
        .insert({
          manager_id: manager.id,
          store_id: storeId,
          guest_name: booking.guestName,
          guest_email: booking.guestEmail,
          guest_phone: booking.guestPhone || null,
          store_url: booking.storeUrl || null,
          scheduled_at: meetingDate.toISOString(),
          status: 'scheduled',
          source: 'booking_page'
        })
        .select()
        .single()

      if (meetingError) {
        console.error('Error creating meeting:', meetingError)
        // إذا كان الجدول غير موجود أو خطأ في الأعمدة، نتجاهل الخطأ ونعرض النجاح
        if (!meetingError.message.includes('does not exist') && !meetingError.code?.startsWith('PGRST')) {
          throw meetingError
        }
      }

      setBooking(prev => ({ ...prev, step: 'success' }))
    } catch (err) {
      console.error('Booking error:', err)
      alert('حدث خطأ في حجز الموعد')
    }
    setSubmitting(false)
  }

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const days: (Date | null)[] = []
    
    // تعديل لبداية الأسبوع من السبت
    let startDay = firstDay.getDay() + 1
    if (startDay === 7) startDay = 0
    
    for (let i = 0; i < startDay; i++) {
      days.push(null)
    }
    
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i))
    }
    
    return days
  }

  const isDateAvailable = (date: Date) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    if (date < today) return false
    const day = date.getDay()
    if (day === 5) return false // الجمعة
    return true
  }

  const isToday = (date: Date) => {
    const today = new Date()
    return date.getDate() === today.getDate() && 
           date.getMonth() === today.getMonth() && 
           date.getFullYear() === today.getFullYear()
  }

  const isSelected = (date: Date) => {
    if (!booking.selectedDate) return false
    return date.getDate() === booking.selectedDate.getDate() && 
           date.getMonth() === booking.selectedDate.getMonth() && 
           date.getFullYear() === booking.selectedDate.getFullYear()
  }

  const formatSelectedDate = (date: Date) => {
    const days = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت']
    return `${days[date.getDay()]} ${date.getDate()} فبراير`
  }

  const monthNames = [
    'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
    'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
  ]

  const dayNames = ['أحد', 'إثن', 'ثلا', 'أرب', 'خمي', 'جمع', 'سبت']

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0f0a1f]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#a855f7]"></div>
      </div>
    )
  }

  if (error || !manager) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0f0a1f]">
        <div className="bg-[#1a1230] border border-[#5a4985]/60 rounded-xl p-8 text-center max-w-md mx-4">
          <AlertTriangle className="h-12 w-12 mx-auto text-red-500 mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">خطأ</h2>
          <p className="text-[#8b7fad]">{error || 'الصفحة غير موجودة'}</p>
        </div>
      </div>
    )
  }

  // Success State
  if (booking.step === 'success') {
    return (
      <div className="min-h-screen bg-[#0f0a1f] flex items-center justify-center p-4" dir="rtl">
        <div className="bg-[#1a1230] border border-[#5a4985]/60 rounded-xl p-8 text-center max-w-md w-full">
          <CheckCircle2 className="h-16 w-16 mx-auto text-green-500 mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">تم الحجز بنجاح!</h2>
          <p className="text-[#8b7fad] mb-4">تم حجز موعدك مع {manager.name}</p>
          <div className="bg-[#2d1f4e] p-4 rounded-lg text-right mb-4">
            <p className="font-medium text-white">{formatSelectedDate(booking.selectedDate!)}</p>
            <p className="text-[#8b7fad]">الساعة {booking.selectedTime}</p>
          </div>
          <p className="text-sm text-[#8b7fad]">
            تم إرسال تأكيد إلى بريدك الإلكتروني: {booking.guestEmail}
          </p>
        </div>
      </div>
    )
  }

  // Form Step
  if (booking.step === 'form') {
    return (
      <div className="min-h-screen bg-[#0f0a1f] flex items-center justify-center p-4" dir="rtl">
        <div className="bg-[#1a1230] border border-[#5a4985]/60 rounded-xl p-6 max-w-md w-full">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-[18px] font-bold text-white">بياناتك</h2>
            <button 
              onClick={() => setBooking(prev => ({ ...prev, step: 'select' }))}
              className="text-[#a855f7] text-sm hover:underline"
            >
              تغيير الموعد
            </button>
          </div>
          
          <div className="bg-[#2d1f4e] p-3 rounded-lg mb-6">
            <p className="font-medium text-white">{formatSelectedDate(booking.selectedDate!)}</p>
            <p className="text-[#8b7fad] text-sm">الساعة {booking.selectedTime}</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-[13px] text-[#c4b5fd] mb-1.5 block">الاسم الكامل *</label>
              <div className="relative">
                <User className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8b7fad]" />
                <Input
                  placeholder="أدخل اسمك"
                  value={booking.guestName}
                  onChange={(e) => setBooking(prev => ({ ...prev, guestName: e.target.value }))}
                  className="pr-10 bg-[#0f0a1f] border-[#5a4985]/60 text-white placeholder:text-[#8b7fad] focus:border-[#a855f7]"
                />
              </div>
            </div>
            <div>
              <label className="text-[13px] text-[#c4b5fd] mb-1.5 block">البريد الإلكتروني *</label>
              <div className="relative">
                <Mail className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8b7fad]" />
                <Input
                  type="email"
                  placeholder="example@email.com"
                  value={booking.guestEmail}
                  onChange={(e) => setBooking(prev => ({ ...prev, guestEmail: e.target.value }))}
                  className="pr-10 bg-[#0f0a1f] border-[#5a4985]/60 text-white placeholder:text-[#8b7fad] focus:border-[#a855f7]"
                  dir="ltr"
                />
              </div>
            </div>
            <div>
              <label className="text-[13px] text-[#c4b5fd] mb-1.5 block">رقم الجوال</label>
              <div className="relative">
                <Phone className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8b7fad]" />
                <Input
                  type="tel"
                  placeholder="+966 5XX XXX XXXX"
                  value={booking.guestPhone}
                  onChange={(e) => setBooking(prev => ({ ...prev, guestPhone: e.target.value }))}
                  className="pr-10 bg-[#0f0a1f] border-[#5a4985]/60 text-white placeholder:text-[#8b7fad] focus:border-[#a855f7]"
                  dir="ltr"
                />
              </div>
            </div>
            <div>
              <label className="text-[13px] text-[#c4b5fd] mb-1.5 block">رابط المتجر</label>
              <div className="relative">
                <Globe className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8b7fad]" />
                <Input
                  type="url"
                  placeholder="https://example.zid.store"
                  value={booking.storeUrl}
                  onChange={(e) => setBooking(prev => ({ ...prev, storeUrl: e.target.value }))}
                  className="pr-10 bg-[#0f0a1f] border-[#5a4985]/60 text-white placeholder:text-[#8b7fad] focus:border-[#a855f7]"
                  dir="ltr"
                />
              </div>
            </div>
            <Button 
              onClick={handleSubmit}
              disabled={submitting || !booking.guestName || !booking.guestEmail}
              className="w-full bg-[#a855f7] hover:bg-[#9333ea] text-white"
            >
              {submitting ? 'جاري الحجز...' : 'تأكيد الحجز'}
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Main Selection View
  return (
    <div className="min-h-screen bg-[#0f0a1f] flex flex-col" dir="rtl">
      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-4 md:p-8">
        <div className="bg-[#1a1230] border border-[#5a4985]/60 rounded-2xl overflow-hidden w-full max-w-4xl">
          <div className="flex flex-col md:flex-row">
            {/* Right Side - Manager Info */}
            <div className="w-full md:w-72 p-6 border-b md:border-b-0 md:border-l border-[#5a4985]/60">
              {/* Logo & Name */}
              <div className="flex items-center gap-3 mb-6">
                <img 
                    src="/zid-logo.png" 
                    alt="زد" 
                    className="h-8"
                  />
                <div className="border-r border-[#5a4985]/60 h-6 mx-2"></div>
                <div>
                  <p className="text-white font-bold">{manager.name}</p>
                  <p className="text-[#8b7fad] text-xs">{manager.role}</p>
                </div>
              </div>

              {/* Meeting Info */}
              <h2 className="text-white text-xl font-bold mb-4">اجتماع {manager.meeting_duration} دقيقة</h2>
              
              <div className="space-y-3 text-[#8b7fad] text-sm">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span>{manager.meeting_duration} دقيقة</span>
                </div>
                <div className="flex items-center gap-2">
                  <Video className="h-4 w-4" />
                  <span>سيتم إرسال تفاصيل الاجتماع عند التأكيد</span>
                </div>
              </div>
            </div>

            {/* Left Side - Calendar & Time Selection */}
            <div className="flex-1 p-6">
              <h3 className="text-white text-lg font-bold text-center mb-6">اختر التاريخ والوقت</h3>
              
              <div className={`flex flex-col ${booking.selectedDate ? 'lg:flex-row' : ''} gap-6`}>
                {/* Time Slots - تظهر فقط عند اختيار التاريخ */}
                {booking.selectedDate && (
                  <div className="flex-1 order-2 lg:order-1">
                    <p className="text-[#a855f7] text-sm mb-3">{formatSelectedDate(booking.selectedDate)}</p>
                    <div className="grid grid-cols-3 gap-2">
                      {availableSlots.map((slot) => (
                        <button
                          key={slot.time}
                          onClick={() => slot.available && handleTimeSelect(slot.time)}
                          disabled={!slot.available}
                          className={`py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                            booking.selectedTime === slot.time
                              ? 'bg-[#a855f7] text-white'
                              : slot.available
                                ? 'bg-[#2d1f4e] text-white hover:bg-[#3d2f5e] border border-[#5a4985]/60'
                                : 'bg-[#1a1230] text-[#5a4985] cursor-not-allowed'
                          }`}
                        >
                          {slot.time}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Calendar - يكون كبير في البداية ويصغر عند اختيار التاريخ */}
                <div className={`${booking.selectedDate ? 'w-full lg:w-56' : 'w-full max-w-xs mx-auto'} order-1 lg:order-2 transition-all`}>
                  {/* Month Navigation */}
                  <div className="flex items-center justify-between mb-4">
                    <button 
                      onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
                      className="p-1 text-[#8b7fad] hover:text-white transition-colors"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                    <span className="text-white font-medium">
                      {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                    </span>
                    <button 
                      onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
                      className="p-1 text-[#8b7fad] hover:text-white transition-colors"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                  </div>

                  {/* Day Names */}
                  <div className="grid grid-cols-7 gap-1 mb-2">
                    {dayNames.map(day => (
                      <div key={day} className="text-center text-xs text-[#8b7fad] py-1">
                        {day}
                      </div>
                    ))}
                  </div>

                  {/* Calendar Grid */}
                  <div className="grid grid-cols-7 gap-1">
                    {getDaysInMonth(currentMonth).map((date, index) => (
                      <div key={index} className="aspect-square flex items-center justify-center">
                        {date && (
                          <button
                            onClick={() => isDateAvailable(date) && handleDateSelect(date)}
                            disabled={!isDateAvailable(date)}
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm transition-all ${
                              isSelected(date)
                                ? 'bg-[#a855f7] text-white'
                                : isDateAvailable(date)
                                  ? 'text-[#a855f7] hover:bg-[#2d1f4e]'
                                  : 'text-[#5a4985] cursor-not-allowed'
                            }`}
                          >
                            {date.getDate()}
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Next Button */}
              <div className="flex justify-center mt-8">
                <Button 
                  onClick={handleNext}
                  disabled={!booking.selectedDate || !booking.selectedTime}
                  className="px-12 bg-[#a855f7] hover:bg-[#9333ea] text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  التالي
                </Button>
              </div>
            </div>
          </div>

          {/* Footer - أسفل الجدول */}
          <div className="flex items-center justify-center gap-2 text-[#8b7fad] text-sm py-4 border-t border-[#5a4985]/60">
            <span>بواسطة</span>
            <img src="/zid-logo.png" alt="زد" className="h-5" />
          </div>
        </div>
      </div>
    </div>
  )
}
