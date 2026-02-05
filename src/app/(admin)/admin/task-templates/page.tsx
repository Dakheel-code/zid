'use client'

import { useEffect, useState } from 'react'
import { 
  ListChecks, 
  Plus, 
  GripVertical,
  ChevronDown,
  ChevronUp,
  Edit,
  Trash2,
  MessageCircle,
  Eye,
  EyeOff
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface TaskTemplate {
  id: string
  title: string
  description: string | null
  sort_order: number
  whatsapp_template: string | null
  visible_to_merchant: boolean
}

interface SectionTemplate {
  id: string
  title: string
  sort_order: number
  whatsapp_template: string | null
  tasks: TaskTemplate[]
}

export default function AdminTaskTemplatesPage() {
  const [sections, setSections] = useState<SectionTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set())

  useEffect(() => {
    // TODO: Fetch from API
    const mockSections: SectionTemplate[] = [
      {
        id: '1',
        title: 'إعداد المتجر',
        sort_order: 0,
        whatsapp_template: null,
        tasks: [
          { id: '1-1', title: 'مراجعة إعدادات المتجر', description: 'التأكد من إعدادات المتجر الأساسية', sort_order: 0, whatsapp_template: null, visible_to_merchant: true },
          { id: '1-2', title: 'إضافة طرق الدفع', description: null, sort_order: 1, whatsapp_template: 'مرحباً، نود إعلامك بأنه تم إضافة طرق الدفع', visible_to_merchant: true },
          { id: '1-3', title: 'إعداد الشحن', description: null, sort_order: 2, whatsapp_template: null, visible_to_merchant: true }
        ]
      },
      {
        id: '2',
        title: 'المنتجات',
        sort_order: 1,
        whatsapp_template: null,
        tasks: [
          { id: '2-1', title: 'مراجعة المنتجات', description: null, sort_order: 0, whatsapp_template: null, visible_to_merchant: true },
          { id: '2-2', title: 'تحسين صور المنتجات', description: null, sort_order: 1, whatsapp_template: null, visible_to_merchant: false }
        ]
      },
      {
        id: '3',
        title: 'التسويق',
        sort_order: 2,
        whatsapp_template: null,
        tasks: [
          { id: '3-1', title: 'إعداد Google Analytics', description: null, sort_order: 0, whatsapp_template: null, visible_to_merchant: true },
          { id: '3-2', title: 'ربط وسائل التواصل', description: null, sort_order: 1, whatsapp_template: null, visible_to_merchant: true }
        ]
      }
    ]
    setSections(mockSections)
    setExpandedSections(new Set(mockSections.map(s => s.id)))
    setLoading(false)
  }, [])

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections)
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId)
    } else {
      newExpanded.add(sectionId)
    }
    setExpandedSections(newExpanded)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">قوالب المهام</h1>
          <p className="text-muted-foreground">إدارة أقسام ومهام القوالب</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 ml-2" />
          إضافة قسم
        </Button>
      </div>

      {/* Sections */}
      <div className="space-y-4">
        {sections.map((section) => (
          <Card key={section.id}>
            <CardHeader className="py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button className="cursor-grab hover:bg-muted p-1 rounded">
                    <GripVertical className="h-5 w-5 text-muted-foreground" />
                  </button>
                  <button 
                    onClick={() => toggleSection(section.id)}
                    className="flex items-center gap-2"
                  >
                    {expandedSections.has(section.id) ? (
                      <ChevronUp className="h-5 w-5" />
                    ) : (
                      <ChevronDown className="h-5 w-5" />
                    )}
                  </button>
                  <CardTitle className="text-lg">{section.title}</CardTitle>
                  <span className="text-sm text-muted-foreground">
                    ({section.tasks.length} مهمة)
                  </span>
                  {section.whatsapp_template && (
                    <MessageCircle className="h-4 w-4 text-green-600" />
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            
            {expandedSections.has(section.id) && (
              <CardContent className="pt-0">
                <div className="space-y-2">
                  {section.tasks.map((task) => (
                    <div 
                      key={task.id}
                      className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <button className="cursor-grab hover:bg-background p-1 rounded">
                          <GripVertical className="h-4 w-4 text-muted-foreground" />
                        </button>
                        <div>
                          <p className="font-medium">{task.title}</p>
                          {task.description && (
                            <p className="text-sm text-muted-foreground">{task.description}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {task.whatsapp_template && (
                          <span className="text-green-600" title="قالب واتساب">
                            <MessageCircle className="h-4 w-4" />
                          </span>
                        )}
                        {task.visible_to_merchant ? (
                          <span className="text-blue-600" title="مرئي للتاجر">
                            <Eye className="h-4 w-4" />
                          </span>
                        ) : (
                          <span className="text-muted-foreground" title="مخفي عن التاجر">
                            <EyeOff className="h-4 w-4" />
                          </span>
                        )}
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  
                  {/* Add Task Button */}
                  <Button variant="secondary" size="sm" className="w-full mt-2">
                    <Plus className="h-4 w-4 ml-2" />
                    إضافة مهمة
                  </Button>
                </div>
              </CardContent>
            )}
          </Card>
        ))}
      </div>

      {sections.length === 0 && (
        <div className="text-center py-12">
          <ListChecks className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">لا توجد قوالب</h3>
          <p className="text-muted-foreground">ابدأ بإضافة قسم جديد</p>
        </div>
      )}
    </div>
  )
}
