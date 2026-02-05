# ZID Dashboard - توثيق النظام الشامل

## نظرة عامة

نظام إدارة المتاجر (ZID Dashboard) هو نظام متكامل لإدارة علاقات التجار مع مدراء الحسابات.

---

## 1. الأدوار والصلاحيات (Roles & Permissions)

### 1.1 أنواع الأدوار

| الدور | الوصف | المسار الأساسي |
|-------|-------|----------------|
| `admin` | مدير النظام - صلاحيات كاملة | `/admin/*` |
| `manager` | مدير حساب - إدارة المتاجر المسندة | `/manager/*` |

### 1.2 صلاحيات Admin

| الصلاحية | الوصف |
|----------|-------|
| `stores.create` | إنشاء متجر جديد |
| `stores.read` | عرض جميع المتاجر |
| `stores.update` | تعديل أي متجر |
| `stores.delete` | حذف متجر |
| `stores.assign` | إسناد متجر لمدير |
| `managers.create` | إنشاء مدير حساب جديد |
| `managers.read` | عرض جميع المدراء |
| `managers.update` | تعديل بيانات المدراء |
| `managers.delete` | حذف مدير |
| `templates.create` | إنشاء قالب مهام |
| `templates.update` | تعديل قوالب المهام |
| `templates.delete` | حذف قالب |
| `announcements.create` | إنشاء تعميم |
| `announcements.send` | إرسال تعميم |
| `announcements.delete` | حذف تعميم |
| `settings.read` | عرض الإعدادات |
| `settings.update` | تعديل الإعدادات |
| `notifications.settings` | إدارة إعدادات الإشعارات |

### 1.3 صلاحيات Manager

| الصلاحية | الوصف |
|----------|-------|
| `stores.read_assigned` | عرض المتاجر المسندة فقط |
| `stores.update_status` | تغيير حالة المتجر |
| `tasks.read` | عرض مهام المتاجر المسندة |
| `tasks.update` | تحديث حالة المهام |
| `tasks.create_manual` | إنشاء مهمة يدوية |
| `announcements.read` | قراءة التعاميم |
| `meetings.manage` | إدارة الاجتماعات |
| `availability.manage` | إدارة ساعات العمل |
| `notifications.read` | قراءة الإشعارات |

### 1.4 التحقق من الصلاحيات (Code)

```typescript
// src/lib/permissions/index.ts
import { createClient } from '@/lib/supabase/client'

export type Role = 'admin' | 'manager'

export const PERMISSIONS = {
  admin: [
    'stores.create', 'stores.read', 'stores.update', 'stores.delete', 'stores.assign',
    'managers.create', 'managers.read', 'managers.update', 'managers.delete',
    'templates.create', 'templates.update', 'templates.delete',
    'announcements.create', 'announcements.send', 'announcements.delete',
    'settings.read', 'settings.update', 'notifications.settings'
  ],
  manager: [
    'stores.read_assigned', 'stores.update_status',
    'tasks.read', 'tasks.update', 'tasks.create_manual',
    'announcements.read', 'meetings.manage', 'availability.manage',
    'notifications.read'
  ]
} as const

export function hasPermission(role: Role, permission: string): boolean {
  return PERMISSIONS[role]?.includes(permission as any) ?? false
}

export async function getCurrentUserRole(): Promise<Role | null> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  
  return profile?.role as Role ?? null
}
```

---

## 2. كتالوج الإشعارات (Events Catalog)

### 2.1 أنواع الإشعارات

| النوع | الوصف |
|-------|-------|
| `store` | إشعارات المتاجر |
| `task` | إشعارات المهام |
| `announcement` | إشعارات التعاميم |
| `meeting` | إشعارات الاجتماعات |

### 2.2 مستويات الأولوية

| الأولوية | الوصف | اللون |
|----------|-------|-------|
| `normal` | عادي | أزرق |
| `important` | مهم | برتقالي |
| `urgent` | عاجل | أحمر |

### 2.3 قائمة الأحداث (Event Keys)

#### أحداث المتاجر (Store Events)

| Event Key | الوصف | المستلم | الأولوية الافتراضية |
|-----------|-------|---------|---------------------|
| `store.assigned` | متجر جديد مسند | Manager | `normal` |
| `store.status_changed` | تغيير حالة المتجر | Manager | `normal` |
| `store.ended` | انتهاء المتجر | Manager | `important` |

#### أحداث المهام (Task Events)

| Event Key | الوصف | المستلم | الأولوية الافتراضية |
|-----------|-------|---------|---------------------|
| `task.assigned` | مهمة جديدة مسندة | Manager | `normal` |
| `task.merchant_created` | مهمة من التاجر | Manager | `important` |
| `task.status_changed` | تغيير حالة المهمة | Manager | `normal` |
| `task.overdue` | مهمة متأخرة | Manager | `important` |
| `task.completed` | مهمة مكتملة | Admin | `normal` |

#### أحداث التعاميم (Announcement Events)

| Event Key | الوصف | المستلم | الأولوية الافتراضية |
|-----------|-------|---------|---------------------|
| `announcement.new` | تعميم جديد | Manager | `normal` |
| `announcement.urgent` | تعميم عاجل (popup) | Manager | `urgent` |

#### أحداث الاجتماعات (Meeting Events)

| Event Key | الوصف | المستلم | الأولوية الافتراضية |
|-----------|-------|---------|---------------------|
| `meeting.booked` | اجتماع جديد محجوز | Manager | `important` |
| `meeting.cancelled` | إلغاء اجتماع | Manager | `normal` |
| `meeting.reminder` | تذكير باجتماع | Manager | `important` |
| `meeting.rescheduled` | إعادة جدولة | Manager | `normal` |

### 2.4 بنية الإشعار

```typescript
interface Notification {
  id: string
  recipient_user_id: string
  type: 'store' | 'task' | 'announcement' | 'meeting'
  event_key: string
  title: string
  body: string | null
  priority: 'normal' | 'important' | 'urgent'
  link_url: string | null
  metadata: Record<string, any>
  is_read: boolean
  read_at: string | null
  created_at: string
}
```

### 2.5 إنشاء إشعار (SQL Function)

```sql
-- استدعاء من trigger أو RPC
SELECT create_notification_v2(
  p_recipient_user_id := 'user-uuid',
  p_type := 'task',
  p_event_key := 'task.merchant_created',
  p_title := 'مهمة جديدة من التاجر',
  p_body := 'أحمد محمد أرسل طلب جديد',
  p_link_url := '/manager/store/123',
  p_metadata := '{"store_id": "123", "task_id": "456"}'::jsonb
);
```

---

## 3. قواعد الروابط العامة (Public Token Rules)

### 3.1 أنواع الروابط

| النوع | الوصف | الاستخدام |
|-------|-------|-----------|
| `merchant_page` | صفحة التاجر | عرض المهام + إنشاء طلب |
| `task_form` | نموذج مهمة | إنشاء مهمة مباشرة |

### 3.2 بنية الرابط العام

```typescript
interface StorePublicLink {
  id: string
  store_id: string
  token: string              // UUID فريد
  link_type: 'merchant_page' | 'task_form'
  expires_at: string | null  // تاريخ انتهاء الصلاحية
  is_active: boolean
  created_at: string
}
```

### 3.3 قواعد الصلاحية

| القاعدة | الوصف |
|---------|-------|
| **الإنشاء التلقائي** | عند إنشاء متجر، يُنشأ token تلقائياً |
| **الصلاحية الأولية** | لا تنتهي صلاحية الرابط ما دام المتجر نشطاً |
| **عند انتهاء المتجر** | `public_access_expires_at = ended_at + 30 days` |
| **بعد 30 يوم** | الصفحة تعرض رسالة "انتهت صلاحية الوصول" |
| **التعطيل اليدوي** | يمكن للـ Admin تعطيل الرابط يدوياً |

### 3.4 التحقق من الصلاحية (SQL)

```sql
-- التحقق من صلاحية الرابط
CREATE OR REPLACE FUNCTION validate_public_token(p_token TEXT)
RETURNS TABLE (
  is_valid BOOLEAN,
  store_id UUID,
  is_expired BOOLEAN,
  expires_at TIMESTAMPTZ
) AS $$
DECLARE
  v_link store_public_links%ROWTYPE;
  v_store stores%ROWTYPE;
BEGIN
  -- Get link
  SELECT * INTO v_link FROM store_public_links 
  WHERE token = p_token AND is_active = true;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, NULL::UUID, false, NULL::TIMESTAMPTZ;
    RETURN;
  END IF;
  
  -- Get store
  SELECT * INTO v_store FROM stores WHERE id = v_link.store_id;
  
  -- Check expiry
  IF v_link.expires_at IS NOT NULL AND v_link.expires_at < NOW() THEN
    RETURN QUERY SELECT false, v_store.id, true, v_link.expires_at;
    RETURN;
  END IF;
  
  IF v_store.public_access_expires_at IS NOT NULL 
     AND v_store.public_access_expires_at < NOW() THEN
    RETURN QUERY SELECT false, v_store.id, true, v_store.public_access_expires_at;
    RETURN;
  END IF;
  
  RETURN QUERY SELECT true, v_store.id, false, v_store.public_access_expires_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 3.5 عرض المهام للتاجر

| الحالة الأصلية | الحالة المعروضة |
|----------------|-----------------|
| `new` | قيد المتابعة |
| `in_progress` | قيد المتابعة |
| `done` | منجز |
| `blocked` | قيد المتابعة |

**ملاحظة:** فقط المهام التي `visible_to_merchant = true` تظهر للتاجر.

---

## 4. قواعد الاجتماعات (Meetings Rules)

### 4.1 إعدادات الاجتماعات

```typescript
interface MeetingSettings {
  id: string
  manager_id: string
  meeting_duration: number      // بالدقائق (افتراضي: 30)
  buffer_before: number         // وقت فاصل قبل (بالدقائق)
  buffer_after: number          // وقت فاصل بعد (بالدقائق)
  timezone: string              // المنطقة الزمنية (افتراضي: Asia/Riyadh)
  min_booking_notice: number    // أقل وقت للحجز المسبق (بالساعات)
  max_booking_days: number      // أقصى أيام للحجز المستقبلي
  google_calendar_id: string | null
}
```

### 4.2 ساعات العمل (Availability Rules)

```typescript
interface AvailabilityRule {
  id: string
  manager_id: string
  day_of_week: number    // 0 = الأحد, 6 = السبت
  start_time: string     // "09:00"
  end_time: string       // "17:00"
  is_available: boolean
}
```

### 4.3 أوقات الراحة (Time Off)

```typescript
interface TimeOff {
  id: string
  manager_id: string
  start_at: string       // تاريخ ووقت البداية
  end_at: string         // تاريخ ووقت النهاية
  reason: string | null
}
```

### 4.4 قواعد الحجز

| القاعدة | الوصف |
|---------|-------|
| **الحد الأدنى للحجز** | لا يمكن الحجز قبل `min_booking_notice` ساعة |
| **الحد الأقصى للحجز** | لا يمكن الحجز بعد `max_booking_days` يوم |
| **ساعات العمل** | الحجز فقط خلال ساعات العمل المحددة |
| **أوقات الراحة** | لا يمكن الحجز خلال أوقات الراحة |
| **التعارض** | لا يمكن حجز وقت محجوز مسبقاً |
| **Buffer** | يُضاف وقت فاصل قبل وبعد كل اجتماع |

### 4.5 حالات الاجتماع

| الحالة | الوصف |
|--------|-------|
| `booked` | محجوز ومؤكد |
| `cancelled` | ملغي |
| `completed` | منتهي |
| `no_show` | لم يحضر |

### 4.6 التكامل مع Google Calendar

```typescript
// عند حجز اجتماع جديد
async function createGoogleCalendarEvent(meeting: Meeting) {
  const settings = await getMeetingSettings(meeting.manager_id)
  
  if (!settings.google_calendar_id) return null
  
  const event = {
    summary: `اجتماع مع ${meeting.guest_name}`,
    description: `البريد: ${meeting.guest_email}\nالهاتف: ${meeting.guest_phone}`,
    start: { dateTime: meeting.start_at, timeZone: settings.timezone },
    end: { dateTime: meeting.end_at, timeZone: settings.timezone },
    attendees: [{ email: meeting.guest_email }]
  }
  
  // Create event via Google Calendar API
  const result = await calendar.events.insert({
    calendarId: settings.google_calendar_id,
    resource: event,
    sendUpdates: 'all'
  })
  
  return result.data.id
}
```

---

## 5. Design Tokens

### 5.1 موقع الملفات

```
src/styles/
├── tokens.css          # CSS Variables
└── globals.css         # Global styles + imports

tailwind.config.ts      # Tailwind configuration
```

### 5.2 الألوان (Colors)

```css
:root {
  /* Background */
  --bg-primary: #ffffff;
  --bg-secondary: #f8fafc;
  --bg-card: #ffffff;
  
  /* Foreground */
  --fg-primary: #0f172a;
  --fg-secondary: #475569;
  --fg-muted: #94a3b8;
  --fg-accent: #6366f1;
  
  /* Borders */
  --border-default: #e2e8f0;
  --border-focus: #6366f1;
  
  /* Status Colors */
  --status-success: #22c55e;
  --status-warning: #f59e0b;
  --status-error: #ef4444;
  --status-info: #3b82f6;
}

[data-theme="dark"] {
  --bg-primary: #0f172a;
  --bg-secondary: #1e293b;
  --bg-card: #1e293b;
  --fg-primary: #f8fafc;
  --fg-secondary: #cbd5e1;
  --fg-muted: #64748b;
  --border-default: #334155;
}
```

### 5.3 Typography

```css
:root {
  --font-sans: 'IBM Plex Sans Arabic', system-ui, sans-serif;
  
  --text-xs: 0.75rem;
  --text-sm: 0.875rem;
  --text-base: 1rem;
  --text-lg: 1.125rem;
  --text-xl: 1.25rem;
  --text-2xl: 1.5rem;
  
  --heading-1: 2.25rem;
  --heading-2: 1.875rem;
  --heading-3: 1.5rem;
  --heading-4: 1.25rem;
  --heading-5: 1.125rem;
}
```

### 5.4 Spacing

```css
:root {
  --space-1: 0.25rem;
  --space-2: 0.5rem;
  --space-3: 0.75rem;
  --space-4: 1rem;
  --space-5: 1.25rem;
  --space-6: 1.5rem;
  --space-8: 2rem;
  --space-10: 2.5rem;
  --space-12: 3rem;
}
```

### 5.5 استخدام Tokens في المكونات

```tsx
// ✅ صحيح - استخدام tokens
<div className="bg-bg-primary text-fg-primary border-border">
  <h1 className="text-heading-3">عنوان</h1>
  <p className="text-fg-secondary">نص ثانوي</p>
</div>

// ❌ خطأ - CSS مكرر
<div style={{ backgroundColor: '#ffffff', color: '#0f172a' }}>
  ...
</div>
```

---

## 6. هيكل المشروع

```
zid-dashboard/
├── docs/
│   ├── ACCEPTANCE_TESTS.md
│   └── SYSTEM_DOCUMENTATION.md
├── supabase/
│   └── migrations/
│       ├── 001_profiles.sql
│       ├── 002_stores.sql
│       ├── 003_store_public_links.sql
│       ├── 004_task_templates.sql
│       ├── 005_store_tasks.sql
│       ├── 006_announcements.sql
│       ├── 007_meetings.sql
│       ├── 008_notifications.sql
│       ├── 009_store_workflow.sql
│       └── 010_business_logic.sql
├── src/
│   ├── app/
│   │   ├── (admin)/admin/        # Admin pages
│   │   ├── (manager)/manager/    # Manager pages
│   │   ├── public/store/[token]/ # Public merchant page
│   │   ├── book/[slug]/          # Public booking page
│   │   └── api/                  # API routes
│   ├── components/
│   │   ├── layout/               # Header, Sidebar
│   │   ├── notifications/        # NotificationBell
│   │   ├── providers/            # ThemeProvider
│   │   └── ui/                   # UI components
│   ├── lib/
│   │   ├── services/             # Business logic services
│   │   ├── supabase/             # Supabase client + types
│   │   └── permissions/          # Role-based permissions
│   └── styles/
│       ├── tokens.css
│       └── globals.css
└── tailwind.config.ts
```

---

## 7. متطلبات التشغيل

### 7.1 Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx

# Google Calendar (اختياري)
GOOGLE_CLIENT_ID=xxx
GOOGLE_CLIENT_SECRET=xxx
```

### 7.2 تشغيل المشروع

```bash
# تثبيت الحزم
npm install

# تشغيل التطوير
npm run dev

# بناء الإنتاج
npm run build
npm start
```

### 7.3 تشغيل Migrations

```bash
# في Supabase Dashboard أو CLI
supabase db push
```

---

## 8. الإصدار

- **الإصدار**: 1.0.0
- **تاريخ التسليم**: فبراير 2026
- **المطور**: ZID Dashboard Team
