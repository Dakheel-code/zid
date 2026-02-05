-- ============================================
-- ZID Dashboard - Phase 3.2, 3.3, 3.4: Business Logic
-- منطق المهام والتعاميم والاجتماعات
-- ============================================

-- ============================================
-- 3.2 MERCHANT TASK CREATION (Public)
-- إنشاء مهمة من التاجر
-- ============================================

-- Function: Create task from merchant (public via token)
CREATE OR REPLACE FUNCTION create_merchant_task_v2(
  p_token TEXT,
  p_title TEXT,
  p_description TEXT DEFAULT NULL,
  p_merchant_name TEXT DEFAULT NULL,
  p_merchant_contact TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_access RECORD;
  v_task_id UUID;
  v_store stores%ROWTYPE;
BEGIN
  -- Validate access token
  SELECT * INTO v_access FROM validate_public_access(p_token);
  
  IF NOT v_access.is_valid THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', v_access.reason
    );
  END IF;

  -- Get store details
  SELECT * INTO v_store FROM stores WHERE id = v_access.store_id;

  -- Create the task
  INSERT INTO store_tasks (
    store_id,
    type,
    title,
    description,
    created_by_role,
    merchant_name,
    merchant_contact,
    visible_to_merchant,
    status
  ) VALUES (
    v_access.store_id,
    'manual',
    p_title,
    p_description,
    'merchant',
    COALESCE(p_merchant_name, v_store.owner_name),
    COALESCE(p_merchant_contact, v_store.owner_email),
    true,
    'new'
  )
  RETURNING id INTO v_task_id;

  -- Send notification to assigned manager
  IF v_store.assigned_manager_id IS NOT NULL THEN
    PERFORM create_notification(
      p_recipient_user_id := v_store.assigned_manager_id,
      p_type := 'task'::notification_type_v2,
      p_event_key := 'task.merchant_created',
      p_title := 'مهمة جديدة من التاجر',
      p_body := 'أضاف التاجر مهمة جديدة: ' || p_title,
      p_link_url := '/manager/stores/' || v_access.store_id::TEXT || '/tasks/' || v_task_id::TEXT,
      p_metadata := jsonb_build_object(
        'store_id', v_access.store_id,
        'store_name', v_store.store_name,
        'task_id', v_task_id,
        'task_title', p_title,
        'merchant_name', COALESCE(p_merchant_name, v_store.owner_name)
      ),
      p_priority := 'important'::notification_priority_v2
    );
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'task_id', v_task_id
  );

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 3.3 ANNOUNCEMENTS WORKFLOW
-- منطق التعاميم
-- ============================================

-- Function: Send announcement and create notifications
CREATE OR REPLACE FUNCTION send_announcement_v2(p_announcement_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_announcement announcements_v2%ROWTYPE;
  v_target RECORD;
  v_manager RECORD;
  v_notification_count INTEGER := 0;
BEGIN
  -- Check if admin
  IF NOT is_admin() THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Only admins can send announcements'
    );
  END IF;

  -- Get announcement
  SELECT * INTO v_announcement FROM announcements_v2 WHERE id = p_announcement_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Announcement not found'
    );
  END IF;

  IF v_announcement.status = 'sent' THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Announcement already sent'
    );
  END IF;

  -- Update announcement status
  UPDATE announcements_v2
  SET status = 'sent', sent_at = NOW()
  WHERE id = p_announcement_id;

  -- Get targets and create notifications
  FOR v_target IN 
    SELECT * FROM announcement_targets WHERE announcement_id = p_announcement_id
  LOOP
    IF v_target.target_type = 'all' THEN
      -- Send to all managers
      FOR v_manager IN 
        SELECT id, name FROM profiles WHERE role = 'manager'
      LOOP
        PERFORM create_notification(
          p_recipient_user_id := v_manager.id,
          p_type := 'announcement'::notification_type_v2,
          p_event_key := CASE 
            WHEN v_announcement.type = 'urgent_popup' THEN 'announcement.urgent'
            ELSE 'announcement.new'
          END,
          p_title := v_announcement.title,
          p_body := LEFT(v_announcement.content, 200),
          p_link_url := '/manager/announcements/' || p_announcement_id::TEXT,
          p_metadata := jsonb_build_object(
            'announcement_id', p_announcement_id,
            'type', v_announcement.type,
            'is_popup', v_announcement.type = 'urgent_popup'
          ),
          p_priority := CASE 
            WHEN v_announcement.type = 'urgent_popup' THEN 'urgent'::notification_priority_v2
            WHEN v_announcement.priority = 'high' THEN 'important'::notification_priority_v2
            ELSE 'normal'::notification_priority_v2
          END
        );
        v_notification_count := v_notification_count + 1;
      END LOOP;
    ELSE
      -- Send to specific manager
      IF v_target.manager_id IS NOT NULL THEN
        PERFORM create_notification(
          p_recipient_user_id := v_target.manager_id,
          p_type := 'announcement'::notification_type_v2,
          p_event_key := CASE 
            WHEN v_announcement.type = 'urgent_popup' THEN 'announcement.urgent'
            ELSE 'announcement.new'
          END,
          p_title := v_announcement.title,
          p_body := LEFT(v_announcement.content, 200),
          p_link_url := '/manager/announcements/' || p_announcement_id::TEXT,
          p_metadata := jsonb_build_object(
            'announcement_id', p_announcement_id,
            'type', v_announcement.type,
            'is_popup', v_announcement.type = 'urgent_popup'
          ),
          p_priority := CASE 
            WHEN v_announcement.type = 'urgent_popup' THEN 'urgent'::notification_priority_v2
            WHEN v_announcement.priority = 'high' THEN 'important'::notification_priority_v2
            ELSE 'normal'::notification_priority_v2
          END
        );
        v_notification_count := v_notification_count + 1;
      END IF;
    END IF;
  END LOOP;

  RETURN jsonb_build_object(
    'success', true,
    'notifications_sent', v_notification_count
  );

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get pending urgent popups for current user
CREATE OR REPLACE FUNCTION get_pending_urgent_popups()
RETURNS TABLE (
  announcement_id UUID,
  title TEXT,
  content TEXT,
  priority announcement_priority_level,
  sent_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.id AS announcement_id,
    a.title,
    a.content,
    a.priority,
    a.sent_at
  FROM announcements_v2 a
  LEFT JOIN announcement_reads ar ON ar.announcement_id = a.id AND ar.user_id = auth.uid()
  WHERE a.status = 'sent'
    AND a.type = 'urgent_popup'
    AND (ar.popup_dismissed_at IS NULL)
    AND (
      EXISTS (
        SELECT 1 FROM announcement_targets t 
        WHERE t.announcement_id = a.id AND t.target_type = 'all'
      )
      OR
      EXISTS (
        SELECT 1 FROM announcement_targets t 
        WHERE t.announcement_id = a.id 
        AND t.target_type = 'specific' 
        AND t.manager_id = auth.uid()
      )
    )
  ORDER BY a.priority DESC, a.sent_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 3.4 MEETINGS WORKFLOW
-- منطق الاجتماعات
-- ============================================

-- Function: Book meeting (public via booking slug)
CREATE OR REPLACE FUNCTION book_meeting_v2(
  p_booking_slug TEXT,
  p_start_at TIMESTAMPTZ,
  p_guest_name TEXT,
  p_guest_email TEXT,
  p_guest_phone TEXT DEFAULT NULL,
  p_guest_notes TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_manager_id UUID;
  v_manager profiles%ROWTYPE;
  v_settings meeting_settings%ROWTYPE;
  v_end_at TIMESTAMPTZ;
  v_meeting_id UUID;
BEGIN
  -- Get manager by booking slug
  SELECT * INTO v_manager 
  FROM profiles 
  WHERE booking_slug = p_booking_slug AND role = 'manager';
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Manager not found'
    );
  END IF;
  
  v_manager_id := v_manager.id;

  -- Get settings
  SELECT * INTO v_settings FROM meeting_settings WHERE manager_id = v_manager_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Manager has not configured meeting settings'
    );
  END IF;

  -- Calculate end time
  v_end_at := p_start_at + (v_settings.duration_minutes || ' minutes')::INTERVAL;

  -- Check if slot is available
  IF NOT EXISTS (
    SELECT 1 FROM get_available_slots(v_manager_id, p_start_at::DATE) 
    WHERE slot_start = p_start_at
  ) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Selected time slot is not available'
    );
  END IF;

  -- Create meeting
  INSERT INTO meetings_v2 (
    manager_id, start_at, end_at,
    guest_name, guest_email, guest_phone, guest_notes,
    status
  ) VALUES (
    v_manager_id, p_start_at, v_end_at,
    p_guest_name, p_guest_email, p_guest_phone, p_guest_notes,
    'booked'
  )
  RETURNING id INTO v_meeting_id;

  -- Send notification to manager
  PERFORM create_notification(
    p_recipient_user_id := v_manager_id,
    p_type := 'meeting'::notification_type_v2,
    p_event_key := 'meeting.booked',
    p_title := 'اجتماع جديد محجوز',
    p_body := 'تم حجز اجتماع جديد مع ' || p_guest_name || ' في ' || to_char(p_start_at AT TIME ZONE v_settings.timezone, 'DD/MM/YYYY HH24:MI'),
    p_link_url := '/manager/meetings/' || v_meeting_id::TEXT,
    p_metadata := jsonb_build_object(
      'meeting_id', v_meeting_id,
      'guest_name', p_guest_name,
      'guest_email', p_guest_email,
      'start_at', p_start_at,
      'end_at', v_end_at
    ),
    p_priority := 'important'::notification_priority_v2
  );

  -- Return success with meeting details
  RETURN jsonb_build_object(
    'success', true,
    'meeting_id', v_meeting_id,
    'meeting', jsonb_build_object(
      'id', v_meeting_id,
      'manager_name', v_manager.name,
      'start_at', p_start_at,
      'end_at', v_end_at,
      'duration_minutes', v_settings.duration_minutes,
      'timezone', v_settings.timezone
    )
  );

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Cancel meeting (with notification)
CREATE OR REPLACE FUNCTION cancel_meeting_v2(
  p_meeting_id UUID,
  p_reason TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_meeting meetings_v2%ROWTYPE;
  v_settings meeting_settings%ROWTYPE;
BEGIN
  -- Get meeting
  SELECT * INTO v_meeting FROM meetings_v2 WHERE id = p_meeting_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Meeting not found'
    );
  END IF;

  -- Check permissions (manager or admin)
  IF NOT (is_admin() OR v_meeting.manager_id = auth.uid()) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'You do not have permission to cancel this meeting'
    );
  END IF;

  IF v_meeting.status = 'cancelled' THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Meeting already cancelled'
    );
  END IF;

  -- Cancel meeting
  UPDATE meetings_v2
  SET status = 'cancelled', 
      cancelled_at = NOW(),
      cancellation_reason = p_reason
  WHERE id = p_meeting_id;

  -- Get settings for timezone
  SELECT * INTO v_settings FROM meeting_settings WHERE manager_id = v_meeting.manager_id;

  -- Notify manager if cancelled by admin
  IF is_admin() AND v_meeting.manager_id != auth.uid() THEN
    PERFORM create_notification(
      p_recipient_user_id := v_meeting.manager_id,
      p_type := 'meeting'::notification_type_v2,
      p_event_key := 'meeting.cancelled',
      p_title := 'تم إلغاء اجتماع',
      p_body := 'تم إلغاء الاجتماع مع ' || v_meeting.guest_name || ' في ' || 
                to_char(v_meeting.start_at AT TIME ZONE COALESCE(v_settings.timezone, 'Asia/Riyadh'), 'DD/MM/YYYY HH24:MI'),
      p_link_url := '/manager/meetings/' || p_meeting_id::TEXT,
      p_metadata := jsonb_build_object(
        'meeting_id', p_meeting_id,
        'guest_name', v_meeting.guest_name,
        'reason', p_reason
      )
    );
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'meeting_id', p_meeting_id
  );

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get manager's calendar for a date range
CREATE OR REPLACE FUNCTION get_manager_calendar(
  p_manager_id UUID,
  p_start_date DATE,
  p_end_date DATE
)
RETURNS TABLE (
  date DATE,
  available_slots JSONB,
  booked_meetings JSONB
) AS $$
DECLARE
  v_current_date DATE;
BEGIN
  -- Check permissions
  IF NOT (is_admin() OR p_manager_id = auth.uid()) THEN
    RAISE EXCEPTION 'You do not have permission to view this calendar';
  END IF;

  v_current_date := p_start_date;
  
  WHILE v_current_date <= p_end_date LOOP
    date := v_current_date;
    
    -- Get available slots
    SELECT COALESCE(jsonb_agg(jsonb_build_object(
      'start', slot_start,
      'end', slot_end
    )), '[]'::JSONB)
    INTO available_slots
    FROM get_available_slots(p_manager_id, v_current_date);
    
    -- Get booked meetings
    SELECT COALESCE(jsonb_agg(jsonb_build_object(
      'id', m.id,
      'start', m.start_at,
      'end', m.end_at,
      'guest_name', m.guest_name,
      'status', m.status
    )), '[]'::JSONB)
    INTO booked_meetings
    FROM meetings_v2 m
    WHERE m.manager_id = p_manager_id
      AND m.start_at::DATE = v_current_date
      AND m.status = 'booked';
    
    RETURN NEXT;
    v_current_date := v_current_date + 1;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Create meeting reminder notifications
-- (To be called by a scheduled job)
CREATE OR REPLACE FUNCTION create_meeting_reminders(p_hours_before INTEGER DEFAULT 24)
RETURNS INTEGER AS $$
DECLARE
  v_meeting RECORD;
  v_count INTEGER := 0;
  v_settings meeting_settings%ROWTYPE;
BEGIN
  FOR v_meeting IN 
    SELECT * FROM meetings_v2 
    WHERE status = 'booked'
      AND start_at > NOW()
      AND start_at <= NOW() + (p_hours_before || ' hours')::INTERVAL
      AND NOT EXISTS (
        SELECT 1 FROM notifications_v2 
        WHERE event_key = 'meeting.reminder'
          AND (metadata->>'meeting_id')::UUID = meetings_v2.id
          AND created_at > NOW() - INTERVAL '1 hour'
      )
  LOOP
    -- Get settings for timezone
    SELECT * INTO v_settings FROM meeting_settings WHERE manager_id = v_meeting.manager_id;
    
    PERFORM create_notification(
      p_recipient_user_id := v_meeting.manager_id,
      p_type := 'meeting'::notification_type_v2,
      p_event_key := 'meeting.reminder',
      p_title := 'تذكير باجتماع قادم',
      p_body := 'لديك اجتماع مع ' || v_meeting.guest_name || ' في ' || 
                to_char(v_meeting.start_at AT TIME ZONE COALESCE(v_settings.timezone, 'Asia/Riyadh'), 'DD/MM/YYYY HH24:MI'),
      p_link_url := '/manager/meetings/' || v_meeting.id::TEXT,
      p_metadata := jsonb_build_object(
        'meeting_id', v_meeting.id,
        'guest_name', v_meeting.guest_name,
        'start_at', v_meeting.start_at
      ),
      p_priority := 'important'::notification_priority_v2
    );
    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- TASK STATUS CHANGE NOTIFICATIONS
-- ============================================

-- Trigger function: Notify on task status change
CREATE OR REPLACE FUNCTION notify_on_task_status_change()
RETURNS TRIGGER AS $$
DECLARE
  v_store stores%ROWTYPE;
BEGIN
  -- Only notify if status actually changed
  IF OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;

  -- Get store
  SELECT * INTO v_store FROM stores WHERE id = NEW.store_id;

  -- Notify assigned manager if changed by admin
  IF v_store.assigned_manager_id IS NOT NULL 
     AND v_store.assigned_manager_id != auth.uid() 
     AND is_admin() THEN
    PERFORM create_notification(
      p_recipient_user_id := v_store.assigned_manager_id,
      p_type := 'task'::notification_type_v2,
      p_event_key := 'task.status_changed',
      p_title := 'تغيير حالة المهمة',
      p_body := 'تم تغيير حالة المهمة "' || NEW.title || '" إلى ' || NEW.status::TEXT,
      p_link_url := '/manager/stores/' || NEW.store_id::TEXT || '/tasks/' || NEW.id::TEXT,
      p_metadata := jsonb_build_object(
        'store_id', NEW.store_id,
        'task_id', NEW.id,
        'old_status', OLD.status,
        'new_status', NEW.status
      )
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_notify_task_status_change ON store_tasks;
CREATE TRIGGER trigger_notify_task_status_change
  AFTER UPDATE ON store_tasks
  FOR EACH ROW
  EXECUTE FUNCTION notify_on_task_status_change();

-- ============================================
-- OVERDUE TASKS CHECK
-- ============================================

-- Function: Check and notify overdue tasks
CREATE OR REPLACE FUNCTION check_overdue_tasks()
RETURNS INTEGER AS $$
DECLARE
  v_task RECORD;
  v_store stores%ROWTYPE;
  v_count INTEGER := 0;
BEGIN
  FOR v_task IN 
    SELECT * FROM store_tasks 
    WHERE status NOT IN ('done', 'blocked')
      AND due_date IS NOT NULL
      AND due_date < NOW()
      AND NOT EXISTS (
        SELECT 1 FROM notifications_v2 
        WHERE event_key = 'task.overdue'
          AND (metadata->>'task_id')::UUID = store_tasks.id
          AND created_at > NOW() - INTERVAL '24 hours'
      )
  LOOP
    -- Get store
    SELECT * INTO v_store FROM stores WHERE id = v_task.store_id;
    
    IF v_store.assigned_manager_id IS NOT NULL THEN
      PERFORM create_notification(
        p_recipient_user_id := v_store.assigned_manager_id,
        p_type := 'task'::notification_type_v2,
        p_event_key := 'task.overdue',
        p_title := 'مهمة متأخرة',
        p_body := 'المهمة "' || v_task.title || '" تجاوزت موعدها المحدد',
        p_link_url := '/manager/stores/' || v_task.store_id::TEXT || '/tasks/' || v_task.id::TEXT,
        p_metadata := jsonb_build_object(
          'store_id', v_task.store_id,
          'store_name', v_store.store_name,
          'task_id', v_task.id,
          'due_date', v_task.due_date
        ),
        p_priority := 'important'::notification_priority_v2
      );
      v_count := v_count + 1;
    END IF;
  END LOOP;

  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- ✅ Business logic migration complete!
-- ============================================
