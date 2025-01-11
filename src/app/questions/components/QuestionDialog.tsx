import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";

interface QuestionDetails {
  id: number;
  question: string;
  category: string;
  difficultyLevel: string;
  marks: number;
  answers: {
    id: number;
    answer: string;
    isCorrect: boolean;
    sequenceNumber: number;
  }[];
  solutionExplanation: string;
  timeAllocation: number;
  isActive: boolean;
}

interface QuestionDialogProps {
  questionId: number;
}

export function QuestionDialog({ questionId }: QuestionDialogProps) {
  const [questionDetails, setQuestionDetails] = useState<QuestionDetails | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchQuestionDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/questions/${questionId}`);
      if (!response.ok) throw new Error('Failed to fetch question details');
      const data = await response.json();
      setQuestionDetails(data);
    } catch (error) {
      console.error('Error fetching question details:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm"
          onClick={fetchQuestionDetails}
        >
          View Details
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Question Details</DialogTitle>
        </DialogHeader>
        
        {loading ? (
          <div className="flex justify-center p-4">Loading...</div>
        ) : questionDetails ? (
          <div className="space-y-6">
            {/* Question Info - Grid Layout */}
            <div className="grid grid-cols-4 gap-4">
              <div>
                <h3 className="text-sm font-medium mb-1">Category</h3>
                <p>{questionDetails.category}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium mb-1">Difficulty</h3>
                <p>{questionDetails.difficultyLevel}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium mb-1">Marks</h3>
                <p>{questionDetails.marks}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium mb-1">Status</h3>
                <Badge 
                  variant={questionDetails.isActive ? "default" : "secondary"}
                  className="font-normal"
                >
                  {questionDetails.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>
            </div>

            {/* Rest of the component remains the same */}
            
            {/* Question */}
            <div>
              <h3 className="text-sm font-medium mb-1">Question</h3>
              <p className="text-lg">{questionDetails.question}</p>
            </div>

            {/* Answers */}
            <div>
              <h3 className="text-sm font-medium mb-3">Answers</h3>
              <div className="space-y-3">
                {questionDetails.answers.map((answer) => (
                  <div key={answer.id} className="flex items-center justify-between border-b pb-2">
                    <div className="flex items-center gap-4">
                      <span className="font-medium min-w-[24px]">
                        {String.fromCharCode(64 + answer.sequenceNumber)}
                      </span>
                      <span>{answer.answer}</span>
                    </div>
                    {answer.isCorrect && (
                      <div className="flex items-center text-green-600 gap-1">
                        <Check className="w-4 h-4" />
                        <span>Correct</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Solution */}
            <div>
              <h3 className="text-sm font-medium mb-1">Solution Explanation</h3>
              <p className="text-gray-700">{questionDetails.solutionExplanation}</p>
            </div>

            {/* Time Allocation */}
            <div>
              <h3 className="text-sm font-medium mb-1">Time Allocation</h3>
              <p>{questionDetails.timeAllocation} seconds</p>
            </div>
          </div>
        ) : (
          <div className="text-center text-red-600">Failed to load question details</div>
        )}
      </DialogContent>
    </Dialog>
  );
}