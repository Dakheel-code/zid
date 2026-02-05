// ============================================
// ZID Dashboard - Supabase Database Types
// Phase 2: قاعدة بيانات Supabase
// ============================================

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// ============================================
// ENUM TYPES
// ============================================
export type UserRole = 'admin' | 'manager'
export type MerchantStatus = 'active' | 'inactive' | 'pending' | 'suspended'
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled'
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent'
export type AnnouncementPriority = 'low' | 'normal' | 'high' | 'urgent'
export type MeetingStatus = 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no_show'
export type NotificationType = 'info' | 'warning' | 'success' | 'error' | 'task' | 'meeting' | 'announcement'

// Phase 2.2 - Stores
export type StorePriority = 'high' | 'medium' | 'low'
export type StoreStatus = 'new' | 'active' | 'paused' | 'ended'

// Phase 2.5 - Store Tasks
export type StoreTaskType = 'template' | 'manual'
export type StoreTaskStatus = 'new' | 'in_progress' | 'blocked' | 'done'
export type StoreTaskPublicStatus = 'follow_up' | 'done'
export type TaskCreatorRole = 'admin' | 'manager' | 'merchant'

// Phase 2.6 - Announcements
export type AnnouncementTypeV2 = 'normal' | 'urgent_popup'
export type AnnouncementPriorityLevel = 'normal' | 'high'
export type AnnouncementStatusV2 = 'draft' | 'scheduled' | 'sent'
export type AnnouncementTargetType = 'all' | 'specific'

// Phase 2.7 - Meetings
export type MeetingBookingStatus = 'booked' | 'cancelled'

// Phase 2.8 - Notifications
export type NotificationTypeV2 = 'task' | 'store' | 'announcement' | 'meeting'
export type NotificationPriorityV2 = 'normal' | 'important' | 'urgent'

// ============================================
// DATABASE INTERFACE
// ============================================
export interface Database {
  public: {
    Tables: {
      // ============================================
      // 2.1 PROFILES TABLE
      // ============================================
      profiles: {
        Row: {
          id: string
          email: string
          name: string
          phone: string | null
          avatar_url: string | null
          role: UserRole
          booking_slug: string | null
          settings: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          name?: string
          phone?: string | null
          avatar_url?: string | null
          role?: UserRole
          booking_slug?: string | null
          settings?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string
          phone?: string | null
          avatar_url?: string | null
          role?: UserRole
          booking_slug?: string | null
          settings?: Json
          created_at?: string
          updated_at?: string
        }
      }
      // ============================================
      // 2.2 STORES TABLE (المتاجر الجديد)
      // ============================================
      stores: {
        Row: {
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
          metadata: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          store_url: string
          store_name?: string | null
          store_logo_url?: string | null
          owner_name?: string | null
          owner_email?: string | null
          owner_phone?: string | null
          priority?: StorePriority
          status?: StoreStatus
          ended_at?: string | null
          public_access_expires_at?: string | null
          assigned_manager_id?: string | null
          created_by_admin_id?: string | null
          notes?: string | null
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          store_url?: string
          store_name?: string | null
          store_logo_url?: string | null
          owner_name?: string | null
          owner_email?: string | null
          owner_phone?: string | null
          priority?: StorePriority
          status?: StoreStatus
          ended_at?: string | null
          public_access_expires_at?: string | null
          assigned_manager_id?: string | null
          created_by_admin_id?: string | null
          notes?: string | null
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
      }
      // ============================================
      // 2.2 MERCHANTS TABLE (Legacy - للتوافق)
      // ============================================
      merchants: {
        Row: {
          id: string
          store_name: string
          store_url: string | null
          store_id: string | null
          owner_name: string | null
          owner_email: string | null
          owner_phone: string | null
          manager_id: string | null
          status: MerchantStatus
          notes: string | null
          metadata: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          store_name: string
          store_url?: string | null
          store_id?: string | null
          owner_name?: string | null
          owner_email?: string | null
          owner_phone?: string | null
          manager_id?: string | null
          status?: MerchantStatus
          notes?: string | null
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          store_name?: string
          store_url?: string | null
          store_id?: string | null
          owner_name?: string | null
          owner_email?: string | null
          owner_phone?: string | null
          manager_id?: string | null
          status?: MerchantStatus
          notes?: string | null
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
      }
      // ============================================
      // 2.2 TASK TEMPLATES TABLE
      // ============================================
      task_templates: {
        Row: {
          id: string
          title: string
          description: string | null
          priority: TaskPriority
          estimated_duration_minutes: number | null
          created_by: string
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          priority?: TaskPriority
          estimated_duration_minutes?: number | null
          created_by: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          priority?: TaskPriority
          estimated_duration_minutes?: number | null
          created_by?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      // ============================================
      // 2.2 TASKS TABLE
      // ============================================
      tasks: {
        Row: {
          id: string
          template_id: string | null
          merchant_id: string
          assigned_to: string
          created_by: string | null
          title: string
          description: string | null
          status: TaskStatus
          priority: TaskPriority
          due_date: string | null
          started_at: string | null
          completed_at: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          template_id?: string | null
          merchant_id: string
          assigned_to: string
          created_by?: string | null
          title: string
          description?: string | null
          status?: TaskStatus
          priority?: TaskPriority
          due_date?: string | null
          started_at?: string | null
          completed_at?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          template_id?: string | null
          merchant_id?: string
          assigned_to?: string
          created_by?: string | null
          title?: string
          description?: string | null
          status?: TaskStatus
          priority?: TaskPriority
          due_date?: string | null
          started_at?: string | null
          completed_at?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      // ============================================
      // 2.2 ANNOUNCEMENTS TABLE
      // ============================================
      announcements: {
        Row: {
          id: string
          title: string
          content: string
          priority: AnnouncementPriority
          target_roles: UserRole[]
          created_by: string
          published_at: string | null
          expires_at: string | null
          is_pinned: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          content: string
          priority?: AnnouncementPriority
          target_roles?: UserRole[]
          created_by: string
          published_at?: string | null
          expires_at?: string | null
          is_pinned?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          content?: string
          priority?: AnnouncementPriority
          target_roles?: UserRole[]
          created_by?: string
          published_at?: string | null
          expires_at?: string | null
          is_pinned?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      // ============================================
      // 2.3 MEETINGS TABLE
      // ============================================
      meetings: {
        Row: {
          id: string
          manager_id: string
          merchant_id: string | null
          title: string
          description: string | null
          start_time: string
          end_time: string
          meeting_url: string | null
          location: string | null
          status: MeetingStatus
          booked_by_name: string | null
          booked_by_email: string | null
          booked_by_phone: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          manager_id: string
          merchant_id?: string | null
          title: string
          description?: string | null
          start_time: string
          end_time: string
          meeting_url?: string | null
          location?: string | null
          status?: MeetingStatus
          booked_by_name?: string | null
          booked_by_email?: string | null
          booked_by_phone?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          manager_id?: string
          merchant_id?: string | null
          title?: string
          description?: string | null
          start_time?: string
          end_time?: string
          meeting_url?: string | null
          location?: string | null
          status?: MeetingStatus
          booked_by_name?: string | null
          booked_by_email?: string | null
          booked_by_phone?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      // ============================================
      // 2.3 MEETING SLOTS TABLE
      // ============================================
      meeting_slots: {
        Row: {
          id: string
          manager_id: string
          day_of_week: number
          start_time: string
          end_time: string
          is_available: boolean
          created_at: string
        }
        Insert: {
          id?: string
          manager_id: string
          day_of_week: number
          start_time: string
          end_time: string
          is_available?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          manager_id?: string
          day_of_week?: number
          start_time?: string
          end_time?: string
          is_available?: boolean
          created_at?: string
        }
      }
      // ============================================
      // 2.3 NOTIFICATIONS TABLE
      // ============================================
      notifications: {
        Row: {
          id: string
          user_id: string
          title: string
          message: string
          type: NotificationType
          is_read: boolean
          read_at: string | null
          link: string | null
          reference_type: string | null
          reference_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          message: string
          type?: NotificationType
          is_read?: boolean
          read_at?: string | null
          link?: string | null
          reference_type?: string | null
          reference_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          message?: string
          type?: NotificationType
          is_read?: boolean
          read_at?: string | null
          link?: string | null
          reference_type?: string | null
          reference_id?: string | null
          created_at?: string
        }
      }
      // ============================================
      // 2.3 STORE_PUBLIC_LINKS TABLE
      // ============================================
      store_public_links: {
        Row: {
          id: string
          store_id: string
          public_token: string
          is_revoked: boolean
          created_at: string
          revoked_at: string | null
        }
        Insert: {
          id?: string
          store_id: string
          public_token?: string
          is_revoked?: boolean
          created_at?: string
          revoked_at?: string | null
        }
        Update: {
          id?: string
          store_id?: string
          public_token?: string
          is_revoked?: boolean
          created_at?: string
          revoked_at?: string | null
        }
      }
      // ============================================
      // 2.4 TASK_SECTIONS_TEMPLATE TABLE
      // ============================================
      task_sections_template: {
        Row: {
          id: string
          title: string
          sort_order: number
          whatsapp_template: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          sort_order?: number
          whatsapp_template?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          sort_order?: number
          whatsapp_template?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      // ============================================
      // 2.4 TASKS_TEMPLATE TABLE
      // ============================================
      tasks_template: {
        Row: {
          id: string
          section_id: string
          title: string
          description: string | null
          sort_order: number
          whatsapp_template: string | null
          visible_to_merchant: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          section_id: string
          title: string
          description?: string | null
          sort_order?: number
          whatsapp_template?: string | null
          visible_to_merchant?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          section_id?: string
          title?: string
          description?: string | null
          sort_order?: number
          whatsapp_template?: string | null
          visible_to_merchant?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      // ============================================
      // 2.6 ANNOUNCEMENTS_V2 TABLE
      // ============================================
      announcements_v2: {
        Row: {
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
        Insert: {
          id?: string
          title: string
          content: string
          type?: AnnouncementTypeV2
          priority?: AnnouncementPriorityLevel
          status?: AnnouncementStatusV2
          send_at?: string | null
          sent_at?: string | null
          created_by_admin_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          content?: string
          type?: AnnouncementTypeV2
          priority?: AnnouncementPriorityLevel
          status?: AnnouncementStatusV2
          send_at?: string | null
          sent_at?: string | null
          created_by_admin_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      // ============================================
      // 2.6 ANNOUNCEMENT_TARGETS TABLE
      // ============================================
      announcement_targets: {
        Row: {
          id: string
          announcement_id: string
          target_type: AnnouncementTargetType
          manager_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          announcement_id: string
          target_type?: AnnouncementTargetType
          manager_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          announcement_id?: string
          target_type?: AnnouncementTargetType
          manager_id?: string | null
          created_at?: string
        }
      }
      // ============================================
      // 2.6 ANNOUNCEMENT_READS TABLE
      // ============================================
      announcement_reads: {
        Row: {
          id: string
          announcement_id: string
          user_id: string
          read_at: string
          popup_dismissed_at: string | null
        }
        Insert: {
          id?: string
          announcement_id: string
          user_id: string
          read_at?: string
          popup_dismissed_at?: string | null
        }
        Update: {
          id?: string
          announcement_id?: string
          user_id?: string
          read_at?: string
          popup_dismissed_at?: string | null
        }
      }
      // ============================================
      // 2.7 MEETING_SETTINGS TABLE
      // ============================================
      meeting_settings: {
        Row: {
          manager_id: string
          meeting_title: string
          duration_minutes: number
          buffer_minutes: number
          min_lead_time_hours: number
          timezone: string
          max_bookings_per_day: number | null
          booking_window_days: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          manager_id: string
          meeting_title?: string
          duration_minutes?: number
          buffer_minutes?: number
          min_lead_time_hours?: number
          timezone?: string
          max_bookings_per_day?: number | null
          booking_window_days?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          manager_id?: string
          meeting_title?: string
          duration_minutes?: number
          buffer_minutes?: number
          min_lead_time_hours?: number
          timezone?: string
          max_bookings_per_day?: number | null
          booking_window_days?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      // ============================================
      // 2.7 AVAILABILITY_RULES TABLE
      // ============================================
      availability_rules: {
        Row: {
          id: string
          manager_id: string
          day_of_week: number
          start_time: string
          end_time: string
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          manager_id: string
          day_of_week: number
          start_time: string
          end_time: string
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          manager_id?: string
          day_of_week?: number
          start_time?: string
          end_time?: string
          is_active?: boolean
          created_at?: string
        }
      }
      // ============================================
      // 2.7 TIME_OFF TABLE
      // ============================================
      time_off: {
        Row: {
          id: string
          manager_id: string
          start_at: string
          end_at: string
          reason: string | null
          created_at: string
        }
        Insert: {
          id?: string
          manager_id: string
          start_at: string
          end_at: string
          reason?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          manager_id?: string
          start_at?: string
          end_at?: string
          reason?: string | null
          created_at?: string
        }
      }
      // ============================================
      // 2.7 MEETINGS_V2 TABLE
      // ============================================
      meetings_v2: {
        Row: {
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
        Insert: {
          id?: string
          manager_id: string
          start_at: string
          end_at: string
          guest_name: string
          guest_email: string
          guest_phone?: string | null
          guest_notes?: string | null
          status?: MeetingBookingStatus
          google_calendar_event_id?: string | null
          cancelled_at?: string | null
          cancellation_reason?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          manager_id?: string
          start_at?: string
          end_at?: string
          guest_name?: string
          guest_email?: string
          guest_phone?: string | null
          guest_notes?: string | null
          status?: MeetingBookingStatus
          google_calendar_event_id?: string | null
          cancelled_at?: string | null
          cancellation_reason?: string | null
          created_at?: string
        }
      }
      // ============================================
      // 2.8 NOTIFICATION_EVENT_SETTINGS TABLE
      // ============================================
      notification_event_settings: {
        Row: {
          id: string
          event_key: string
          display_name: string
          description: string | null
          enabled: boolean
          priority: NotificationPriorityV2
          default_title_template: string | null
          default_body_template: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          event_key: string
          display_name: string
          description?: string | null
          enabled?: boolean
          priority?: NotificationPriorityV2
          default_title_template?: string | null
          default_body_template?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          event_key?: string
          display_name?: string
          description?: string | null
          enabled?: boolean
          priority?: NotificationPriorityV2
          default_title_template?: string | null
          default_body_template?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      // ============================================
      // 2.8 NOTIFICATIONS_V2 TABLE
      // ============================================
      notifications_v2: {
        Row: {
          id: string
          recipient_user_id: string
          type: NotificationTypeV2
          event_key: string
          title: string
          body: string | null
          link_url: string | null
          metadata: Json
          priority: NotificationPriorityV2
          is_read: boolean
          read_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          recipient_user_id: string
          type: NotificationTypeV2
          event_key: string
          title: string
          body?: string | null
          link_url?: string | null
          metadata?: Json
          priority?: NotificationPriorityV2
          is_read?: boolean
          read_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          recipient_user_id?: string
          type?: NotificationTypeV2
          event_key?: string
          title?: string
          body?: string | null
          link_url?: string | null
          metadata?: Json
          priority?: NotificationPriorityV2
          is_read?: boolean
          read_at?: string | null
          created_at?: string
        }
      }
      // ============================================
      // 2.5 STORE_TASKS TABLE
      // ============================================
      store_tasks: {
        Row: {
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
          merchant_name: string | null
          merchant_contact: string | null
          visible_to_merchant: boolean
          sort_order: number
          notes: string | null
          created_at: string
          updated_at: string
          completed_at: string | null
        }
        Insert: {
          id?: string
          store_id: string
          template_task_id?: string | null
          template_section_id?: string | null
          type?: StoreTaskType
          title: string
          description?: string | null
          status?: StoreTaskStatus
          due_date?: string | null
          created_by_id?: string | null
          created_by_role?: TaskCreatorRole
          merchant_name?: string | null
          merchant_contact?: string | null
          visible_to_merchant?: boolean
          sort_order?: number
          notes?: string | null
          created_at?: string
          updated_at?: string
          completed_at?: string | null
        }
        Update: {
          id?: string
          store_id?: string
          template_task_id?: string | null
          template_section_id?: string | null
          type?: StoreTaskType
          title?: string
          description?: string | null
          status?: StoreTaskStatus
          due_date?: string | null
          created_by_id?: string | null
          created_by_role?: TaskCreatorRole
          merchant_name?: string | null
          merchant_contact?: string | null
          visible_to_merchant?: boolean
          sort_order?: number
          notes?: string | null
          created_at?: string
          updated_at?: string
          completed_at?: string | null
        }
      }
    }
    Views: {
      // Legacy view for backward compatibility
      users: {
        Row: {
          id: string
          email: string
          name: string
          phone: string | null
          avatar_url: string | null
          role: UserRole
          booking_slug: string | null
          settings: Json
          created_at: string
          updated_at: string
        }
      }
    }
    Functions: {
      is_admin: {
        Args: Record<string, never>
        Returns: boolean
      }
      get_my_role: {
        Args: Record<string, never>
        Returns: UserRole
      }
      generate_booking_slug: {
        Args: { base_slug: string }
        Returns: string
      }
      mark_notification_read: {
        Args: { notification_id: string }
        Returns: void
      }
      mark_all_notifications_read: {
        Args: Record<string, never>
        Returns: void
      }
    }
    Enums: {
      user_role: UserRole
      merchant_status: MerchantStatus
      task_status: TaskStatus
      task_priority: TaskPriority
      announcement_priority: AnnouncementPriority
      meeting_status: MeetingStatus
      notification_type: NotificationType
    }
  }
}

// ============================================
// HELPER TYPES
// ============================================

// Profile type alias
export type Profile = Database['public']['Tables']['profiles']['Row']
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert']
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update']

// Merchant type alias
export type Merchant = Database['public']['Tables']['merchants']['Row']
export type MerchantInsert = Database['public']['Tables']['merchants']['Insert']
export type MerchantUpdate = Database['public']['Tables']['merchants']['Update']

// Task type alias
export type Task = Database['public']['Tables']['tasks']['Row']
export type TaskInsert = Database['public']['Tables']['tasks']['Insert']
export type TaskUpdate = Database['public']['Tables']['tasks']['Update']

// Task Template type alias
export type TaskTemplate = Database['public']['Tables']['task_templates']['Row']
export type TaskTemplateInsert = Database['public']['Tables']['task_templates']['Insert']
export type TaskTemplateUpdate = Database['public']['Tables']['task_templates']['Update']

// Announcement type alias
export type Announcement = Database['public']['Tables']['announcements']['Row']
export type AnnouncementInsert = Database['public']['Tables']['announcements']['Insert']
export type AnnouncementUpdate = Database['public']['Tables']['announcements']['Update']

// Meeting type alias
export type Meeting = Database['public']['Tables']['meetings']['Row']
export type MeetingInsert = Database['public']['Tables']['meetings']['Insert']
export type MeetingUpdate = Database['public']['Tables']['meetings']['Update']

// Meeting Slot type alias
export type MeetingSlot = Database['public']['Tables']['meeting_slots']['Row']
export type MeetingSlotInsert = Database['public']['Tables']['meeting_slots']['Insert']
export type MeetingSlotUpdate = Database['public']['Tables']['meeting_slots']['Update']

// Notification type alias
export type Notification = Database['public']['Tables']['notifications']['Row']
export type NotificationInsert = Database['public']['Tables']['notifications']['Insert']
export type NotificationUpdate = Database['public']['Tables']['notifications']['Update']

// Store type alias (Phase 2.2)
export type Store = Database['public']['Tables']['stores']['Row']
export type StoreInsert = Database['public']['Tables']['stores']['Insert']
export type StoreUpdate = Database['public']['Tables']['stores']['Update']

// Store Public Link type alias (Phase 2.3)
export type StorePublicLink = Database['public']['Tables']['store_public_links']['Row']
export type StorePublicLinkInsert = Database['public']['Tables']['store_public_links']['Insert']
export type StorePublicLinkUpdate = Database['public']['Tables']['store_public_links']['Update']

// Task Section Template type alias (Phase 2.4)
export type TaskSectionTemplate = Database['public']['Tables']['task_sections_template']['Row']
export type TaskSectionTemplateInsert = Database['public']['Tables']['task_sections_template']['Insert']
export type TaskSectionTemplateUpdate = Database['public']['Tables']['task_sections_template']['Update']

// Task Template type alias (Phase 2.4)
export type TaskTemplateItem = Database['public']['Tables']['tasks_template']['Row']
export type TaskTemplateItemInsert = Database['public']['Tables']['tasks_template']['Insert']
export type TaskTemplateItemUpdate = Database['public']['Tables']['tasks_template']['Update']

// Store Task type alias (Phase 2.5)
export type StoreTask = Database['public']['Tables']['store_tasks']['Row']
export type StoreTaskInsert = Database['public']['Tables']['store_tasks']['Insert']
export type StoreTaskUpdate = Database['public']['Tables']['store_tasks']['Update']

// Announcement type alias (Phase 2.6)
export type AnnouncementV2 = Database['public']['Tables']['announcements_v2']['Row']
export type AnnouncementV2Insert = Database['public']['Tables']['announcements_v2']['Insert']
export type AnnouncementV2Update = Database['public']['Tables']['announcements_v2']['Update']

// Announcement Target type alias (Phase 2.6)
export type AnnouncementTarget = Database['public']['Tables']['announcement_targets']['Row']
export type AnnouncementTargetInsert = Database['public']['Tables']['announcement_targets']['Insert']
export type AnnouncementTargetUpdate = Database['public']['Tables']['announcement_targets']['Update']

// Announcement Read type alias (Phase 2.6)
export type AnnouncementRead = Database['public']['Tables']['announcement_reads']['Row']
export type AnnouncementReadInsert = Database['public']['Tables']['announcement_reads']['Insert']
export type AnnouncementReadUpdate = Database['public']['Tables']['announcement_reads']['Update']

// Meeting Settings type alias (Phase 2.7)
export type MeetingSettings = Database['public']['Tables']['meeting_settings']['Row']
export type MeetingSettingsInsert = Database['public']['Tables']['meeting_settings']['Insert']
export type MeetingSettingsUpdate = Database['public']['Tables']['meeting_settings']['Update']

// Availability Rule type alias (Phase 2.7)
export type AvailabilityRule = Database['public']['Tables']['availability_rules']['Row']
export type AvailabilityRuleInsert = Database['public']['Tables']['availability_rules']['Insert']
export type AvailabilityRuleUpdate = Database['public']['Tables']['availability_rules']['Update']

// Time Off type alias (Phase 2.7)
export type TimeOff = Database['public']['Tables']['time_off']['Row']
export type TimeOffInsert = Database['public']['Tables']['time_off']['Insert']
export type TimeOffUpdate = Database['public']['Tables']['time_off']['Update']

// Meeting V2 type alias (Phase 2.7)
export type MeetingV2 = Database['public']['Tables']['meetings_v2']['Row']
export type MeetingV2Insert = Database['public']['Tables']['meetings_v2']['Insert']
export type MeetingV2Update = Database['public']['Tables']['meetings_v2']['Update']

// Notification Event Settings type alias (Phase 2.8)
export type NotificationEventSettings = Database['public']['Tables']['notification_event_settings']['Row']
export type NotificationEventSettingsInsert = Database['public']['Tables']['notification_event_settings']['Insert']
export type NotificationEventSettingsUpdate = Database['public']['Tables']['notification_event_settings']['Update']

// Notification V2 type alias (Phase 2.8)
export type NotificationV2 = Database['public']['Tables']['notifications_v2']['Row']
export type NotificationV2Insert = Database['public']['Tables']['notifications_v2']['Insert']
export type NotificationV2Update = Database['public']['Tables']['notifications_v2']['Update']

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type InsertTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type UpdateTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']
