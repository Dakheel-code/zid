import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const { token } = params

    // Get public link and validate
    const { data: publicLink, error: linkError } = await supabase
      .from('store_public_links')
      .select(`
        id,
        store_id,
        token,
        link_type,
        expires_at,
        is_active,
        stores (
          id,
          store_name,
          store_logo_url,
          store_url,
          status,
          public_access_expires_at,
          assigned_manager_id,
          profiles:assigned_manager_id (
            id,
            name,
            phone,
            avatar_url
          )
        )
      `)
      .eq('token', token)
      .eq('is_active', true)
      .single()

    if (linkError || !publicLink) {
      return NextResponse.json(
        { error: 'الرابط غير صالح أو منتهي الصلاحية' },
        { status: 404 }
      )
    }

    // Check if link is expired
    if (publicLink.expires_at && new Date(publicLink.expires_at) < new Date()) {
      return NextResponse.json(
        { error: 'انتهت صلاحية الرابط', is_expired: true },
        { status: 403 }
      )
    }

    const store = publicLink.stores as any
    
    // Check if store access is expired
    if (store.public_access_expires_at && new Date(store.public_access_expires_at) < new Date()) {
      return NextResponse.json({
        is_expired: true,
        expires_at: store.public_access_expires_at
      })
    }

    // Get visible tasks for merchant
    const { data: tasks, error: tasksError } = await supabase
      .from('store_tasks')
      .select('id, title, description, status, section_title, sort_order')
      .eq('store_id', store.id)
      .eq('visible_to_merchant', true)
      .order('sort_order', { ascending: true })

    if (tasksError) {
      console.error('Error fetching tasks:', tasksError)
    }

    // Map task status for merchant view
    const mappedTasks = (tasks || []).map(task => ({
      id: task.id,
      title: task.title,
      description: task.description,
      section_title: task.section_title,
      status: task.status === 'done' ? 'done' : 'pending'
    }))

    const manager = store.profiles

    return NextResponse.json({
      store: {
        id: store.id,
        store_name: store.store_name,
        store_logo_url: store.store_logo_url,
        store_url: store.store_url
      },
      manager: manager ? {
        id: manager.id,
        name: manager.name,
        phone: manager.phone,
        avatar_url: manager.avatar_url
      } : null,
      tasks: mappedTasks,
      is_expired: false,
      expires_at: store.public_access_expires_at
    })

  } catch (error) {
    console.error('Error in public store API:', error)
    return NextResponse.json(
      { error: 'حدث خطأ في الخادم' },
      { status: 500 }
    )
  }
}
