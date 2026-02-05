'use client'

interface LoadingProps {
  fullScreen?: boolean
  message?: string
}

export function Loading({ fullScreen = true, message = 'جاري التحميل...' }: LoadingProps) {
  const content = (
    <div className="flex flex-col items-center justify-center gap-6">
      {/* الشعار مع تأثير التحميل */}
      <div className="relative">
        {/* حلقة التحميل الخارجية */}
        <div className="absolute inset-0 w-24 h-24 border-4 border-purple-500/20 rounded-full" />
        <div className="absolute inset-0 w-24 h-24 border-4 border-transparent border-t-purple-500 rounded-full animate-spin" />
        
        {/* الشعار في المنتصف */}
        <div className="w-24 h-24 flex items-center justify-center">
          <img 
            src="/zid-logo.png" 
            alt="زد" 
            className="h-12 w-auto animate-pulse"
          />
        </div>
      </div>
      
      {/* نص التحميل */}
      <div className="flex flex-col items-center gap-2">
        <p className="text-[#c4b5fd] text-sm font-medium">{message}</p>
        <div className="flex gap-1">
          <span className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  )

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-[#1a1230] flex items-center justify-center z-50">
        {content}
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center h-64">
      {content}
    </div>
  )
}

export function PageLoading() {
  return <Loading fullScreen={false} />
}

export function FullPageLoading() {
  return <Loading fullScreen={true} />
}
