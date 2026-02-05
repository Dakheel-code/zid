-- ============================================
-- ZID Dashboard - Phase 2.2: Stores Table
-- جدول المتاجر مع RLS و Triggers
-- ============================================

-- ============================================
-- NEW ENUM TYPES FOR STORES
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

-- ============================================
-- 2.2 STORES TABLE (المتاجر)
-- ============================================
CREATE TABLE IF NOT EXISTS stores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Store identification
  store_url TEXT NOT NULL UNIQUE,
  store_name TEXT, -- auto-detected or manual override
  store_logo_url TEXT, -- auto-detected or manual override
  
  -- Owner info
  owner_name TEXT,
  owner_email TEXT,
  owner_phone TEXT,
  
  -- Priority & Status
  priority store_priority NOT NULL DEFAULT 'medium',
  status store_status NOT NULL DEFAULT 'new',
  
  -- End dates (managed by trigger)
  ended_at TIMESTAMPTZ,
  public_access_expires_at TIMESTAMPTZ, -- ended_at + 30 days
  
  -- Assignments
  assigned_manager_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_by_admin_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  
  -- Additional
  notes TEXT,
  metadata JSONB DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_store_url CHECK (
    store_url ~ '^https?://.+' OR store_url ~ '^[a-z0-9-]+\.zid\.store$'
  ),
  CONSTRAINT valid_owner_email CHECK (
    owner_email IS NULL OR owner_email ~ '^[^@]+@[^@]+\.[^@]+$'
  )
);

-- ============================================
-- INDEXES FOR STORES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_stores_assigned_manager_id ON stores(assigned_manager_id);
CREATE INDEX IF NOT EXISTS idx_stores_status ON stores(status);
CREATE INDEX IF NOT EXISTS idx_stores_priority ON stores(priority);
CREATE INDEX IF NOT EXISTS idx_stores_store_url ON stores(store_url);
CREATE INDEX IF NOT EXISTS idx_stores_created_by ON stores(created_by_admin_id);
CREATE INDEX IF NOT EXISTS idx_stores_ended_at ON stores(ended_at) WHERE ended_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_stores_public_access ON stores(public_access_expires_at) WHERE public_access_expires_at IS NOT NULL;

-- ============================================
-- TRIGGER: Auto-manage ended_at and public_access_expires_at
-- ============================================
CREATE OR REPLACE FUNCTION handle_store_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- When status changes to 'ended'
  IF NEW.status = 'ended' AND (OLD.status IS NULL OR OLD.status != 'ended') THEN
    NEW.ended_at := NOW();
    NEW.public_access_expires_at := NOW() + INTERVAL '30 days';
  END IF;
  
  -- When status changes back to 'active' (or 'new' or 'paused')
  IF NEW.status IN ('active', 'new', 'paused') AND OLD.status = 'ended' THEN
    NEW.ended_at := NULL;
    NEW.public_access_expires_at := NULL;
  END IF;
  
  -- Update timestamp
  NEW.updated_at := NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_store_status_change ON stores;
CREATE TRIGGER on_store_status_change
  BEFORE UPDATE ON stores
  FOR EACH ROW
  EXECUTE FUNCTION handle_store_status_change();

-- Also handle on INSERT
DROP TRIGGER IF EXISTS on_store_insert ON stores;
CREATE TRIGGER on_store_insert
  BEFORE INSERT ON stores
  FOR EACH ROW
  EXECUTE FUNCTION handle_store_status_change();

-- ============================================
-- ENABLE RLS
-- ============================================
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES FOR STORES
-- ============================================

-- Drop existing policies if any
DROP POLICY IF EXISTS "stores_insert_admin" ON stores;
DROP POLICY IF EXISTS "stores_select_admin" ON stores;
DROP POLICY IF EXISTS "stores_select_manager" ON stores;
DROP POLICY IF EXISTS "stores_update_admin" ON stores;
DROP POLICY IF EXISTS "stores_update_manager" ON stores;
DROP POLICY IF EXISTS "stores_delete_admin" ON stores;

-- 1. إنشاء متجر: admin فقط
CREATE POLICY "stores_insert_admin"
  ON stores FOR INSERT
  WITH CHECK (is_admin());

-- 2. قراءة: admin يرى كل شيء
CREATE POLICY "stores_select_admin"
  ON stores FOR SELECT
  USING (is_admin());

-- 3. قراءة: manager يرى فقط المتاجر المسندة له
CREATE POLICY "stores_select_manager"
  ON stores FOR SELECT
  USING (assigned_manager_id = auth.uid());

-- 4. تعديل: admin يعدل كل شيء
CREATE POLICY "stores_update_admin"
  ON stores FOR UPDATE
  USING (is_admin());

-- 5. تعديل: manager يعدل فقط متاجره (owner info, logo, name, status)
CREATE POLICY "stores_update_manager"
  ON stores FOR UPDATE
  USING (assigned_manager_id = auth.uid())
  WITH CHECK (assigned_manager_id = auth.uid());

-- 6. حذف: admin فقط
CREATE POLICY "stores_delete_admin"
  ON stores FOR DELETE
  USING (is_admin());

-- ============================================
-- HELPER FUNCTION: Check if user can update store
-- ============================================
CREATE OR REPLACE FUNCTION can_update_store(store_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM stores 
    WHERE id = store_id 
    AND (is_admin() OR assigned_manager_id = auth.uid())
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================
-- FUNCTION: Create store (admin only)
-- ============================================
CREATE OR REPLACE FUNCTION create_store(
  p_store_url TEXT,
  p_store_name TEXT DEFAULT NULL,
  p_owner_name TEXT DEFAULT NULL,
  p_owner_email TEXT DEFAULT NULL,
  p_owner_phone TEXT DEFAULT NULL,
  p_assigned_manager_id UUID DEFAULT NULL,
  p_priority store_priority DEFAULT 'medium'
)
RETURNS UUID AS $$
DECLARE
  new_store_id UUID;
BEGIN
  -- Check if admin
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Only admins can create stores';
  END IF;
  
  INSERT INTO stores (
    store_url,
    store_name,
    owner_name,
    owner_email,
    owner_phone,
    assigned_manager_id,
    priority,
    created_by_admin_id
  ) VALUES (
    p_store_url,
    p_store_name,
    p_owner_name,
    p_owner_email,
    p_owner_phone,
    p_assigned_manager_id,
    p_priority,
    auth.uid()
  )
  RETURNING id INTO new_store_id;
  
  RETURN new_store_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- FUNCTION: Update store status (manager or admin)
-- ============================================
CREATE OR REPLACE FUNCTION update_store_status(
  p_store_id UUID,
  p_new_status store_status
)
RETURNS BOOLEAN AS $$
BEGIN
  -- Check permissions
  IF NOT can_update_store(p_store_id) THEN
    RAISE EXCEPTION 'You do not have permission to update this store';
  END IF;
  
  UPDATE stores
  SET status = p_new_status
  WHERE id = p_store_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- FUNCTION: Assign manager to store (admin only)
-- ============================================
CREATE OR REPLACE FUNCTION assign_store_manager(
  p_store_id UUID,
  p_manager_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if admin
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Only admins can assign managers to stores';
  END IF;
  
  -- Verify manager exists and has manager role
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = p_manager_id AND role = 'manager') THEN
    RAISE EXCEPTION 'Invalid manager ID or user is not a manager';
  END IF;
  
  UPDATE stores
  SET assigned_manager_id = p_manager_id
  WHERE id = p_store_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- ✅ Stores table migration complete!
-- ============================================
