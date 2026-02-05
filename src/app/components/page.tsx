'use client'

import { useState } from 'react'
import { 
  Store, Users, Plus, Search, Bell, Settings, Trash2, Edit, 
  CheckCircle, AlertCircle, FileText, Calendar
} from 'lucide-react'
import {
  PageHeader,
  StatCard,
  Button,
  PrimaryButton,
  SecondaryButton,
  IconButton,
  Badge,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Input,
  Modal,
  ModalFooter,
  Drawer,
  Accordion,
  AccordionItem,
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
  ProgressBar,
  EmptyState,
} from '@/components/ui'

export default function ComponentsShowcase() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  return (
    <div className="min-h-screen bg-bg-primary p-8">
      <div className="max-w-6xl mx-auto space-y-12">
        {/* Page Header */}
        <PageHeader 
          title="مكتبة المكونات" 
          description="عرض جميع مكونات التصميم المتاحة في النظام"
        >
          <SecondaryButton leftIcon={Settings}>الإعدادات</SecondaryButton>
          <PrimaryButton leftIcon={Plus}>إضافة جديد</PrimaryButton>
        </PageHeader>

        {/* Stat Cards */}
        <section>
          <h2 className="text-heading-3 text-fg-primary mb-4">StatCard</h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="إجمالي المتاجر"
              value="1,234"
              description="متجر مسجل"
              icon={Store}
              trend={{ value: 12, isPositive: true }}
            />
            <StatCard
              title="المستخدمين"
              value="567"
              description="مستخدم نشط"
              icon={Users}
              trend={{ value: 5, isPositive: false }}
            />
            <StatCard
              title="المهام"
              value="89"
              description="مهمة معلقة"
              icon={FileText}
            />
            <StatCard
              title="الاجتماعات"
              value="12"
              description="اجتماع اليوم"
              icon={Calendar}
            />
          </div>
        </section>

        {/* Buttons */}
        <section>
          <h2 className="text-heading-3 text-fg-primary mb-4">Buttons</h2>
          <div className="flex flex-wrap gap-4">
            <Button variant="primary">Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="destructive">Destructive</Button>
            <Button variant="primary" isLoading>Loading</Button>
            <Button variant="primary" leftIcon={Plus}>مع أيقونة</Button>
          </div>
          <div className="flex flex-wrap gap-4 mt-4">
            <Button size="sm">Small</Button>
            <Button size="md">Medium</Button>
            <Button size="lg">Large</Button>
          </div>
        </section>

        {/* Icon Buttons */}
        <section>
          <h2 className="text-heading-3 text-fg-primary mb-4">Icon Buttons</h2>
          <div className="flex flex-wrap gap-4">
            <IconButton icon={Plus} variant="default" label="إضافة" />
            <IconButton icon={Edit} variant="ghost" label="تعديل" />
            <IconButton icon={Search} variant="outline" label="بحث" />
            <IconButton icon={Trash2} variant="destructive" label="حذف" />
          </div>
        </section>

        {/* Badges */}
        <section>
          <h2 className="text-heading-3 text-fg-primary mb-4">Badges</h2>
          <div className="flex flex-wrap gap-4">
            <Badge>Default</Badge>
            <Badge variant="success">Success</Badge>
            <Badge variant="warning">Warning</Badge>
            <Badge variant="error">Error</Badge>
            <Badge variant="info">Info</Badge>
            <Badge variant="outline">Outline</Badge>
          </div>
          <div className="flex flex-wrap gap-4 mt-4">
            <Badge size="sm">Small</Badge>
            <Badge size="md">Medium</Badge>
            <Badge size="lg">Large</Badge>
          </div>
        </section>

        {/* Cards */}
        <section>
          <h2 className="text-heading-3 text-fg-primary mb-4">Cards</h2>
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>عنوان البطاقة</CardTitle>
                <CardDescription>وصف مختصر للبطاقة</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-fg-secondary">محتوى البطاقة يظهر هنا</p>
              </CardContent>
              <CardFooter>
                <Button variant="outline" size="sm">إلغاء</Button>
                <Button size="sm">حفظ</Button>
              </CardFooter>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>بطاقة أخرى</CardTitle>
              </CardHeader>
              <CardContent>
                <Input placeholder="أدخل النص هنا..." />
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Progress Bars */}
        <section>
          <h2 className="text-heading-3 text-fg-primary mb-4">Progress Bars</h2>
          <div className="space-y-4 max-w-md">
            <ProgressBar value={75} showLabel />
            <ProgressBar value={50} variant="success" />
            <ProgressBar value={30} variant="warning" />
            <ProgressBar value={15} variant="error" />
            <ProgressBar value={90} size="lg" />
          </div>
        </section>

        {/* Table */}
        <section>
          <h2 className="text-heading-3 text-fg-primary mb-4">Table</h2>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>الاسم</TableHead>
                <TableHead>البريد</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead>الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell>أحمد محمد</TableCell>
                <TableCell>ahmed@example.com</TableCell>
                <TableCell><Badge variant="success">نشط</Badge></TableCell>
                <TableCell>
                  <IconButton icon={Edit} variant="ghost" size="sm" label="تعديل" />
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>سارة علي</TableCell>
                <TableCell>sara@example.com</TableCell>
                <TableCell><Badge variant="warning">معلق</Badge></TableCell>
                <TableCell>
                  <IconButton icon={Edit} variant="ghost" size="sm" label="تعديل" />
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </section>

        {/* Accordion */}
        <section>
          <h2 className="text-heading-3 text-fg-primary mb-4">Accordion</h2>
          <Accordion>
            <AccordionItem title="ما هو نظام ZID Dashboard؟" defaultOpen>
              نظام ZID Dashboard هو نظام إدارة متاجر متكامل يساعد مدراء العلاقة في متابعة وإدارة المتاجر المسندة إليهم.
            </AccordionItem>
            <AccordionItem title="كيف أبدأ باستخدام النظام؟">
              يمكنك البدء بتسجيل الدخول باستخدام بيانات حسابك، ثم الانتقال إلى لوحة التحكم لعرض المتاجر والمهام.
            </AccordionItem>
            <AccordionItem title="هل يمكنني تخصيص الواجهة؟">
              نعم، يمكنك تغيير السمة من خلال أيقونات السمات في الشريط العلوي.
            </AccordionItem>
          </Accordion>
        </section>

        {/* Empty State */}
        <section>
          <h2 className="text-heading-3 text-fg-primary mb-4">Empty State</h2>
          <Card>
            <EmptyState
              icon={FileText}
              title="لا توجد مهام"
              description="لم يتم إضافة أي مهام بعد. ابدأ بإنشاء مهمة جديدة."
            >
              <PrimaryButton leftIcon={Plus}>إنشاء مهمة</PrimaryButton>
            </EmptyState>
          </Card>
        </section>

        {/* Modal & Drawer */}
        <section>
          <h2 className="text-heading-3 text-fg-primary mb-4">Modal & Drawer</h2>
          <div className="flex gap-4">
            <Button onClick={() => setIsModalOpen(true)}>فتح Modal</Button>
            <Button variant="outline" onClick={() => setIsDrawerOpen(true)}>فتح Drawer</Button>
          </div>

          <Modal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            title="عنوان النافذة"
            description="وصف مختصر للنافذة المنبثقة"
          >
            <p className="text-fg-secondary mb-4">محتوى النافذة المنبثقة يظهر هنا.</p>
            <Input placeholder="أدخل قيمة..." />
            <ModalFooter>
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>إلغاء</Button>
              <Button onClick={() => setIsModalOpen(false)}>حفظ</Button>
            </ModalFooter>
          </Modal>

          <Drawer
            isOpen={isDrawerOpen}
            onClose={() => setIsDrawerOpen(false)}
            title="عنوان الدرج"
            description="وصف مختصر للدرج الجانبي"
          >
            <div className="space-y-4">
              <p className="text-fg-secondary">محتوى الدرج الجانبي يظهر هنا.</p>
              <Input placeholder="بحث..." />
              <Button className="w-full">تطبيق</Button>
            </div>
          </Drawer>
        </section>
      </div>
    </div>
  )
}
