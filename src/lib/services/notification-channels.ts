/**
 * خدمة إرسال الإشعارات عبر القنوات المختلفة
 * Notification Channels Service
 */

// إرسال إشعار عبر Slack
export async function sendSlackNotification(
  webhookUrl: string,
  message: {
    title: string
    body: string
    type?: 'info' | 'success' | 'warning' | 'error'
    link?: string
  }
): Promise<{ success: boolean; error?: string }> {
  if (!webhookUrl) {
    return { success: false, error: 'Webhook URL is required' }
  }

  const colorMap = {
    info: '#3b82f6',
    success: '#22c55e',
    warning: '#f59e0b',
    error: '#ef4444'
  }

  const payload = {
    blocks: [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: message.title,
          emoji: true
        }
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: message.body
        }
      }
    ],
    attachments: [
      {
        color: colorMap[message.type || 'info'],
        footer: 'ZID Dashboard',
        ts: Math.floor(Date.now() / 1000).toString()
      }
    ]
  }

  if (message.link) {
    payload.blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `<${message.link}|عرض التفاصيل>`
      }
    } as any)
  }

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })

    if (!response.ok) {
      return { success: false, error: `Slack API error: ${response.status}` }
    }

    return { success: true }
  } catch (error) {
    console.error('Slack notification error:', error)
    return { success: false, error: 'Failed to send Slack notification' }
  }
}

// إرسال إشعار عبر WhatsApp (باستخدام Twilio)
export async function sendWhatsAppNotification(
  phone: string,
  message: string,
  config: {
    accountSid: string
    authToken: string
    fromNumber: string
  }
): Promise<{ success: boolean; error?: string }> {
  if (!phone || !config.accountSid || !config.authToken) {
    return { success: false, error: 'Missing required parameters' }
  }

  // تنسيق رقم الهاتف
  const formattedPhone = phone.replace(/[^0-9]/g, '')
  const toNumber = formattedPhone.startsWith('966') 
    ? `+${formattedPhone}` 
    : `+966${formattedPhone}`

  try {
    const url = `https://api.twilio.com/2010-04-01/Accounts/${config.accountSid}/Messages.json`
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + Buffer.from(`${config.accountSid}:${config.authToken}`).toString('base64'),
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        From: `whatsapp:${config.fromNumber}`,
        To: `whatsapp:${toNumber}`,
        Body: message
      })
    })

    if (!response.ok) {
      const errorData = await response.json()
      return { success: false, error: errorData.message || 'WhatsApp API error' }
    }

    return { success: true }
  } catch (error) {
    console.error('WhatsApp notification error:', error)
    return { success: false, error: 'Failed to send WhatsApp notification' }
  }
}

// إرسال إشعار عبر البريد الإلكتروني (باستخدام Resend)
export async function sendEmailNotification(
  to: string,
  subject: string,
  body: string,
  config: {
    apiKey: string
    fromEmail?: string
  }
): Promise<{ success: boolean; error?: string }> {
  if (!to || !config.apiKey) {
    return { success: false, error: 'Missing required parameters' }
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: config.fromEmail || 'ZID Dashboard <notifications@zid-dashboard.com>',
        to: [to],
        subject: subject,
        html: `
          <div dir="rtl" style="font-family: Arial, sans-serif; padding: 20px;">
            <h2 style="color: #7c3aed;">${subject}</h2>
            <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
              ${body}
            </div>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
            <p style="color: #6b7280; font-size: 12px;">
              هذا البريد مرسل تلقائياً من نظام ZID Dashboard
            </p>
          </div>
        `
      })
    })

    if (!response.ok) {
      const errorData = await response.json()
      return { success: false, error: errorData.message || 'Email API error' }
    }

    return { success: true }
  } catch (error) {
    console.error('Email notification error:', error)
    return { success: false, error: 'Failed to send email notification' }
  }
}

// دالة موحدة لإرسال الإشعارات لجميع القنوات المفعلة
export async function sendNotificationToAllChannels(
  userId: string,
  notification: {
    title: string
    body: string
    type?: 'info' | 'success' | 'warning' | 'error'
    link?: string
  },
  userSettings: {
    email?: string
    phone?: string
    slack_webhook_url?: string | null
    whatsapp_notification?: boolean
    email_notification?: boolean
  }
): Promise<{ slack?: boolean; whatsapp?: boolean; email?: boolean }> {
  const results: { slack?: boolean; whatsapp?: boolean; email?: boolean } = {}

  // إرسال عبر Slack
  if (userSettings.slack_webhook_url) {
    const slackResult = await sendSlackNotification(userSettings.slack_webhook_url, notification)
    results.slack = slackResult.success
  }

  // إرسال عبر WhatsApp
  if (userSettings.whatsapp_notification && userSettings.phone) {
    const twilioConfig = {
      accountSid: process.env.TWILIO_ACCOUNT_SID || '',
      authToken: process.env.TWILIO_AUTH_TOKEN || '',
      fromNumber: process.env.TWILIO_WHATSAPP_NUMBER || ''
    }
    
    if (twilioConfig.accountSid && twilioConfig.authToken) {
      const whatsappResult = await sendWhatsAppNotification(
        userSettings.phone,
        `${notification.title}\n\n${notification.body}`,
        twilioConfig
      )
      results.whatsapp = whatsappResult.success
    }
  }

  // إرسال عبر البريد الإلكتروني
  if (userSettings.email_notification && userSettings.email) {
    const emailConfig = {
      apiKey: process.env.RESEND_API_KEY || ''
    }
    
    if (emailConfig.apiKey) {
      const emailResult = await sendEmailNotification(
        userSettings.email,
        notification.title,
        notification.body,
        emailConfig
      )
      results.email = emailResult.success
    }
  }

  return results
}
