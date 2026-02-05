// ============================================
// ZID Dashboard - Phase 3.2: Task Service
// منطق المهام
// ============================================

import { createClient } from '@/lib/supabase/client'
import type { 
  StoreTask, 
  StoreTaskStatus,
  StoreTaskType 
} from '@/lib/supabase/types-simple'

// ============================================
// TYPES
// ============================================

export interface CreateMerchantTaskInput {
  token: string
  title: string
  description?: string
  merchant_name?: string
  merchant_contact?: string
}

export interface CreateManualTaskInput {
  store_id: string
  title: string
  description?: string
  due_date?: string
  visible_to_merchant?: boolean
}

export interface TaskResult {
  success: boolean
  task_id?: string
  error?: string
}

// ============================================
// MERCHANT TASK CREATION (Public)
// ============================================

/**
 * Create a task from merchant via public token
 */
export async function createMerchantTask(input: CreateMerchantTaskInput): Promise<TaskResult> {
  const supabase = createClient()

  try {
    const { data, error } = await supabase.rpc('create_merchant_task_v2', {
      p_token: input.token,
      p_title: input.title,
      p_description: input.description || null,
      p_merchant_name: input.merchant_name || null,
      p_merchant_contact: input.merchant_contact || null
    })

    if (error) {
      return { success: false, error: error.message }
    }

    if (!data.success) {
      return { success: false, error: data.error }
    }

    return { success: true, task_id: data.task_id }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

// ============================================
// MANUAL TASK CREATION (Manager/Admin)
// ============================================

/**
 * Create a manual task for a store
 */
export async function createManualTask(input: CreateManualTaskInput): Promise<TaskResult> {
  const supabase = createClient()

  try {
    const { data, error } = await supabase.rpc('create_manual_task', {
      p_store_id: input.store_id,
      p_title: input.title,
      p_description: input.description || null,
      p_due_date: input.due_date || null,
      p_visible_to_merchant: input.visible_to_merchant ?? true
    })

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, task_id: data }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

// ============================================
// TASK STATUS UPDATE
// ============================================

/**
 * Update task status
 */
export async function updateTaskStatus(
  taskId: string, 
  status: StoreTaskStatus
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient()

  try {
    const { data, error } = await supabase.rpc('update_task_status', {
      p_task_id: taskId,
      p_status: status
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
// TASK QUERIES
// ============================================

/**
 * Get tasks for a store (grouped by section)
 */
export async function getStoreTasks(storeId: string): Promise<{
  tasks: StoreTask[]
  error?: string
}> {
  const supabase = createClient()

  try {
    const { data, error } = await supabase
      .from('store_tasks')
      .select('*')
      .eq('store_id', storeId)
      .order('sort_order', { ascending: true })

    if (error) {
      return { tasks: [], error: error.message }
    }

    return { tasks: data || [] }
  } catch (error) {
    return {
      tasks: [],
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Get merchant-visible tasks via public token
 */
export async function getMerchantTasks(token: string): Promise<{
  tasks: Array<{
    task_id: string
    title: string
    description: string | null
    public_status: 'follow_up' | 'done'
    is_merchant_created: boolean
    section_title: string
    created_at: string
  }>
  error?: string
}> {
  const supabase = createClient()

  try {
    const { data, error } = await supabase.rpc('get_merchant_tasks', {
      p_token: token
    })

    if (error) {
      return { tasks: [], error: error.message }
    }

    return { tasks: data || [] }
  } catch (error) {
    return {
      tasks: [],
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Get overdue tasks count
 */
export async function getOverdueTasksCount(): Promise<number> {
  const supabase = createClient()

  try {
    const { count, error } = await supabase
      .from('store_tasks')
      .select('*', { count: 'exact', head: true })
      .not('status', 'in', '("done","blocked")')
      .not('due_date', 'is', null)
      .lt('due_date', new Date().toISOString())

    if (error) {
      console.error('Error getting overdue tasks:', error)
      return 0
    }

    return count || 0
  } catch {
    return 0
  }
}
