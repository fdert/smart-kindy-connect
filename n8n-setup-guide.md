# دليل إعداد n8n مع السكريبت المخصص للواتساب

## المتطلبات الأساسية

### 1. السكريبت المخصص للواتساب
- سكريبت يمكنه إرسال واستقبال رسائل WhatsApp
- قدرة على استقبال وإرسال HTTP requests
- webhook URL للسكريبت الخاص بك

### 2. n8n مُثبت ومُشغل
- يمكن استخدام n8n Cloud أو Self-hosted

## خطوات الإعداد التفصيلية

### الخطوة 1: إعداد بيانات الاعتماد في n8n

#### 1.1 HTTP Header Auth (للـ Supabase)
```
اذهب إلى: Settings → Credentials → Add Credential
اختر: HTTP Header Auth
املأ البيانات:
- Name: Authorization
- Value: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl0am9kdWRsbmZhbXZuZXNjdW11Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1MTYwMzgsImV4cCI6MjA3MjA5MjAzOH0.sXV4caS0mPZ_CjEIzgenbCpQYDhT21T5wuYMUPNisFY
```

### الخطوة 2: استيراد Workflows

#### 2.1 استيراد Custom WhatsApp Outbound Workflow
1. اذهب إلى n8n Dashboard
2. اضغط على "Import"
3. انسخ محتوى ملف `whatsapp-outbound-workflow.json`
4. الصق المحتوى واضغط "Import"
5. **مهم**: غيّر `YOUR_WHATSAPP_SCRIPT_WEBHOOK_URL` إلى URL السكريبت الخاص بك
6. احفظ الـ workflow

#### 2.2 استيراد Custom WhatsApp Inbound Workflow
1. كرر نفس الخطوات مع ملف `whatsapp-inbound-workflow.json`

### الخطوة 3: تكوين الـ Webhooks

#### 3.1 Outbound Webhook (للرسائل الصادرة)
```
URL: https://your-n8n-instance.com/webhook/whatsapp-outbound
Method: POST
Headers:
  - Content-Type: application/json
```

#### 3.2 Inbound Webhook (للرسائل الواردة)
```
URL: https://your-n8n-instance.com/webhook/whatsapp-inbound
Method: POST
Headers:
  - Content-Type: application/json
```

### الخطوة 4: إعداد السكريبت المخصص

#### 4.1 تكوين السكريبت الخاص بك
```
في السكريبت الخاص بك، أضف إعداد لإرسال الرسائل الواردة إلى:
URL: https://your-n8n-instance.com/webhook/whatsapp-inbound
Method: POST
Content-Type: application/json
```

#### 4.2 تنسيق البيانات المطلوب
السكريبت يجب أن يرسل البيانات بهذا التنسيق:
```json
{
  "phone": "+966500000000",
  "message": "نص الرسالة الواردة", 
  "contact_name": "اسم المرسل",
  "timestamp": "1234567890",
  "message_id": "unique_message_id"
}
```

### الخطوة 5: تحديث إعدادات النظام

#### 5.1 في صفحة الإعدادات (Settings)
```
N8N Webhook URL (للرسائل الصادرة):
https://your-n8n-instance.com/webhook/whatsapp-outbound

Webhook Secret: [اختياري للأمان]
```

#### 5.2 في الـ Outbound Workflow
غيّر `YOUR_WHATSAPP_SCRIPT_WEBHOOK_URL` إلى URL السكريبت الخاص بك الذي يستقبل طلبات الإرسال

#### 5.2 تحديث Tenant ID في الـ workflows
- في الـ inbound workflow، غيّر `X-Tenant-ID` header value إلى tenant ID الخاص بك

### الخطوة 6: اختبار النظام

#### 6.1 اختبار الرسائل الصادرة
1. اذهب إلى صفحة الاستبيانات
2. أنشئ استبيان جديد وأرسله
3. تحقق من أن الرسالة وصلت عبر WhatsApp

#### 6.2 اختبار الرسائل الواردة
1. أرسل رسالة نصية إلى رقم WhatsApp Business
2. تحقق من الـ logs في n8n
3. تحقق من الـ logs في Supabase Functions

## استكشاف الأخطاء

### مشاكل شائعة وحلولها

#### 1. "Workflow could not be started"
- تأكد من أن الـ webhook URL صحيح
- تأكد من أن n8n يعمل ويمكن الوصول إليه

#### 2. رسائل WhatsApp لا تُرسل
- تأكد من أن URL السكريبت المخصص صحيح وقابل للوصول
- تحقق من أن السكريبت يستقبل البيانات بالتنسيق الصحيح
- تأكد من أن السكريبت يعيد response صحيح

#### 3. الرسائل الواردة لا تُستقبل
- تأكد من أن السكريبت الخاص بك يرسل البيانات إلى n8n webhook
- تحقق من تنسيق البيانات المرسلة من السكريبت
- تأكد من أن n8n يستقبل البيانات بشكل صحيح

#### 4. مشاكل في الـ Authentication
- تحقق من صحة Supabase anon key
- تأكد من أن Authorization header صحيح

## البيانات المُتوقعة

### Outbound Message Format (من Supabase إلى n8n إلى السكريبت)
**من Supabase إلى n8n:**
```json
{
  "to": "+966500000000",
  "message": "النص المراد إرساله",
  "tenantId": "tenant-uuid",
  "contextType": "survey|permission|dismissal",
  "contextId": "context-uuid",
  "templateName": "template_name"
}
```

**من n8n إلى السكريبت المخصص:**
```json
{
  "phone": "+966500000000",
  "message": "النص المراد إرساله",
  "tenant_id": "tenant-uuid",
  "context_type": "survey|permission|dismissal",
  "context_id": "context-uuid",
  "timestamp": "2025-01-31T00:00:00.000Z"
}
```

### Inbound Message Format (من السكريبت إلى n8n)
**التنسيق المطلوب من السكريبت الخاص بك:**
```json
{
  "phone": "+966500000000",
  "message": "نص الرسالة الواردة",
  "contact_name": "اسم المرسل",
  "timestamp": "1234567890",
  "message_id": "unique_message_id"
}
```

**البيانات الاختيارية (يمكن إضافتها):**
```json
{
  "phone": "+966500000000",
  "message": "نص الرسالة الواردة",
  "contact_name": "اسم المرسل",
  "timestamp": "1234567890",
  "message_id": "unique_message_id",
  "media_url": "رابط ملف مرفق (اختياري)",
  "media_type": "image|video|document (اختياري)"
}
```

## أمان إضافي (اختياري)

### تشفير الـ Webhooks
```javascript
// في n8n، يمكنك إضافة node للتحقق من الـ signature
const crypto = require('crypto');
const signature = req.headers['x-hub-signature-256'];
const body = JSON.stringify(req.body);
const expectedSignature = crypto
  .createHmac('sha256', 'YOUR_WEBHOOK_SECRET')
  .update(body)
  .digest('hex');
```

### Rate Limiting
- تأكد من تطبيق rate limiting في n8n إذا كان ذلك مطلوباً
- راقب usage limits في WhatsApp Business API

## المراقبة والصيانة

### Logs مهمة للمراقبة
1. n8n execution logs
2. Supabase Edge Functions logs
3. WhatsApp Business API delivery reports
4. Database logs للرسائل المحفوظة

### نصائح للصيانة
- راقب معدل نجاح الرسائل
- تابع الـ error logs بانتظام
- تأكد من تحديث الـ Access Tokens قبل انتهاء صلاحيتها
- اعمل backup للـ workflows بانتظام