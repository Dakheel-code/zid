'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { 
  ArrowRight,
  Store,
  Calendar,
  CheckSquare,
  Clock,
  Phone,
  Mail,
  Link2,
  AlertCircle,
  CheckCircle,
  XCircle,
  BarChart3,
  Edit,
  ExternalLink,
  Copy
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { createBrowserClient } from '@supabase/ssr'

interface ManagerProfile {
  id: string
  email: string
  name: string
  phone: string | null
  avatar_url: string | null
  booking_slug: string | null
  created_at: string
}

interface ManagerStats {
  total_stores: number
  active_stores: number
  paused_stores: number
  ended_stores: number
  total_tasks: number
  completed_tasks: number
  pending_tasks: number
  overdue_tasks: number
  total_meetings: number
  upcoming_meetings: number
}

interface RecentStore {
  id: string
  store_name: string | null
  store_url: string
  status: string
  created_at: string
}

interface RecentTask {
  id: string
  title: string
  status: string
  due_date: string | null
  store_name: string | null
}

interface Meeting {
  id: string
  guest_name: string
  guest_email: string
  guest_phone: string | null
  store_url: string | null
  scheduled_at: string
  status: string
  store_id: string | null
}

export default function ManagerDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const managerId = params.id as string

  const [manager, setManager] = useState<ManagerProfile | null>(null)
  const [stats, setStats] = useState<ManagerStats>({
    total_stores: 0,
    active_stores: 0,
    paused_stores: 0,
    ended_stores: 0,
    total_tasks: 0,
    completed_tasks: 0,
    pending_tasks: 0,
    overdue_tasks: 0,
    total_meetings: 0,
    upcoming_meetings: 0
  })
  const [recentStores, setRecentStores] = useState<RecentStore[]>([])
  const [recentTasks, setRecentTasks] = useState<RecentTask[]>([])
  const [upcomingMeetings, setUpcomingMeetings] = useState<Meeting[]>([])
  const [loading, setLoading] = useState(true)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    async function fetchManagerData() {
      setLoading(true)
      try {
        // جلب بيانات المدير
        const { data: managerData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', managerId)
          .single()

        if (managerData) {
          setManager(managerData)
        }

        // جلب إحصائيات المتاجر
        const { data: stores } = await supabase
          .from('stores')
          .select('id, status, store_name, store_url, created_at')
          .eq('assigned_manager_id', managerId)

        if (stores) {
          const storeStats = {
            total_stores: stores.length,
            active_stores: stores.filter(s => s.status === 'active').length,
            paused_stores: stores.filter(s => s.status === 'paused').length,
            ended_stores: stores.filter(s => s.status === 'ended').length,
          }
          setStats(prev => ({ ...prev, ...storeStats }))
          
          // آخر 5 متاجر
          setRecentStores(stores.slice(0, 5))
        }

        // جلب إحصائيات المهام
        const storeIds = stores?.map(s => s.id) || []
        if (storeIds.length > 0) {
          const { data: tasks } = await supabase
            .from('store_tasks')
            .select('id, title, status, due_date, store_id')
            .in('store_id', storeIds)

          if (tasks) {
            const now = new Date()
            const taskStats = {
              total_tasks: tasks.length,
              completed_tasks: tasks.filter(t => t.status === 'done').length,
              pending_tasks: tasks.filter(t => ['new', 'in_progress'].includes(t.status)).length,
              overdue_tasks: tasks.filter(t => 
                t.due_date && new Date(t.due_date) < now && t.status !== 'done'
              ).length,
            }
            setStats(prev => ({ ...prev, ...taskStats }))

            // آخر 5 مهام
            const recentTasksWithStore = tasks.slice(0, 5).map(task => {
              const store = stores?.find(s => s.id === task.store_id)
              return {
                ...task,
                store_name: store?.store_name || store?.store_url || null
              }
            })
            setRecentTasks(recentTasksWithStore)
          }
        }

        // جلب إحصائيات الاجتماعات
        const { count: totalMeetings } = await supabase
          .from('meetings')
          .select('*', { count: 'exact', head: true })
          .eq('manager_id', managerId)

        const { count: upcomingMeetings } = await supabase
          .from('meetings')
          .select('*', { count: 'exact', head: true })
          .eq('manager_id', managerId)
          .eq('status', 'scheduled')
          .gte('scheduled_at', new Date().toISOString())

        setStats(prev => ({
          ...prev,
          total_meetings: totalMeetings || 0,
          upcoming_meetings: upcomingMeetings || 0
        }))

        // جلب قائمة الاجتماعات القادمة
        const { data: meetingsData } = await supabase
          .from('meetings')
          .select('id, guest_name, guest_email, guest_phone, store_url, scheduled_at, status, store_id')
          .eq('manager_id', managerId)
          .eq('status', 'scheduled')
          .gte('scheduled_at', new Date().toISOString())
          .order('scheduled_at', { ascending: true })
          .limit(5)

        if (meetingsData) {
          setUpcomingMeetings(meetingsData)
        }

      } catch (err) {
        console.error('Error fetching manager data:', err)
      }
      setLoading(false)
    }

    if (managerId) {
      fetchManagerData()
    }
  }, [managerId])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-400 bg-green-500/20'
      case 'paused': return 'text-yellow-400 bg-yellow-500/20'
      case 'ended': return 'text-red-400 bg-red-500/20'
      case 'new': return 'text-blue-400 bg-blue-500/20'
      case 'done': return 'text-green-400 bg-green-500/20'
      case 'in_progress': return 'text-purple-400 bg-purple-500/20'
      case 'blocked': return 'text-red-400 bg-red-500/20'
      default: return 'text-gray-400 bg-gray-500/20'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return 'نشط'
      case 'paused': return 'متوقف'
      case 'ended': return 'منتهي'
      case 'new': return 'جديد'
      case 'done': return 'مكتمل'
      case 'in_progress': return 'قيد التنفيذ'
      case 'blocked': return 'معلق'
      default: return status
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
      </div>
    )
  }

  if (!manager) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 mx-auto text-red-400 mb-4" />
        <h3 className="text-lg font-medium text-white">المدير غير موجود</h3>
        <Button 
          variant="secondary" 
          className="mt-4"
          onClick={() => router.push('/admin/account-managers')}
        >
          العودة للقائمة
        </Button>
      </div>
    )
  }

  const completionRate = stats.total_tasks > 0 
    ? Math.round((stats.completed_tasks / stats.total_tasks) * 100) 
    : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/admin/account-managers')}
          className="text-gray-400 hover:text-white"
        >
          <ArrowRight className="h-4 w-4 ml-2" />
          العودة
        </Button>
      </div>

      {/* Manager Profile Card */}
      <Card className="bg-[#2d2640] border-[#3d3555]">
        <CardContent className="p-6">
          <div className="flex items-start gap-6">
            <div className="w-20 h-20 bg-purple-600/20 rounded-full flex items-center justify-center border-2 border-purple-500/30 flex-shrink-0">
              {manager.avatar_url ? (
                <img 
                  src={manager.avatar_url} 
                  alt={manager.name || ''} 
                  className="w-full h-full object-cover rounded-full"
                />
              ) : (
                <span className="text-3xl font-bold text-purple-400">
                  {manager.name?.charAt(0) || manager.email?.charAt(0)?.toUpperCase() || 'م'}
                </span>
              )}
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-white mb-4">
                {manager.name || 'بدون اسم'}
              </h1>
              <div className="space-y-3 text-gray-400">
                {/* Email - Clickable */}
                <a 
                  href={`mailto:${manager.email}`}
                  className="flex items-center gap-2 hover:text-purple-400 transition-colors group"
                >
                  <Mail className="h-4 w-4" />
                  <span>{manager.email}</span>
                  <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </a>

                {/* Phone - Clickable */}
                {manager.phone ? (
                  <div className="flex items-center gap-3">
                    <a 
                      href={`tel:${manager.phone}`}
                      className="flex items-center gap-2 hover:text-purple-400 transition-colors group"
                    >
                      <Phone className="h-4 w-4" />
                      <span dir="ltr">{manager.phone}</span>
                      <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </a>
                    {/* WhatsApp Button */}
                    <a
                      href={`https://wa.me/${manager.phone.replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 px-2 py-1 bg-green-600/20 hover:bg-green-600/30 text-green-400 rounded-lg text-xs transition-colors"
                    >
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                      </svg>
                      واتساب
                    </a>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    <span>لم يُحدد</span>
                  </div>
                )}

                {/* Booking Link - Clickable */}
                <a 
                  href={`/book/${manager.booking_slug || manager.email?.split('@')[0]}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 hover:text-purple-400 transition-colors group"
                >
                  <Link2 className="h-4 w-4" />
                  <span>/book/{manager.booking_slug || manager.email?.split('@')[0]}</span>
                  <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </a>

                {/* Join Date */}
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>انضم في {new Date(manager.created_at).toLocaleDateString('ar-SA')}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-[#2d2640] border-[#3d3555]">
          <CardContent className="p-4 text-center">
            <Store className="h-8 w-8 mx-auto text-blue-400 mb-2" />
            <p className="text-3xl font-bold text-white">{stats.total_stores}</p>
            <p className="text-sm text-gray-400">إجمالي المتاجر</p>
          </CardContent>
        </Card>

        <Card className="bg-[#2d2640] border-[#3d3555]">
          <CardContent className="p-4 text-center">
            <CheckSquare className="h-8 w-8 mx-auto text-green-400 mb-2" />
            <p className="text-3xl font-bold text-white">{stats.completed_tasks}</p>
            <p className="text-sm text-gray-400">مهام مكتملة</p>
          </CardContent>
        </Card>

        <Card className="bg-[#2d2640] border-[#3d3555]">
          <CardContent className="p-4 text-center">
            <Clock className="h-8 w-8 mx-auto text-yellow-400 mb-2" />
            <p className="text-3xl font-bold text-white">{stats.pending_tasks}</p>
            <p className="text-sm text-gray-400">مهام قيد التنفيذ</p>
          </CardContent>
        </Card>

        <Card className="bg-[#2d2640] border-[#3d3555]">
          <CardContent className="p-4 text-center">
            <Calendar className="h-8 w-8 mx-auto text-purple-400 mb-2" />
            <p className="text-3xl font-bold text-white">{stats.upcoming_meetings}</p>
            <p className="text-sm text-gray-400">اجتماعات قادمة</p>
          </CardContent>
        </Card>
      </div>

      {/* Performance & Reports */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance Card */}
        <Card className="bg-[#2d2640] border-[#3d3555]">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-purple-400" />
              الأداء والإحصائيات
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Completion Rate */}
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-400">نسبة إنجاز المهام</span>
                <span className="text-white font-bold">{completionRate}%</span>
              </div>
              <div className="h-3 bg-[#1a1625] rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-purple-500 to-purple-400 rounded-full transition-all"
                  style={{ width: `${completionRate}%` }}
                />
              </div>
            </div>

            {/* Store Status Breakdown */}
            <div className="grid grid-cols-3 gap-3 pt-4">
              <div className="text-center p-3 bg-[#1a1625] rounded-lg">
                <CheckCircle className="h-5 w-5 mx-auto text-green-400 mb-1" />
                <p className="text-xl font-bold text-white">{stats.active_stores}</p>
                <p className="text-xs text-gray-500">متاجر نشطة</p>
              </div>
              <div className="text-center p-3 bg-[#1a1625] rounded-lg">
                <Clock className="h-5 w-5 mx-auto text-yellow-400 mb-1" />
                <p className="text-xl font-bold text-white">{stats.paused_stores}</p>
                <p className="text-xs text-gray-500">متاجر متوقفة</p>
              </div>
              <div className="text-center p-3 bg-[#1a1625] rounded-lg">
                <XCircle className="h-5 w-5 mx-auto text-red-400 mb-1" />
                <p className="text-xl font-bold text-white">{stats.ended_stores}</p>
                <p className="text-xs text-gray-500">متاجر منتهية</p>
              </div>
            </div>

            {/* Overdue Tasks Alert */}
            {stats.overdue_tasks > 0 && (
              <div className="flex items-center gap-3 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                <AlertCircle className="h-5 w-5 text-red-400" />
                <div>
                  <p className="text-red-400 font-medium">{stats.overdue_tasks} مهام متأخرة</p>
                  <p className="text-xs text-red-400/70">تحتاج إلى متابعة</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Stores */}
        <Card className="bg-[#2d2640] border-[#3d3555]">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Store className="h-5 w-5 text-blue-400" />
              آخر المتاجر
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentStores.length > 0 ? (
              <div className="space-y-3">
                {recentStores.map((store) => (
                  <div 
                    key={store.id}
                    className="flex items-center justify-between p-3 bg-[#1a1625] rounded-lg hover:bg-[#1a1625]/80 cursor-pointer transition-colors"
                    onClick={() => router.push(`/admin/stores/${store.id}`)}
                  >
                    <div>
                      <p className="text-white font-medium">
                        {store.store_name || store.store_url}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(store.created_at).toLocaleDateString('ar-SA')}
                      </p>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs ${getStatusColor(store.status)}`}>
                      {getStatusLabel(store.status)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500 py-4">لا توجد متاجر</p>
            )}
            
            {stats.total_stores > 5 && (
              <Button 
                variant="ghost" 
                className="w-full mt-4 text-purple-400 hover:text-purple-300"
                onClick={() => router.push(`/admin/stores?manager=${managerId}`)}
              >
                عرض جميع المتاجر ({stats.total_stores})
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Meetings */}
      <Card className="bg-[#2d2640] border-[#3d3555]">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Calendar className="h-5 w-5 text-purple-400" />
            الاجتماعات القادمة
          </CardTitle>
        </CardHeader>
        <CardContent>
          {upcomingMeetings.length > 0 ? (
            <div className="space-y-3">
              {upcomingMeetings.map((meeting) => (
                <div 
                  key={meeting.id}
                  className="flex items-center justify-between p-3 bg-[#1a1625] rounded-lg"
                >
                  <div className="flex-1">
                    <p className="text-white font-medium">{meeting.guest_name}</p>
                    <p className="text-xs text-gray-500">
                      {meeting.guest_email}
                      {meeting.store_url && ` • ${meeting.store_url}`}
                    </p>
                  </div>
                  <div className="text-left">
                    <p className="text-purple-400 font-medium text-sm">
                      {new Date(meeting.scheduled_at).toLocaleDateString('ar-SA', { 
                        weekday: 'short', 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </p>
                    <p className="text-xs text-gray-500">
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
            <p className="text-center text-gray-500 py-4">لا توجد اجتماعات قادمة</p>
          )}
        </CardContent>
      </Card>

      {/* Recent Tasks */}
      <Card className="bg-[#2d2640] border-[#3d3555]">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <CheckSquare className="h-5 w-5 text-green-400" />
            آخر المهام
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentTasks.length > 0 ? (
            <div className="space-y-3">
              {recentTasks.map((task) => (
                <div 
                  key={task.id}
                  className="flex items-center justify-between p-3 bg-[#1a1625] rounded-lg"
                >
                  <div>
                    <p className="text-white font-medium">{task.title}</p>
                    <p className="text-xs text-gray-500">
                      {task.store_name || 'متجر غير محدد'}
                      {task.due_date && ` • ${new Date(task.due_date).toLocaleDateString('ar-SA')}`}
                    </p>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs ${getStatusColor(task.status)}`}>
                    {getStatusLabel(task.status)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500 py-4">لا توجد مهام</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
