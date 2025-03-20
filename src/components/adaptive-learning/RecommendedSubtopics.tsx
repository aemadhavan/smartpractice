// src/components/adaptive-learning/RecommendedSubtopics.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  ArrowRight, 
  Lightbulb, 
  Target, 
  TrendingUp,
  Loader2,
  AlertTriangle
} from 'lucide-react';
import Link from 'next/link';

type RecommendedSubtopic = {
  id: number;
  name: string;
  reason: string;
};

interface RecommendedSubtopicsProps {
  topicId: number;
  className?: string;
}

const RecommendedSubtopics: React.FC<RecommendedSubtopicsProps> = ({ 
  topicId,
  className = '' 
}) => {
  const { user, isLoaded } = useUser();
  const [recommendations, setRecommendations] = useState<RecommendedSubtopic[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [adaptiveEnabled, setAdaptiveEnabled] = useState(true);

  useEffect(() => {
    const fetchRecommendations = async () => {
      if (!user?.id || !topicId) return;

      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/maths/recommendations?topicId=${topicId}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch recommendations');
        }

        const data = await response.json();
        setRecommendations(data.recommendedSubtopics || []);
        setAdaptiveEnabled(data.hasAdaptiveLearningEnabled);
      } catch (err) {
        console.error('Error fetching recommendations:', err);
        setError('Failed to load recommendations. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    if (isLoaded && user) {
      fetchRecommendations();
    }
  }, [topicId, isLoaded, user]);

  const getReasonIcon = (reason: string) => {
    if (reason.includes('gap')) return <Target className="h-4 w-4 text-red-500" />;
    if (reason.includes('mastery')) return <TrendingUp className="h-4 w-4 text-amber-500" />;
    return <Lightbulb className="h-4 w-4 text-indigo-500" />;
  };

  if (!isLoaded || isLoading) {
    return (
      <Card className={className}>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center">
            <Lightbulb className="h-5 w-5 mr-2 text-amber-500" />
            Recommended Next Steps
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center items-center p-6">
            <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" />
            <span>Analyzing your learning progress...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center">
            <Lightbulb className="h-5 w-5 mr-2 text-amber-500" />
            Recommended Next Steps
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center text-red-600 p-2">
            <AlertTriangle className="h-4 w-4 mr-2" />
            {error}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!adaptiveEnabled) {
    return (
      <Card className={className}>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center">
            <Lightbulb className="h-5 w-5 mr-2 text-amber-500" />
            Recommended Next Steps
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-2 text-gray-600">
            <p>Adaptive learning is currently disabled. Enable it in settings to get personalized recommendations.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (recommendations.length === 0) {
    return (
      <Card className={className}>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center">
            <Lightbulb className="h-5 w-5 mr-2 text-amber-500" />
            Recommended Next Steps
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-2 text-gray-600 flex items-center">
            <Lightbulb className="h-4 w-4 mr-2 text-indigo-500" />
            <p>Keep exploring different subtopics to get personalized recommendations.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center">
          <Lightbulb className="h-5 w-5 mr-2 text-amber-500" />
          Recommended Next Steps
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {recommendations.map((rec) => (
            <div key={rec.id} className="border rounded-md p-3 bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getReasonIcon(rec.reason)}
                  <span className="font-medium">{rec.name}</span>
                </div>
                <Link href={`/maths/topics/${rec.id}/questions`}>
                  <Button size="sm" variant="outline" className="h-8">
                    Practice <ArrowRight className="ml-1 h-3 w-3" />
                  </Button>
                </Link>
              </div>
              <p className="text-sm text-gray-600 mt-1 ml-6">{rec.reason}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default RecommendedSubtopics;