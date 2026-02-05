-- ============================================
-- ZID Dashboard - Database Schema
-- Phase 2: قاعدة بيانات Supabase
-- ============================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- ENUM TYPES
-- ============================================
CREATE TYPE user_role AS ENUM ('admin', 'manager');
CREATE TYPE merchant_status AS ENUM ('active', 'inactive', 'pending', 'suspended');
CREATE TYPE task_status AS ENUM ('pending', 'in_progress', 'completed', 'cancelled');
CREATE TYPE task_priority AS ENUM ('low', 'medium', 'high', 'urgent');
CREATE TYPE announcement_priority AS ENUM ('low', 'normal', 'high', 'urgent');
CREATE TYPE meeting_status AS ENUM ('scheduled', 'confirmed', 'completed', 'cancelled', 'no_show');
CREATE TYPE notification_type AS ENUM ('info', 'warning', 'success', 'error', 'task', 'meeting', 'announcement');

-- ============================================
-- 2.1 PROFILES TABLE (المستخدمين والأدوار)
-- ============================================
CREATE TABLE profiles (
  -- Primary key = Auth user ID
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Basic info
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL DEFAULT '',
  phone TEXT,
  avatar_url TEXT,
  
  -- Role
  role user_role NOT NULL DEFAULT 'manager',
  
  -- Public booking page slug (like Calendly)
  booking_slug TEXT UNIQUE,
  
  -- Settings (JSON for flexibility)
  settings JSONB DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_booking_slug CHECK (
    booking_slug IS NULL OR 
    (booking_slug ~ '^[a-z0-9][a-z0-9-]*[a-z0-9]$' AND length(booking_slug) >= 3 AND length(booking_slug) <= 50)
  ),
  CONSTRAINT valid_phone CHECK (
    phone IS NULL OR phone ~ '^\+?[0-9]{9,15}$'
  )
);

-- Index for booking_slug lookups (public booking pages)
CREATE INDEX idx_profiles_booking_slug ON profiles(booking_slug) WHERE booking_slug IS NOT NULL;
CREATE INDEX idx_profiles_role ON profiles(role);

-- ============================================
-- LEGACY: Keep 'users' as view for backward compatibility
-- ============================================
CREATE VIEW users AS SELECT * FROM profiles;

-- ============================================
-- 2.2 MERCHANTS TABLE (المتاجر)
-- ============================================
CREATE TABLE merchants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Store info
  store_name TEXT NOT NULL,
  store_url TEXT,
  store_id TEXT, -- Zid store ID if applicable
  
  -- Owner info
  owner_name TEXT,
  owner_email TEXT,
  owner_phone TEXT,
  
  -- Assignment
  manager_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  
  -- Status
  status merchant_status NOT NULL DEFAULT 'pending',
  
  -- Additional info
  notes TEXT,
  metadata JSONB DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 2.2 TASK TEMPLATES TABLE (قوالب المهام)
-- ============================================
CREATE TABLE task_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  priority task_priority NOT NULL DEFAULT 'medium',
  estimated_duration_minutes INTEGER,
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 2.2 TASKS TABLE (المهام)
-- ============================================
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Template reference (optional)
  template_id UUID REFERENCES task_templates(id) ON DELETE SET NULL,
  
  -- Relations
  merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
  assigned_to UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  
  -- Task details
  title TEXT NOT NULL,
  description TEXT,
  status task_status NOT NULL DEFAULT 'pending',
  priority task_priority NOT NULL DEFAULT 'medium',
  
  -- Dates
  due_date TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  
  -- Additional
  notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 2.2 ANNOUNCEMENTS TABLE (التعاميم)
-- ============================================
CREATE TABLE announcements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  priority announcement_priority NOT NULL DEFAULT 'normal',
  target_roles user_role[] NOT NULL DEFAULT '{manager}',
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  published_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  is_pinned BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 2.3 MEETINGS TABLE (الاجتماعات)
-- ============================================
CREATE TABLE meetings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Relations
  manager_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  merchant_id UUID REFERENCES merchants(id) ON DELETE SET NULL,
  
  -- Meeting details
  title TEXT NOT NULL,
  description TEXT,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  
  -- Meeting link/location
  meeting_url TEXT,
  location TEXT,
  
  -- Status
  status meeting_status NOT NULL DEFAULT 'scheduled',
  
  -- Booking info (for public bookings)
  booked_by_name TEXT,
  booked_by_email TEXT,
  booked_by_phone TEXT,
  
  -- Notes
  notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 2.3 MEETING SLOTS TABLE (أوقات الحجز المتاحة)
-- ============================================
CREATE TABLE meeting_slots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  manager_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Day and time
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  
  -- Availability
  is_available BOOLEAN NOT NULL DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(manager_id, day_of_week, start_time),
  CONSTRAINT valid_time_range CHECK (start_time < end_time)
);

-- ============================================
-- 2.3 NOTIFICATIONS TABLE (الإشعارات)
-- ============================================
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Notification content
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type notification_type NOT NULL DEFAULT 'info',
  
  -- Status
  is_read BOOLEAN NOT NULL DEFAULT false,
  read_at TIMESTAMPTZ,
  
  -- Action link
  link TEXT,
  
  -- Reference to related entity
  reference_type TEXT, -- 'task', 'meeting', 'announcement', etc.
  reference_id UUID,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 2.4 INDEXES (فهارس لتحسين الأداء)
-- ============================================

-- Merchants indexes
CREATE INDEX idx_merchants_manager_id ON merchants(manager_id);
CREATE INDEX idx_merchants_status ON merchants(status);
CREATE INDEX idx_merchants_store_url ON merchants(store_url) WHERE store_url IS NOT NULL;

-- Tasks indexes
CREATE INDEX idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX idx_tasks_merchant_id ON tasks(merchant_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_due_date ON tasks(due_date) WHERE due_date IS NOT NULL;
CREATE INDEX idx_tasks_created_by ON tasks(created_by) WHERE created_by IS NOT NULL;

-- Meetings indexes
CREATE INDEX idx_meetings_manager_id ON meetings(manager_id);
CREATE INDEX idx_meetings_start_time ON meetings(start_time);
CREATE INDEX idx_meetings_status ON meetings(status);
CREATE INDEX idx_meetings_merchant_id ON meetings(merchant_id) WHERE merchant_id IS NOT NULL;

-- Notifications indexes
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(user_id, is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);

-- Announcements indexes
CREATE INDEX idx_announcements_published_at ON announcements(published_at) WHERE published_at IS NOT NULL;
CREATE INDEX idx_announcements_is_pinned ON announcements(is_pinned) WHERE is_pinned = true;

-- Meeting slots indexes
CREATE INDEX idx_meeting_slots_manager_id ON meeting_slots(manager_id);
CREATE INDEX idx_meeting_slots_available ON meeting_slots(manager_id, is_available) WHERE is_available = true;

-- ============================================
-- TRIGGERS (المشغلات)
-- ============================================

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers to all tables
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_merchants_updated_at
  BEFORE UPDATE ON merchants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_task_templates_updated_at
  BEFORE UPDATE ON task_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_announcements_updated_at
  BEFORE UPDATE ON announcements
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_meetings_updated_at
  BEFORE UPDATE ON meetings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE merchants ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- ============================================
-- HELPER FUNCTIONS FOR RLS
-- ============================================

-- Function to check if current user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Function to get current user's role
CREATE OR REPLACE FUNCTION get_my_role()
RETURNS user_role AS $$
BEGIN
  RETURN (SELECT role FROM profiles WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================
-- 2.1 PROFILES RLS POLICIES
-- ============================================

-- المستخدم يرى بروفايله فقط
CREATE POLICY "profiles_select_own"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- الأدمن يرى الجميع
CREATE POLICY "profiles_select_admin"
  ON profiles FOR SELECT
  USING (is_admin());

-- المستخدم يعدل بروفايله فقط
CREATE POLICY "profiles_update_own"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- الأدمن يعدل الجميع
CREATE POLICY "profiles_update_admin"
  ON profiles FOR UPDATE
  USING (is_admin());

-- الأدمن فقط يحذف
CREATE POLICY "profiles_delete_admin"
  ON profiles FOR DELETE
  USING (is_admin());

-- ============================================
-- MERCHANTS RLS POLICIES
-- ============================================

-- الأدمن يدير جميع المتاجر
CREATE POLICY "merchants_all_admin"
  ON merchants FOR ALL
  USING (is_admin());

-- المدير يرى متاجره فقط
CREATE POLICY "merchants_select_manager"
  ON merchants FOR SELECT
  USING (manager_id = auth.uid());

-- المدير يعدل متاجره فقط
CREATE POLICY "merchants_update_manager"
  ON merchants FOR UPDATE
  USING (manager_id = auth.uid())
  WITH CHECK (manager_id = auth.uid());

-- ============================================
-- TASK TEMPLATES RLS POLICIES
-- ============================================

-- الأدمن يدير قوالب المهام
CREATE POLICY "task_templates_all_admin"
  ON task_templates FOR ALL
  USING (is_admin());

-- الجميع يرى القوالب النشطة
CREATE POLICY "task_templates_select_all"
  ON task_templates FOR SELECT
  USING (is_active = true);

-- ============================================
-- TASKS RLS POLICIES
-- ============================================

-- الأدمن يدير جميع المهام
CREATE POLICY "tasks_all_admin"
  ON tasks FOR ALL
  USING (is_admin());

-- المدير يرى مهامه
CREATE POLICY "tasks_select_manager"
  ON tasks FOR SELECT
  USING (assigned_to = auth.uid());

-- المدير يعدل مهامه
CREATE POLICY "tasks_update_manager"
  ON tasks FOR UPDATE
  USING (assigned_to = auth.uid());

-- ============================================
-- ANNOUNCEMENTS RLS POLICIES
-- ============================================

-- الأدمن يدير التعاميم
CREATE POLICY "announcements_all_admin"
  ON announcements FOR ALL
  USING (is_admin());

-- المستخدمون يرون التعاميم المنشورة لدورهم
CREATE POLICY "announcements_select_published"
  ON announcements FOR SELECT
  USING (
    published_at IS NOT NULL 
    AND published_at <= NOW()
    AND (expires_at IS NULL OR expires_at > NOW())
    AND get_my_role() = ANY(target_roles)
  );

-- ============================================
-- MEETINGS RLS POLICIES
-- ============================================

-- الأدمن يدير جميع الاجتماعات
CREATE POLICY "meetings_all_admin"
  ON meetings FOR ALL
  USING (is_admin());

-- المدير يدير اجتماعاته
CREATE POLICY "meetings_all_manager"
  ON meetings FOR ALL
  USING (manager_id = auth.uid());

-- ============================================
-- MEETING SLOTS RLS POLICIES
-- ============================================

-- المدير يدير أوقاته
CREATE POLICY "meeting_slots_all_manager"
  ON meeting_slots FOR ALL
  USING (manager_id = auth.uid());

-- الجميع يرى الأوقات المتاحة (للحجز العام)
CREATE POLICY "meeting_slots_select_available"
  ON meeting_slots FOR SELECT
  USING (is_available = true);

-- ============================================
-- NOTIFICATIONS RLS POLICIES
-- ============================================

-- المستخدم يرى إشعاراته فقط
CREATE POLICY "notifications_select_own"
  ON notifications FOR SELECT
  USING (user_id = auth.uid());

-- المستخدم يعدل إشعاراته (للقراءة)
CREATE POLICY "notifications_update_own"
  ON notifications FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- المستخدم يحذف إشعاراته
CREATE POLICY "notifications_delete_own"
  ON notifications FOR DELETE
  USING (user_id = auth.uid());

-- ============================================
-- AUTH TRIGGER: إنشاء بروفايل عند التسجيل
-- ============================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, role, booking_slug)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'manager'),
    -- Generate unique booking slug from email
    LOWER(REGEXP_REPLACE(SPLIT_PART(NEW.email, '@', 1), '[^a-z0-9]', '-', 'g'))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================
-- UTILITY FUNCTIONS
-- ============================================

-- Function to generate unique booking slug
CREATE OR REPLACE FUNCTION generate_booking_slug(base_slug TEXT)
RETURNS TEXT AS $$
DECLARE
  new_slug TEXT;
  counter INTEGER := 0;
BEGIN
  new_slug := LOWER(REGEXP_REPLACE(base_slug, '[^a-z0-9]', '-', 'g'));
  
  -- Ensure minimum length
  IF LENGTH(new_slug) < 3 THEN
    new_slug := new_slug || '-user';
  END IF;
  
  -- Check for uniqueness and add counter if needed
  WHILE EXISTS (SELECT 1 FROM profiles WHERE booking_slug = new_slug) LOOP
    counter := counter + 1;
    new_slug := LOWER(REGEXP_REPLACE(base_slug, '[^a-z0-9]', '-', 'g')) || '-' || counter;
  END LOOP;
  
  RETURN new_slug;
END;
$$ LANGUAGE plpgsql;

-- Function to mark notification as read
CREATE OR REPLACE FUNCTION mark_notification_read(notification_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE notifications 
  SET is_read = true, read_at = NOW()
  WHERE id = notification_id AND user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark all notifications as read
CREATE OR REPLACE FUNCTION mark_all_notifications_read()
RETURNS VOID AS $$
BEGIN
  UPDATE notifications 
  SET is_read = true, read_at = NOW()
  WHERE user_id = auth.uid() AND is_read = false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
