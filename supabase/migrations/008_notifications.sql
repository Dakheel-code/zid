-- ============================================
-- ZID Dashboard - Phase 2.8: Notifications
-- الإشعارات مع Realtime
-- ============================================

-- ============================================
-- ENUM TYPES
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

-- ============================================
-- 2.8.1 NOTIFICATION_EVENT_SETTINGS TABLE
-- إعدادات أحداث الإشعارات (Admin only)
-- ============================================
CREATE TABLE IF NOT EXISTS notification_event_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Event key (unique identifier for the event type)
  event_key TEXT NOT NULL UNIQUE,
  
  -- Display name
  display_name TEXT NOT NULL,
  description TEXT,
  
  -- Settings
  enabled BOOLEAN NOT NULL DEFAULT true,
  priority notification_priority_v2 NOT NULL DEFAULT 'normal',
  
  -- Default templates
  default_title_template TEXT,
  default_body_template TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 2.8.2 NOTIFICATIONS_V2 TABLE
-- الإشعارات
-- ============================================
CREATE TABLE IF NOT EXISTS notifications_v2 (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Recipient
  recipient_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Type & Event
  type notification_type_v2 NOT NULL,
  event_key TEXT NOT NULL,
  
  -- Content
  title TEXT NOT NULL,
  body TEXT,
  link_url TEXT,
  
  -- Additional data
  metadata JSONB DEFAULT '{}',
  
  -- Priority
  priority notification_priority_v2 NOT NULL DEFAULT 'normal',
  
  -- Read status
  is_read BOOLEAN NOT NULL DEFAULT false,
  read_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_notification_event_settings_key ON notification_event_settings(event_key);
CREATE INDEX IF NOT EXISTS idx_notification_event_settings_enabled ON notification_event_settings(enabled) WHERE enabled = true;

CREATE INDEX IF NOT EXISTS idx_notifications_v2_recipient ON notifications_v2(recipient_user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_v2_unread ON notifications_v2(recipient_user_id, is_read) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_notifications_v2_type ON notifications_v2(type);
CREATE INDEX IF NOT EXISTS idx_notifications_v2_event_key ON notifications_v2(event_key);
CREATE INDEX IF NOT EXISTS idx_notifications_v2_created ON notifications_v2(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_v2_priority ON notifications_v2(priority);

-- ============================================
-- TRIGGERS
-- ============================================
DROP TRIGGER IF EXISTS update_notification_event_settings_updated_at ON notification_event_settings;
CREATE TRIGGER update_notification_event_settings_updated_at
  BEFORE UPDATE ON notification_event_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ENABLE RLS
-- ============================================
ALTER TABLE notification_event_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications_v2 ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES - NOTIFICATION_EVENT_SETTINGS
-- ============================================
DROP POLICY IF EXISTS "notification_event_settings_admin_all" ON notification_event_settings;
DROP POLICY IF EXISTS "notification_event_settings_read_all" ON notification_event_settings;

-- Admin: full CRUD
CREATE POLICY "notification_event_settings_admin_all"
  ON notification_event_settings FOR ALL
  USING (is_admin());

-- Everyone can read (to check if notifications are enabled)
CREATE POLICY "notification_event_settings_read_all"
  ON notification_event_settings FOR SELECT
  USING (true);

-- ============================================
-- RLS POLICIES - NOTIFICATIONS_V2
-- ============================================
DROP POLICY IF EXISTS "notifications_v2_user_select" ON notifications_v2;
DROP POLICY IF EXISTS "notifications_v2_user_update" ON notifications_v2;
DROP POLICY IF EXISTS "notifications_v2_user_delete" ON notifications_v2;
DROP POLICY IF EXISTS "notifications_v2_admin_select" ON notifications_v2;

-- User: read their own notifications
CREATE POLICY "notifications_v2_user_select"
  ON notifications_v2 FOR SELECT
  USING (recipient_user_id = auth.uid());

-- User: update their own notifications (mark as read)
CREATE POLICY "notifications_v2_user_update"
  ON notifications_v2 FOR UPDATE
  USING (recipient_user_id = auth.uid())
  WITH CHECK (recipient_user_id = auth.uid());

-- User: delete their own notifications
CREATE POLICY "notifications_v2_user_delete"
  ON notifications_v2 FOR DELETE
  USING (recipient_user_id = auth.uid());

-- Admin: read all notifications (for monitoring)
CREATE POLICY "notifications_v2_admin_select"
  ON notifications_v2 FOR SELECT
  USING (is_admin());

-- ============================================
-- ENABLE REALTIME
-- ============================================
-- Note: Run this in Supabase Dashboard or via SQL
ALTER PUBLICATION supabase_realtime ADD TABLE notifications_v2;

-- ============================================
-- FUNCTIONS
-- ============================================

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
  -- Check if event is enabled
  SELECT * INTO v_settings FROM notification_event_settings WHERE event_key = p_event_key;
  
  IF FOUND AND NOT v_settings.enabled THEN
    -- Event is disabled, don't create notification
    RETURN NULL;
  END IF;
  
  -- Use provided priority or get from settings or default to 'normal'
  v_priority := COALESCE(p_priority, v_settings.priority, 'normal');
  
  -- Create notification
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

-- Function: Mark notification as read
CREATE OR REPLACE FUNCTION mark_notification_read_v2(p_notification_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE notifications_v2
  SET is_read = true, read_at = NOW()
  WHERE id = p_notification_id AND recipient_user_id = auth.uid();
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Mark all notifications as read
CREATE OR REPLACE FUNCTION mark_all_notifications_read_v2()
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE notifications_v2
  SET is_read = true, read_at = NOW()
  WHERE recipient_user_id = auth.uid() AND is_read = false;
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get unread count
CREATE OR REPLACE FUNCTION get_unread_notification_count()
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::INTEGER 
    FROM notifications_v2 
    WHERE recipient_user_id = auth.uid() AND is_read = false
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get notifications with pagination
CREATE OR REPLACE FUNCTION get_notifications(
  p_limit INTEGER DEFAULT 20,
  p_offset INTEGER DEFAULT 0,
  p_unread_only BOOLEAN DEFAULT false
)
RETURNS TABLE (
  notification_id UUID,
  type notification_type_v2,
  event_key TEXT,
  title TEXT,
  body TEXT,
  link_url TEXT,
  metadata JSONB,
  priority notification_priority_v2,
  is_read BOOLEAN,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    n.id AS notification_id,
    n.type,
    n.event_key,
    n.title,
    n.body,
    n.link_url,
    n.metadata,
    n.priority,
    n.is_read,
    n.read_at,
    n.created_at
  FROM notifications_v2 n
  WHERE n.recipient_user_id = auth.uid()
    AND (NOT p_unread_only OR n.is_read = false)
  ORDER BY n.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Delete old notifications (cleanup)
CREATE OR REPLACE FUNCTION cleanup_old_notifications(p_days_old INTEGER DEFAULT 30)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  DELETE FROM notifications_v2
  WHERE created_at < NOW() - (p_days_old || ' days')::INTERVAL
    AND is_read = true;
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- SEED: Default notification event settings
-- ============================================
INSERT INTO notification_event_settings (event_key, display_name, description, priority) VALUES
  -- Task events
  ('task.assigned', 'مهمة جديدة', 'عند إسناد مهمة جديدة', 'normal'),
  ('task.status_changed', 'تغيير حالة المهمة', 'عند تغيير حالة المهمة', 'normal'),
  ('task.overdue', 'مهمة متأخرة', 'عند تأخر المهمة عن موعدها', 'important'),
  ('task.merchant_created', 'مهمة من التاجر', 'عند إنشاء مهمة من التاجر', 'important'),
  
  -- Store events
  ('store.assigned', 'متجر جديد', 'عند إسناد متجر جديد', 'normal'),
  ('store.status_changed', 'تغيير حالة المتجر', 'عند تغيير حالة المتجر', 'normal'),
  
  -- Announcement events
  ('announcement.new', 'تعميم جديد', 'عند نشر تعميم جديد', 'normal'),
  ('announcement.urgent', 'تعميم عاجل', 'عند نشر تعميم عاجل', 'urgent'),
  
  -- Meeting events
  ('meeting.booked', 'اجتماع جديد', 'عند حجز اجتماع جديد', 'important'),
  ('meeting.cancelled', 'إلغاء اجتماع', 'عند إلغاء اجتماع', 'normal'),
  ('meeting.reminder', 'تذكير باجتماع', 'تذكير قبل الاجتماع', 'important')
ON CONFLICT (event_key) DO NOTHING;

-- ============================================
-- ✅ Notifications migration complete!
-- ============================================
