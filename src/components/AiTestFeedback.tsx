// src/components/AiTestFeedback.tsx
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { useToast } from "@/hooks/use-toast"

interface AiTestFeedbackProps {
  testAttemptId: number;
}

export function AiTestFeedback({ testAttemptId }: AiTestFeedbackProps) {
  const [feedback, setFeedback] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const generateFeedback = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/maths/generate-feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ testAttemptId: testAttemptId }),
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
      <CardHeader>
        <CardTitle>AI Teacher Feedback</CardTitle>
        <CardDescription>
          Get personalized feedback on your performance from our AI teacher.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!feedback && !loading && (
          <Button onClick={generateFeedback} className="w-full">
            Generate AI Feedback
          </Button>
        )}

        {loading && (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Generating your personalized feedback...</p>
            <Progress value={45} className="h-2" />
          </div>
        )}

        {feedback && (
          <div className="space-y-4">
            <div className="whitespace-pre-line text-sm">{feedback}</div>
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