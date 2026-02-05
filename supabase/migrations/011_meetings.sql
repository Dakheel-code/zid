-- ============================================
-- ZID Dashboard - Meetings Table
-- جدول الاجتماعات
-- ============================================

-- إنشاء نوع حالة الاجتماع
DO $$ BEGIN
  CREATE TYPE meeting_status AS ENUM ('scheduled', 'completed', 'cancelled', 'no_show');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- إنشاء جدول الاجتماعات
CREATE TABLE IF NOT EXISTS meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- المدير المسؤول
  manager_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- المتجر (اختياري - يُربط تلقائياً إذا وُجد)
  store_id UUID REFERENCES stores(id) ON DELETE SET NULL,
  
  -- بيانات الضيف
  guest_name TEXT NOT NULL,
  guest_email TEXT NOT NULL,
  guest_phone TEXT,
  store_url TEXT,
  
  -- تفاصيل الاجتماع
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 30,
  status meeting_status NOT NULL DEFAULT 'scheduled',
  
  -- ملاحظات
  notes TEXT,
  meeting_link TEXT,
  
  -- مصدر الحجز
  source TEXT DEFAULT 'booking_page',
  
  -- التواريخ
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ
);

-- فهارس للبحث السريع
CREATE INDEX IF NOT EXISTS idx_meetings_manager_id ON meetings(manager_id);
CREATE INDEX IF NOT EXISTS idx_meetings_store_id ON meetings(store_id);
CREATE INDEX IF NOT EXISTS idx_meetings_scheduled_at ON meetings(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_meetings_status ON meetings(status);
CREATE INDEX IF NOT EXISTS idx_meetings_guest_email ON meetings(guest_email);

-- تفعيل RLS
ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;

-- سياسات RLS
-- المدراء يمكنهم رؤية اجتماعاتهم فقط
CREATE POLICY "managers_view_own_meetings" ON meetings
  FOR SELECT
  USING (manager_id = auth.uid() OR is_admin());

-- المدراء يمكنهم تحديث اجتماعاتهم
CREATE POLICY "managers_update_own_meetings" ON meetings
  FOR UPDATE
  USING (manager_id = auth.uid() OR is_admin());

-- السماح بإنشاء اجتماعات من صفحة الحجز العامة
CREATE POLICY "public_create_meetings" ON meetings
  FOR INSERT
  WITH CHECK (true);

-- Trigger لتحديث updated_at
CREATE OR REPLACE FUNCTION update_meetings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_meetings_updated_at ON meetings;
CREATE TRIGGER trigger_meetings_updated_at
  BEFORE UPDATE ON meetings
  FOR EACH ROW
  EXECUTE FUNCTION update_meetings_updated_at();

-- ============================================
-- ✅ Meetings table created!
-- ============================================
