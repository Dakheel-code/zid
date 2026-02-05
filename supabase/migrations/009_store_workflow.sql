-- ============================================
-- ZID Dashboard - Phase 3.1: Store Creation Workflow
-- منطق إنشاء متجر مع كل الخطوات
-- ============================================

-- ============================================
-- FUNCTION: Create store with full workflow
-- إنشاء متجر مع كل الخطوات التلقائية
-- ============================================
CREATE OR REPLACE FUNCTION create_store_with_workflow(
  p_store_url TEXT,
  p_store_name TEXT DEFAULT NULL,
  p_store_logo_url TEXT DEFAULT NULL,
  p_owner_name TEXT DEFAULT NULL,
  p_owner_email TEXT DEFAULT NULL,
  p_owner_phone TEXT DEFAULT NULL,
  p_assigned_manager_id UUID DEFAULT NULL,
  p_priority store_priority DEFAULT 'medium',
  p_metadata JSONB DEFAULT '{}'
)
RETURNS JSONB AS $$
DECLARE
  v_store_id UUID;
  v_public_token TEXT;
  v_tasks_count INTEGER;
  v_store stores%ROWTYPE;
BEGIN
  -- Check if admin
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Only admins can create stores';
  END IF;

  -- Step 1: Create the store
  INSERT INTO stores (
    store_url,
    store_name,
    store_logo_url,
    owner_name,
    owner_email,
    owner_phone,
    assigned_manager_id,
    priority,
    status,
    metadata,
    created_by_admin_id
  ) VALUES (
    p_store_url,
    COALESCE(p_store_name, p_store_url),
    p_store_logo_url,
    p_owner_name,
    p_owner_email,
    p_owner_phone,
    p_assigned_manager_id,
    p_priority,
    'new',
    p_metadata,
    auth.uid()
  )
  RETURNING * INTO v_store;
  
  v_store_id := v_store.id;

  -- Step 2: Generate public link token
  -- (This is done automatically by trigger, but we need to get the token)
  SELECT public_token INTO v_public_token
  FROM store_public_links
  WHERE store_id = v_store_id
  ORDER BY created_at DESC
  LIMIT 1;
  
  -- If no token was created by trigger, create one manually
  IF v_public_token IS NULL THEN
    v_public_token := encode(gen_random_bytes(32), 'hex');
    INSERT INTO store_public_links (store_id, public_token)
    VALUES (v_store_id, v_public_token);
  END IF;

  -- Step 3: Copy task templates
  -- (This is done automatically by trigger on_store_created)
  SELECT COUNT(*) INTO v_tasks_count
  FROM store_tasks
  WHERE store_id = v_store_id;

  -- Step 4: Create notification for assigned manager
  IF p_assigned_manager_id IS NOT NULL THEN
    PERFORM create_notification(
      p_recipient_user_id := p_assigned_manager_id,
      p_type := 'store'::notification_type_v2,
      p_event_key := 'store.assigned',
      p_title := 'متجر جديد مسند إليك',
      p_body := 'تم إسناد متجر جديد إليك: ' || COALESCE(p_store_name, p_store_url),
      p_link_url := '/manager/stores/' || v_store_id::TEXT,
      p_metadata := jsonb_build_object(
        'store_id', v_store_id,
        'store_name', COALESCE(p_store_name, p_store_url),
        'store_url', p_store_url
      )
    );
  END IF;

  -- Return result
  RETURN jsonb_build_object(
    'success', true,
    'store', row_to_json(v_store),
    'public_token', v_public_token,
    'tasks_created', v_tasks_count
  );

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- TRIGGER: Auto-create public link on store creation
-- ============================================
CREATE OR REPLACE FUNCTION on_store_created_create_public_link()
RETURNS TRIGGER AS $$
BEGIN
  -- Create a public link for the new store
  INSERT INTO store_public_links (store_id, public_token)
  VALUES (NEW.id, encode(gen_random_bytes(32), 'hex'));
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_create_public_link_on_store_create ON stores;
CREATE TRIGGER trigger_create_public_link_on_store_create
  AFTER INSERT ON stores
  FOR EACH ROW
  EXECUTE FUNCTION on_store_created_create_public_link();

-- ============================================
-- FUNCTION: Assign manager to store (with notification)
-- ============================================
CREATE OR REPLACE FUNCTION assign_manager_to_store(
  p_store_id UUID,
  p_manager_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  v_store stores%ROWTYPE;
  v_old_manager_id UUID;
BEGIN
  -- Check if admin
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Only admins can assign managers to stores';
  END IF;

  -- Get current store
  SELECT * INTO v_store FROM stores WHERE id = p_store_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Store not found';
  END IF;

  v_old_manager_id := v_store.assigned_manager_id;

  -- Update store
  UPDATE stores
  SET assigned_manager_id = p_manager_id
  WHERE id = p_store_id;

  -- Notify new manager
  IF p_manager_id IS NOT NULL AND p_manager_id != v_old_manager_id THEN
    PERFORM create_notification(
      p_recipient_user_id := p_manager_id,
      p_type := 'store'::notification_type_v2,
      p_event_key := 'store.assigned',
      p_title := 'متجر جديد مسند إليك',
      p_body := 'تم إسناد متجر جديد إليك: ' || COALESCE(v_store.store_name, v_store.store_url),
      p_link_url := '/manager/stores/' || p_store_id::TEXT,
      p_metadata := jsonb_build_object(
        'store_id', p_store_id,
        'store_name', COALESCE(v_store.store_name, v_store.store_url)
      )
    );
  END IF;

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- FUNCTION: Update store status (with notifications)
-- ============================================
CREATE OR REPLACE FUNCTION update_store_status_v2(
  p_store_id UUID,
  p_new_status store_status
)
RETURNS BOOLEAN AS $$
DECLARE
  v_store stores%ROWTYPE;
BEGIN
  -- Get current store
  SELECT * INTO v_store FROM stores WHERE id = p_store_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Store not found';
  END IF;

  -- Check permissions (admin or assigned manager)
  IF NOT (is_admin() OR v_store.assigned_manager_id = auth.uid()) THEN
    RAISE EXCEPTION 'You do not have permission to update this store';
  END IF;

  -- Update status (trigger will handle ended_at and public_access_expires_at)
  UPDATE stores
  SET status = p_new_status
  WHERE id = p_store_id;

  -- Notify about status change
  IF v_store.assigned_manager_id IS NOT NULL AND v_store.assigned_manager_id != auth.uid() THEN
    PERFORM create_notification(
      p_recipient_user_id := v_store.assigned_manager_id,
      p_type := 'store'::notification_type_v2,
      p_event_key := 'store.status_changed',
      p_title := 'تغيير حالة المتجر',
      p_body := 'تم تغيير حالة المتجر "' || COALESCE(v_store.store_name, v_store.store_url) || '" إلى ' || p_new_status::TEXT,
      p_link_url := '/manager/stores/' || p_store_id::TEXT,
      p_metadata := jsonb_build_object(
        'store_id', p_store_id,
        'old_status', v_store.status,
        'new_status', p_new_status
      )
    );
  END IF;

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- FUNCTION: Get stores needing review
-- ============================================
CREATE OR REPLACE FUNCTION get_stores_needing_review()
RETURNS SETOF stores AS $$
BEGIN
  -- Only admin can see all stores needing review
  IF NOT is_admin() THEN
    RETURN QUERY
    SELECT s.* FROM stores s
    WHERE s.assigned_manager_id = auth.uid()
      AND (s.metadata->>'needs_review')::BOOLEAN = true
    ORDER BY s.created_at DESC;
  ELSE
    RETURN QUERY
    SELECT s.* FROM stores s
    WHERE (s.metadata->>'needs_review')::BOOLEAN = true
    ORDER BY s.created_at DESC;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- FUNCTION: Retry store detection (mark for re-detection)
-- ============================================
CREATE OR REPLACE FUNCTION mark_store_for_redetection(p_store_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_store stores%ROWTYPE;
BEGIN
  -- Get store
  SELECT * INTO v_store FROM stores WHERE id = p_store_id;
  
  IF NOT FOUND THEN
    RETURN false;
  END IF;

  -- Check permissions
  IF NOT (is_admin() OR v_store.assigned_manager_id = auth.uid()) THEN
    RAISE EXCEPTION 'You do not have permission to update this store';
  END IF;

  -- Update metadata to mark for re-detection
  UPDATE stores
  SET metadata = metadata || jsonb_build_object(
    'pending_redetection', true,
    'redetection_requested_at', NOW()
  )
  WHERE id = p_store_id;

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- FUNCTION: Manual override store metadata
-- ============================================
CREATE OR REPLACE FUNCTION override_store_metadata(
  p_store_id UUID,
  p_store_name TEXT DEFAULT NULL,
  p_store_logo_url TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  v_store stores%ROWTYPE;
BEGIN
  -- Get store
  SELECT * INTO v_store FROM stores WHERE id = p_store_id;
  
  IF NOT FOUND THEN
    RETURN false;
  END IF;

  -- Check permissions
  IF NOT (is_admin() OR v_store.assigned_manager_id = auth.uid()) THEN
    RAISE EXCEPTION 'You do not have permission to update this store';
  END IF;

  -- Update store
  UPDATE stores
  SET 
    store_name = COALESCE(p_store_name, store_name),
    store_logo_url = COALESCE(p_store_logo_url, store_logo_url),
    metadata = metadata || jsonb_build_object(
      'needs_review', false,
      'manual_override', true,
      'override_at', NOW(),
      'override_by', auth.uid()
    )
  WHERE id = p_store_id;

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- ✅ Store workflow migration complete!
-- ============================================
