import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { 
  sendSlackNotification, 
  sendWhatsAppNotification, 
  sendEmailNotification 
} from '@/lib/services/notification-channels'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      user_id, 
      title, 
      body: messageBody, 
      type = 'info',
      link,
      channels // optional: specify which channels to use
    } = body

    if (!user_id || !title || !messageBody) {
      return NextResponse.json(
        { error: 'Missing required fields: user_id, title, body' },
        { status: 400 }
      )
    }

    // جلب إعدادات المستخدم
    const { data: userProfile, error: profileError } = await supabase
      .from('profiles')
      .select('email, phone, slack_webhook_url, whatsapp_notification, email_notification')
      .eq('id', user_id)
      .single()

    if (profileError || !userProfile) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const results: { 
      slack?: { success: boolean; error?: string }
      whatsapp?: { success: boolean; error?: string }
      email?: { success: boolean; error?: string }
    } = {}

    // إرسال عبر Slack
    if (userProfile.slack_webhook_url && (!channels || channels.includes('slack'))) {
      results.slack = await sendSlackNotification(userProfile.slack_webhook_url, {
        title,
        body: messageBody,
        type,
        link
      })
    }

    // إرسال عبر WhatsApp
    if (userProfile.whatsapp_notification && userProfile.phone && (!channels || channels.includes('whatsapp'))) {
      const twilioConfig = {
        accountSid: process.env.TWILIO_ACCOUNT_SID || '',
        authToken: process.env.TWILIO_AUTH_TOKEN || '',
        fromNumber: process.env.TWILIO_WHATSAPP_NUMBER || ''
      }
      
      if (twilioConfig.accountSid && twilioConfig.authToken && twilioConfig.fromNumber) {
        results.whatsapp = await sendWhatsAppNotification(
          userProfile.phone,
          `*${title}*\n\n${messageBody}${link ? `\n\n${link}` : ''}`,
          twilioConfig
        )
      } else {
        results.whatsapp = { success: false, error: 'Twilio not configured' }
      }
    }

    // إرسال عبر البريد الإلكتروني
    if (userProfile.email_notification && userProfile.email && (!channels || channels.includes('email'))) {
      const emailConfig = {
        apiKey: process.env.RESEND_API_KEY || '',
        fromEmail: process.env.EMAIL_FROM || 'ZID Dashboard <notifications@zid-dashboard.com>'
      }
      
      if (emailConfig.apiKey) {
        results.email = await sendEmailNotification(
          userProfile.email,
          title,
          `<p>${messageBody}</p>${link ? `<p><a href="${link}">عرض التفاصيل</a></p>` : ''}`,
          emailConfig
        )
      } else {
        results.email = { success: false, error: 'Email service not configured' }
      }
    }

    return NextResponse.json({
      success: true,
      results
    })

  } catch (error) {
    console.error('Error sending notifications:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
