-- ============================================
-- ZID Dashboard - Database Schema RESET
-- ⚠️ تحذير: هذا الملف يحذف جميع البيانات!
-- استخدمه فقط لإعادة إنشاء قاعدة البيانات من الصفر
-- ============================================

-- Drop triggers first (on auth.users)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Drop triggers on tables
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
DROP TRIGGER IF EXISTS update_merchants_updated_at ON merchants;
DROP TRIGGER IF EXISTS update_task_templates_updated_at ON task_templates;
DROP TRIGGER IF EXISTS update_tasks_updated_at ON tasks;
DROP TRIGGER IF EXISTS update_announcements_updated_at ON announcements;
DROP TRIGGER IF EXISTS update_meetings_updated_at ON meetings;
DROP TRIGGER IF EXISTS update_users_updated_at ON users;

-- Drop users table (it exists from old schema)
DROP TABLE IF EXISTS users CASCADE;

-- Drop tables (in correct order due to foreign keys)
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS meeting_slots CASCADE;
DROP TABLE IF EXISTS meetings CASCADE;
DROP TABLE IF EXISTS announcements CASCADE;
DROP TABLE IF EXISTS tasks CASCADE;
DROP TABLE IF EXISTS task_templates CASCADE;
DROP TABLE IF EXISTS merchants CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- Drop functions with CASCADE
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS is_admin() CASCADE;
DROP FUNCTION IF EXISTS get_my_role() CASCADE;
DROP FUNCTION IF EXISTS generate_booking_slug(TEXT) CASCADE;
DROP FUNCTION IF EXISTS mark_notification_read(UUID) CASCADE;
DROP FUNCTION IF EXISTS mark_all_notifications_read() CASCADE;

-- Drop enum types with CASCADE
DROP TYPE IF EXISTS notification_type CASCADE;
DROP TYPE IF EXISTS meeting_status CASCADE;
DROP TYPE IF EXISTS announcement_priority CASCADE;
DROP TYPE IF EXISTS task_priority CASCADE;
DROP TYPE IF EXISTS task_status CASCADE;
DROP TYPE IF EXISTS merchant_status CASCADE;
DROP TYPE IF EXISTS user_role CASCADE;

-- ============================================
-- ✅ Reset complete! Now run schema.sql
-- ============================================
