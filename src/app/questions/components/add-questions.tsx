'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Check, AlertCircle } from "lucide-react";

interface MathQuestion {
  topic: number;
  subtopic: number;
  questionType: number;
  difficultyLevel: number;
  question: string;
  options: Array<{id: string; text: string}>;
  correctAnswer: string;
  explanation: string;
  formula?: string;
  timeAllocation: number;
}

export function AddQuestions() {
  const [file, setFile] = useState<File | null>(null);
  const [tableName, setTableName] = useState<string>('');
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [previewData, setPreviewData] = useState<MathQuestion[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      // Preview the JSON data
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const jsonData = JSON.parse(event.target?.result as string);
          setPreviewData(jsonData.slice(0, 3)); // Preview first 3 questions
          setErrorMessage('');
        } catch {
          setErrorMessage('Invalid JSON file. Please check the file format.');
          setPreviewData([]);
        }
      };
      reader.readAsText(selectedFile);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!file) {
      setErrorMessage('Please select a JSON file');
      return;
    }

    if (!tableName) {
      setErrorMessage('Please enter a table name');
      return;
    }

    setIsUploading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const reader = new FileReader();
      
      reader.onload = async (event) => {
        try {
          const jsonData = JSON.parse(event.target?.result as string);
          
          // Validate JSON structure
          if (!Array.isArray(jsonData)) {
            throw new Error('JSON file must contain an array of questions');
          }

          // Make API call to the backend
          const response = await fetch('/api/questions/add', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              tableName,
              questions: jsonData
            }),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to add questions');
          }

          const data = await response.json();
          setSuccessMessage(`Successfully added ${data.count} questions to ${tableName}`);
          setFile(null);
          setTableName('');
          setPreviewData([]);
        } catch (err) {
          setErrorMessage((err as Error).message || 'Error processing JSON file');
        } finally {
          setIsUploading(false);
        }
      };

      reader.readAsText(file);
    } catch (err) {
      setErrorMessage((err as Error).message || 'An unexpected error occurred');
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          <div className="grid w-full max-w-sm items-center gap-1.5">
            <div className="text-sm font-medium mb-1">Table Name</div>
            <Input 
              id="tableName" 
              value={tableName}
              onChange={(e) => setTableName(e.target.value)}
              placeholder="Enter table name"
              required
            />
          </div>
          
          <div className="grid w-full max-w-sm items-center gap-1.5">
            <div className="text-sm font-medium mb-1">Upload JSON File</div>
            <div className="flex items-center gap-2">
              <Input
                id="jsonFile"
                type="file"
                accept=".json"
                onChange={handleFileChange}
                className="cursor-pointer"
              />
            </div>
            <p className="text-sm text-muted-foreground">
              Upload a JSON file containing question data
            </p>
          </div>

          {errorMessage && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          )}

          {successMessage && (
            <Alert variant="default" className="bg-green-50 text-green-800 border-green-200">
              <Check className="h-4 w-4" />
              <AlertTitle>Success</AlertTitle>
              <AlertDescription>{successMessage}</AlertDescription>
            </Alert>
          )}

          <Button 
            type="submit" 
            disabled={isUploading || !file || !tableName}
            className="w-full max-w-sm"
          >
            {isUploading ? 'Processing...' : 'Add Questions'}
          </Button>
        </div>
      </form>

      {previewData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Preview</CardTitle>
            <CardDescription>Showing {previewData.length} of {file ? 'many' : 0} questions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {previewData.map((question, index) => (
                <div key={index} className="border p-3 rounded-md">
                  <h4 className="font-medium">Question {index + 1}</h4>
                  <p className="text-sm mt-1">{question.question}</p>
                  <div className="mt-2 text-sm text-muted-foreground">
                    Topic: {question.topic}, Subtopic: {question.subtopic}, 
                    Difficulty: {question.difficultyLevel}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
          <CardFooter>
            <p className="text-sm text-muted-foreground">
              Preview shows only basic question information. Full data will be imported.
            </p>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}