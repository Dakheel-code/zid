'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { User, Mail, Phone, Lock, Save, Loader2, Bell, MessageCircle, Slack } from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import { createBrowserClient } from '@supabase/ssr'

interface UserProfile {
  id: string
  name: string
  email: string
  phone: string | null
  role: string
  slack_webhook_url?: string | null
  whatsapp_notification?: boolean
  email_notification?: boolean
}

export default function SettingsPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  
  // Form state
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  
  // Notification settings
  const [slackWebhookUrl, setSlackWebhookUrl] = useState('')
  const [whatsappNotification, setWhatsappNotification] = useState(false)
  const [emailNotification, setEmailNotification] = useState(true)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const { data: profileData, error } = await supabase
            .from('profiles')
            .select('id, name, email, phone, role, slack_webhook_url, whatsapp_notification, email_notification')
            .eq('id', user.id)
            .single()
          
          if (profileData && !error) {
            setProfile(profileData)
            setName(profileData.name || '')
            setPhone(profileData.phone || '')
            setSlackWebhookUrl(profileData.slack_webhook_url || '')
            setWhatsappNotification(profileData.whatsapp_notification || false)
            setEmailNotification(profileData.email_notification !== false)
          }
        }
      } catch (error) {
        console.error('Error fetching profile:', error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchProfile()
  }, [])

  const handleSaveProfile = async () => {
    if (!profile) return
    
    setSaving(true)
    setMessage(null)
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          name: name,
          phone: phone || null,
          slack_webhook_url: slackWebhookUrl || null,
          whatsapp_notification: whatsappNotification,
          email_notification: emailNotification
        })
        .eq('id', profile.id)
      
      if (error) throw error
      
      setMessage({ type: 'success', text: 'تم حفظ التغييرات بنجاح' })
      setProfile({ ...profile, name, phone })
    } catch (error) {
      console.error('Error saving profile:', error)
      setMessage({ type: 'error', text: 'حدث خطأ أثناء حفظ التغييرات' })
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = async () => {
    if (!newPassword || !confirmPassword) {
      setMessage({ type: 'error', text: 'يرجى ملء جميع حقول كلمة المرور' })
      return
    }
    
    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'كلمة المرور الجديدة غير متطابقة' })
      return
    }
    
    if (newPassword.length < 6) {
      setMessage({ type: 'error', text: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' })
      return
    }
    
    setSaving(true)
    setMessage(null)
    
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      })
      
      if (error) throw error
      
      setMessage({ type: 'success', text: 'تم تغيير كلمة المرور بنجاح' })
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (error) {
      console.error('Error changing password:', error)
      setMessage({ type: 'error', text: 'حدث خطأ أثناء تغيير كلمة المرور' })
    } finally {
      setSaving(false)
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
    <div className="p-4 lg:p-6 space-y-4 lg:space-y-6">
      <h1 className="text-xl lg:text-2xl font-bold">الإعدادات</h1>

      {message && (
        <div className={`p-3 rounded-lg text-sm ${
          message.type === 'success' 
            ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
            : 'bg-red-500/20 text-red-400 border border-red-500/30'
        }`}>
          {message.text}
        </div>
      )}

      <div className="grid gap-4 lg:gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base lg:text-lg">
              <User className="h-5 w-5" />
              المعلومات الشخصية
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">الاسم</Label>
                <Input 
                  id="name" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="أدخل اسمك"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">المسمى الوظيفي</Label>
                <Input 
                  id="role" 
                  value={profile?.role === 'manager' ? 'مدير العلاقة' : profile?.role === 'admin' ? 'مدير النظام' : profile?.role || ''}
                  disabled
                  className="bg-muted"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base lg:text-lg">
              <Mail className="h-5 w-5" />
              معلومات التواصل
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">البريد الإلكتروني</Label>
                <Input 
                  id="email" 
                  type="email" 
                  value={profile?.email || ''}
                  disabled
                  className="bg-muted"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">رقم الجوال</Label>
                <Input 
                  id="phone" 
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+966 5X XXX XXXX"
                  dir="ltr"
                />
              </div>
            </div>
            <div className="flex justify-end">
              <Button onClick={handleSaveProfile} disabled={saving}>
                {saving ? (
                  <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 ml-2" />
                )}
                حفظ المعلومات
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base lg:text-lg">
              <Bell className="h-5 w-5" />
              إعدادات الإشعارات
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Email Notifications */}
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                  <Mail className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <p className="font-medium">إشعارات البريد الإلكتروني</p>
                  <p className="text-sm text-muted-foreground">استلام الإشعارات عبر البريد الإلكتروني</p>
                </div>
              </div>
              <Switch
                checked={emailNotification}
                onCheckedChange={setEmailNotification}
              />
            </div>

            {/* WhatsApp Notifications */}
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                  <MessageCircle className="h-5 w-5 text-green-400" />
                </div>
                <div>
                  <p className="font-medium">إشعارات الواتساب</p>
                  <p className="text-sm text-muted-foreground">استلام الإشعارات عبر الواتساب (يتطلب رقم جوال)</p>
                </div>
              </div>
              <Switch
                checked={whatsappNotification}
                onCheckedChange={setWhatsappNotification}
                disabled={!phone}
              />
            </div>

            {/* Slack Integration */}
            <div className="p-4 bg-muted/50 rounded-lg space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                  <Slack className="h-5 w-5 text-purple-400" />
                </div>
                <div>
                  <p className="font-medium">ربط Slack</p>
                  <p className="text-sm text-muted-foreground">استلام الإشعارات في قناة Slack</p>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="slack-webhook">Webhook URL</Label>
                <Input 
                  id="slack-webhook" 
                  value={slackWebhookUrl}
                  onChange={(e) => setSlackWebhookUrl(e.target.value)}
                  placeholder="https://hooks.slack.com/services/..."
                  dir="ltr"
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  يمكنك الحصول على Webhook URL من إعدادات تطبيق Slack الخاص بك
                </p>
              </div>
            </div>

            <div className="flex justify-end">
              <Button onClick={handleSaveProfile} disabled={saving}>
                {saving ? (
                  <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 ml-2" />
                )}
                حفظ إعدادات الإشعارات
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base lg:text-lg">
              <Lock className="h-5 w-5" />
              تغيير كلمة المرور
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="current-password">كلمة المرور الحالية</Label>
              <Input 
                id="current-password" 
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="new-password">كلمة المرور الجديدة</Label>
                <Input 
                  id="new-password" 
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">تأكيد كلمة المرور</Label>
                <Input 
                  id="confirm-password" 
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
            </div>
            <div className="flex justify-end">
              <Button onClick={handleChangePassword} disabled={saving} variant="secondary">
                {saving ? (
                  <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                ) : (
                  <Lock className="h-4 w-4 ml-2" />
                )}
                تغيير كلمة المرور
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
