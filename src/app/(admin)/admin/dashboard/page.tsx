'use client'

import { useEffect, useState } from 'react'
import { 
  Store, 
  Users, 
  CheckSquare, 
  Megaphone,
  TrendingUp,
  AlertCircle,
  Clock
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { createBrowserClient } from '@supabase/ssr'

interface DashboardStats {
  total_stores: number
  active_stores: number
  total_managers: number
  pending_tasks: number
  overdue_tasks: number
  active_announcements: number
}

interface RecentStore {
  id: string
  store_name: string
  status: string
  created_at: string
}

interface OverdueTask {
  id: string
  title: string
  due_date: string
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    total_stores: 0,
    active_stores: 0,
    total_managers: 0,
    pending_tasks: 0,
    overdue_tasks: 0,
    active_announcements: 0
  })
  const [recentStores, setRecentStores] = useState<RecentStore[]>([])
  const [overdueTasks, setOverdueTasks] = useState<OverdueTask[]>([])
  const [loading, setLoading] = useState(true)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // جلب إحصائيات المتاجر
        const { count: totalStores } = await supabase
          .from('stores')
          .select('*', { count: 'exact', head: true })

        const { count: activeStores } = await supabase
          .from('stores')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'active')

        // جلب عدد مدراء العلاقات فقط (بدون الأدمن)
        const { count: totalManagers } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('role', 'manager')

        // جلب إحصائيات المهام
        const { count: pendingTasks } = await supabase
          .from('tasks')
          .select('*', { count: 'exact', head: true })
          .in('status', ['pending', 'in_progress'])

        const { count: overdueTasksCount } = await supabase
          .from('tasks')
          .select('*', { count: 'exact', head: true })
          .lt('due_date', new Date().toISOString())
          .in('status', ['pending', 'in_progress'])

        // جلب عدد التعاميم النشطة
        const { count: activeAnnouncements } = await supabase
          .from('announcements')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'sent')

        setStats({
          total_stores: totalStores || 0,
          active_stores: activeStores || 0,
          total_managers: totalManagers || 0,
          pending_tasks: pendingTasks || 0,
          overdue_tasks: overdueTasksCount || 0,
          active_announcements: activeAnnouncements || 0
        })

        // جلب آخر المتاجر المضافة
        const { data: stores } = await supabase
          .from('stores')
          .select('id, store_name, status, created_at')
          .order('created_at', { ascending: false })
          .limit(5)

        setRecentStores(stores || [])

        // جلب المهام المتأخرة
        const { data: tasks } = await supabase
          .from('tasks')
          .select('id, title, due_date')
          .lt('due_date', new Date().toISOString())
          .in('status', ['pending', 'in_progress'])
          .order('due_date', { ascending: true })
          .limit(5)

        setOverdueTasks(tasks || [])

      } catch (err) {
        console.error('Error fetching dashboard data:', err)
      }
      setLoading(false)
    }

    fetchDashboardData()
  }, [])

  const statCards = [
    {
      title: 'إجمالي المتاجر',
      value: stats.total_stores,
      icon: Store,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      title: 'المتاجر النشطة',
      value: stats.active_stores,
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      title: 'مدراء العلاقات',
      value: stats.total_managers,
      icon: Users,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    },
    {
      title: 'المهام المعلقة',
      value: stats.pending_tasks,
      icon: CheckSquare,
      color: 'text-amber-600',
      bgColor: 'bg-amber-100'
    },
    {
      title: 'المهام المتأخرة',
      value: stats.overdue_tasks,
      icon: AlertCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-100'
    },
    {
      title: 'التعاميم النشطة',
      value: stats.active_announcements,
      icon: Megaphone,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-100'
    }
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">لوحة التحكم</h1>
        <p className="text-muted-foreground">نظرة عامة على النظام</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map((stat, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                  <p className="text-3xl font-bold mt-1">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-full ${stat.bgColor}`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              آخر المتاجر المضافة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentStores.length > 0 ? (
                recentStores.map((store) => {
                  const timeAgo = Math.floor((Date.now() - new Date(store.created_at).getTime()) / (1000 * 60 * 60))
                  return (
                    <div key={store.id} className="flex items-center justify-between py-2 border-b last:border-0">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                          <Store className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-medium">{store.store_name}</p>
                          <p className="text-xs text-muted-foreground">
                            منذ {timeAgo < 24 ? `${timeAgo} ساعة` : `${Math.floor(timeAgo / 24)} يوم`}
                          </p>
                        </div>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        store.status === 'active' 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {store.status === 'active' ? 'نشط' : store.status}
                      </span>
                    </div>
                  )
                })
              ) : (
                <p className="text-center text-muted-foreground py-4">لا توجد متاجر</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              المهام المتأخرة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {overdueTasks.length > 0 ? (
                overdueTasks.map((task) => {
                  const daysOverdue = Math.floor((Date.now() - new Date(task.due_date).getTime()) / (1000 * 60 * 60 * 24))
                  return (
                    <div key={task.id} className="flex items-center justify-between py-2 border-b last:border-0">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                          <CheckSquare className="h-4 w-4 text-red-600" />
                        </div>
                        <div>
                          <p className="font-medium">{task.title}</p>
                          <p className="text-xs text-muted-foreground">متأخرة منذ {daysOverdue} يوم</p>
                        </div>
                      </div>
                      <span className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded-full">
                        متأخرة
                      </span>
                    </div>
                  )
                })
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  لا توجد مهام متأخرة 🎉
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
