-- ============================================
-- ZID Dashboard - Store Comments System
-- نظام التعليقات للمتاجر
-- ============================================

-- جدول التعليقات
CREATE TABLE IF NOT EXISTS store_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  
  -- معلومات المرسل
  sender_type TEXT NOT NULL CHECK (sender_type IN ('merchant', 'manager')),
  sender_name TEXT, -- اسم التاجر إذا كان المرسل تاجر
  manager_id UUID REFERENCES profiles(id), -- معرف المدير إذا كان المرسل مدير
  
  -- محتوى التعليق
  content TEXT NOT NULL,
  
  -- حالة التعليق
  is_read BOOLEAN DEFAULT FALSE,
  
  -- التواريخ
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- فهرس للبحث السريع
CREATE INDEX IF NOT EXISTS idx_store_comments_store_id ON store_comments(store_id);
CREATE INDEX IF NOT EXISTS idx_store_comments_created_at ON store_comments(created_at DESC);

-- تفعيل RLS
ALTER TABLE store_comments ENABLE ROW LEVEL SECURITY;

-- سياسات الوصول
CREATE POLICY "allow_read_comments" ON store_comments FOR SELECT USING (true);
CREATE POLICY "allow_insert_comments" ON store_comments FOR INSERT WITH CHECK (true);
CREATE POLICY "allow_update_comments" ON store_comments FOR UPDATE USING (true);

-- Trigger لتحديث updated_at
CREATE OR REPLACE FUNCTION update_store_comments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_store_comments_updated_at ON store_comments;
CREATE TRIGGER trigger_update_store_comments_updated_at
  BEFORE UPDATE ON store_comments
  FOR EACH ROW EXECUTE FUNCTION update_store_comments_updated_at();

-- ============================================
-- Trigger to notify manager when merchant sends a comment
-- إشعار مدير العلاقة عند وصول تعليق من التاجر
-- ============================================
CREATE OR REPLACE FUNCTION notify_manager_on_merchant_comment()
RETURNS TRIGGER AS $$
DECLARE
    v_manager_id UUID;
    v_store_name TEXT;
BEGIN
    -- Only trigger for merchant comments
    IF NEW.sender_type = 'merchant' THEN
        -- Get the manager assigned to this store
        SELECT assigned_manager_id, store_name INTO v_manager_id, v_store_name
        FROM stores
        WHERE id = NEW.store_id;
        
        -- If manager exists, create notification
        IF v_manager_id IS NOT NULL THEN
            INSERT INTO notifications (
                recipient_user_id,
                title,
                body,
                type,
                priority,
                link_url,
                is_read,
                created_at
            ) VALUES (
                v_manager_id,
                'تعليق جديد من التاجر',
                'وصلك تعليق جديد من متجر: ' || COALESCE(v_store_name, 'غير معروف'),
                'task',
                'normal',
                '/manager/store/' || NEW.store_id::TEXT,
                false,
                NOW()
            );
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_notify_manager_on_merchant_comment ON store_comments;
CREATE TRIGGER trigger_notify_manager_on_merchant_comment
    AFTER INSERT ON store_comments
    FOR EACH ROW
    EXECUTE FUNCTION notify_manager_on_merchant_comment();

-- عرض النتيجة
SELECT 'تم إنشاء جدول التعليقات بنجاح!' as message;
