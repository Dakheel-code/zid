-- ============================================
-- إعدادات الإشعارات للمدير
-- Manager Notification Settings
-- ============================================

-- إضافة أعمدة إعدادات الإشعارات في جدول profiles
DO $$
BEGIN
    -- Slack Webhook URL
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'slack_webhook_url') THEN
        ALTER TABLE profiles ADD COLUMN slack_webhook_url TEXT;
    END IF;
    
    -- WhatsApp Notification
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'whatsapp_notification') THEN
        ALTER TABLE profiles ADD COLUMN whatsapp_notification BOOLEAN DEFAULT FALSE;
    END IF;
    
    -- Email Notification
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'email_notification') THEN
        ALTER TABLE profiles ADD COLUMN email_notification BOOLEAN DEFAULT TRUE;
    END IF;
END $$;

SELECT 'تم إضافة إعدادات الإشعارات بنجاح!' as message;
