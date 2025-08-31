import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Upload, X } from 'lucide-react';

interface ImageUploadProps {
  currentImage?: string | null;
  onImageChange: (imageUrl: string | null) => void;
  studentName?: string;
}

export const ImageUpload = ({ currentImage, onImageChange, studentName }: ImageUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const uploadImage = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      
      if (!event.target.files || event.target.files.length === 0) {
        return;
      }

      const file = event.target.files[0];
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: "خطأ",
          description: "يرجى اختيار ملف صورة صحيح",
          variant: "destructive",
        });
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "خطأ",
          description: "حجم الصورة يجب أن يكون أقل من 5 ميجابايت",
          variant: "destructive",
        });
        return;
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `students/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('media')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      const { data } = supabase.storage
        .from('media')
        .getPublicUrl(filePath);

      onImageChange(data.publicUrl);
      
      toast({
        title: "تم بنجاح",
        description: "تم رفع الصورة بنجاح",
      });
    } catch (error: any) {
      toast({
        title: "خطأ في رفع الصورة",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const removeImage = () => {
    onImageChange(null);
  };

  return (
    <div className="space-y-4">
      <Label>صورة الطالب (اختيارية)</Label>
      
      <div className="flex items-center gap-4">
        <Avatar className="h-20 w-20">
          <AvatarImage src={currentImage || undefined} />
          <AvatarFallback className="text-lg">
            {studentName ? studentName.split(' ').map(n => n[0]).join('').toUpperCase() : '👤'}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Input
              type="file"
              accept="image/*"
              onChange={uploadImage}
              disabled={uploading}
              className="w-auto"
            />
            <Button
              type="button"
              variant="outline"
              disabled={uploading}
              className="flex items-center gap-2"
            >
              <Upload className="h-4 w-4" />
              {uploading ? 'جاري الرفع...' : 'رفع صورة'}
            </Button>
          </div>
          
          {currentImage && (
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={removeImage}
              className="w-fit flex items-center gap-2"
            >
              <X className="h-4 w-4" />
              حذف الصورة
            </Button>
          )}
        </div>
      </div>
      
      <p className="text-sm text-muted-foreground">
        الحد الأقصى لحجم الصورة: 5 ميجابايت. الصيغ المدعومة: JPG, PNG, GIF
      </p>
    </div>
  );
};