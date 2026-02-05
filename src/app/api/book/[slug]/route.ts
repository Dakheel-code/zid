import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// GET - Get manager info and available slots
export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const { slug } = params
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date')

    // Get manager by booking slug
    const { data: manager, error: managerError } = await supabase
      .from('profiles')
      .select(`
        id,
        name,
        avatar_url,
        booking_slug,
        meeting_settings (
          id,
          meeting_duration,
          buffer_before,
          buffer_after,
          timezone,
          min_booking_notice,
          max_booking_days
        )
      `)
      .eq('booking_slug', slug)
      .eq('role', 'manager')
      .single()

    if (managerError || !manager) {
      return NextResponse.json(
        { error: 'لم يتم العثور على صفحة الحجز' },
        { status: 404 }
      )
    }

    const settings = (manager.meeting_settings as any)?.[0] || {
      meeting_duration: 30,
      buffer_before: 0,
      buffer_after: 0,
      timezone: 'Asia/Riyadh',
      min_booking_notice: 24,
      max_booking_days: 30
    }

    // If date is provided, get available slots for that date
    let availableSlots: { time: string; available: boolean }[] = []
    
    if (date) {
      const targetDate = new Date(date)
      const dayOfWeek = targetDate.getDay()

      // Get availability rules for this day
      const { data: rules } = await supabase
        .from('availability_rules')
        .select('start_time, end_time')
        .eq('manager_id', manager.id)
        .eq('day_of_week', dayOfWeek)
        .eq('is_available', true)

      // Get time off for this date
      const { data: timeOff } = await supabase
        .from('time_off')
        .select('start_at, end_at')
        .eq('manager_id', manager.id)
        .lte('start_at', date + 'T23:59:59')
        .gte('end_at', date + 'T00:00:00')

      // Get existing bookings for this date
      const { data: bookings } = await supabase
        .from('meetings_v2')
        .select('start_at, end_at')
        .eq('manager_id', manager.id)
        .eq('status', 'booked')
        .gte('start_at', date + 'T00:00:00')
        .lte('start_at', date + 'T23:59:59')

      // Generate time slots based on rules
      if (rules && rules.length > 0) {
        for (const rule of rules) {
          const [startHour, startMin] = rule.start_time.split(':').map(Number)
          const [endHour, endMin] = rule.end_time.split(':').map(Number)
          
          let currentHour = startHour
          let currentMin = startMin

          while (currentHour < endHour || (currentHour === endHour && currentMin < endMin)) {
            const timeStr = `${currentHour.toString().padStart(2, '0')}:${currentMin.toString().padStart(2, '0')}`
            const slotStart = new Date(`${date}T${timeStr}:00`)
            const slotEnd = new Date(slotStart.getTime() + settings.meeting_duration * 60000)

            // Check if slot is available
            let isAvailable = true

            // Check time off
            if (timeOff) {
              for (const off of timeOff) {
                const offStart = new Date(off.start_at)
                const offEnd = new Date(off.end_at)
                if (slotStart >= offStart && slotStart < offEnd) {
                  isAvailable = false
                  break
                }
              }
            }

            // Check existing bookings
            if (isAvailable && bookings) {
              for (const booking of bookings) {
                const bookingStart = new Date(booking.start_at)
                const bookingEnd = new Date(booking.end_at)
                if (
                  (slotStart >= bookingStart && slotStart < bookingEnd) ||
                  (slotEnd > bookingStart && slotEnd <= bookingEnd)
                ) {
                  isAvailable = false
                  break
                }
              }
            }

            // Check minimum booking notice
            const now = new Date()
            const minNotice = new Date(now.getTime() + settings.min_booking_notice * 3600000)
            if (slotStart < minNotice) {
              isAvailable = false
            }

            availableSlots.push({ time: timeStr, available: isAvailable })

            // Increment by meeting duration
            currentMin += settings.meeting_duration
            if (currentMin >= 60) {
              currentHour += Math.floor(currentMin / 60)
              currentMin = currentMin % 60
            }
          }
        }
      }
    }

    return NextResponse.json({
      manager: {
        id: manager.id,
        name: manager.name,
        avatar_url: manager.avatar_url
      },
      settings: {
        meeting_duration: settings.meeting_duration,
        timezone: settings.timezone,
        min_booking_notice: settings.min_booking_notice,
        max_booking_days: settings.max_booking_days
      },
      available_slots: availableSlots
    })

  } catch (error) {
    console.error('Error in booking API:', error)
    return NextResponse.json(
      { error: 'حدث خطأ في الخادم' },
      { status: 500 }
    )
  }
}

// POST - Create a booking
export async function POST(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const { slug } = params
    const body = await request.json()

    const { date, time, guest_name, guest_email, guest_phone } = body

    if (!date || !time || !guest_name || !guest_email) {
      return NextResponse.json(
        { error: 'الحقول المطلوبة: date, time, guest_name, guest_email' },
        { status: 400 }
      )
    }

    // Get manager
    const { data: manager, error: managerError } = await supabase
      .from('profiles')
      .select('id, name, email, meeting_settings(meeting_duration)')
      .eq('booking_slug', slug)
      .single()

    if (managerError || !manager) {
      return NextResponse.json(
        { error: 'لم يتم العثور على صفحة الحجز' },
        { status: 404 }
      )
    }

    const settings = (manager.meeting_settings as any)?.[0] || { meeting_duration: 30 }
    const startAt = new Date(`${date}T${time}:00`)
    const endAt = new Date(startAt.getTime() + settings.meeting_duration * 60000)

    // Create meeting using RPC
    const { data: meetingId, error: meetingError } = await supabase.rpc('book_meeting_v2', {
      p_manager_id: manager.id,
      p_start_at: startAt.toISOString(),
      p_end_at: endAt.toISOString(),
      p_guest_name: guest_name,
      p_guest_email: guest_email,
      p_guest_phone: guest_phone || null
    })

    if (meetingError) {
      console.error('Error booking meeting:', meetingError)
      return NextResponse.json(
        { error: 'فشل في حجز الموعد. قد يكون الوقت محجوزاً مسبقاً.' },
        { status: 400 }
      )
    }

    // TODO: Send confirmation emails
    // TODO: Create Google Calendar event if connected

    return NextResponse.json({
      success: true,
      meeting_id: meetingId,
      message: 'تم حجز الموعد بنجاح',
      meeting: {
        start_at: startAt.toISOString(),
        end_at: endAt.toISOString(),
        manager_name: manager.name,
        guest_name,
        guest_email
      }
    })

  } catch (error) {
    console.error('Error in booking API:', error)
    return NextResponse.json(
      { error: 'حدث خطأ في الخادم' },
      { status: 500 }
    )
  }
}
