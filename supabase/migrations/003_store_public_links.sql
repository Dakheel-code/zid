-- ============================================
-- ZID Dashboard - Phase 2.3: Store Public Links
-- روابط صفحة التاجر العامة
-- ============================================

-- ============================================
-- 2.3 STORE_PUBLIC_LINKS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS store_public_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Store reference
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  
  -- Public token (long, unguessable)
  public_token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  
  -- Status
  is_revoked BOOLEAN NOT NULL DEFAULT false,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  revoked_at TIMESTAMPTZ,
  
  -- Constraints
  CONSTRAINT valid_public_token CHECK (length(public_token) >= 32)
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_store_public_links_store_id ON store_public_links(store_id);
CREATE INDEX IF NOT EXISTS idx_store_public_links_token ON store_public_links(public_token);
CREATE INDEX IF NOT EXISTS idx_store_public_links_active ON store_public_links(store_id, is_revoked) WHERE is_revoked = false;

-- ============================================
-- ENABLE RLS
-- ============================================
ALTER TABLE store_public_links ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES
-- ============================================
DROP POLICY IF EXISTS "store_public_links_admin" ON store_public_links;
DROP POLICY IF EXISTS "store_public_links_manager_select" ON store_public_links;
DROP POLICY IF EXISTS "store_public_links_manager_insert" ON store_public_links;
DROP POLICY IF EXISTS "store_public_links_manager_update" ON store_public_links;

-- Admin full access
CREATE POLICY "store_public_links_admin"
  ON store_public_links FOR ALL
  USING (is_admin());

-- Manager can view links for their stores
CREATE POLICY "store_public_links_manager_select"
  ON store_public_links FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM stores 
      WHERE stores.id = store_public_links.store_id 
      AND stores.assigned_manager_id = auth.uid()
    )
  );

-- Manager can create links for their stores
CREATE POLICY "store_public_links_manager_insert"
  ON store_public_links FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM stores 
      WHERE stores.id = store_public_links.store_id 
      AND stores.assigned_manager_id = auth.uid()
    )
  );

-- Manager can revoke links for their stores
CREATE POLICY "store_public_links_manager_update"
  ON store_public_links FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM stores 
      WHERE stores.id = store_public_links.store_id 
      AND stores.assigned_manager_id = auth.uid()
    )
  );

-- ============================================
-- FUNCTION: Validate public access
-- التحقق من صلاحية الوصول العام
-- ============================================
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
  -- Find the link
  SELECT * INTO v_link FROM store_public_links WHERE public_token = p_token;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT 
      NULL::UUID, NULL::TEXT, NULL::TEXT, NULL::TEXT, NULL::TEXT,
      false, 'Invalid token'::TEXT;
    RETURN;
  END IF;
  
  -- Check if revoked
  IF v_link.is_revoked THEN
    RETURN QUERY SELECT 
      NULL::UUID, NULL::TEXT, NULL::TEXT, NULL::TEXT, NULL::TEXT,
      false, 'Link has been revoked'::TEXT;
    RETURN;
  END IF;
  
  -- Get store
  SELECT * INTO v_store FROM stores WHERE id = v_link.store_id;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT 
      NULL::UUID, NULL::TEXT, NULL::TEXT, NULL::TEXT, NULL::TEXT,
      false, 'Store not found'::TEXT;
    RETURN;
  END IF;
  
  -- Check store status
  IF v_store.status = 'ended' THEN
    -- Check if within grace period
    IF v_store.public_access_expires_at IS NULL OR NOW() > v_store.public_access_expires_at THEN
      RETURN QUERY SELECT 
        NULL::UUID, NULL::TEXT, NULL::TEXT, NULL::TEXT, NULL::TEXT,
        false, 'Store access has expired'::TEXT;
      RETURN;
    END IF;
  END IF;
  
  -- Valid access
  RETURN QUERY SELECT 
    v_store.id,
    v_store.store_name,
    v_store.store_url,
    v_store.store_logo_url,
    v_store.owner_name,
    true,
    'Access granted'::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- FUNCTION: Generate new public link
-- ============================================
CREATE OR REPLACE FUNCTION generate_store_public_link(p_store_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_token TEXT;
BEGIN
  -- Check if user can access this store
  IF NOT EXISTS (
    SELECT 1 FROM stores 
    WHERE id = p_store_id 
    AND (is_admin() OR assigned_manager_id = auth.uid())
  ) THEN
    RAISE EXCEPTION 'You do not have permission to generate links for this store';
  END IF;
  
  -- Generate token
  v_token := encode(gen_random_bytes(32), 'hex');
  
  -- Insert link
  INSERT INTO store_public_links (store_id, public_token)
  VALUES (p_store_id, v_token);
  
  RETURN v_token;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- FUNCTION: Revoke public link
-- ============================================
CREATE OR REPLACE FUNCTION revoke_store_public_link(p_token TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  v_store_id UUID;
BEGIN
  -- Get store_id for permission check
  SELECT store_id INTO v_store_id 
  FROM store_public_links 
  WHERE public_token = p_token;
  
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  -- Check permissions
  IF NOT EXISTS (
    SELECT 1 FROM stores 
    WHERE id = v_store_id 
    AND (is_admin() OR assigned_manager_id = auth.uid())
  ) THEN
    RAISE EXCEPTION 'You do not have permission to revoke this link';
  END IF;
  
  -- Revoke
  UPDATE store_public_links
  SET is_revoked = true, revoked_at = NOW()
  WHERE public_token = p_token;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- ✅ Store public links migration complete!
-- ============================================
