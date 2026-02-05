-- ============================================
-- ZID Dashboard - Phase 2.7: Meetings (Calendly-like)
-- الاجتماعات
-- ============================================

-- ============================================
-- ENUM TYPES
-- ============================================
DO $$ BEGIN
  CREATE TYPE meeting_booking_status AS ENUM ('booked', 'cancelled');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ============================================
-- 2.7.1 MEETING_SETTINGS TABLE
-- إعدادات الاجتماعات لكل مدير
-- ============================================
CREATE TABLE IF NOT EXISTS meeting_settings (
  -- Manager ID is the primary key (one settings per manager)
  manager_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Meeting defaults
  meeting_title TEXT NOT NULL DEFAULT 'اجتماع',
  duration_minutes INTEGER NOT NULL DEFAULT 30,
  buffer_minutes INTEGER NOT NULL DEFAULT 0,
  min_lead_time_hours INTEGER NOT NULL DEFAULT 24,
  
  -- Timezone
  timezone TEXT NOT NULL DEFAULT 'Asia/Riyadh',
  
  -- Additional settings
  max_bookings_per_day INTEGER,
  booking_window_days INTEGER DEFAULT 30,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_duration CHECK (duration_minutes > 0 AND duration_minutes <= 480),
  CONSTRAINT valid_buffer CHECK (buffer_minutes >= 0 AND buffer_minutes <= 120),
  CONSTRAINT valid_lead_time CHECK (min_lead_time_hours >= 0 AND min_lead_time_hours <= 168)
);

-- ============================================
-- 2.7.2 AVAILABILITY_RULES TABLE
-- قواعد التوفر الأسبوعية
-- ============================================
CREATE TABLE IF NOT EXISTS availability_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Manager reference
  manager_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Day of week (0 = Sunday, 6 = Saturday)
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  
  -- Time range
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  
  -- Is active
  is_active BOOLEAN NOT NULL DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_time_range CHECK (start_time < end_time),
  
  -- Unique constraint (one rule per day per time slot per manager)
  UNIQUE(manager_id, day_of_week, start_time)
);

-- ============================================
-- 2.7.3 TIME_OFF TABLE
-- أوقات الإجازة/عدم التوفر
-- ============================================
CREATE TABLE IF NOT EXISTS time_off (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Manager reference
  manager_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Time range
  start_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ NOT NULL,
  
  -- Reason (optional)
  reason TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_time_off_range CHECK (start_at < end_at)
);

-- ============================================
-- 2.7.4 MEETINGS TABLE
-- الاجتماعات المحجوزة
-- ============================================
CREATE TABLE IF NOT EXISTS meetings_v2 (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Manager reference
  manager_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Time
  start_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ NOT NULL,
  
  -- Guest info
  guest_name TEXT NOT NULL,
  guest_email TEXT NOT NULL,
  guest_phone TEXT,
  guest_notes TEXT,
  
  -- Status
  status meeting_booking_status NOT NULL DEFAULT 'booked',
  
  -- Google Calendar integration
  google_calendar_event_id TEXT,
  
  -- Cancellation info
  cancelled_at TIMESTAMPTZ,
  cancellation_reason TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_meeting_range CHECK (start_at < end_at),
  CONSTRAINT valid_guest_email CHECK (guest_email ~ '^[^@]+@[^@]+\.[^@]+$')
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_availability_rules_manager ON availability_rules(manager_id);
CREATE INDEX IF NOT EXISTS idx_availability_rules_day ON availability_rules(manager_id, day_of_week);

CREATE INDEX IF NOT EXISTS idx_time_off_manager ON time_off(manager_id);
CREATE INDEX IF NOT EXISTS idx_time_off_range ON time_off(manager_id, start_at, end_at);

CREATE INDEX IF NOT EXISTS idx_meetings_v2_manager ON meetings_v2(manager_id);
CREATE INDEX IF NOT EXISTS idx_meetings_v2_start ON meetings_v2(start_at);
CREATE INDEX IF NOT EXISTS idx_meetings_v2_status ON meetings_v2(status);
CREATE INDEX IF NOT EXISTS idx_meetings_v2_manager_time ON meetings_v2(manager_id, start_at, end_at);

-- ============================================
-- TRIGGERS
-- ============================================
DROP TRIGGER IF EXISTS update_meeting_settings_updated_at ON meeting_settings;
CREATE TRIGGER update_meeting_settings_updated_at
  BEFORE UPDATE ON meeting_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ENABLE RLS
-- ============================================
ALTER TABLE meeting_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_off ENABLE ROW LEVEL SECURITY;
ALTER TABLE meetings_v2 ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES - MEETING_SETTINGS
-- ============================================
DROP POLICY IF EXISTS "meeting_settings_admin_select" ON meeting_settings;
DROP POLICY IF EXISTS "meeting_settings_manager_all" ON meeting_settings;

-- Admin: read all
CREATE POLICY "meeting_settings_admin_select"
  ON meeting_settings FOR SELECT
  USING (is_admin());

-- Manager: full CRUD on their own settings
CREATE POLICY "meeting_settings_manager_all"
  ON meeting_settings FOR ALL
  USING (manager_id = auth.uid())
  WITH CHECK (manager_id = auth.uid());

-- ============================================
-- RLS POLICIES - AVAILABILITY_RULES
-- ============================================
DROP POLICY IF EXISTS "availability_rules_admin_select" ON availability_rules;
DROP POLICY IF EXISTS "availability_rules_manager_all" ON availability_rules;
DROP POLICY IF EXISTS "availability_rules_public_select" ON availability_rules;

-- Admin: read all
CREATE POLICY "availability_rules_admin_select"
  ON availability_rules FOR SELECT
  USING (is_admin());

-- Manager: full CRUD on their own rules
CREATE POLICY "availability_rules_manager_all"
  ON availability_rules FOR ALL
  USING (manager_id = auth.uid())
  WITH CHECK (manager_id = auth.uid());

-- Public: read active rules (for booking page)
CREATE POLICY "availability_rules_public_select"
  ON availability_rules FOR SELECT
  USING (is_active = true);

-- ============================================
-- RLS POLICIES - TIME_OFF
-- ============================================
DROP POLICY IF EXISTS "time_off_admin_select" ON time_off;
DROP POLICY IF EXISTS "time_off_manager_all" ON time_off;

-- Admin: read all
CREATE POLICY "time_off_admin_select"
  ON time_off FOR SELECT
  USING (is_admin());

-- Manager: full CRUD on their own time off
CREATE POLICY "time_off_manager_all"
  ON time_off FOR ALL
  USING (manager_id = auth.uid())
  WITH CHECK (manager_id = auth.uid());

-- ============================================
-- RLS POLICIES - MEETINGS_V2
-- ============================================
DROP POLICY IF EXISTS "meetings_v2_admin_select" ON meetings_v2;
DROP POLICY IF EXISTS "meetings_v2_manager_all" ON meetings_v2;
DROP POLICY IF EXISTS "meetings_v2_public_insert" ON meetings_v2;

-- Admin: read all
CREATE POLICY "meetings_v2_admin_select"
  ON meetings_v2 FOR SELECT
  USING (is_admin());

-- Manager: full CRUD on their own meetings
CREATE POLICY "meetings_v2_manager_all"
  ON meetings_v2 FOR ALL
  USING (manager_id = auth.uid())
  WITH CHECK (manager_id = auth.uid());

-- Public: can create meetings (for booking)
CREATE POLICY "meetings_v2_public_insert"
  ON meetings_v2 FOR INSERT
  WITH CHECK (true);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function: Initialize meeting settings for a manager
CREATE OR REPLACE FUNCTION init_meeting_settings()
RETURNS TRIGGER AS $$
BEGIN
  -- Only for managers
  IF NEW.role = 'manager' THEN
    INSERT INTO meeting_settings (manager_id)
    VALUES (NEW.id)
    ON CONFLICT (manager_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_profile_created_init_meeting_settings ON profiles;
CREATE TRIGGER on_profile_created_init_meeting_settings
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION init_meeting_settings();

-- Function: Get manager's available slots for a date
CREATE OR REPLACE FUNCTION get_available_slots(
  p_manager_id UUID,
  p_date DATE
)
RETURNS TABLE (
  slot_start TIMESTAMPTZ,
  slot_end TIMESTAMPTZ
) AS $$
DECLARE
  v_settings meeting_settings%ROWTYPE;
  v_day_of_week INTEGER;
  v_rule RECORD;
  v_slot_start TIMESTAMPTZ;
  v_slot_end TIMESTAMPTZ;
BEGIN
  -- Get manager settings
  SELECT * INTO v_settings FROM meeting_settings WHERE manager_id = p_manager_id;
  
  IF NOT FOUND THEN
    RETURN;
  END IF;
  
  -- Get day of week (0 = Sunday)
  v_day_of_week := EXTRACT(DOW FROM p_date);
  
  -- Loop through availability rules for this day
  FOR v_rule IN 
    SELECT * FROM availability_rules 
    WHERE manager_id = p_manager_id 
    AND day_of_week = v_day_of_week 
    AND is_active = true
    ORDER BY start_time
  LOOP
    -- Generate slots based on duration
    v_slot_start := p_date + v_rule.start_time;
    
    WHILE v_slot_start + (v_settings.duration_minutes || ' minutes')::INTERVAL <= p_date + v_rule.end_time LOOP
      v_slot_end := v_slot_start + (v_settings.duration_minutes || ' minutes')::INTERVAL;
      
      -- Check if slot is not in time_off
      IF NOT EXISTS (
        SELECT 1 FROM time_off 
        WHERE manager_id = p_manager_id 
        AND start_at <= v_slot_start 
        AND end_at >= v_slot_end
      ) THEN
        -- Check if slot is not already booked
        IF NOT EXISTS (
          SELECT 1 FROM meetings_v2 
          WHERE manager_id = p_manager_id 
          AND status = 'booked'
          AND (
            (start_at <= v_slot_start AND end_at > v_slot_start) OR
            (start_at < v_slot_end AND end_at >= v_slot_end) OR
            (start_at >= v_slot_start AND end_at <= v_slot_end)
          )
        ) THEN
          -- Check lead time
          IF v_slot_start >= NOW() + (v_settings.min_lead_time_hours || ' hours')::INTERVAL THEN
            slot_start := v_slot_start;
            slot_end := v_slot_end;
            RETURN NEXT;
          END IF;
        END IF;
      END IF;
      
      -- Move to next slot (with buffer)
      v_slot_start := v_slot_end + (v_settings.buffer_minutes || ' minutes')::INTERVAL;
    END LOOP;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Book a meeting (public)
CREATE OR REPLACE FUNCTION book_meeting(
  p_manager_booking_slug TEXT,
  p_start_at TIMESTAMPTZ,
  p_guest_name TEXT,
  p_guest_email TEXT,
  p_guest_phone TEXT DEFAULT NULL,
  p_guest_notes TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_manager_id UUID;
  v_settings meeting_settings%ROWTYPE;
  v_end_at TIMESTAMPTZ;
  v_meeting_id UUID;
BEGIN
  -- Get manager by booking slug
  SELECT id INTO v_manager_id 
  FROM profiles 
  WHERE booking_slug = p_manager_booking_slug AND role = 'manager';
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Manager not found';
  END IF;
  
  -- Get settings
  SELECT * INTO v_settings FROM meeting_settings WHERE manager_id = v_manager_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Manager has not configured meeting settings';
  END IF;
  
  -- Calculate end time
  v_end_at := p_start_at + (v_settings.duration_minutes || ' minutes')::INTERVAL;
  
  -- Check if slot is available
  IF NOT EXISTS (
    SELECT 1 FROM get_available_slots(v_manager_id, p_start_at::DATE) 
    WHERE slot_start = p_start_at
  ) THEN
    RAISE EXCEPTION 'Selected time slot is not available';
  END IF;
  
  -- Create meeting
  INSERT INTO meetings_v2 (
    manager_id, start_at, end_at,
    guest_name, guest_email, guest_phone, guest_notes
  ) VALUES (
    v_manager_id, p_start_at, v_end_at,
    p_guest_name, p_guest_email, p_guest_phone, p_guest_notes
  )
  RETURNING id INTO v_meeting_id;
  
  RETURN v_meeting_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Cancel a meeting
CREATE OR REPLACE FUNCTION cancel_meeting(
  p_meeting_id UUID,
  p_reason TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  v_manager_id UUID;
BEGIN
  -- Get meeting's manager
  SELECT manager_id INTO v_manager_id FROM meetings_v2 WHERE id = p_meeting_id;
  
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  -- Check permissions (manager or admin)
  IF NOT (is_admin() OR v_manager_id = auth.uid()) THEN
    RAISE EXCEPTION 'You do not have permission to cancel this meeting';
  END IF;
  
  -- Cancel
  UPDATE meetings_v2
  SET status = 'cancelled', 
      cancelled_at = NOW(),
      cancellation_reason = p_reason
  WHERE id = p_meeting_id AND status = 'booked';
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get manager's upcoming meetings
CREATE OR REPLACE FUNCTION get_upcoming_meetings(p_manager_id UUID DEFAULT NULL)
RETURNS TABLE (
  meeting_id UUID,
  start_at TIMESTAMPTZ,
  end_at TIMESTAMPTZ,
  guest_name TEXT,
  guest_email TEXT,
  guest_phone TEXT,
  guest_notes TEXT,
  status meeting_booking_status,
  created_at TIMESTAMPTZ
) AS $$
DECLARE
  v_manager_id UUID;
BEGIN
  -- Use provided manager_id or current user
  v_manager_id := COALESCE(p_manager_id, auth.uid());
  
  -- Check permissions
  IF NOT (is_admin() OR v_manager_id = auth.uid()) THEN
    RAISE EXCEPTION 'You do not have permission to view these meetings';
  END IF;
  
  RETURN QUERY
  SELECT 
    m.id AS meeting_id,
    m.start_at,
    m.end_at,
    m.guest_name,
    m.guest_email,
    m.guest_phone,
    m.guest_notes,
    m.status,
    m.created_at
  FROM meetings_v2 m
  WHERE m.manager_id = v_manager_id
    AND m.start_at >= NOW()
    AND m.status = 'booked'
  ORDER BY m.start_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get public booking info for a manager
CREATE OR REPLACE FUNCTION get_booking_info(p_booking_slug TEXT)
RETURNS TABLE (
  manager_name TEXT,
  meeting_title TEXT,
  duration_minutes INTEGER,
  timezone TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.name AS manager_name,
    ms.meeting_title,
    ms.duration_minutes,
    ms.timezone
  FROM profiles p
  JOIN meeting_settings ms ON ms.manager_id = p.id
  WHERE p.booking_slug = p_booking_slug AND p.role = 'manager';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- ✅ Meetings migration complete!
-- ============================================
