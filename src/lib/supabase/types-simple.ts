// ============================================
// ZID Dashboard - Simple Types (No Database Interface)
// ============================================

export type UserRole = 'admin' | 'manager'
export type StorePriority = 'high' | 'medium' | 'low'
export type StoreStatus = 'new' | 'active' | 'paused' | 'ended'
export type StoreTaskStatus = 'new' | 'in_progress' | 'blocked' | 'done'
export type StoreTaskType = 'template' | 'manual'
export type TaskCreatorRole = 'admin' | 'manager' | 'merchant' | 'system'

// Announcement types
export type AnnouncementTypeV2 = 'normal' | 'urgent_popup'
export type AnnouncementPriorityLevel = 'normal' | 'high'
export type AnnouncementStatusV2 = 'draft' | 'scheduled' | 'sent'
export type AnnouncementTargetType = 'all' | 'specific'

// Meeting types
export type MeetingBookingStatus = 'booked' | 'cancelled'

// Notification types
export type NotificationTypeV2 = 'task' | 'store' | 'announcement' | 'meeting'
export type NotificationPriorityV2 = 'normal' | 'important' | 'urgent'

export interface Profile {
  id: string
  email: string
  name: string
  phone: string | null
  avatar_url: string | null
  role: UserRole
  booking_slug: string | null
  settings: any
  created_at: string
  updated_at: string
}

export interface Store {
  id: string
  store_url: string
  store_name: string | null
  store_logo_url: string | null
  owner_name: string | null
  owner_email: string | null
  owner_phone: string | null
  priority: StorePriority
  status: StoreStatus
  ended_at: string | null
  public_access_expires_at: string | null
  assigned_manager_id: string | null
  created_by_admin_id: string | null
  notes: string | null
  metadata: any
  created_at: string
  updated_at: string
}

export interface StoreInsert {
  store_url: string
  store_name?: string | null
  store_logo_url?: string | null
  owner_name?: string | null
  owner_email?: string | null
  owner_phone?: string | null
  priority?: StorePriority
  status?: StoreStatus
  assigned_manager_id?: string | null
  notes?: string | null
  metadata?: any
}

export interface StoreTask {
  id: string
  store_id: string
  template_task_id: string | null
  template_section_id: string | null
  type: StoreTaskType
  title: string
  description: string | null
  status: StoreTaskStatus
  due_date: string | null
  created_by_id: string | null
  created_by_role: TaskCreatorRole
  visible_to_merchant: boolean
  sort_order: number
  notes: string | null
  created_at: string
  updated_at: string
  completed_at: string | null
  section_title?: string
}

// Announcement
export interface AnnouncementV2 {
  id: string
  title: string
  content: string
  type: AnnouncementTypeV2
  priority: AnnouncementPriorityLevel
  status: AnnouncementStatusV2
  send_at: string | null
  sent_at: string | null
  created_by_admin_id: string | null
  created_at: string
  updated_at: string
}

// Meeting
export interface MeetingV2 {
  id: string
  manager_id: string
  start_at: string
  end_at: string
  guest_name: string
  guest_email: string
  guest_phone: string | null
  guest_notes: string | null
  status: MeetingBookingStatus
  google_calendar_event_id: string | null
  cancelled_at: string | null
  cancellation_reason: string | null
  created_at: string
}

export interface MeetingSettings {
  manager_id: string
  meeting_title: string
  duration_minutes: number
  buffer_minutes: number
  min_lead_time_hours: number
  timezone: string
  max_bookings_per_day: number | null
  booking_window_days: number
  created_at: string
  updated_at: string
}

export interface AvailabilityRule {
  id: string
  manager_id: string
  day_of_week: number
  start_time: string
  end_time: string
  is_active: boolean
  created_at: string
}

export interface TimeOff {
  id: string
  manager_id: string
  start_at: string
  end_at: string
  reason: string | null
  created_at: string
}

// Notification
export interface NotificationV2 {
  id: string
  recipient_user_id: string
  type: NotificationTypeV2
  event_key: string
  title: string
  body: string | null
  link_url: string | null
  metadata: any
  priority: NotificationPriorityV2
  is_read: boolean
  read_at: string | null
  created_at: string
}
