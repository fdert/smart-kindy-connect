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
import { useToast } from '@/hooks/use-toast';
import { Image, Plus, Search, Calendar, Users, Share2, Download, Eye, Trash2, Upload } from 'lucide-react';

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
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { tenant } = useTenant();
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
        .select('id, full_name, student_id')
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
    if (!tenant || !selectedFile) return;

    try {
      // In a real implementation, you would upload the file to Supabase Storage first
      // For now, we'll simulate this with a placeholder path
      const fileName = `${Date.now()}_${selectedFile.name}`;
      const filePath = `media/${tenant.id}/${fileName}`;

      const mediaData = {
        tenant_id: tenant.id,
        file_name: selectedFile.name,
        file_path: filePath,
        file_type: selectedFile.type.startsWith('image/') ? 'image' : 'video' as 'image' | 'video',
        file_size: selectedFile.size,
        mime_type: selectedFile.type,
        caption: formData.caption || null,
        album_date: formData.album_date,
        is_public: formData.is_public,
        tags: formData.tags,
        uploaded_by: tenant.id // Should be actual user ID
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

  const generateShareLink = (mediaItem: MediaItem) => {
    // In a real implementation, this would generate a secure, temporary link
    const shareUrl = `${window.location.origin}/shared/${mediaItem.id}`;
    navigator.clipboard.writeText(shareUrl);
    
    toast({
      title: "تم نسخ الرابط",
      description: "تم نسخ رابط المشاركة إلى الحافظة",
    });
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
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={resetForm} className="flex items-center gap-2">
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
          <Card className="bg-white/80 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">إجمالي الملفات</CardTitle>
              <Image className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalFiles}</div>
            </CardContent>
          </Card>
          
          <Card className="bg-white/80 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">الصور</CardTitle>
              <Image className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalImages}</div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">الفيديوهات</CardTitle>
              <Image className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalVideos}</div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">المشاركة العامة</CardTitle>
              <Share2 className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{publicFiles}</div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <Card className="mb-6 bg-white/80 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="البحث في الملفات..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Media Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredMediaItems.map((mediaItem) => {
            const studentsInMedia = getStudentsForMedia(mediaItem.id);
            
            return (
              <Card key={mediaItem.id} className="bg-white/80 backdrop-blur-sm hover:shadow-lg transition-all">
                <CardHeader className="pb-2">
                  <div className="aspect-video bg-gray-100 rounded-md flex items-center justify-center">
                    {mediaItem.file_type === 'image' ? (
                      <Image className="h-12 w-12 text-gray-400" />
                    ) : (
                      <div className="text-center">
                        <Image className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                        <span className="text-xs text-gray-500">فيديو</span>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-sm truncate">{mediaItem.file_name}</h4>
                      <Badge variant={mediaItem.file_type === 'image' ? 'default' : 'secondary'}>
                        {mediaItem.file_type === 'image' ? 'صورة' : 'فيديو'}
                      </Badge>
                    </div>
                    
                    {mediaItem.caption && (
                      <p className="text-xs text-gray-600 line-clamp-2">{mediaItem.caption}</p>
                    )}
                    
                    <div className="flex justify-between items-center text-xs text-muted-foreground">
                      <span>الحجم: {formatFileSize(mediaItem.file_size)}</span>
                      <span>{new Date(mediaItem.created_at).toLocaleDateString('ar-SA')}</span>
                    </div>
                    
                    {studentsInMedia.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {studentsInMedia.slice(0, 2).map((student, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {student.full_name}
                          </Badge>
                        ))}
                        {studentsInMedia.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{studentsInMedia.length - 2}
                          </Badge>
                        )}
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between pt-2">
                      <div className="flex items-center gap-1">
                        {mediaItem.is_public && (
                          <Badge variant="outline" className="text-xs">
                            <Share2 className="h-3 w-3 ml-1" />
                            عام
                          </Badge>
                        )}
                      </div>
                      <div className="flex space-x-reverse space-x-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => generateShareLink(mediaItem)}
                          className="h-8 w-8 p-0"
                        >
                          <Share2 className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(mediaItem)}
                          className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
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
          <Card className="bg-white/80 backdrop-blur-sm">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Image className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">لا توجد ملفات</h3>
              <p className="text-muted-foreground text-center mb-4">
                {searchTerm 
                  ? 'لم يتم العثور على ملفات مطابقة لبحثك' 
                  : `لا توجد ملفات في ألبوم يوم ${new Date(selectedDate).toLocaleDateString('ar-SA')}`}
              </p>
              {!searchTerm && (
                <Button onClick={() => setIsAddDialogOpen(true)}>
                  <Plus className="h-4 w-4 ml-2" />
                  رفع أول ملف
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