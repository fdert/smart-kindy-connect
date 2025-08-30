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
  const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0]);
  const [reportLoading, setReportLoading] = useState(false);
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

  const sendDailyReports = async () => {
    if (!tenant || !reportDate) return;

    try {
      setReportLoading(true);
      
      // Get media for the selected report date
      const { data: dayMedia, error: mediaError } = await supabase
        .from('media')
        .select('*')
        .eq('tenant_id', tenant.id)
        .eq('album_date', reportDate);

      if (mediaError) throw mediaError;

      if (!dayMedia || dayMedia.length === 0) {
        toast({
          title: "لا توجد ملفات",
          description: "لا توجد ملفات في التاريخ المحدد لإرسال التقارير",
          variant: "destructive"
        });
        return;
      }

      // Get media links for the day
      const mediaIds = dayMedia.map(m => m.id);
      const { data: dayMediaLinks, error: linksError } = await supabase
        .from('media_student_links')
        .select('*')
        .eq('tenant_id', tenant.id)
        .in('media_id', mediaIds);

      if (linksError) throw linksError;

      // Get unique student IDs who have media on this day
      const studentIds = [...new Set(dayMediaLinks?.map(link => link.student_id) || [])];

      if (studentIds.length === 0) {
        toast({
          title: "لا يوجد طلاب",
          description: "لا يوجد طلاب مرتبطين بالملفات في هذا التاريخ",
          variant: "destructive"
        });
        return;
      }

      // Group media by student for individual reports
      const mediaByStudent = studentIds.reduce((acc, studentId) => {
        const student = students.find(s => s.id === studentId);
        if (!student) return acc;

        const studentMediaIds = dayMediaLinks
          ?.filter(link => link.student_id === studentId)
          .map(link => link.media_id) || [];
        
        const studentMedia = dayMedia.filter(media => studentMediaIds.includes(media.id));
        
        if (studentMedia.length > 0) {
          acc[studentId] = {
            student,
            media: studentMedia
          };
        }
        
        return acc;
      }, {} as Record<string, { student: Student; media: MediaItem[] }>);

      let successCount = 0;
      let errorCount = 0;
      const errors: string[] = [];

      // Generate and send reports for each student
      for (const [studentId, { student, media }] of Object.entries(mediaByStudent)) {
        try {
          // Create report container
          const reportContainer = document.createElement('div');
          reportContainer.style.width = '800px';
          reportContainer.style.padding = '40px';
          reportContainer.style.fontFamily = 'Arial, sans-serif';
          reportContainer.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
          reportContainer.style.minHeight = '1000px';
          reportContainer.style.direction = 'rtl';

          // Generate beautiful report HTML
          reportContainer.innerHTML = `
            <div style="background: white; border-radius: 25px; padding: 30px; box-shadow: 0 10px 30px rgba(0,0,0,0.2); position: relative; overflow: hidden;">
              <div style="position: absolute; top: -50px; right: -50px; width: 200px; height: 200px; background: linear-gradient(45deg, #ff6b6b, #ffd93d); border-radius: 50%; opacity: 0.1;"></div>
              <div style="position: absolute; bottom: -30px; left: -30px; width: 150px; height: 150px; background: linear-gradient(45deg, #4ecdc4, #96ceb4); border-radius: 50%; opacity: 0.1;"></div>
              
              <div style="text-align: center; margin-bottom: 30px; position: relative; z-index: 2;">
                <h1 style="color: #2c3e50; font-size: 32px; margin: 0; text-shadow: 2px 2px 4px rgba(0,0,0,0.1);">📸 ألبوم ${student.full_name} 📸</h1>
                <div style="background: linear-gradient(90deg, #ff6b6b, #ffd93d, #4ecdc4, #96ceb4, #a8edea); height: 4px; margin: 15px 0; border-radius: 2px;"></div>
                <p style="color: #34495e; font-size: 18px; margin: 10px 0;">📅 ${new Date(reportDate).toLocaleDateString('ar-SA')}</p>
              </div>

              <div style="background: linear-gradient(135deg, #ffeaa7, #fab1a0); padding: 20px; border-radius: 15px; margin: 20px 0; border: 3px dashed #e17055;">
                <h2 style="color: #d63031; margin: 0 0 15px 0; font-size: 20px;">🌟 معلومات الطالب</h2>
                <div style="display: flex; justify-content: space-between; flex-wrap: wrap;">
                  <p style="color: #2d3436; margin: 5px 0; font-size: 16px;"><strong>👶 اسم الطالب:</strong> ${student.full_name}</p>
                  <p style="color: #2d3436; margin: 5px 0; font-size: 16px;"><strong>🏫 الفصل:</strong> ${student.classes?.name || 'غير محدد'}</p>
                  <p style="color: #2d3436; margin: 5px 0; font-size: 16px;"><strong>🏢 الروضة:</strong> ${tenant.name}</p>
                  <p style="color: #2d3436; margin: 5px 0; font-size: 16px;"><strong>📊 إجمالي الملفات:</strong> ${media.length}</p>
                </div>
              </div>

              <div style="background: linear-gradient(135deg, #a8edea, #fed6e3); padding: 20px; border-radius: 15px; margin: 20px 0; border: 3px dashed #fd79a8;">
                <h2 style="color: #e84393; margin: 0 0 15px 0; font-size: 20px;">📊 إحصائيات الألبوم</h2>
                <div style="display: flex; justify-content: space-around; text-align: center;">
                  <div style="background: white; padding: 15px; border-radius: 10px; box-shadow: 0 4px 8px rgba(0,0,0,0.1);">
                    <div style="font-size: 24px; color: #00b894;">📷</div>
                    <div style="font-size: 20px; font-weight: bold; color: #2d3436;">${media.filter(m => m.file_type === 'image').length}</div>
                    <div style="color: #636e72;">صور</div>
                  </div>
                  <div style="background: white; padding: 15px; border-radius: 10px; box-shadow: 0 4px 8px rgba(0,0,0,0.1);">
                    <div style="font-size: 24px; color: #e17055;">🎥</div>
                    <div style="font-size: 20px; font-weight: bold; color: #2d3436;">${media.filter(m => m.file_type === 'video').length}</div>
                    <div style="color: #636e72;">فيديوهات</div>
                  </div>
                  <div style="background: white; padding: 15px; border-radius: 10px; box-shadow: 0 4px 8px rgba(0,0,0,0.1);">
                    <div style="font-size: 24px; color: #fdcb6e;">🌟</div>
                    <div style="font-size: 20px; font-weight: bold; color: #2d3436;">${media.filter(m => m.is_public).length}</div>
                    <div style="color: #636e72;">عامة</div>
                  </div>
                </div>
              </div>

              <div style="background: linear-gradient(135deg, #d1f2eb, #fef9e7); padding: 20px; border-radius: 15px; margin: 20px 0; border: 3px dashed #f39c12;">
                <h2 style="color: #d68910; margin: 0 0 15px 0; font-size: 20px;">🎨 معرض الصور والفيديوهات</h2>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px; margin-top: 20px;">
                  ${media.slice(0, 12).map(mediaItem => `
                    <div style="background: white; border-radius: 10px; padding: 10px; box-shadow: 0 4px 8px rgba(0,0,0,0.1); text-align: center;">
                      <div style="background: linear-gradient(45deg, #ff9a9e, #fecfef); height: 100px; border-radius: 8px; display: flex; align-items: center; justify-content: center; margin-bottom: 8px;">
                        <div style="font-size: 30px;">${mediaItem.file_type === 'image' ? '📷' : '🎥'}</div>
                      </div>
                      <p style="margin: 0; font-size: 12px; color: #636e72; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${mediaItem.file_name}</p>
                      ${mediaItem.caption ? `<p style="margin: 5px 0 0 0; font-size: 11px; color: #2d3436; font-style: italic;">${mediaItem.caption}</p>` : ''}
                    </div>
                  `).join('')}
                </div>
                ${media.length > 12 ? `<p style="text-align: center; color: #636e72; font-style: italic; margin-top: 15px;">و ${media.length - 12} ملف إضافي...</p>` : ''}
              </div>

              <div style="background: linear-gradient(135deg, #ff9a9e, #fecfef); padding: 20px; border-radius: 15px; margin: 20px 0; text-align: center; border: 3px dashed #e84393;">
                <h3 style="color: #d63031; margin: 0; font-size: 18px;">💖 شكراً لاختياركم روضتنا 💖</h3>
                <p style="color: #2d3436; margin: 10px 0; font-size: 14px;">نتمنى لطفلكم يوماً سعيداً مليئاً بالتعلم واللعب!</p>
                <div style="margin-top: 15px;">
                  <span style="font-size: 20px;">🌈</span>
                  <span style="font-size: 20px;">⭐</span>
                  <span style="font-size: 20px;">🎈</span>
                  <span style="font-size: 20px;">🎨</span>
                  <span style="font-size: 20px;">🎪</span>
                </div>
              </div>
            </div>
          `;

          document.body.appendChild(reportContainer);

          // Generate PDF
          const canvas = await html2canvas(reportContainer, {
            scale: 2,
            backgroundColor: 'transparent',
            logging: false,
            useCORS: true
          });

          const imgData = canvas.toDataURL('image/png');
          const pdf = new jsPDF('p', 'mm', 'a4');
          const imgWidth = 210;
          const pageHeight = 295;
          const imgHeight = (canvas.height * imgWidth) / canvas.width;
          let heightLeft = imgHeight;

          let position = 0;
          pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
          heightLeft -= pageHeight;

          while (heightLeft >= 0) {
            position = heightLeft - imgHeight;
            pdf.addPage();
            pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;
          }

          // Upload PDF to Supabase Storage
          const fileName = `album-report-${student.full_name.replace(/\s+/g, '-')}-${reportDate}.pdf`;
          const pdfBlob = pdf.output('blob');
          
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('media')
            .upload(`reports/${fileName}`, pdfBlob, {
              contentType: 'application/pdf',
              upsert: true
            });

          if (uploadError) {
            console.error('Error uploading PDF:', uploadError);
            errors.push(`فشل رفع تقرير ${student.full_name}: ${uploadError.message}`);
            errorCount++;
          } else {
            // Get public URL
            const { data: { publicUrl } } = supabase.storage
              .from('media')
              .getPublicUrl(`reports/${fileName}`);

            // Send report to guardians via WhatsApp
            const { data: sendResult, error: sendError } = await supabase.functions.invoke(
              'send-album-report',
              {
                body: {
                  studentId: student.id,
                  albumDate: reportDate,
                  pdfUrl: publicUrl
                }
              }
            );

            if (sendError) {
              console.error('Error sending album report:', sendError);
              errors.push(`فشل إرسال تقرير ${student.full_name}: ${sendError.message}`);
              errorCount++;
            } else {
              console.log('Album report sent successfully:', sendResult);
              successCount++;
            }
          }

          document.body.removeChild(reportContainer);
        } catch (error: any) {
          console.error(`Error processing report for ${student.full_name}:`, error);
          errors.push(`خطأ في معالجة تقرير ${student.full_name}: ${error.message}`);
          errorCount++;
        }
      }

      // Show results
      if (successCount > 0 && errorCount === 0) {
        toast({
          title: "تم إرسال التقارير بنجاح",
          description: `تم إنشاء وإرسال ${successCount} تقرير للطلاب عبر الواتساب`,
        });
      } else if (successCount > 0 && errorCount > 0) {
        toast({
          title: "تم إرسال التقارير جزئياً",
          description: `تم إرسال ${successCount} تقرير بنجاح، فشل ${errorCount} تقرير`,
          variant: "destructive"
        });
      } else {
        toast({
          title: "فشل إرسال التقارير",
          description: errors.slice(0, 3).join('، '),
          variant: "destructive"
        });
      }

    } catch (error: any) {
      console.error('Error sending daily reports:', error);
      toast({
        title: "خطأ في إرسال التقارير",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setReportLoading(false);
    }
  };

  const generatePDFReport = async () => {
    if (!tenant || filteredMediaItems.length === 0) return;

    try {
      setGenerating(true);
      
      // Group media by student
      const mediaByStudent = students.reduce((acc, student) => {
        const studentMedia = filteredMediaItems.filter(media => 
          mediaLinks.some(link => link.media_id === media.id && link.student_id === student.id)
        );
        
        if (studentMedia.length > 0) {
          acc[student.id] = {
            student,
            media: studentMedia
          };
        }
        
        return acc;
      }, {} as Record<string, { student: Student; media: MediaItem[] }>);

      // Generate reports for each student
      for (const [studentId, { student, media }] of Object.entries(mediaByStudent)) {
        // Create report container
        const reportContainer = document.createElement('div');
        reportContainer.style.width = '800px';
        reportContainer.style.padding = '40px';
        reportContainer.style.fontFamily = 'Arial, sans-serif';
        reportContainer.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
        reportContainer.style.minHeight = '1000px';
        reportContainer.style.direction = 'rtl';

        // Add fun border and effects
        reportContainer.innerHTML = `
          <div style="background: white; border-radius: 25px; padding: 30px; box-shadow: 0 10px 30px rgba(0,0,0,0.2); position: relative; overflow: hidden;">
            <div style="position: absolute; top: -50px; right: -50px; width: 200px; height: 200px; background: linear-gradient(45deg, #ff6b6b, #ffd93d); border-radius: 50%; opacity: 0.1;"></div>
            <div style="position: absolute; bottom: -30px; left: -30px; width: 150px; height: 150px; background: linear-gradient(45deg, #4ecdc4, #96ceb4); border-radius: 50%; opacity: 0.1;"></div>
            
            <div style="text-align: center; margin-bottom: 30px; position: relative; z-index: 2;">
              <h1 style="color: #2c3e50; font-size: 32px; margin: 0; text-shadow: 2px 2px 4px rgba(0,0,0,0.1);">📸 ألبوم ${student.full_name} 📸</h1>
              <div style="background: linear-gradient(90deg, #ff6b6b, #ffd93d, #4ecdc4, #96ceb4, #a8edea); height: 4px; margin: 15px 0; border-radius: 2px;"></div>
              <p style="color: #34495e; font-size: 18px; margin: 10px 0;">📅 ${new Date(selectedDate).toLocaleDateString('ar-SA')}</p>
            </div>

            <div style="background: linear-gradient(135deg, #ffeaa7, #fab1a0); padding: 20px; border-radius: 15px; margin: 20px 0; border: 3px dashed #e17055;">
              <h2 style="color: #d63031; margin: 0 0 15px 0; font-size: 20px;">🌟 معلومات الطالب</h2>
              <div style="display: flex; justify-content: space-between; flex-wrap: wrap;">
                <p style="color: #2d3436; margin: 5px 0; font-size: 16px;"><strong>👶 اسم الطالب:</strong> ${student.full_name}</p>
                <p style="color: #2d3436; margin: 5px 0; font-size: 16px;"><strong>🏫 الفصل:</strong> ${student.classes?.name || 'غير محدد'}</p>
                <p style="color: #2d3436; margin: 5px 0; font-size: 16px;"><strong>🏢 الروضة:</strong> ${tenant.name}</p>
                <p style="color: #2d3436; margin: 5px 0; font-size: 16px;"><strong>📊 إجمالي الملفات:</strong> ${media.length}</p>
              </div>
            </div>

            <div style="background: linear-gradient(135deg, #a8edea, #fed6e3); padding: 20px; border-radius: 15px; margin: 20px 0; border: 3px dashed #fd79a8;">
              <h2 style="color: #e84393; margin: 0 0 15px 0; font-size: 20px;">📊 إحصائيات الألبوم</h2>
              <div style="display: flex; justify-content: space-around; text-align: center;">
                <div style="background: white; padding: 15px; border-radius: 10px; box-shadow: 0 4px 8px rgba(0,0,0,0.1);">
                  <div style="font-size: 24px; color: #00b894;">📷</div>
                  <div style="font-size: 20px; font-weight: bold; color: #2d3436;">${media.filter(m => m.file_type === 'image').length}</div>
                  <div style="color: #636e72;">صور</div>
                </div>
                <div style="background: white; padding: 15px; border-radius: 10px; box-shadow: 0 4px 8px rgba(0,0,0,0.1);">
                  <div style="font-size: 24px; color: #e17055;">🎥</div>
                  <div style="font-size: 20px; font-weight: bold; color: #2d3436;">${media.filter(m => m.file_type === 'video').length}</div>
                  <div style="color: #636e72;">فيديوهات</div>
                </div>
                <div style="background: white; padding: 15px; border-radius: 10px; box-shadow: 0 4px 8px rgba(0,0,0,0.1);">
                  <div style="font-size: 24px; color: #fdcb6e;">🌟</div>
                  <div style="font-size: 20px; font-weight: bold; color: #2d3436;">${media.filter(m => m.is_public).length}</div>
                  <div style="color: #636e72;">عامة</div>
                </div>
              </div>
            </div>

            <div style="background: linear-gradient(135deg, #d1f2eb, #fef9e7); padding: 20px; border-radius: 15px; margin: 20px 0; border: 3px dashed #f39c12;">
              <h2 style="color: #d68910; margin: 0 0 15px 0; font-size: 20px;">🎨 معرض الصور والفيديوهات</h2>
              <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px; margin-top: 20px;">
                ${media.slice(0, 12).map(mediaItem => `
                  <div style="background: white; border-radius: 10px; padding: 10px; box-shadow: 0 4px 8px rgba(0,0,0,0.1); text-align: center;">
                    <div style="background: linear-gradient(45deg, #ff9a9e, #fecfef); height: 100px; border-radius: 8px; display: flex; align-items: center; justify-content: center; margin-bottom: 8px;">
                      <div style="font-size: 30px;">${mediaItem.file_type === 'image' ? '📷' : '🎥'}</div>
                    </div>
                    <p style="margin: 0; font-size: 12px; color: #636e72; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${mediaItem.file_name}</p>
                    ${mediaItem.caption ? `<p style="margin: 5px 0 0 0; font-size: 11px; color: #2d3436; font-style: italic;">${mediaItem.caption}</p>` : ''}
                  </div>
                `).join('')}
              </div>
              ${media.length > 12 ? `<p style="text-align: center; color: #636e72; font-style: italic; margin-top: 15px;">و ${media.length - 12} ملف إضافي...</p>` : ''}
            </div>

            <div style="background: linear-gradient(135deg, #ff9a9e, #fecfef); padding: 20px; border-radius: 15px; margin: 20px 0; text-align: center; border: 3px dashed #e84393;">
              <h3 style="color: #d63031; margin: 0; font-size: 18px;">💖 شكراً لاختياركم روضتنا 💖</h3>
              <p style="color: #2d3436; margin: 10px 0; font-size: 14px;">نتمنى لطفلكم يوماً سعيداً مليئاً بالتعلم واللعب!</p>
              <div style="margin-top: 15px;">
                <span style="font-size: 20px;">🌈</span>
                <span style="font-size: 20px;">⭐</span>
                <span style="font-size: 20px;">🎈</span>
                <span style="font-size: 20px;">🎨</span>
                <span style="font-size: 20px;">🎪</span>
              </div>
            </div>
          </div>
        `;

        document.body.appendChild(reportContainer);

        // Generate PDF
        const canvas = await html2canvas(reportContainer, {
          scale: 2,
          backgroundColor: 'transparent',
          logging: false,
          useCORS: true
        });

        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const imgWidth = 210;
        const pageHeight = 295;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        let heightLeft = imgHeight;

        let position = 0;
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;

        while (heightLeft >= 0) {
          position = heightLeft - imgHeight;
          pdf.addPage();
          pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
          heightLeft -= pageHeight;
        }

        // Upload PDF to Supabase Storage
        const fileName = `album-report-${student.full_name.replace(/\s+/g, '-')}-${selectedDate}.pdf`;
        const pdfBlob = pdf.output('blob');
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('media')
          .upload(`reports/${fileName}`, pdfBlob, {
            contentType: 'application/pdf',
            upsert: true
          });

        if (uploadError) {
          console.error('Error uploading PDF:', uploadError);
        } else {
          // Get public URL
          const { data: { publicUrl } } = supabase.storage
            .from('media')
            .getPublicUrl(`reports/${fileName}`);

          // Send report to guardians via WhatsApp
          const { data: sendResult, error: sendError } = await supabase.functions.invoke(
            'send-album-report',
            {
              body: {
                studentId: student.id,
                albumDate: selectedDate,
                pdfUrl: publicUrl
              }
            }
          );

          if (sendError) {
            console.error('Error sending album report:', sendError);
          } else {
            console.log('Album report sent successfully:', sendResult);
          }
        }

        document.body.removeChild(reportContainer);
      }

      toast({
        title: "تم إنشاء التقارير",
        description: `تم إنشاء وإرسال ${Object.keys(mediaByStudent).length} تقرير للطلاب عبر الواتساب`,
      });
    } catch (error: any) {
      toast({
        title: "خطأ في إنشاء التقرير",
        description: error.message,
        variant: "destructive"
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