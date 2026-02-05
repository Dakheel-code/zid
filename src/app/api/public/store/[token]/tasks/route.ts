import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function POST(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const { token } = params
    const body = await request.json()

    const { title, description, name, contact } = body

    if (!title || !name || !contact) {
      return NextResponse.json(
        { error: 'الحقول المطلوبة: title, name, contact' },
        { status: 400 }
      )
    }

    // Validate token and get store
    const { data: publicLink, error: linkError } = await supabase
      .from('store_public_links')
      .select('store_id, stores(id, assigned_manager_id)')
      .eq('token', token)
      .eq('is_active', true)
      .single()

    if (linkError || !publicLink) {
      return NextResponse.json(
        { error: 'الرابط غير صالح' },
        { status: 404 }
      )
    }

    const store = publicLink.stores as any
    const storeId = store.id
    const managerId = store.assigned_manager_id

    // Create merchant task using RPC
    const { data: taskId, error: taskError } = await supabase.rpc('create_merchant_task_v2', {
      p_token: token,
      p_title: title,
      p_description: description || null,
      p_merchant_name: name,
      p_merchant_contact: contact
    })

    if (taskError) {
      console.error('Error creating merchant task:', taskError)
      return NextResponse.json(
        { error: 'فشل في إنشاء المهمة' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      task_id: taskId,
      message: 'تم إرسال طلبك بنجاح'
    })

  } catch (error) {
    console.error('Error in merchant task API:', error)
    return NextResponse.json(
      { error: 'حدث خطأ في الخادم' },
      { status: 500 }
    )
  }
}
