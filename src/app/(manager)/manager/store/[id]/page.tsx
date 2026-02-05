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
  Copy,
  Plus,
  Loader2
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import type { Store as StoreType, StoreTask } from '@/lib/supabase/types-simple'
import { createBrowserClient } from '@supabase/ssr'

export default function ManagerStoreDetailPage() {
  const params = useParams()
  const storeId = params.id as string
  
  const [store, setStore] = useState<StoreType | null>(null)
  const [tasks, setTasks] = useState<StoreTask[]>([])
  const [publicToken, setPublicToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [creatingToken, setCreatingToken] = useState(false)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    const fetchStoreData = async () => {
      try {
        // جلب بيانات المتجر الفعلية
        const { data: storeData, error: storeError } = await supabase
          .from('stores')
          .select('*')
          .eq('id', storeId)
          .single()

        if (storeError) {
          console.error('Error fetching store:', storeError)
          setLoading(false)
          return
        }

        if (storeData) {
          setStore(storeData)
          
          // جلب public token إذا كان موجوداً
          const { data: tokenData } = await supabase
            .from('store_public_tokens')
            .select('token')
            .eq('store_id', storeId)
            .single()
          
          if (tokenData) {
            setPublicToken(tokenData.token)
          }
        }

        // جلب مهام المتجر
        const { data: tasksData, error: tasksError } = await supabase
          .from('store_tasks')
          .select('*')
          .eq('store_id', storeId)
          .order('sort_order', { ascending: true })

        if (tasksData && !tasksError) {
          setTasks(tasksData)
        }

      } catch (error) {
        console.error('Error fetching store data:', error)
      } finally {
        setLoading(false)
      }
    }

    if (storeId) {
      fetchStoreData()
    }
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

  const createPublicToken = async () => {
    setCreatingToken(true)
    try {
      // إنشاء توكن عشوائي
      const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
      
      const { data, error } = await supabase
        .from('store_public_tokens')
        .insert({
          store_id: storeId,
          token: token,
          expires_at: null
        })
        .select('token')
        .single()

      if (error) {
        console.error('Error creating token:', error)
        // إذا كان الجدول غير موجود، نستخدم التوكن مباشرة
        setPublicToken(token)
      } else if (data) {
        setPublicToken(data.token)
      }
    } catch (error) {
      console.error('Error creating public token:', error)
    } finally {
      setCreatingToken(false)
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
          <div className="mt-4 p-4 bg-muted rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Link2 className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">رابط صفحة التاجر</span>
            </div>
            {publicToken ? (
              <div className="flex items-center justify-between gap-2 bg-background p-2 rounded-lg">
                <code className="text-sm text-primary truncate flex-1">
                  {typeof window !== 'undefined' ? window.location.origin : ''}/public/store/{publicToken}
                </code>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={copyPublicLink}>
                    <Copy className="h-4 w-4" />
                  </Button>
                  <a 
                    href={`/public/store/${publicToken}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button variant="ghost" size="sm">
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </a>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">لم يتم إنشاء رابط عام بعد</span>
                <Button 
                  onClick={createPublicToken} 
                  disabled={creatingToken}
                  size="sm"
                >
                  {creatingToken ? (
                    <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4 ml-2" />
                  )}
                  إنشاء رابط
                </Button>
              </div>
            )}
          </div>
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
