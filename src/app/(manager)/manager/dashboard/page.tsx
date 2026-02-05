'use client'

import { useEffect, useState } from 'react'
import { 
  Store, 
  CheckSquare, 
  Calendar,
  Clock,
  AlertCircle,
  TrendingUp
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { createBrowserClient } from '@supabase/ssr'

interface ManagerStats {
  assigned_stores: number
  active_stores: number
  pending_tasks: number
  overdue_tasks: number
  upcoming_meetings: number
  completed_today: number
}

interface Task {
  id: string
  title: string
  due_date: string
  status: string
}

interface Meeting {
  id: string
  guest_name: string
  start_at: string
}

export default function ManagerDashboardPage() {
  const [stats, setStats] = useState<ManagerStats>({
    assigned_stores: 0,
    active_stores: 0,
    pending_tasks: 0,
    overdue_tasks: 0,
    upcoming_meetings: 0,
    completed_today: 0
  })
  const [overdueTasks, setOverdueTasks] = useState<Task[]>([])
  const [upcomingMeetings, setUpcomingMeetings] = useState<Meeting[]>([])
  const [loading, setLoading] = useState(true)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const today = new Date().toISOString().split('T')[0]

        // جلب عدد المتاجر المسندة
        const { count: assignedStores } = await supabase
          .from('stores')
          .select('*', { count: 'exact', head: true })
          .eq('assigned_manager_id', user.id)

        // جلب عدد المتاجر النشطة
        const { count: activeStores } = await supabase
          .from('stores')
          .select('*', { count: 'exact', head: true })
          .eq('assigned_manager_id', user.id)
          .eq('status', 'active')

        // جلب عدد المهام المعلقة
        const { count: pendingTasks } = await supabase
          .from('tasks')
          .select('*', { count: 'exact', head: true })
          .eq('assigned_user_id', user.id)
          .in('status', ['pending', 'in_progress'])

        // جلب المهام المتأخرة
        const { data: overdueTasksData, count: overdueCount } = await supabase
          .from('tasks')
          .select('id, title, due_date, status', { count: 'exact' })
          .eq('assigned_user_id', user.id)
          .lt('due_date', today)
          .neq('status', 'completed')
          .order('due_date', { ascending: true })
          .limit(5)

        // جلب الاجتماعات القادمة
        const { data: meetingsData, count: meetingsCount } = await supabase
          .from('meetings')
          .select('id, guest_name, start_at', { count: 'exact' })
          .eq('manager_id', user.id)
          .gte('start_at', new Date().toISOString())
          .order('start_at', { ascending: true })
          .limit(5)

        // جلب المهام المكتملة اليوم
        const { count: completedToday } = await supabase
          .from('tasks')
          .select('*', { count: 'exact', head: true })
          .eq('assigned_user_id', user.id)
          .eq('status', 'completed')
          .gte('updated_at', today)

        setStats({
          assigned_stores: assignedStores || 0,
          active_stores: activeStores || 0,
          pending_tasks: pendingTasks || 0,
          overdue_tasks: overdueCount || 0,
          upcoming_meetings: meetingsCount || 0,
          completed_today: completedToday || 0
        })

        setOverdueTasks(overdueTasksData || [])
        setUpcomingMeetings(meetingsData || [])

      } catch (error) {
        console.error('Error fetching stats:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  const statCards = [
    {
      title: 'المتاجر المسندة',
      value: stats.assigned_stores,
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
      title: 'الاجتماعات القادمة',
      value: stats.upcoming_meetings,
      icon: Calendar,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    },
    {
      title: 'مكتملة اليوم',
      value: stats.completed_today,
      icon: Clock,
      color: 'text-teal-600',
      bgColor: 'bg-teal-100'
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
    <div className="space-y-4 lg:space-y-6">
      <div>
        <h1 className="text-xl lg:text-2xl font-bold text-foreground">لوحة التحكم</h1>
        <p className="text-sm lg:text-base text-muted-foreground">مرحباً بك، هذه نظرة عامة على متاجرك</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4">
        {statCards.map((stat, index) => (
          <Card key={index}>
            <CardContent className="p-4 lg:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs lg:text-sm text-muted-foreground">{stat.title}</p>
                  <p className="text-2xl lg:text-3xl font-bold mt-1">{stat.value}</p>
                </div>
                <div className={`p-2 lg:p-3 rounded-full ${stat.bgColor}`}>
                  <stat.icon className={`h-5 w-5 lg:h-6 lg:w-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              المهام المتأخرة
            </CardTitle>
          </CardHeader>
          <CardContent>
            {overdueTasks.length > 0 ? (
              <div className="space-y-3">
                {overdueTasks.map((task) => {
                  const daysOverdue = Math.floor((new Date().getTime() - new Date(task.due_date).getTime()) / (1000 * 60 * 60 * 24))
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
                })}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                لا توجد مهام متأخرة 🎉
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-purple-500" />
              الاجتماعات القادمة
            </CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingMeetings.length > 0 ? (
              <div className="space-y-3">
                {upcomingMeetings.map((meeting) => {
                  const meetingDate = new Date(meeting.start_at)
                  const isToday = meetingDate.toDateString() === new Date().toDateString()
                  const timeStr = meetingDate.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })
                  const dateStr = isToday ? 'اليوم' : meetingDate.toLocaleDateString('ar-SA', { weekday: 'long' })
                  return (
                    <div key={meeting.id} className="flex items-center justify-between py-2 border-b last:border-0">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                          <Calendar className="h-4 w-4 text-purple-600" />
                        </div>
                        <div>
                          <p className="font-medium">{meeting.guest_name || 'اجتماع'}</p>
                          <p className="text-xs text-muted-foreground">{dateStr} - {timeStr}</p>
                        </div>
                      </div>
                      <span className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded-full">
                        قادم
                      </span>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                لا توجد اجتماعات قادمة
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
