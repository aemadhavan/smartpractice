// src/components/adaptive-learning/LearningGapsDisplay.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  BrainCircuit,
  AlertTriangle,
  CheckCircle2,
  Lightbulb,
  Loader2
} from 'lucide-react';

type LearningGap = {
  id: number;
  conceptDescription: string;
  severity: number;
  subtopicName: string;
  detectedAt: string;
  status: string;
};

interface LearningGapsDisplayProps {
  subtopicId: number;
  className?: string;
}

const LearningGapsDisplay: React.FC<LearningGapsDisplayProps> = ({ 
  subtopicId,
  className = '' 
}) => {
  const { user, isLoaded } = useUser();
  const [gaps, setGaps] = useState<LearningGap[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchGaps = async () => {
      if (!user?.id || !subtopicId) return;

      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/maths/learning-gaps?subtopicId=${subtopicId}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch learning gaps');
        }

        const data = await response.json();
        setGaps(data.gaps || []);
      } catch (err) {
        console.error('Error fetching learning gaps:', err);
        setError('Failed to load learning gaps. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    if (isLoaded && user) {
      fetchGaps();
    }
  }, [subtopicId, isLoaded, user]);

  const getSeverityColor = (severity: number) => {
    if (severity >= 8) return "bg-red-600 text-white";
    if (severity >= 5) return "bg-yellow-500 text-white";
    return "bg-indigo-500 text-white";
  };

  const getSeverityLabel = (severity: number) => {
    if (severity >= 8) return "High";
    if (severity >= 5) return "Medium";
    return "Low";
  };

  const getConceptName = (conceptDescription: string) => {
    // This is a placeholder - in a real implementation you would have better concept names
    // Try to make the concept ID more readable
    const questionTypeMap: Record<string, string> = {
      "1": "Multiple Choice",
      "2": "True/False",
      "3": "Fill in the Blank",
      "4": "Short Answer",
      "5": "Matching"
    };
    
    return questionTypeMap[conceptDescription] || 
      conceptDescription.replace(/([A-Z])/g, ' $1')
        .replace(/^./, str => str.toUpperCase())
        .trim();
  };

  if (!isLoaded || isLoading) {
    return (
      <div className={`flex justify-center items-center p-8 ${className}`}>
        <Loader2 className="h-8 w-8 animate-spin text-primary mr-2" />
        <span>Analyzing your learning patterns...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className={className}>
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (gaps.length === 0) {
    return (
      <Alert className={`${className} bg-emerald-50 border-emerald-200`}>
        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
        <AlertTitle>No Learning Gaps Detected</AlertTitle>
        <AlertDescription>
          Great job! We haven&apos;t detected any specific learning gaps in this subtopic.
          Continue practicing to maintain your knowledge.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center">
          <BrainCircuit className="h-5 w-5 mr-2 text-indigo-500" />
          Identified Learning Gaps
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {gaps.map((gap) => (
            <div key={gap.id} className="border rounded-md p-4 bg-gray-50">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-semibold text-base">
                    {getConceptName(gap.conceptDescription)}
                  </h4>
                  <p className="text-sm text-gray-500">
                    In {gap.subtopicName}
                  </p>
                </div>
                <Badge className={`${getSeverityColor(gap.severity)}`}>
                  {getSeverityLabel(gap.severity)} Priority
                </Badge>
              </div>
              <div className="mt-3 flex items-start gap-2">
                <Lightbulb className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                <p className="text-sm">
                  Based on your recent answers, this area needs more practice.
                  Focus on questions in this category to improve your mastery.
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default LearningGapsDisplay;