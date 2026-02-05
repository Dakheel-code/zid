'use client'

import { useEffect, useState } from 'react'
import { 
  Store, 
  Users, 
  CheckSquare, 
  Megaphone,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  Clock,
  Star,
  Calendar,
  MessageSquare,
  Target,
  Activity
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { createBrowserClient } from '@supabase/ssr'
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts'

interface DashboardStats {
  total_stores: number
  active_stores: number
  total_managers: number
  pending_tasks: number
  overdue_tasks: number
  completed_tasks: number
  active_announcements: number
  average_rating: number
  total_ratings: number
  meetings_this_week: number
  new_comments_today: number
  // نسب التغيير
  stores_change: number
  tasks_change: number
  managers_change: number
}

interface StoreGrowthData {
  date: string
  count: number
}

interface TaskStatusData {
  name: string
  value: number
  color: string
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

interface TopManager {
  id: string
  name: string
  value: number
  subtitle: string
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    total_stores: 0,
    active_stores: 0,
    total_managers: 0,
    pending_tasks: 0,
    overdue_tasks: 0,
    completed_tasks: 0,
    active_announcements: 0,
    average_rating: 0,
    total_ratings: 0,
    meetings_this_week: 0,
    new_comments_today: 0,
    stores_change: 0,
    tasks_change: 0,
    managers_change: 0
  })
  const [recentStores, setRecentStores] = useState<RecentStore[]>([])
  const [overdueTasks, setOverdueTasks] = useState<OverdueTask[]>([])
  const [storeGrowthData, setStoreGrowthData] = useState<StoreGrowthData[]>([])
  const [taskStatusData, setTaskStatusData] = useState<TaskStatusData[]>([])
  const [topRatedManagers, setTopRatedManagers] = useState<TopManager[]>([])
  const [topCompletionManagers, setTopCompletionManagers] = useState<TopManager[]>([])
  const [topStoreManagers, setTopStoreManagers] = useState<TopManager[]>([])
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

        // جلب إحصائيات المهام من store_tasks
        const { count: pendingTasks } = await supabase
          .from('store_tasks')
          .select('*', { count: 'exact', head: true })
          .in('status', ['new', 'in_progress'])

        const { count: overdueTasksCount } = await supabase
          .from('store_tasks')
          .select('*', { count: 'exact', head: true })
          .lt('due_date', new Date().toISOString())
          .in('status', ['new', 'in_progress'])

        // جلب عدد التعاميم النشطة
        const { count: activeAnnouncements } = await supabase
          .from('announcements')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'sent')

        // جلب عدد المهام المكتملة
        const { count: completedTasks } = await supabase
          .from('store_tasks')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'done')

        // جلب متوسط التقييمات
        const { data: ratingsData } = await supabase
          .from('manager_ratings')
          .select('rating')
        
        const avgRating = ratingsData && ratingsData.length > 0
          ? ratingsData.reduce((sum, r) => sum + r.rating, 0) / ratingsData.length
          : 0

        // جلب اجتماعات هذا الأسبوع
        const startOfWeek = new Date()
        startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay())
        startOfWeek.setHours(0, 0, 0, 0)
        const endOfWeek = new Date(startOfWeek)
        endOfWeek.setDate(endOfWeek.getDate() + 7)

        const { count: meetingsThisWeek } = await supabase
          .from('meetings')
          .select('*', { count: 'exact', head: true })
          .gte('meeting_date', startOfWeek.toISOString())
          .lt('meeting_date', endOfWeek.toISOString())

        // جلب التعليقات الجديدة اليوم
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const { count: newCommentsToday } = await supabase
          .from('store_comments')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', today.toISOString())

        // حساب نسب التغيير (مقارنة بالشهر الماضي)
        const lastMonth = new Date()
        lastMonth.setMonth(lastMonth.getMonth() - 1)
        
        const { count: storesLastMonth } = await supabase
          .from('stores')
          .select('*', { count: 'exact', head: true })
          .lt('created_at', lastMonth.toISOString())
        
        const storesChange = storesLastMonth && storesLastMonth > 0 
          ? Math.round(((totalStores || 0) - storesLastMonth) / storesLastMonth * 100)
          : 0

        const { count: tasksLastMonth } = await supabase
          .from('store_tasks')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'done')
          .lt('created_at', lastMonth.toISOString())
        
        const tasksChange = tasksLastMonth && tasksLastMonth > 0
          ? Math.round(((completedTasks || 0) - tasksLastMonth) / tasksLastMonth * 100)
          : 0

        setStats({
          total_stores: totalStores || 0,
          active_stores: activeStores || 0,
          total_managers: totalManagers || 0,
          pending_tasks: pendingTasks || 0,
          overdue_tasks: overdueTasksCount || 0,
          completed_tasks: completedTasks || 0,
          active_announcements: activeAnnouncements || 0,
          average_rating: Math.round(avgRating * 10) / 10,
          total_ratings: ratingsData?.length || 0,
          meetings_this_week: meetingsThisWeek || 0,
          new_comments_today: newCommentsToday || 0,
          stores_change: storesChange,
          tasks_change: tasksChange,
          managers_change: 0
        })

        // جلب بيانات نمو المتاجر خلال الشهر
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
        
        const { data: storesGrowth } = await supabase
          .from('stores')
          .select('created_at')
          .gte('created_at', thirtyDaysAgo.toISOString())
          .order('created_at', { ascending: true })

        // تجميع البيانات حسب اليوم
        const growthByDay: { [key: string]: number } = {}
        const arabicDays = ['أحد', 'إثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت']
        
        for (let i = 6; i >= 0; i--) {
          const date = new Date()
          date.setDate(date.getDate() - i)
          const dayName = arabicDays[date.getDay()]
          growthByDay[dayName] = 0
        }

        storesGrowth?.forEach(store => {
          const date = new Date(store.created_at)
          const dayName = arabicDays[date.getDay()]
          if (growthByDay[dayName] !== undefined) {
            growthByDay[dayName]++
          }
        })

        setStoreGrowthData(
          Object.entries(growthByDay).map(([date, count]) => ({ date, count }))
        )

        // بيانات توزيع حالات المهام
        setTaskStatusData([
          { name: 'مكتملة', value: completedTasks || 0, color: '#22c55e' },
          { name: 'قيد التنفيذ', value: pendingTasks || 0, color: '#f59e0b' },
          { name: 'متأخرة', value: overdueTasksCount || 0, color: '#ef4444' }
        ])

        // جلب آخر المتاجر المضافة
        const { data: stores } = await supabase
          .from('stores')
          .select('id, store_name, status, created_at')
          .order('created_at', { ascending: false })
          .limit(5)

        setRecentStores(stores || [])

        // جلب المهام المتأخرة
        const { data: tasks } = await supabase
          .from('store_tasks')
          .select('id, title, due_date')
          .lt('due_date', new Date().toISOString())
          .in('status', ['new', 'in_progress'])
          .order('due_date', { ascending: true })
          .limit(5)

        setOverdueTasks(tasks || [])

        // جلب أفضل 5 مدراء حسب معدل التقييم
        const { data: managers } = await supabase
          .from('profiles')
          .select('id, name')
          .eq('role', 'manager')

        if (managers && managers.length > 0) {
          // جلب التقييمات لكل مدير
          const managersWithRatings = await Promise.all(
            managers.map(async (manager) => {
              const { data: ratings } = await supabase
                .from('manager_ratings')
                .select('rating')
                .eq('manager_id', manager.id)
              
              const avgRating = ratings && ratings.length > 0
                ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
                : 0
              
              return {
                id: manager.id,
                name: manager.name || 'غير محدد',
                value: Math.round(avgRating * 10) / 10,
                subtitle: `${ratings?.length || 0} تقييم`
              }
            })
          )
          
          setTopRatedManagers(
            managersWithRatings
              .filter(m => m.value > 0)
              .sort((a, b) => b.value - a.value)
              .slice(0, 5)
          )

          // جلب أفضل 5 مدراء حسب نسبة إنجاز المهام (المهام المرتبطة بمتاجرهم)
          const managersWithCompletion = await Promise.all(
            managers.map(async (manager) => {
              // جلب المتاجر المسندة للمدير
              const { data: managerStores } = await supabase
                .from('stores')
                .select('id')
                .eq('assigned_manager_id', manager.id)
              
              const storeIds = managerStores?.map(s => s.id) || []
              
              let completedCount = 0
              let totalCount = 0
              
              if (storeIds.length > 0) {
                const { count: completed } = await supabase
                  .from('store_tasks')
                  .select('*', { count: 'exact', head: true })
                  .in('store_id', storeIds)
                  .eq('status', 'done')
                
                const { count: total } = await supabase
                  .from('store_tasks')
                  .select('*', { count: 'exact', head: true })
                  .in('store_id', storeIds)
                
                completedCount = completed || 0
                totalCount = total || 0
              }
              
              const completionRate = totalCount > 0
                ? Math.round((completedCount / totalCount) * 100)
                : 0
              
              return {
                id: manager.id,
                name: manager.name || 'غير محدد',
                value: completionRate,
                subtitle: `${completedCount} من ${totalCount} مهمة`
              }
            })
          )
          
          setTopCompletionManagers(
            managersWithCompletion
              .filter(m => m.subtitle !== '0 من 0 مهمة')
              .sort((a, b) => b.value - a.value)
              .slice(0, 5)
          )

          // جلب أكثر المدراء إسناداً للمتاجر
          const managersWithStores = await Promise.all(
            managers.map(async (manager) => {
              const { count: storeCount } = await supabase
                .from('stores')
                .select('*', { count: 'exact', head: true })
                .eq('assigned_manager_id', manager.id)
              
              return {
                id: manager.id,
                name: manager.name || 'غير محدد',
                value: storeCount || 0,
                subtitle: 'متجر'
              }
            })
          )
          
          setTopStoreManagers(
            managersWithStores
              .filter(m => m.value > 0)
              .sort((a, b) => b.value - a.value)
              .slice(0, 5)
          )
        }

      } catch (err) {
        console.error('Error fetching dashboard data:', err)
      }
      setLoading(false)
    }

    fetchDashboardData()
  }, [])

  // حساب نسبة إنجاز المهام
  const totalTasks = stats.pending_tasks + stats.completed_tasks + stats.overdue_tasks
  const completionRate = totalTasks > 0 ? Math.round((stats.completed_tasks / totalTasks) * 100) : 0

  const statCards = [
    {
      title: 'إجمالي المتاجر',
      value: stats.total_stores,
      icon: Store,
      gradient: 'from-blue-500 to-blue-600',
      change: stats.stores_change,
      changeLabel: 'من الشهر الماضي'
    },
    {
      title: 'المتاجر النشطة',
      value: stats.active_stores,
      icon: TrendingUp,
      gradient: 'from-green-500 to-emerald-600',
      change: null,
      changeLabel: null
    },
    {
      title: 'مدراء العلاقات',
      value: stats.total_managers,
      icon: Users,
      gradient: 'from-purple-500 to-violet-600',
      change: stats.managers_change,
      changeLabel: 'من الشهر الماضي'
    },
    {
      title: 'المهام المعلقة',
      value: stats.pending_tasks,
      icon: CheckSquare,
      gradient: 'from-amber-500 to-orange-600',
      change: null,
      changeLabel: null
    },
    {
      title: 'المهام المتأخرة',
      value: stats.overdue_tasks,
      icon: AlertCircle,
      gradient: 'from-red-500 to-rose-600',
      change: null,
      changeLabel: null
    },
    {
      title: 'التعاميم النشطة',
      value: stats.active_announcements,
      icon: Megaphone,
      gradient: 'from-indigo-500 to-purple-600',
      change: null,
      changeLabel: null
    }
  ]

  const additionalStats = [
    {
      title: 'متوسط تقييم المدراء',
      value: stats.average_rating > 0 ? `${stats.average_rating} ⭐` : 'لا يوجد',
      subtitle: `${stats.total_ratings} تقييم`,
      icon: Star,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100'
    },
    {
      title: 'نسبة إنجاز المهام',
      value: `${completionRate}%`,
      subtitle: `${stats.completed_tasks} من ${totalTasks} مهمة`,
      icon: Target,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-100'
    },
    {
      title: 'اجتماعات الأسبوع',
      value: stats.meetings_this_week,
      subtitle: 'اجتماع مجدول',
      icon: Calendar,
      color: 'text-cyan-600',
      bgColor: 'bg-cyan-100'
    },
    {
      title: 'تعليقات اليوم',
      value: stats.new_comments_today,
      subtitle: 'تعليق جديد',
      icon: MessageSquare,
      color: 'text-pink-600',
      bgColor: 'bg-pink-100'
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

      {/* Stats Grid with Gradient Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map((stat, index) => (
          <Card key={index} className="overflow-hidden border-0 shadow-lg">
            <CardContent className="p-0">
              <div className={`bg-gradient-to-br ${stat.gradient} p-6 text-white`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-white/80">{stat.title}</p>
                    <p className="text-3xl font-bold mt-1">{stat.value}</p>
                    {stat.change !== null && stat.change !== 0 && (
                      <div className="flex items-center gap-1 mt-2">
                        {stat.change > 0 ? (
                          <TrendingUp className="h-4 w-4 text-white/90" />
                        ) : (
                          <TrendingDown className="h-4 w-4 text-white/90" />
                        )}
                        <span className="text-xs text-white/90">
                          {stat.change > 0 ? '+' : ''}{stat.change}% {stat.changeLabel}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="p-3 rounded-full bg-white/20 backdrop-blur-sm">
                    <stat.icon className="h-6 w-6 text-white animate-pulse" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {additionalStats.map((stat, index) => (
          <Card key={index} className="bg-gradient-to-br from-card to-muted/30">
            <CardContent className="p-5">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{stat.title}</p>
                  <p className="text-xl font-bold">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.subtitle}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Line Chart - Store Growth */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-blue-500" />
              نمو المتاجر خلال الأسبوع
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={storeGrowthData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                  <XAxis 
                    dataKey="date" 
                    stroke="#9ca3af" 
                    fontSize={12}
                    tickLine={false}
                  />
                  <YAxis 
                    stroke="#9ca3af" 
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1f2937', 
                      border: 'none', 
                      borderRadius: '8px',
                      color: '#fff'
                    }}
                    labelStyle={{ color: '#9ca3af' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="count" 
                    stroke="#3b82f6" 
                    strokeWidth={3}
                    dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, fill: '#60a5fa' }}
                    name="متاجر جديدة"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Pie Chart - Task Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-emerald-500" />
              توزيع حالات المهام
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72 flex items-center justify-center">
              {taskStatusData.reduce((sum, item) => sum + item.value, 0) > 0 ? (
                <div className="flex items-center gap-8 w-full">
                  {/* Chart */}
                  <div className="flex-1 h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={taskStatusData}
                          cx="50%"
                          cy="50%"
                          innerRadius={55}
                          outerRadius={85}
                          paddingAngle={3}
                          dataKey="value"
                          strokeWidth={2}
                          stroke="#1f2937"
                        >
                          {taskStatusData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: '#1f2937', 
                            border: '1px solid #374151', 
                            borderRadius: '12px',
                            color: '#fff',
                            padding: '10px 14px'
                          }}
                          formatter={(value) => [`${value} مهمة`]}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  {/* Legend */}
                  <div className="space-y-3 min-w-[140px]">
                    {taskStatusData.map((item, index) => (
                      <div key={index} className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: item.color }}
                          />
                          <span className="text-sm text-muted-foreground">{item.name}</span>
                        </div>
                        <span className="font-bold text-foreground">{item.value}</span>
                      </div>
                    ))}
                    <div className="pt-2 border-t border-border">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">الإجمالي</span>
                        <span className="font-bold text-foreground">
                          {taskStatusData.reduce((sum, item) => sum + item.value, 0)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  <Target className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p>لا توجد مهام بعد</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Managers Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* أفضل المدراء حسب التقييم */}
        <Card className="bg-gradient-to-br from-yellow-500/10 to-amber-500/5 border-yellow-500/20">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Star className="h-5 w-5 text-yellow-500" />
              أفضل المدراء تقييماً
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topRatedManagers.length > 0 ? (
                topRatedManagers.map((manager, index) => (
                  <div key={manager.id} className="flex items-center justify-between py-2 border-b border-yellow-500/10 last:border-0">
                    <div className="flex items-center gap-3">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold ${
                        index === 0 ? 'bg-yellow-500 text-white' : 
                        index === 1 ? 'bg-gray-300 text-gray-700' :
                        index === 2 ? 'bg-amber-600 text-white' :
                        'bg-muted text-muted-foreground'
                      }`}>
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{manager.name}</p>
                        <p className="text-xs text-muted-foreground">{manager.subtitle}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="font-bold text-yellow-500">{manager.value}</span>
                      <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-muted-foreground py-4 text-sm">لا توجد تقييمات بعد</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* أفضل المدراء حسب نسبة الإنجاز */}
        <Card className="bg-gradient-to-br from-emerald-500/10 to-green-500/5 border-emerald-500/20">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Target className="h-5 w-5 text-emerald-500" />
              أعلى نسبة إنجاز
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topCompletionManagers.length > 0 ? (
                topCompletionManagers.map((manager, index) => (
                  <div key={manager.id} className="flex items-center justify-between py-2 border-b border-emerald-500/10 last:border-0">
                    <div className="flex items-center gap-3">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold ${
                        index === 0 ? 'bg-emerald-500 text-white' : 
                        index === 1 ? 'bg-gray-300 text-gray-700' :
                        index === 2 ? 'bg-green-600 text-white' :
                        'bg-muted text-muted-foreground'
                      }`}>
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{manager.name}</p>
                        <p className="text-xs text-muted-foreground">{manager.subtitle}</p>
                      </div>
                    </div>
                    <span className="font-bold text-emerald-500">{manager.value}%</span>
                  </div>
                ))
              ) : (
                <p className="text-center text-muted-foreground py-4 text-sm">لا توجد مهام مكتملة بعد</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* أكثر المدراء إسناداً للمتاجر */}
        <Card className="bg-gradient-to-br from-blue-500/10 to-indigo-500/5 border-blue-500/20">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Store className="h-5 w-5 text-blue-500" />
              أكثر إسناداً للمتاجر
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topStoreManagers.length > 0 ? (
                topStoreManagers.map((manager, index) => (
                  <div key={manager.id} className="flex items-center justify-between py-2 border-b border-blue-500/10 last:border-0">
                    <div className="flex items-center gap-3">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold ${
                        index === 0 ? 'bg-blue-500 text-white' : 
                        index === 1 ? 'bg-gray-300 text-gray-700' :
                        index === 2 ? 'bg-indigo-600 text-white' :
                        'bg-muted text-muted-foreground'
                      }`}>
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{manager.name}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="font-bold text-blue-500">{manager.value}</span>
                      <span className="text-xs text-muted-foreground">{manager.subtitle}</span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-muted-foreground py-4 text-sm">لا توجد متاجر مسندة بعد</p>
              )}
            </div>
          </CardContent>
        </Card>
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
