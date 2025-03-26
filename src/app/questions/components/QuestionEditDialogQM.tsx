// src/app/questions/components/QuestionEditDialogQM.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { X } from 'lucide-react';

type Option = {
  id: string;
  text: string;
};

type Question = {
  id: number;
  practiceArea: string;
  topicId: number;
  subtopicId: number;
  question: string;
  options: Option[];
  correctAnswer: string;
  formula: string;
  explanation: string;
  timeAllocation: number;
  isActive: boolean;
  isReviewed: boolean;
  createdBy?: number;
};

type Topic = {
  id: number;
  name: string;
};

type Subtopic = {
  id: number;
  name: string;
  topicId: number;
};

interface QuestionEditDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (question: Question) => void;
  question?: Question;
}

const QuestionEditDialogQM: React.FC<QuestionEditDialogProps> = ({
  isOpen,
  onClose,
  onSave,
  question,
}) => {
  // Practice areas options
  const practiceAreas = ['Maths', 'Quantitative'];

  // State for form
  const [formData, setFormData] = useState<Question>({
    id: 0,
    practiceArea: 'Quantitative',
    topicId: 0,
    subtopicId: 0,
    question: '',
    options: [],
    correctAnswer: '',
    formula: '',
    explanation: '',
    timeAllocation: 60,
    isActive: true,
    isReviewed: false,
  });

  // State for topics and subtopics
  const [topics, setTopics] = useState<Topic[]>([]);
  const [subtopics, setSubtopics] = useState<Subtopic[]>([]);
  const [loading, setLoading] = useState(false);

  // JSON string for options
  const [optionsJson, setOptionsJson] = useState('');

  // Fetch topics when practice area changes
  const fetchTopics = useCallback(async () => {
    if (!formData.practiceArea) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/questions/practice-area?practiceArea=${formData.practiceArea}&dataType=topics`);
      if (!response.ok) throw new Error('Failed to fetch topics');
      
      const data = await response.json();
      setTopics(data.topics);
      // Reset topic and subtopic if changing practice area
      if (!question || formData.practiceArea !== question.practiceArea) {
        setFormData(prev => ({
          ...prev,
          topicId: data.topics[0]?.id || 0,
          subtopicId: 0
        }));
      }
    } catch (error) {
      console.error('Error fetching topics:', error);
    } finally {
      setLoading(false);
    }
  }, [formData.practiceArea, question]);

  // Fetch subtopics when topic changes
  const fetchSubtopics = useCallback(async () => {
    if (!formData.topicId) return;
    
    setLoading(true);
    try {
      const response = await fetch(
        `/api/questions/practice-area?practiceArea=${formData.practiceArea}&topicId=${formData.topicId}&dataType=subtopics`
      );
      if (!response.ok) throw new Error('Failed to fetch subtopics');
      
      const data = await response.json();
      setSubtopics(data.subtopics);
      // Set first subtopic as default if changing topic
      if (!question || formData.topicId !== question.topicId) {
        setFormData(prev => ({
          ...prev,
          subtopicId: data.subtopics[0]?.id || 0
        }));
      }
    } catch (error) {
      console.error('Error fetching subtopics:', error);
    } finally {
      setLoading(false);
    }
  }, [formData.topicId, formData.practiceArea, question]);

  // Load existing question data if editing
  useEffect(() => {
    if (question) {
      setFormData(question);
      setOptionsJson(JSON.stringify(question.options, null, 2));
    }
  }, [question]);

  // Trigger topic fetch when practice area changes
  useEffect(() => {
    fetchTopics();
  }, [fetchTopics]);

  // Trigger subtopic fetch when topic changes
  useEffect(() => {
    fetchSubtopics();
  }, [fetchSubtopics]);

  const handleChange = (field: keyof Question, value: unknown) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleOptionsChange = (value: string) => {
    setOptionsJson(value);
    try {
      const parsedOptions = JSON.parse(value);
      if (Array.isArray(parsedOptions)) {
        setFormData(prev => ({
          ...prev,
          options: parsedOptions
        }));
      }
    } catch {
      // Invalid JSON, don't update options
    }
  };

  const handleSubmit = () => {
    // Basic validation
    if (!formData.question || !formData.correctAnswer || formData.options.length === 0) {
      alert('Please fill in all required fields');
      return;
    }
    
    // Make sure we have the correct data types
    const questionToSave = {
      ...formData,
      topicId: Number(formData.topicId),
      subtopicId: Number(formData.subtopicId),
      timeAllocation: Number(formData.timeAllocation),
      // Ensure createdBy is set (you should replace this with the actual user ID)
      createdBy: formData.createdBy || 1,
    };
    
    onSave(questionToSave);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="flex flex-row justify-between items-center">
          <DialogTitle>Edit Question</DialogTitle>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          {/* Practice Area */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="practiceArea" className="text-right">
              Practice Area
            </Label>
            <div className="col-span-3">
              <Select
                value={formData.practiceArea}
                onValueChange={(value) => handleChange('practiceArea', value)}
              >
                <SelectTrigger id="practiceArea">
                  <SelectValue placeholder="Select practice area" />
                </SelectTrigger>
                <SelectContent>
                  {practiceAreas.map((area) => (
                    <SelectItem key={area} value={area}>
                      {area}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Topic */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="topic" className="text-right">
              Topic
            </Label>
            <div className="col-span-3">
              <Select
                value={formData.topicId.toString()}
                onValueChange={(value) => handleChange('topicId', parseInt(value))}
                disabled={loading || topics.length === 0}
              >
                <SelectTrigger id="topic">
                  <SelectValue placeholder="Select topic" />
                </SelectTrigger>
                <SelectContent>
                  {topics.map((topic) => (
                    <SelectItem key={topic.id} value={topic.id.toString()}>
                      {topic.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Subtopic */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="subtopic" className="text-right">
              Subtopic
            </Label>
            <div className="col-span-3">
              <Select
                value={formData.subtopicId.toString()}
                onValueChange={(value) => handleChange('subtopicId', parseInt(value))}
                disabled={loading || subtopics.length === 0}
              >
                <SelectTrigger id="subtopic">
                  <SelectValue placeholder="Select subtopic" />
                </SelectTrigger>
                <SelectContent>
                  {subtopics.map((subtopic) => (
                    <SelectItem key={subtopic.id} value={subtopic.id.toString()}>
                      {subtopic.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Question */}
          <div className="grid grid-cols-4 items-start gap-4">
            <Label htmlFor="question" className="text-right pt-2">
              Question
            </Label>
            <div className="col-span-3">
              <Textarea
                id="question"
                value={formData.question}
                onChange={(e) => handleChange('question', e.target.value)}
                rows={3}
              />
            </div>
          </div>
          
          {/* Answers (JSON format) */}
          <div className="grid grid-cols-4 items-start gap-4">
            <Label htmlFor="options" className="text-right pt-2">
              Answers (JSON format)
            </Label>
            <div className="col-span-3">
              <Textarea
                id="options"
                value={optionsJson}
                onChange={(e) => handleOptionsChange(e.target.value)}
                rows={4}
                className="font-mono text-sm"
              />
            </div>
          </div>
          
          {/* Correct Answer */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="correctAnswer" className="text-right">
              Correct Answer
            </Label>
            <div className="col-span-3">
              <Input
                id="correctAnswer"
                value={formData.correctAnswer}
                onChange={(e) => handleChange('correctAnswer', e.target.value)}
              />
            </div>
          </div>
          
          {/* Formula */}
          <div className="grid grid-cols-4 items-start gap-4">
            <Label htmlFor="formula" className="text-right pt-2">
              Formula
            </Label>
            <div className="col-span-3">
              <Textarea
                id="formula"
                value={formData.formula}
                onChange={(e) => handleChange('formula', e.target.value)}
                rows={2}
              />
            </div>
          </div>
          
          {/* Solution Explanation */}
          <div className="grid grid-cols-4 items-start gap-4">
            <Label htmlFor="explanation" className="text-right pt-2">
              Solution Explanation
            </Label>
            <div className="col-span-3">
              <Textarea
                id="explanation"
                value={formData.explanation}
                onChange={(e) => handleChange('explanation', e.target.value)}
                rows={3}
              />
            </div>
          </div>
          
          {/* Time Allocation (seconds) */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="timeAllocation" className="text-right">
              Time Allocation (seconds)
            </Label>
            <div className="col-span-3">
              <Input
                id="timeAllocation"
                type="number"
                value={formData.timeAllocation}
                onChange={(e) => handleChange('timeAllocation', parseInt(e.target.value))}
                min={1}
              />
            </div>
          </div>
          
          {/* Active */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Active</Label>
            <div className="col-span-3 flex items-center">
              <Checkbox
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => handleChange('isActive', checked)}
              />
            </div>
          </div>
          
          {/* Reviewed */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Reviewed</Label>
            <div className="col-span-3 flex items-center">
              <Checkbox
                id="isReviewed"
                checked={formData.isReviewed}
                onCheckedChange={(checked) => handleChange('isReviewed', checked)}
              />
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default QuestionEditDialogQM;