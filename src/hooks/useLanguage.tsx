import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'ar' | 'en';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  dir: 'rtl' | 'ltr';
}

const translations = {
  ar: {
    // Navigation
    'nav.dashboard': 'لوحة التحكم',
    'nav.students': 'الطلاب',
    'nav.teachers': 'المعلمات',
    'nav.classes': 'الفصول',
    'nav.attendance': 'الحضور',
    'nav.rewards': 'التحفيز',
    'nav.media': 'الألبوم',
    'nav.guardians': 'أولياء الأمور',
    'nav.financial': 'المالية',
    'nav.reports': 'التقارير',
    'nav.settings': 'الإعدادات',
    'nav.logout': 'تسجيل الخروج',
    'nav.back': 'العودة',
    
    // Common
    'common.loading': 'جاري التحميل...',
    'common.error': 'حدث خطأ',
    'common.retry': 'إعادة المحاولة',
    'common.cancel': 'إلغاء',
    'common.save': 'حفظ',
    'common.delete': 'حذف',
    'common.edit': 'تعديل',
    'common.add': 'إضافة',
    'common.view': 'عرض',
    'common.search': 'بحث',
    'common.filter': 'تصفية',
    'common.export': 'تصدير',
    'common.print': 'طباعة',
    'common.close': 'إغلاق',
    'common.submit': 'إرسال',
    'common.confirm': 'تأكيد',
    'common.success': 'نجح',
    'common.failed': 'فشل',
    'common.name': 'الاسم',
    'common.date': 'التاريخ',
    'common.time': 'الوقت',
    'common.status': 'الحالة',
    'common.actions': 'الإجراءات',
    'common.details': 'التفاصيل',
    'common.description': 'الوصف',
    'common.notes': 'الملاحظات',
    'common.type': 'النوع',
    'common.category': 'الفئة',
    'common.total': 'المجموع',
    'common.count': 'العدد',
    'common.points': 'النقاط',
    'common.score': 'النتيجة',
    'common.level': 'المستوى',
    'common.grade': 'الدرجة',
    
    // Student Reports
    'report.student_rewards': 'مكافآت الطالب',
    'report.student_notes': 'ملاحظات الطالب',
    'report.development_skills': 'مهارات التطوير',
    'report.back_to_report': 'العودة للتقرير',
    'report.period': 'الفترة',
    'report.total_rewards': 'إجمالي المكافآت',
    'report.total_points': 'إجمالي النقاط',
    'report.average_points': 'متوسط النقاط',
    'report.no_rewards': 'لا توجد مكافآت',
    'report.no_notes': 'لا توجد ملاحظات',
    'report.no_skills': 'لا توجد مهارات',
    'report.loading_data': 'جاري تحميل البيانات...',
    'report.error_loading': 'خطأ في التحميل',
    'report.invalid_student_id': 'معرف الطالب غير صحيح',
    'report.student_not_found': 'لم يتم العثور على بيانات الطالب',
    
    // Note Types
    'note.academic': 'أكاديمية',
    'note.behavioral': 'سلوكية',
    'note.health': 'صحية',
    'note.social': 'اجتماعية',
    'note.general': 'عامة',
    
    // Severity
    'severity.high': 'عالية',
    'severity.medium': 'متوسطة',
    'severity.low': 'منخفضة',
    
    // Reward Types
    'reward.star': 'نجمة',
    'reward.badge': 'شارة',
    'reward.certificate': 'شهادة',
    'reward.achievement': 'إنجاز',
    'reward.general': 'عامة',
    
    // Days
    'day.monday': 'الاثنين',
    'day.tuesday': 'الثلاثاء',
    'day.wednesday': 'الأربعاء',
    'day.thursday': 'الخميس',
    'day.friday': 'الجمعة',
    'day.saturday': 'السبت',
    'day.sunday': 'الأحد',
    
    // Months
    'month.january': 'يناير',
    'month.february': 'فبراير',
    'month.march': 'مارس',
    'month.april': 'أبريل',
    'month.may': 'مايو',
    'month.june': 'يونيو',
    'month.july': 'يوليو',
    'month.august': 'أغسطس',
    'month.september': 'سبتمبر',
    'month.october': 'أكتوبر',
    'month.november': 'نوفمبر',
    'month.december': 'ديسمبر',
  },
  en: {
    // Navigation
    'nav.dashboard': 'Dashboard',
    'nav.students': 'Students',
    'nav.teachers': 'Teachers',
    'nav.classes': 'Classes',
    'nav.attendance': 'Attendance',
    'nav.rewards': 'Rewards',
    'nav.media': 'Media',
    'nav.guardians': 'Guardians',
    'nav.financial': 'Financial',
    'nav.reports': 'Reports',
    'nav.settings': 'Settings',
    'nav.logout': 'Logout',
    'nav.back': 'Back',
    
    // Common
    'common.loading': 'Loading...',
    'common.error': 'Error occurred',
    'common.retry': 'Retry',
    'common.cancel': 'Cancel',
    'common.save': 'Save',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.add': 'Add',
    'common.view': 'View',
    'common.search': 'Search',
    'common.filter': 'Filter',
    'common.export': 'Export',
    'common.print': 'Print',
    'common.close': 'Close',
    'common.submit': 'Submit',
    'common.confirm': 'Confirm',
    'common.success': 'Success',
    'common.failed': 'Failed',
    'common.name': 'Name',
    'common.date': 'Date',
    'common.time': 'Time',
    'common.status': 'Status',
    'common.actions': 'Actions',
    'common.details': 'Details',
    'common.description': 'Description',
    'common.notes': 'Notes',
    'common.type': 'Type',
    'common.category': 'Category',
    'common.total': 'Total',
    'common.count': 'Count',
    'common.points': 'Points',
    'common.score': 'Score',
    'common.level': 'Level',
    'common.grade': 'Grade',
    
    // Student Reports
    'report.student_rewards': 'Student Rewards',
    'report.student_notes': 'Student Notes',
    'report.development_skills': 'Development Skills',
    'report.back_to_report': 'Back to Report',
    'report.period': 'Period',
    'report.total_rewards': 'Total Rewards',
    'report.total_points': 'Total Points',
    'report.average_points': 'Average Points',
    'report.no_rewards': 'No rewards found',
    'report.no_notes': 'No notes found',
    'report.no_skills': 'No skills found',
    'report.loading_data': 'Loading data...',
    'report.error_loading': 'Error loading data',
    'report.invalid_student_id': 'Invalid student ID',
    'report.student_not_found': 'Student data not found',
    
    // Note Types
    'note.academic': 'Academic',
    'note.behavioral': 'Behavioral',
    'note.health': 'Health',
    'note.social': 'Social',
    'note.general': 'General',
    
    // Severity
    'severity.high': 'High',
    'severity.medium': 'Medium',
    'severity.low': 'Low',
    
    // Reward Types
    'reward.star': 'Star',
    'reward.badge': 'Badge',
    'reward.certificate': 'Certificate',
    'reward.achievement': 'Achievement',
    'reward.general': 'General',
    
    // Days
    'day.monday': 'Monday',
    'day.tuesday': 'Tuesday',
    'day.wednesday': 'Wednesday',
    'day.thursday': 'Thursday',
    'day.friday': 'Friday',
    'day.saturday': 'Saturday',
    'day.sunday': 'Sunday',
    
    // Months
    'month.january': 'January',
    'month.february': 'February',
    'month.march': 'March',
    'month.april': 'April',
    'month.may': 'May',
    'month.june': 'June',
    'month.july': 'July',
    'month.august': 'August',
    'month.september': 'September',
    'month.october': 'October',
    'month.november': 'November',
    'month.december': 'December',
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('ar');

  useEffect(() => {
    const savedLanguage = localStorage.getItem('language') as Language;
    if (savedLanguage && (savedLanguage === 'ar' || savedLanguage === 'en')) {
      setLanguage(savedLanguage);
    }
    
    // Update document direction and language
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language]);

  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem('language', lang);
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  };

  const t = (key: string): string => {
    return translations[language][key as keyof typeof translations['ar']] || key;
  };

  const dir = language === 'ar' ? 'rtl' : 'ltr';

  return (
    <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage, t, dir }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};