-- ============================================
-- ZID Dashboard - Phase 2.4: Task Templates
-- قوالب المهام (Admin-only)
-- ============================================

-- ============================================
-- 2.4.1 TASK_SECTIONS_TEMPLATE TABLE
-- أقسام قوالب المهام
-- ============================================
CREATE TABLE IF NOT EXISTS task_sections_template (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Section info
  title TEXT NOT NULL,
  
  -- Order for display
  sort_order INTEGER NOT NULL DEFAULT 0,
  
  -- WhatsApp template (optional)
  whatsapp_template TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 2.4.2 TASKS_TEMPLATE TABLE
-- قوالب المهام
-- ============================================
CREATE TABLE IF NOT EXISTS tasks_template (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Section reference
  section_id UUID NOT NULL REFERENCES task_sections_template(id) ON DELETE CASCADE,
  
  -- Task info
  title TEXT NOT NULL,
  description TEXT,
  
  -- Order for display
  sort_order INTEGER NOT NULL DEFAULT 0,
  
  -- WhatsApp template (optional)
  whatsapp_template TEXT,
  
  -- Visibility to merchant
  visible_to_merchant BOOLEAN NOT NULL DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_task_sections_template_order ON task_sections_template(sort_order);
CREATE INDEX IF NOT EXISTS idx_tasks_template_section_id ON tasks_template(section_id);
CREATE INDEX IF NOT EXISTS idx_tasks_template_order ON tasks_template(section_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_tasks_template_visible ON tasks_template(visible_to_merchant) WHERE visible_to_merchant = true;

-- ============================================
-- TRIGGERS: Auto-update updated_at
-- ============================================
DROP TRIGGER IF EXISTS update_task_sections_template_updated_at ON task_sections_template;
CREATE TRIGGER update_task_sections_template_updated_at
  BEFORE UPDATE ON task_sections_template
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_tasks_template_updated_at ON tasks_template;
CREATE TRIGGER update_tasks_template_updated_at
  BEFORE UPDATE ON tasks_template
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ENABLE RLS
-- ============================================
ALTER TABLE task_sections_template ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks_template ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES - Admin only CRUD
-- ============================================

-- Task Sections Template
DROP POLICY IF EXISTS "task_sections_template_admin_all" ON task_sections_template;
DROP POLICY IF EXISTS "task_sections_template_read_all" ON task_sections_template;

-- Admin full access
CREATE POLICY "task_sections_template_admin_all"
  ON task_sections_template FOR ALL
  USING (is_admin());

-- Everyone can read (for managers to see templates)
CREATE POLICY "task_sections_template_read_all"
  ON task_sections_template FOR SELECT
  USING (true);

-- Tasks Template
DROP POLICY IF EXISTS "tasks_template_admin_all" ON tasks_template;
DROP POLICY IF EXISTS "tasks_template_read_all" ON tasks_template;

-- Admin full access
CREATE POLICY "tasks_template_admin_all"
  ON tasks_template FOR ALL
  USING (is_admin());

-- Everyone can read (for managers to see templates)
CREATE POLICY "tasks_template_read_all"
  ON tasks_template FOR SELECT
  USING (true);

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to get all sections with their tasks
CREATE OR REPLACE FUNCTION get_task_templates_with_sections()
RETURNS TABLE (
  section_id UUID,
  section_title TEXT,
  section_order INTEGER,
  section_whatsapp_template TEXT,
  task_id UUID,
  task_title TEXT,
  task_description TEXT,
  task_order INTEGER,
  task_whatsapp_template TEXT,
  task_visible_to_merchant BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id AS section_id,
    s.title AS section_title,
    s.sort_order AS section_order,
    s.whatsapp_template AS section_whatsapp_template,
    t.id AS task_id,
    t.title AS task_title,
    t.description AS task_description,
    t.sort_order AS task_order,
    t.whatsapp_template AS task_whatsapp_template,
    t.visible_to_merchant AS task_visible_to_merchant
  FROM task_sections_template s
  LEFT JOIN tasks_template t ON t.section_id = s.id
  ORDER BY s.sort_order, t.sort_order;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create a section (admin only)
CREATE OR REPLACE FUNCTION create_task_section(
  p_title TEXT,
  p_sort_order INTEGER DEFAULT 0,
  p_whatsapp_template TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_section_id UUID;
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Only admins can create task sections';
  END IF;
  
  INSERT INTO task_sections_template (title, sort_order, whatsapp_template)
  VALUES (p_title, p_sort_order, p_whatsapp_template)
  RETURNING id INTO v_section_id;
  
  RETURN v_section_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create a task template (admin only)
CREATE OR REPLACE FUNCTION create_task_template(
  p_section_id UUID,
  p_title TEXT,
  p_description TEXT DEFAULT NULL,
  p_sort_order INTEGER DEFAULT 0,
  p_whatsapp_template TEXT DEFAULT NULL,
  p_visible_to_merchant BOOLEAN DEFAULT true
)
RETURNS UUID AS $$
DECLARE
  v_task_id UUID;
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Only admins can create task templates';
  END IF;
  
  INSERT INTO tasks_template (
    section_id, title, description, sort_order, 
    whatsapp_template, visible_to_merchant
  )
  VALUES (
    p_section_id, p_title, p_description, p_sort_order,
    p_whatsapp_template, p_visible_to_merchant
  )
  RETURNING id INTO v_task_id;
  
  RETURN v_task_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to reorder sections
CREATE OR REPLACE FUNCTION reorder_task_sections(p_section_ids UUID[])
RETURNS BOOLEAN AS $$
DECLARE
  v_order INTEGER := 0;
  v_section_id UUID;
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Only admins can reorder sections';
  END IF;
  
  FOREACH v_section_id IN ARRAY p_section_ids LOOP
    UPDATE task_sections_template
    SET sort_order = v_order
    WHERE id = v_section_id;
    v_order := v_order + 1;
  END LOOP;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to reorder tasks within a section
CREATE OR REPLACE FUNCTION reorder_section_tasks(p_section_id UUID, p_task_ids UUID[])
RETURNS BOOLEAN AS $$
DECLARE
  v_order INTEGER := 0;
  v_task_id UUID;
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Only admins can reorder tasks';
  END IF;
  
  FOREACH v_task_id IN ARRAY p_task_ids LOOP
    UPDATE tasks_template
    SET sort_order = v_order
    WHERE id = v_task_id AND section_id = p_section_id;
    v_order := v_order + 1;
  END LOOP;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- ✅ Task templates migration complete!
-- ============================================
