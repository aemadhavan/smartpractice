// src/components/AiTestFeedback.tsx
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useToast } from "@/hooks/use-toast";

// Interface matching the backend response
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
  title?: string; // Optional title prop to control display
  showHeader?: boolean; // Control whether to show the card header
}

export function AiTestFeedback({ 
  testAttemptId, 
  title = "AI Teacher Feedback", 
  showHeader = true 
}: AiTestFeedbackProps) {
  const [feedback, setFeedback] = useState<FeedbackData | null>(null);
  const [loading, setLoading] = useState(false);
  const [feedbackOption, setFeedbackOption] = useState<'standard' | 'growth'>('standard');
  const { toast } = useToast();

  const generateFeedback = async () => {
    setLoading(true);
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

      if (!response.ok) {
        throw new Error('Failed to generate feedback');
      }

      const data = await response.json();
      setFeedback(data.feedback);
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate AI feedback. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full">
      {showHeader && (
        <CardHeader className="pb-2">
          {title && <CardTitle>{title}</CardTitle>}
          <CardDescription>
            Get personalized feedback on your performance from our AI teacher.
          </CardDescription>
        </CardHeader>
      )}
      <CardContent className={!showHeader ? "pt-4" : ""}>
        {!feedback && !loading && (
          <div className="space-y-6">
            <RadioGroup 
              defaultValue="standard" 
              value={feedbackOption}
              onValueChange={(value) => setFeedbackOption(value as 'standard' | 'growth')}
              className="space-y-3"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="standard" id="standard" />
                <Label htmlFor="standard">Standard Feedback</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="growth" id="growth" />
                <Label htmlFor="growth">Growth-Oriented Feedback</Label>
              </div>
            </RadioGroup>
            
            <Button onClick={generateFeedback} className="w-full">
              Generate AI Feedback
            </Button>
          </div>
        )}

        {loading && (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Generating your personalized feedback...</p>
            <Progress value={45} className="h-2" />
          </div>
        )}

        {feedback && (
          <div className="space-y-4">
            {feedback.rawFeedback ? (
              <div className="whitespace-pre-line text-sm">{feedback.rawFeedback}</div>
            ) : (
              <div className="space-y-3">
                <section>
                  <h3 className="font-medium text-base">Overall Performance</h3>
                  <p className="text-sm">{feedback.overallPerformance}</p>
                </section>
                <Separator />
                <section>
                  <h3 className="font-medium text-base">Strengths</h3>
                  <p className="text-sm">{feedback.strengths}</p>
                </section>
                <Separator />
                <section>
                  <h3 className="font-medium text-base">Areas for Improvement</h3>
                  <p className="text-sm">{feedback.areasForImprovement}</p>
                </section>
                <Separator />
                <section>
                  <h3 className="font-medium text-base">Actionable Advice</h3>
                  <p className="text-sm">{feedback.actionableAdvice}</p>
                </section>
                <Separator />
                <section>
                  <h3 className="font-medium text-base">Conclusion</h3>
                  <p className="text-sm">{feedback.overall}</p>
                </section>
              </div>
            )}
            <Separator />
            <div className="flex justify-end">
              <Button variant="outline" onClick={() => setFeedback(null)}>
                Regenerate Feedback
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}