import { Card, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Download, Share2 } from 'lucide-react';

interface StudentReportHeaderProps {
  student: {
    full_name: string;
    student_id: string;
    photo_url: string | null;
    date_of_birth: string;
    gender: string;
    class_name?: string;
    tenant_name?: string;
  };
  calculateAge: (birthDate: string) => number;
}

export function StudentReportHeader({ student, calculateAge }: StudentReportHeaderProps) {
  return (
    <Card className="mb-8 bg-white/90 backdrop-blur-sm border-0 shadow-xl">
      <CardHeader className="bg-gradient-to-r from-primary to-primary/80 text-white rounded-t-lg">
        <div className="flex items-center gap-6">
          <Avatar className="h-24 w-24 border-4 border-white">
            <AvatarImage src={student.photo_url || undefined} />
            <AvatarFallback className="text-2xl bg-white text-primary">
              {student.full_name.split(' ').map(n => n[0]).join('').toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h1 className="text-3xl font-bold mb-2">{student.full_name}</h1>
            <div className="flex flex-wrap gap-4 text-sm opacity-90">
              <span>رقم الطالب: {student.student_id}</span>
              <span>العمر: {calculateAge(student.date_of_birth)} سنوات</span>
              {student.class_name && <span>الفصل: {student.class_name}</span>}
              <span>الجنس: {student.gender === 'male' ? 'ذكر' : 'أنثى'}</span>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm">
              <Download className="h-4 w-4 mr-2" />
              تحميل PDF
            </Button>
            <Button variant="secondary" size="sm">
              <Share2 className="h-4 w-4 mr-2" />
              مشاركة
            </Button>
          </div>
        </div>
      </CardHeader>
    </Card>
  );
}