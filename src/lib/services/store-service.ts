// ============================================
// ZID Dashboard - Phase 3.1: Store Service
// منطق إنشاء وإدارة المتاجر
// ============================================

import { createClient } from '@/lib/supabase/client'
import type { 
  Store, 
  StoreInsert, 
  StorePriority,
  StoreStatus 
} from '@/lib/supabase/types-simple'

// ============================================
// TYPES
// ============================================

export interface StoreDetectionResult {
  success: boolean
  store_name: string | null
  store_logo_url: string | null
  needs_review: boolean
  error?: string
}

export interface CreateStoreInput {
  store_url: string
  store_name?: string
  owner_name?: string
  owner_email?: string
  owner_phone?: string
  assigned_manager_id?: string
  priority?: StorePriority
  skip_detection?: boolean
}

export interface CreateStoreResult {
  success: boolean
  store?: Store
  public_token?: string
  tasks_created?: number
  error?: string
}

// ============================================
// STORE DETECTION
// ============================================

/**
 * Detect store metadata from URL (OG tags, favicon, etc.)
 * This runs on the server side via API route
 */
export async function detectStoreMetadata(storeUrl: string): Promise<StoreDetectionResult> {
  try {
    // Call our API endpoint for detection (to avoid CORS issues)
    const response = await fetch('/api/stores/detect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: storeUrl })
    })

    if (!response.ok) {
      return {
        success: false,
        store_name: null,
        store_logo_url: null,
        needs_review: true,
        error: 'Failed to detect store metadata'
      }
    }

    const data = await response.json()
    return {
      success: true,
      store_name: data.store_name || null,
      store_logo_url: data.store_logo_url || null,
      needs_review: !data.store_name && !data.store_logo_url
    }
  } catch (error) {
    console.error('Store detection error:', error)
    return {
      success: false,
      store_name: null,
      store_logo_url: null,
      needs_review: true,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Extract hostname from URL for fallback name
 */
export function extractHostname(url: string): string {
  try {
    const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`)
    return urlObj.hostname.replace('www.', '')
  } catch {
    return url
  }
}

// ============================================
// STORE CREATION
// ============================================

/**
 * Create a new store with full workflow:
 * 1. Detect store metadata (OG tags)
 * 2. Create store record
 * 3. Generate public link token
 * 4. Copy task templates
 * 5. Send notification to assigned manager
 */
export async function createStore(input: CreateStoreInput): Promise<CreateStoreResult> {
  const supabase = createClient()

  try {
    // Step 1: Detect store metadata (unless skipped)
    let detectionResult: StoreDetectionResult | null = null
    
    if (!input.skip_detection) {
      detectionResult = await detectStoreMetadata(input.store_url)
    }

    // Prepare store data
    const storeData: StoreInsert = {
      store_url: input.store_url,
      store_name: detectionResult?.store_name || extractHostname(input.store_url),
      store_logo_url: detectionResult?.store_logo_url || null,
      owner_name: input.owner_name || null,
      owner_email: input.owner_email || null,
      owner_phone: input.owner_phone || null,
      assigned_manager_id: input.assigned_manager_id || null,
      priority: input.priority || 'medium',
      status: 'new' as StoreStatus,
      metadata: {
        needs_review: detectionResult?.needs_review || false,
        detection_attempted: !input.skip_detection,
        detection_success: detectionResult?.success || false
      }
    }

    // Step 2: Create store using RPC function (handles all the workflow)
    const { data: result, error } = await supabase.rpc('create_store_with_workflow', {
      p_store_url: storeData.store_url,
      p_store_name: storeData.store_name,
      p_store_logo_url: storeData.store_logo_url,
      p_owner_name: storeData.owner_name,
      p_owner_email: storeData.owner_email,
      p_owner_phone: storeData.owner_phone,
      p_assigned_manager_id: storeData.assigned_manager_id,
      p_priority: storeData.priority,
      p_metadata: storeData.metadata
    })

    if (error) {
      console.error('Create store error:', error)
      return {
        success: false,
        error: error.message
      }
    }

    return {
      success: true,
      store: result.store,
      public_token: result.public_token,
      tasks_created: result.tasks_created
    }
  } catch (error) {
    console.error('Create store error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

// ============================================
// STORE METADATA RETRY
// ============================================

/**
 * Retry store metadata detection
 */
export async function retryStoreDetection(storeId: string): Promise<{
  success: boolean
  store_name?: string
  store_logo_url?: string
  error?: string
}> {
  const supabase = createClient()

  try {
    // Get current store
    const { data: store, error: fetchError } = await supabase
      .from('stores')
      .select('store_url')
      .eq('id', storeId)
      .single()

    if (fetchError || !store) {
      return { success: false, error: 'Store not found' }
    }

    // Retry detection
    const detection = await detectStoreMetadata(store.store_url)

    if (!detection.success || detection.needs_review) {
      return { 
        success: false, 
        error: detection.error || 'Detection failed, manual override required' 
      }
    }

    // Update store with detected metadata
    const { error: updateError } = await supabase
      .from('stores')
      .update({
        store_name: detection.store_name,
        store_logo_url: detection.store_logo_url,
        metadata: {
          needs_review: false,
          detection_attempted: true,
          detection_success: true,
          last_detection_at: new Date().toISOString()
        }
      })
      .eq('id', storeId)

    if (updateError) {
      return { success: false, error: updateError.message }
    }

    return {
      success: true,
      store_name: detection.store_name || undefined,
      store_logo_url: detection.store_logo_url || undefined
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Manual override for store metadata
 */
export async function updateStoreMetadata(
  storeId: string,
  data: { store_name?: string; store_logo_url?: string }
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient()

  try {
    const { error } = await supabase
      .from('stores')
      .update({
        ...data,
        metadata: {
          needs_review: false,
          manual_override: true,
          override_at: new Date().toISOString()
        }
      })
      .eq('id', storeId)

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
// STORE QUERIES
// ============================================

/**
 * Get stores for current user (admin sees all, manager sees assigned)
 */
export async function getStores(options?: {
  status?: StoreStatus
  priority?: StorePriority
  limit?: number
  offset?: number
}): Promise<{ stores: Store[]; count: number; error?: string }> {
  const supabase = createClient()

  try {
    let query = supabase
      .from('stores')
      .select('*', { count: 'exact' })

    if (options?.status) {
      query = query.eq('status', options.status)
    }

    if (options?.priority) {
      query = query.eq('priority', options.priority)
    }

    query = query
      .order('created_at', { ascending: false })
      .range(
        options?.offset || 0,
        (options?.offset || 0) + (options?.limit || 20) - 1
      )

    const { data, count, error } = await query

    if (error) {
      return { stores: [], count: 0, error: error.message }
    }

    return { stores: data || [], count: count || 0 }
  } catch (error) {
    return {
      stores: [],
      count: 0,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Get single store by ID
 */
export async function getStore(storeId: string): Promise<{
  store: Store | null
  error?: string
}> {
  const supabase = createClient()

  try {
    const { data, error } = await supabase
      .from('stores')
      .select('*')
      .eq('id', storeId)
      .single()

    if (error) {
      return { store: null, error: error.message }
    }

    return { store: data }
  } catch (error) {
    return {
      store: null,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Get stores that need review (detection failed)
 */
export async function getStoresNeedingReview(): Promise<{
  stores: Store[]
  error?: string
}> {
  const supabase = createClient()

  try {
    const { data, error } = await supabase
      .from('stores')
      .select('*')
      .contains('metadata', { needs_review: true })
      .order('created_at', { ascending: false })

    if (error) {
      return { stores: [], error: error.message }
    }

    return { stores: data || [] }
  } catch (error) {
    return {
      stores: [],
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}
