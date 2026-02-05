'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { 
  Store, 
  CheckSquare, 
  ExternalLink,
  User,
  Phone,
  Mail,
  ArrowRight,
  RefreshCw,
  Link2,
  Copy
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import type { Store as StoreType, StoreTask } from '@/lib/supabase/types-simple'

export default function ManagerStoreDetailPage() {
  const params = useParams()
  const storeId = params.id as string
  
  const [store, setStore] = useState<StoreType | null>(null)
  const [tasks, setTasks] = useState<StoreTask[]>([])
  const [publicToken, setPublicToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // TODO: Fetch store and tasks from API
    const mockStore: StoreType = {
      id: storeId,
      store_url: 'https://example.zid.store',
      store_name: 'متجر الإلكترونيات',
      store_logo_url: null,
      owner_name: 'أحمد محمد',
      owner_email: 'ahmed@example.com',
      owner_phone: '+966501234567',
      priority: 'high',
      status: 'active',
      ended_at: null,
      public_access_expires_at: null,
      assigned_manager_id: '1',
      created_by_admin_id: '1',
      notes: null,
      metadata: {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    const mockTasks: StoreTask[] = [
      {
        id: '1',
        store_id: storeId,
        template_task_id: '1',
        template_section_id: '1',
        type: 'template',
        title: 'مراجعة إعدادات المتجر',
        description: 'التأكد من إعدادات المتجر الأساسية',
        section_title: 'إعداد المتجر',
        status: 'done',
        due_date: null,
        completed_at: new Date().toISOString(),
        created_by_id: '1',
        created_by_role: 'system',
        visible_to_merchant: true,
        notes: null,
        sort_order: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: '2',
        store_id: storeId,
        template_task_id: '2',
        template_section_id: '1',
        type: 'template',
        title: 'إضافة طرق الدفع',
        description: null,
        section_title: 'إعداد المتجر',
        status: 'in_progress',
        due_date: null,
        completed_at: null,
        created_by_id: null,
        created_by_role: 'system',
        visible_to_merchant: true,
        notes: null,
        sort_order: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: '3',
        store_id: storeId,
        template_task_id: null,
        template_section_id: null,
        type: 'manual',
        title: 'طلب من التاجر: تحسين الصور',
        description: 'التاجر يريد تحسين صور المنتجات',
        section_title: undefined,
        status: 'new',
        due_date: null,
        completed_at: null,
        created_by_id: null,
        created_by_role: 'merchant',
        visible_to_merchant: true,
        notes: null,
        sort_order: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ]
    
    setStore(mockStore)
    setTasks(mockTasks)
    setPublicToken('abc123xyz789')
    setLoading(false)
  }, [storeId])

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      new: 'bg-blue-100 text-blue-700',
      in_progress: 'bg-amber-100 text-amber-700',
      done: 'bg-green-100 text-green-700',
      blocked: 'bg-red-100 text-red-700'
    }
    const labels: Record<string, string> = {
      new: 'جديد',
      in_progress: 'قيد التنفيذ',
      done: 'مكتمل',
      blocked: 'معلق'
    }
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status]}`}>
        {labels[status]}
      </span>
    )
  }

  const copyPublicLink = () => {
    if (publicToken) {
      navigator.clipboard.writeText(`${window.location.origin}/public/store/${publicToken}`)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!store) {
    return (
      <div className="text-center py-12">
        <Store className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium">المتجر غير موجود</h3>
      </div>
    )
  }

  const templateTasks = tasks.filter(t => t.type === 'template')
  const manualTasks = tasks.filter(t => t.type === 'manual')
  const completedCount = tasks.filter(t => t.status === 'done').length

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Link href="/manager/stores" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
        <ArrowRight className="h-4 w-4" />
        العودة للمتاجر
      </Link>

      {/* Store Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center">
                {store.store_logo_url ? (
                  <img 
                    src={store.store_logo_url} 
                    alt={store.store_name || ''} 
                    className="w-full h-full object-cover rounded-lg"
                  />
                ) : (
                  <Store className="h-8 w-8 text-muted-foreground" />
                )}
              </div>
              <div>
                <h1 className="text-2xl font-bold">{store.store_name || 'بدون اسم'}</h1>
                <a 
                  href={store.store_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1"
                >
                  {store.store_url}
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {(store.metadata as { needs_review?: boolean })?.needs_review && (
                <Button variant="secondary" size="sm">
                  <RefreshCw className="h-4 w-4 ml-2" />
                  إعادة الكشف
                </Button>
              )}
            </div>
          </div>

          {/* Owner Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 pt-6 border-t">
            {store.owner_name && (
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span>{store.owner_name}</span>
              </div>
            )}
            {store.owner_email && (
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{store.owner_email}</span>
              </div>
            )}
            {store.owner_phone && (
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span dir="ltr">{store.owner_phone}</span>
              </div>
            )}
          </div>

          {/* Public Link */}
          {publicToken && (
            <div className="mt-4 p-3 bg-muted rounded-lg flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Link2 className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">رابط صفحة التاجر:</span>
                <code className="text-xs bg-background px-2 py-1 rounded">
                  /public/store/{publicToken}
                </code>
              </div>
              <Button variant="ghost" size="sm" onClick={copyPublicLink}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold">{tasks.length}</p>
            <p className="text-sm text-muted-foreground">إجمالي المهام</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-green-600">{completedCount}</p>
            <p className="text-sm text-muted-foreground">مكتملة</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-amber-600">{tasks.length - completedCount}</p>
            <p className="text-sm text-muted-foreground">متبقية</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-blue-600">
              {Math.round((completedCount / tasks.length) * 100) || 0}%
            </p>
            <p className="text-sm text-muted-foreground">نسبة الإنجاز</p>
          </CardContent>
        </Card>
      </div>

      {/* Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Template Tasks */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckSquare className="h-5 w-5" />
              مهام القالب ({templateTasks.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {templateTasks.map((task) => (
                <div 
                  key={task.id}
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                >
                  <div>
                    <p className="font-medium">{task.title}</p>
                    {task.section_title && (
                      <p className="text-xs text-muted-foreground">{task.section_title}</p>
                    )}
                  </div>
                  {getStatusBadge(task.status)}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Manual Tasks */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckSquare className="h-5 w-5" />
              مهام يدوية ({manualTasks.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {manualTasks.length > 0 ? (
              <div className="space-y-3">
                {manualTasks.map((task) => (
                  <div 
                    key={task.id}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{task.title}</p>
                      {task.created_by_role === 'merchant' && (
                        <p className="text-xs text-orange-600">من التاجر</p>
                      )}
                    </div>
                    {getStatusBadge(task.status)}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                لا توجد مهام يدوية
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
