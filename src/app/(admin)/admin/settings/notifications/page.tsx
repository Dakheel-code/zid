'use client'

import { useEffect, useState } from 'react'
import { 
  Bell,
  Save,
  Store,
  CheckSquare,
  Megaphone,
  Calendar,
  ToggleLeft,
  ToggleRight,
  ArrowRight
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface NotificationEventSetting {
  id: string
  event_key: string
  display_name: string
  description: string
  enabled: boolean
  priority: 'normal' | 'important' | 'urgent'
  category: 'store' | 'task' | 'announcement' | 'meeting'
}

const PRIORITY_OPTIONS = [
  { value: 'normal', label: 'عادي', color: 'bg-gray-100 text-gray-700' },
  { value: 'important', label: 'مهم', color: 'bg-amber-100 text-amber-700' },
  { value: 'urgent', label: 'عاجل', color: 'bg-red-100 text-red-700' }
]

const CATEGORY_ICONS = {
  store: Store,
  task: CheckSquare,
  announcement: Megaphone,
  meeting: Calendar
}

const CATEGORY_LABELS = {
  store: 'المتاجر',
  task: 'المهام',
  announcement: 'التعاميم',
  meeting: 'الاجتماعات'
}

export default function AdminNotificationSettingsPage() {
  const [settings, setSettings] = useState<NotificationEventSetting[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  useEffect(() => {
    // TODO: Fetch from API
    const mockSettings: NotificationEventSetting[] = [
      // Store events
      { 
        id: '1', 
        event_key: 'store.assigned', 
        display_name: 'متجر جديد مسند', 
        description: 'عند إسناد متجر جديد لمدير حساب',
        enabled: true, 
        priority: 'normal',
        category: 'store'
      },
      { 
        id: '2', 
        event_key: 'store.status_changed', 
        display_name: 'تغيير حالة المتجر', 
        description: 'عند تغيير حالة المتجر (نشط، متوقف، منتهي)',
        enabled: true, 
        priority: 'normal',
        category: 'store'
      },
      
      // Task events
      { 
        id: '3', 
        event_key: 'task.assigned', 
        display_name: 'مهمة جديدة', 
        description: 'عند إسناد مهمة جديدة',
        enabled: true, 
        priority: 'normal',
        category: 'task'
      },
      { 
        id: '4', 
        event_key: 'task.merchant_created', 
        display_name: 'مهمة من التاجر', 
        description: 'عند إنشاء مهمة من التاجر عبر الصفحة العامة',
        enabled: true, 
        priority: 'important',
        category: 'task'
      },
      { 
        id: '5', 
        event_key: 'task.status_changed', 
        display_name: 'تغيير حالة المهمة', 
        description: 'عند تغيير حالة المهمة',
        enabled: true, 
        priority: 'normal',
        category: 'task'
      },
      { 
        id: '6', 
        event_key: 'task.overdue', 
        display_name: 'مهمة متأخرة', 
        description: 'عند تجاوز المهمة لموعدها المحدد',
        enabled: true, 
        priority: 'important',
        category: 'task'
      },
      
      // Announcement events
      { 
        id: '7', 
        event_key: 'announcement.new', 
        display_name: 'تعميم جديد', 
        description: 'عند نشر تعميم جديد',
        enabled: true, 
        priority: 'normal',
        category: 'announcement'
      },
      { 
        id: '8', 
        event_key: 'announcement.urgent', 
        display_name: 'تعميم عاجل', 
        description: 'عند نشر تعميم عاجل (popup)',
        enabled: true, 
        priority: 'urgent',
        category: 'announcement'
      },
      
      // Meeting events
      { 
        id: '9', 
        event_key: 'meeting.booked', 
        display_name: 'اجتماع جديد محجوز', 
        description: 'عند حجز اجتماع جديد من العميل',
        enabled: true, 
        priority: 'important',
        category: 'meeting'
      },
      { 
        id: '10', 
        event_key: 'meeting.cancelled', 
        display_name: 'إلغاء اجتماع', 
        description: 'عند إلغاء اجتماع',
        enabled: true, 
        priority: 'normal',
        category: 'meeting'
      },
      { 
        id: '11', 
        event_key: 'meeting.reminder', 
        display_name: 'تذكير باجتماع', 
        description: 'تذكير قبل موعد الاجتماع',
        enabled: true, 
        priority: 'important',
        category: 'meeting'
      }
    ]
    setSettings(mockSettings)
    setLoading(false)
  }, [])

  const toggleEnabled = (eventKey: string) => {
    setSettings(prev => 
      prev.map(s => s.event_key === eventKey ? { ...s, enabled: !s.enabled } : s)
    )
    setHasChanges(true)
  }

  const changePriority = (eventKey: string, priority: 'normal' | 'important' | 'urgent') => {
    setSettings(prev => 
      prev.map(s => s.event_key === eventKey ? { ...s, priority } : s)
    )
    setHasChanges(true)
  }

  const handleSave = async () => {
    setSaving(true)
    // TODO: Save to API
    await new Promise(resolve => setTimeout(resolve, 1000))
    setSaving(false)
    setHasChanges(false)
  }

  // Group settings by category
  const groupedSettings = settings.reduce((acc, setting) => {
    if (!acc[setting.category]) {
      acc[setting.category] = []
    }
    acc[setting.category].push(setting)
    return acc
  }, {} as Record<string, NotificationEventSetting[]>)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Back Link */}
      <Link href="/admin/settings" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
        <ArrowRight className="h-4 w-4" />
        العودة للإعدادات
      </Link>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Bell className="h-6 w-6" />
            إعدادات الإشعارات
          </h1>
          <p className="text-muted-foreground">تحكم في أنواع الإشعارات وأولوياتها</p>
        </div>
        <Button onClick={handleSave} disabled={saving || !hasChanges}>
          <Save className="h-4 w-4 ml-2" />
          {saving ? 'جاري الحفظ...' : 'حفظ التغييرات'}
        </Button>
      </div>

      {/* شرح مستويات الأولوية */}
      <Card className="bg-[#2d1f4e] border-[#5a4985]/40">
        <CardContent className="p-4">
          <h3 className="font-semibold text-white mb-3">مستويات الأولوية:</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-md text-sm font-medium bg-gray-100 text-gray-700">عادي</span>
              <span className="text-sm text-[#8b7fad]">إشعار عادي بدون تمييز</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-md text-sm font-medium bg-amber-100 text-amber-700">مهم</span>
              <span className="text-sm text-[#8b7fad]">إشعار مهم يظهر بلون مميز</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-md text-sm font-medium bg-red-100 text-red-700">عاجل</span>
              <span className="text-sm text-[#8b7fad]">إشعار عاجل يظهر كنافذة منبثقة</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Settings by Category */}
      {Object.entries(groupedSettings).map(([category, categorySettings]) => {
        const CategoryIcon = CATEGORY_ICONS[category as keyof typeof CATEGORY_ICONS]
        const categoryLabel = CATEGORY_LABELS[category as keyof typeof CATEGORY_LABELS]
        
        return (
          <Card key={category}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CategoryIcon className="h-5 w-5" />
                {categoryLabel}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {categorySettings.map((setting) => (
                  <div 
                    key={setting.event_key}
                    className="flex items-center justify-between p-4 bg-muted/50 rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{setting.display_name}</p>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {setting.description}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      {/* Priority Selector */}
                      <select
                        value={setting.priority}
                        onChange={(e) => changePriority(setting.event_key, e.target.value as 'normal' | 'important' | 'urgent')}
                        disabled={!setting.enabled}
                        className={`px-3 py-1.5 rounded-md text-sm font-medium border-0 ${
                          setting.enabled 
                            ? PRIORITY_OPTIONS.find(p => p.value === setting.priority)?.color 
                            : 'bg-gray-100 text-gray-400'
                        }`}
                      >
                        {PRIORITY_OPTIONS.map(option => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      
                      {/* Enable/Disable Toggle */}
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={setting.enabled}
                          onChange={() => toggleEnabled(setting.event_key)}
                          className="sr-only peer"
                        />
                        <div className={`w-14 h-7 rounded-full peer transition-colors ${
                          setting.enabled 
                            ? 'bg-[#22c55e]' 
                            : 'bg-[#5a4985]'
                        } peer-focus:outline-none after:content-[''] after:absolute after:top-[2px] ${
                          setting.enabled ? 'after:right-[2px]' : 'after:left-[2px]'
                        } after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all after:shadow-md`}></div>
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
