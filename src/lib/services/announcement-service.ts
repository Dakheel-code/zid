// ============================================
// ZID Dashboard - Phase 3.3: Announcement Service
// منطق التعاميم
// ============================================

import { createClient } from '@/lib/supabase/client'
import type { 
  AnnouncementV2,
  AnnouncementTypeV2,
  AnnouncementPriorityLevel,
  AnnouncementTargetType
} from '@/lib/supabase/types-simple'

// ============================================
// TYPES
// ============================================

export interface CreateAnnouncementInput {
  title: string
  content: string
  type?: AnnouncementTypeV2
  priority?: AnnouncementPriorityLevel
  send_at?: string | null
  target_type?: AnnouncementTargetType
  manager_ids?: string[]
}

export interface AnnouncementResult {
  success: boolean
  announcement_id?: string
  error?: string
}

export interface SendAnnouncementResult {
  success: boolean
  notifications_sent?: number
  error?: string
}

export interface PendingPopup {
  announcement_id: string
  title: string
  content: string
  priority: AnnouncementPriorityLevel
  sent_at: string
}

// ============================================
// ANNOUNCEMENT CREATION
// ============================================

/**
 * Create a new announcement (admin only)
 */
export async function createAnnouncement(input: CreateAnnouncementInput): Promise<AnnouncementResult> {
  const supabase = createClient()

  try {
    const { data, error } = await supabase.rpc('create_announcement', {
      p_title: input.title,
      p_content: input.content,
      p_type: input.type || 'normal',
      p_priority: input.priority || 'normal',
      p_send_at: input.send_at || null,
      p_target_type: input.target_type || 'all',
      p_manager_ids: input.manager_ids || null
    })

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, announcement_id: data }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

// ============================================
// SEND ANNOUNCEMENT
// ============================================

/**
 * Send an announcement immediately
 */
export async function sendAnnouncement(announcementId: string): Promise<SendAnnouncementResult> {
  const supabase = createClient()

  try {
    const { data, error } = await supabase.rpc('send_announcement_v2', {
      p_announcement_id: announcementId
    })

    if (error) {
      return { success: false, error: error.message }
    }

    if (!data.success) {
      return { success: false, error: data.error }
    }

    return { 
      success: true, 
      notifications_sent: data.notifications_sent 
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

// ============================================
// POPUP MANAGEMENT
// ============================================

/**
 * Get pending urgent popups for current user
 */
export async function getPendingPopups(): Promise<{
  popups: PendingPopup[]
  error?: string
}> {
  const supabase = createClient()

  try {
    const { data, error } = await supabase.rpc('get_pending_urgent_popups')

    if (error) {
      return { popups: [], error: error.message }
    }

    return { popups: data || [] }
  } catch (error) {
    return {
      popups: [],
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Dismiss a popup
 */
export async function dismissPopup(announcementId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient()

  try {
    const { data, error } = await supabase.rpc('dismiss_announcement_popup', {
      p_announcement_id: announcementId
    })

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: data }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Mark announcement as read
 */
export async function markAnnouncementRead(announcementId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient()

  try {
    const { data, error } = await supabase.rpc('mark_announcement_read', {
      p_announcement_id: announcementId
    })

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: data }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

// ============================================
// ANNOUNCEMENT QUERIES
// ============================================

/**
 * Get announcements for current user
 */
export async function getAnnouncements(options?: {
  status?: 'draft' | 'scheduled' | 'sent'
  limit?: number
  offset?: number
}): Promise<{
  announcements: AnnouncementV2[]
  count: number
  error?: string
}> {
  const supabase = createClient()

  try {
    let query = supabase
      .from('announcements_v2')
      .select('*', { count: 'exact' })

    if (options?.status) {
      query = query.eq('status', options.status)
    }

    query = query
      .order('created_at', { ascending: false })
      .range(
        options?.offset || 0,
        (options?.offset || 0) + (options?.limit || 20) - 1
      )

    const { data, count, error } = await query

    if (error) {
      return { announcements: [], count: 0, error: error.message }
    }

    return { announcements: data || [], count: count || 0 }
  } catch (error) {
    return {
      announcements: [],
      count: 0,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Get unread announcements for current user
 */
export async function getUnreadAnnouncements(): Promise<{
  announcements: Array<{
    announcement_id: string
    title: string
    content: string
    type: AnnouncementTypeV2
    priority: AnnouncementPriorityLevel
    sent_at: string
    is_popup_dismissed: boolean
  }>
  error?: string
}> {
  const supabase = createClient()

  try {
    const { data, error } = await supabase.rpc('get_unread_announcements')

    if (error) {
      return { announcements: [], error: error.message }
    }

    return { announcements: data || [] }
  } catch (error) {
    return {
      announcements: [],
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}
