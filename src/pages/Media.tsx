import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/hooks/useTenant';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Image, Plus, Search, Calendar, Users, Share2, Download, Eye, Trash2, Upload, FileText, Sparkles } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface MediaItem {
  id: string;
  file_name: string;
  file_path: string;
  file_type: string;
  file_size: number | null;
  mime_type: string | null;
  caption: string | null;
  album_date: string;
  is_public: boolean;
  tags: any;
  created_at: string;
  updated_at: string;
}

interface Student {
  id: string;
  full_name: string;
  student_id: string;
  class_id: string | null;
  classes?: {
    name: string;
  };
}

interface MediaStudentLink {
  id: string;
  media_id: string;
  student_id: string;
  students: {
    full_name: string;
    student_id: string;
  };
}

const Media = () => {
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [mediaLinks, setMediaLinks] = useState<MediaStudentLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { tenant } = useTenant();
  const { user } = useAuth();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    caption: '',
    album_date: new Date().toISOString().split('T')[0],
    is_public: true,
    selected_students: [] as string[],
    tags: []
  });

  useEffect(() => {
    if (tenant) {
      loadData();
    }
  }, [tenant, selectedDate]);

  const loadData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadMediaItems(),
        loadStudents(),
        loadMediaLinks()
      ]);
    } finally {
      setLoading(false);
    }
  };

  const loadMediaItems = async () => {
    try {
      const { data, error } = await supabase
        .from('media')
        .select('*')
        .eq('tenant_id', tenant?.id)
        .eq('album_date', selectedDate)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMediaItems(data || []);
    } catch (error: any) {
      toast({
        title: "خطأ في تحميل الوسائط",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const loadStudents = async () => {
    try {
      const { data, error } = await supabase
        .from('students')
        .select(`
          id, 
          full_name, 
          student_id, 
          class_id,
          classes (name)
        `)
        .eq('tenant_id', tenant?.id)
        .eq('is_active', true);

      if (error) throw error;
      setStudents(data || []);
    } catch (error: any) {
      toast({
        title: "خطأ في تحميل الطلاب",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const loadMediaLinks = async () => {
    try {
      const { data, error } = await supabase
        .from('media_student_links')
        .select(`
          *,
          students (full_name, student_id)
        `)
        .eq('tenant_id', tenant?.id);

      if (error) throw error;
      setMediaLinks(data || []);
    } catch (error: any) {
      toast({
        title: "خطأ في تحميل روابط الوسائط",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
        toast({
          title: "نوع ملف غير مدعوم",
          description: "يجب أن يكون الملف صورة أو فيديو",
          variant: "destructive",
        });
        return;
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "حجم الملف كبير جداً",
          description: "يجب أن يكون حجم الملف أقل من 10 ميجابايت",
          variant: "destructive",
        });
        return;
      }

      setSelectedFile(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenant || !selectedFile || !user) return;

    try {
      setLoading(true);
      
      // Upload file to Supabase Storage
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${tenant.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('media')
        .upload(filePath, selectedFile);

      if (uploadError) throw uploadError;

      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('media')
        .getPublicUrl(filePath);

      const mediaData = {
        tenant_id: tenant.id,
        file_name: selectedFile.name,
        file_path: publicUrl,
        file_type: selectedFile.type.startsWith('image/') ? 'image' : 'video' as 'image' | 'video',
        file_size: selectedFile.size,
        mime_type: selectedFile.type,
        caption: formData.caption || null,
        album_date: formData.album_date,
        is_public: formData.is_public,
        tags: formData.tags,
        uploaded_by: user.id // Use actual user ID
      };

      const { data: mediaItem, error: mediaError } = await supabase
        .from('media')
        .insert(mediaData)
        .select()
        .single();

      if (mediaError) throw mediaError;

      // Link media to selected students
      if (formData.selected_students.length > 0 && mediaItem) {
        const links = formData.selected_students.map(studentId => ({
          tenant_id: tenant.id,
          media_id: mediaItem.id,
          student_id: studentId
        }));

        const { error: linkError } = await supabase
          .from('media_student_links')
          .insert(links);

        if (linkError) throw linkError;
      }

      toast({
        title: "تم رفع الملف بنجاح",
        description: `تم إضافة ${selectedFile.name} إلى الألبوم`,
      });

      loadData();
      resetForm();
      setIsAddDialogOpen(false);
    } catch (error: any) {
      toast({
        title: "خطأ في رفع الملف",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      caption: '',
      album_date: new Date().toISOString().split('T')[0],
      is_public: true,
      selected_students: [],
      tags: []
    });
    setSelectedFile(null);
  };

  const handleDelete = async (mediaItem: MediaItem) => {
    if (!confirm(`هل أنت متأكد من حذف ${mediaItem.file_name}؟`)) return;

    try {
      // Delete media links first
      await supabase
        .from('media_student_links')
        .delete()
        .eq('media_id', mediaItem.id);

      // Delete media item
      const { error } = await supabase
        .from('media')
        .delete()
        .eq('id', mediaItem.id);

      if (error) throw error;

      toast({
        title: "تم حذف الملف",
        description: `تم حذف ${mediaItem.file_name} من الألبوم`,
      });

      loadData();
    } catch (error: any) {
      toast({
        title: "خطأ في حذف الملف",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getStudentsForMedia = (mediaId: string) => {
    return mediaLinks
      .filter(link => link.media_id === mediaId)
      .map(link => link.students);
  };

  const generatePDFReport = async () => {
    if (!tenant || filteredMediaItems.length === 0) return;

    try {
      setGenerating(true);
      
      // Create a temporary div to hold our report content
      const reportDiv = document.createElement('div');
      reportDiv.className = 'pdf-report';
      reportDiv.style.cssText = `
        width: 800px;
        padding: 40px;
        font-family: 'Arial', sans-serif;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: #333;
        direction: rtl;
      `;

      // Get students for this date
      const studentsWithMedia = students.filter(student => 
        mediaLinks.some(link => 
          filteredMediaItems.some(media => media.id === link.media_id) &&
          link.student_id === student.id
        )
      );

      reportDiv.innerHTML = `
        <div style="text-align: center; margin-bottom: 40px; background: white; padding: 30px; border-radius: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.1);">
          <div style="display: flex; align-items: center; justify-content: center; gap: 15px; margin-bottom: 20px;">
            <div style="width: 60px; height: 60px; background: linear-gradient(45deg, #ff6b6b, #ffd93d); border-radius: 50%; display: flex; align-items: center; justify-content: center;">
              <span style="font-size: 30px;">🌟</span>
            </div>
            <h1 style="color: #4a5568; font-size: 36px; margin: 0; font-weight: bold;">ألبوم ${tenant.name}</h1>
          </div>
          
          <div style="background: linear-gradient(45deg, #4facfe, #00f2fe); color: white; padding: 20px; border-radius: 15px; margin: 20px 0;">
            <h2 style="font-size: 24px; margin: 0;">📅 تقرير يوم ${new Date(selectedDate).toLocaleDateString('ar-SA', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}</h2>
          </div>

          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin: 30px 0;">
            <div style="background: linear-gradient(45deg, #a8e6cf, #dcedc1); padding: 20px; border-radius: 15px; text-align: center;">
              <div style="font-size: 30px; margin-bottom: 10px;">📸</div>
              <div style="font-size: 24px; font-weight: bold; color: #2d5016;">${totalImages}</div>
              <div style="color: #2d5016;">صورة</div>
            </div>
            <div style="background: linear-gradient(45deg, #ffd3a5, #fd9853); padding: 20px; border-radius: 15px; text-align: center;">
              <div style="font-size: 30px; margin-bottom: 10px;">🎬</div>
              <div style="font-size: 24px; font-weight: bold; color: #8b4513;">${totalVideos}</div>
              <div style="color: #8b4513;">فيديو</div>
            </div>
            <div style="background: linear-gradient(45deg, #c3cfe2, #c3cfe2); padding: 20px; border-radius: 15px; text-align: center;">
              <div style="font-size: 30px; margin-bottom: 10px;">👦👧</div>
              <div style="font-size: 24px; font-weight: bold; color: #4a5568;">${studentsWithMedia.length}</div>
              <div style="color: #4a5568;">طالب/طالبة</div>
            </div>
          </div>
        </div>

        ${studentsWithMedia.map(student => {
          const studentMedia = filteredMediaItems.filter(media => 
            mediaLinks.some(link => link.media_id === media.id && link.student_id === student.id)
          );
          
          return `
            <div style="background: white; margin: 30px 0; padding: 30px; border-radius: 20px; box-shadow: 0 8px 25px rgba(0,0,0,0.1);">
              <div style="display: flex; align-items: center; gap: 20px; margin-bottom: 25px; background: linear-gradient(45deg, #667eea, #764ba2); color: white; padding: 20px; border-radius: 15px;">
                <div style="width: 80px; height: 80px; background: rgba(255,255,255,0.3); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 40px;">
                  👶
                </div>
                <div>
                  <h3 style="font-size: 28px; margin: 0; font-weight: bold;">${student.full_name}</h3>
                  <p style="font-size: 18px; margin: 5px 0; opacity: 0.9;">رقم الطالب: ${student.student_id}</p>
                  ${student.classes ? `<p style="font-size: 16px; margin: 0; opacity: 0.8;">الفصل: ${student.classes.name}</p>` : ''}
                </div>
              </div>
              
              <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
                ${studentMedia.slice(0, 8).map(media => `
                  <div style="background: linear-gradient(45deg, #ffeaa7, #fab1a0); padding: 15px; border-radius: 12px; text-align: center;">
                    <div style="font-size: 40px; margin-bottom: 10px;">${media.file_type === 'image' ? '🖼️' : '🎥'}</div>
                    <div style="font-size: 14px; font-weight: bold; color: #2d3436; margin-bottom: 5px;">${media.file_name}</div>
                    ${media.caption ? `<div style="font-size: 12px; color: #636e72; font-style: italic;">"${media.caption}"</div>` : ''}
                    <div style="font-size: 11px; color: #636e72; margin-top: 8px;">⏰ ${new Date(media.created_at).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}</div>
                  </div>
                `).join('')}
              </div>
              
              ${studentMedia.length > 8 ? `
                <div style="text-align: center; margin-top: 20px; padding: 15px; background: linear-gradient(45deg, #74b9ff, #0984e3); color: white; border-radius: 10px;">
                  <span style="font-size: 16px; font-weight: bold;">+ ${studentMedia.length - 8} ملف إضافي</span>
                </div>
              ` : ''}
            </div>
          `;
        }).join('')}

        <div style="background: white; padding: 30px; margin-top: 30px; border-radius: 20px; text-align: center; box-shadow: 0 8px 25px rgba(0,0,0,0.1);">
          <div style="font-size: 50px; margin-bottom: 15px;">🌈</div>
          <h3 style="color: #4a5568; font-size: 24px; margin-bottom: 10px;">شكراً لكم على ثقتكم</h3>
          <p style="color: #718096; font-size: 16px;">تم إنشاء هذا التقرير في ${new Date().toLocaleDateString('ar-SA')} بواسطة ${tenant.name}</p>
          <div style="margin-top: 20px; display: flex; justify-content: center; gap: 10px;">
            <span style="font-size: 30px;">⭐</span>
            <span style="font-size: 30px;">🎨</span>
            <span style="font-size: 30px;">📚</span>
            <span style="font-size: 30px;">🎪</span>
            <span style="font-size: 30px;">🎈</span>
          </div>
        </div>
      `;

      document.body.appendChild(reportDiv);

      // Generate PDF using html2canvas and jsPDF
      const canvas = await html2canvas(reportDiv, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: null
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const imgY = 0;

      pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
      
      // Clean up
      document.body.removeChild(reportDiv);
      
      // Save the PDF
      const fileName = `album-report-${tenant.name}-${selectedDate}.pdf`;
      pdf.save(fileName);

      toast({
        title: "تم إنشاء التقرير",
        description: `تم حفظ تقرير الألبوم بصيغة PDF`,
      });

    } catch (error: any) {
      toast({
        title: "خطأ في إنشاء التقرير",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return 'غير محدد';
    const sizes = ['بايت', 'كيلوبايت', 'ميجابايت', 'جيجابايت'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const filteredMediaItems = mediaItems.filter(item =>
    item.file_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.caption && item.caption.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Statistics
  const totalFiles = mediaItems.length;
  const totalImages = mediaItems.filter(item => item.file_type === 'image').length;
  const totalVideos = mediaItems.filter(item => item.file_type === 'video').length;
  const publicFiles = mediaItems.filter(item => item.is_public).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">جاري تحميل الألبوم...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Image className="h-8 w-8 text-primary" />
              الألبوم اليومي
            </h1>
            <p className="text-gray-600 mt-1">مشاركة صور وأنشطة الطلاب مع الأولياء</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Label htmlFor="date">التاريخ:</Label>
              <Input
                id="date"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-40"
              />
            </div>
            <Button 
              onClick={generatePDFReport}
              disabled={generating || filteredMediaItems.length === 0}
              className="flex items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
            >
              {generating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  جاري الإنشاء...
                </>
              ) : (
                <>
                  <FileText className="h-4 w-4" />
                  تقرير PDF
                </>
              )}
            </Button>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={resetForm} className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-teal-500 hover:from-blue-600 hover:to-teal-600">
                  <Plus className="h-4 w-4" />
                  رفع ملف جديد
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>رفع ملف جديد</DialogTitle>
                  <DialogDescription>
                    اختر صورة أو فيديو لإضافته للألبوم اليومي
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                  <div className="grid gap-4 py-4">
                    <div>
                      <Label htmlFor="file">الملف</Label>
                      <Input
                        id="file"
                        type="file"
                        accept="image/*,video/*"
                        onChange={handleFileSelect}
                        required
                      />
                      {selectedFile && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {selectedFile.name} ({formatFileSize(selectedFile.size)})
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="caption">التعليق</Label>
                      <Textarea
                        id="caption"
                        value={formData.caption}
                        onChange={(e) => setFormData(prev => ({ ...prev, caption: e.target.value }))}
                        placeholder="وصف للصورة أو الفيديو..."
                        rows={3}
                      />
                    </div>

                    <div>
                      <Label htmlFor="album_date">تاريخ الألبوم</Label>
                      <Input
                        id="album_date"
                        type="date"
                        value={formData.album_date}
                        onChange={(e) => setFormData(prev => ({ ...prev, album_date: e.target.value }))}
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="selected_students">الطلاب المعنيون</Label>
                      <Select 
                        value=""
                        onValueChange={(value) => {
                          if (value && !formData.selected_students.includes(value)) {
                            setFormData(prev => ({
                              ...prev,
                              selected_students: [...prev.selected_students, value]
                            }));
                          }
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="اختر الطلاب" />
                        </SelectTrigger>
                        <SelectContent>
                          {students
                            .filter(student => !formData.selected_students.includes(student.id))
                            .map((student) => (
                            <SelectItem key={student.id} value={student.id}>
                              {student.full_name} ({student.student_id})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      
                      {formData.selected_students.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {formData.selected_students.map(studentId => {
                            const student = students.find(s => s.id === studentId);
                            return (
                              <Badge key={studentId} variant="secondary" className="flex items-center gap-1">
                                {student?.full_name}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-4 w-4 p-0 hover:bg-transparent"
                                  onClick={() => setFormData(prev => ({
                                    ...prev,
                                    selected_students: prev.selected_students.filter(id => id !== studentId)
                                  }))}
                                >
                                  ×
                                </Button>
                              </Badge>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center space-x-reverse space-x-2">
                      <Switch
                        id="is_public"
                        checked={formData.is_public}
                        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_public: checked }))}
                      />
                      <Label htmlFor="is_public">مشاركة عامة</Label>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                      إلغاء
                    </Button>
                    <Button type="submit" disabled={!selectedFile}>
                      رفع الملف
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="bg-gradient-to-r from-blue-400 to-blue-600 text-white border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">إجمالي الملفات</CardTitle>
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <Image className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalFiles}</div>
              <div className="text-xs opacity-80">ملف في الألبوم</div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-r from-green-400 to-green-600 text-white border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">الصور</CardTitle>
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <Image className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalImages}</div>
              <div className="text-xs opacity-80">صورة تذكارية</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-purple-400 to-purple-600 text-white border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">الفيديوهات</CardTitle>
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <Image className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalVideos}</div>
              <div className="text-xs opacity-80">فيديو تفاعلي</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-orange-400 to-orange-600 text-white border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">المشاركة العامة</CardTitle>
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <Share2 className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{publicFiles}</div>
              <div className="text-xs opacity-80">ملف مشارك</div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <Card className="mb-6 bg-white/90 backdrop-blur-sm border-0 shadow-xl">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="البحث في الملفات..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-gray-50/50 border-gray-200"
              />
            </div>
          </CardContent>
        </Card>

        {/* Media Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredMediaItems.map((mediaItem) => {
            const studentsInMedia = getStudentsForMedia(mediaItem.id);
            
            return (
              <Card key={mediaItem.id} className="bg-white/90 backdrop-blur-sm hover:shadow-xl transition-all duration-300 border-0 shadow-lg hover-scale">
                <CardHeader className="pb-2">
                  <div className="aspect-video bg-gradient-to-br from-pink-100 to-blue-100 rounded-md flex items-center justify-center relative overflow-hidden">
                    {mediaItem.file_type === 'image' ? (
                      <>
                        <img 
                          src={mediaItem.file_path} 
                          alt={mediaItem.caption || mediaItem.file_name}
                          className="w-full h-full object-cover rounded-md"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            (e.currentTarget.nextSibling as HTMLElement).style.display = 'flex';
                          }}
                        />
                        <div className="w-full h-full flex items-center justify-center" style={{display: 'none'}}>
                          <div className="text-center">
                            <Image className="h-12 w-12 text-pink-400 mx-auto mb-2" />
                            <span className="text-xs text-gray-500">صورة</span>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="text-center">
                        <div className="w-16 h-16 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center mb-2 mx-auto">
                          <span className="text-2xl">🎬</span>
                        </div>
                        <span className="text-xs text-gray-600 font-medium">فيديو</span>
                      </div>
                    )}
                    <div className="absolute top-2 right-2">
                      <Badge variant={mediaItem.file_type === 'image' ? 'default' : 'secondary'} className="bg-white/80 backdrop-blur-sm">
                        {mediaItem.file_type === 'image' ? '📸' : '🎥'}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-sm truncate text-gray-800">{mediaItem.file_name}</h4>
                    </div>
                    
                    {mediaItem.caption && (
                      <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-2 rounded-lg border-l-4 border-orange-300">
                        <p className="text-xs text-gray-700 italic">💭 {mediaItem.caption}</p>
                      </div>
                    )}
                    
                    <div className="flex justify-between items-center text-xs text-muted-foreground bg-gray-50 p-2 rounded-lg">
                      <span className="flex items-center gap-1">
                        <span>📏</span>
                        {formatFileSize(mediaItem.file_size)}
                      </span>
                      <span className="flex items-center gap-1">
                        <span>⏰</span>
                        {new Date(mediaItem.created_at).toLocaleDateString('ar-SA')}
                      </span>
                    </div>
                    
                    {studentsInMedia.length > 0 && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-1 text-xs font-medium text-gray-600">
                          <Users className="h-3 w-3" />
                          الطلاب المشاركون:
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {studentsInMedia.slice(0, 2).map((student, index) => (
                            <Badge key={index} variant="outline" className="text-xs bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
                              👦 {student.full_name}
                            </Badge>
                          ))}
                          {studentsInMedia.length > 2 && (
                            <Badge variant="outline" className="text-xs bg-gradient-to-r from-green-50 to-teal-50 border-green-200">
                              +{studentsInMedia.length - 2} آخرين
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between pt-2">
                      <div className="flex items-center gap-1">
                        {mediaItem.is_public && (
                          <Badge variant="outline" className="text-xs bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
                            <Share2 className="h-3 w-3 ml-1" />
                            مشارك
                          </Badge>
                        )}
                      </div>
                      <div className="flex space-x-reverse space-x-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => navigator.clipboard.writeText(mediaItem.file_path)}
                          className="h-8 w-8 p-0 hover:bg-blue-50"
                          title="نسخ الرابط"
                        >
                          <Share2 className="h-4 w-4 text-blue-500" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(mediaItem)}
                          className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                          title="حذف"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {filteredMediaItems.length === 0 && (
          <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="w-24 h-24 bg-gradient-to-r from-pink-200 to-blue-200 rounded-full flex items-center justify-center mb-6">
                <span className="text-4xl">🎨</span>
              </div>
              <h3 className="text-xl font-semibold mb-3 text-gray-800">لا توجد ذكريات بعد!</h3>
              <p className="text-muted-foreground text-center mb-6 max-w-md">
                {searchTerm 
                  ? 'لم يتم العثور على ملفات مطابقة لبحثك 🔍' 
                  : `ابدأ في إنشاء الذكريات الجميلة لطلابك في يوم ${new Date(selectedDate).toLocaleDateString('ar-SA')} 📸✨`}
              </p>
              {!searchTerm && (
                <Button 
                  onClick={() => setIsAddDialogOpen(true)}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 shadow-lg"
                >
                  <Plus className="h-4 w-4 ml-2" />
                  🌟 إضافة أول ذكرى
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Media;