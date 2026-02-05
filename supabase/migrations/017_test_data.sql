-- ============================================
-- بيانات اختبار حقيقية
-- Test Data for Dashboard
-- ============================================

-- إضافة مدراء علاقات إضافيين (إذا لم يكونوا موجودين)
-- ملاحظة: يجب إنشاء المستخدمين أولاً في auth.users ثم في profiles

-- إضافة متاجر اختبارية
INSERT INTO stores (store_name, store_url, email, phone, status, manager_id, created_at)
SELECT 
    'متجر الأناقة',
    'https://elegance.zid.store',
    'elegance@test.com',
    '+966501234567',
    'active',
    (SELECT id FROM profiles WHERE role = 'manager' LIMIT 1),
    NOW() - INTERVAL '2 days'
WHERE NOT EXISTS (SELECT 1 FROM stores WHERE store_name = 'متجر الأناقة');

INSERT INTO stores (store_name, store_url, email, phone, status, manager_id, created_at)
SELECT 
    'متجر التقنية',
    'https://tech.zid.store',
    'tech@test.com',
    '+966502345678',
    'active',
    (SELECT id FROM profiles WHERE role = 'manager' LIMIT 1),
    NOW() - INTERVAL '3 days'
WHERE NOT EXISTS (SELECT 1 FROM stores WHERE store_name = 'متجر التقنية');

INSERT INTO stores (store_name, store_url, email, phone, status, manager_id, created_at)
SELECT 
    'متجر الموضة',
    'https://fashion.zid.store',
    'fashion@test.com',
    '+966503456789',
    'active',
    (SELECT id FROM profiles WHERE role = 'manager' LIMIT 1),
    NOW() - INTERVAL '1 day'
WHERE NOT EXISTS (SELECT 1 FROM stores WHERE store_name = 'متجر الموضة');

INSERT INTO stores (store_name, store_url, email, phone, status, manager_id, created_at)
SELECT 
    'متجر الإلكترونيات',
    'https://electronics.zid.store',
    'electronics@test.com',
    '+966504567890',
    'active',
    (SELECT id FROM profiles WHERE role = 'manager' LIMIT 1),
    NOW()
WHERE NOT EXISTS (SELECT 1 FROM stores WHERE store_name = 'متجر الإلكترونيات');

-- إضافة مهام اختبارية
INSERT INTO tasks (title, description, status, priority, assigned_to, store_id, due_date, created_at)
SELECT 
    'تحسين صفحة المنتجات',
    'تحسين عرض المنتجات وإضافة فلاتر',
    'completed',
    'high',
    (SELECT id FROM profiles WHERE role = 'manager' LIMIT 1),
    (SELECT id FROM stores LIMIT 1),
    NOW() - INTERVAL '5 days',
    NOW() - INTERVAL '10 days'
WHERE NOT EXISTS (SELECT 1 FROM tasks WHERE title = 'تحسين صفحة المنتجات');

INSERT INTO tasks (title, description, status, priority, assigned_to, store_id, due_date, created_at)
SELECT 
    'إعداد حملة تسويقية',
    'إعداد حملة تسويقية لموسم الصيف',
    'completed',
    'medium',
    (SELECT id FROM profiles WHERE role = 'manager' LIMIT 1),
    (SELECT id FROM stores LIMIT 1),
    NOW() - INTERVAL '3 days',
    NOW() - INTERVAL '7 days'
WHERE NOT EXISTS (SELECT 1 FROM tasks WHERE title = 'إعداد حملة تسويقية');

INSERT INTO tasks (title, description, status, priority, assigned_to, store_id, due_date, created_at)
SELECT 
    'مراجعة المخزون',
    'مراجعة المخزون وتحديث الكميات',
    'in_progress',
    'high',
    (SELECT id FROM profiles WHERE role = 'manager' LIMIT 1),
    (SELECT id FROM stores LIMIT 1),
    NOW() + INTERVAL '2 days',
    NOW() - INTERVAL '2 days'
WHERE NOT EXISTS (SELECT 1 FROM tasks WHERE title = 'مراجعة المخزون');

INSERT INTO tasks (title, description, status, priority, assigned_to, store_id, due_date, created_at)
SELECT 
    'تدريب فريق الدعم',
    'تدريب فريق الدعم على النظام الجديد',
    'pending',
    'medium',
    (SELECT id FROM profiles WHERE role = 'manager' LIMIT 1),
    (SELECT id FROM stores LIMIT 1),
    NOW() + INTERVAL '5 days',
    NOW()
WHERE NOT EXISTS (SELECT 1 FROM tasks WHERE title = 'تدريب فريق الدعم');

-- إضافة تقييمات للمدير
INSERT INTO manager_ratings (manager_id, store_id, rating, comment, created_at)
SELECT 
    (SELECT id FROM profiles WHERE role = 'manager' LIMIT 1),
    (SELECT id FROM stores LIMIT 1),
    5,
    'خدمة ممتازة ومتابعة رائعة',
    NOW() - INTERVAL '1 day'
WHERE NOT EXISTS (
    SELECT 1 FROM manager_ratings 
    WHERE comment = 'خدمة ممتازة ومتابعة رائعة'
);

INSERT INTO manager_ratings (manager_id, store_id, rating, comment, created_at)
SELECT 
    (SELECT id FROM profiles WHERE role = 'manager' LIMIT 1),
    (SELECT id FROM stores OFFSET 1 LIMIT 1),
    4,
    'تواصل جيد وحلول سريعة',
    NOW() - INTERVAL '2 days'
WHERE NOT EXISTS (
    SELECT 1 FROM manager_ratings 
    WHERE comment = 'تواصل جيد وحلول سريعة'
);

INSERT INTO manager_ratings (manager_id, store_id, rating, comment, created_at)
SELECT 
    (SELECT id FROM profiles WHERE role = 'manager' LIMIT 1),
    (SELECT id FROM stores OFFSET 2 LIMIT 1),
    5,
    'أفضل مدير تعاملت معه',
    NOW() - INTERVAL '3 days'
WHERE NOT EXISTS (
    SELECT 1 FROM manager_ratings 
    WHERE comment = 'أفضل مدير تعاملت معه'
);

-- إضافة تعليقات
INSERT INTO store_comments (store_id, user_id, content, created_at)
SELECT 
    (SELECT id FROM stores LIMIT 1),
    (SELECT id FROM profiles WHERE role = 'manager' LIMIT 1),
    'تم التواصل مع العميل وحل المشكلة',
    NOW() - INTERVAL '1 hour'
WHERE NOT EXISTS (
    SELECT 1 FROM store_comments 
    WHERE content = 'تم التواصل مع العميل وحل المشكلة'
);

INSERT INTO store_comments (store_id, user_id, content, created_at)
SELECT 
    (SELECT id FROM stores LIMIT 1),
    (SELECT id FROM profiles WHERE role = 'manager' LIMIT 1),
    'متابعة طلب الدعم الفني',
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM store_comments 
    WHERE content = 'متابعة طلب الدعم الفني'
);

-- إضافة اجتماعات
INSERT INTO meetings (title, description, meeting_date, meeting_type, status, manager_id, store_id, created_at)
SELECT 
    'اجتماع متابعة شهري',
    'مراجعة أداء المتجر خلال الشهر',
    NOW() + INTERVAL '1 day',
    'follow_up',
    'scheduled',
    (SELECT id FROM profiles WHERE role = 'manager' LIMIT 1),
    (SELECT id FROM stores LIMIT 1),
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM meetings 
    WHERE title = 'اجتماع متابعة شهري'
);

INSERT INTO meetings (title, description, meeting_date, meeting_type, status, manager_id, store_id, created_at)
SELECT 
    'اجتماع تدريبي',
    'تدريب على الميزات الجديدة',
    NOW() + INTERVAL '3 days',
    'training',
    'scheduled',
    (SELECT id FROM profiles WHERE role = 'manager' LIMIT 1),
    (SELECT id FROM stores OFFSET 1 LIMIT 1),
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM meetings 
    WHERE title = 'اجتماع تدريبي'
);

SELECT 'تم إضافة البيانات الاختبارية بنجاح!' as message;
