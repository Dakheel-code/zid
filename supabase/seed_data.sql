-- ============================================
-- ZID Dashboard - SEED DATA
-- بيانات تجريبية للاختبار
-- شغل هذا الملف في Supabase SQL Editor
-- ============================================

-- ============================================
-- 1. إضافة مستخدمين تجريبيين
-- ============================================
-- ملاحظة: يجب إنشاء المستخدمين أولاً من Authentication في Supabase
-- ثم تحديث الـ profiles

-- إذا كان لديك مستخدم مسجل، حدث الـ profile ليكون admin:
-- UPDATE profiles SET role = 'admin', name = 'مدير النظام' WHERE email = 'your-email@example.com';

-- ============================================
-- 2. إضافة متاجر تجريبية
-- ============================================
INSERT INTO stores (id, store_url, store_name, owner_name, owner_email, owner_phone, priority, status, notes) VALUES
  ('11111111-1111-1111-1111-111111111111', 'https://electronics.zid.store', 'متجر الإلكترونيات', 'أحمد محمد', 'ahmed@example.com', '+966501234567', 'high', 'active', 'عميل مميز'),
  ('22222222-2222-2222-2222-222222222222', 'https://fashion.zid.store', 'متجر الأزياء', 'سارة أحمد', 'sara@example.com', '+966507654321', 'medium', 'new', 'متجر جديد'),
  ('33333333-3333-3333-3333-333333333333', 'https://home.zid.store', 'متجر المنزل', 'فاطمة علي', 'fatima@example.com', '+966509876543', 'low', 'active', NULL),
  ('44444444-4444-4444-4444-444444444444', 'https://beauty.zid.store', 'متجر الجمال', 'نورة سعد', 'noura@example.com', '+966501112233', 'high', 'new', 'يحتاج متابعة'),
  ('55555555-5555-5555-5555-555555555555', 'https://sports.zid.store', 'متجر الرياضة', 'خالد عمر', 'khaled@example.com', '+966504445566', 'medium', 'paused', 'متوقف مؤقتاً')
ON CONFLICT (id) DO UPDATE SET
  store_name = EXCLUDED.store_name,
  owner_name = EXCLUDED.owner_name,
  owner_email = EXCLUDED.owner_email,
  owner_phone = EXCLUDED.owner_phone,
  priority = EXCLUDED.priority,
  status = EXCLUDED.status,
  notes = EXCLUDED.notes;

-- ============================================
-- 3. إضافة روابط عامة للمتاجر
-- ============================================
INSERT INTO store_public_links (store_id, public_token) VALUES
  ('11111111-1111-1111-1111-111111111111', 'abc123xyz789electronics0000000000000000'),
  ('22222222-2222-2222-2222-222222222222', 'def456uvw012fashion00000000000000000000'),
  ('33333333-3333-3333-3333-333333333333', 'ghi789rst345home0000000000000000000000'),
  ('44444444-4444-4444-4444-444444444444', 'jkl012mno678beauty000000000000000000000'),
  ('55555555-5555-5555-5555-555555555555', 'pqr345stu901sports000000000000000000000')
ON CONFLICT (public_token) DO NOTHING;

-- ============================================
-- 4. إضافة مهام للمتاجر
-- ============================================
INSERT INTO store_tasks (store_id, type, title, description, status, visible_to_merchant, created_by_role) VALUES
  ('11111111-1111-1111-1111-111111111111', 'template', 'مراجعة إعدادات المتجر', 'التأكد من إعدادات المتجر الأساسية', 'done', true, 'admin'),
  ('11111111-1111-1111-1111-111111111111', 'template', 'إضافة طرق الدفع', NULL, 'done', true, 'admin'),
  ('11111111-1111-1111-1111-111111111111', 'template', 'إعداد الشحن', NULL, 'in_progress', true, 'admin'),
  ('11111111-1111-1111-1111-111111111111', 'manual', 'تحسين صور المنتجات', 'رفع صور عالية الجودة', 'new', false, 'manager'),
  ('22222222-2222-2222-2222-222222222222', 'template', 'مراجعة إعدادات المتجر', NULL, 'new', true, 'admin'),
  ('22222222-2222-2222-2222-222222222222', 'template', 'إضافة طرق الدفع', NULL, 'new', true, 'admin'),
  ('33333333-3333-3333-3333-333333333333', 'template', 'مراجعة إعدادات المتجر', NULL, 'done', true, 'admin'),
  ('33333333-3333-3333-3333-333333333333', 'manual', 'طلب من التاجر: تفعيل الدفع الإلكتروني', 'التاجر يريد تفعيل Apple Pay', 'new', true, 'merchant')
ON CONFLICT DO NOTHING;

-- ============================================
-- 5. إضافة تعاميم تجريبية
-- ============================================
INSERT INTO announcements_v2 (id, title, content, type, priority, status, sent_at) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'تحديث جديد للنظام', 'تم إضافة ميزات جديدة للوحة التحكم تشمل تحسينات في الأداء وواجهة المستخدم.', 'normal', 'normal', 'sent', NOW()),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'إجازة عيد الفطر', 'نود إعلامكم بأن الدعم الفني سيكون متاحاً خلال إجازة العيد من الساعة 10 صباحاً حتى 4 مساءً.', 'normal', 'high', 'sent', NOW() - INTERVAL '2 days'),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'تنبيه عاجل: صيانة مجدولة', 'سيتم إجراء صيانة للنظام يوم الخميس من الساعة 2-4 صباحاً.', 'urgent_popup', 'high', 'sent', NOW() - INTERVAL '1 day')
ON CONFLICT (id) DO NOTHING;

-- إضافة targets للتعاميم (لجميع المدراء)
INSERT INTO announcement_targets (announcement_id, target_type) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'all'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'all'),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'all')
ON CONFLICT DO NOTHING;

-- ============================================
-- ✅ SEED DATA COMPLETE!
-- ============================================
SELECT 'تم إضافة البيانات التجريبية بنجاح!' as message;
