'use client'

import { useState, useEffect } from 'react'
import { 
  ArrowRight,
  Mail,
  MessageCircle,
  Slack,
  Save,
  Loader2,
  CheckCircle,
  Link2
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import Link from 'next/link'
import { createBrowserClient } from '@supabase/ssr'

interface IntegrationSettings {
  slack_webhook_url: string | null
  whatsapp_notification: boolean
  email_notification: boolean
}

export default function IntegrationsSettingsPage() {
  const [settings, setSettings] = useState<IntegrationSettings>({
    slack_webhook_url: null,
    whatsapp_notification: false,
    email_notification: true
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [userPhone, setUserPhone] = useState<string | null>(null)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          setUserId(user.id)
          const { data, error } = await supabase
            .from('profiles')
            .select('email, phone, slack_webhook_url, whatsapp_notification, email_notification')
            .eq('id', user.id)
            .single()
          
          if (data && !error) {
            setUserEmail(data.email || null)
            setUserPhone(data.phone || null)
            setSettings({
              slack_webhook_url: data.slack_webhook_url || '',
              whatsapp_notification: data.whatsapp_notification || false,
              email_notification: data.email_notification !== false
            })
          }
        }
      } catch (error) {
        console.error('Error fetching settings:', error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchSettings()
  }, [])

  const handleSave = async () => {
    if (!userId) return
    
    setSaving(true)
    setMessage(null)
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          slack_webhook_url: settings.slack_webhook_url || null,
          whatsapp_notification: settings.whatsapp_notification,
          email_notification: settings.email_notification
        })
        .eq('id', userId)
      
      if (error) throw error
      
      setMessage({ type: 'success', text: 'تم حفظ الإعدادات بنجاح' })
    } catch (error) {
      console.error('Error saving settings:', error)
      setMessage({ type: 'error', text: 'حدث خطأ أثناء حفظ الإعدادات' })
    } finally {
      setSaving(false)
    }
  }

  const handleTestConnection = async (channel: 'slack' | 'whatsapp' | 'email') => {
    setTesting(channel)
    setMessage(null)

    try {
      const response = await fetch('/api/notifications/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel,
          webhook_url: settings.slack_webhook_url,
          phone: userPhone,
          email: userEmail
        })
      })

      const result = await response.json()

      if (result.success) {
        setMessage({ 
          type: 'success', 
          text: channel === 'slack' 
            ? 'تم إرسال رسالة اختبار إلى Slack بنجاح!' 
            : channel === 'whatsapp'
            ? 'إعدادات WhatsApp جاهزة!'
            : 'إعدادات البريد جاهزة!'
        })
      } else {
        setMessage({ type: 'error', text: result.error || 'فشل الاختبار' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'حدث خطأ أثناء الاختبار' })
    } finally {
      setTesting(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link 
            href="/admin/settings" 
            className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 mb-2"
          >
            <ArrowRight className="h-4 w-4" />
            العودة للإعدادات
          </Link>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Link2 className="h-6 w-6" />
            ربط القنوات
          </h1>
          <p className="text-muted-foreground">ربط قنوات الإشعارات الخارجية</p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <Loader2 className="h-4 w-4 ml-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 ml-2" />
          )}
          حفظ التغييرات
        </Button>
      </div>

      {message && (
        <div className={`p-3 rounded-lg text-sm flex items-center gap-2 ${
          message.type === 'success' 
            ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
            : 'bg-red-500/20 text-red-400 border border-red-500/30'
        }`}>
          {message.type === 'success' && <CheckCircle className="h-4 w-4" />}
          {message.text}
        </div>
      )}

      <div className="grid gap-6">
        {/* Email Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-blue-500/20">
                <Mail className="h-5 w-5 text-blue-400" />
              </div>
              إشعارات البريد الإلكتروني
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">تفعيل إشعارات البريد</p>
                <p className="text-sm text-muted-foreground">استلام الإشعارات عبر البريد الإلكتروني المسجل</p>
              </div>
              <Switch
                checked={settings.email_notification}
                onCheckedChange={(checked) => setSettings({ ...settings, email_notification: checked })}
              />
            </div>
          </CardContent>
        </Card>

        {/* WhatsApp Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-green-500/20">
                <MessageCircle className="h-5 w-5 text-green-400" />
              </div>
              إشعارات الواتساب
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">تفعيل إشعارات الواتساب</p>
                <p className="text-sm text-muted-foreground">استلام الإشعارات عبر الواتساب (يتطلب رقم جوال مسجل)</p>
              </div>
              <Switch
                checked={settings.whatsapp_notification}
                onCheckedChange={(checked) => setSettings({ ...settings, whatsapp_notification: checked })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Slack Integration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-purple-500/20">
                <Slack className="h-5 w-5 text-purple-400" />
              </div>
              ربط Slack
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="font-medium mb-1">استلام الإشعارات في قناة Slack</p>
              <p className="text-sm text-muted-foreground mb-4">
                أدخل Webhook URL الخاص بقناة Slack لاستلام الإشعارات مباشرة
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="slack-webhook">Webhook URL</Label>
              <Input 
                id="slack-webhook" 
                value={settings.slack_webhook_url || ''}
                onChange={(e) => setSettings({ ...settings, slack_webhook_url: e.target.value })}
                placeholder="https://hooks.slack.com/services/..."
                dir="ltr"
                className="font-mono text-sm"
              />
            </div>
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">
                <strong>كيفية الحصول على Webhook URL:</strong>
              </p>
              <ol className="text-sm text-muted-foreground mt-2 space-y-1 list-decimal list-inside">
                <li>افتح <a href="https://api.slack.com/apps" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:underline">api.slack.com/apps</a></li>
                <li>أنشئ تطبيق جديد أو اختر تطبيق موجود</li>
                <li>فعّل Incoming Webhooks</li>
                <li>أضف Webhook جديد واختر القناة</li>
                <li>انسخ Webhook URL</li>
              </ol>
            </div>
            <Button 
              variant="secondary" 
              size="sm"
              onClick={() => handleTestConnection('slack')}
              disabled={testing === 'slack' || !settings.slack_webhook_url}
            >
              {testing === 'slack' ? (
                <Loader2 className="h-4 w-4 ml-2 animate-spin" />
              ) : (
                <CheckCircle className="h-4 w-4 ml-2" />
              )}
              اختبار الاتصال
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
