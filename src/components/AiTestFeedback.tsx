import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
// Add the indicatorClassName prop to Progress
interface ProgressProps {
  value: number;
  className?: string;
  indicatorClassName?: string;
}
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Brain,
  Lightbulb,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Workflow,
  ArrowRight,
  RefreshCw
} from 'lucide-react';

// Interface for feedback data structure
interface FeedbackData {
  overallPerformance: string;
  strengths: string;
  areasForImprovement: string;
  actionableAdvice: string;
  overall: string;
  rawFeedback?: string;
}

interface AiTestFeedbackProps {
  testAttemptId: number;
  title?: string;
  showHeader?: boolean;
}

const AiTestFeedback: React.FC<AiTestFeedbackProps> = ({
  testAttemptId,
  title = "AI Teacher Feedback",
  showHeader = true
}) => {
  const [feedback, setFeedback] = useState<FeedbackData | null>(null);
  const [loading, setLoading] = useState(false);
  const [feedbackOption, setFeedbackOption] = useState<'standard' | 'growth'>('standard');
  const [loadingProgress, setLoadingProgress] = useState(45);

  // Score for the progress indicator
  const getScoreFromFeedback = (feedback: FeedbackData | null): number => {
    if (!feedback) return 0;
    const match = feedback.overallPerformance.match(/(\d+)%/);
    return match ? parseInt(match[1]) : 0;
  };

  // Function to generate feedback from API
  const generateFeedback = async () => {
    setLoading(true);
    setLoadingProgress(15);
    
    // Animation for loading progress
    const interval = setInterval(() => {
      setLoadingProgress(prev => {
        if (prev >= 90) {
          clearInterval(interval);
          return prev;
        }
        return prev + Math.floor(Math.random() * 15);
      });
    }, 600);
    
    try {
      const response = await fetch('/api/maths/generate-feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          testAttemptId,
          feedbackType: feedbackOption
        }),
      });

      clearInterval(interval);
      setLoadingProgress(100);
      
      if (!response.ok) {
        throw new Error('Failed to generate feedback');
      }

      const data = await response.json();
      setFeedback(data.feedback);
    } catch (error) {
      console.error('Error:', error);
      // Show error message instead of toast since we don't have the toast hook
      alert('Failed to generate AI feedback. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Function to regenerate feedback
  const regenerateFeedback = () => {
    setFeedback(null);
  };

  const score = getScoreFromFeedback(feedback);
  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <Card className="w-full shadow-md border-0 overflow-hidden">
      {showHeader && (
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 pb-4 border-b">
          <div className="flex items-center gap-2">
            <Brain className="h-6 w-6 text-indigo-600" />
            {title && <CardTitle className="text-indigo-800">{title}</CardTitle>}
          </div>
          <CardDescription className="text-indigo-600 opacity-90">
            Get personalized feedback on your performance from our AI teacher.
          </CardDescription>
        </CardHeader>
      )}
      
      <CardContent className={`p-6 ${!showHeader ? "pt-6" : ""}`}>
        {!feedback && !loading && (
          <div className="space-y-6">
            <div className="bg-blue-50 p-4 rounded-lg mb-2">
              <h3 className="text-sm font-medium text-blue-800 mb-2">Choose Your Feedback Type</h3>
              <RadioGroup 
                defaultValue="standard" 
                value={feedbackOption}
                onValueChange={(value) => setFeedbackOption(value as 'standard' | 'growth')}
                className="space-y-3"
              >
                <div className="flex items-start gap-3 p-3 rounded-md bg-white shadow-sm border border-blue-100">
                  <RadioGroupItem value="standard" id="standard" className="mt-1" />
                  <div>
                    <Label htmlFor="standard" className="font-medium text-blue-700">Standard Feedback</Label>
                    <p className="text-sm text-blue-600 mt-1">Detailed analysis of your performance with specific areas to improve.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-md bg-white shadow-sm border border-blue-100">
                  <RadioGroupItem value="growth" id="growth" className="mt-1" />
                  <div>
                    <Label htmlFor="growth" className="font-medium text-blue-700">Growth-Oriented Feedback</Label>
                    <p className="text-sm text-blue-600 mt-1">Positive reinforcement that focuses on your progress and learning journey.</p>
                  </div>
                </div>
              </RadioGroup>
            </div>
            
            <Button 
              onClick={generateFeedback} 
              className="w-full bg-indigo-600 hover:bg-indigo-700 h-12 text-base"
            >
              <Brain className="mr-2 h-5 w-5" />
              Generate AI Feedback
            </Button>
          </div>
        )}

        {loading && (
          <div className="space-y-4 py-8">
            <div className="flex justify-center mb-6">
              <div className="animate-pulse">
                <Brain className="h-12 w-12 text-indigo-400" />
              </div>
            </div>
            <p className="text-center text-indigo-600 font-medium">
              Analyzing your performance...
            </p>
            <p className="text-sm text-center text-indigo-400 mb-4">
              Creating personalized insights and recommendations
            </p>
            <Progress value={loadingProgress} className="h-2 bg-indigo-100" />
            <p className="text-xs text-center text-indigo-400 mt-2">
              This may take a few moments
            </p>
          </div>
        )}

        {feedback && (
          <div className="space-y-5">
            {/* Score Overview */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 mb-4 text-center">
              <div className="inline-flex items-center justify-center p-3 bg-white rounded-full shadow-sm mb-3">
                <TrendingUp className={`h-8 w-8 ${getScoreColor(score)}`} />
              </div>
              <h3 className="text-xl font-bold mb-1">
                <span className={getScoreColor(score)}>{score}%</span> Score
              </h3>
              <p className="text-indigo-700 text-sm">
                {score >= 80 ? "Excellent mastery!" : 
                 score >= 60 ? "Good progress!" : 
                 "Keep practicing!"}
              </p>
            </div>
            
            {/* Performance and Insights */}
            <div className="space-y-4">
              <section className="bg-white rounded-lg p-4 border border-indigo-100 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-5 w-5 text-indigo-600" />
                  <h3 className="font-medium text-indigo-900">Overall Performance</h3>
                </div>
                <p className="text-sm text-gray-700 pl-7">{feedback.overallPerformance}</p>
              </section>
              
              <section className="bg-white rounded-lg p-4 border border-green-100 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <h3 className="font-medium text-green-900">Strengths</h3>
                </div>
                <p className="text-sm text-gray-700 pl-7">{feedback.strengths}</p>
              </section>
              
              <section className="bg-white rounded-lg p-4 border border-amber-100 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-5 w-5 text-amber-600" />
                  <h3 className="font-medium text-amber-900">Areas for Improvement</h3>
                </div>
                <p className="text-sm text-gray-700 pl-7">{feedback.areasForImprovement}</p>
              </section>
              
              <section className="bg-white rounded-lg p-4 border border-blue-100 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <Lightbulb className="h-5 w-5 text-blue-600" />
                  <h3 className="font-medium text-blue-900">Actionable Advice</h3>
                </div>
                <p className="text-sm text-gray-700 pl-7">{feedback.actionableAdvice}</p>
              </section>
              
              <section className="bg-white rounded-lg p-4 border border-purple-100 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <Workflow className="h-5 w-5 text-purple-600" />
                  <h3 className="font-medium text-purple-900">Conclusion</h3>
                </div>
                <p className="text-sm text-gray-700 pl-7">{feedback.overall}</p>
              </section>
            </div>
            
            <div className="flex justify-between items-center pt-4">
              <div className="flex items-center">
                <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200">
                  {feedbackOption === 'standard' ? 'Standard Feedback' : 'Growth-Oriented Feedback'}
                </Badge>
              </div>
              <Button 
                variant="outline" 
                onClick={regenerateFeedback} 
                className="border-indigo-300 text-indigo-700 hover:bg-indigo-50"
              >
                <RefreshCw className="mr-1 h-4 w-4" />
                Regenerate Feedback
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AiTestFeedback;