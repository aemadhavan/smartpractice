'use client';
// app/questions/components/question-bank.tsx
import { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { QuestionActions } from './question-actions'

interface Question {
  id: number;
  question: string;
  category: string;
  difficultyLevel: string;
  marks: number;
}

export function QuestionBank() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [difficultyFilter, setDifficultyFilter] = useState<string>('all');

  useEffect(() => {
    fetchQuestions();
  }, [categoryFilter, difficultyFilter]);

  const fetchQuestions = async () => {
    try {
      const params = new URLSearchParams();
      if (categoryFilter !== 'all') params.append('category', categoryFilter);
      if (difficultyFilter !== 'all') params.append('difficulty', difficultyFilter);

      const response = await fetch(`/api/questions?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch questions');
      
      const data = await response.json();
      setQuestions(data);
    } catch (error) {
      console.error('Error fetching questions:', error);
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setCategoryFilter('all');
    setDifficultyFilter('all');
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-4">
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="Quantitative">Quantitative</SelectItem>
            <SelectItem value="Verbal">Verbal</SelectItem>
            <SelectItem value="Reading">Reading</SelectItem>
          </SelectContent>
        </Select>

        <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by difficulty" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Difficulties</SelectItem>
            <SelectItem value="Easy">Easy</SelectItem>
            <SelectItem value="Medium">Medium</SelectItem>
            <SelectItem value="Hard">Hard</SelectItem>
          </SelectContent>
        </Select>

        <Button 
          variant="outline" 
          onClick={clearFilters}
        >
          Clear Filters
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Question</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Difficulty</TableHead>
              <TableHead>Marks</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : questions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center">
                  No questions found
                </TableCell>
              </TableRow>
            ) : (
              questions.map((question) => (
                <TableRow key={question.id}>
                  <TableCell className="font-medium">{question.question}</TableCell>
                  <TableCell>{question.category}</TableCell>
                  <TableCell>{question.difficultyLevel}</TableCell>
                  <TableCell>{question.marks}</TableCell>                    
                  <TableCell>
                    <QuestionActions questionId={question.id} />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}