'use client'

import { useParams, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { 
  ArrowRight, 
  Store, 
  ExternalLink, 
  User, 
  Phone, 
  Mail, 
  Calendar, 
  Edit, 
  Trash2,
  Clock,
  MapPin,
  Globe,
  FileText,
  CheckCircle2,
  Circle,
  ChevronUp,
  ChevronDown,
  Loader2,
  Link2,
  Copy
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { getStore } from '@/lib/services/store-service'
import { createClient } from '@/lib/supabase/client'
import type { Store as StoreType, StorePriority, StoreStatus } from '@/lib/supabase/types-simple'

/**
 * Store Details Page - Dark Purple Theme
 */

export default function StoreDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const storeId = params.id as string

  // حالة التحميل والخطأ
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  // حالة نافذة التعديل
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)

  // بيانات المتجر من قاعدة البيانات
  const [store, setStore] = useState<StoreType | null>(null)
  const [managerName, setManagerName] = useState<string>('')
  const [managers, setManagers] = useState<{id: string, name: string, email: string}[]>([])
  const [storeMeetings, setStoreMeetings] = useState<{
    id: string
    guest_name: string
    guest_email: string
    scheduled_at: string
    status: string
  }[]>([])
  const [activityLog, setActivityLog] = useState<{
    id: string
    action: string
    field_name: string | null
    old_value: string | null
    new_value: string | null
    created_at: string
    user_name: string | null
  }[]>([])
  const [activityLogExpanded, setActivityLogExpanded] = useState(false)
  const [activityLogPage, setActivityLogPage] = useState(1)
  const [activityLogTotal, setActivityLogTotal] = useState(0)
  const LOGS_PER_PAGE = 10
  const [tasksExpanded, setTasksExpanded] = useState(false)
  const [meetingsExpanded, setMeetingsExpanded] = useState(false)
  const [commentsExpanded, setCommentsExpanded] = useState(true)
  
  // التعليقات
  const [comments, setComments] = useState<Array<{
    id: string
    content: string
    sender_type: 'merchant' | 'manager'
    sender_name: string | null
    created_at: string
    is_read: boolean
  }>>([])
  const [newComment, setNewComment] = useState('')
  const [submittingComment, setSubmittingComment] = useState(false)

  // حالة نموذج التعديل
  const [editForm, setEditForm] = useState({
    store_name: '',
    owner_name: '',
    owner_email: '',
    owner_phone: '',
    status: 'new' as StoreStatus,
    priority: 'medium' as StorePriority,
    notes: '',
    assigned_manager_id: ''
  })

  // جلب بيانات المتجر من Supabase
  useEffect(() => {
    async function fetchStore() {
      setLoading(true)
      setError(null)
      
      const result = await getStore(storeId)
      
      if (result.error) {
        setError(result.error)
      } else if (result.store) {
        setStore(result.store)
        setEditForm({
          store_name: result.store.store_name || '',
          owner_name: result.store.owner_name || '',
          owner_email: result.store.owner_email || '',
          owner_phone: result.store.owner_phone || '',
          status: result.store.status,
          priority: result.store.priority,
          notes: result.store.notes || '',
          assigned_manager_id: result.store.assigned_manager_id || ''
        })

        // جلب اسم المدير
        if (result.store.assigned_manager_id) {
          const supabase = createClient()
          const { data: manager } = await supabase
            .from('profiles')
            .select('name, email')
            .eq('id', result.store.assigned_manager_id)
            .single()
          
          if (manager) {
            setManagerName(manager.name || manager.email?.split('@')[0] || 'مدير')
          }
        }
      }
      
      setLoading(false)
    }

    // جلب قائمة المدراء
    async function fetchManagers() {
      const supabase = createClient()
      const { data } = await supabase
        .from('profiles')
        .select('id, name, email')
        .eq('role', 'manager')
      
      if (data) {
        setManagers(data.map(m => ({
          id: m.id,
          name: m.name || m.email?.split('@')[0] || 'مدير',
          email: m.email
        })))
      }
    }
    
    // جلب اجتماعات المتجر
    async function fetchMeetings() {
      const supabase = createClient()
      const { data } = await supabase
        .from('meetings')
        .select('id, guest_name, guest_email, scheduled_at, status')
        .eq('store_id', storeId)
        .order('scheduled_at', { ascending: false })
        .limit(5)
      
      if (data) {
        setStoreMeetings(data)
      }
    }
    
    // جلب سجل التعديلات
    async function fetchActivityLog(page: number = 1) {
      const supabase = createClient()
      
      // جلب جميع IDs للحصول على العدد الصحيح
      const { data: allIds } = await supabase
        .from('store_activity_log')
        .select('id')
        .eq('store_id', storeId)
      
      const totalCount = allIds?.length || 0
      setActivityLogTotal(totalCount)
      
      // جلب السجلات للصفحة الحالية
      const from = (page - 1) * 10
      const to = from + 9
      
      const { data } = await supabase
        .from('store_activity_log')
        .select(`
          id, action, field_name, old_value, new_value, created_at,
          profiles:user_id (name, email)
        `)
        .eq('store_id', storeId)
        .order('created_at', { ascending: false })
        .range(from, to)
      
      if (data) {
        setActivityLog(data.map((log: any) => ({
          ...log,
          user_name: log.profiles?.name || log.profiles?.email?.split('@')[0] || 'النظام'
        })))
      }
    }
    
    // جلب التعليقات
    async function fetchComments() {
      const supabase = createClient()
      const { data } = await supabase
        .from('store_comments')
        .select('id, content, sender_type, sender_name, created_at, is_read')
        .eq('store_id', storeId)
        .order('created_at', { ascending: true })
      
      if (data) {
        setComments(data)
        
        // تحديث التعليقات غير المقروءة
        const unreadIds = data.filter(c => !c.is_read && c.sender_type === 'merchant').map(c => c.id)
        if (unreadIds.length > 0) {
          await supabase
            .from('store_comments')
            .update({ is_read: true })
            .in('id', unreadIds)
        }
      }
    }
    
    fetchStore()
    fetchManagers()
    fetchMeetings()
    fetchActivityLog(1)
    fetchComments()
  }, [storeId])
  
  // إرسال تعليق من المدير/الإدارة
  const handleSubmitComment = async () => {
    if (!newComment.trim()) return
    
    setSubmittingComment(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      const { data: insertedComment, error } = await supabase
        .from('store_comments')
        .insert({
          store_id: storeId,
          sender_type: 'manager',
          manager_id: user?.id,
          content: newComment
        })
        .select('id, content, sender_type, sender_name, created_at, is_read')
        .single()
      
      if (!error && insertedComment) {
        setComments([...comments, insertedComment])
        setNewComment('')
      }
    } catch (err) {
      console.error('Error submitting comment:', err)
    }
    setSubmittingComment(false)
  }
  
  // دالة لتحديث صفحة سجل التعديلات
  const loadActivityLogPage = async (page: number) => {
    setActivityLogPage(page)
    const supabase = createClient()
    
    const from = (page - 1) * LOGS_PER_PAGE
    const to = from + LOGS_PER_PAGE - 1
    
    const { data } = await supabase
      .from('store_activity_log')
      .select(`
        id, action, field_name, old_value, new_value, created_at,
        profiles:user_id (name, email)
      `)
      .eq('store_id', storeId)
      .order('created_at', { ascending: false })
      .range(from, to)
    
    if (data) {
      setActivityLog(data.map((log: any) => ({
        ...log,
        user_name: log.profiles?.name || log.profiles?.email?.split('@')[0] || 'النظام'
      })))
    }
  }

  // حفظ التعديلات في قاعدة البيانات
  const handleEditSubmit = async () => {
    if (!store) return
    
    setSaving(true)
    const supabase = createClient()
    
    const updateData = {
      store_name: editForm.store_name || null,
      owner_name: editForm.owner_name || null,
      owner_email: editForm.owner_email || null,
      owner_phone: editForm.owner_phone || null,
      status: editForm.status,
      priority: editForm.priority,
      notes: editForm.notes || null,
      assigned_manager_id: editForm.assigned_manager_id || null,
      updated_at: new Date().toISOString()
    }
    
    const { error: updateError } = await (supabase
      .from('stores') as any)
      .update(updateData)
      .eq('id', storeId)
    
    if (updateError) {
      console.error('Update error:', updateError)
      alert('حدث خطأ أثناء الحفظ')
    } else {
      // تسجيل التعديلات في سجل النشاط
      const { data: { user } } = await supabase.auth.getUser()
      const changes: { field: string, old: string | null, new: string | null }[] = []
      
      // دالة مساعدة للمقارنة (تعتبر null و '' متساويتين)
      const isDifferent = (a: string | null | undefined, b: string | null | undefined) => {
        const valA = a || ''
        const valB = b || ''
        return valA !== valB
      }
      
      if (isDifferent(store.store_name, editForm.store_name)) {
        changes.push({ field: 'store_name', old: store.store_name, new: editForm.store_name || null })
      }
      if (isDifferent(store.owner_name, editForm.owner_name)) {
        changes.push({ field: 'owner_name', old: store.owner_name, new: editForm.owner_name || null })
      }
      if (isDifferent(store.owner_email, editForm.owner_email)) {
        changes.push({ field: 'owner_email', old: store.owner_email, new: editForm.owner_email || null })
      }
      if (isDifferent(store.owner_phone, editForm.owner_phone)) {
        changes.push({ field: 'owner_phone', old: store.owner_phone, new: editForm.owner_phone || null })
      }
      if (store.status !== editForm.status) {
        changes.push({ field: 'status', old: store.status, new: editForm.status })
      }
      if (store.priority !== editForm.priority) {
        changes.push({ field: 'priority', old: store.priority, new: editForm.priority })
      }
      if (isDifferent(store.notes, editForm.notes)) {
        changes.push({ field: 'notes', old: store.notes, new: editForm.notes || null })
      }
      
      // إدراج سجلات التعديل
      for (const change of changes) {
        await supabase.from('store_activity_log').insert({
          store_id: storeId,
          user_id: user?.id || null,
          action: 'update',
          field_name: change.field,
          old_value: change.old,
          new_value: change.new
        })
      }
      
      setStore({
        ...store,
        store_name: editForm.store_name || null,
        owner_name: editForm.owner_name || null,
        owner_email: editForm.owner_email || null,
        owner_phone: editForm.owner_phone || null,
        status: editForm.status,
        priority: editForm.priority,
        notes: editForm.notes || null
      })
      
      // تحديث سجل النشاط
      const { data: newLogs } = await supabase
        .from('store_activity_log')
        .select(`id, action, field_name, old_value, new_value, created_at, profiles:user_id (name, email)`)
        .eq('store_id', storeId)
        .order('created_at', { ascending: false })
        .limit(10)
      
      if (newLogs) {
        setActivityLog(newLogs.map((log: any) => ({
          ...log,
          user_name: log.profiles?.name || log.profiles?.email?.split('@')[0] || 'النظام'
        })))
      }
      
      setIsEditModalOpen(false)
    }
    
    setSaving(false)
  }

  // قوالب المهام - تأتي من قوالب المهام المركزية
  // مهمة من قاعدة البيانات
  interface StoreTask {
    id: string
    title: string
    description: string | null
    status: 'new' | 'in_progress' | 'blocked' | 'done'
    visible_to_merchant: boolean
    template_section_id: string | null
    completed_at: string | null
  }

  // قسم المهام
  interface TaskSection {
    id: string
    title: string
    tasks: StoreTask[]
  }

  // المهام من قاعدة البيانات
  const [storeTasks, setStoreTasks] = useState<StoreTask[]>([])
  const [taskSections, setTaskSections] = useState<TaskSection[]>([])

  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set())

  // جلب المهام من قاعدة البيانات
  useEffect(() => {
    async function fetchTasks() {
      if (!storeId) return
      
      const supabase = createClient()
      
      // جلب أقسام المهام أولاً
      const { data: sections } = await supabase
        .from('task_sections_template')
        .select('id, title, sort_order')
        .order('sort_order')
      
      // جلب المهام
      const { data: tasks } = await supabase
        .from('store_tasks')
        .select('id, title, description, status, visible_to_merchant, template_section_id, completed_at')
        .eq('store_id', storeId)
        .order('sort_order')
      
      if (tasks) {
        setStoreTasks(tasks as StoreTask[])
        
        // إنشاء خريطة الأقسام
        const sectionsMap = new Map<string, TaskSection>()
        
        // إضافة الأقسام من القوالب
        if (sections) {
          sections.forEach((sec: any) => {
            sectionsMap.set(sec.id, { id: sec.id, title: sec.title, tasks: [] })
          })
        }
        
        // قسم افتراضي للمهام بدون قسم
        sectionsMap.set('default', { id: 'default', title: 'مهام أخرى', tasks: [] })
        
        // توزيع المهام على الأقسام
        tasks.forEach((task: any) => {
          const sectionId = task.template_section_id || 'default'
          if (sectionsMap.has(sectionId)) {
            sectionsMap.get(sectionId)!.tasks.push(task as StoreTask)
          } else {
            sectionsMap.get('default')!.tasks.push(task as StoreTask)
          }
        })
        
        // ترتيب الأقسام وإزالة الفارغة
        const sortedSections = Array.from(sectionsMap.values())
          .filter(s => s.tasks.length > 0)
        
        setTaskSections(sortedSections)
      }
    }
    
    fetchTasks()
  }, [storeId])

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections)
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId)
    } else {
      newExpanded.add(sectionId)
    }
    setExpandedSections(newExpanded)
  }

  const toggleTask = async (taskId: string) => {
    const task = storeTasks.find(t => t.id === taskId)
    if (!task) return
    
    const newStatus = task.status === 'done' ? 'new' : 'done'
    
    // تحديث في قاعدة البيانات
    const supabase = createClient()
    await supabase
      .from('store_tasks')
      .update({ 
        status: newStatus,
        completed_at: newStatus === 'done' ? new Date().toISOString() : null
      })
      .eq('id', taskId)
    
    // تسجيل في سجل التعديلات
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('store_activity_log').insert({
      store_id: storeId,
      user_id: user?.id || null,
      action: 'task_update',
      field_name: task.title,
      old_value: task.status === 'done' ? 'مكتمل' : 'غير مكتمل',
      new_value: newStatus === 'done' ? 'مكتمل' : 'غير مكتمل'
    })
    
    // تحديث الحالة المحلية
    const updatedTasks = storeTasks.map(t => 
      t.id === taskId ? { ...t, status: newStatus as 'new' | 'in_progress' | 'blocked' | 'done', completed_at: newStatus === 'done' ? new Date().toISOString() : null } : t
    )
    setStoreTasks(updatedTasks)
    
    // تحديث taskSections أيضاً
    setTaskSections(prevSections => 
      prevSections.map(section => ({
        ...section,
        tasks: section.tasks.map(t => 
          t.id === taskId ? { ...t, status: newStatus as 'new' | 'in_progress' | 'blocked' | 'done', completed_at: newStatus === 'done' ? new Date().toISOString() : null } : t
        )
      }))
    )
    
    // تحديث سجل النشاط
    const { data: newLogs } = await supabase
      .from('store_activity_log')
      .select(`id, action, field_name, old_value, new_value, created_at, profiles:user_id (name, email)`)
      .eq('store_id', storeId)
      .order('created_at', { ascending: false })
      .limit(10)
    
    if (newLogs) {
      setActivityLog(newLogs.map((log: any) => ({
        ...log,
        user_name: log.profiles?.name || log.profiles?.email?.split('@')[0] || 'النظام'
      })))
    }
  }

  const isTaskCompleted = (taskId: string) => {
    const task = storeTasks.find(t => t.id === taskId)
    return task?.status === 'done'
  }

  const getSectionProgress = (section: TaskSection) => {
    const completed = section.tasks.filter(t => t.status === 'done').length
    return { completed, total: section.tasks.length }
  }

  const getTotalProgress = () => {
    const completed = storeTasks.filter(t => t.status === 'done').length
    return { completed, total: storeTasks.length }
  }

  const getStatusVariant = (status: string) => {
    const map: Record<string, 'success' | 'info' | 'warning' | 'error'> = {
      active: 'success',
      new: 'info',
      paused: 'warning',
      ended: 'error'
    }
    return map[status] || 'info'
  }

  const getFieldLabel = (fieldName: string) => {
    const labels: Record<string, string> = {
      store_name: 'اسم المتجر',
      owner_name: 'اسم المالك',
      owner_email: 'البريد الإلكتروني',
      owner_phone: 'رقم الجوال',
      status: 'الحالة',
      priority: 'الأولوية',
      notes: 'الملاحظات',
      assigned_manager_id: 'مدير العلاقة'
    }
    return labels[fieldName] || fieldName
  }

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      new: 'جديد',
      active: 'نشط',
      paused: 'متوقف',
      ended: 'منتهي'
    }
    return labels[status] || status
  }

  const getPriorityVariant = (priority: string) => {
    const map: Record<string, 'warning' | 'purple' | 'muted'> = {
      high: 'warning',
      medium: 'purple',
      low: 'muted'
    }
    return map[priority] || 'muted'
  }

  const getPriorityLabel = (priority: string) => {
    const labels: Record<string, string> = {
      high: 'عالية',
      medium: 'متوسطة',
      low: 'منخفضة'
    }
    return labels[priority] || priority
  }

  // حالة التحميل
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-[#a855f7]" />
      </div>
    )
  }

  // حالة الخطأ
  if (error || !store) {
    return (
      <div className="p-6">
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 text-center">
          <p className="text-red-400 mb-4">{error || 'المتجر غير موجود'}</p>
          <Button variant="secondary" onClick={() => router.back()}>
            العودة
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => router.back()}
            className="p-2 hover:bg-[#3d2d5a] rounded-lg transition-colors"
          >
            <ArrowRight className="h-5 w-5 text-[#c4b5fd]" />
          </button>
          <div>
            <h1 className="text-[28px] font-extrabold text-white">{store.store_name || 'بدون اسم'}</h1>
            <a 
              href={store.store_url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-[14px] text-[#a855f7] hover:text-[#c084fc] flex items-center gap-1"
            >
              {store.store_url.replace('https://', '').replace('http://', '')}
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
        <Button 
          variant="secondary" 
          size="md"
          onClick={() => setIsEditModalOpen(true)}
        >
          <Edit className="h-4 w-4 ml-2" />
          تعديل
        </Button>
      </div>

      {/* Badges */}
      <div className="flex items-center gap-3">
        <Badge variant={getStatusVariant(store.status)} size="md">
          {getStatusLabel(store.status)}
        </Badge>
        <Badge variant={getPriorityVariant(store.priority)} size="md">
          أولوية {getPriorityLabel(store.priority)}
        </Badge>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Owner Info */}
        <div className="bg-[#3d2d5a] border border-[#5a4985]/40 rounded-xl p-5">
          <h3 className="text-[16px] font-bold text-white mb-4">معلومات المالك</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <User className="h-4 w-4 text-[#a855f7]" />
              <span className="text-[14px] text-[#c4b5fd]">{store.owner_name || 'غير محدد'}</span>
            </div>
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-[#a855f7]" />
              {store.owner_email ? (
                <a 
                  href={`mailto:${store.owner_email}`}
                  className="text-[14px] text-[#a855f7] hover:text-[#c084fc] hover:underline transition-colors"
                >
                  {store.owner_email}
                </a>
              ) : (
                <span className="text-[14px] text-[#c4b5fd]">غير محدد</span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <Phone className="h-4 w-4 text-[#a855f7]" />
              {store.owner_phone ? (
                <div className="flex items-center gap-2">
                  <a 
                    href={`tel:${store.owner_phone}`}
                    className="text-[14px] text-[#a855f7] hover:text-[#c084fc] hover:underline transition-colors"
                  >
                    {store.owner_phone}
                  </a>
                  <a
                    href={`https://wa.me/${store.owner_phone.replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 bg-[#25D366] hover:bg-[#128C7E] rounded-full transition-colors"
                    title="واتساب"
                  >
                    <svg className="h-3.5 w-3.5 text-white" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
                  </a>
                </div>
              ) : (
                <span className="text-[14px] text-[#c4b5fd]">غير محدد</span>
              )}
            </div>
          </div>
        </div>

        {/* Store Info */}
        <div className="bg-[#3d2d5a] border border-[#5a4985]/40 rounded-xl p-5">
          <h3 className="text-[16px] font-bold text-white mb-4">معلومات المتجر</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <User className="h-4 w-4 text-[#a855f7]" />
              <span className="text-[14px] text-[#c4b5fd]">مدير العلاقة: </span>
              {store.assigned_manager_id ? (
                <button
                  onClick={() => router.push(`/admin/account-managers/${store.assigned_manager_id}`)}
                  className="text-[14px] text-[#a855f7] hover:text-[#c084fc] hover:underline transition-colors"
                >
                  {managerName}
                </button>
              ) : (
                <span className="text-[14px] text-[#c4b5fd]">غير مسند</span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <Globe className="h-4 w-4 text-[#a855f7]" />
              <a 
                href={store.store_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[14px] text-[#a855f7] hover:text-[#c084fc] hover:underline transition-colors"
              >
                {store.store_url}
              </a>
            </div>
            <div className="flex items-center gap-3">
              <Calendar className="h-4 w-4 text-[#a855f7]" />
              <span className="text-[14px] text-[#c4b5fd]">تاريخ الإنشاء: {new Date(store.created_at).toLocaleDateString('ar-SA')}</span>
            </div>
            <div className="flex items-center gap-3">
              <Clock className="h-4 w-4 text-[#a855f7]" />
              <span className="text-[14px] text-[#c4b5fd]">آخر تحديث: {new Date(store.updated_at).toLocaleDateString('ar-SA')}</span>
            </div>
          </div>
        </div>

      </div>

      {/* Public Store Link */}
      <div className="bg-[#3d2d5a] border border-[#5a4985]/40 rounded-xl p-5">
        <h3 className="text-[16px] font-bold text-white mb-3 flex items-center gap-2">
          <Link2 className="h-4 w-4 text-[#a855f7]" />
          رابط صفحة التاجر
        </h3>
        <div className="flex items-center gap-3 bg-[#2d1f4e] p-3 rounded-lg">
          <code className="text-[14px] text-[#a855f7] flex-1 truncate">
            {typeof window !== 'undefined' ? window.location.origin : 'https://zid-2.netlify.app'}/public/store/{storeId}
          </code>
          <button
            onClick={() => navigator.clipboard.writeText(`${typeof window !== 'undefined' ? window.location.origin : 'https://zid-2.netlify.app'}/public/store/${storeId}`)}
            className="p-2 hover:bg-[#3d2d5a] rounded-lg transition-colors"
            title="نسخ الرابط"
          >
            <Copy className="h-4 w-4 text-[#8b7fad]" />
          </button>
          <a
            href={`/public/store/${storeId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 hover:bg-[#3d2d5a] rounded-lg transition-colors"
            title="فتح الصفحة"
          >
            <ExternalLink className="h-4 w-4 text-[#8b7fad]" />
          </a>
        </div>
      </div>

      {/* Comments Section - Collapsible */}
      <div className="bg-[#3d2d5a] border border-[#5a4985]/40 rounded-xl overflow-hidden">
        {/* Header - Clickable to toggle */}
        <button
          onClick={() => setCommentsExpanded(!commentsExpanded)}
          className="w-full flex items-center justify-between p-5 hover:bg-[#4a3a6a] transition-colors"
        >
          <h3 className="text-[16px] font-bold text-white flex items-center gap-2">
            <FileText className="h-4 w-4 text-[#a855f7]" />
            التعليقات ({comments.length})
            {comments.filter(c => c.sender_type === 'merchant' && !c.is_read).length > 0 && (
              <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full mr-2">
                {comments.filter(c => c.sender_type === 'merchant' && !c.is_read).length} جديد
              </span>
            )}
          </h3>
          {commentsExpanded ? (
            <ChevronUp className="h-5 w-5 text-[#8b7fad]" />
          ) : (
            <ChevronDown className="h-5 w-5 text-[#8b7fad]" />
          )}
        </button>
        
        {/* Content - Collapsible */}
        {commentsExpanded && (
          <div className="px-5 pb-5">
            {/* Comments List */}
            <div className="space-y-3 max-h-64 overflow-y-auto mb-4">
              {comments.length > 0 ? (
                comments.map((comment) => (
                  <div 
                    key={comment.id} 
                    className={`p-3 rounded-lg ${
                      comment.sender_type === 'merchant' 
                        ? 'bg-orange-500/10 border border-orange-500/30 mr-8' 
                        : 'bg-purple-500/10 border border-purple-500/30 ml-8'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-xs font-medium ${
                        comment.sender_type === 'merchant' ? 'text-orange-400' : 'text-purple-400'
                      }`}>
                        {comment.sender_type === 'merchant' ? `التاجر: ${comment.sender_name}` : 'أنت'}
                      </span>
                      <span className="text-xs text-[#8b7fad]">
                        {new Date(comment.created_at).toLocaleDateString('ar-SA', { 
                          month: 'short', 
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                    <p className="text-sm text-white">{comment.content}</p>
                  </div>
                ))
              ) : (
                <p className="text-center text-[#8b7fad] py-4">لا توجد تعليقات بعد</p>
              )}
            </div>
            
            {/* Add Comment Form */}
            <div className="flex gap-2">
              <input
                className="flex-1 px-3 py-2 bg-[#2d1f4e] border border-[#5a4985]/40 rounded-lg text-white text-sm placeholder:text-[#8b7fad] focus:outline-none focus:border-[#a855f7]"
                placeholder="اكتب ردك للتاجر..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSubmitComment()}
              />
              <button
                onClick={handleSubmitComment}
                disabled={submittingComment || !newComment.trim()}
                className="px-4 py-2 bg-[#a855f7] hover:bg-[#9333ea] disabled:bg-[#5a4985] disabled:cursor-not-allowed text-white text-sm rounded-lg transition-colors"
              >
                {submittingComment ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'إرسال'
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Meetings Section - Collapsible */}
      <div className="bg-[#3d2d5a] border border-[#5a4985]/40 rounded-xl overflow-hidden">
        {/* Header - Clickable to toggle */}
        <button
          onClick={() => setMeetingsExpanded(!meetingsExpanded)}
          className="w-full flex items-center justify-between p-5 hover:bg-[#4a3a6a] transition-colors"
        >
          <h3 className="text-[16px] font-bold text-white flex items-center gap-2">
            <Calendar className="h-4 w-4 text-[#a855f7]" />
            الاجتماعات ({storeMeetings.length})
          </h3>
          {meetingsExpanded ? (
            <ChevronUp className="h-5 w-5 text-[#8b7fad]" />
          ) : (
            <ChevronDown className="h-5 w-5 text-[#8b7fad]" />
          )}
        </button>
        
        {/* Content - Collapsible */}
        {meetingsExpanded && (
          <div className="px-5 pb-5">
            {storeMeetings.length > 0 ? (
              <div className="space-y-3">
                {storeMeetings.map((meeting) => (
                  <div 
                    key={meeting.id}
                    className="flex items-center justify-between p-3 bg-[#2d1f4e] rounded-lg"
                  >
                    <div>
                      <p className="text-[14px] text-white font-medium">{meeting.guest_name}</p>
                      <p className="text-[12px] text-[#8b7fad]">{meeting.guest_email}</p>
                    </div>
                    <div className="text-left">
                      <p className="text-[13px] text-[#a855f7]">
                        {new Date(meeting.scheduled_at).toLocaleDateString('ar-SA', { 
                          weekday: 'short', 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </p>
                      <p className="text-[11px] text-[#8b7fad]">
                        {new Date(meeting.scheduled_at).toLocaleTimeString('ar-SA', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[14px] text-[#8b7fad] text-center py-4">لا توجد اجتماعات</p>
            )}
          </div>
        )}
      </div>

      {/* Tasks Section - من قوالب المهام - Collapsible */}
      <div className="bg-[#3d2d5a] border border-[#5a4985]/40 rounded-xl overflow-hidden">
        {/* Header with Progress - Clickable to toggle */}
        <button
          onClick={() => setTasksExpanded(!tasksExpanded)}
          className="w-full flex items-center justify-between p-5 hover:bg-[#4a3a6a] transition-colors"
        >
          <h3 className="text-[16px] font-bold text-white flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-[#a855f7]" />
            المهام ({getTotalProgress().completed}/{getTotalProgress().total})
          </h3>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-32 h-2 bg-[#2d1f4e] rounded-full overflow-hidden">
                <div 
                  className="h-full bg-[#22c55e] transition-all duration-300"
                  style={{ width: `${getTotalProgress().total > 0 ? (getTotalProgress().completed / getTotalProgress().total) * 100 : 0}%` }}
                />
              </div>
              <span className="text-[12px] text-[#8b7fad]">
                {getTotalProgress().total > 0 ? Math.round((getTotalProgress().completed / getTotalProgress().total) * 100) : 0}%
              </span>
            </div>
            {tasksExpanded ? (
              <ChevronUp className="h-5 w-5 text-[#8b7fad]" />
            ) : (
              <ChevronDown className="h-5 w-5 text-[#8b7fad]" />
            )}
          </div>
        </button>

        {/* Sections from Templates - Collapsible Content */}
        {tasksExpanded && (
        <div className="px-5 pb-5 space-y-4">
          {taskSections.map((section: TaskSection) => {
            const progress = getSectionProgress(section)
            return (
              <div key={section.id} className="border border-[#5a4985]/30 rounded-lg overflow-hidden">
                {/* Section Header */}
                <button
                  onClick={() => toggleSection(section.id)}
                  className="w-full flex items-center justify-between p-3 bg-[#2d1f4e] hover:bg-[#352a52] transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-[14px] font-medium text-white">{section.title}</span>
                    <span className="text-[12px] text-[#8b7fad]">
                      ({progress.completed}/{progress.total})
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {progress.completed === progress.total && progress.total > 0 && (
                      <CheckCircle2 className="h-4 w-4 text-[#22c55e]" />
                    )}
                    {expandedSections.has(section.id) ? (
                      <ChevronUp className="h-4 w-4 text-[#8b7fad]" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-[#8b7fad]" />
                    )}
                  </div>
                </button>

                {/* Section Tasks */}
                {expandedSections.has(section.id) && (
                  <div className="p-2 space-y-1">
                    {section.tasks.map((task: StoreTask) => {
                      const completed = task.status === 'done'
                      return (
                        <div 
                          key={task.id}
                          className={`flex items-center gap-3 p-2.5 rounded-lg transition-all ${
                            completed 
                              ? 'bg-[#22c55e]/10' 
                              : 'hover:bg-[#2d1f4e]'
                          }`}
                        >
                          <button
                            onClick={() => toggleTask(task.id)}
                            className="flex-shrink-0"
                          >
                            {completed ? (
                              <CheckCircle2 className="h-5 w-5 text-[#22c55e]" />
                            ) : (
                              <Circle className="h-5 w-5 text-[#8b7fad]" />
                            )}
                          </button>
                          <div className="flex-1 min-w-0">
                            <p className={`text-[13px] ${completed ? 'text-[#8b7fad] line-through' : 'text-white'}`}>
                              {task.title}
                            </p>
                            {task.description && (
                              <p className="text-[11px] text-[#8b7fad] mt-0.5">{task.description}</p>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
        )}
      </div>

      {/* Activity Log Section - Collapsible */}
      <div className="bg-[#3d2d5a] border border-[#5a4985]/40 rounded-xl overflow-hidden">
        {/* Header - Clickable to toggle */}
        <button
          onClick={() => setActivityLogExpanded(!activityLogExpanded)}
          className="w-full flex items-center justify-between p-5 hover:bg-[#4a3a6a] transition-colors"
        >
          <h3 className="text-[16px] font-bold text-white flex items-center gap-2">
            <Clock className="h-4 w-4 text-[#a855f7]" />
            سجل التعديلات ({activityLogTotal})
          </h3>
          {activityLogExpanded ? (
            <ChevronUp className="h-5 w-5 text-[#8b7fad]" />
          ) : (
            <ChevronDown className="h-5 w-5 text-[#8b7fad]" />
          )}
        </button>
        
        {/* Content - Collapsible */}
        {activityLogExpanded && (
          <div className="px-5 pb-5">
            {activityLog.length > 0 ? (
              <>
                <div className="space-y-3">
                  {activityLog.map((log) => (
                    <div 
                      key={log.id}
                      className="flex items-start gap-3 p-3 bg-[#2d1f4e] rounded-lg"
                    >
                      <div className="w-2 h-2 mt-2 rounded-full bg-[#a855f7]" />
                      <div className="flex-1">
                        <p className="text-[13px] text-white">
                          {log.action === 'update' && log.field_name && (
                            <>
                              تم تعديل <span className="text-[#a855f7]">{getFieldLabel(log.field_name)}</span>
                              {log.old_value && <> من "{log.old_value}"</>}
                              {log.new_value && <> إلى "{log.new_value}"</>}
                            </>
                          )}
                          {log.action === 'task_update' && (
                            <>
                              تم تحديث مهمة "<span className="text-[#a855f7]">{log.field_name}</span>" 
                              إلى <span className={log.new_value === 'مكتمل' ? 'text-green-400' : 'text-yellow-400'}>{log.new_value}</span>
                            </>
                          )}
                          {log.action === 'create' && 'تم إنشاء المتجر'}
                          {log.action === 'status_change' && (
                            <>تم تغيير الحالة إلى <span className="text-[#a855f7]">{log.new_value}</span></>
                          )}
                        </p>
                        <p className="text-[11px] text-[#8b7fad] mt-1">
                          {log.user_name} • {new Date(log.created_at).toLocaleDateString('ar-SA')} {new Date(log.created_at).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Pagination */}
                {activityLogTotal > LOGS_PER_PAGE && (
                  <div className="flex items-center justify-center gap-2 mt-4 pt-4 border-t border-[#5a4985]/40">
                    <button
                      onClick={() => loadActivityLogPage(activityLogPage - 1)}
                      disabled={activityLogPage === 1}
                      className="px-3 py-1.5 text-[12px] bg-[#2d1f4e] text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#3d2d5a] transition-colors"
                    >
                      السابق
                    </button>
                    <span className="text-[12px] text-[#8b7fad]">
                      صفحة {activityLogPage} من {Math.ceil(activityLogTotal / LOGS_PER_PAGE)}
                    </span>
                    <button
                      onClick={() => loadActivityLogPage(activityLogPage + 1)}
                      disabled={activityLogPage >= Math.ceil(activityLogTotal / LOGS_PER_PAGE)}
                      className="px-3 py-1.5 text-[12px] bg-[#2d1f4e] text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#3d2d5a] transition-colors"
                    >
                      التالي
                    </button>
                  </div>
                )}
              </>
            ) : (
              <p className="text-[14px] text-[#8b7fad] text-center py-4">لا توجد تعديلات مسجلة</p>
            )}
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsEditModalOpen(false)}
          />
          
          {/* Modal */}
          <div className="relative bg-[#1a1230] border border-[#3d2d5a] rounded-2xl w-full max-w-lg mx-4 shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-[#3d2d5a]">
              <h2 className="text-[18px] font-bold text-white">تعديل بيانات المتجر</h2>
              <button 
                onClick={() => setIsEditModalOpen(false)}
                className="p-1 hover:bg-[#3d2d5a] rounded-lg transition-colors"
              >
                <svg className="h-5 w-5 text-[#8b7fad]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Form */}
            <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto">
              {/* اسم المتجر */}
              <div>
                <label className="block text-[13px] text-[#c4b5fd] mb-1.5">اسم المتجر</label>
                <input
                  type="text"
                  value={editForm.store_name}
                  onChange={(e) => setEditForm({...editForm, store_name: e.target.value})}
                  className="w-full px-3 py-2.5 bg-[#2d1f4e] border border-[#5a4985]/40 rounded-lg text-white text-[14px] focus:outline-none focus:border-[#a855f7]"
                />
              </div>

              {/* اسم المالك */}
              <div>
                <label className="block text-[13px] text-[#c4b5fd] mb-1.5">اسم المالك</label>
                <input
                  type="text"
                  value={editForm.owner_name}
                  onChange={(e) => setEditForm({...editForm, owner_name: e.target.value})}
                  className="w-full px-3 py-2.5 bg-[#2d1f4e] border border-[#5a4985]/40 rounded-lg text-white text-[14px] focus:outline-none focus:border-[#a855f7]"
                />
              </div>

              {/* البريد الإلكتروني */}
              <div>
                <label className="block text-[13px] text-[#c4b5fd] mb-1.5">البريد الإلكتروني</label>
                <input
                  type="email"
                  value={editForm.owner_email}
                  onChange={(e) => setEditForm({...editForm, owner_email: e.target.value})}
                  className="w-full px-3 py-2.5 bg-[#2d1f4e] border border-[#5a4985]/40 rounded-lg text-white text-[14px] focus:outline-none focus:border-[#a855f7]"
                />
              </div>

              {/* رقم الجوال */}
              <div>
                <label className="block text-[13px] text-[#c4b5fd] mb-1.5">رقم الجوال</label>
                <input
                  type="tel"
                  value={editForm.owner_phone}
                  onChange={(e) => setEditForm({...editForm, owner_phone: e.target.value})}
                  className="w-full px-3 py-2.5 bg-[#2d1f4e] border border-[#5a4985]/40 rounded-lg text-white text-[14px] focus:outline-none focus:border-[#a855f7]"
                />
              </div>

              {/* مدير العلاقة */}
              <div>
                <label className="block text-[13px] text-[#c4b5fd] mb-1.5">مدير العلاقة</label>
                <select
                  value={editForm.assigned_manager_id}
                  onChange={(e) => setEditForm({...editForm, assigned_manager_id: e.target.value})}
                  className="w-full px-3 py-2.5 bg-[#2d1f4e] border border-[#5a4985]/40 rounded-lg text-white text-[14px] focus:outline-none focus:border-[#a855f7]"
                >
                  <option value="">-- غير مسند --</option>
                  {managers.map((manager) => (
                    <option key={manager.id} value={manager.id}>
                      {manager.name} ({manager.email})
                    </option>
                  ))}
                </select>
              </div>

              {/* الحالة والأولوية */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[13px] text-[#c4b5fd] mb-1.5">الحالة</label>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm({...editForm, status: e.target.value as 'active' | 'new' | 'paused' | 'ended'})}
                    className="w-full px-3 py-2.5 bg-[#2d1f4e] border border-[#5a4985]/40 rounded-lg text-white text-[14px] focus:outline-none focus:border-[#a855f7]"
                  >
                    <option value="new">جديد</option>
                    <option value="active">نشط</option>
                    <option value="paused">متوقف</option>
                    <option value="ended">منتهي</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[13px] text-[#c4b5fd] mb-1.5">الأولوية</label>
                  <select
                    value={editForm.priority}
                    onChange={(e) => setEditForm({...editForm, priority: e.target.value as 'high' | 'medium' | 'low'})}
                    className="w-full px-3 py-2.5 bg-[#2d1f4e] border border-[#5a4985]/40 rounded-lg text-white text-[14px] focus:outline-none focus:border-[#a855f7]"
                  >
                    <option value="high">عالية</option>
                    <option value="medium">متوسطة</option>
                    <option value="low">منخفضة</option>
                  </select>
                </div>
              </div>

              {/* الملاحظات */}
              <div>
                <label className="block text-[13px] text-[#c4b5fd] mb-1.5">ملاحظات</label>
                <textarea
                  value={editForm.notes}
                  onChange={(e) => setEditForm({...editForm, notes: e.target.value})}
                  rows={3}
                  className="w-full px-3 py-2.5 bg-[#2d1f4e] border border-[#5a4985]/40 rounded-lg text-white text-[14px] focus:outline-none focus:border-[#a855f7] resize-none"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 p-5 border-t border-[#3d2d5a]">
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="px-4 py-2 text-[14px] text-[#c4b5fd] hover:bg-[#3d2d5a] rounded-lg transition-colors"
              >
                إلغاء
              </button>
              <button
                onClick={handleEditSubmit}
                className="px-5 py-2 bg-[#a855f7] hover:bg-[#9333ea] text-white text-[14px] font-medium rounded-lg transition-colors"
              >
                حفظ التغييرات
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
