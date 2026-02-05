-- ============================================
-- نظام تقييم مدير العلاقة
-- Manager Rating System
-- ============================================

-- جدول التقييمات
CREATE TABLE IF NOT EXISTS manager_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- المدير المُقيَّم
  manager_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- المتجر الذي قام بالتقييم
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  
  -- التقييم (1-5 نجوم)
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  
  -- تعليق اختياري
  comment TEXT,
  
  -- التواريخ
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- منع التقييم المتكرر من نفس المتجر
  UNIQUE(manager_id, store_id)
);

-- فهرس للبحث السريع
CREATE INDEX IF NOT EXISTS idx_manager_ratings_manager_id ON manager_ratings(manager_id);
CREATE INDEX IF NOT EXISTS idx_manager_ratings_store_id ON manager_ratings(store_id);

-- تفعيل RLS
ALTER TABLE manager_ratings ENABLE ROW LEVEL SECURITY;

-- سياسات الوصول
DROP POLICY IF EXISTS "allow_public_read_ratings" ON manager_ratings;
CREATE POLICY "allow_public_read_ratings" ON manager_ratings
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "allow_public_insert_ratings" ON manager_ratings;
CREATE POLICY "allow_public_insert_ratings" ON manager_ratings
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "allow_public_update_ratings" ON manager_ratings;
CREATE POLICY "allow_public_update_ratings" ON manager_ratings
    FOR UPDATE USING (true);

-- Trigger لتحديث updated_at
CREATE OR REPLACE FUNCTION update_manager_ratings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_manager_ratings_updated_at ON manager_ratings;
CREATE TRIGGER trigger_update_manager_ratings_updated_at
  BEFORE UPDATE ON manager_ratings
  FOR EACH ROW EXECUTE FUNCTION update_manager_ratings_updated_at();

-- دالة لحساب متوسط تقييم المدير
CREATE OR REPLACE FUNCTION get_manager_average_rating(p_manager_id UUID)
RETURNS TABLE(average_rating NUMERIC, total_ratings BIGINT) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ROUND(AVG(rating)::NUMERIC, 1) as average_rating,
    COUNT(*) as total_ratings
  FROM manager_ratings
  WHERE manager_id = p_manager_id;
END;
$$ LANGUAGE plpgsql;

SELECT 'تم إنشاء نظام التقييمات بنجاح!' as message;
