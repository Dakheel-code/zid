import type { UserRole } from '@/lib/supabase/types-simple'
import { createClient } from '@/lib/supabase/client'

// ============================================
// PERMISSION TYPES
// ============================================

export type Permission = 
  // Stores
  | 'stores.create'
  | 'stores.read'
  | 'stores.read_assigned'
  | 'stores.update'
  | 'stores.update_status'
  | 'stores.delete'
  | 'stores.assign'
  // Tasks
  | 'tasks.read'
  | 'tasks.update'
  | 'tasks.create_manual'
  | 'tasks.delete'
  // Task Templates
  | 'templates.create'
  | 'templates.read'
  | 'templates.update'
  | 'templates.delete'
  // Managers
  | 'managers.create'
  | 'managers.read'
  | 'managers.update'
  | 'managers.delete'
  // Announcements
  | 'announcements.create'
  | 'announcements.read'
  | 'announcements.send'
  | 'announcements.delete'
  // Meetings
  | 'meetings.manage'
  | 'availability.manage'
  // Settings
  | 'settings.read'
  | 'settings.update'
  | 'notifications.settings'
  // Notifications
  | 'notifications.read'

// ============================================
// ROLE PERMISSIONS MAP
// ============================================

const rolePermissions: Record<UserRole, Permission[]> = {
  admin: [
    // Stores - Full access
    'stores.create',
    'stores.read',
    'stores.update',
    'stores.delete',
    'stores.assign',
    // Tasks - Full access
    'tasks.read',
    'tasks.update',
    'tasks.create_manual',
    'tasks.delete',
    // Templates - Full access
    'templates.create',
    'templates.read',
    'templates.update',
    'templates.delete',
    // Managers - Full access
    'managers.create',
    'managers.read',
    'managers.update',
    'managers.delete',
    // Announcements - Full access
    'announcements.create',
    'announcements.read',
    'announcements.send',
    'announcements.delete',
    // Settings - Full access
    'settings.read',
    'settings.update',
    'notifications.settings',
    // Notifications
    'notifications.read',
  ],
  manager: [
    // Stores - Assigned only
    'stores.read_assigned',
    'stores.update_status',
    // Tasks - Read/Update
    'tasks.read',
    'tasks.update',
    'tasks.create_manual',
    // Templates - Read only
    'templates.read',
    // Announcements - Read only
    'announcements.read',
    // Meetings - Manage own
    'meetings.manage',
    'availability.manage',
    // Notifications
    'notifications.read',
  ],
}

// ============================================
// PERMISSION FUNCTIONS
// ============================================

/**
 * Check if a role has a specific permission
 */
export function hasPermission(role: UserRole, permission: Permission): boolean {
  return rolePermissions[role]?.includes(permission) ?? false
}

/**
 * Get all permissions for a role
 */
export function getPermissions(role: UserRole): Permission[] {
  return rolePermissions[role] ?? []
}

/**
 * Check if role can access admin routes
 */
export function canAccessAdminRoutes(role: UserRole): boolean {
  return role === 'admin'
}

/**
 * Check if role can access manager routes
 */
export function canAccessManagerRoutes(role: UserRole): boolean {
  return role === 'admin' || role === 'manager'
}

/**
 * Get current user's role from Supabase
 */
export async function getCurrentUserRole(): Promise<UserRole | null> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return null
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  
  return profile?.role as UserRole ?? null
}

/**
 * Check if current user has a specific permission
 */
export async function currentUserHasPermission(permission: Permission): Promise<boolean> {
  const role = await getCurrentUserRole()
  if (!role) return false
  return hasPermission(role, permission)
}

// ============================================
// PERMISSION GROUPS (for UI)
// ============================================

export const PERMISSION_GROUPS = {
  stores: {
    label: 'المتاجر',
    permissions: ['stores.create', 'stores.read', 'stores.read_assigned', 'stores.update', 'stores.update_status', 'stores.delete', 'stores.assign']
  },
  tasks: {
    label: 'المهام',
    permissions: ['tasks.read', 'tasks.update', 'tasks.create_manual', 'tasks.delete']
  },
  templates: {
    label: 'قوالب المهام',
    permissions: ['templates.create', 'templates.read', 'templates.update', 'templates.delete']
  },
  managers: {
    label: 'مدراء العلاقات',
    permissions: ['managers.create', 'managers.read', 'managers.update', 'managers.delete']
  },
  announcements: {
    label: 'التعاميم',
    permissions: ['announcements.create', 'announcements.read', 'announcements.send', 'announcements.delete']
  },
  meetings: {
    label: 'الاجتماعات',
    permissions: ['meetings.manage', 'availability.manage']
  },
  settings: {
    label: 'الإعدادات',
    permissions: ['settings.read', 'settings.update', 'notifications.settings']
  }
} as const
