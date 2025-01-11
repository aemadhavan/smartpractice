import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Edit2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";

interface Answer {
  id: number;
  answer: string;
  isCorrect: boolean;
  sequenceNumber: number;
}

interface QuestionData {
    id: number;
    question: string;
    category: string;
    difficultyLevel: string;
    marks: number;
    answers: Answer[];
    solutionExplanation: string;
    timeAllocation: number;
    isActive: boolean;
  }

interface QuestionEditDialogProps {
  questionId: number;
}

export function QuestionEditDialog({ questionId }: QuestionEditDialogProps) {
  const [loading, setLoading] = useState(false);
  const [questionData, setQuestionData] = useState<QuestionData | null>(null);
  const [open, setOpen] = useState(false);

  const fetchQuestionData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/questions/${questionId}`);
      const data = await response.json();
      setQuestionData(data);      
    } catch (error) {
      console.error('Error fetching question:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!questionData) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/questions/${questionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(questionData),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update question');
      }
      
      setOpen(false);
      // Optional: Add success toast notification
      window.location.reload(); // Refresh to show updated data
    } catch (error) {
      console.error('Error updating question:', error);
      // Optional: Add error toast notification
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => {
            fetchQuestionData();
            setOpen(true);
          }}
          className="flex items-center gap-2"
        >
          <Edit2 className="w-4 h-4" />
          Edit
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Edit Question</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center p-4">Loading...</div>
        ) : questionData ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Category</label>
                <Select
                  value={questionData.category}
                  onValueChange={(value: string) => 
                    setQuestionData({ ...questionData, category: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Quantitative">Quantitative</SelectItem>
                    <SelectItem value="Verbal">Verbal</SelectItem>
                    <SelectItem value="Reading">Reading</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Difficulty</label>
                <Select
                  value={questionData.difficultyLevel}
                  onValueChange={(value: string) => 
                    setQuestionData({ ...questionData, difficultyLevel: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select difficulty" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Easy">Easy</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="Hard">Hard</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Marks</label>
                <Input
                  type="number"
                  value={questionData.marks}
                  onChange={(e) => 
                    setQuestionData({ 
                      ...questionData, 
                      marks: parseInt(e.target.value) 
                    })
                  }
                  min={1}
                  max={10}
                />
              </div>
            </div>

            {/* Question Text */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Question</label>
              <Textarea
                value={questionData.question}
                onChange={(e) => 
                  setQuestionData({ ...questionData, question: e.target.value })
                }
                rows={3}
              />
            </div>

            {/* Answers */}
            <div className="space-y-4">
              <label className="text-sm font-medium">Answers</label>
              {questionData.answers.map((answer, index) => (
                <div key={answer.id} className="flex items-center gap-4">
                  <span className="font-medium min-w-[24px]">
                    {String.fromCharCode(65 + index)}
                  </span>
                  <Input
                    value={answer.answer}
                    onChange={(e) => {
                      const newAnswers = [...questionData.answers];
                      newAnswers[index] = {
                        ...answer,
                        answer: e.target.value,
                      };
                      setQuestionData({
                        ...questionData,
                        answers: newAnswers,
                      });
                    }}
                  />
                  <Button
                    type="button"
                    variant={answer.isCorrect ? "default" : "outline"}
                    onClick={() => {
                      const newAnswers = questionData.answers.map((a, i) => ({
                        ...a,
                        isCorrect: i === index,
                      }));
                      setQuestionData({
                        ...questionData,
                        answers: newAnswers,
                      });
                    }}
                  >
                    Correct Answer
                  </Button>
                </div>
              ))}
            </div>

            {/* Solution */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Solution Explanation</label>
              <Textarea
                value={questionData.solutionExplanation}
                onChange={(e) => 
                  setQuestionData({ 
                    ...questionData, 
                    solutionExplanation: e.target.value 
                  })
                }
                rows={4}
              />
            </div>

            {/* Time Allocation */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Time Allocation (seconds)</label>
              <Input
                type="number"
                value={questionData.timeAllocation}
                onChange={(e) => 
                  setQuestionData({ 
                    ...questionData, 
                    timeAllocation: parseInt(e.target.value) 
                  })
                }
                min={30}
                max={300}
                step={30}
              />
            </div>

            {/* Active Status */}
            <div className="flex items-center justify-between space-x-2">
            <label className="text-sm font-medium">Question Status</label>
            <div className="flex items-center space-x-2">
                <Switch
                checked={questionData.isActive}
                onCheckedChange={(checked) =>
                    setQuestionData({
                    ...questionData,
                    isActive: checked,
                    })
                }
                />
                <span className="text-sm text-gray-500">
                {questionData.isActive ? "Active" : "Inactive"}
                </span>
            </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <div className="text-center text-red-600">
            Failed to load question details
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}