// app/questions/components/generate-questions.tsx
'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Toaster } from "@/components/ui/toaster";

export function GenerateQuestions() {
  const [loading, setLoading] = useState(false);
  const [category, setCategory] = useState('');
  const [prompt, setPrompt] = useState('');
  const { toast } = useToast();

  const generateQuestions = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          category,
          prompt,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate questions');
      }

      await response.json(); // Remove the unused data variable
      toast({
        title: "Success",
        description: "Questions generated successfully",
      });
    } catch (err) { // Rename error to err to avoid the unused variable
      console.error('Failed to generate questions:', err); // Log the error
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to generate questions",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Category</label>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger>
            <SelectValue placeholder="Select a category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Quantitative">Quantitative</SelectItem>
            <SelectItem value="Verbal">Verbal</SelectItem>
            <SelectItem value="Reading">Reading</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="space-y-2">
        <label className="text-sm font-medium">Prompt</label>
        <Textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Enter your prompt here..."
          className="h-32"
        />
      </div>
      
      <Button 
        onClick={generateQuestions} 
        disabled={loading || !category || !prompt}
        className="w-full"
      >
        {loading ? "Generating..." : "Generate Questions"}
      </Button>
      
      <Toaster />
    </div>
  );
}