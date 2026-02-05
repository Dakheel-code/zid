'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, Clock, AlertCircle, Plus } from 'lucide-react'

interface Task {
  id: string
  title: string
  description: string
  status: 'pending' | 'in_progress' | 'completed'
  priority: 'low' | 'medium' | 'high'
  dueDate: string
  storeName: string
}

// سيتم جلب المهام من قاعدة البيانات
const mockTasks: Task[] = []

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
  const [tasks] = useState<Task[]>(mockTasks)

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">مهامي</h1>
        <Button>
          <Plus className="h-4 w-4 ml-2" />
          إضافة مهمة
        </Button>
      </div>

      <div className="grid gap-4">
        {tasks.map((task) => {
          const status = statusConfig[task.status]
          const priority = priorityConfig[task.priority]
          const StatusIcon = status.icon

          return (
            <Card key={task.id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{task.title}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">{task.description}</p>
                  </div>
                  <div className="flex gap-2">
                    <Badge className={priority.color}>{priority.label}</Badge>
                    <Badge className={status.color}>
                      <StatusIcon className="h-3 w-3 ml-1" />
                      {status.label}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>المتجر: {task.storeName}</span>
                  <span>تاريخ الاستحقاق: {task.dueDate}</span>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
