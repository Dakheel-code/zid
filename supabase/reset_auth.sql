-- ============================================
-- إعادة إعداد نظام المصادقة من الصفر
-- شغل هذا في Supabase SQL Editor
-- ============================================

-- 1. حذف جدول profiles القديم
DROP TABLE IF EXISTS profiles CASCADE;

-- 2. إنشاء جدول profiles جديد بسيط
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT DEFAULT '',
  phone TEXT,
  avatar_url TEXT,
  booking_slug TEXT,
  role TEXT DEFAULT 'manager' CHECK (role IN ('admin', 'manager')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. تفعيل RLS مع سياسات بسيطة
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow_read" ON profiles FOR SELECT USING (true);
CREATE POLICY "allow_insert" ON profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "allow_update" ON profiles FOR UPDATE USING (true);

-- 4. إنشاء trigger لإنشاء profile تلقائياً عند تسجيل مستخدم جديد
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, role)
  VALUES (NEW.id, NEW.email, '', 'manager');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. حذف المستخدمين القدامى
DELETE FROM auth.users WHERE email LIKE '%@zid.sa';

-- 6. عرض النتيجة
SELECT 'تم إعادة إعداد نظام المصادقة بنجاح!' as message;
SELECT 'الآن اذهب إلى Authentication > Users واضغط Add user لإنشاء مستخدم جديد' as next_step;
