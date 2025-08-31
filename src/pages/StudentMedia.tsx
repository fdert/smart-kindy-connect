import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useTenant } from '@/hooks/useTenant';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { Camera, Image, ArrowLeft, Download, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface MediaData {
  id: string;
  file_name: string;
  file_path: string;
  caption: string | null;
  album_date: string;
  file_type: string;
  mime_type: string | null;
}

export default function StudentMedia() {
  const { studentId } = useParams();
  const [searchParams] = useSearchParams();
  const [media, setMedia] = useState<MediaData[]>([]);
  const [studentInfo, setStudentInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedMedia, setSelectedMedia] = useState<MediaData | null>(null);
  const { tenant } = useTenant();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Get date filters from URL params
  const fromParam = searchParams.get('from');
  const toParam = searchParams.get('to');
  const dateRange = {
    from: fromParam ? new Date(fromParam) : new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    to: toParam ? new Date(toParam) : new Date()
  };

  useEffect(() => {
    if (tenant && studentId) {
      loadData();
    }
  }, [tenant, studentId]);

  const loadData = async () => {
    if (!tenant || !studentId) return;

    setLoading(true);
    try {
      // Load student info
      const { data: studentData, error: studentError } = await supabase
        .from('students')
        .select('full_name, student_id, photo_url, classes(name)')
        .eq('id', studentId)
        .eq('tenant_id', tenant.id)
        .maybeSingle();

      if (studentError) throw studentError;
      setStudentInfo(studentData);

      // Load media through student links
      const { data: mediaLinks, error: mediaError } = await supabase
        .from('media_student_links')
        .select(`
          media (
            id,
            file_name,
            file_path,
            caption,
            album_date,
            file_type,
            mime_type
          )
        `)
        .eq('student_id', studentId)
        .eq('tenant_id', tenant.id);

      if (mediaError) throw mediaError;

      // Filter media by date range and flatten the structure
      const mediaFiles = mediaLinks
        ?.map(link => link.media)
        .filter(Boolean)
        .filter(mediaItem => {
          const albumDate = new Date(mediaItem.album_date);
          return albumDate >= dateRange.from && albumDate <= dateRange.to;
        })
        .sort((a, b) => new Date(b.album_date).getTime() - new Date(a.album_date).getTime()) || [];

      setMedia(mediaFiles);

    } catch (error: any) {
      toast({
        title: "خطأ في تحميل البيانات",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const downloadImage = async (mediaItem: MediaData) => {
    try {
      const response = await fetch(mediaItem.file_path);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = mediaItem.file_name;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "تم التحميل",
        description: "تم تحميل الصورة بنجاح",
      });
    } catch (error) {
      toast({
        title: "خطأ في التحميل",
        description: "فشل في تحميل الصورة",
        variant: "destructive",
      });
    }
  };

  const groupedMedia = media.reduce((acc, item) => {
    const monthYear = format(new Date(item.album_date), 'MMMM yyyy', { locale: ar });
    if (!acc[monthYear]) {
      acc[monthYear] = [];
    }
    acc[monthYear].push(item);
    return acc;
  }, {} as Record<string, MediaData[]>);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">جاري تحميل البيانات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="outline"
            onClick={() => navigate(`/student-report/${studentId}`)}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            العودة للتقرير
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              ألبوم صور الطالب: {studentInfo?.full_name}
            </h1>
            <p className="text-gray-600">
              الفترة: {format(dateRange.from, 'dd MMM yyyy', { locale: ar })} - {format(dateRange.to, 'dd MMM yyyy', { locale: ar })}
            </p>
          </div>
        </div>

        {/* Stats Card */}
        <Card className="bg-gradient-to-br from-indigo-500 to-indigo-600 text-white mb-8">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">إجمالي الصور</p>
                <p className="text-3xl font-bold">{media.length}</p>
              </div>
              <Camera className="h-8 w-8 opacity-80" />
            </div>
          </CardContent>
        </Card>

        {/* Media Gallery by Month */}
        {media.length === 0 ? (
          <Card className="bg-white/90 backdrop-blur-sm">
            <CardContent className="p-12 text-center">
              <Image className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">لا توجد صور</h3>
              <p className="text-gray-500">لم يتم تحميل أي صور للطالب في هذه الفترة</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {Object.entries(groupedMedia).map(([monthYear, monthMedia]) => (
              <div key={monthYear}>
                <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-3">
                  <Camera className="h-6 w-6" />
                  {monthYear}
                  <span className="text-sm font-normal text-gray-600">({monthMedia.length} صور)</span>
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {monthMedia.map((mediaItem) => (
                    <Card key={mediaItem.id} className="bg-white/90 backdrop-blur-sm overflow-hidden group hover:shadow-lg transition-shadow">
                      <div className="relative aspect-square">
                        <img
                          src={mediaItem.file_path}
                          alt={mediaItem.caption || mediaItem.file_name}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => setSelectedMedia(mediaItem)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-4xl max-h-[90vh] p-0">
                              <div className="relative">
                                <img
                                  src={selectedMedia?.file_path}
                                  alt={selectedMedia?.caption || selectedMedia?.file_name}
                                  className="w-full h-auto max-h-[80vh] object-contain"
                                />
                                {selectedMedia?.caption && (
                                  <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white p-4">
                                    <p>{selectedMedia.caption}</p>
                                  </div>
                                )}
                              </div>
                            </DialogContent>
                          </Dialog>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => downloadImage(mediaItem)}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <CardContent className="p-3">
                        <div className="space-y-2">
                          {mediaItem.caption && (
                            <p className="text-sm text-gray-700 line-clamp-2">{mediaItem.caption}</p>
                          )}
                          <p className="text-xs text-gray-500">
                            {format(new Date(mediaItem.album_date), 'dd MMM yyyy', { locale: ar })}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}