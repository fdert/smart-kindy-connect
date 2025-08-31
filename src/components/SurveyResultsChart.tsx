import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

interface SurveyResult {
  questionId: string;
  questionText: string;
  questionType: string;
  totalResponses: number;
  yesCount?: number;
  noCount?: number;
  yesPercentage?: number;
  optionCounts?: Record<string, number>;
  averageRating?: number;
  ratings?: number[];
}

interface SurveyResultsChartProps {
  result: SurveyResult;
}

export const SurveyResultsChart = ({ result }: SurveyResultsChartProps) => {
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  const renderYesNoChart = () => {
    if (result.totalResponses === 0) return null;
    
    const yesCount = result.yesCount || 0;
    const noCount = result.noCount || 0;
    
    console.log('Rendering Yes/No chart with data:', { yesCount, noCount, totalResponses: result.totalResponses });
    
    const data = [
      { name: 'نعم', value: yesCount, color: '#00C49F' },
      { name: 'لا', value: noCount, color: '#FF8042' }
    ];

    return (
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    );
  };

  const renderOptionsChart = () => {
    if (!result.optionCounts) return null;

    const data = Object.entries(result.optionCounts).map(([option, count]) => ({
      option: option.length > 20 ? option.substring(0, 20) + '...' : option,
      fullOption: option,
      count
    }));

    return (
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="option" 
            angle={-45} 
            textAnchor="end" 
            height={100}
            interval={0}
          />
          <YAxis />
          <Tooltip 
            formatter={(value, name, props) => [value, 'عدد الردود']}
            labelFormatter={(label, payload) => {
              const item = payload?.[0]?.payload;
              return item?.fullOption || label;
            }}
          />
          <Bar dataKey="count" fill="#0088FE" />
        </BarChart>
      </ResponsiveContainer>
    );
  };

  const renderRatingChart = () => {
    if (!result.ratings || result.ratings.length === 0) return null;

    const ratingCounts = [1, 2, 3, 4, 5].map(rating => ({
      rating: `${rating} نجوم`,
      count: result.ratings?.filter(r => r === rating).length || 0
    }));

    return (
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={ratingCounts}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="rating" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="count" fill="#FFBB28" />
        </BarChart>
      </ResponsiveContainer>
    );
  };

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle className="text-lg">{result.questionText}</CardTitle>
        <div className="flex gap-4 text-sm text-muted-foreground">
          <span>إجمالي الردود: {result.totalResponses}</span>
          {result.averageRating && (
            <span>متوسط التقييم: {result.averageRating.toFixed(1)}/5</span>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {(() => {
          console.log('Rendering chart for question type:', result.questionType, 'Total responses:', result.totalResponses);
          return null;
        })()}
        
        {result.questionType === 'yes_no' && result.totalResponses > 0 && renderYesNoChart()}
        {(result.questionType === 'single_choice' || result.questionType === 'multiple_choice') && result.totalResponses > 0 && renderOptionsChart()}
        {result.questionType === 'rating' && result.totalResponses > 0 && renderRatingChart()}
        
        {result.questionType === 'text' && (
          <div className="text-center py-8 text-muted-foreground">
            <p>الردود النصية لا يمكن عرضها في شكل رسم بياني</p>
            <p>يمكنك تصدير النتائج لمراجعة الردود النصية</p>
          </div>
        )}

        {result.totalResponses === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <p>لا توجد ردود على هذا السؤال بعد</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};