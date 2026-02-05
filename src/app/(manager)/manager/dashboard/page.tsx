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

interface ManagerStats {
  assigned_stores: number
  active_stores: number
  pending_tasks: number
  overdue_tasks: number
  upcoming_meetings: number
  completed_today: number
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
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // TODO: Fetch actual stats from API
    setStats({
      assigned_stores: 12,
      active_stores: 10,
      pending_tasks: 45,
      overdue_tasks: 3,
      upcoming_meetings: 2,
      completed_today: 8
    })
    setLoading(false)
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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">لوحة التحكم</h1>
        <p className="text-muted-foreground">مرحباً بك، هذه نظرة عامة على متاجرك</p>
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
            {stats.overdue_tasks > 0 ? (
              <div className="space-y-3">
                {[1, 2, 3].slice(0, stats.overdue_tasks).map((i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                        <CheckSquare className="h-4 w-4 text-red-600" />
                      </div>
                      <div>
                        <p className="font-medium">مهمة {i}</p>
                        <p className="text-xs text-muted-foreground">متأخرة منذ {i} يوم</p>
                      </div>
                    </div>
                    <span className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded-full">
                      متأخرة
                    </span>
                  </div>
                ))}
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
            {stats.upcoming_meetings > 0 ? (
              <div className="space-y-3">
                {[1, 2].slice(0, stats.upcoming_meetings).map((i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                        <Calendar className="h-4 w-4 text-purple-600" />
                      </div>
                      <div>
                        <p className="font-medium">اجتماع مع عميل {i}</p>
                        <p className="text-xs text-muted-foreground">اليوم - 0{i}:00 م</p>
                      </div>
                    </div>
                    <span className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded-full">
                      قادم
                    </span>
                  </div>
                ))}
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
