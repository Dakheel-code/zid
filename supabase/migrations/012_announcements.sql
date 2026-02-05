-- ============================================
-- جدول التعاميم
-- ============================================

-- إنشاء جدول التعاميم
CREATE TABLE IF NOT EXISTS announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'normal' CHECK (type IN ('normal', 'urgent_popup')),
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sent')),
  target_type TEXT NOT NULL DEFAULT 'all' CHECK (target_type IN ('all', 'specific')),
  send_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  created_by_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- جدول المستهدفين بالتعميم (للتعاميم الموجهة لمدراء محددين)
CREATE TABLE IF NOT EXISTS announcement_targets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  announcement_id UUID NOT NULL REFERENCES announcements(id) ON DELETE CASCADE,
  manager_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(announcement_id, manager_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_announcements_status ON announcements(status);
CREATE INDEX IF NOT EXISTS idx_announcements_created_at ON announcements(created_at);
CREATE INDEX IF NOT EXISTS idx_announcement_targets_announcement ON announcement_targets(announcement_id);
CREATE INDEX IF NOT EXISTS idx_announcement_targets_manager ON announcement_targets(manager_id);

-- RLS
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcement_targets ENABLE ROW LEVEL SECURITY;

-- سياسات التعاميم
CREATE POLICY "view_announcements" ON announcements FOR SELECT USING (true);
CREATE POLICY "insert_announcements" ON announcements FOR INSERT WITH CHECK (true);
CREATE POLICY "update_announcements" ON announcements FOR UPDATE USING (true);
CREATE POLICY "delete_announcements" ON announcements FOR DELETE USING (true);

-- سياسات المستهدفين
CREATE POLICY "view_announcement_targets" ON announcement_targets FOR SELECT USING (true);
CREATE POLICY "insert_announcement_targets" ON announcement_targets FOR INSERT WITH CHECK (true);
CREATE POLICY "update_announcement_targets" ON announcement_targets FOR UPDATE USING (true);
CREATE POLICY "delete_announcement_targets" ON announcement_targets FOR DELETE USING (true);
