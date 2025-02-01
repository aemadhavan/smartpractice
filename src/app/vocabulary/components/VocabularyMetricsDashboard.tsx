import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { TrendingUp, Zap, Target, BookOpen } from 'lucide-react';

interface Metrics {
  successRate: number;
  currentStreak: number;
  averageAttempts: number;
  totalWords: number;
  performanceByType: Array<{
    category: string;
    value: number;
  }>;
  recentActivity: Array<{
    word: string;
    stepType: string;
    isSuccessful: boolean;
    createdAt: string;
  }>;
}

interface Props {
  userId: string;
}

const VocabularyMetricsDashboard: React.FC<Props> = ({ userId }) => {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const response = await fetch(`/api/vocabulary/metrics?userId=${userId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch metrics');
        }
        const data = await response.json();
        setMetrics(data.metrics);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch metrics');
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, [userId]);

  if (loading) {
    return <div className="p-4 text-center">Loading metrics...</div>;
  }

  if (error) {
    return <div className="p-4 text-center text-red-500">{error}</div>;
  }

  if (!metrics) {
    return <div className="p-4 text-center">No metrics available</div>;
  }

  return (
    <div className="space-y-4 mb-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-white">
          <CardContent className="pt-4">
            <div className="space-y-1">
              <p className="text-sm text-gray-600">Success Rate</p>
              <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold">{metrics.successRate}%</h2>
                <TrendingUp className="h-5 w-5 text-blue-500" />
              </div>
              <p className="text-xs text-gray-500">Overall performance</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white">
          <CardContent className="pt-4">
            <div className="space-y-1">
              <p className="text-sm text-gray-600">Current Streak</p>
              <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold">{metrics.currentStreak}</h2>
                <Zap className="h-5 w-5 text-blue-500" />
              </div>
              <p className="text-xs text-gray-500">Days in a row</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white">
          <CardContent className="pt-4">
            <div className="space-y-1">
              <p className="text-sm text-gray-600">Average Attempts</p>
              <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold">{metrics.averageAttempts}</h2>
                <Target className="h-5 w-5 text-blue-500" />
              </div>
              <p className="text-xs text-gray-500">Per word</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white">
          <CardContent className="pt-4">
            <div className="space-y-1">
              <p className="text-sm text-gray-600">Total Words</p>
              <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold">{metrics.totalWords}</h2>
                <BookOpen className="h-5 w-5 text-blue-500" />
              </div>
              <p className="text-xs text-gray-500">Words practiced</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-white">
        <CardContent className="pt-4">
          <h3 className="text-lg font-medium mb-4">Performance by Category</h3>
          <div className="h-64">
            <BarChart 
              width={800} 
              height={250} 
              data={metrics.performanceByType}
              className="w-full"
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="category" />
              <YAxis domain={[0, 100]} />
              <Bar
                dataKey="value"
                fill="#3B82F6"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white">
        <CardContent className="pt-4">
          <h3 className="text-lg font-medium mb-4">Recent Activity</h3>
          <div className="space-y-3">
            {metrics.recentActivity.map((activity, index) => (
              <div 
                key={index} 
                className="flex items-center justify-between py-2 border-b last:border-0"
              >
                <div>
                  <span className="font-medium">{activity.word}</span>
                  <span className="text-sm text-gray-500 ml-2">
                    ({activity.stepType})
                  </span>
                </div>
                <div className="flex items-center">
                  <span className={`px-2 py-1 rounded text-sm ${
                    activity.isSuccessful 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {activity.isSuccessful ? 'Success' : 'Retry'}
                  </span>
                  <span className="text-sm text-gray-500 ml-2">
                    {new Date(activity.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default VocabularyMetricsDashboard;