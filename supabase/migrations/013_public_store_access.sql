-- ============================================
-- سياسات الوصول العام لصفحة التاجر العامة
-- Public Access Policies for Public Store Page
-- ============================================

-- السماح بقراءة المتاجر للجميع (للصفحة العامة)
DROP POLICY IF EXISTS "allow_public_read_stores" ON stores;
CREATE POLICY "allow_public_read_stores" ON stores
    FOR SELECT USING (true);

-- السماح بقراءة الملفات الشخصية للجميع (لعرض بيانات المدير)
DROP POLICY IF EXISTS "allow_public_read_profiles" ON profiles;
CREATE POLICY "allow_public_read_profiles" ON profiles
    FOR SELECT USING (true);

-- السماح بقراءة المهام للجميع
DROP POLICY IF EXISTS "allow_public_read_store_tasks" ON store_tasks;
CREATE POLICY "allow_public_read_store_tasks" ON store_tasks
    FOR SELECT USING (true);

-- السماح بقراءة التعليقات للجميع
DROP POLICY IF EXISTS "allow_public_read_comments" ON store_comments;
CREATE POLICY "allow_public_read_comments" ON store_comments
    FOR SELECT USING (true);

-- السماح بإضافة التعليقات للجميع (للتاجر)
DROP POLICY IF EXISTS "allow_public_insert_comments" ON store_comments;
CREATE POLICY "allow_public_insert_comments" ON store_comments
    FOR INSERT WITH CHECK (true);

-- عرض النتيجة
SELECT 'تم إضافة سياسات الوصول العام بنجاح!' as message;
