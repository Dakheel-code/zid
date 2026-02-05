'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CheckCircle, Clock, AlertCircle, Plus, X, Loader2, CheckSquare } from 'lucide-react'
import { createBrowserClient } from '@supabase/ssr'

interface Task {
  id: string
  title: string
  description: string
  status: 'pending' | 'in_progress' | 'completed'
  priority: 'low' | 'medium' | 'high'
  dueDate: string
  storeName: string
  storeId: string
}

interface Store {
  id: string
  store_name: string
}

const statusConfig = {
  pending: { label: 'قيد الانتظار', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  in_progress: { label: 'قيد التنفيذ', color: 'bg-blue-100 text-blue-800', icon: AlertCircle },
  completed: { label: 'مكتملة', color: 'bg-green-100 text-green-800', icon: CheckCircle }
}

const priorityConfig = {
  low: { label: 'منخفضة', color: 'bg-gray-100 text-gray-800' },
  medium: { label: 'متوسطة', color: 'bg-orange-100 text-orange-800' },
  high: { label: 'عالية', color: 'bg-red-100 text-red-800' }
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [stores, setStores] = useState<Store[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  
  // Form state
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
    dueDate: '',
    storeId: ''
  })

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        // جلب المتاجر التابعة للمدير
        const { data: storesData } = await supabase
          .from('stores')
          .select('id, store_name')
          .eq('assigned_manager_id', user.id)
          .order('store_name')

        if (storesData) {
          setStores(storesData)
          
          // جلب المهام من store_tasks للمتاجر المسندة
          const storeIds = storesData.map(s => s.id)
          if (storeIds.length > 0) {
            const { data: tasksData } = await supabase
              .from('store_tasks')
              .select('id, title, description, status, due_date, store_id')
              .in('store_id', storeIds)
              .order('due_date', { ascending: true })

            if (tasksData) {
              const storeMap = new Map(storesData.map(s => [s.id, s.store_name]))
              const formattedTasks: Task[] = tasksData.map((task: any) => ({
                id: task.id,
                title: task.title,
                description: task.description || '',
                status: task.status === 'done' ? 'completed' : task.status === 'new' ? 'pending' : task.status,
                priority: 'medium',
                dueDate: task.due_date || '',
                storeName: storeMap.get(task.store_id) || '',
                storeId: task.store_id
              }))
              setTasks(formattedTasks)
            }
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const handleAddTask = async () => {
    if (!newTask.title || !newTask.storeId) {
      setMessage({ type: 'error', text: 'يرجى ملء العنوان واختيار المتجر' })
      return
    }

    setSaving(true)
    setMessage(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('store_tasks')
        .insert({
          title: newTask.title,
          description: newTask.description,
          due_date: newTask.dueDate || null,
          store_id: newTask.storeId,
          created_by_id: user.id,
          status: 'new'
        })
        .select('id, title, description, status, due_date, store_id')
        .single()

      if (error) throw error

      if (data) {
        const store = stores.find(s => s.id === data.store_id)
        const formattedTask: Task = {
          id: data.id,
          title: data.title,
          description: data.description || '',
          status: 'pending',
          priority: 'medium',
          dueDate: data.due_date || '',
          storeName: store?.store_name || 'غير محدد',
          storeId: data.store_id
        }
        setTasks([formattedTask, ...tasks])
      }

      setShowAddModal(false)
      setNewTask({
        title: '',
        description: '',
        priority: 'medium',
        dueDate: '',
        storeId: ''
      })
      setMessage({ type: 'success', text: 'تم إضافة المهمة بنجاح' })
    } catch (error) {
      console.error('Error adding task:', error)
      setMessage({ type: 'error', text: 'حدث خطأ أثناء إضافة المهمة' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
      </div>
    )
  }

  return (
    <div className="p-4 lg:p-6 space-y-4 lg:space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl lg:text-2xl font-bold">مهامي</h1>
        <Button onClick={() => setShowAddModal(true)}>
          <Plus className="h-4 w-4 ml-2" />
          إضافة مهمة
        </Button>
      </div>

      {message && (
        <div className={`p-3 rounded-lg text-sm ${
          message.type === 'success' 
            ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
            : 'bg-red-500/20 text-red-400 border border-red-500/30'
        }`}>
          {message.text}
        </div>
      )}

      <div className="grid gap-4">
        {tasks.length === 0 ? (
          <div className="text-center py-12 bg-[#2d2640] rounded-xl">
            <CheckSquare className="h-12 w-12 text-gray-500 mx-auto mb-4" />
            <p className="text-gray-400">لا توجد مهام</p>
            <p className="text-gray-500 text-sm mt-1">اضغط على "إضافة مهمة" لإنشاء مهمة جديدة</p>
          </div>
        ) : (
          tasks.map((task) => {
            const status = statusConfig[task.status]
            const priority = priorityConfig[task.priority]
            const StatusIcon = status.icon

            return (
              <Card key={task.id}>
                <CardHeader className="pb-2">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                    <div>
                      <CardTitle className="text-lg">{task.title}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">{task.description}</p>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      <Badge className={priority.color}>{priority.label}</Badge>
                      <Badge className={status.color}>
                        <StatusIcon className="h-3 w-3 ml-1" />
                        {status.label}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between text-sm text-muted-foreground gap-1">
                    <span>المتجر: {task.storeName}</span>
                    <span>تاريخ الاستحقاق: {task.dueDate || 'غير محدد'}</span>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>

      {/* Add Task Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-[#2d2640] border border-[#3d3555] rounded-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">إضافة مهمة جديدة</h2>
              <button 
                onClick={() => setShowAddModal(false)}
                className="p-2 hover:bg-[#3d3555] rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-gray-400" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="store">المتجر *</Label>
                <select
                  id="store"
                  value={newTask.storeId}
                  onChange={(e) => setNewTask({ ...newTask, storeId: e.target.value })}
                  className="w-full h-10 px-3 bg-[#1a1625] border border-[#3d3555] rounded-lg text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="">اختر المتجر</option>
                  {stores.map((store) => (
                    <option key={store.id} value={store.id}>
                      {store.store_name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">عنوان المهمة *</Label>
                <Input
                  id="title"
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  placeholder="أدخل عنوان المهمة"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">الوصف</Label>
                <textarea
                  id="description"
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  placeholder="أدخل وصف المهمة"
                  rows={3}
                  className="w-full px-3 py-2 bg-[#1a1625] border border-[#3d3555] rounded-lg text-white placeholder:text-gray-500 focus:outline-none focus:border-purple-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="priority">الأولوية</Label>
                  <select
                    id="priority"
                    value={newTask.priority}
                    onChange={(e) => setNewTask({ ...newTask, priority: e.target.value as 'low' | 'medium' | 'high' })}
                    className="w-full h-10 px-3 bg-[#1a1625] border border-[#3d3555] rounded-lg text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="low">منخفضة</option>
                    <option value="medium">متوسطة</option>
                    <option value="high">عالية</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dueDate">تاريخ الاستحقاق</Label>
                  <Input
                    id="dueDate"
                    type="date"
                    value={newTask.dueDate}
                    onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <Button
                onClick={handleAddTask}
                disabled={saving}
                className="flex-1"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4 ml-2" />
                )}
                إضافة المهمة
              </Button>
              <Button
                variant="secondary"
                onClick={() => setShowAddModal(false)}
                disabled={saving}
              >
                إلغاء
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
