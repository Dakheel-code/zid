# ZID Dashboard - نظام إدارة المتاجر

نظام إدارة متاجر لمدراء العلاقة (Account Managers) مع صفحة تاجر عامة، إدارة قوالب مهام للأدمن، تعاميم، اجتماعات مثل Calendly، إشعارات جرس، وتصميم Theme قابل للتبديل.

## المتطلبات

- Node.js 18+
- npm أو yarn
- حساب Supabase

## التثبيت

```bash
# تثبيت الحزم
npm install

# نسخ ملف البيئة
cp .env.local.example .env.local

# تعديل متغيرات البيئة في .env.local
```

## إعداد Supabase

1. أنشئ مشروع جديد في [Supabase](https://supabase.com)
2. انسخ `SUPABASE_URL` و `SUPABASE_ANON_KEY` من إعدادات المشروع
3. ضعها في ملف `.env.local`
4. نفذ ملف `supabase/schema.sql` في SQL Editor في Supabase

## تشغيل المشروع

```bash
npm run dev
```

افتح [http://localhost:3000](http://localhost:3000)

## هيكل المشروع

```
src/
├── app/
│   ├── (admin)/           # صفحات الأدمن (محمية)
│   │   └── admin/
│   ├── (manager)/         # صفحات مدير العلاقة (محمية)
│   │   └── manager/
│   ├── p/                 # صفحة التاجر العامة
│   │   └── [merchantId]/
│   ├── book/              # صفحة حجز المواعيد العامة
│   │   └── [managerId]/
│   ├── login/             # صفحة تسجيل الدخول
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── components/
│   ├── layout/            # مكونات التخطيط
│   ├── providers/         # Context Providers
│   └── ui/                # Design System Components
├── lib/
│   ├── supabase/          # Supabase client & types
│   ├── permissions/       # نظام الصلاحيات
│   ├── notifications/     # نظام الإشعارات
│   ├── store-detection/   # كشف المتاجر
│   ├── meetings/          # نظام الاجتماعات
│   └── utils.ts
└── middleware.ts          # Role Guard Middleware
```

## الأدوار والصلاحيات

### Admin (الأدمن)
- إدارة جميع المتاجر
- إدارة مدراء العلاقة
- إنشاء قوالب المهام
- إرسال التعاميم
- عرض جميع الاجتماعات

### Manager (مدير العلاقة)
- إدارة المتاجر المسندة إليه
- إدارة المهام الخاصة به
- عرض التعاميم
- إدارة اجتماعاته وأوقات تواجده

## الصفحات العامة

- `/p/[merchantId]` - صفحة التاجر العامة (بدون تسجيل دخول)
- `/book/[managerId]` - صفحة حجز موعد مع مدير العلاقة (بدون تسجيل دخول)

## تبديل الثيم

يدعم النظام 4 ثيمات:
- **Light** - الوضع الفاتح (افتراضي)
- **Dark** - الوضع الداكن
- **Green** - الثيم الأخضر
- **Purple** - الثيم البنفسجي

يمكن تبديل الثيم من الـ Header في أي صفحة.

## المراحل

- [x] **Phase 0** - تجهيز المشروع
- [ ] **Phase 1** - إدارة المتاجر
- [ ] **Phase 2** - إدارة المهام والقوالب
- [ ] **Phase 3** - التعاميم
- [ ] **Phase 4** - الاجتماعات (Calendly-like)
- [ ] **Phase 5** - الإشعارات
- [ ] **Phase 6** - التحسينات النهائية

## التقنيات المستخدمة

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Icons**: Lucide React
