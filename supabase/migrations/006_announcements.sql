-- ============================================
-- ZID Dashboard - Phase 2.6: Announcements
-- التعاميم
-- ============================================

-- ============================================
-- ENUM TYPES
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

-- ============================================
-- 2.6.1 ANNOUNCEMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS announcements_v2 (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Content
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  
  -- Type & Priority
  type announcement_type NOT NULL DEFAULT 'normal',
  priority announcement_priority_level NOT NULL DEFAULT 'normal',
  
  -- Status
  status announcement_status NOT NULL DEFAULT 'draft',
  
  -- Scheduling
  send_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  
  -- Creator
  created_by_admin_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 2.6.2 ANNOUNCEMENT_TARGETS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS announcement_targets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Announcement reference
  announcement_id UUID NOT NULL REFERENCES announcements_v2(id) ON DELETE CASCADE,
  
  -- Target type
  target_type announcement_target_type NOT NULL DEFAULT 'all',
  
  -- Specific manager (if target_type = 'specific')
  manager_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_target CHECK (
    (target_type = 'all' AND manager_id IS NULL) OR
    (target_type = 'specific' AND manager_id IS NOT NULL)
  ),
  
  -- Unique constraint for specific targets
  UNIQUE(announcement_id, manager_id)
);

-- ============================================
-- 2.6.3 ANNOUNCEMENT_READS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS announcement_reads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- References
  announcement_id UUID NOT NULL REFERENCES announcements_v2(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Read status
  read_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Popup dismissed (for urgent_popup type)
  popup_dismissed_at TIMESTAMPTZ,
  
  -- Unique constraint
  UNIQUE(announcement_id, user_id)
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_announcements_v2_status ON announcements_v2(status);
CREATE INDEX IF NOT EXISTS idx_announcements_v2_type ON announcements_v2(type);
CREATE INDEX IF NOT EXISTS idx_announcements_v2_send_at ON announcements_v2(send_at) WHERE send_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_announcements_v2_created_by ON announcements_v2(created_by_admin_id);

CREATE INDEX IF NOT EXISTS idx_announcement_targets_announcement ON announcement_targets(announcement_id);
CREATE INDEX IF NOT EXISTS idx_announcement_targets_manager ON announcement_targets(manager_id) WHERE manager_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_announcement_reads_announcement ON announcement_reads(announcement_id);
CREATE INDEX IF NOT EXISTS idx_announcement_reads_user ON announcement_reads(user_id);

-- ============================================
-- TRIGGERS
-- ============================================
DROP TRIGGER IF EXISTS update_announcements_v2_updated_at ON announcements_v2;
CREATE TRIGGER update_announcements_v2_updated_at
  BEFORE UPDATE ON announcements_v2
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ENABLE RLS
-- ============================================
ALTER TABLE announcements_v2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcement_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcement_reads ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES - ANNOUNCEMENTS_V2
-- ============================================
DROP POLICY IF EXISTS "announcements_v2_admin_all" ON announcements_v2;
DROP POLICY IF EXISTS "announcements_v2_manager_select" ON announcements_v2;

-- Admin: full CRUD
CREATE POLICY "announcements_v2_admin_all"
  ON announcements_v2 FOR ALL
  USING (is_admin());

-- Manager: read only announcements targeted to them (sent status)
CREATE POLICY "announcements_v2_manager_select"
  ON announcements_v2 FOR SELECT
  USING (
    status = 'sent' AND
    (
      -- All managers targeted
      EXISTS (
        SELECT 1 FROM announcement_targets 
        WHERE announcement_id = announcements_v2.id 
        AND target_type = 'all'
      )
      OR
      -- Specifically targeted
      EXISTS (
        SELECT 1 FROM announcement_targets 
        WHERE announcement_id = announcements_v2.id 
        AND target_type = 'specific'
        AND manager_id = auth.uid()
      )
    )
  );

-- ============================================
-- RLS POLICIES - ANNOUNCEMENT_TARGETS
-- ============================================
DROP POLICY IF EXISTS "announcement_targets_admin_all" ON announcement_targets;
DROP POLICY IF EXISTS "announcement_targets_manager_select" ON announcement_targets;

-- Admin: full CRUD
CREATE POLICY "announcement_targets_admin_all"
  ON announcement_targets FOR ALL
  USING (is_admin());

-- Manager: read only their targets
CREATE POLICY "announcement_targets_manager_select"
  ON announcement_targets FOR SELECT
  USING (
    target_type = 'all' OR manager_id = auth.uid()
  );

-- ============================================
-- RLS POLICIES - ANNOUNCEMENT_READS
-- ============================================
DROP POLICY IF EXISTS "announcement_reads_admin_all" ON announcement_reads;
DROP POLICY IF EXISTS "announcement_reads_user_select" ON announcement_reads;
DROP POLICY IF EXISTS "announcement_reads_user_insert" ON announcement_reads;
DROP POLICY IF EXISTS "announcement_reads_user_update" ON announcement_reads;

-- Admin: full access
CREATE POLICY "announcement_reads_admin_all"
  ON announcement_reads FOR ALL
  USING (is_admin());

-- User: read their own reads
CREATE POLICY "announcement_reads_user_select"
  ON announcement_reads FOR SELECT
  USING (user_id = auth.uid());

-- User: mark as read
CREATE POLICY "announcement_reads_user_insert"
  ON announcement_reads FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- User: update (dismiss popup)
CREATE POLICY "announcement_reads_user_update"
  ON announcement_reads FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function: Create announcement (admin only)
CREATE OR REPLACE FUNCTION create_announcement(
  p_title TEXT,
  p_content TEXT,
  p_type announcement_type DEFAULT 'normal',
  p_priority announcement_priority_level DEFAULT 'normal',
  p_send_at TIMESTAMPTZ DEFAULT NULL,
  p_target_type announcement_target_type DEFAULT 'all',
  p_manager_ids UUID[] DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_announcement_id UUID;
  v_status announcement_status;
  v_manager_id UUID;
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Only admins can create announcements';
  END IF;
  
  -- Determine status
  IF p_send_at IS NULL THEN
    v_status := 'draft';
  ELSIF p_send_at <= NOW() THEN
    v_status := 'sent';
  ELSE
    v_status := 'scheduled';
  END IF;
  
  -- Create announcement
  INSERT INTO announcements_v2 (
    title, content, type, priority, status, send_at,
    sent_at, created_by_admin_id
  ) VALUES (
    p_title, p_content, p_type, p_priority, v_status, p_send_at,
    CASE WHEN v_status = 'sent' THEN NOW() ELSE NULL END,
    auth.uid()
  )
  RETURNING id INTO v_announcement_id;
  
  -- Create targets
  IF p_target_type = 'all' THEN
    INSERT INTO announcement_targets (announcement_id, target_type)
    VALUES (v_announcement_id, 'all');
  ELSIF p_manager_ids IS NOT NULL THEN
    FOREACH v_manager_id IN ARRAY p_manager_ids LOOP
      INSERT INTO announcement_targets (announcement_id, target_type, manager_id)
      VALUES (v_announcement_id, 'specific', v_manager_id);
    END LOOP;
  END IF;
  
  RETURN v_announcement_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Send announcement now
CREATE OR REPLACE FUNCTION send_announcement(p_announcement_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Only admins can send announcements';
  END IF;
  
  UPDATE announcements_v2
  SET status = 'sent', sent_at = NOW()
  WHERE id = p_announcement_id AND status IN ('draft', 'scheduled');
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Mark announcement as read
CREATE OR REPLACE FUNCTION mark_announcement_read(p_announcement_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  INSERT INTO announcement_reads (announcement_id, user_id)
  VALUES (p_announcement_id, auth.uid())
  ON CONFLICT (announcement_id, user_id) DO NOTHING;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Dismiss popup
CREATE OR REPLACE FUNCTION dismiss_announcement_popup(p_announcement_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  INSERT INTO announcement_reads (announcement_id, user_id, popup_dismissed_at)
  VALUES (p_announcement_id, auth.uid(), NOW())
  ON CONFLICT (announcement_id, user_id) 
  DO UPDATE SET popup_dismissed_at = NOW();
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get unread announcements for current user
CREATE OR REPLACE FUNCTION get_unread_announcements()
RETURNS TABLE (
  announcement_id UUID,
  title TEXT,
  content TEXT,
  type announcement_type,
  priority announcement_priority_level,
  sent_at TIMESTAMPTZ,
  is_popup_dismissed BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.id AS announcement_id,
    a.title,
    a.content,
    a.type,
    a.priority,
    a.sent_at,
    (ar.popup_dismissed_at IS NOT NULL) AS is_popup_dismissed
  FROM announcements_v2 a
  LEFT JOIN announcement_reads ar ON ar.announcement_id = a.id AND ar.user_id = auth.uid()
  WHERE a.status = 'sent'
    AND (
      EXISTS (
        SELECT 1 FROM announcement_targets t 
        WHERE t.announcement_id = a.id AND t.target_type = 'all'
      )
      OR
      EXISTS (
        SELECT 1 FROM announcement_targets t 
        WHERE t.announcement_id = a.id 
        AND t.target_type = 'specific' 
        AND t.manager_id = auth.uid()
      )
    )
    AND ar.read_at IS NULL
  ORDER BY a.priority DESC, a.sent_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get urgent popups that need to be shown
CREATE OR REPLACE FUNCTION get_pending_popups()
RETURNS TABLE (
  announcement_id UUID,
  title TEXT,
  content TEXT,
  priority announcement_priority_level,
  sent_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.id AS announcement_id,
    a.title,
    a.content,
    a.priority,
    a.sent_at
  FROM announcements_v2 a
  LEFT JOIN announcement_reads ar ON ar.announcement_id = a.id AND ar.user_id = auth.uid()
  WHERE a.status = 'sent'
    AND a.type = 'urgent_popup'
    AND (ar.popup_dismissed_at IS NULL)
    AND (
      EXISTS (
        SELECT 1 FROM announcement_targets t 
        WHERE t.announcement_id = a.id AND t.target_type = 'all'
      )
      OR
      EXISTS (
        SELECT 1 FROM announcement_targets t 
        WHERE t.announcement_id = a.id 
        AND t.target_type = 'specific' 
        AND t.manager_id = auth.uid()
      )
    )
  ORDER BY a.priority DESC, a.sent_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- SCHEDULED JOB: Send scheduled announcements
-- (Run this via pg_cron or external scheduler)
-- ============================================
CREATE OR REPLACE FUNCTION process_scheduled_announcements()
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER := 0;
BEGIN
  UPDATE announcements_v2
  SET status = 'sent', sent_at = NOW()
  WHERE status = 'scheduled' 
    AND send_at IS NOT NULL 
    AND send_at <= NOW();
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- ✅ Announcements migration complete!
-- ============================================
