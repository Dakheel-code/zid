import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface MerchantPageProps {
  params: {
    merchantId: string
  }
}

export default function PublicMerchantPage({ params }: MerchantPageProps) {
  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>صفحة التاجر</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              معرف التاجر: {params.merchantId}
            </p>
            <p className="text-muted-foreground mt-4">
              هذه صفحة عامة للتاجر يمكن الوصول إليها بدون تسجيل دخول.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
