-- ============================================
-- ZID Dashboard - ALL MIGRATIONS COMBINED
-- شغل هذا الملف في Supabase SQL Editor
-- ============================================

-- ============================================
-- 0. PREREQUISITES - Helper Functions
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Helper function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Helper function to update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 1. PROFILES TABLE (if not exists)
-- ============================================
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('admin', 'manager');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT NOT NULL DEFAULT '',
  phone TEXT,
  avatar_url TEXT,
  role user_role NOT NULL DEFAULT 'manager',
  booking_slug TEXT UNIQUE,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- RLS for profiles
DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
CREATE POLICY "profiles_select_own" ON profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE USING (id = auth.uid());

-- ============================================
-- 2. STORES TABLE
-- ============================================
DO $$ BEGIN
  CREATE TYPE store_priority AS ENUM ('high', 'medium', 'low');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE store_status AS ENUM ('new', 'active', 'paused', 'ended');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS stores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_url TEXT NOT NULL UNIQUE,
  store_name TEXT,
  store_logo_url TEXT,
  owner_name TEXT,
  owner_email TEXT,
  owner_phone TEXT,
  priority store_priority NOT NULL DEFAULT 'medium',
  status store_status NOT NULL DEFAULT 'new',
  ended_at TIMESTAMPTZ,
  public_access_expires_at TIMESTAMPTZ,
  assigned_manager_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_by_admin_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  notes TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stores_assigned_manager_id ON stores(assigned_manager_id);
CREATE INDEX IF NOT EXISTS idx_stores_status ON stores(status);
CREATE INDEX IF NOT EXISTS idx_stores_priority ON stores(priority);

ALTER TABLE stores ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "stores_select_all" ON stores;
CREATE POLICY "stores_select_all" ON stores FOR SELECT USING (true);

DROP POLICY IF EXISTS "stores_insert_admin" ON stores;
CREATE POLICY "stores_insert_admin" ON stores FOR INSERT WITH CHECK (is_admin());

DROP POLICY IF EXISTS "stores_update_all" ON stores;
CREATE POLICY "stores_update_all" ON stores FOR UPDATE USING (is_admin() OR assigned_manager_id = auth.uid());

DROP POLICY IF EXISTS "stores_delete_admin" ON stores;
CREATE POLICY "stores_delete_admin" ON stores FOR DELETE USING (is_admin());

-- Trigger for store status change
CREATE OR REPLACE FUNCTION handle_store_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'ended' AND (OLD.status IS NULL OR OLD.status != 'ended') THEN
    NEW.ended_at := NOW();
    NEW.public_access_expires_at := NOW() + INTERVAL '30 days';
  END IF;
  IF NEW.status IN ('active', 'new', 'paused') AND OLD.status = 'ended' THEN
    NEW.ended_at := NULL;
    NEW.public_access_expires_at := NULL;
  END IF;
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_store_status_change ON stores;
CREATE TRIGGER on_store_status_change
  BEFORE UPDATE ON stores
  FOR EACH ROW
  EXECUTE FUNCTION handle_store_status_change();

-- ============================================
-- 3. STORE PUBLIC LINKS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS store_public_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  public_token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  is_revoked BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  revoked_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_store_public_links_store_id ON store_public_links(store_id);
CREATE INDEX IF NOT EXISTS idx_store_public_links_token ON store_public_links(public_token);

ALTER TABLE store_public_links ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "store_public_links_select_all" ON store_public_links;
CREATE POLICY "store_public_links_select_all" ON store_public_links FOR SELECT USING (true);

DROP POLICY IF EXISTS "store_public_links_insert" ON store_public_links;
CREATE POLICY "store_public_links_insert" ON store_public_links FOR INSERT WITH CHECK (true);

-- ============================================
-- 4. TASK TEMPLATES
-- ============================================
CREATE TABLE IF NOT EXISTS task_sections_template (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  whatsapp_template TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tasks_template (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  section_id UUID NOT NULL REFERENCES task_sections_template(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  whatsapp_template TEXT,
  visible_to_merchant BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE task_sections_template ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks_template ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "task_sections_template_select_all" ON task_sections_template;
CREATE POLICY "task_sections_template_select_all" ON task_sections_template FOR SELECT USING (true);

DROP POLICY IF EXISTS "tasks_template_select_all" ON tasks_template;
CREATE POLICY "tasks_template_select_all" ON tasks_template FOR SELECT USING (true);

-- ============================================
-- 5. STORE TASKS
-- ============================================
DO $$ BEGIN
  CREATE TYPE store_task_type AS ENUM ('template', 'manual');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE store_task_status AS ENUM ('new', 'in_progress', 'blocked', 'done');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE task_creator_role AS ENUM ('admin', 'manager', 'merchant');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS store_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  template_task_id UUID REFERENCES tasks_template(id) ON DELETE SET NULL,
  template_section_id UUID REFERENCES task_sections_template(id) ON DELETE SET NULL,
  type store_task_type NOT NULL DEFAULT 'manual',
  title TEXT NOT NULL,
  description TEXT,
  status store_task_status NOT NULL DEFAULT 'new',
  due_date TIMESTAMPTZ,
  created_by_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_by_role task_creator_role NOT NULL DEFAULT 'manager',
  merchant_name TEXT,
  merchant_contact TEXT,
  visible_to_merchant BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_store_tasks_store_id ON store_tasks(store_id);
CREATE INDEX IF NOT EXISTS idx_store_tasks_status ON store_tasks(status);

ALTER TABLE store_tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "store_tasks_select_all" ON store_tasks;
CREATE POLICY "store_tasks_select_all" ON store_tasks FOR SELECT USING (true);

DROP POLICY IF EXISTS "store_tasks_insert" ON store_tasks;
CREATE POLICY "store_tasks_insert" ON store_tasks FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "store_tasks_update" ON store_tasks;
CREATE POLICY "store_tasks_update" ON store_tasks FOR UPDATE USING (true);

-- ============================================
-- 6. ANNOUNCEMENTS
-- ============================================
DO $$ BEGIN
  CREATE TYPE announcement_type AS ENUM ('normal', 'urgent_popup');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE announcement_priority_level AS ENUM ('normal', 'high');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE announcement_status AS ENUM ('draft', 'scheduled', 'sent');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE announcement_target_type AS ENUM ('all', 'specific');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS announcements_v2 (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  type announcement_type NOT NULL DEFAULT 'normal',
  priority announcement_priority_level NOT NULL DEFAULT 'normal',
  status announcement_status NOT NULL DEFAULT 'draft',
  send_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  created_by_admin_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS announcement_targets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  announcement_id UUID NOT NULL REFERENCES announcements_v2(id) ON DELETE CASCADE,
  target_type announcement_target_type NOT NULL DEFAULT 'all',
  manager_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS announcement_reads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  announcement_id UUID NOT NULL REFERENCES announcements_v2(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  read_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  popup_dismissed_at TIMESTAMPTZ,
  UNIQUE(announcement_id, user_id)
);

ALTER TABLE announcements_v2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcement_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcement_reads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "announcements_v2_select_all" ON announcements_v2;
CREATE POLICY "announcements_v2_select_all" ON announcements_v2 FOR SELECT USING (true);

DROP POLICY IF EXISTS "announcement_targets_select_all" ON announcement_targets;
CREATE POLICY "announcement_targets_select_all" ON announcement_targets FOR SELECT USING (true);

DROP POLICY IF EXISTS "announcement_reads_select_all" ON announcement_reads;
CREATE POLICY "announcement_reads_select_all" ON announcement_reads FOR SELECT USING (true);

-- ============================================
-- 7. MEETINGS
-- ============================================
DO $$ BEGIN
  CREATE TYPE meeting_booking_status AS ENUM ('booked', 'cancelled');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS meeting_settings (
  manager_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  meeting_title TEXT NOT NULL DEFAULT 'اجتماع',
  duration_minutes INTEGER NOT NULL DEFAULT 30,
  buffer_minutes INTEGER NOT NULL DEFAULT 0,
  min_lead_time_hours INTEGER NOT NULL DEFAULT 24,
  timezone TEXT NOT NULL DEFAULT 'Asia/Riyadh',
  max_bookings_per_day INTEGER,
  booking_window_days INTEGER DEFAULT 30,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS availability_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  manager_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS time_off (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  manager_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  start_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS meetings_v2 (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  manager_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  start_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ NOT NULL,
  guest_name TEXT NOT NULL,
  guest_email TEXT NOT NULL,
  guest_phone TEXT,
  guest_notes TEXT,
  status meeting_booking_status NOT NULL DEFAULT 'booked',
  google_calendar_event_id TEXT,
  cancelled_at TIMESTAMPTZ,
  cancellation_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE meeting_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_off ENABLE ROW LEVEL SECURITY;
ALTER TABLE meetings_v2 ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "meeting_settings_select_all" ON meeting_settings;
CREATE POLICY "meeting_settings_select_all" ON meeting_settings FOR SELECT USING (true);

DROP POLICY IF EXISTS "availability_rules_select_all" ON availability_rules;
CREATE POLICY "availability_rules_select_all" ON availability_rules FOR SELECT USING (true);

DROP POLICY IF EXISTS "time_off_select_all" ON time_off;
CREATE POLICY "time_off_select_all" ON time_off FOR SELECT USING (true);

DROP POLICY IF EXISTS "meetings_v2_select_all" ON meetings_v2;
CREATE POLICY "meetings_v2_select_all" ON meetings_v2 FOR SELECT USING (true);

DROP POLICY IF EXISTS "meetings_v2_insert" ON meetings_v2;
CREATE POLICY "meetings_v2_insert" ON meetings_v2 FOR INSERT WITH CHECK (true);

-- ============================================
-- 8. NOTIFICATIONS
-- ============================================
DO $$ BEGIN
  CREATE TYPE notification_type_v2 AS ENUM ('task', 'store', 'announcement', 'meeting');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE notification_priority_v2 AS ENUM ('normal', 'important', 'urgent');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS notification_event_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_key TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  description TEXT,
  enabled BOOLEAN NOT NULL DEFAULT true,
  priority notification_priority_v2 NOT NULL DEFAULT 'normal',
  default_title_template TEXT,
  default_body_template TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notifications_v2 (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipient_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type notification_type_v2 NOT NULL,
  event_key TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  link_url TEXT,
  metadata JSONB DEFAULT '{}',
  priority notification_priority_v2 NOT NULL DEFAULT 'normal',
  is_read BOOLEAN NOT NULL DEFAULT false,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_v2_recipient ON notifications_v2(recipient_user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_v2_unread ON notifications_v2(recipient_user_id, is_read) WHERE is_read = false;

ALTER TABLE notification_event_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications_v2 ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notification_event_settings_select_all" ON notification_event_settings;
CREATE POLICY "notification_event_settings_select_all" ON notification_event_settings FOR SELECT USING (true);

DROP POLICY IF EXISTS "notifications_v2_select_own" ON notifications_v2;
CREATE POLICY "notifications_v2_select_own" ON notifications_v2 FOR SELECT USING (recipient_user_id = auth.uid() OR is_admin());

DROP POLICY IF EXISTS "notifications_v2_update_own" ON notifications_v2;
CREATE POLICY "notifications_v2_update_own" ON notifications_v2 FOR UPDATE USING (recipient_user_id = auth.uid());

-- Seed notification event settings
INSERT INTO notification_event_settings (event_key, display_name, description, priority) VALUES
  ('task.assigned', 'مهمة جديدة', 'عند إسناد مهمة جديدة', 'normal'),
  ('task.status_changed', 'تغيير حالة المهمة', 'عند تغيير حالة المهمة', 'normal'),
  ('task.overdue', 'مهمة متأخرة', 'عند تأخر المهمة عن موعدها', 'important'),
  ('task.merchant_created', 'مهمة من التاجر', 'عند إنشاء مهمة من التاجر', 'important'),
  ('store.assigned', 'متجر جديد', 'عند إسناد متجر جديد', 'normal'),
  ('store.status_changed', 'تغيير حالة المتجر', 'عند تغيير حالة المتجر', 'normal'),
  ('announcement.new', 'تعميم جديد', 'عند نشر تعميم جديد', 'normal'),
  ('announcement.urgent', 'تعميم عاجل', 'عند نشر تعميم عاجل', 'urgent'),
  ('meeting.booked', 'اجتماع جديد', 'عند حجز اجتماع جديد', 'important'),
  ('meeting.cancelled', 'إلغاء اجتماع', 'عند إلغاء اجتماع', 'normal'),
  ('meeting.reminder', 'تذكير باجتماع', 'تذكير قبل الاجتماع', 'important')
ON CONFLICT (event_key) DO NOTHING;

-- ============================================
-- 9. SEED DEFAULT TASK TEMPLATES
-- ============================================
INSERT INTO task_sections_template (id, title, sort_order) VALUES
  ('11111111-1111-1111-1111-111111111111', 'إعداد المتجر', 1),
  ('22222222-2222-2222-2222-222222222222', 'المنتجات', 2),
  ('33333333-3333-3333-3333-333333333333', 'التسويق', 3)
ON CONFLICT (id) DO NOTHING;

INSERT INTO tasks_template (section_id, title, description, sort_order, visible_to_merchant) VALUES
  ('11111111-1111-1111-1111-111111111111', 'مراجعة إعدادات المتجر', 'التأكد من إعدادات المتجر الأساسية', 1, true),
  ('11111111-1111-1111-1111-111111111111', 'إضافة طرق الدفع', NULL, 2, true),
  ('11111111-1111-1111-1111-111111111111', 'إعداد الشحن', NULL, 3, true),
  ('22222222-2222-2222-2222-222222222222', 'مراجعة المنتجات', NULL, 1, true),
  ('22222222-2222-2222-2222-222222222222', 'تحسين صور المنتجات', NULL, 2, false),
  ('33333333-3333-3333-3333-333333333333', 'إعداد Google Analytics', NULL, 1, true),
  ('33333333-3333-3333-3333-333333333333', 'ربط وسائل التواصل', NULL, 2, true)
ON CONFLICT DO NOTHING;

-- ============================================
-- 10. HELPER FUNCTIONS
-- ============================================

-- Function: Validate public access
CREATE OR REPLACE FUNCTION validate_public_access(p_token TEXT)
RETURNS TABLE (
  store_id UUID,
  store_name TEXT,
  store_url TEXT,
  store_logo_url TEXT,
  owner_name TEXT,
  is_valid BOOLEAN,
  reason TEXT
) AS $$
DECLARE
  v_link store_public_links%ROWTYPE;
  v_store stores%ROWTYPE;
BEGIN
  SELECT * INTO v_link FROM store_public_links WHERE public_token = p_token;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT NULL::UUID, NULL::TEXT, NULL::TEXT, NULL::TEXT, NULL::TEXT, false, 'Invalid token'::TEXT;
    RETURN;
  END IF;
  
  IF v_link.is_revoked THEN
    RETURN QUERY SELECT NULL::UUID, NULL::TEXT, NULL::TEXT, NULL::TEXT, NULL::TEXT, false, 'Link has been revoked'::TEXT;
    RETURN;
  END IF;
  
  SELECT * INTO v_store FROM stores WHERE id = v_link.store_id;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT NULL::UUID, NULL::TEXT, NULL::TEXT, NULL::TEXT, NULL::TEXT, false, 'Store not found'::TEXT;
    RETURN;
  END IF;
  
  IF v_store.status = 'ended' THEN
    IF v_store.public_access_expires_at IS NULL OR NOW() > v_store.public_access_expires_at THEN
      RETURN QUERY SELECT NULL::UUID, NULL::TEXT, NULL::TEXT, NULL::TEXT, NULL::TEXT, false, 'Store access has expired'::TEXT;
      RETURN;
    END IF;
  END IF;
  
  RETURN QUERY SELECT v_store.id, v_store.store_name, v_store.store_url, v_store.store_logo_url, v_store.owner_name, true, 'Access granted'::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Create notification
CREATE OR REPLACE FUNCTION create_notification(
  p_recipient_user_id UUID,
  p_type notification_type_v2,
  p_event_key TEXT,
  p_title TEXT,
  p_body TEXT DEFAULT NULL,
  p_link_url TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}',
  p_priority notification_priority_v2 DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_notification_id UUID;
  v_settings notification_event_settings%ROWTYPE;
  v_priority notification_priority_v2;
BEGIN
  SELECT * INTO v_settings FROM notification_event_settings WHERE event_key = p_event_key;
  
  IF FOUND AND NOT v_settings.enabled THEN
    RETURN NULL;
  END IF;
  
  v_priority := COALESCE(p_priority, v_settings.priority, 'normal');
  
  INSERT INTO notifications_v2 (
    recipient_user_id, type, event_key,
    title, body, link_url, metadata, priority
  ) VALUES (
    p_recipient_user_id, p_type, p_event_key,
    p_title, p_body, p_link_url, p_metadata, v_priority
  )
  RETURNING id INTO v_notification_id;
  
  RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- ✅ ALL MIGRATIONS COMPLETE!
-- ============================================
