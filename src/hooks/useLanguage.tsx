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
    'common.currency': 'ر.س',
    'common.view_all': 'عرض الكل',
    
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
    'dashboard.today_attendance': 'الحضور اليوم',
    'dashboard.weekly_rewards': 'النجوم الأسبوعية',
    'dashboard.this_week': 'هذا الأسبوع',
    'dashboard.start_now': 'ابدأ الآن',
    'dashboard.view_media': 'مشاهدة الصور والأنشطة',
    'dashboard.view_assignments': 'عرض معلومات وواجبات أطفالي',
    
    // Auth page
    'auth.welcome': 'مرحباً بك',
    'auth.description': 'سجل دخولك أو أنشئ حساباً جديداً أو جرب النظام',
    'auth.signin': 'تسجيل الدخول',
    'auth.signup': 'حساب جديد',
    'auth.password_reset': 'كلمة المرور',
    'auth.admin_create': 'إنشاء مدير',
    'auth.email': 'البريد الإلكتروني',
    'auth.password': 'كلمة المرور',
    'auth.full_name': 'الاسم الكامل',
    'auth.confirm_password': 'تأكيد كلمة المرور',
    'auth.email_placeholder': 'أدخل بريدك الإلكتروني',
    'auth.password_placeholder': 'أدخل كلمة المرور',
    'auth.full_name_placeholder': 'أدخل اسمك الكامل',
    'auth.confirm_password_placeholder': 'أعد إدخال كلمة المرور',
    'auth.teacher_note': 'للمعلمات:',
    'auth.teacher_instruction': 'إذا لم تتلقي بيانات الدخول، أدخلي بريدك الإلكتروني وكلمة المرور المؤقتة TK94303549 وسيتم إرسال بيانات دخول جديدة عبر الواتساب.',
    'auth.signing_in': 'جاري تسجيل الدخول...',
    'auth.creating_account': 'جاري إنشاء الحساب...',
    'auth.create_new_account': 'إنشاء حساب جديد',
    'auth.passwords_dont_match': 'كلمات المرور غير متطابقة',
    'auth.change_password_instruction': 'لتغيير كلمة المرور، يرجى تسجيل الدخول أولاً',
    'auth.login_to_change_password': 'تسجيل الدخول لتغيير كلمة المرور',
    'auth.change_password_toast_title': 'تغيير كلمة المرور',
    'auth.change_password_toast_desc': 'يرجى تسجيل الدخول أولاً لتتمكن من تغيير كلمة المرور',
    'auth.students_management': 'إدارة الطلاب',
    'auth.reward_system': 'نظام التحفيز',
    'auth.parent_communication': 'تواصل الأولياء',
    'auth.platform_name': 'SmartKindy',
    'auth.platform_description': 'منصة إدارة رياض الأطفال الذكية',
    'auth.demo_accounts': 'الحسابات التجريبية',
    'auth.copy_success': 'تم النسخ',
    'auth.copy_success_desc': 'تم نسخ {type} بنجاح',
    'auth.login_error_title': 'خطأ في تسجيل الدخول',
    'auth.login_error_desc': 'تأكد من صحة البيانات أو تواصل مع الدعم الفني',
    'auth.select_language': 'اختر اللغة',
    
    // NotFound page
    'notfound.title': '404',
    'notfound.message': 'عذراً! الصفحة غير موجودة',
    'notfound.return_home': 'العودة للرئيسية',
    
    // General UI
    'ui.loading': 'جاري التحميل...',
    'ui.no_data': 'لا توجد بيانات',
    'ui.error': 'حدث خطأ',
    'ui.try_again': 'حاول مرة أخرى',
    'ui.required_field': 'هذا الحقل مطلوب',
    'ui.select_option': 'اختر خيار...',
    
    // Page titles and navigation
    'pages.dashboard': 'لوحة التحكم',
    'pages.students': 'الطلاب',
    'pages.teachers': 'المعلمات', 
    'pages.classes': 'الفصول',
    'pages.attendance': 'الحضور والغياب',
    'pages.rewards': 'المكافآت',
    'pages.media': 'الصور والفيديوهات',
    'pages.guardians': 'أولياء الأمور',
    'pages.financial': 'النظام المالي',
    'pages.reports': 'التقارير',
    'pages.settings': 'الإعدادات',
    'pages.permissions': 'الأذونات',
    'pages.surveys': 'الاستطلاعات',
    'pages.virtual_classes': 'الفصول الافتراضية',
    'pages.assignments': 'الواجبات',
    'pages.notes': 'الملاحظات',
    'pages.ai_assistant': 'المساعد الذكي',
    
    // Landing page (Index)
    'landing.title': 'SmartKindy',
    'landing.subtitle': 'منصة إدارة رياض الأطفال الذكية',
    'landing.description': 'نظام شامل لإدارة الحضانات مع تكامل واتساب وتتبع الحضور ونظام التحفيز',
    'landing.try_demo': '🎯 جرب النظام الآن مجاناً',
    'landing.login': 'تسجيل الدخول',
    'landing.register': 'تسجيل حضانة',
    'landing.tour': 'جولة تعريفية',
    'landing.teacher_guide': '📚 دليل المعلم التفاعلي',
    
    // Landing page features
    'landing.features.title': 'ميزات المنصة',
    'landing.features.description': 'مجموعة شاملة من الأدوات المتطورة لإدارة حضانتك بكفاءة واحترافية',
    'landing.features.student_management': 'إدارة الطلاب',
    'landing.features.student_management_desc': 'إدارة شاملة لمعلومات الطلاب والفصول مع إمكانية التتبع والمراقبة',
    'landing.features.attendance': 'تتبع الحضور',
    'landing.features.attendance_desc': 'نظام متقدم لتسجيل الحضور والغياب مع إشعارات فورية للأولياء',
    'landing.features.rewards': 'نظام التحفيز',
    'landing.features.rewards_desc': 'تحفيز الطلاب بالنجوم والأوسمة مع لوحة شرف تفاعلية',
    'landing.features.whatsapp': 'تكامل واتساب',
    'landing.features.whatsapp_desc': 'إرسال الإشعارات والتحديثات للأولياء عبر واتساب بشكل تلقائي',
    'landing.features.media': 'الألبوم اليومي',
    'landing.features.media_desc': 'مشاركة صور وأنشطة الطلاب مع الأولياء بروابط آمنة ومؤقتة',
    'landing.features.reports': 'التقارير الذكية',
    'landing.features.reports_desc': 'تقارير مفصلة عن الحضور والتطور والأنشطة مع إمكانية التصدير',
    
    // Statistics
    'landing.stats.title': 'لماذا يثق بنا المئات؟',
    'landing.stats.nurseries': 'حضانة تستخدم النظام',
    'landing.stats.children': 'طفل سعيد',
    'landing.stats.satisfaction': 'معدل الرضا',
    'landing.stats.support': 'دعم فني',
    
    // Advanced features
    'landing.advanced.title': 'ميزات متقدمة أكثر',
    'landing.advanced.security': 'أمان متقدم',
    'landing.advanced.security_desc': 'حماية شاملة للبيانات مع نسخ احتياطية تلقائية وتشفير متقدم',
    'landing.advanced.speed': 'سرعة عالية',
    'landing.advanced.speed_desc': 'أداء متميز مع تحميل سريع واستجابة فورية لجميع العمليات',
    'landing.advanced.mobile': 'متوافق مع الجوال',
    'landing.advanced.mobile_desc': 'تصميم متجاوب يعمل بسلاسة على جميع الأجهزة والشاشات',
    'landing.advanced.time_saving': 'توفير الوقت',
    'landing.advanced.time_saving_desc': 'أتمتة المهام الروتينية وتبسيط العمليات لتوفير ساعات من العمل',
    
    // Pricing section
    'landing.pricing.title': 'خطط تناسب جميع الحضانات',
    'landing.pricing.description': 'ابدأ مجاناً وارق لاحقاً حسب احتياجاتك',
    'landing.pricing.loading': 'جاري تحميل الخطط...',
    'landing.pricing.popular': 'الأكثر شيوعاً',
    'landing.pricing.monthly': 'ر.س/شهرياً',
    'landing.pricing.unlimited': 'غير محدود',
    'landing.pricing.students_limit': 'حتى {count} طالب',
    'landing.pricing.teachers_limit': 'حتى {count} معلم',
    
    // Pricing page
    'pricing.title': 'خطط تناسب جميع احتياجاتك',
    'pricing.description': 'اختر الخطة المناسبة لحضانتك مع إمكانية الترقية أو التغيير في أي وقت',
    'pricing.monthly': 'شهرياً',
    'pricing.yearly': 'سنوياً',
    'pricing.save': 'وفر حتى 20%',
    'pricing.loading': 'جاري تحميل الخطط...',
    'pricing.popular': 'الأكثر شيوعاً',
    'pricing.sar_monthly': 'ر.س',
    'pricing.monthly_period': 'شهرياً',
    'pricing.yearly_period': 'سنوياً',
    'pricing.yearly_discount': 'وفر {discount}% مع الدفع السنوي',
    'pricing.included_features': 'الميزات المتضمنة:',
    'pricing.not_included': 'غير متضمن:',
    'pricing.start_with': 'ابدأ مع {plan}',
    'pricing.students_up_to': 'حتى {count} طالب',
    'pricing.teachers_up_to': 'حتى {count} معلم',
    'pricing.classes_up_to': 'حتى {count} فصل',
    'pricing.storage': '{size} جيجابايت تخزين',
    'pricing.unlimited': 'غير محدود',
    'pricing.whatsapp_integration': 'تكامل واتساب',
    'pricing.advanced_analytics': 'التحليلات المتقدمة',
    'pricing.advanced_reports': 'التقارير المتقدمة',
    
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
    'common.currency': 'SAR',
    'common.view_all': 'View All',
    
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
    'dashboard.today_attendance': 'Today\'s Attendance',
    'dashboard.weekly_rewards': 'Weekly Stars',
    'dashboard.this_week': 'This Week',
    'dashboard.start_now': 'Start Now',
    'dashboard.view_media': 'View Photos & Activities',
    'dashboard.view_assignments': 'View Children Information & Assignments',
    
    // Auth page
    'auth.welcome': 'Welcome',
    'auth.description': 'Sign in or create a new account or try the system',
    'auth.signin': 'Sign In',
    'auth.signup': 'Sign Up',
    'auth.password_reset': 'Password',
    'auth.admin_create': 'Create Admin',
    'auth.email': 'Email',
    'auth.password': 'Password',
    'auth.full_name': 'Full Name',
    'auth.confirm_password': 'Confirm Password',
    'auth.email_placeholder': 'Enter your email',
    'auth.password_placeholder': 'Enter your password',
    'auth.full_name_placeholder': 'Enter your full name',
    'auth.confirm_password_placeholder': 'Re-enter your password',
    'auth.teacher_note': 'For Teachers:',
    'auth.teacher_instruction': 'If you haven\'t received login credentials, enter your email and temporary password TK94303549 and new login credentials will be sent via WhatsApp.',
    'auth.signing_in': 'Signing in...',
    'auth.creating_account': 'Creating account...',
    'auth.create_new_account': 'Create New Account',
    'auth.passwords_dont_match': 'Passwords do not match',
    'auth.change_password_instruction': 'To change password, please sign in first',
    'auth.login_to_change_password': 'Sign In to Change Password',
    'auth.change_password_toast_title': 'Change Password',
    'auth.change_password_toast_desc': 'Please sign in first to be able to change your password',
    'auth.students_management': 'Students Management',
    'auth.reward_system': 'Reward System',
    'auth.parent_communication': 'Parent Communication',
    'auth.platform_name': 'SmartKindy',
    'auth.platform_description': 'Smart Kindergarten Management Platform',
    'auth.demo_accounts': 'Demo Accounts',
    'auth.copy_success': 'Copied',
    'auth.copy_success_desc': '{type} copied successfully',
    'auth.login_error_title': 'Login Error',
    'auth.login_error_desc': 'Please check your credentials or contact technical support',
    'auth.select_language': 'Select Language',
    
    // NotFound page
    'notfound.title': '404',
    'notfound.message': 'Oops! Page not found',
    'notfound.return_home': 'Return to Home',
    
    // General UI
    'ui.loading': 'Loading...',
    'ui.no_data': 'No data available',
    'ui.error': 'An error occurred',
    'ui.try_again': 'Try again',
    'ui.required_field': 'This field is required',
    'ui.select_option': 'Select option...',
    
    // Page titles and navigation
    'pages.dashboard': 'Dashboard',
    'pages.students': 'Students',
    'pages.teachers': 'Teachers',
    'pages.classes': 'Classes',
    'pages.attendance': 'Attendance',
    'pages.rewards': 'Rewards',
    'pages.media': 'Media',
    'pages.guardians': 'Guardians',
    'pages.financial': 'Financial System',
    'pages.reports': 'Reports',
    'pages.settings': 'Settings',
    'pages.permissions': 'Permissions',
    'pages.surveys': 'Surveys',
    'pages.virtual_classes': 'Virtual Classes',
    'pages.assignments': 'Assignments',
    'pages.notes': 'Notes',
    'pages.ai_assistant': 'AI Assistant',
    
    // Landing page (Index)
    'landing.title': 'SmartKindy',
    'landing.subtitle': 'Smart Kindergarten Management Platform',
    'landing.description': 'Comprehensive nursery management system with WhatsApp integration, attendance tracking, and reward system',
    'landing.try_demo': '🎯 Try the system now for free',
    'landing.login': 'Login',
    'landing.register': 'Register Nursery',
    'landing.tour': 'Take a Tour',
    'landing.teacher_guide': '📚 Interactive Teacher Guide',
    
    // Landing page features
    'landing.features.title': 'Platform Features',
    'landing.features.description': 'Comprehensive set of advanced tools to manage your nursery efficiently and professionally',
    'landing.features.student_management': 'Student Management',
    'landing.features.student_management_desc': 'Comprehensive management of student information and classes with tracking and monitoring capabilities',
    'landing.features.attendance': 'Attendance Tracking',
    'landing.features.attendance_desc': 'Advanced system for recording attendance and absence with instant notifications to parents',
    'landing.features.rewards': 'Reward System',
    'landing.features.rewards_desc': 'Motivate students with stars and badges with an interactive honor board',
    'landing.features.whatsapp': 'WhatsApp Integration',
    'landing.features.whatsapp_desc': 'Send notifications and updates to parents via WhatsApp automatically',
    'landing.features.media': 'Daily Album',
    'landing.features.media_desc': 'Share photos and student activities with parents through secure, temporary links',
    'landing.features.reports': 'Smart Reports',
    'landing.features.reports_desc': 'Detailed reports on attendance, development, and activities with export capability',
    
    // Statistics
    'landing.stats.title': 'Why do hundreds trust us?',
    'landing.stats.nurseries': 'nurseries using the system',
    'landing.stats.children': 'happy children',
    'landing.stats.satisfaction': 'satisfaction rate',
    'landing.stats.support': 'technical support',
    
    // Advanced features
    'landing.advanced.title': 'More Advanced Features',
    'landing.advanced.security': 'Advanced Security',
    'landing.advanced.security_desc': 'Comprehensive data protection with automatic backups and advanced encryption',
    'landing.advanced.speed': 'High Speed',
    'landing.advanced.speed_desc': 'Outstanding performance with fast loading and instant response to all operations',
    'landing.advanced.mobile': 'Mobile Compatible',
    'landing.advanced.mobile_desc': 'Responsive design that works seamlessly on all devices and screens',
    'landing.advanced.time_saving': 'Time Saving',
    'landing.advanced.time_saving_desc': 'Automate routine tasks and simplify processes to save hours of work',
    
    // Pricing section
    'landing.pricing.title': 'Plans for All Nurseries',
    'landing.pricing.description': 'Start free and upgrade later according to your needs',
    'landing.pricing.loading': 'Loading plans...',
    'landing.pricing.popular': 'Most Popular',
    'landing.pricing.monthly': 'SAR/monthly',
    'landing.pricing.unlimited': 'Unlimited',
    'landing.pricing.students_limit': 'Up to {count} students',
    'landing.pricing.teachers_limit': 'Up to {count} teachers',
    
    // Pricing page
    'pricing.title': 'Plans to suit all your needs',
    'pricing.description': 'Choose the right plan for your nursery with the ability to upgrade or change at any time',
    'pricing.monthly': 'Monthly',
    'pricing.yearly': 'Yearly',
    'pricing.save': 'Save up to 20%',
    'pricing.loading': 'Loading plans...',
    'pricing.popular': 'Most Popular',
    'pricing.sar_monthly': 'SAR',
    'pricing.monthly_period': 'monthly',
    'pricing.yearly_period': 'yearly',
    'pricing.yearly_discount': 'Save {discount}% with annual payment',
    'pricing.included_features': 'Included features:',
    'pricing.not_included': 'Not included:',
    'pricing.start_with': 'Start with {plan}',
    'pricing.students_up_to': 'Up to {count} students',
    'pricing.teachers_up_to': 'Up to {count} teachers',
    'pricing.classes_up_to': 'Up to {count} classes',
    'pricing.storage': '{size} GB storage',
    'pricing.unlimited': 'Unlimited',
    'pricing.whatsapp_integration': 'WhatsApp Integration',
    'pricing.advanced_analytics': 'Advanced Analytics',
    'pricing.advanced_reports': 'Advanced Reports',
    
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