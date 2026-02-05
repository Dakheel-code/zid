import { NextRequest, NextResponse } from 'next/server'
import { sendSlackNotification } from '@/lib/services/notification-channels'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { channel, webhook_url, phone, email } = body

    if (channel === 'slack') {
      if (!webhook_url) {
        return NextResponse.json({ error: 'Webhook URL is required' }, { status: 400 })
      }

      const result = await sendSlackNotification(webhook_url, {
        title: '🔔 اختبار الاتصال',
        body: 'تم ربط Slack بنجاح مع ZID Dashboard!',
        type: 'success'
      })

      return NextResponse.json(result)
    }

    if (channel === 'whatsapp') {
      if (!phone) {
        return NextResponse.json({ error: 'Phone number is required' }, { status: 400 })
      }

      // التحقق من إعدادات Twilio
      const twilioConfigured = !!(
        process.env.TWILIO_ACCOUNT_SID && 
        process.env.TWILIO_AUTH_TOKEN && 
        process.env.TWILIO_WHATSAPP_NUMBER
      )

      if (!twilioConfigured) {
        return NextResponse.json({ 
          success: false, 
          error: 'خدمة WhatsApp غير مفعلة. يرجى إعداد Twilio في متغيرات البيئة.' 
        })
      }

      // هنا يمكن إضافة اختبار فعلي لـ Twilio
      return NextResponse.json({ 
        success: true, 
        message: 'إعدادات WhatsApp جاهزة' 
      })
    }

    if (channel === 'email') {
      if (!email) {
        return NextResponse.json({ error: 'Email is required' }, { status: 400 })
      }

      // التحقق من إعدادات البريد
      const emailConfigured = !!process.env.RESEND_API_KEY

      if (!emailConfigured) {
        return NextResponse.json({ 
          success: false, 
          error: 'خدمة البريد غير مفعلة. يرجى إعداد Resend API Key في متغيرات البيئة.' 
        })
      }

      return NextResponse.json({ 
        success: true, 
        message: 'إعدادات البريد جاهزة' 
      })
    }

    return NextResponse.json({ error: 'Invalid channel' }, { status: 400 })

  } catch (error) {
    console.error('Error testing notification:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
