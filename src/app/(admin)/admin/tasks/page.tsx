'use client'

import { useState } from 'react'
import { 
  CheckCircle2, 
  Circle, 
  Clock, 
  Store, 
  User,
  Filter,
  ChevronDown,
  ChevronUp,
  Plus,
  Calendar,
  AlertCircle,
  Settings2,
  X
} from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

/**
 * Tasks Page - Dark Purple Theme
 * صفحة المهام لمدراء العلاقات
 */

interface Task {
  id: string
  title: string
  description?: string
  store_id: string
  store_name: string
  section: string
  status: 'pending' | 'in_progress' | 'done' | 'blocked'
  type: 'template' | 'manual'
  due_date?: string
  created_at: string
  assigned_to: string
}

interface AccountManager {
  id: string
  name: string
  stores_count: number
}

export default function TasksPage() {
  // مدراء العلاقات
  const accountManagers: AccountManager[] = [
    { id: '1', name: 'سارة أحمد', stores_count: 5 },
    { id: '2', name: 'محمد علي', stores_count: 8 },
    { id: '3', name: 'فاطمة خالد', stores_count: 3 },
  ]

  // المهام (في الواقع تأتي من API)
  const allTasks: Task[] = [
    // مهام سارة أحمد
    { id: '1', title: 'مراجعة إعدادات المتجر', store_id: '1', store_name: 'متجر الإلكترونيات', section: 'إعداد المتجر', status: 'done', type: 'template', due_date: '2024-02-01', created_at: '2024-01-15', assigned_to: '1' },
    { id: '2', title: 'إضافة طرق الدفع', store_id: '1', store_name: 'متجر الإلكترونيات', section: 'إعداد المتجر', status: 'in_progress', type: 'template', due_date: '2024-02-05', created_at: '2024-01-15', assigned_to: '1' },
    { id: '3', title: 'التواصل مع العميل بخصوص الشحن', store_id: '1', store_name: 'متجر الإلكترونيات', section: 'مهام يدوية', status: 'pending', type: 'manual', due_date: '2024-02-03', created_at: '2024-02-01', assigned_to: '1' },
    { id: '4', title: 'مراجعة المنتجات', store_id: '2', store_name: 'متجر الأزياء', section: 'المنتجات', status: 'pending', type: 'template', created_at: '2024-01-20', assigned_to: '1' },
    // مهام محمد علي
    { id: '5', title: 'إعداد Google Analytics', store_id: '3', store_name: 'متجر الأثاث', section: 'التسويق', status: 'pending', type: 'template', due_date: '2024-02-10', created_at: '2024-01-25', assigned_to: '2' },
    { id: '6', title: 'تحديث بيانات المتجر', store_id: '3', store_name: 'متجر الأثاث', section: 'مهام يدوية', status: 'done', type: 'manual', created_at: '2024-01-28', assigned_to: '2' },
    { id: '7', title: 'إعداد الشحن', store_id: '4', store_name: 'متجر الهدايا', section: 'إعداد المتجر', status: 'blocked', type: 'template', due_date: '2024-02-01', created_at: '2024-01-22', assigned_to: '2' },
    // مهام فاطمة خالد
    { id: '8', title: 'ربط وسائل التواصل', store_id: '5', store_name: 'متجر العطور', section: 'التسويق', status: 'in_progress', type: 'template', due_date: '2024-02-08', created_at: '2024-01-30', assigned_to: '3' },
  ]

  const [selectedManager, setSelectedManager] = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterType, setFilterType] = useState<string>('all')
  const [expandedStores, setExpandedStores] = useState<Set<string>>(new Set())
  
  // Modal state
  const [showAddTaskModal, setShowAddTaskModal] = useState(false)
  const [newTask, setNewTask] = useState({
    title: '',
    store_id: '',
    due_date: '',
    description: ''
  })

  // المتاجر المتاحة
  const stores = [
    { id: '1', name: 'متجر الإلكترونيات' },
    { id: '2', name: 'متجر الأزياء' },
    { id: '3', name: 'متجر الأثاث' },
    { id: '4', name: 'متجر الهدايا' },
    { id: '5', name: 'متجر العطور' },
  ]

  const handleAddTask = () => {
    if (!newTask.title || !newTask.store_id) {
      alert('يرجى إدخال عنوان المهمة واختيار المتجر')
      return
    }
    // في الواقع سيتم إرسال البيانات إلى API
    console.log('Adding task:', newTask)
    setShowAddTaskModal(false)
    setNewTask({ title: '', store_id: '', due_date: '', description: '' })
  }

  // فلترة المهام
  const filteredTasks = allTasks.filter(task => {
    if (selectedManager && task.assigned_to !== selectedManager) return false
    if (filterStatus !== 'all' && task.status !== filterStatus) return false
    if (filterType !== 'all' && task.type !== filterType) return false
    return true
  })

  // تجميع المهام حسب المتجر
  const tasksByStore = filteredTasks.reduce((acc, task) => {
    if (!acc[task.store_id]) {
      acc[task.store_id] = {
        store_name: task.store_name,
        tasks: []
      }
    }
    acc[task.store_id].tasks.push(task)
    return acc
  }, {} as Record<string, { store_name: string; tasks: Task[] }>)

  const toggleStore = (storeId: string) => {
    const newExpanded = new Set(expandedStores)
    if (newExpanded.has(storeId)) {
      newExpanded.delete(storeId)
    } else {
      newExpanded.add(storeId)
    }
    setExpandedStores(newExpanded)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'done':
        return <CheckCircle2 className="h-4 w-4 text-[#22c55e]" />
      case 'in_progress':
        return <Clock className="h-4 w-4 text-[#3b82f6]" />
      case 'blocked':
        return <AlertCircle className="h-4 w-4 text-[#ef4444]" />
      default:
        return <Circle className="h-4 w-4 text-[#8b7fad]" />
    }
  }

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: 'معلقة',
      in_progress: 'قيد التنفيذ',
      done: 'مكتملة',
      blocked: 'متوقفة'
    }
    return labels[status] || status
  }

  const getStatusVariant = (status: string): 'success' | 'info' | 'warning' | 'error' | 'muted' => {
    const variants: Record<string, 'success' | 'info' | 'warning' | 'error' | 'muted'> = {
      done: 'success',
      in_progress: 'info',
      pending: 'muted',
      blocked: 'error'
    }
    return variants[status] || 'muted'
  }

  const isOverdue = (dueDate?: string) => {
    if (!dueDate) return false
    return new Date(dueDate) < new Date()
  }

  // إحصائيات
  const stats = {
    total: filteredTasks.length,
    pending: filteredTasks.filter(t => t.status === 'pending').length,
    inProgress: filteredTasks.filter(t => t.status === 'in_progress').length,
    done: filteredTasks.filter(t => t.status === 'done').length,
    overdue: filteredTasks.filter(t => t.status !== 'done' && isOverdue(t.due_date)).length
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[24px] font-bold text-white">المهام</h1>
          <p className="text-[14px] text-[#8b7fad]">إدارة مهام المتاجر والمهام اليدوية</p>
        </div>
        <div className="flex items-center gap-3">
          {/* زر إدارة قوالب المهام - يظهر فقط للأدمن */}
          <Link href="/admin/task-templates">
            <Button variant="secondary" size="md">
              <Settings2 className="h-4 w-4 ml-2" />
              إدارة قوالب المهام
            </Button>
          </Link>
          <Button variant="primary" size="md" onClick={() => setShowAddTaskModal(true)}>
            <Plus className="h-4 w-4 ml-2" />
            إضافة مهمة
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-[#3d2d5a] border border-[#5a4985]/40 rounded-xl p-4">
          <p className="text-[12px] text-[#8b7fad] mb-1">إجمالي المهام</p>
          <p className="text-[24px] font-bold text-white">{stats.total}</p>
        </div>
        <div className="bg-[#3d2d5a] border border-[#5a4985]/40 rounded-xl p-4">
          <p className="text-[12px] text-[#8b7fad] mb-1">معلقة</p>
          <p className="text-[24px] font-bold text-[#8b7fad]">{stats.pending}</p>
        </div>
        <div className="bg-[#3d2d5a] border border-[#5a4985]/40 rounded-xl p-4">
          <p className="text-[12px] text-[#8b7fad] mb-1">قيد التنفيذ</p>
          <p className="text-[24px] font-bold text-[#3b82f6]">{stats.inProgress}</p>
        </div>
        <div className="bg-[#3d2d5a] border border-[#5a4985]/40 rounded-xl p-4">
          <p className="text-[12px] text-[#8b7fad] mb-1">مكتملة</p>
          <p className="text-[24px] font-bold text-[#22c55e]">{stats.done}</p>
        </div>
        <div className="bg-[#3d2d5a] border border-[#5a4985]/40 rounded-xl p-4">
          <p className="text-[12px] text-[#8b7fad] mb-1">متأخرة</p>
          <p className="text-[24px] font-bold text-[#ef4444]">{stats.overdue}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        {/* Account Manager Filter */}
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-[#8b7fad]" />
          <select
            value={selectedManager || ''}
            onChange={(e) => setSelectedManager(e.target.value || null)}
            className="h-9 px-3 text-[13px] bg-[#2d1f4e] border border-[#5a4985]/60 rounded-lg text-white focus:outline-none focus:border-[#a855f7]"
          >
            <option value="">جميع المدراء</option>
            {accountManagers.map(manager => (
              <option key={manager.id} value={manager.id}>{manager.name}</option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-[#8b7fad]" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="h-9 px-3 text-[13px] bg-[#2d1f4e] border border-[#5a4985]/60 rounded-lg text-white focus:outline-none focus:border-[#a855f7]"
          >
            <option value="all">جميع الحالات</option>
            <option value="pending">معلقة</option>
            <option value="in_progress">قيد التنفيذ</option>
            <option value="done">مكتملة</option>
            <option value="blocked">متوقفة</option>
          </select>
        </div>

        {/* Type Filter */}
        <div className="flex items-center gap-2">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="h-9 px-3 text-[13px] bg-[#2d1f4e] border border-[#5a4985]/60 rounded-lg text-white focus:outline-none focus:border-[#a855f7]"
          >
            <option value="all">جميع الأنواع</option>
            <option value="template">مهام القوالب</option>
            <option value="manual">مهام يدوية</option>
          </select>
        </div>
      </div>

      {/* Tasks by Store */}
      <div className="space-y-4">
        {Object.entries(tasksByStore).map(([storeId, { store_name, tasks }]) => {
          const completedCount = tasks.filter(t => t.status === 'done').length
          const isExpanded = expandedStores.has(storeId)
          
          return (
            <div key={storeId} className="bg-[#3d2d5a] border border-[#5a4985]/40 rounded-xl overflow-hidden">
              {/* Store Header */}
              <button
                onClick={() => toggleStore(storeId)}
                className="w-full flex items-center justify-between p-4 hover:bg-[#4a3a6a] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Store className="h-5 w-5 text-[#a855f7]" />
                  <span className="text-[15px] font-medium text-white">{store_name}</span>
                  <span className="text-[12px] text-[#8b7fad]">
                    ({completedCount}/{tasks.length} مكتملة)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {completedCount === tasks.length && (
                    <CheckCircle2 className="h-4 w-4 text-[#22c55e]" />
                  )}
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4 text-[#8b7fad]" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-[#8b7fad]" />
                  )}
                </div>
              </button>

              {/* Tasks List */}
              {isExpanded && (
                <div className="border-t border-[#5a4985]/30 p-3 space-y-2">
                  {tasks.map(task => (
                    <div 
                      key={task.id}
                      className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                        task.status === 'done' 
                          ? 'bg-[#22c55e]/10' 
                          : 'bg-[#2d1f4e] hover:bg-[#352a52]'
                      }`}
                    >
                      {getStatusIcon(task.status)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className={`text-[13px] ${task.status === 'done' ? 'text-[#8b7fad] line-through' : 'text-white'}`}>
                            {task.title}
                          </p>
                          {task.type === 'manual' && (
                            <Badge variant="purple" size="sm">يدوية</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-[11px] text-[#8b7fad]">{task.section}</span>
                          {task.due_date && (
                            <span className={`text-[11px] flex items-center gap-1 ${
                              isOverdue(task.due_date) && task.status !== 'done' 
                                ? 'text-[#ef4444]' 
                                : 'text-[#8b7fad]'
                            }`}>
                              <Calendar className="h-3 w-3" />
                              {task.due_date}
                            </span>
                          )}
                        </div>
                      </div>
                      <Badge variant={getStatusVariant(task.status)} size="sm">
                        {getStatusLabel(task.status)}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Empty State */}
      {Object.keys(tasksByStore).length === 0 && (
        <div className="text-center py-12">
          <CheckCircle2 className="h-12 w-12 mx-auto text-[#8b7fad] mb-4" />
          <h3 className="text-[16px] font-medium text-white">لا توجد مهام</h3>
          <p className="text-[14px] text-[#8b7fad]">لم يتم العثور على مهام تطابق الفلاتر المحددة</p>
        </div>
      )}

      {/* Add Task Modal */}
      {showAddTaskModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowAddTaskModal(false)}
          />
          
          {/* Modal */}
          <div className="relative bg-[#2d1f4e] border border-[#5a4985]/60 rounded-xl w-full max-w-md mx-4 p-6 shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-[18px] font-bold text-white">إضافة مهمة جديدة</h2>
              <button
                onClick={() => setShowAddTaskModal(false)}
                className="p-1 text-[#8b7fad] hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Form */}
            <div className="space-y-4">
              {/* عنوان المهمة */}
              <div>
                <label className="block text-[13px] text-[#c4b5fd] mb-1.5">عنوان المهمة *</label>
                <input
                  type="text"
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  placeholder="أدخل عنوان المهمة..."
                  className="w-full h-10 px-3 text-[14px] bg-[#1a1230] border border-[#5a4985]/60 rounded-lg text-white placeholder:text-[#8b7fad] focus:outline-none focus:border-[#a855f7] transition-all"
                />
              </div>

              {/* المتجر */}
              <div>
                <label className="block text-[13px] text-[#c4b5fd] mb-1.5">المتجر *</label>
                <select
                  value={newTask.store_id}
                  onChange={(e) => setNewTask({ ...newTask, store_id: e.target.value })}
                  className="w-full h-10 px-3 text-[14px] bg-[#1a1230] border border-[#5a4985]/60 rounded-lg text-white focus:outline-none focus:border-[#a855f7] transition-all"
                >
                  <option value="">اختر المتجر...</option>
                  {stores.map(store => (
                    <option key={store.id} value={store.id}>{store.name}</option>
                  ))}
                </select>
              </div>

              {/* تاريخ الاستحقاق */}
              <div>
                <label className="block text-[13px] text-[#c4b5fd] mb-1.5">تاريخ الاستحقاق</label>
                <input
                  type="date"
                  value={newTask.due_date}
                  onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })}
                  className="w-full h-10 px-3 text-[14px] bg-[#1a1230] border border-[#5a4985]/60 rounded-lg text-white focus:outline-none focus:border-[#a855f7] transition-all"
                />
              </div>

              {/* الوصف */}
              <div>
                <label className="block text-[13px] text-[#c4b5fd] mb-1.5">الوصف</label>
                <textarea
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  placeholder="أدخل وصف المهمة (اختياري)..."
                  rows={3}
                  className="w-full px-3 py-2 text-[14px] bg-[#1a1230] border border-[#5a4985]/60 rounded-lg text-white placeholder:text-[#8b7fad] focus:outline-none focus:border-[#a855f7] transition-all resize-none"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 mt-6">
              <Button variant="primary" size="md" className="flex-1" onClick={handleAddTask}>
                <Plus className="h-4 w-4 ml-2" />
                إضافة المهمة
              </Button>
              <Button variant="secondary" size="md" onClick={() => setShowAddTaskModal(false)}>
                إلغاء
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
