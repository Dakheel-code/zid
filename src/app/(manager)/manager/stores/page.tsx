'use client'

import { useEffect, useState } from 'react'
import { 
  Store, 
  Search,
  ExternalLink,
  User,
  Phone,
  Mail,
  RefreshCw,
  Edit
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Link from 'next/link'
import type { Store as StoreType, StoreStatus } from '@/lib/supabase/types-simple'

export default function ManagerStoresPage() {
  const [stores, setStores] = useState<StoreType[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<StoreStatus | 'all'>('all')

  useEffect(() => {
    async function fetchStores() {
      setLoading(true)
      try {
        const { getStores } = await import('@/lib/services/store-service')
        const result = await getStores()
        
        if (result.stores && result.stores.length > 0) {
          setStores(result.stores)
        } else {
          setStores([])
        }
      } catch (error) {
        console.error('Error fetching stores:', error)
        setStores([])
      }
      setLoading(false)
    }
    
    fetchStores()
  }, [])

  const filteredStores = stores.filter(store => {
    const matchesSearch = 
      store.store_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      store.store_url.toLowerCase().includes(searchQuery.toLowerCase()) ||
      store.owner_name?.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || store.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const getStatusBadge = (status: StoreStatus) => {
    const styles = {
      new: 'bg-blue-100 text-blue-700',
      active: 'bg-green-100 text-green-700',
      paused: 'bg-amber-100 text-amber-700',
      ended: 'bg-red-100 text-red-700'
    }
    const labels = {
      new: 'جديد',
      active: 'نشط',
      paused: 'متوقف',
      ended: 'منتهي'
    }
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status]}`}>
        {labels[status]}
      </span>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl lg:text-2xl font-bold text-foreground">المتاجر المسندة</h1>
        <p className="text-sm lg:text-base text-muted-foreground">قائمة المتاجر المسندة إليك</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="بحث بالاسم أو الرابط..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pr-10"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as StoreStatus | 'all')}
          className="px-3 py-2 border rounded-md bg-background"
        >
          <option value="all">كل الحالات</option>
          <option value="new">جديد</option>
          <option value="active">نشط</option>
          <option value="paused">متوقف</option>
          <option value="ended">منتهي</option>
        </select>
      </div>

      {/* Stores Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredStores.map((store) => (
          <Card key={store.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              {/* Store Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                    {store.store_logo_url ? (
                      <img 
                        src={store.store_logo_url} 
                        alt={store.store_name || ''} 
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      <Store className="h-6 w-6 text-muted-foreground" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold">{store.store_name || 'بدون اسم'}</h3>
                    <a 
                      href={store.store_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1"
                    >
                      {store.store_url}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>
              </div>

              {/* Badges */}
              <div className="flex items-center gap-2 mb-3">
                {getStatusBadge(store.status)}
                {(store.metadata as { needs_review?: boolean })?.needs_review && (
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700 flex items-center gap-1">
                    <RefreshCw className="h-3 w-3" />
                    يحتاج مراجعة
                  </span>
                )}
              </div>

              {/* Owner Info */}
              <div className="space-y-2 text-sm">
                {store.owner_name && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <User className="h-4 w-4" />
                    <span>{store.owner_name}</span>
                  </div>
                )}
                {store.owner_email && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    <span>{store.owner_email}</span>
                  </div>
                )}
                {store.owner_phone && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="h-4 w-4" />
                    <span dir="ltr">{store.owner_phone}</span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2 mt-4 pt-3 border-t">
                <Link href={`/manager/store/${store.id}`} className="flex-1">
                  <Button variant="secondary" size="sm" className="w-full">
                    عرض التفاصيل
                  </Button>
                </Link>
                <Button variant="secondary" size="sm">
                  <Edit className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredStores.length === 0 && (
        <div className="text-center py-12">
          <Store className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">لا توجد متاجر</h3>
          <p className="text-muted-foreground">لم يتم العثور على متاجر تطابق البحث</p>
        </div>
      )}
    </div>
  )
}
