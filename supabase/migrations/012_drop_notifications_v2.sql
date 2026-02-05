-- ============================================
-- حذف جدول notifications_v2 المكرر
-- استخدام جدول notifications فقط
-- ============================================

-- حذف الجدول المكرر
DROP TABLE IF EXISTS notifications_v2 CASCADE;

-- حذف الدوال المرتبطة بـ notifications_v2 إذا وجدت
DROP FUNCTION IF EXISTS get_notifications(integer, integer, boolean) CASCADE;
DROP FUNCTION IF EXISTS get_unread_notification_count() CASCADE;
DROP FUNCTION IF EXISTS mark_notification_read_v2(uuid) CASCADE;
DROP FUNCTION IF EXISTS mark_all_notifications_read_v2() CASCADE;

-- التأكد من وجود الأعمدة المطلوبة في جدول notifications
DO $$
BEGIN
    -- إضافة عمود type إذا لم يكن موجوداً
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'type') THEN
        ALTER TABLE notifications ADD COLUMN type TEXT DEFAULT 'task';
    END IF;
    
    -- إضافة عمود priority إذا لم يكن موجوداً
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'priority') THEN
        ALTER TABLE notifications ADD COLUMN priority TEXT DEFAULT 'normal';
    END IF;
    
    -- إضافة عمود link_url إذا لم يكن موجوداً
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'link_url') THEN
        ALTER TABLE notifications ADD COLUMN link_url TEXT;
    END IF;
END $$;
