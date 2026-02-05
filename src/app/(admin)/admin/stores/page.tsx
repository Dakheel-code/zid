'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Store, 
  Plus, 
  Search, 
  MoreVertical,
  ExternalLink,
  User,
  Phone,
  Mail,
  Eye,
  X,
  ChevronDown
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { createBrowserClient } from '@supabase/ssr'
import type { Store as StoreType, StorePriority, StoreStatus } from '@/lib/supabase/types-simple'

/**
 * Admin Stores Page - Dark Purple Theme
 * ======================================
 * ✅ Grid
 * ✅ Background داكن بنفسجي
 * ✅ Cards بنفسجية غامقة
 * ✅ Accent colors واضحة
 */

interface StoreWithManager extends StoreType {
  manager_name?: string
}

interface Manager {
  id: string
  name: string
  email: string
}

export default function AdminStoresPage() {
  const router = useRouter()
  const [stores, setStores] = useState<StoreWithManager[]>([])
  const [managers, setManagers] = useState<Manager[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<StoreStatus | 'all'>('all')
  const [priorityFilter, setPriorityFilter] = useState<StorePriority | 'all'>('all')
  const [managerFilter, setManagerFilter] = useState<string>('all')
  const [showAddModal, setShowAddModal] = useState(false)
  const [newStore, setNewStore] = useState({
    store_name: '',
    store_url: '',
    owner_name: '',
    owner_email: '',
    owner_phone: '',
    priority: 'medium' as StorePriority,
    assigned_manager_id: ''
  })

  const handleAddStore = () => {
    setShowAddModal(true)
  }

  const handleCloseModal = () => {
    setShowAddModal(false)
    setNewStore({
      store_name: '',
      store_url: '',
      owner_name: '',
      owner_email: '',
      owner_phone: '',
      priority: 'medium',
      assigned_manager_id: ''
    })
  }

  const handleSubmitStore = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const { createStore } = await import('@/lib/services/store-service')
      const result = await createStore({
        store_url: newStore.store_url,
        store_name: newStore.store_name || undefined,
        owner_name: newStore.owner_name || undefined,
        owner_email: newStore.owner_email || undefined,
        owner_phone: newStore.owner_phone || undefined,
        priority: newStore.priority,
        assigned_manager_id: newStore.assigned_manager_id || undefined
      })
      
      if (result.success && result.store) {
        setStores([result.store as StoreWithManager, ...stores])
        handleCloseModal()
      } else {
        alert('حدث خطأ: ' + (result.error || 'فشل في إنشاء المتجر'))
      }
    } catch (error) {
      console.error('Error creating store:', error)
      alert('حدث خطأ أثناء إنشاء المتجر')
    }
  }

  const handleStoreClick = (storeId: string) => {
    router.push(`/admin/stores/${storeId}`)
  }

  useEffect(() => {
    async function fetchStores() {
      setLoading(true)
      try {
        const { getStores } = await import('@/lib/services/store-service')
        const result = await getStores()
        
        if (result.stores && result.stores.length > 0) {
          setStores(result.stores as StoreWithManager[])
        } else {
          setStores([])
        }
      } catch (error) {
        console.error('Error fetching stores:', error)
        setStores([])
      }
      setLoading(false)
    }
    
    async function fetchManagers() {
      try {
        const supabase = createBrowserClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        )
        // جلب مدراء العلاقات فقط (role = manager)
        const { data } = await supabase
          .from('profiles')
          .select('id, name, email, role')
          .eq('role', 'manager')
        
        if (data && data.length > 0) {
          setManagers(data.map(m => ({
            id: m.id,
            name: m.name || m.email?.split('@')[0] || 'مدير',
            email: m.email
          })))
        }
      } catch (error) {
        console.error('Error fetching managers:', error)
      }
    }
    
    fetchStores()
    fetchManagers()
  }, [])

  const filteredStores = stores.filter((store: StoreWithManager) => {
    const matchesSearch = 
      store.store_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      store.store_url.toLowerCase().includes(searchQuery.toLowerCase()) ||
      store.owner_name?.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || store.status === statusFilter
    const matchesPriority = priorityFilter === 'all' || store.priority === priorityFilter
    const matchesManager = managerFilter === 'all' || store.assigned_manager_id === managerFilter

    return matchesSearch && matchesStatus && matchesPriority && matchesManager
  })

  const getStatusVariant = (status: StoreStatus): 'success' | 'info' | 'warning' | 'error' => {
    const map: Record<StoreStatus, 'success' | 'info' | 'warning' | 'error'> = {
      active: 'success',
      new: 'info',
      paused: 'warning',
      ended: 'error'
    }
    return map[status]
  }

  const getStatusLabel = (status: StoreStatus) => {
    const labels: Record<StoreStatus, string> = {
      new: 'جديد',
      active: 'نشط',
      paused: 'متوقف',
      ended: 'منتهي'
    }
    return labels[status]
  }

  const getPriorityLabel = (priority: StorePriority) => {
    const labels: Record<StorePriority, string> = {
      high: 'عالية',
      medium: 'متوسطة',
      low: 'منخفضة'
    }
    return labels[priority]
  }

  const getPriorityVariant = (priority: StorePriority): 'warning' | 'purple' | 'muted' => {
    const map: Record<StorePriority, 'warning' | 'purple' | 'muted'> = {
      high: 'warning',
      medium: 'purple',
      low: 'muted'
    }
    return map[priority]
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-6 w-6 border-2 border-[#5a4985] border-t-[#a78bfa]"></div>
      </div>
    )
  }

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* Page Header - العنوان يضرب العين */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-[32px] font-extrabold text-white tracking-tight">إدارة المتاجر</h1>
          <p className="text-sm lg:text-[15px] text-[#c4b5fd] mt-1 lg:mt-2">عرض وإدارة جميع المتاجر</p>
        </div>
        <Button variant="primary" size="md" onClick={handleAddStore} className="w-full sm:w-auto">
          <Plus className="h-4 w-4 ml-2" />
          إضافة متجر
        </Button>
      </div>

      {/* Stats Cards - الحالات الأربع - أعلى شريط الفلترة */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* نشط - أخضر */}
        <div className="bg-[#3d2d5a] border-r-4 border-[#22c55e] rounded-xl p-4">
          <p className="text-[28px] font-extrabold text-[#4ade80]">{stores.filter(s => s.status === 'active').length}</p>
          <p className="text-[11px] text-[#8b7fad] mt-1">نشط</p>
        </div>
        {/* جديد - أزرق */}
        <div className="bg-[#3d2d5a] border-r-4 border-[#3b82f6] rounded-xl p-4">
          <p className="text-[28px] font-extrabold text-[#60a5fa]">{stores.filter(s => s.status === 'new').length}</p>
          <p className="text-[11px] text-[#8b7fad] mt-1">جديد</p>
        </div>
        {/* متوقف - برتقالي */}
        <div className="bg-[#3d2d5a] border-r-4 border-[#f97316] rounded-xl p-4">
          <p className="text-[28px] font-extrabold text-[#fb923c]">{stores.filter(s => s.status === 'paused').length}</p>
          <p className="text-[11px] text-[#8b7fad] mt-1">متوقف</p>
        </div>
        {/* منتهي - أحمر */}
        <div className="bg-[#3d2d5a] border-r-4 border-[#ef4444] rounded-xl p-4">
          <p className="text-[28px] font-extrabold text-[#f87171]">{stores.filter(s => s.status === 'ended').length}</p>
          <p className="text-[11px] text-[#8b7fad] mt-1">منتهي</p>
        </div>
      </div>

      {/* Toolbar - شريط البحث والفلترة */}
      <div className="p-3 lg:p-4 bg-[#3d2d5a] border border-[#5a4985]/40 rounded-xl">
        {/* Search & Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="relative sm:col-span-2 lg:col-span-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8b7fad]" />
            <input
              type="text"
              placeholder="ابحث عن متجر..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 pr-10 pl-4 text-[14px] bg-[#2d1f4e] border border-[#5a4985]/60 rounded-lg text-white placeholder:text-[#8b7fad] focus:outline-none focus:border-[#a855f7] focus:ring-2 focus:ring-[#a855f7]/30 transition-all"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StoreStatus | 'all')}
            className="h-10 px-4 text-[14px] bg-[#2d1f4e] border border-[#5a4985]/60 rounded-lg text-[#c4b5fd] focus:outline-none focus:border-[#a855f7] focus:ring-2 focus:ring-[#a855f7]/30 transition-all"
          >
            <option value="all">جميع الحالات</option>
            <option value="new">جديد</option>
            <option value="active">نشط</option>
            <option value="paused">متوقف</option>
            <option value="ended">منتهي</option>
          </select>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value as StorePriority | 'all')}
            className="h-10 px-4 text-[14px] bg-[#2d1f4e] border border-[#5a4985]/60 rounded-lg text-[#c4b5fd] focus:outline-none focus:border-[#a855f7] focus:ring-2 focus:ring-[#a855f7]/30 transition-all"
          >
            <option value="all">جميع الأولويات</option>
            <option value="high">عالية</option>
            <option value="medium">متوسطة</option>
            <option value="low">منخفضة</option>
          </select>
          <select
            value={managerFilter}
            onChange={(e) => setManagerFilter(e.target.value)}
            className="h-10 px-4 text-[14px] bg-[#2d1f4e] border border-[#5a4985]/60 rounded-lg text-[#c4b5fd] focus:outline-none focus:border-[#a855f7] focus:ring-2 focus:ring-[#a855f7]/30 transition-all"
          >
            <option value="all">جميع المدراء</option>
            {managers.map((manager) => (
              <option key={manager.id} value={manager.id}>
                {manager.name || manager.email.split('@')[0]}
              </option>
            ))}
          </select>
        </div>
        {/* Action Icons */}
        <div className="flex items-center gap-2">
          <button className="p-2.5 bg-[#2d1f4e] border border-[#5a4985]/60 rounded-lg text-[#c4b5fd] hover:bg-[#453565] hover:text-white transition-all" title="تصدير">
            <ExternalLink className="h-4 w-4" />
          </button>
          <button className="p-2.5 bg-[#2d1f4e] border border-[#5a4985]/60 rounded-lg text-[#c4b5fd] hover:bg-[#453565] hover:text-white transition-all" title="استيراد">
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Stores Grid - كما الصورة حرفياً */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {filteredStores.map((store: StoreWithManager) => (
          <div 
            key={store.id} 
            onClick={() => handleStoreClick(store.id)}
            className="group bg-[#3d2d5a] border border-[#5a4985]/40 rounded-xl p-4 hover:border-[#a855f7] hover:shadow-[0_0_20px_rgba(168,85,247,0.15)] transition-all duration-200 cursor-pointer"
          >
            {/* Store Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                {/* أيقونة المتجر */}
                <div className="w-11 h-11 bg-[#2d1f4e] rounded-xl flex items-center justify-center border border-[#5a4985]/40">
                  {store.store_logo_url ? (
                    <img 
                      src={store.store_logo_url} 
                      alt={store.store_name || ''} 
                      className="w-full h-full object-cover rounded-xl"
                    />
                  ) : (
                    <Store className="h-5 w-5 text-[#a855f7]" />
                  )}
                </div>
                <div>
                  {/* اسم المتجر - أبيض */}
                  <h3 className="text-[15px] font-bold text-white">
                    {store.store_name || 'بدون اسم'}
                  </h3>
                  {/* الرابط - Accent */}
                  <a 
                    href={store.store_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-[12px] text-[#a855f7] hover:text-[#c084fc] flex items-center gap-1 transition-colors"
                  >
                    {store.store_url.replace('https://', '')}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>
              {/* Action Icons */}
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button className="p-1.5 hover:bg-[#5a4985] rounded-lg transition-colors" title="عرض">
                  <ExternalLink className="h-4 w-4 text-[#c4b5fd]" />
                </button>
                <button className="p-1.5 hover:bg-[#5a4985] rounded-lg transition-colors" title="المزيد">
                  <MoreVertical className="h-4 w-4 text-[#c4b5fd]" />
                </button>
              </div>
            </div>

            {/* Badges - ملونة حسب الحالة والأولوية */}
            <div className="flex items-center gap-2">
              <Badge variant={getStatusVariant(store.status)} size="sm">
                {getStatusLabel(store.status)}
              </Badge>
              <Badge variant={getPriorityVariant(store.priority)} size="sm">
                {getPriorityLabel(store.priority)}
              </Badge>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredStores.length === 0 && (
        <div className="text-center py-16 bg-[#3d2d5a] border border-[#5a4985]/60 shadow-[0_4px_24px_rgba(139,92,246,0.08)] rounded-xl">
          <Store className="h-12 w-12 mx-auto text-[#3d3555] mb-4" />
          <h3 className="text-[16px] font-medium text-white">لا توجد متاجر</h3>
          <p className="text-[14px] text-[#94a3b8] mt-1">لم يتم العثور على متاجر تطابق البحث</p>
        </div>
      )}

      {/* Add Store Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={handleCloseModal}
          />
          
          {/* Modal */}
          <div className="relative bg-[#2d1f4e] border border-[#5a4985] rounded-2xl w-full max-w-lg mx-4 shadow-[0_0_50px_rgba(168,85,247,0.2)]">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-[#5a4985]/50">
              <h2 className="text-[20px] font-bold text-white">إضافة متجر جديد</h2>
              <button 
                onClick={handleCloseModal}
                className="p-2 hover:bg-[#3d2d5a] rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-[#c4b5fd]" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmitStore} className="p-5 space-y-4">
              {/* Store URL - Required */}
              <div>
                <label className="block text-[13px] font-medium text-[#c4b5fd] mb-1.5">
                  رابط المتجر <span className="text-red-400">*</span>
                </label>
                <input
                  type="url"
                  value={newStore.store_url}
                  onChange={(e) => setNewStore({...newStore, store_url: e.target.value})}
                  required
                  className="w-full h-10 px-4 text-[14px] bg-[#1a1230] border border-[#5a4985]/60 rounded-lg text-white placeholder:text-[#8b7fad] focus:outline-none focus:border-[#a855f7] focus:ring-2 focus:ring-[#a855f7]/30 transition-all"
                  placeholder="https://example.zid.store"
                  dir="ltr"
                />
              </div>

              {/* Store Name */}
              <div>
                <label className="block text-[13px] font-medium text-[#c4b5fd] mb-1.5">اسم المتجر</label>
                <input
                  type="text"
                  value={newStore.store_name}
                  onChange={(e) => setNewStore({...newStore, store_name: e.target.value})}
                  className="w-full h-10 px-4 text-[14px] bg-[#1a1230] border border-[#5a4985]/60 rounded-lg text-white placeholder:text-[#8b7fad] focus:outline-none focus:border-[#a855f7] focus:ring-2 focus:ring-[#a855f7]/30 transition-all"
                  placeholder="أدخل اسم المتجر (اختياري)"
                />
              </div>

              {/* Owner Name */}
              <div>
                <label className="block text-[13px] font-medium text-[#c4b5fd] mb-1.5">اسم المالك</label>
                <input
                  type="text"
                  value={newStore.owner_name}
                  onChange={(e) => setNewStore({...newStore, owner_name: e.target.value})}
                  className="w-full h-10 px-4 text-[14px] bg-[#1a1230] border border-[#5a4985]/60 rounded-lg text-white placeholder:text-[#8b7fad] focus:outline-none focus:border-[#a855f7] focus:ring-2 focus:ring-[#a855f7]/30 transition-all"
                  placeholder="أدخل اسم المالك (اختياري)"
                />
              </div>

              {/* Owner Phone */}
              <div>
                <label className="block text-[13px] font-medium text-[#c4b5fd] mb-1.5">رقم الجوال</label>
                <input
                  type="tel"
                  value={newStore.owner_phone}
                  onChange={(e) => setNewStore({...newStore, owner_phone: e.target.value})}
                  className="w-full h-10 px-4 text-[14px] bg-[#1a1230] border border-[#5a4985]/60 rounded-lg text-white placeholder:text-[#8b7fad] focus:outline-none focus:border-[#a855f7] focus:ring-2 focus:ring-[#a855f7]/30 transition-all"
                  placeholder="+966501234567"
                  dir="ltr"
                />
              </div>

              {/* Owner Email */}
              <div>
                <label className="block text-[13px] font-medium text-[#c4b5fd] mb-1.5">البريد الإلكتروني</label>
                <input
                  type="email"
                  value={newStore.owner_email}
                  onChange={(e) => setNewStore({...newStore, owner_email: e.target.value})}
                  className="w-full h-10 px-4 text-[14px] bg-[#1a1230] border border-[#5a4985]/60 rounded-lg text-white placeholder:text-[#8b7fad] focus:outline-none focus:border-[#a855f7] focus:ring-2 focus:ring-[#a855f7]/30 transition-all"
                  placeholder="email@example.com"
                  dir="ltr"
                />
              </div>

              {/* Assigned Manager */}
              <div>
                <label className="block text-[13px] font-medium text-[#c4b5fd] mb-1.5">مدير العلاقة</label>
                <select
                  value={newStore.assigned_manager_id}
                  onChange={(e) => setNewStore({...newStore, assigned_manager_id: e.target.value})}
                  className="w-full h-10 px-4 text-[14px] bg-[#1a1230] border border-[#5a4985]/60 rounded-lg text-[#c4b5fd] focus:outline-none focus:border-[#a855f7] focus:ring-2 focus:ring-[#a855f7]/30 transition-all"
                >
                  <option value="">-- اختر مدير العلاقة --</option>
                  {managers.map((manager) => (
                    <option key={manager.id} value={manager.id}>
                      {manager.name} ({manager.email})
                    </option>
                  ))}
                </select>
              </div>

              {/* Priority */}
              <div>
                <label className="block text-[13px] font-medium text-[#c4b5fd] mb-1.5">الأولوية</label>
                <select
                  value={newStore.priority}
                  onChange={(e) => setNewStore({...newStore, priority: e.target.value as StorePriority})}
                  className="w-full h-10 px-4 text-[14px] bg-[#1a1230] border border-[#5a4985]/60 rounded-lg text-[#c4b5fd] focus:outline-none focus:border-[#a855f7] focus:ring-2 focus:ring-[#a855f7]/30 transition-all"
                >
                  <option value="high">عالية</option>
                  <option value="medium">متوسطة</option>
                  <option value="low">منخفضة</option>
                </select>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 pt-3">
                <Button type="submit" variant="primary" size="md" className="flex-1">
                  <Plus className="h-4 w-4 ml-2" />
                  إضافة المتجر
                </Button>
                <Button type="button" variant="secondary" size="md" onClick={handleCloseModal}>
                  إلغاء
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
