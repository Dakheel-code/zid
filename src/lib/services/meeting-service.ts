// ============================================
// ZID Dashboard - Phase 3.4: Meeting Service
// منطق الاجتماعات
// ============================================

import { createClient } from '@/lib/supabase/client'
import type { 
  MeetingV2,
  MeetingSettings,
  AvailabilityRule,
  TimeOff,
  MeetingBookingStatus
} from '@/lib/supabase/types-simple'

// ============================================
// TYPES
// ============================================

export interface BookMeetingInput {
  booking_slug: string
  start_at: string
  guest_name: string
  guest_email: string
  guest_phone?: string
  guest_notes?: string
}

export interface BookMeetingResult {
  success: boolean
  meeting_id?: string
  meeting?: {
    id: string
    manager_name: string
    start_at: string
    end_at: string
    duration_minutes: number
    timezone: string
  }
  error?: string
}

export interface AvailableSlot {
  slot_start: string
  slot_end: string
}

export interface BookingInfo {
  manager_name: string
  meeting_title: string
  duration_minutes: number
  timezone: string
}

export interface CalendarDay {
  date: string
  available_slots: Array<{ start: string; end: string }>
  booked_meetings: Array<{
    id: string
    start: string
    end: string
    guest_name: string
    status: MeetingBookingStatus
  }>
}

// ============================================
// PUBLIC BOOKING
// ============================================

/**
 * Get booking info for a manager (public)
 */
export async function getBookingInfo(bookingSlug: string): Promise<{
  info: BookingInfo | null
  error?: string
}> {
  const supabase = createClient()

  try {
    const { data, error } = await supabase.rpc('get_booking_info', {
      p_booking_slug: bookingSlug
    })

    if (error) {
      return { info: null, error: error.message }
    }

    if (!data || data.length === 0) {
      return { info: null, error: 'Manager not found' }
    }

    return { info: data[0] }
  } catch (error) {
    return {
      info: null,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Get available slots for a date (public)
 */
export async function getAvailableSlots(
  managerId: string,
  date: string
): Promise<{
  slots: AvailableSlot[]
  error?: string
}> {
  const supabase = createClient()

  try {
    const { data, error } = await supabase.rpc('get_available_slots', {
      p_manager_id: managerId,
      p_date: date
    })

    if (error) {
      return { slots: [], error: error.message }
    }

    return { slots: data || [] }
  } catch (error) {
    return {
      slots: [],
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Book a meeting (public)
 */
export async function bookMeeting(input: BookMeetingInput): Promise<BookMeetingResult> {
  const supabase = createClient()

  try {
    const { data, error } = await supabase.rpc('book_meeting_v2', {
      p_booking_slug: input.booking_slug,
      p_start_at: input.start_at,
      p_guest_name: input.guest_name,
      p_guest_email: input.guest_email,
      p_guest_phone: input.guest_phone || null,
      p_guest_notes: input.guest_notes || null
    })

    if (error) {
      return { success: false, error: error.message }
    }

    if (!data.success) {
      return { success: false, error: data.error }
    }

    return {
      success: true,
      meeting_id: data.meeting_id,
      meeting: data.meeting
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

// ============================================
// MEETING MANAGEMENT (Manager)
// ============================================

/**
 * Cancel a meeting
 */
export async function cancelMeeting(
  meetingId: string,
  reason?: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient()

  try {
    const { data, error } = await supabase.rpc('cancel_meeting_v2', {
      p_meeting_id: meetingId,
      p_reason: reason || null
    })

    if (error) {
      return { success: false, error: error.message }
    }

    if (!data.success) {
      return { success: false, error: data.error }
    }

    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Get upcoming meetings for current manager
 */
export async function getUpcomingMeetings(): Promise<{
  meetings: MeetingV2[]
  error?: string
}> {
  const supabase = createClient()

  try {
    const { data, error } = await supabase.rpc('get_upcoming_meetings')

    if (error) {
      return { meetings: [], error: error.message }
    }

    return { meetings: data || [] }
  } catch (error) {
    return {
      meetings: [],
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Get calendar for a date range
 */
export async function getManagerCalendar(
  managerId: string,
  startDate: string,
  endDate: string
): Promise<{
  calendar: CalendarDay[]
  error?: string
}> {
  const supabase = createClient()

  try {
    const { data, error } = await supabase.rpc('get_manager_calendar', {
      p_manager_id: managerId,
      p_start_date: startDate,
      p_end_date: endDate
    })

    if (error) {
      return { calendar: [], error: error.message }
    }

    return { calendar: data || [] }
  } catch (error) {
    return {
      calendar: [],
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

// ============================================
// MEETING SETTINGS
// ============================================

/**
 * Get meeting settings for current manager
 */
export async function getMeetingSettings(): Promise<{
  settings: MeetingSettings | null
  error?: string
}> {
  const supabase = createClient()

  try {
    const { data: user } = await supabase.auth.getUser()
    if (!user.user) {
      return { settings: null, error: 'Not authenticated' }
    }

    const { data, error } = await supabase
      .from('meeting_settings')
      .select('*')
      .eq('manager_id', user.user.id)
      .single()

    if (error) {
      // If not found, return null (settings not created yet)
      if (error.code === 'PGRST116') {
        return { settings: null }
      }
      return { settings: null, error: error.message }
    }

    return { settings: data }
  } catch (error) {
    return {
      settings: null,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Update meeting settings
 */
export async function updateMeetingSettings(
  settings: Partial<Omit<MeetingSettings, 'manager_id' | 'created_at' | 'updated_at'>>
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient()

  try {
    const { data: user } = await supabase.auth.getUser()
    if (!user.user) {
      return { success: false, error: 'Not authenticated' }
    }

    const { error } = await supabase
      .from('meeting_settings')
      .upsert({
        manager_id: user.user.id,
        ...settings
      })

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
// AVAILABILITY RULES
// ============================================

/**
 * Get availability rules for current manager
 */
export async function getAvailabilityRules(): Promise<{
  rules: AvailabilityRule[]
  error?: string
}> {
  const supabase = createClient()

  try {
    const { data: user } = await supabase.auth.getUser()
    if (!user.user) {
      return { rules: [], error: 'Not authenticated' }
    }

    const { data, error } = await supabase
      .from('availability_rules')
      .select('*')
      .eq('manager_id', user.user.id)
      .order('day_of_week', { ascending: true })
      .order('start_time', { ascending: true })

    if (error) {
      return { rules: [], error: error.message }
    }

    return { rules: data || [] }
  } catch (error) {
    return {
      rules: [],
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Add availability rule
 */
export async function addAvailabilityRule(
  rule: Omit<AvailabilityRule, 'id' | 'manager_id' | 'created_at'>
): Promise<{ success: boolean; rule_id?: string; error?: string }> {
  const supabase = createClient()

  try {
    const { data: user } = await supabase.auth.getUser()
    if (!user.user) {
      return { success: false, error: 'Not authenticated' }
    }

    const { data, error } = await supabase
      .from('availability_rules')
      .insert({
        manager_id: user.user.id,
        ...rule
      })
      .select('id')
      .single()

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, rule_id: data.id }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Delete availability rule
 */
export async function deleteAvailabilityRule(ruleId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient()

  try {
    const { error } = await supabase
      .from('availability_rules')
      .delete()
      .eq('id', ruleId)

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
// TIME OFF
// ============================================

/**
 * Get time off entries for current manager
 */
export async function getTimeOff(): Promise<{
  entries: TimeOff[]
  error?: string
}> {
  const supabase = createClient()

  try {
    const { data: user } = await supabase.auth.getUser()
    if (!user.user) {
      return { entries: [], error: 'Not authenticated' }
    }

    const { data, error } = await supabase
      .from('time_off')
      .select('*')
      .eq('manager_id', user.user.id)
      .gte('end_at', new Date().toISOString())
      .order('start_at', { ascending: true })

    if (error) {
      return { entries: [], error: error.message }
    }

    return { entries: data || [] }
  } catch (error) {
    return {
      entries: [],
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Add time off
 */
export async function addTimeOff(
  entry: Omit<TimeOff, 'id' | 'manager_id' | 'created_at'>
): Promise<{ success: boolean; entry_id?: string; error?: string }> {
  const supabase = createClient()

  try {
    const { data: user } = await supabase.auth.getUser()
    if (!user.user) {
      return { success: false, error: 'Not authenticated' }
    }

    const { data, error } = await supabase
      .from('time_off')
      .insert({
        manager_id: user.user.id,
        ...entry
      })
      .select('id')
      .single()

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, entry_id: data.id }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Delete time off
 */
export async function deleteTimeOff(entryId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient()

  try {
    const { error } = await supabase
      .from('time_off')
      .delete()
      .eq('id', entryId)

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
