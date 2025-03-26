// src/app/questions/components/question-bank-qm.tsx

import React, { useState, useEffect } from 'react';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Loader2, Plus } from 'lucide-react';
import QuestionEditDialogQM from './QuestionEditDialogQM';

// Types
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
};

type Topic = {
  id: number;
  name: string;
  description: string;
};

type Subtopic = {
  id: number;
  name: string;
  description: string;
  topicId: number;
};

// Type for the API response of questions
type QuestionApiResponse = {
  questions: Array<Omit<Question, 'practiceArea'>>;
};

// Type for error response
type ErrorResponse = {
  error: string;
};

const QuestionBankQM = () => {
  // State for dropdowns
  const [practiceArea, setPracticeArea] = useState<string>('');
  const [topics, setTopics] = useState<Topic[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<string>('');
  const [subtopics, setSubtopics] = useState<Subtopic[]>([]);
  const [selectedSubtopic, setSelectedSubtopic] = useState<string>('');
  
  // State for questions and loading
  const [questions, setQuestions] = useState<Question[]>([]);
  const [topicsLoading, setTopicsLoading] = useState<boolean>(false);
  const [subtopicsLoading, setSubtopicsLoading] = useState<boolean>(false);
  const [questionsLoading, setQuestionsLoading] = useState<boolean>(false);

  // State for the edit dialog
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState<Question | undefined>(undefined);

  // Practice areas options
  const practiceAreas = ['Maths', 'Quantitative'];

  // Fetch topics when practice area changes
  useEffect(() => {
    if (!practiceArea) return;
    
    const fetchTopics = async () => {
      setTopicsLoading(true);
      try {
        const response = await fetch(`/api/questions/practice-area?practiceArea=${practiceArea}&dataType=topics`);
        if (!response.ok) throw new Error('Failed to fetch topics');
        
        const data = await response.json();
        setTopics(data.topics);
        setSelectedTopic('');
        setSubtopics([]);
        setSelectedSubtopic('');
      } catch (error) {
        console.error('Error fetching topics:', error);
      } finally {
        setTopicsLoading(false);
      }
    };

    fetchTopics();
  }, [practiceArea]);

  // Fetch subtopics when topic changes
  useEffect(() => {
    if (!selectedTopic || !practiceArea) return;
    
    const fetchSubtopics = async () => {
      setSubtopicsLoading(true);
      try {
        const response = await fetch(`/api/questions/practice-area?practiceArea=${practiceArea}&topicId=${selectedTopic}&dataType=subtopics`);
        if (!response.ok) throw new Error('Failed to fetch subtopics');
        
        const data = await response.json();
        setSubtopics(data.subtopics);
        setSelectedSubtopic('');
      } catch (error) {
        console.error('Error fetching subtopics:', error);
      } finally {
        setSubtopicsLoading(false);
      }
    };

    fetchSubtopics();
  }, [selectedTopic, practiceArea]);

  // Fetch questions when filters change
  useEffect(() => {
    if (!practiceArea) return;
    
    const fetchQuestions = async () => {
      setQuestionsLoading(true);
      try {
        let url = `/api/questions/practice-area?practiceArea=${practiceArea}`;
        
        if (selectedTopic) {
          url += `&topicId=${selectedTopic}`;
        }
        
        if (selectedSubtopic) {
          url += `&subtopicId=${selectedSubtopic}`;
        }
        
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch questions');
        
        const data = response.json() as Promise<QuestionApiResponse>;
        const apiData = await data;
        
        // Add practiceArea to each question
        const questionsWithArea: Question[] = apiData.questions.map(q => ({
          ...q,
          practiceArea
        }));
        setQuestions(questionsWithArea);
      } catch (error) {
        console.error('Error fetching questions:', error);
      } finally {
        setQuestionsLoading(false);
      }
    };

    fetchQuestions();
  }, [practiceArea, selectedTopic, selectedSubtopic]);

  // Clear filters handler
  const handleClearFilters = () => {
    setPracticeArea('');
    setSelectedTopic('');
    setSelectedSubtopic('');
    setTopics([]);
    setSubtopics([]);
    setQuestions([]);
  };

  // Open dialog to add a new question
  const handleAddQuestion = () => {
    setCurrentQuestion(undefined);
    setIsEditDialogOpen(true);
  };

  // Open dialog to edit an existing question
  const handleEditQuestion = (question: Question) => {
    setCurrentQuestion(question);
    setIsEditDialogOpen(true);
  };

  // Handle saving a question
  const handleSaveQuestion = async (question: Question) => {
    try {
      // Show loading state
      setQuestionsLoading(true);
      
      // Call the API to save the question
      const response = await fetch('/api/questions/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(question),
      });
      
      if (!response.ok) {
        const errorData = await response.json() as ErrorResponse;
        throw new Error(errorData.error || 'Failed to save question');
      }
      
      const result = await response.json();
      setIsEditDialogOpen(false);
      
      // Refresh the questions list to show the updated data
      // We'll reuse the existing filter logic to reload questions
      const url = `/api/questions/practice-area?practiceArea=${practiceArea}${
        selectedTopic ? `&topicId=${selectedTopic}` : ''
      }${
        selectedSubtopic ? `&subtopicId=${selectedSubtopic}` : ''
      }`;
      
      const refreshResponse = await fetch(url);
      if (!refreshResponse.ok) throw new Error('Failed to refresh questions');
      
      const refreshData = await refreshResponse.json() as QuestionApiResponse;
      // Add practiceArea to each question
      const questionsWithArea: Question[] = refreshData.questions.map(q => ({
        ...q,
        practiceArea
      }));
      setQuestions(questionsWithArea);
      
      // Show success message (you might want to add a toast notification here)
      console.log(result.message);
    } catch (error) {
      console.error('Error saving question:', error);
      // Show error message (you might want to add a toast notification here)
    } finally {
      setQuestionsLoading(false);
    }
  };

  // Rest of the component remains the same as in the previous implementation
  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Question Bank</h1>
        <Button onClick={handleAddQuestion}>
          <Plus className="h-4 w-4 mr-2" />
          Add Question
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Practice Area Dropdown */}
        <div>
          <Select
            value={practiceArea}
            onValueChange={setPracticeArea}
          >
            <SelectTrigger>
              <SelectValue placeholder="All Practice Areas" />
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
        
        {/* Topics Dropdown */}
        <div>
          <Select
            value={selectedTopic}
            onValueChange={setSelectedTopic}
            disabled={!practiceArea || topicsLoading}
          >
            <SelectTrigger>
              {topicsLoading ? (
                <div className="flex items-center">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  <span>Loading topics...</span>
                </div>
              ) : (
                <SelectValue placeholder="All Topics" />
              )}
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
        
        {/* Subtopics Dropdown */}
        <div>
          <Select
            value={selectedSubtopic}
            onValueChange={setSelectedSubtopic}
            disabled={!selectedTopic || subtopicsLoading}
          >
            <SelectTrigger>
              {subtopicsLoading ? (
                <div className="flex items-center">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  <span>Loading subtopics...</span>
                </div>
              ) : (
                <SelectValue placeholder="All Subtopics" />
              )}
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
      
      {/* Clear Filters Button */}
      <Button 
        variant="outline" 
        onClick={handleClearFilters}
        className="mb-6"
      >
        Clear Filters
      </Button>
      
      {/* Questions Table */}
      {questionsLoading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin mr-2" />
          <span>Loading questions...</span>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Question</TableHead>
              <TableHead>Topic</TableHead>
              <TableHead>Subtopic</TableHead>
              <TableHead>Is Reviewed</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {questions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-4">
                  {practiceArea ? 'No questions found. Try adjusting your filters.' : 'Select a practice area to view questions.'}
                </TableCell>
              </TableRow>
            ) : (
              questions.map((question) => (
                <TableRow key={question.id}>
                  <TableCell className="font-medium">{question.question}</TableCell>
                  <TableCell>
                    {topics.find(t => t.id === question.topicId)?.name || '-'}
                  </TableCell>
                  <TableCell>
                    {subtopics.find(s => s.id === question.subtopicId)?.name || '-'}
                  </TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${question.isReviewed ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                      {question.isReviewed ? 'Yes' : 'No'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleEditQuestion(question)}
                      >
                        Edit
                      </Button>
                      <Button variant="outline" size="sm" className="text-red-500">Delete</Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      )}
      
      {/* Edit Question Dialog */}
      <QuestionEditDialogQM
        isOpen={isEditDialogOpen}
        onClose={() => setIsEditDialogOpen(false)}
        onSave={handleSaveQuestion}
        question={currentQuestion}
      />
    </div>
  );
};

export default QuestionBankQM;