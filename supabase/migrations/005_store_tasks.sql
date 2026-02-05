-- ============================================
-- ZID Dashboard - Phase 2.5: Store Tasks
-- مهام المتاجر (Instances)
-- ============================================

-- ============================================
-- ENUM TYPES
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
  CREATE TYPE store_task_public_status AS ENUM ('follow_up', 'done');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE task_creator_role AS ENUM ('admin', 'manager', 'merchant');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ============================================
-- 2.5 STORE_TASKS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS store_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Store reference
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  
  -- Template reference (nullable - for template tasks)
  template_task_id UUID REFERENCES tasks_template(id) ON DELETE SET NULL,
  template_section_id UUID REFERENCES task_sections_template(id) ON DELETE SET NULL,
  
  -- Task type
  type store_task_type NOT NULL DEFAULT 'manual',
  
  -- Task info
  title TEXT NOT NULL,
  description TEXT,
  
  -- Internal status (for admin/manager)
  status store_task_status NOT NULL DEFAULT 'new',
  
  -- Due date (optional)
  due_date TIMESTAMPTZ,
  
  -- Creator info
  created_by_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_by_role task_creator_role NOT NULL DEFAULT 'manager',
  
  -- For merchant-created tasks
  merchant_name TEXT,
  merchant_contact TEXT,
  
  -- Visibility (inherited from template or set manually)
  visible_to_merchant BOOLEAN NOT NULL DEFAULT true,
  
  -- Sort order (inherited from template)
  sort_order INTEGER NOT NULL DEFAULT 0,
  
  -- Notes
  notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_store_tasks_store_id ON store_tasks(store_id);
CREATE INDEX IF NOT EXISTS idx_store_tasks_template_task_id ON store_tasks(template_task_id) WHERE template_task_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_store_tasks_status ON store_tasks(status);
CREATE INDEX IF NOT EXISTS idx_store_tasks_type ON store_tasks(type);
CREATE INDEX IF NOT EXISTS idx_store_tasks_created_by_role ON store_tasks(created_by_role);
CREATE INDEX IF NOT EXISTS idx_store_tasks_visible ON store_tasks(store_id, visible_to_merchant) WHERE visible_to_merchant = true;
CREATE INDEX IF NOT EXISTS idx_store_tasks_due_date ON store_tasks(due_date) WHERE due_date IS NOT NULL;

-- ============================================
-- TRIGGER: Auto-update timestamps
-- ============================================
DROP TRIGGER IF EXISTS update_store_tasks_updated_at ON store_tasks;
CREATE TRIGGER update_store_tasks_updated_at
  BEFORE UPDATE ON store_tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- TRIGGER: Set completed_at when status = done
-- ============================================
CREATE OR REPLACE FUNCTION handle_store_task_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- When status changes to 'done'
  IF NEW.status = 'done' AND (OLD.status IS NULL OR OLD.status != 'done') THEN
    NEW.completed_at := NOW();
  END IF;
  
  -- When status changes from 'done' to something else
  IF OLD.status = 'done' AND NEW.status != 'done' THEN
    NEW.completed_at := NULL;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_store_task_status_change ON store_tasks;
CREATE TRIGGER on_store_task_status_change
  BEFORE UPDATE ON store_tasks
  FOR EACH ROW
  EXECUTE FUNCTION handle_store_task_status_change();

-- ============================================
-- ENABLE RLS
-- ============================================
ALTER TABLE store_tasks ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES
-- ============================================
DROP POLICY IF EXISTS "store_tasks_admin_all" ON store_tasks;
DROP POLICY IF EXISTS "store_tasks_manager_select" ON store_tasks;
DROP POLICY IF EXISTS "store_tasks_manager_insert" ON store_tasks;
DROP POLICY IF EXISTS "store_tasks_manager_update" ON store_tasks;
DROP POLICY IF EXISTS "store_tasks_manager_delete" ON store_tasks;

-- Admin: full access
CREATE POLICY "store_tasks_admin_all"
  ON store_tasks FOR ALL
  USING (is_admin());

-- Manager: view tasks for their stores
CREATE POLICY "store_tasks_manager_select"
  ON store_tasks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM stores 
      WHERE stores.id = store_tasks.store_id 
      AND stores.assigned_manager_id = auth.uid()
    )
  );

-- Manager: create tasks for their stores
CREATE POLICY "store_tasks_manager_insert"
  ON store_tasks FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM stores 
      WHERE stores.id = store_tasks.store_id 
      AND stores.assigned_manager_id = auth.uid()
    )
  );

-- Manager: update tasks for their stores
CREATE POLICY "store_tasks_manager_update"
  ON store_tasks FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM stores 
      WHERE stores.id = store_tasks.store_id 
      AND stores.assigned_manager_id = auth.uid()
    )
  );

-- Manager: delete manual tasks for their stores
CREATE POLICY "store_tasks_manager_delete"
  ON store_tasks FOR DELETE
  USING (
    type = 'manual' AND
    EXISTS (
      SELECT 1 FROM stores 
      WHERE stores.id = store_tasks.store_id 
      AND stores.assigned_manager_id = auth.uid()
    )
  );

-- ============================================
-- FUNCTION: Copy templates to new store
-- نسخ قوالب المهام عند إنشاء متجر جديد
-- ============================================
CREATE OR REPLACE FUNCTION copy_task_templates_to_store(p_store_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER := 0;
  v_template RECORD;
BEGIN
  -- Copy all active templates to the store
  FOR v_template IN 
    SELECT 
      t.id AS template_id,
      t.section_id,
      t.title,
      t.description,
      t.sort_order,
      t.visible_to_merchant
    FROM tasks_template t
    JOIN task_sections_template s ON s.id = t.section_id
    ORDER BY s.sort_order, t.sort_order
  LOOP
    INSERT INTO store_tasks (
      store_id,
      template_task_id,
      template_section_id,
      type,
      title,
      description,
      sort_order,
      visible_to_merchant,
      created_by_role
    ) VALUES (
      p_store_id,
      v_template.template_id,
      v_template.section_id,
      'template',
      v_template.title,
      v_template.description,
      v_template.sort_order,
      v_template.visible_to_merchant,
      'admin'
    );
    v_count := v_count + 1;
  END LOOP;
  
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- TRIGGER: Auto-copy templates on store creation
-- ============================================
CREATE OR REPLACE FUNCTION on_store_created()
RETURNS TRIGGER AS $$
BEGIN
  -- Copy task templates to the new store
  PERFORM copy_task_templates_to_store(NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_copy_templates_on_store_create ON stores;
CREATE TRIGGER trigger_copy_templates_on_store_create
  AFTER INSERT ON stores
  FOR EACH ROW
  EXECUTE FUNCTION on_store_created();

-- ============================================
-- FUNCTION: Get public status (computed)
-- الحالة العامة للتاجر
-- ============================================
CREATE OR REPLACE FUNCTION get_task_public_status(p_status store_task_status)
RETURNS store_task_public_status AS $$
BEGIN
  IF p_status = 'done' THEN
    RETURN 'done';
  ELSE
    RETURN 'follow_up';
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================
-- FUNCTION: Check if task is overdue
-- ============================================
CREATE OR REPLACE FUNCTION is_task_overdue(p_task_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_task store_tasks%ROWTYPE;
BEGIN
  SELECT * INTO v_task FROM store_tasks WHERE id = p_task_id;
  
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  -- Not overdue if completed
  IF v_task.status = 'done' THEN
    RETURN false;
  END IF;
  
  -- Not overdue if no due date
  IF v_task.due_date IS NULL THEN
    RETURN false;
  END IF;
  
  -- Overdue if past due date
  RETURN NOW() > v_task.due_date;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================
-- FUNCTION: Get tasks for public merchant view
-- جلب المهام للعرض العام للتاجر
-- ============================================
CREATE OR REPLACE FUNCTION get_merchant_tasks(p_token TEXT)
RETURNS TABLE (
  task_id UUID,
  title TEXT,
  description TEXT,
  public_status store_task_public_status,
  is_merchant_created BOOLEAN,
  section_title TEXT,
  sort_order INTEGER,
  created_at TIMESTAMPTZ
) AS $$
DECLARE
  v_access RECORD;
BEGIN
  -- Validate access
  SELECT * INTO v_access FROM validate_public_access(p_token);
  
  IF NOT v_access.is_valid THEN
    RAISE EXCEPTION 'Invalid or expired access token';
  END IF;
  
  RETURN QUERY
  SELECT 
    st.id AS task_id,
    st.title,
    st.description,
    get_task_public_status(st.status) AS public_status,
    (st.created_by_role = 'merchant') AS is_merchant_created,
    COALESCE(tst.title, 'أخرى') AS section_title,
    st.sort_order,
    st.created_at
  FROM store_tasks st
  LEFT JOIN task_sections_template tst ON tst.id = st.template_section_id
  WHERE st.store_id = v_access.store_id
    AND (
      -- Template tasks that are visible to merchant
      (st.type = 'template' AND st.visible_to_merchant = true)
      OR
      -- Manual tasks created by merchant
      (st.type = 'manual' AND st.created_by_role = 'merchant')
    )
  ORDER BY COALESCE(tst.sort_order, 999), st.sort_order, st.created_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- FUNCTION: Create merchant task (public)
-- إنشاء مهمة من التاجر
-- ============================================
CREATE OR REPLACE FUNCTION create_merchant_task(
  p_token TEXT,
  p_title TEXT,
  p_description TEXT DEFAULT NULL,
  p_merchant_name TEXT DEFAULT NULL,
  p_merchant_contact TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_access RECORD;
  v_task_id UUID;
BEGIN
  -- Validate access
  SELECT * INTO v_access FROM validate_public_access(p_token);
  
  IF NOT v_access.is_valid THEN
    RAISE EXCEPTION 'Invalid or expired access token';
  END IF;
  
  -- Create the task
  INSERT INTO store_tasks (
    store_id,
    type,
    title,
    description,
    created_by_role,
    merchant_name,
    merchant_contact,
    visible_to_merchant
  ) VALUES (
    v_access.store_id,
    'manual',
    p_title,
    p_description,
    'merchant',
    p_merchant_name,
    p_merchant_contact,
    true
  )
  RETURNING id INTO v_task_id;
  
  RETURN v_task_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- FUNCTION: Create manual task (manager/admin)
-- إنشاء مهمة يدوية
-- ============================================
CREATE OR REPLACE FUNCTION create_manual_task(
  p_store_id UUID,
  p_title TEXT,
  p_description TEXT DEFAULT NULL,
  p_due_date TIMESTAMPTZ DEFAULT NULL,
  p_visible_to_merchant BOOLEAN DEFAULT true
)
RETURNS UUID AS $$
DECLARE
  v_task_id UUID;
  v_role task_creator_role;
BEGIN
  -- Check permissions
  IF NOT EXISTS (
    SELECT 1 FROM stores 
    WHERE id = p_store_id 
    AND (is_admin() OR assigned_manager_id = auth.uid())
  ) THEN
    RAISE EXCEPTION 'You do not have permission to create tasks for this store';
  END IF;
  
  -- Determine creator role
  IF is_admin() THEN
    v_role := 'admin';
  ELSE
    v_role := 'manager';
  END IF;
  
  -- Create the task
  INSERT INTO store_tasks (
    store_id,
    type,
    title,
    description,
    due_date,
    created_by_id,
    created_by_role,
    visible_to_merchant
  ) VALUES (
    p_store_id,
    'manual',
    p_title,
    p_description,
    p_due_date,
    auth.uid(),
    v_role,
    p_visible_to_merchant
  )
  RETURNING id INTO v_task_id;
  
  RETURN v_task_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- FUNCTION: Update task status
-- تحديث حالة المهمة
-- ============================================
CREATE OR REPLACE FUNCTION update_task_status(
  p_task_id UUID,
  p_status store_task_status
)
RETURNS BOOLEAN AS $$
DECLARE
  v_store_id UUID;
BEGIN
  -- Get store_id
  SELECT store_id INTO v_store_id FROM store_tasks WHERE id = p_task_id;
  
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  -- Check permissions
  IF NOT EXISTS (
    SELECT 1 FROM stores 
    WHERE id = v_store_id 
    AND (is_admin() OR assigned_manager_id = auth.uid())
  ) THEN
    RAISE EXCEPTION 'You do not have permission to update this task';
  END IF;
  
  -- Update status
  UPDATE store_tasks
  SET status = p_status
  WHERE id = p_task_id;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- FUNCTION: Get store tasks with sections
-- جلب مهام المتجر مع الأقسام
-- ============================================
CREATE OR REPLACE FUNCTION get_store_tasks_grouped(p_store_id UUID)
RETURNS TABLE (
  section_id UUID,
  section_title TEXT,
  section_order INTEGER,
  task_id UUID,
  task_title TEXT,
  task_description TEXT,
  task_status store_task_status,
  task_type store_task_type,
  task_due_date TIMESTAMPTZ,
  task_is_overdue BOOLEAN,
  task_visible_to_merchant BOOLEAN,
  task_created_by_role task_creator_role,
  task_sort_order INTEGER,
  task_created_at TIMESTAMPTZ
) AS $$
BEGIN
  -- Check permissions
  IF NOT EXISTS (
    SELECT 1 FROM stores 
    WHERE id = p_store_id 
    AND (is_admin() OR assigned_manager_id = auth.uid())
  ) THEN
    RAISE EXCEPTION 'You do not have permission to view tasks for this store';
  END IF;
  
  RETURN QUERY
  SELECT 
    COALESCE(st.template_section_id, '00000000-0000-0000-0000-000000000000'::UUID) AS section_id,
    COALESCE(tst.title, 'مهام يدوية') AS section_title,
    COALESCE(tst.sort_order, 999) AS section_order,
    st.id AS task_id,
    st.title AS task_title,
    st.description AS task_description,
    st.status AS task_status,
    st.type AS task_type,
    st.due_date AS task_due_date,
    is_task_overdue(st.id) AS task_is_overdue,
    st.visible_to_merchant AS task_visible_to_merchant,
    st.created_by_role AS task_created_by_role,
    st.sort_order AS task_sort_order,
    st.created_at AS task_created_at
  FROM store_tasks st
  LEFT JOIN task_sections_template tst ON tst.id = st.template_section_id
  WHERE st.store_id = p_store_id
  ORDER BY COALESCE(tst.sort_order, 999), st.sort_order, st.created_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- ✅ Store tasks migration complete!
-- ============================================
