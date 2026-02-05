'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { 
  Store, 
  CheckCircle2, 
  Clock,
  User,
  MessageCircle,
  Plus,
  AlertTriangle,
  Phone,
  Mail
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface PublicStoreData {
  store: {
    id: string
    store_name: string | null
    store_logo_url: string | null
    store_url: string
  }
  manager: {
    id: string
    name: string | null
    phone: string | null
    avatar_url: string | null
  }
  tasks: Array<{
    id: string
    title: string
    description: string | null
    status: 'pending' | 'done'
    section_title: string | null
  }>
  is_expired: boolean
  expires_at: string | null
}

export default function PublicStorePage() {
  const params = useParams()
  const token = params.token as string
  
  const [data, setData] = useState<PublicStoreData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showTaskForm, setShowTaskForm] = useState(false)
  const [newTask, setNewTask] = useState({ title: '', description: '', name: '', contact: '' })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        // TODO: Fetch from API
        // const response = await fetch(`/api/public/store/${token}`)
        // const result = await response.json()
        
        // Mock data for testing
        const mockData: PublicStoreData = {
          store: {
            id: '1',
            store_name: 'متجر الإلكترونيات',
            store_logo_url: null,
            store_url: 'https://example.zid.store'
          },
          manager: {
            id: '1',
            name: 'محمد علي',
            phone: '+966501234567',
            avatar_url: null
          },
          tasks: [
            { id: '1', title: 'مراجعة إعدادات المتجر', description: null, status: 'done', section_title: 'إعداد المتجر' },
            { id: '2', title: 'إضافة طرق الدفع', description: null, status: 'pending', section_title: 'إعداد المتجر' },
            { id: '3', title: 'إعداد الشحن', description: null, status: 'pending', section_title: 'إعداد المتجر' },
            { id: '4', title: 'مراجعة المنتجات', description: null, status: 'done', section_title: 'المنتجات' }
          ],
          is_expired: false,
          expires_at: null
        }
        
        setData(mockData)
        setLoading(false)
      } catch (err) {
        setError('حدث خطأ في تحميل البيانات')
        setLoading(false)
      }
    }

    fetchData()
  }, [token])

  const handleSubmitTask = async () => {
    if (!newTask.title || !newTask.name || !newTask.contact) return
    
    setSubmitting(true)
    try {
      // TODO: Submit to API
      // await fetch(`/api/public/store/${token}/tasks`, {
      //   method: 'POST',
      //   body: JSON.stringify(newTask)
      // })
      
      alert('تم إرسال طلبك بنجاح! سيتواصل معك مدير العلاقة قريباً.')
      setShowTaskForm(false)
      setNewTask({ title: '', description: '', name: '', contact: '' })
    } catch (err) {
      alert('حدث خطأ في إرسال الطلب')
    }
    setSubmitting(false)
  }

  const openWhatsApp = () => {
    if (data?.manager.phone) {
      const phone = data.manager.phone.replace(/\+/g, '')
      const message = encodeURIComponent(`مرحباً، أنا من متجر ${data.store.store_name}`)
      window.open(`https://wa.me/${phone}?text=${message}`, '_blank')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#1a1230]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#1a1230]">
        <div className="bg-[#2d2640] border border-[#3d3555] rounded-2xl max-w-md w-full mx-4 p-8 text-center">
          <AlertTriangle className="h-12 w-12 mx-auto text-red-500 mb-4" />
          <h2 className="text-xl font-bold mb-2 text-white">خطأ</h2>
          <p className="text-gray-400">{error || 'الصفحة غير موجودة'}</p>
        </div>
      </div>
    )
  }

  if (data.is_expired) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#1a1230]">
        <div className="bg-[#2d2640] border border-[#3d3555] rounded-2xl max-w-md w-full mx-4 p-8 text-center">
          <Clock className="h-12 w-12 mx-auto text-amber-500 mb-4" />
          <h2 className="text-xl font-bold mb-2 text-white">انتهت صلاحية الوصول</h2>
          <p className="text-gray-400">
            انتهت صلاحية الوصول لهذه الصفحة. يرجى التواصل مع مدير العلاقة للحصول على رابط جديد.
          </p>
        </div>
      </div>
    )
  }

  const completedTasks = data.tasks.filter(t => t.status === 'done').length
  const totalTasks = data.tasks.length
  const progressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

  return (
    <div className="min-h-screen bg-[#1a1230]" dir="rtl">
      {/* Header */}
      <header className="bg-[#1a1230] border-b border-[#3d3555] sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-center justify-center gap-3">
            <Store className="h-6 w-6 text-purple-400" />
            <h1 className="font-bold text-lg text-white">صفحة متابعة المهام</h1>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-4">
        {/* Manager Card */}
        <div className="bg-[#2d2640] border border-[#3d3555] rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-[#3d3555] rounded-full flex items-center justify-center">
                {data.manager.avatar_url ? (
                  <img 
                    src={data.manager.avatar_url} 
                    alt={data.manager.name || ''} 
                    className="w-full h-full object-cover rounded-full"
                  />
                ) : (
                  <User className="h-6 w-6 text-purple-400" />
                )}
              </div>
              <div>
                <p className="text-sm text-gray-400">مدير العلاقة</p>
                <p className="font-semibold text-white">{data.manager.name || 'مدير العلاقة'}</p>
              </div>
            </div>
            {data.manager.phone && (
              <Button onClick={openWhatsApp} className="bg-green-600 hover:bg-green-700 text-white">
                <MessageCircle className="h-4 w-4 ml-2" />
                واتساب
              </Button>
            )}
          </div>
        </div>

        {/* Progress Card */}
        <div className="bg-[#2d2640] border border-[#3d3555] rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="font-medium text-white">تقدم المهام</span>
            <span className="text-sm text-gray-400">
              {completedTasks} من {totalTasks} مهمة
            </span>
          </div>
          <div className="w-full bg-[#1a1230] rounded-full h-3">
            <div 
              className="bg-gradient-to-r from-purple-600 to-purple-400 h-3 rounded-full transition-all"
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>
          <p className="text-center text-sm text-gray-400 mt-2">
            {progressPercent}% مكتمل
          </p>
        </div>

        {/* Tasks List */}
        <div className="bg-[#2d2640] border border-[#3d3555] rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-[#3d3555]">
            <h2 className="text-lg font-bold text-white">المهام</h2>
          </div>
          <div className="divide-y divide-[#3d3555]">
            {data.tasks.map((task) => (
              <div key={task.id} className="p-4 flex items-center gap-3">
                {task.status === 'done' ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                ) : (
                  <Clock className="h-5 w-5 text-amber-500 flex-shrink-0" />
                )}
                <div className="flex-1">
                  <p className={task.status === 'done' ? 'line-through text-gray-500' : 'text-white'}>
                    {task.title}
                  </p>
                  {task.section_title && (
                    <p className="text-xs text-gray-500">{task.section_title}</p>
                  )}
                </div>
                <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                  task.status === 'done' 
                    ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                    : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                }`}>
                  {task.status === 'done' ? 'منجز' : 'قيد المتابعة'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* New Task Form */}
        {!showTaskForm ? (
          <button 
            onClick={() => setShowTaskForm(true)} 
            className="w-full py-3 border-2 border-dashed border-[#3d3555] rounded-2xl text-gray-400 hover:border-purple-500 hover:text-purple-400 transition-colors flex items-center justify-center gap-2"
          >
            <Plus className="h-4 w-4" />
            إرسال طلب جديد
          </button>
        ) : (
          <div className="bg-[#2d2640] border border-[#3d3555] rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-[#3d3555]">
              <h2 className="text-lg font-bold text-white">طلب جديد</h2>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block text-gray-300">عنوان الطلب *</label>
                <input
                  className="w-full px-3 py-2 bg-[#1a1230] border border-[#3d3555] rounded-lg text-white placeholder:text-gray-500 focus:outline-none focus:border-purple-500"
                  placeholder="مثال: تحسين صور المنتجات"
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block text-gray-300">التفاصيل</label>
                <textarea
                  className="w-full px-3 py-2 bg-[#1a1230] border border-[#3d3555] rounded-lg text-white placeholder:text-gray-500 focus:outline-none focus:border-purple-500 resize-none"
                  rows={3}
                  placeholder="اكتب تفاصيل طلبك..."
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1 block text-gray-300">اسمك *</label>
                  <input
                    className="w-full px-3 py-2 bg-[#1a1230] border border-[#3d3555] rounded-lg text-white placeholder:text-gray-500 focus:outline-none focus:border-purple-500"
                    placeholder="الاسم"
                    value={newTask.name}
                    onChange={(e) => setNewTask({ ...newTask, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block text-gray-300">رقم التواصل *</label>
                  <input
                    className="w-full px-3 py-2 bg-[#1a1230] border border-[#3d3555] rounded-lg text-white placeholder:text-gray-500 focus:outline-none focus:border-purple-500"
                    placeholder="رقم الجوال أو البريد"
                    value={newTask.contact}
                    onChange={(e) => setNewTask({ ...newTask, contact: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={handleSubmitTask} 
                  disabled={submitting || !newTask.title || !newTask.name || !newTask.contact}
                  className="flex-1 bg-purple-600 hover:bg-purple-700"
                >
                  {submitting ? 'جاري الإرسال...' : 'إرسال الطلب'}
                </Button>
                <Button 
                  variant="secondary" 
                  onClick={() => setShowTaskForm(false)}
                  className="bg-[#3d3555] hover:bg-[#4d4565] text-white border-0"
                >
                  إلغاء
                </Button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="text-center py-6 text-sm text-gray-500">
        <p>نظام إدارة المتاجر - ZID Dashboard</p>
      </footer>
    </div>
  )
}
