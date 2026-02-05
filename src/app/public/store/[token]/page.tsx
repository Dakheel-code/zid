'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { 
  Store, 
  CheckCircle2, 
  Clock,
  User,
  MessageCircle,
  Plus,
  AlertTriangle,
  Phone,
  Mail,
  Calendar,
  Paperclip,
  Image as ImageIcon,
  X,
  Send,
  Loader2,
  Star
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createBrowserClient } from '@supabase/ssr'

interface PublicStoreData {
  store: {
    id: string
    store_name: string | null
    store_logo_url: string | null
    store_url: string
  }
  manager: {
    id: string
    name: string | null
    email: string | null
    phone: string | null
    avatar_url: string | null
    booking_slug: string | null
  }
  tasks: Array<{
    id: string
    title: string
    description: string | null
    status: 'pending' | 'done'
    section_title: string | null
  }>
  is_expired: boolean
  expires_at: string | null
}

export default function PublicStorePage() {
  const params = useParams()
  const token = params.token as string
  
  const [data, setData] = useState<PublicStoreData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showTaskForm, setShowTaskForm] = useState(false)
  const [newTask, setNewTask] = useState({ title: '', description: '', name: '', contact: '' })
  const [submitting, setSubmitting] = useState(false)
  
  // التعليقات
  const [comments, setComments] = useState<Array<{
    id: string
    content: string
    sender_type: 'merchant' | 'manager'
    sender_name: string | null
    attachment_url: string | null
    attachment_type: string | null
    created_at: string
  }>>([])
  const [newComment, setNewComment] = useState('')
  const [submittingComment, setSubmittingComment] = useState(false)
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null)
  const [attachmentPreview, setAttachmentPreview] = useState<string | null>(null)
  const [uploadingAttachment, setUploadingAttachment] = useState(false)
  
  // التقييم
  const [userRating, setUserRating] = useState<number>(0)
  const [hoverRating, setHoverRating] = useState<number>(0)
  const [ratingComment, setRatingComment] = useState('')
  const [existingRating, setExistingRating] = useState<{ rating: number; comment: string | null } | null>(null)
  const [submittingRating, setSubmittingRating] = useState(false)
  const [showRatingForm, setShowRatingForm] = useState(false)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    const fetchData = async () => {
      try {
        // token هو الآن store_id مباشرة
        const storeId = token

        // جلب بيانات المتجر
        const { data: storeData, error: storeError } = await supabase
          .from('stores')
          .select('id, store_name, store_logo_url, store_url, assigned_manager_id')
          .eq('id', storeId)
          .single()

        if (storeError || !storeData) {
          setError('المتجر غير موجود')
          setLoading(false)
          return
        }

        // جلب بيانات مدير العلاقة
        let managerData = { id: '', name: null, email: null, phone: null, avatar_url: null, booking_slug: null }
        if (storeData.assigned_manager_id) {
          const { data: manager } = await supabase
            .from('profiles')
            .select('id, name, email, phone, avatar_url, booking_slug')
            .eq('id', storeData.assigned_manager_id)
            .single()
          
          if (manager) {
            managerData = {
              id: manager.id,
              name: manager.name,
              email: manager.email,
              phone: manager.phone,
              avatar_url: manager.avatar_url,
              booking_slug: manager.booking_slug
            }
          }
        }

        // جلب مهام المتجر
        const { data: tasksData, error: tasksError } = await supabase
          .from('store_tasks')
          .select('id, title, description, status')
          .eq('store_id', storeId)
          .order('created_at', { ascending: true })
        
        console.log('Tasks data:', tasksData, 'Error:', tasksError)

        const formattedData: PublicStoreData = {
          store: {
            id: storeData.id,
            store_name: storeData.store_name,
            store_logo_url: storeData.store_logo_url,
            store_url: storeData.store_url
          },
          manager: {
            id: managerData.id || '',
            name: managerData.name,
            email: managerData.email,
            phone: managerData.phone,
            avatar_url: managerData.avatar_url,
            booking_slug: managerData.booking_slug
          },
          tasks: (tasksData || []).map(task => ({
            id: task.id,
            title: task.title,
            description: task.description,
            status: task.status === 'done' ? 'done' : 'pending',
            section_title: null
          })),
          is_expired: false,
          expires_at: null
        }
        
        setData(formattedData)
        
        // تحديث عنوان الصفحة
        document.title = `متابعة المهام | ${storeData.store_name || 'متجر'}`
        
        // جلب التعليقات
        const { data: commentsData } = await supabase
          .from('store_comments')
          .select('id, content, sender_type, sender_name, attachment_url, attachment_type, created_at')
          .eq('store_id', storeId)
          .order('created_at', { ascending: true })
        
        if (commentsData) {
          setComments(commentsData)
        }
        
        // جلب التقييم الحالي إذا وجد
        if (storeData.assigned_manager_id) {
          const { data: ratingData } = await supabase
            .from('manager_ratings')
            .select('rating, comment')
            .eq('manager_id', storeData.assigned_manager_id)
            .eq('store_id', storeId)
            .single()
          
          if (ratingData) {
            setExistingRating(ratingData)
            setUserRating(ratingData.rating)
            setRatingComment(ratingData.comment || '')
          }
        }
        
        setLoading(false)
        
        // الاشتراك في التحديثات الفورية للتعليقات
        const commentsChannel = supabase
          .channel('store_comments_' + storeId)
          .on('postgres_changes', {
            event: 'INSERT',
            schema: 'public',
            table: 'store_comments',
            filter: `store_id=eq.${storeId}`
          }, (payload) => {
            const newComment = payload.new as any
            setComments(prev => [...prev, {
              id: newComment.id,
              content: newComment.content,
              sender_type: newComment.sender_type,
              sender_name: newComment.sender_name,
              attachment_url: newComment.attachment_url,
              attachment_type: newComment.attachment_type,
              created_at: newComment.created_at
            }])
          })
          .subscribe()
        
        // تنظيف الاشتراك عند مغادرة الصفحة
        return () => {
          supabase.removeChannel(commentsChannel)
        }
      } catch (err) {
        console.error('Error fetching store data:', err)
        setError('حدث خطأ في تحميل البيانات')
        setLoading(false)
      }
    }

    if (token) {
      fetchData()
    }
  }, [token])
  
  // رفع المرفق
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // التحقق من حجم الملف (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        alert('حجم الملف كبير جداً. الحد الأقصى 5 ميجابايت')
        return
      }
      setAttachmentFile(file)
      // معاينة الصورة
      if (file.type.startsWith('image/')) {
        const reader = new FileReader()
        reader.onload = (e) => setAttachmentPreview(e.target?.result as string)
        reader.readAsDataURL(file)
      } else {
        setAttachmentPreview(null)
      }
    }
  }

  const removeAttachment = () => {
    setAttachmentFile(null)
    setAttachmentPreview(null)
  }

  // إرسال تعليق جديد
  const handleSubmitComment = async () => {
    if ((!newComment.trim() && !attachmentFile) || !data?.store.store_name) return
    
    setSubmittingComment(true)
    try {
      let attachmentUrl = null
      let attachmentType = null

      // رفع المرفق إذا وجد
      if (attachmentFile) {
        setUploadingAttachment(true)
        const fileExt = attachmentFile.name.split('.').pop()
        const fileName = `${token}/${Date.now()}.${fileExt}`
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('comment-attachments')
          .upload(fileName, attachmentFile)
        
        if (!uploadError && uploadData) {
          const { data: urlData } = supabase.storage
            .from('comment-attachments')
            .getPublicUrl(fileName)
          attachmentUrl = urlData.publicUrl
          attachmentType = attachmentFile.type.startsWith('image/') ? 'image' : 'file'
        }
        setUploadingAttachment(false)
      }

      const { error } = await supabase
        .from('store_comments')
        .insert({
          store_id: token,
          sender_type: 'merchant',
          sender_name: data.store.store_name,
          content: newComment || (attachmentFile ? 'مرفق' : ''),
          attachment_url: attachmentUrl,
          attachment_type: attachmentType
        })
      
      if (!error) {
        setNewComment('')
        setAttachmentFile(null)
        setAttachmentPreview(null)
      }
    } catch (err) {
      console.error('Error submitting comment:', err)
    }
    setSubmittingComment(false)
  }

  const handleSubmitTask = async () => {
    if (!newTask.title || !newTask.name || !newTask.contact) return
    
    setSubmitting(true)
    try {
      // TODO: Submit to API
      // await fetch(`/api/public/store/${token}/tasks`, {
      //   method: 'POST',
      //   body: JSON.stringify(newTask)
      // })
      
      alert('تم إرسال طلبك بنجاح! سيتواصل معك مدير العلاقة قريباً.')
      setShowTaskForm(false)
      setNewTask({ title: '', description: '', name: '', contact: '' })
    } catch (err) {
      alert('حدث خطأ في إرسال الطلب')
    }
    setSubmitting(false)
  }

  const openWhatsApp = () => {
    if (data?.manager.phone) {
      const phone = data.manager.phone.replace(/\+/g, '')
      const message = encodeURIComponent(`مرحباً، أنا من متجر ${data.store.store_name}`)
      window.open(`https://wa.me/${phone}?text=${message}`, '_blank')
    }
  }

  // إرسال التقييم
  const handleSubmitRating = async () => {
    if (userRating === 0 || !data?.manager.id) return
    
    setSubmittingRating(true)
    try {
      if (existingRating) {
        // تحديث التقييم الموجود
        const { error } = await supabase
          .from('manager_ratings')
          .update({
            rating: userRating,
            comment: ratingComment || null
          })
          .eq('manager_id', data.manager.id)
          .eq('store_id', token)
        
        if (!error) {
          setExistingRating({ rating: userRating, comment: ratingComment || null })
          setShowRatingForm(false)
        }
      } else {
        // إضافة تقييم جديد
        const { error } = await supabase
          .from('manager_ratings')
          .insert({
            manager_id: data.manager.id,
            store_id: token,
            rating: userRating,
            comment: ratingComment || null
          })
        
        if (!error) {
          setExistingRating({ rating: userRating, comment: ratingComment || null })
          setShowRatingForm(false)
        }
      }
    } catch (err) {
      console.error('Error submitting rating:', err)
    }
    setSubmittingRating(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#1a1230]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#1a1230]">
        <div className="bg-[#2d2640] border border-[#3d3555] rounded-2xl max-w-md w-full mx-4 p-8 text-center">
          <AlertTriangle className="h-12 w-12 mx-auto text-red-500 mb-4" />
          <h2 className="text-xl font-bold mb-2 text-white">خطأ</h2>
          <p className="text-gray-400">{error || 'الصفحة غير موجودة'}</p>
        </div>
      </div>
    )
  }

  if (data.is_expired) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#1a1230]">
        <div className="bg-[#2d2640] border border-[#3d3555] rounded-2xl max-w-md w-full mx-4 p-8 text-center">
          <Clock className="h-12 w-12 mx-auto text-amber-500 mb-4" />
          <h2 className="text-xl font-bold mb-2 text-white">انتهت صلاحية الوصول</h2>
          <p className="text-gray-400">
            انتهت صلاحية الوصول لهذه الصفحة. يرجى التواصل مع مدير العلاقة للحصول على رابط جديد.
          </p>
        </div>
      </div>
    )
  }

  const completedTasks = data.tasks.filter(t => t.status === 'done').length
  const totalTasks = data.tasks.length
  const progressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

  return (
    <div className="min-h-screen bg-[#1a1230] pb-safe" dir="rtl">
      {/* Header - Mobile Optimized */}
      <header className="bg-[#1a1230] border-b border-[#3d3555] sticky top-0 z-10 safe-top">
        <div className="max-w-lg mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex flex-col items-center gap-3 sm:gap-4">
            {/* شعار المتجر الكبير */}
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-[#3d3555] rounded-2xl flex items-center justify-center overflow-hidden border-2 border-purple-500/30">
              {data.store.store_logo_url ? (
                <img 
                  src={data.store.store_logo_url} 
                  alt={data.store.store_name || ''} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <Store className="h-8 w-8 sm:h-10 sm:w-10 text-purple-400" />
              )}
            </div>
            <div className="text-center">
              <h1 className="font-bold text-lg sm:text-xl text-white">{data.store.store_name || 'متجرك'}</h1>
              <p className="text-xs sm:text-sm text-gray-400 mt-1">متابعة المهام</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-3 sm:space-y-4">
        {/* Manager Card - Mobile Optimized */}
        <div className="bg-[#2d2640] border border-[#3d3555] rounded-xl sm:rounded-2xl p-3 sm:p-4">
          <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#3d3555] rounded-full flex items-center justify-center flex-shrink-0">
              {data.manager.avatar_url ? (
                <img 
                  src={data.manager.avatar_url} 
                  alt={data.manager.name || ''} 
                  className="w-full h-full object-cover rounded-full"
                />
              ) : (
                <User className="h-5 w-5 sm:h-6 sm:w-6 text-purple-400" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm text-gray-400">مدير العلاقة</p>
              <p className="font-semibold text-white text-sm sm:text-base truncate">{data.manager.name || 'مدير العلاقة'}</p>
            </div>
          </div>
          
          {/* Manager Contact Info */}
          <div className="space-y-2 sm:space-y-3 border-t border-[#3d3555] pt-3 sm:pt-4">
            {data.manager.email && (
              <div className="flex items-center gap-2 sm:gap-3">
                <Mail className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-purple-400 flex-shrink-0" />
                <a 
                  href={`mailto:${data.manager.email}`}
                  className="text-xs sm:text-sm text-purple-400 hover:text-purple-300 truncate"
                >
                  {data.manager.email}
                </a>
              </div>
            )}
            {data.manager.phone && (
              <div className="flex items-center gap-2 sm:gap-3">
                <Phone className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-purple-400 flex-shrink-0" />
                <a 
                  href={`tel:${data.manager.phone}`}
                  className="text-xs sm:text-sm text-purple-400 hover:text-purple-300"
                  dir="ltr"
                >
                  {data.manager.phone}
                </a>
              </div>
            )}
            
            {/* Action Buttons - Mobile Optimized */}
            <div className="flex gap-2 pt-2">
              {data.manager.phone && (
                <a
                  href={`https://wa.me/${data.manager.phone.replace(/[^0-9]/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-1.5 sm:gap-2 py-2.5 sm:py-2 bg-green-600 hover:bg-green-700 active:bg-green-800 text-white text-xs sm:text-sm rounded-lg transition-colors touch-manipulation"
                >
                  <MessageCircle className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
                  واتساب
                </a>
              )}
              {data.manager.booking_slug && (
                <a
                  href={`/book/${data.manager.booking_slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-1.5 sm:gap-2 py-2.5 sm:py-2 bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white text-xs sm:text-sm rounded-lg transition-colors touch-manipulation"
                >
                  <Calendar className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
                  حجز اجتماع
                </a>
              )}
            </div>
          </div>
          
          {/* Rating Section */}
          <div className="border-t border-[#3d3555] pt-3 sm:pt-4 mt-3 sm:mt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs sm:text-sm text-gray-400">تقييم مدير العلاقة</span>
              {existingRating && !showRatingForm && (
                <button
                  onClick={() => setShowRatingForm(true)}
                  className="text-xs text-purple-400 hover:text-purple-300"
                >
                  تعديل
                </button>
              )}
            </div>
            
            {showRatingForm || !existingRating ? (
              <div className="space-y-3">
                {/* Stars */}
                <div className="flex items-center justify-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setUserRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="p-1 transition-transform hover:scale-110"
                    >
                      <Star
                        className={`h-7 w-7 sm:h-8 sm:w-8 ${
                          star <= (hoverRating || userRating)
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-gray-500'
                        }`}
                      />
                    </button>
                  ))}
                </div>
                
                {/* Comment */}
                <textarea
                  className="w-full px-3 py-2 bg-[#1a1230] border border-[#3d3555] rounded-lg text-white text-sm placeholder:text-gray-500 focus:outline-none focus:border-purple-500 resize-none"
                  rows={2}
                  placeholder="أضف تعليقاً (اختياري)..."
                  value={ratingComment}
                  onChange={(e) => setRatingComment(e.target.value)}
                />
                
                {/* Submit Button */}
                <div className="flex gap-2">
                  <button
                    onClick={handleSubmitRating}
                    disabled={submittingRating || userRating === 0}
                    className="flex-1 py-2 bg-yellow-500 hover:bg-yellow-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-black font-medium text-sm rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    {submittingRating ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Star className="h-4 w-4" />
                        {existingRating ? 'تحديث التقييم' : 'إرسال التقييم'}
                      </>
                    )}
                  </button>
                  {showRatingForm && existingRating && (
                    <button
                      onClick={() => {
                        setShowRatingForm(false)
                        setUserRating(existingRating.rating)
                        setRatingComment(existingRating.comment || '')
                      }}
                      className="px-4 py-2 bg-[#3d3555] hover:bg-[#4d4565] text-white text-sm rounded-lg"
                    >
                      إلغاء
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`h-6 w-6 ${
                      star <= existingRating.rating
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-500'
                    }`}
                  />
                ))}
                <span className="text-sm text-gray-400 mr-2">({existingRating.rating}/5)</span>
              </div>
            )}
          </div>
        </div>

        {/* Progress Card - Mobile Optimized */}
        <div className="bg-[#2d2640] border border-[#3d3555] rounded-xl sm:rounded-2xl p-3 sm:p-4">
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <span className="font-medium text-white text-sm sm:text-base">تقدم المهام</span>
            <span className="text-xs sm:text-sm text-gray-400">
              {completedTasks} من {totalTasks} مهمة
            </span>
          </div>
          <div className="w-full bg-[#1a1230] rounded-full h-2.5 sm:h-3">
            <div 
              className="bg-gradient-to-r from-purple-600 to-purple-400 h-2.5 sm:h-3 rounded-full transition-all"
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>
          <p className="text-center text-xs sm:text-sm text-gray-400 mt-2">
            {progressPercent}% مكتمل
          </p>
        </div>

        {/* Tasks List - Mobile Optimized */}
        <div className="bg-[#2d2640] border border-[#3d3555] rounded-xl sm:rounded-2xl overflow-hidden">
          <div className="p-3 sm:p-4 border-b border-[#3d3555]">
            <h2 className="text-base sm:text-lg font-bold text-white">المهام</h2>
          </div>
          <div className="divide-y divide-[#3d3555]">
            {data.tasks.map((task) => (
              <div key={task.id} className="p-3 sm:p-4 flex items-start sm:items-center gap-2 sm:gap-3">
                {task.status === 'done' ? (
                  <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 flex-shrink-0 mt-0.5 sm:mt-0" />
                ) : (
                  <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-amber-500 flex-shrink-0 mt-0.5 sm:mt-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm sm:text-base ${task.status === 'done' ? 'line-through text-gray-500' : 'text-white'}`}>
                    {task.title}
                  </p>
                  {task.section_title && (
                    <p className="text-xs text-gray-500">{task.section_title}</p>
                  )}
                </div>
                <span className={`text-[10px] sm:text-xs px-2 sm:px-3 py-0.5 sm:py-1 rounded-full font-medium whitespace-nowrap ${
                  task.status === 'done' 
                    ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                    : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                }`}>
                  {task.status === 'done' ? 'منجز' : 'قيد المتابعة'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* New Task Form - Mobile Optimized */}
        {!showTaskForm ? (
          <button 
            onClick={() => setShowTaskForm(true)} 
            className="w-full py-3 border-2 border-dashed border-[#3d3555] rounded-xl sm:rounded-2xl text-gray-400 hover:border-purple-500 hover:text-purple-400 active:bg-[#2d2640] transition-colors flex items-center justify-center gap-2 text-sm sm:text-base touch-manipulation"
          >
            <Plus className="h-4 w-4" />
            إرسال طلب جديد
          </button>
        ) : (
          <div className="bg-[#2d2640] border border-[#3d3555] rounded-xl sm:rounded-2xl overflow-hidden">
            <div className="p-3 sm:p-4 border-b border-[#3d3555]">
              <h2 className="text-base sm:text-lg font-bold text-white">طلب جديد</h2>
            </div>
            <div className="p-3 sm:p-4 space-y-3 sm:space-y-4">
              <div>
                <label className="text-xs sm:text-sm font-medium mb-1 block text-gray-300">عنوان الطلب *</label>
                <input
                  className="w-full px-3 py-2.5 sm:py-2 bg-[#1a1230] border border-[#3d3555] rounded-lg text-white text-sm placeholder:text-gray-500 focus:outline-none focus:border-purple-500"
                  placeholder="مثال: تحسين صور المنتجات"
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs sm:text-sm font-medium mb-1 block text-gray-300">التفاصيل</label>
                <textarea
                  className="w-full px-3 py-2.5 sm:py-2 bg-[#1a1230] border border-[#3d3555] rounded-lg text-white text-sm placeholder:text-gray-500 focus:outline-none focus:border-purple-500 resize-none"
                  rows={3}
                  placeholder="اكتب تفاصيل طلبك..."
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="text-xs sm:text-sm font-medium mb-1 block text-gray-300">اسمك *</label>
                  <input
                    className="w-full px-3 py-2.5 sm:py-2 bg-[#1a1230] border border-[#3d3555] rounded-lg text-white text-sm placeholder:text-gray-500 focus:outline-none focus:border-purple-500"
                    placeholder="الاسم"
                    value={newTask.name}
                    onChange={(e) => setNewTask({ ...newTask, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs sm:text-sm font-medium mb-1 block text-gray-300">رقم التواصل *</label>
                  <input
                    className="w-full px-3 py-2.5 sm:py-2 bg-[#1a1230] border border-[#3d3555] rounded-lg text-white text-sm placeholder:text-gray-500 focus:outline-none focus:border-purple-500"
                    placeholder="رقم الجوال أو البريد"
                    value={newTask.contact}
                    onChange={(e) => setNewTask({ ...newTask, contact: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={handleSubmitTask} 
                  disabled={submitting || !newTask.title || !newTask.name || !newTask.contact}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-sm sm:text-base py-2.5 sm:py-2 touch-manipulation"
                >
                  {submitting ? 'جاري الإرسال...' : 'إرسال الطلب'}
                </Button>
                <Button 
                  variant="secondary" 
                  onClick={() => setShowTaskForm(false)}
                  className="bg-[#3d3555] hover:bg-[#4d4565] active:bg-[#5d5575] text-white border-0 text-sm sm:text-base py-2.5 sm:py-2 touch-manipulation"
                >
                  إلغاء
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Comments Section - Mobile Optimized */}
        <div className="bg-[#2d2640] border border-[#3d3555] rounded-xl sm:rounded-2xl overflow-hidden">
          <div className="p-3 sm:p-4 border-b border-[#3d3555]">
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <MessageCircle className="h-4 w-4 sm:h-5 sm:w-5 text-purple-400" />
              التعليقات
            </h2>
          </div>
          
          {/* Comments List - WhatsApp Style */}
          <div className="p-3 sm:p-4 space-y-2 sm:space-y-3 max-h-48 sm:max-h-64 overflow-y-auto bg-[#0b141a] rounded-lg mx-3 sm:mx-4 mt-3">
            {comments.length > 0 ? (
              comments.map((comment) => (
                <div 
                  key={comment.id} 
                  className={`max-w-[85%] p-2.5 sm:p-3 rounded-lg relative ${
                    comment.sender_type === 'merchant' 
                      ? 'bg-[#075e54] mr-auto rounded-tl-none' 
                      : 'bg-[#374151] ml-auto rounded-tr-none'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1 gap-2">
                    <span className="text-[10px] sm:text-xs font-medium text-white/80">
                      {comment.sender_type === 'merchant' ? 'أنت' : (data.manager.name || 'مدير العلاقة')}
                    </span>
                    <span className="text-[10px] text-white/60">
                      {new Date(comment.created_at).toLocaleDateString('ar-SA', { 
                        month: 'short', 
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                  {/* عرض المرفق إذا وجد */}
                  {comment.attachment_url && (
                    <div className="mb-2">
                      {comment.attachment_type === 'image' ? (
                        <a href={comment.attachment_url} target="_blank" rel="noopener noreferrer">
                          <img 
                            src={comment.attachment_url} 
                            alt="مرفق" 
                            className="max-w-full rounded-lg max-h-40 object-cover cursor-pointer hover:opacity-90"
                          />
                        </a>
                      ) : (
                        <a 
                          href={comment.attachment_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 bg-white/10 rounded-lg p-2 hover:bg-white/20 transition-colors"
                        >
                          <Paperclip className="h-4 w-4 text-white/70" />
                          <span className="text-xs text-white/70">تحميل المرفق</span>
                        </a>
                      )}
                    </div>
                  )}
                  {comment.content && comment.content !== 'مرفق' && (
                    <p className="text-xs sm:text-sm text-white">{comment.content}</p>
                  )}
                </div>
              ))
            ) : (
              <p className="text-center text-white/50 py-6 text-sm">لا توجد تعليقات بعد</p>
            )}
          </div>
          
          {/* Add Comment Form */}
          <div className="p-3 sm:p-4 border-t border-[#3d3555]">
            {/* معاينة المرفق */}
            {attachmentFile && (
              <div className="mb-3 relative inline-block">
                {attachmentPreview ? (
                  <img src={attachmentPreview} alt="معاينة" className="h-20 rounded-lg object-cover" />
                ) : (
                  <div className="flex items-center gap-2 bg-purple-600/20 rounded-lg px-3 py-2">
                    <Paperclip className="h-4 w-4 text-purple-400" />
                    <span className="text-xs text-purple-400 truncate max-w-[150px]">{attachmentFile.name}</span>
                  </div>
                )}
                <button
                  onClick={removeAttachment}
                  className="absolute -top-2 -right-2 bg-red-500 rounded-full p-1 hover:bg-red-600"
                >
                  <X className="h-3 w-3 text-white" />
                </button>
              </div>
            )}
            <div className="flex gap-2 items-center">
              {/* زر إرفاق ملف */}
              <label className="cursor-pointer p-2.5 sm:p-2 bg-[#3d3555] hover:bg-[#4d4565] rounded-lg transition-colors touch-manipulation">
                <input
                  type="file"
                  accept="image/*,.pdf,.doc,.docx"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <Paperclip className="h-5 w-5 text-purple-400" />
              </label>
              <input
                className="flex-1 px-3 py-2.5 sm:py-2 bg-[#1a1230] border border-[#3d3555] rounded-lg text-white placeholder:text-gray-500 focus:outline-none focus:border-purple-500 text-sm"
                placeholder="اكتب تعليقك..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSubmitComment()}
              />
              <button
                onClick={handleSubmitComment}
                disabled={submittingComment || uploadingAttachment || (!newComment.trim() && !attachmentFile)}
                className="px-3 sm:px-4 py-2.5 sm:py-2 bg-purple-600 hover:bg-purple-700 active:bg-purple-800 disabled:bg-gray-600 disabled:cursor-not-allowed text-white text-sm rounded-lg transition-colors touch-manipulation flex items-center gap-1"
              >
                {submittingComment || uploadingAttachment ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Footer - Mobile Optimized */}
      <footer className="text-center py-4 sm:py-6 text-xs sm:text-sm text-gray-500 pb-safe">
        <p>نظام إدارة المتاجر - ZID Dashboard</p>
      </footer>
    </div>
  )
}
