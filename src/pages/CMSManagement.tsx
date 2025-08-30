import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  FileText, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff, 
  Globe, 
  Layout,
  Image,
  Type,
  List,
  Quote
} from 'lucide-react';

interface Page {
  id: string;
  title: string;
  title_ar: string;
  slug: string;
  description: string | null;
  description_ar: string | null;
  meta_title: string | null;
  meta_description: string | null;
  meta_keywords: string | null;
  is_published: boolean;
  template_name: string;
  sort_order: number;
  created_at: string;
  blocks?: Block[];
}

interface Block {
  id: string;
  page_id: string;
  block_type: 'hero' | 'features' | 'testimonials' | 'pricing' | 'faq' | 'cta' | 'gallery' | 'stats' | 'about' | 'contact';
  title: string | null;
  title_ar: string | null;
  content: any;
  settings: any;
  sort_order: number;
  is_visible: boolean;
}

interface PageForm {
  title: string;
  title_ar: string;
  slug: string;
  description: string;
  description_ar: string;
  meta_title: string;
  meta_description: string;
  meta_keywords: string;
  template_name: string;
}

interface BlockForm {
  block_type: 'hero' | 'features' | 'testimonials' | 'cta';
  title: string;
  title_ar: string;
  content: any;
  settings: any;
}

const CMSManagement = () => {
  const [pages, setPages] = useState<Page[]>([]);
  const [selectedPage, setSelectedPage] = useState<Page | null>(null);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPageDialog, setShowPageDialog] = useState(false);
  const [showBlockDialog, setShowBlockDialog] = useState(false);
  const [editingPage, setEditingPage] = useState<Page | null>(null);
  const [editingBlock, setEditingBlock] = useState<Block | null>(null);
  const { toast } = useToast();

  const [pageForm, setPageForm] = useState<PageForm>({
    title: '',
    title_ar: '',
    slug: '',
    description: '',
    description_ar: '',
    meta_title: '',
    meta_description: '',
    meta_keywords: '',
    template_name: 'default'
  });

  const [blockForm, setBlockForm] = useState<BlockForm>({
    block_type: 'hero',
    title: '',
    title_ar: '',
    content: {},
    settings: {}
  });

  useEffect(() => {
    loadPages();
  }, []);

  useEffect(() => {
    if (selectedPage) {
      loadBlocks(selectedPage.id);
    }
  }, [selectedPage]);

  const loadPages = async () => {
    try {
      const { data, error } = await supabase
        .from('cms_pages')
        .select('*')
        .order('sort_order', { ascending: true });

      if (error) throw error;
      setPages(data || []);
    } catch (error: any) {
      toast({
        title: "خطأ في تحميل الصفحات",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadBlocks = async (pageId: string) => {
    try {
      const { data, error } = await supabase
        .from('cms_blocks')
        .select('*')
        .eq('page_id', pageId)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      setBlocks(data || []);
    } catch (error: any) {
      toast({
        title: "خطأ في تحميل المحتوى",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const resetPageForm = () => {
    setPageForm({
      title: '',
      title_ar: '',
      slug: '',
      description: '',
      description_ar: '',
      meta_title: '',
      meta_description: '',
      meta_keywords: '',
      template_name: 'default'
    });
    setEditingPage(null);
  };

  const resetBlockForm = () => {
    setBlockForm({
      block_type: 'text',
      title: '',
      title_ar: '',
      content: {},
      settings: {}
    });
    setEditingBlock(null);
  };

  const handlePageEdit = (page: Page) => {
    setEditingPage(page);
    setPageForm({
      title: page.title,
      title_ar: page.title_ar,
      slug: page.slug,
      description: page.description || '',
      description_ar: page.description_ar || '',
      meta_title: page.meta_title || '',
      meta_description: page.meta_description || '',
      meta_keywords: page.meta_keywords || '',
      template_name: page.template_name || 'default'
    });
    setShowPageDialog(true);
  };

  const handleBlockEdit = (block: Block) => {
    setEditingBlock(block);
    setBlockForm({
      block_type: block.block_type,
      title: block.title || '',
      title_ar: block.title_ar || '',
      content: block.content || {},
      settings: block.settings || {}
    });
    setShowBlockDialog(true);
  };

  const handlePageSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      let error;
      if (editingPage) {
        const { error: updateError } = await supabase
          .from('cms_pages')
          .update(pageForm)
          .eq('id', editingPage.id);
        error = updateError;
      } else {
        const { error: insertError } = await supabase
          .from('cms_pages')
          .insert([{
            ...pageForm,
            sort_order: pages.length,
            is_published: false
          }]);
        error = insertError;
      }

      if (error) throw error;

      toast({
        title: editingPage ? "تم تحديث الصفحة" : "تم إنشاء الصفحة",
        description: "تم حفظ التغييرات بنجاح",
      });

      setShowPageDialog(false);
      resetPageForm();
      loadPages();
    } catch (error: any) {
      toast({
        title: "خطأ في حفظ الصفحة",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleBlockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPage) return;

    setSaving(true);

    try {
      let error;
      if (editingBlock) {
        const { error: updateError } = await supabase
          .from('cms_blocks')
          .update(blockForm)
          .eq('id', editingBlock.id);
        error = updateError;
      } else {
        const { error: insertError } = await supabase
          .from('cms_blocks')
          .insert([{
            ...blockForm,
            page_id: selectedPage.id,
            sort_order: blocks.length,
            is_visible: true
          }]);
        error = insertError;
      }

      if (error) throw error;

      toast({
        title: editingBlock ? "تم تحديث المحتوى" : "تم إنشاء المحتوى",
        description: "تم حفظ التغييرات بنجاح",
      });

      setShowBlockDialog(false);
      resetBlockForm();
      loadBlocks(selectedPage.id);
    } catch (error: any) {
      toast({
        title: "خطأ في حفظ المحتوى",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const togglePagePublish = async (pageId: string, isPublished: boolean) => {
    try {
      const { error } = await supabase
        .from('cms_pages')
        .update({ is_published: isPublished })
        .eq('id', pageId);

      if (error) throw error;

      toast({
        title: isPublished ? "تم نشر الصفحة" : "تم إلغاء نشر الصفحة",
        description: "تم تحديث حالة الصفحة بنجاح",
      });

      loadPages();
    } catch (error: any) {
      toast({
        title: "خطأ في تحديث الصفحة",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const toggleBlockVisibility = async (blockId: string, isVisible: boolean) => {
    try {
      const { error } = await supabase
        .from('cms_blocks')
        .update({ is_visible: isVisible })
        .eq('id', blockId);

      if (error) throw error;

      toast({
        title: isVisible ? "تم إظهار المحتوى" : "تم إخفاء المحتوى",
        description: "تم تحديث حالة المحتوى بنجاح",
      });

      if (selectedPage) {
        loadBlocks(selectedPage.id);
      }
    } catch (error: any) {
      toast({
        title: "خطأ في تحديث المحتوى",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const deletePage = async (pageId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذه الصفحة؟')) return;

    try {
      const { error } = await supabase
        .from('cms_pages')
        .delete()
        .eq('id', pageId);

      if (error) throw error;

      toast({
        title: "تم حذف الصفحة",
        description: "تم حذف الصفحة وجميع محتوياتها بنجاح",
      });

      if (selectedPage?.id === pageId) {
        setSelectedPage(null);
        setBlocks([]);
      }
      loadPages();
    } catch (error: any) {
      toast({
        title: "خطأ في حذف الصفحة",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const deleteBlock = async (blockId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا المحتوى؟')) return;

    try {
      const { error } = await supabase
        .from('cms_blocks')
        .delete()
        .eq('id', blockId);

      if (error) throw error;

      toast({
        title: "تم حذف المحتوى",
        description: "تم حذف المحتوى بنجاح",
      });

      if (selectedPage) {
        loadBlocks(selectedPage.id);
      }
    } catch (error: any) {
      toast({
        title: "خطأ في حذف المحتوى",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getBlockTypeIcon = (type: string) => {
    const icons = {
      text: Type,
      image: Image,
      hero: Layout,
      features: List,
      testimonials: Quote,
      cta: Globe
    };
    return icons[type as keyof typeof icons] || Type;
  };

  const renderBlockContentForm = () => {
    switch (blockForm.block_type) {
      case 'text':
        return (
          <div className="space-y-4">
            <div>
              <Label>النص (عربي)</Label>
              <Textarea
                value={blockForm.content.text_ar || ''}
                onChange={(e) => setBlockForm(prev => ({
                  ...prev,
                  content: { ...prev.content, text_ar: e.target.value }
                }))}
                rows={4}
              />
            </div>
            <div>
              <Label>النص (إنجليزي)</Label>
              <Textarea
                value={blockForm.content.text_en || ''}
                onChange={(e) => setBlockForm(prev => ({
                  ...prev,
                  content: { ...prev.content, text_en: e.target.value }
                }))}
                rows={4}
              />
            </div>
          </div>
        );
      case 'image':
        return (
          <div className="space-y-4">
            <div>
              <Label>رابط الصورة</Label>
              <Input
                value={blockForm.content.image_url || ''}
                onChange={(e) => setBlockForm(prev => ({
                  ...prev,
                  content: { ...prev.content, image_url: e.target.value }
                }))}
                placeholder="https://example.com/image.jpg"
              />
            </div>
            <div>
              <Label>النص البديل</Label>
              <Input
                value={blockForm.content.alt_text || ''}
                onChange={(e) => setBlockForm(prev => ({
                  ...prev,
                  content: { ...prev.content, alt_text: e.target.value }
                }))}
                placeholder="وصف الصورة"
              />
            </div>
          </div>
        );
      default:
        return (
          <div>
            <Label>محتوى JSON</Label>
            <Textarea
              value={JSON.stringify(blockForm.content, null, 2)}
              onChange={(e) => {
                try {
                  const content = JSON.parse(e.target.value);
                  setBlockForm(prev => ({ ...prev, content }));
                } catch {
                  // Invalid JSON, ignore
                }
              }}
              rows={6}
            />
          </div>
        );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">جاري تحميل إدارة المحتوى...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <FileText className="h-8 w-8 text-primary" />
              إدارة المحتوى (CMS)
            </h1>
            <p className="text-gray-600 mt-1">إدارة صفحات الموقع والمحتوى</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Pages List */}
          <div className="lg:col-span-1">
            <Card className="bg-white/80 backdrop-blur-sm h-fit">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">الصفحات</CardTitle>
                  <Dialog open={showPageDialog} onOpenChange={(open) => {
                    setShowPageDialog(open);
                    if (!open) resetPageForm();
                  }}>
                    <DialogTrigger asChild>
                      <Button size="sm">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>
                          {editingPage ? 'تعديل الصفحة' : 'إنشاء صفحة جديدة'}
                        </DialogTitle>
                      </DialogHeader>
                      
                      <form onSubmit={handlePageSubmit} className="space-y-4">
                        <Tabs defaultValue="basic" className="w-full">
                          <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="basic">المعلومات الأساسية</TabsTrigger>
                            <TabsTrigger value="seo">SEO</TabsTrigger>
                          </TabsList>

                          <TabsContent value="basic" className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label>العنوان (عربي)</Label>
                                <Input
                                  value={pageForm.title_ar}
                                  onChange={(e) => setPageForm(prev => ({ 
                                    ...prev, 
                                    title_ar: e.target.value,
                                    slug: e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^\w\u0600-\u06FF-]/g, '')
                                  }))}
                                  required
                                />
                              </div>
                              <div>
                                <Label>العنوان (إنجليزي)</Label>
                                <Input
                                  value={pageForm.title}
                                  onChange={(e) => setPageForm(prev => ({ ...prev, title: e.target.value }))}
                                  required
                                />
                              </div>
                            </div>

                            <div>
                              <Label>الرابط المختصر (Slug)</Label>
                              <Input
                                value={pageForm.slug}
                                onChange={(e) => setPageForm(prev => ({ ...prev, slug: e.target.value }))}
                                required
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label>الوصف (عربي)</Label>
                                <Textarea
                                  value={pageForm.description_ar}
                                  onChange={(e) => setPageForm(prev => ({ ...prev, description_ar: e.target.value }))}
                                  rows={3}
                                />
                              </div>
                              <div>
                                <Label>الوصف (إنجليزي)</Label>
                                <Textarea
                                  value={pageForm.description}
                                  onChange={(e) => setPageForm(prev => ({ ...prev, description: e.target.value }))}
                                  rows={3}
                                />
                              </div>
                            </div>

                            <div>
                              <Label>القالب</Label>
                              <Select value={pageForm.template_name} onValueChange={(value) => 
                                setPageForm(prev => ({ ...prev, template_name: value }))
                              }>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="default">افتراضي</SelectItem>
                                  <SelectItem value="landing">صفحة هبوط</SelectItem>
                                  <SelectItem value="blog">مدونة</SelectItem>
                                  <SelectItem value="contact">تواصل</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </TabsContent>

                          <TabsContent value="seo" className="space-y-4">
                            <div>
                              <Label>عنوان SEO</Label>
                              <Input
                                value={pageForm.meta_title}
                                onChange={(e) => setPageForm(prev => ({ ...prev, meta_title: e.target.value }))}
                                maxLength={60}
                              />
                            </div>

                            <div>
                              <Label>وصف SEO</Label>
                              <Textarea
                                value={pageForm.meta_description}
                                onChange={(e) => setPageForm(prev => ({ ...prev, meta_description: e.target.value }))}
                                maxLength={160}
                                rows={3}
                              />
                            </div>

                            <div>
                              <Label>الكلمات المفتاحية</Label>
                              <Input
                                value={pageForm.meta_keywords}
                                onChange={(e) => setPageForm(prev => ({ ...prev, meta_keywords: e.target.value }))}
                                placeholder="كلمة1, كلمة2, كلمة3"
                              />
                            </div>
                          </TabsContent>
                        </Tabs>

                        <div className="flex justify-end gap-2 pt-4 border-t">
                          <Button type="button" variant="outline" onClick={() => setShowPageDialog(false)}>
                            إلغاء
                          </Button>
                          <Button type="submit" disabled={saving}>
                            {saving ? 'جاري الحفظ...' : (editingPage ? 'تحديث' : 'إنشاء')}
                          </Button>
                        </div>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="space-y-1">
                  {pages.map((page) => (
                    <div
                      key={page.id}
                      className={`p-3 cursor-pointer hover:bg-gray-50 border-r-4 transition-colors ${
                        selectedPage?.id === page.id
                          ? 'bg-blue-50 border-blue-500'
                          : 'border-transparent'
                      }`}
                      onClick={() => setSelectedPage(page)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="font-semibold text-sm">{page.title_ar}</div>
                          <div className="text-xs text-gray-500">/{page.slug}</div>
                        </div>
                        <div className="flex items-center gap-1">
                          {page.is_published ? (
                            <Eye className="h-4 w-4 text-green-500" />
                          ) : (
                            <EyeOff className="h-4 w-4 text-gray-400" />
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePageEdit(page);
                            }}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Page Content */}
          <div className="lg:col-span-2">
            {selectedPage ? (
              <Card className="bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {selectedPage.title_ar}
                        <Badge variant={selectedPage.is_published ? 'default' : 'secondary'}>
                          {selectedPage.is_published ? 'منشور' : 'مسودة'}
                        </Badge>
                      </CardTitle>
                      <CardDescription>/{selectedPage.slug}</CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Switch
                        checked={selectedPage.is_published}
                        onCheckedChange={(checked) => togglePagePublish(selectedPage.id, checked)}
                      />
                      <Dialog open={showBlockDialog} onOpenChange={(open) => {
                        setShowBlockDialog(open);
                        if (!open) resetBlockForm();
                      }}>
                        <DialogTrigger asChild>
                          <Button size="sm">
                            <Plus className="h-4 w-4 ml-1" />
                            إضافة محتوى
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>
                              {editingBlock ? 'تعديل المحتوى' : 'إضافة محتوى جديد'}
                            </DialogTitle>
                          </DialogHeader>
                          
                          <form onSubmit={handleBlockSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label>نوع المحتوى</Label>
                                <Select
                                  value={blockForm.block_type}
                                  onValueChange={(value: any) => setBlockForm(prev => ({ ...prev, block_type: value }))}
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="text">نص</SelectItem>
                                    <SelectItem value="image">صورة</SelectItem>
                                    <SelectItem value="hero">قسم رئيسي</SelectItem>
                                    <SelectItem value="features">ميزات</SelectItem>
                                    <SelectItem value="testimonials">آراء العملاء</SelectItem>
                                    <SelectItem value="cta">دعوة للعمل</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <Label>العنوان (عربي)</Label>
                                <Input
                                  value={blockForm.title_ar}
                                  onChange={(e) => setBlockForm(prev => ({ ...prev, title_ar: e.target.value }))}
                                />
                              </div>
                            </div>

                            <div>
                              <Label>العنوان (إنجليزي)</Label>
                              <Input
                                value={blockForm.title}
                                onChange={(e) => setBlockForm(prev => ({ ...prev, title: e.target.value }))}
                              />
                            </div>

                            {renderBlockContentForm()}

                            <div className="flex justify-end gap-2 pt-4 border-t">
                              <Button type="button" variant="outline" onClick={() => setShowBlockDialog(false)}>
                                إلغاء
                              </Button>
                              <Button type="submit" disabled={saving}>
                                {saving ? 'جاري الحفظ...' : (editingBlock ? 'تحديث' : 'إضافة')}
                              </Button>
                            </div>
                          </form>
                        </DialogContent>
                      </Dialog>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deletePage(selectedPage.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {blocks.length === 0 ? (
                    <div className="text-center py-12">
                      <Layout className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-600 mb-2">لا يوجد محتوى</h3>
                      <p className="text-gray-500 mb-4">ابدأ بإضافة محتوى لهذه الصفحة</p>
                      <Button onClick={() => setShowBlockDialog(true)}>
                        <Plus className="h-4 w-4 ml-1" />
                        إضافة محتوى
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {blocks.map((block) => {
                        const Icon = getBlockTypeIcon(block.block_type);
                        return (
                          <div
                            key={block.id}
                            className="border rounded-lg p-4 bg-gray-50/50"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <Icon className="h-4 w-4 text-gray-600" />
                                <span className="font-semibold text-sm">
                                  {block.title_ar || block.title || `محتوى ${block.block_type}`}
                                </span>
                                <Badge variant="outline" className="text-xs">
                                  {block.block_type}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-1">
                                <Switch
                                  checked={block.is_visible}
                                  onCheckedChange={(checked) => toggleBlockVisibility(block.id, checked)}
                                />
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleBlockEdit(block)}
                                >
                                  <Edit className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => deleteBlock(block.id)}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                            <div className="text-sm text-gray-600">
                              {block.block_type === 'text' && (
                                <p>{block.content?.text_ar || block.content?.text_en || 'محتوى نصي'}</p>
                              )}
                              {block.block_type === 'image' && (
                                <p>صورة: {block.content?.alt_text || 'بدون وصف'}</p>
                              )}
                              {!['text', 'image'].includes(block.block_type) && (
                                <p>محتوى {block.block_type}</p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-white/80 backdrop-blur-sm">
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <FileText className="h-16 w-16 text-gray-400 mb-4" />
                  <h3 className="text-xl font-semibold text-gray-600 mb-2">اختر صفحة للتحرير</h3>
                  <p className="text-gray-500 mb-6">اختر صفحة من القائمة الجانبية لبدء تحرير محتواها</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CMSManagement;