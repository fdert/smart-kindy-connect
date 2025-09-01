import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/hooks/useTenant';
import { useToast } from '@/hooks/use-toast';
import { Upload, FileSpreadsheet, Download, AlertTriangle } from 'lucide-react';
import * as XLSX from 'xlsx';

interface StudentData {
  student_id: string;
  full_name: string;
  date_of_birth: string;
  gender: string;
  emergency_name?: string;
  emergency_phone?: string;
  emergency_relationship?: string;
  allergies?: string;
  medications?: string;
  special_needs?: string;
  class_name?: string;
}

interface ExcelImportProps {
  onImportComplete?: () => void;
}

const ExcelImport = ({ onImportComplete }: ExcelImportProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [previewData, setPreviewData] = useState<StudentData[]>([]);
  const { tenant } = useTenant();
  const { toast } = useToast();

  const downloadTemplate = () => {
    const templateData = [
      {
        'رقم الطالب': 'STD001',
        'الاسم الكامل': 'أحمد محمد',
        'تاريخ الميلاد': '2020-01-15',
        'الجنس': 'male',
        'اسم جهة الاتصال': 'فاطمة أحمد',
        'رقم الهاتف': '0501234567',
        'صلة القرابة': 'الأم',
        'الحساسية': 'لا يوجد',
        'الأدوية': 'لا يوجد',
        'احتياجات خاصة': 'لا يوجد',
        'الفصل': 'الفصل الأول'
      }
    ];

    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'قالب الطلاب');
    XLSX.writeFile(wb, 'قالب_استيراد_الطلاب.xlsx');
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      parseExcelFile(selectedFile);
    }
  };

  const parseExcelFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(worksheet);

        const parsedData: StudentData[] = json.map((row: any) => ({
          student_id: row['رقم الطالب'] || '',
          full_name: row['الاسم الكامل'] || '',
          date_of_birth: row['تاريخ الميلاد'] || '',
          gender: row['الجنس'] === 'أنثى' ? 'female' : 'male',
          emergency_name: row['اسم جهة الاتصال'] || '',
          emergency_phone: row['رقم الهاتف'] || '',
          emergency_relationship: row['صلة القرابة'] || '',
          allergies: row['الحساسية'] || '',
          medications: row['الأدوية'] || '',
          special_needs: row['احتياجات خاصة'] || '',
          class_name: row['الفصل'] || ''
        }));

        setPreviewData(parsedData);
        
        toast({
          title: "تم تحليل الملف بنجاح",
          description: `تم العثور على ${parsedData.length} طالب`,
        });
      } catch (error) {
        toast({
          title: "خطأ في قراءة الملف",
          description: "تأكد من أن الملف بصيغة Excel صحيحة",
          variant: "destructive",
        });
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleImport = async () => {
    if (!tenant || previewData.length === 0) return;

    try {
      setLoading(true);

      // Get existing classes
      const { data: classesData, error: classesError } = await supabase
        .from('classes')
        .select('id, name')
        .eq('tenant_id', tenant.id);

      if (classesError) throw classesError;

      const classMap = new Map(classesData?.map(c => [c.name, c.id]) || []);

      // Import students
      for (const student of previewData) {
        if (!student.full_name || !student.student_id) continue;

        const studentData = {
          tenant_id: tenant.id,
          student_id: student.student_id,
          full_name: student.full_name,
          date_of_birth: student.date_of_birth,
          gender: student.gender,
          class_id: student.class_name ? classMap.get(student.class_name) || null : null,
          enrollment_date: new Date().toISOString().split('T')[0],
          is_active: true,
          emergency_contact: {
            name: student.emergency_name || '',
            phone: student.emergency_phone || '',
            relationship: student.emergency_relationship || ''
          },
          medical_info: {
            allergies: student.allergies || '',
            medications: student.medications || '',
            special_needs: student.special_needs || ''
          }
        };

        const { error } = await supabase
          .from('students')
          .insert(studentData);

        if (error) {
          console.error('Error inserting student:', student.full_name, error);
          continue;
        }
      }

      toast({
        title: "تم استيراد الطلاب بنجاح",
        description: `تم إضافة ${previewData.length} طالب إلى النظام`,
      });

      setIsDialogOpen(false);
      setFile(null);
      setPreviewData([]);
      onImportComplete?.();
    } catch (error: any) {
      toast({
        title: "خطأ في الاستيراد",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <Upload className="h-4 w-4" />
          استيراد من اكسل
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            استيراد الطلاب من ملف Excel
          </DialogTitle>
          <DialogDescription>
            قم برفع ملف Excel يحتوي على بيانات الطلاب
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Download Template */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">تحميل القالب</CardTitle>
              <CardDescription>
                احصل على قالب Excel جاهز لإدخال بيانات الطلاب
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={downloadTemplate} variant="outline">
                <Download className="h-4 w-4 mr-2" />
                تحميل قالب Excel
              </Button>
            </CardContent>
          </Card>

          {/* File Upload */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">رفع ملف Excel</CardTitle>
              <CardDescription>
                اختر ملف Excel يحتوي على بيانات الطلاب
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div>
                <Label htmlFor="excel-file">ملف Excel</Label>
                <Input
                  id="excel-file"
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileSelect}
                  className="mt-1"
                />
              </div>
            </CardContent>
          </Card>

          {/* Preview Data */}
          {previewData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-500" />
                  معاينة البيانات ({previewData.length} طالب)
                </CardTitle>
                <CardDescription>
                  تأكد من صحة البيانات قبل الاستيراد
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="max-h-60 overflow-y-auto border rounded">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="p-2 text-right">رقم الطالب</th>
                        <th className="p-2 text-right">الاسم</th>
                        <th className="p-2 text-right">تاريخ الميلاد</th>
                        <th className="p-2 text-right">الجنس</th>
                        <th className="p-2 text-right">جهة الاتصال</th>
                        <th className="p-2 text-right">الفصل</th>
                      </tr>
                    </thead>
                    <tbody>
                      {previewData.map((student, index) => (
                        <tr key={index} className="border-b">
                          <td className="p-2">{student.student_id}</td>
                          <td className="p-2">{student.full_name}</td>
                          <td className="p-2">{student.date_of_birth}</td>
                          <td className="p-2">{student.gender === 'male' ? 'ذكر' : 'أنثى'}</td>
                          <td className="p-2">{student.emergency_name}</td>
                          <td className="p-2">{student.class_name}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter>
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => setIsDialogOpen(false)}
          >
            إلغاء
          </Button>
          <Button 
            onClick={handleImport} 
            disabled={previewData.length === 0 || loading}
          >
            {loading ? 'جاري الاستيراد...' : `استيراد ${previewData.length} طالب`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ExcelImport;