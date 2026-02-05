-- ============================================
-- إضافة دعم المرفقات للتعليقات
-- Comment Attachments Support
-- ============================================

-- إضافة أعمدة المرفقات إذا لم تكن موجودة
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'store_comments' AND column_name = 'attachment_url') THEN
        ALTER TABLE store_comments ADD COLUMN attachment_url TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'store_comments' AND column_name = 'attachment_type') THEN
        ALTER TABLE store_comments ADD COLUMN attachment_type TEXT CHECK (attachment_type IN ('image', 'file'));
    END IF;
END $$;

-- إنشاء bucket للمرفقات (يجب تشغيله في Supabase Dashboard > Storage)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('comment-attachments', 'comment-attachments', true);

-- سياسات التخزين للمرفقات
-- يجب تشغيلها في Supabase Dashboard > Storage > Policies

-- تفعيل Realtime للتعليقات (إذا لم يكن مفعلاً)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND tablename = 'store_comments'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE store_comments;
    END IF;
END $$;

SELECT 'تم إضافة دعم المرفقات بنجاح!' as message;
