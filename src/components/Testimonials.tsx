import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Star, Quote } from "lucide-react";

interface TestimonialProps {
  name: string;
  title: string;
  nursery: string;
  content: string;
  rating: number;
  avatar: string;
}

const testimonials: TestimonialProps[] = [
  {
    name: "أميرة محمد",
    title: "مديرة حضانة",
    nursery: "حضانة براعم المستقبل",
    content: "SmartKindy غيّر طريقة إدارتنا للحضانة بالكامل. أصبح التواصل مع الأولياء أسهل والإدارة أكثر تنظيماً. النظام سهل الاستخدام والدعم الفني ممتاز.",
    rating: 5,
    avatar: "أ م"
  },
  {
    name: "سارة أحمد",
    title: "مؤسسة ومديرة",
    nursery: "حضانة الأطفال السعداء",
    content: "بعد استخدام SmartKindy لمدة سنة، لا أستطيع تخيل العمل بدونه. تكامل واتساب وفر علينا ساعات من الاتصالات، والأولياء أصبحوا أكثر رضا.",
    rating: 5,
    avatar: "س أ"
  },
  {
    name: "فاطمة الزهراني",
    title: "معلمة رئيسية",
    nursery: "حضانة النور الصغير",
    content: "النظام سهّل علينا تتبع تطور الأطفال وتسجيل الحضور. التقارير مفيدة جداً للاجتماعات مع الأولياء، وألبوم الصور يحبه الجميع.",
    rating: 5,
    avatar: "ف ز"
  },
  {
    name: "رانيا عبدالله",
    title: "مالكة حضانة",
    nursery: "حضانة زهور الربيع",
    content: "استثمار رائع! SmartKindy وفر الكثير من الوقت والجهد. الآن نركز أكثر على الأطفال بدلاً من الأعمال الإدارية. أنصح به كل مدير حضانة.",
    rating: 5,
    avatar: "ر ع"
  },
  {
    name: "منى السالم",
    title: "مديرة إدارية",
    nursery: "حضانة الأحلام الصغيرة",
    content: "التطبيق عملي جداً ومناسب لاحتياجاتنا. خاصة نظام التحفيز الذي أحبه الأطفال والأولياء. الدعم الفني سريع ومفيد.",
    rating: 5,
    avatar: "م س"
  },
  {
    name: "هدى الشريف",
    title: "مديرة تعليمية",
    nursery: "حضانة المبدعون الصغار",
    content: "SmartKindy ساعدني في تنظيم عملي وتحسين التواصل مع فريق المعلمات. التقارير المفصلة تساعدنا كثيراً في تطوير أساليب التعليم.",
    rating: 5,
    avatar: "ه ش"
  }
];

const Testimonials = () => {
  return (
    <div className="py-16 bg-gradient-to-r from-blue-50/50 via-purple-50/50 to-pink-50/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            ماذا يقول عملاؤنا؟
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            آراء وتجارب حقيقية من مديري ومديرات الحضانات الذين يستخدمون SmartKindy
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="bg-white/80 backdrop-blur-sm border-0 shadow-sm hover:shadow-lg transition-all">
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  <Quote className="h-8 w-8 text-primary/20" />
                </div>
                
                <div className="flex items-center mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${
                        i < testimonial.rating
                          ? 'text-yellow-400 fill-yellow-400'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>

                <p className="text-gray-700 mb-6 leading-relaxed">
                  "{testimonial.content}"
                </p>

                <div className="flex items-center">
                  <Avatar className="h-10 w-10 ml-3">
                    <AvatarFallback className="bg-primary/10 text-primary text-sm">
                      {testimonial.avatar}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-semibold text-gray-900">{testimonial.name}</div>
                    <div className="text-sm text-gray-600">{testimonial.title}</div>
                    <div className="text-sm text-primary">{testimonial.nursery}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* إحصائية سريعة */}
        <div className="text-center mt-12 bg-white/60 backdrop-blur-sm rounded-xl p-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="text-3xl font-bold text-primary mb-2">4.9/5</div>
              <div className="text-gray-600">متوسط التقييم</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary mb-2">500+</div>
              <div className="text-gray-600">حضانة راضية</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary mb-2">15K+</div>
              <div className="text-gray-600">طفل سعيد</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Testimonials;