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
    
    // SuperAdmin interface
    'superadmin.title': 'SmartKindy - لوحة الإدارة العامة',
    'superadmin.admin': 'مدير عام',
    'superadmin.total_tenants': 'إجمالي الحضانات',
    'superadmin.pending_requests': 'طلبات الانتظار',
    'superadmin.active_subscriptions': 'الاشتراكات النشطة',
    'superadmin.monthly_revenue': 'الإيرادات الشهرية',
    'superadmin.tenants_management': 'إدارة الحضانات',
    'superadmin.subscriptions_management': 'إدارة الاشتراكات',
    'superadmin.payments_reports': 'تقارير المدفوعات',
    'superadmin.system_settings': 'إعدادات النظام',
    'superadmin.nursery_name': 'اسم الحضانة',
    'superadmin.email': 'البريد الإلكتروني',
    'superadmin.manager': 'المدير',
    'superadmin.nursery_status': 'حالة الحضانة',
    'superadmin.manager_status': 'حالة المدير',
    'superadmin.registration_date': 'تاريخ التسجيل',
    'superadmin.actions': 'الإجراءات',
    'superadmin.pending': 'في الانتظار',
    'superadmin.approved': 'مُعتمد',
    'superadmin.suspended': 'مُعلق',
    'superadmin.cancelled': 'مُلغى',
    'superadmin.active': 'نشط',
    'superadmin.inactive': 'غير مفعل',
    'superadmin.approve': 'اعتماد',
    'superadmin.reject': 'رفض',
    'superadmin.send_credentials': 'إرسال بيانات الدخول',
    'superadmin.suspend': 'إيقاف مؤقت',
    'superadmin.unsuspend': 'إلغاء الإيقاف',
    'superadmin.delete': 'حذف',
    'superadmin.activate_manager': 'تفعيل المدير',
    'superadmin.deactivate_manager': 'إلغاء تفعيل المدير',
    
    // Teacher Dashboard
    'teacher.dashboard': 'لوحة معلومات المعلمة',
    'teacher.my_classes': 'فصولي',
    'teacher.today_attendance': 'حضور اليوم',
    'teacher.recent_assignments': 'الواجبات الأخيرة',
    'teacher.student_notes': 'ملاحظات الطلاب',
    'teacher.rewards_given': 'المكافآت الممنوحة',
    'teacher.quick_actions': 'إجراءات سريعة',
    'teacher.mark_attendance': 'تسجيل الحضور',
    'teacher.add_assignment': 'إضافة واجب',
    'teacher.add_note': 'إضافة ملاحظة',
    'teacher.give_reward': 'منح مكافأة',
    'teacher.view_all_classes': 'عرض جميع الفصول',
    'teacher.view_all_assignments': 'عرض جميع الواجبات',
    'teacher.view_all_notes': 'عرض جميع الملاحظات',
    'teacher.view_all_rewards': 'عرض جميع المكافآت',
    
    // Students page
    'students.title': 'إدارة الطلاب',
    'students.subtitle': 'إدارة بيانات وملفات الطلاب',
    'students.add_student': 'إضافة طالب جديد',
    'students.import_excel': 'استيراد من Excel',
    'students.student_id': 'رقم الطالب',
    'students.full_name': 'الاسم الكامل',
    'students.class': 'الفصل',
    'students.age': 'العمر',
    'students.enrollment_date': 'تاريخ التسجيل',
    'students.view_profile': 'عرض الملف الشخصي',
    'students.search_placeholder': 'البحث بالاسم أو رقم الطالب...',
    'students.no_students': 'لا يوجد طلاب',
    'students.years_old': 'سنة',
    
    // Dashboard
    'dashboard.welcome': 'مرحباً بك',
    'dashboard.overview': 'نظرة عامة',
    'dashboard.total_students': 'إجمالي الطلاب',
    'dashboard.total_teachers': 'إجمالي المعلمات',
    'dashboard.total_classes': 'إجمالي الفصول',
    'dashboard.attendance_rate': 'معدل الحضور',
    'dashboard.recent_activities': 'الأنشطة الأخيرة',
    'dashboard.quick_actions': 'إجراءات سريعة',
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
    
    // SuperAdmin interface
    'superadmin.title': 'SmartKindy - Admin Panel',
    'superadmin.admin': 'Super Admin',
    'superadmin.total_tenants': 'Total Nurseries',
    'superadmin.pending_requests': 'Pending Requests',
    'superadmin.active_subscriptions': 'Active Subscriptions',
    'superadmin.monthly_revenue': 'Monthly Revenue',
    'superadmin.tenants_management': 'Nurseries Management',
    'superadmin.subscriptions_management': 'Subscriptions Management',
    'superadmin.payments_reports': 'Payment Reports',
    'superadmin.system_settings': 'System Settings',
    'superadmin.nursery_name': 'Nursery Name',
    'superadmin.email': 'Email',
    'superadmin.manager': 'Manager',
    'superadmin.nursery_status': 'Nursery Status',
    'superadmin.manager_status': 'Manager Status',
    'superadmin.registration_date': 'Registration Date',
    'superadmin.actions': 'Actions',
    'superadmin.pending': 'Pending',
    'superadmin.approved': 'Approved',
    'superadmin.suspended': 'Suspended',
    'superadmin.cancelled': 'Cancelled',
    'superadmin.active': 'Active',
    'superadmin.inactive': 'Inactive',
    'superadmin.approve': 'Approve',
    'superadmin.reject': 'Reject',
    'superadmin.send_credentials': 'Send Login Details',
    'superadmin.suspend': 'Suspend',
    'superadmin.unsuspend': 'Unsuspend',
    'superadmin.delete': 'Delete',
    'superadmin.activate_manager': 'Activate Manager',
    'superadmin.deactivate_manager': 'Deactivate Manager',
    
    // Teacher Dashboard
    'teacher.dashboard': 'Teacher Dashboard',
    'teacher.my_classes': 'My Classes',
    'teacher.today_attendance': 'Today\'s Attendance',
    'teacher.recent_assignments': 'Recent Assignments',
    'teacher.student_notes': 'Student Notes',
    'teacher.rewards_given': 'Rewards Given',
    'teacher.quick_actions': 'Quick Actions',
    'teacher.mark_attendance': 'Mark Attendance',
    'teacher.add_assignment': 'Add Assignment',
    'teacher.add_note': 'Add Note',
    'teacher.give_reward': 'Give Reward',
    'teacher.view_all_classes': 'View All Classes',
    'teacher.view_all_assignments': 'View All Assignments',
    'teacher.view_all_notes': 'View All Notes',
    'teacher.view_all_rewards': 'View All Rewards',
    
    // Students page
    'students.title': 'Students Management',
    'students.subtitle': 'Manage student data and profiles',
    'students.add_student': 'Add New Student',
    'students.import_excel': 'Import from Excel',
    'students.student_id': 'Student ID',
    'students.full_name': 'Full Name',
    'students.class': 'Class',
    'students.age': 'Age',
    'students.enrollment_date': 'Enrollment Date',
    'students.view_profile': 'View Profile',
    'students.search_placeholder': 'Search by name or student ID...',
    'students.no_students': 'No students found',
    'students.years_old': 'years old',
    
    // Dashboard
    'dashboard.welcome': 'Welcome',
    'dashboard.overview': 'Overview',
    'dashboard.total_students': 'Total Students',
    'dashboard.total_teachers': 'Total Teachers',
    'dashboard.total_classes': 'Total Classes',
    'dashboard.attendance_rate': 'Attendance Rate',
    'dashboard.recent_activities': 'Recent Activities',
    'dashboard.quick_actions': 'Quick Actions',
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