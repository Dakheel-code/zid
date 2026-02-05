'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Users, 
  Plus, 
  Search,
  Store,
  Phone,
  Calendar,
  Link2,
  X,
  Loader2,
  Trash2,
  MoreVertical
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createBrowserClient } from '@supabase/ssr'

interface ManagerWithStats {
  id: string
  email: string
  name: string
  phone: string | null
  avatar_url: string | null
  role: string
  booking_slug: string | null
  created_at: string
  stores_count: number
  active_tasks_count: number
}

export default function AdminAccountManagersPage() {
  const router = useRouter()
  const [managers, setManagers] = useState<ManagerWithStats[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedManager, setSelectedManager] = useState<ManagerWithStats | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [error, setError] = useState('')
  const [newManager, setNewManager] = useState({
    email: '',
    password: '',
    name: '',
    phone: ''
  })

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const fetchManagers = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'manager')
        .order('created_at', { ascending: false })

      if (error) throw error

      // Get stores count for each manager
      const managersWithStats = await Promise.all(
        (data || []).map(async (manager: any) => {
          // جلب المتاجر المسندة لهذا المدير
          const { data: managerStores } = await supabase
            .from('stores')
            .select('id')
            .eq('assigned_manager_id', manager.id)

          const storesCount = managerStores?.length || 0
          const storeIds = managerStores?.map(s => s.id) || []

          // جلب المهام النشطة فقط للمتاجر المسندة لهذا المدير
          let tasksCount = 0
          if (storeIds.length > 0) {
            const { count } = await supabase
              .from('store_tasks')
              .select('*', { count: 'exact', head: true })
              .in('store_id', storeIds)
              .in('status', ['new', 'in_progress'])
            tasksCount = count || 0
          }

          return {
            ...manager,
            stores_count: storesCount,
            active_tasks_count: tasksCount
          }
        })
      )

      setManagers(managersWithStats)
    } catch (err) {
      console.error('Error fetching managers:', err)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchManagers()
  }, [])

  const handleAddManager = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')

    try {
      // 1. Create user in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: newManager.email,
        password: newManager.password,
        email_confirm: true
      })

      if (authError) {
        // Try using signUp instead if admin API not available
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: newManager.email,
          password: newManager.password,
          options: {
            data: { name: newManager.name }
          }
        })

        if (signUpError) throw signUpError

        if (signUpData.user) {
          // 2. Update profile - استخدام الجزء الأول من الإيميل كـ booking_slug
          const bookingSlug = newManager.email.split('@')[0]
          await supabase
            .from('profiles')
            .update({
              name: newManager.name,
              phone: newManager.phone,
              role: 'manager',
              booking_slug: bookingSlug
            })
            .eq('id', signUpData.user.id)
        }
      } else if (authData.user) {
        // 2. Update profile - استخدام الجزء الأول من الإيميل كـ booking_slug
        const bookingSlug = newManager.email.split('@')[0]
        await supabase
          .from('profiles')
          .update({
            name: newManager.name,
            phone: newManager.phone,
            role: 'manager',
            booking_slug: bookingSlug
          })
          .eq('id', authData.user.id)
      }

      // 3. Refresh list
      await fetchManagers()
      setShowAddModal(false)
      setNewManager({ email: '', password: '', name: '', phone: '' })
    } catch (err: any) {
      console.error('Error creating manager:', err)
      setError(err.message || 'حدث خطأ أثناء إنشاء المدير')
    }
    setSaving(false)
  }

  const filteredManagers = managers.filter(manager => 
    manager.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    manager.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">مدراء العلاقات</h1>
          <p className="text-muted-foreground">إدارة فريق مدراء العلاقات</p>
        </div>
        <Button onClick={() => setShowAddModal(true)}>
          <Plus className="h-4 w-4 ml-2" />
          إضافة مدير
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="بحث بالاسم أو البريد..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pr-10"
        />
      </div>

      {/* Managers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredManagers.map((manager) => (
          <Card 
            key={manager.id} 
            className="bg-[#2d2640] border-[#3d3555] hover:border-purple-500/50 transition-all cursor-pointer"
            onClick={() => router.push(`/admin/account-managers/${manager.id}`)}
          >
            <CardContent className="p-5">
              {/* Manager Header */}
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 bg-purple-600/20 rounded-full flex items-center justify-center border-2 border-purple-500/30 flex-shrink-0">
                  {manager.avatar_url ? (
                    <img 
                      src={manager.avatar_url} 
                      alt={manager.name || ''} 
                      className="w-full h-full object-cover rounded-full"
                    />
                  ) : (
                    <span className="text-xl font-bold text-purple-400">
                      {manager.name?.charAt(0) || manager.email?.charAt(0)?.toUpperCase() || 'م'}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-white text-lg truncate">
                    {manager.name || 'بدون اسم'}
                  </h3>
                  <p className="text-sm text-gray-400 truncate">{manager.email}</p>
                </div>
                <button
                  className="p-2 hover:bg-[#3d3555] rounded-lg transition-colors flex-shrink-0"
                  onClick={(e) => {
                    e.stopPropagation()
                    setSelectedManager(manager)
                    setShowEditModal(true)
                  }}
                  title="تعديل"
                >
                  <MoreVertical className="h-5 w-5 text-gray-400" />
                </button>
              </div>

              {/* Contact Info */}
              <div className="space-y-2 text-sm mb-4">
                <div className="flex items-center gap-2 text-gray-400">
                  <Phone className="h-4 w-4 flex-shrink-0" />
                  <span dir="ltr">{manager.phone || 'لم يُحدد'}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-400">
                  <Link2 className="h-4 w-4 flex-shrink-0" />
                  <span className="text-xs truncate">/book/{manager.booking_slug || manager.email?.split('@')[0]}</span>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-3 pt-4 border-t border-[#3d3555]">
                <div 
                  className="text-center p-3 bg-[#1a1625] rounded-lg cursor-pointer hover:bg-[#251d35] transition-colors"
                  onClick={(e) => {
                    e.stopPropagation()
                    router.push(`/admin/stores?manager=${manager.id}`)
                  }}
                >
                  <div className="flex items-center justify-center gap-1 text-gray-500 mb-1">
                    <Store className="h-4 w-4" />
                  </div>
                  <p className="text-2xl font-bold text-white">{manager.stores_count > 0 ? manager.stores_count : '-'}</p>
                  <p className="text-xs text-gray-500">المتاجر</p>
                </div>
                <div className="text-center p-3 bg-[#1a1625] rounded-lg">
                  <div className="flex items-center justify-center gap-1 text-gray-500 mb-1">
                    <Calendar className="h-4 w-4" />
                  </div>
                  <p className="text-2xl font-bold text-white">
                    {manager.stores_count > 0 
                      ? `${manager.active_tasks_count > 0 
                          ? Math.round((1 - manager.active_tasks_count / (manager.stores_count * 5)) * 100) 
                          : 100}%`
                      : '-'}
                  </p>
                  <p className="text-xs text-gray-500">نسبة الإنجاز</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredManagers.length === 0 && (
        <div className="text-center py-12">
          <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">لا يوجد مدراء</h3>
          <p className="text-muted-foreground">لم يتم العثور على مدراء يطابقون البحث</p>
        </div>
      )}

      {/* Edit Manager Modal */}
      {showEditModal && selectedManager && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#2d2640] border border-[#3d3555] rounded-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">تعديل بيانات المدير</h2>
              <button 
                onClick={() => {
                  setShowEditModal(false)
                  setSelectedManager(null)
                }}
                className="p-1 hover:bg-[#3d3555] rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-gray-400" />
              </button>
            </div>

            <form onSubmit={async (e) => {
              e.preventDefault()
              setSaving(true)
              try {
                await supabase
                  .from('profiles')
                  .update({
                    name: selectedManager.name,
                    phone: selectedManager.phone,
                    booking_slug: selectedManager.booking_slug
                  })
                  .eq('id', selectedManager.id)
                
                await fetchManagers()
                setShowEditModal(false)
                setSelectedManager(null)
              } catch (err) {
                console.error('Error updating manager:', err)
              }
              setSaving(false)
            }} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">الاسم</label>
                <Input
                  value={selectedManager.name || ''}
                  onChange={(e) => setSelectedManager({ ...selectedManager, name: e.target.value })}
                  placeholder="أدخل اسم المدير"
                  className="bg-[#1a1625] border-[#3d3555]"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">البريد الإلكتروني</label>
                <Input
                  value={selectedManager.email}
                  disabled
                  dir="ltr"
                  className="bg-[#1a1625] border-[#3d3555] opacity-50"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">رقم الهاتف</label>
                <Input
                  type="tel"
                  value={selectedManager.phone || ''}
                  onChange={(e) => setSelectedManager({ ...selectedManager, phone: e.target.value })}
                  placeholder="+966501234567"
                  dir="ltr"
                  className="bg-[#1a1625] border-[#3d3555]"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setShowEditModal(false)
                    setSelectedManager(null)
                  }}
                  className="flex-1"
                >
                  إلغاء
                </Button>
                <Button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-purple-600 hover:bg-purple-700"
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                      جاري الحفظ...
                    </>
                  ) : (
                    'حفظ التغييرات'
                  )}
                </Button>
              </div>

              {/* Delete Button */}
              <div className="pt-4 mt-4 border-t border-[#3d3555]">
                {!showDeleteConfirm ? (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setShowDeleteConfirm(true)}
                    className="w-full text-red-400 hover:text-red-300 hover:bg-red-500/10"
                  >
                    <Trash2 className="h-4 w-4 ml-2" />
                    حذف المدير
                  </Button>
                ) : (
                  <div className="space-y-3">
                    <p className="text-sm text-red-400 text-center">
                      هل أنت متأكد من حذف هذا المدير؟ لا يمكن التراجع عن هذا الإجراء.
                    </p>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => setShowDeleteConfirm(false)}
                        className="flex-1"
                      >
                        إلغاء
                      </Button>
                      <Button
                        type="button"
                        disabled={deleting}
                        onClick={async () => {
                          setDeleting(true)
                          try {
                            // حذف من profiles
                            await supabase
                              .from('profiles')
                              .delete()
                              .eq('id', selectedManager.id)
                            
                            await fetchManagers()
                            setShowEditModal(false)
                            setSelectedManager(null)
                            setShowDeleteConfirm(false)
                          } catch (err) {
                            console.error('Error deleting manager:', err)
                          }
                          setDeleting(false)
                        }}
                        className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                      >
                        {deleting ? (
                          <>
                            <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                            جاري الحذف...
                          </>
                        ) : (
                          'تأكيد الحذف'
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Manager Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#2d2640] border border-[#3d3555] rounded-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">إضافة مدير علاقة جديد</h2>
              <button 
                onClick={() => setShowAddModal(false)}
                className="p-1 hover:bg-[#3d3555] rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-gray-400" />
              </button>
            </div>

            <form onSubmit={handleAddManager} className="space-y-4">
              {error && (
                <div className="p-3 rounded-lg bg-red-500/20 border border-red-500/50 text-red-300 text-sm">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">الاسم</label>
                <Input
                  value={newManager.name}
                  onChange={(e) => setNewManager({ ...newManager, name: e.target.value })}
                  placeholder="أدخل اسم المدير"
                  required
                  className="bg-[#1a1625] border-[#3d3555]"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">البريد الإلكتروني</label>
                <Input
                  type="email"
                  value={newManager.email}
                  onChange={(e) => setNewManager({ ...newManager, email: e.target.value })}
                  placeholder="example@zid.sa"
                  required
                  dir="ltr"
                  className="bg-[#1a1625] border-[#3d3555]"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">كلمة المرور</label>
                <Input
                  type="password"
                  value={newManager.password}
                  onChange={(e) => setNewManager({ ...newManager, password: e.target.value })}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  dir="ltr"
                  className="bg-[#1a1625] border-[#3d3555]"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">رقم الهاتف</label>
                <Input
                  type="tel"
                  value={newManager.phone}
                  onChange={(e) => setNewManager({ ...newManager, phone: e.target.value })}
                  placeholder="+966501234567"
                  dir="ltr"
                  className="bg-[#1a1625] border-[#3d3555]"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1"
                >
                  إلغاء
                </Button>
                <Button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-purple-600 hover:bg-purple-700"
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                      جاري الإنشاء...
                    </>
                  ) : (
                    'إنشاء المدير'
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
