//src/app/vocabulary/components/VocabularyTest.tsx

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, XCircle, HelpCircle, ArrowRight, Trophy } from 'lucide-react';

interface VocabularyWord {
  id: number;
  word: string;
  definition: string;
  synonyms: string;
  antonyms: string;
  partOfSpeech: string;
  sentence: string;
}

interface TestProps {
  word: VocabularyWord;
  userId: string; // Changed to string for Clerk GUID
  onComplete: () => void;
  onClose: () => void;
}

type TestStep = 'definition' | 'usage' | 'synonym' | 'antonym';

const VocabularyTest: React.FC<Partial<TestProps>> = ({ 
  word = {
    id: 0,
    word: '',
    definition: '',
    synonyms: '',
    antonyms: '',
    partOfSpeech: '',
    sentence: ''
  },
  userId = 0,
  onComplete = () => {}, 
  onClose = () => {} 
}) => {
  const [currentStep, setCurrentStep] = useState<TestStep>('definition');
  const [answers, setAnswers] = useState({
    definition: '',
    usage: '',
    synonym: '',
    antonym: '',
  });
  const [startTime, setStartTime] = useState<Date>(new Date());
  const [showHint, setShowHint] = useState(false);
  const [error, setError] = useState('');
  const [isCorrect, setIsCorrect] = useState(false);
  const [showCongrats, setShowCongrats] = useState(false);

  const steps: TestStep[] = ['definition', 'usage', 'synonym', 'antonym'];
  const currentStepIndex = steps.indexOf(currentStep);

  useEffect(() => {
    setStartTime(new Date());
  }, [currentStep]);

  const trackAttempt = async (step: TestStep, isSuccessful: boolean) => {
    try {
        const timeSpent = Math.round((new Date().getTime() - startTime.getTime()) / 1000);
        
        // First track the attempt
        const response = await fetch('/api/vocabulary/track-attempt', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                vocabularyId: word.id,
                stepType: step,
                isSuccessful,
                response: answers[step],
                timeSpent,
            }),
        });

        if (!response.ok) {
            throw new Error('Failed to track attempt');
        }

        // If successful, update mastery
        if (isSuccessful) {
            await updateMasteryProgress(step, isSuccessful);
        }
    } catch (error) {
        console.error('Error tracking attempt:', error);
    }
};

const updateMasteryProgress = async (step: TestStep, isSuccessful: boolean) => {
  try {
      const response = await fetch('/api/vocabulary/update-mastery', {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
          },
          body: JSON.stringify({
              vocabularyId: word.id,
              stepType: step,
              isSuccessful
          }),
      });

      if (!response.ok) {
          const errorData = await response.json();
          console.error('Mastery update failed:', errorData);
          throw new Error(`Failed to update mastery: ${response.status}`);
      }
  } catch (error) {
      console.error('Error updating mastery:', error);
  }
};

const updateStreak = async () => {
  try {
      const response = await fetch('/api/vocabulary/update-streak', {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json'
          }
      });

      if (!response.ok) {
          const errorData = await response.json();
          console.error('Streak update failed:', errorData);
          throw new Error(`Failed to update streak: ${response.status}`);
      }

      const data = await response.json();
      console.log('Streak updated successfully:', data);
  } catch (error) {
      console.error('Error updating streak:', error);
  }
};

  const hints = {
    definition: `Try to explain what "${word.word}" means in your own words. Think about its core meaning.`,
    usage: `Create a sentence that clearly shows you understand how to use "${word.word}".`,
    synonym: `What word means the same as "${word.word}"? ${word.synonyms ? `Think about: ${word.synonyms.split(',')[0]}` : ''}`,
    antonym: `What word means the opposite of "${word.word}"? ${word.antonyms ? `Think about: ${word.antonyms.split(',')[0]}` : ''}`,
  };

  const validateAnswer = async (step: TestStep, answer: string): Promise<boolean> => {
    setError('');
    setIsCorrect(false);
    
    let isValid = false;
    switch (step) {
      case 'definition':
        const keyWords = word.definition
          .toLowerCase()
          .split(' ')
          .filter(word => word.length > 4);
        const hasKeyWords = keyWords.some(keyword =>
          answer.toLowerCase().includes(keyword)
        );
        if (answer.length < 10) {
          setError('Please provide a more detailed explanation.');
        } else if (!hasKeyWords) {
          setError('Try to include more specific details about the meaning.');
        } else {
          isValid = true;
        }
        break;

      case 'usage':
        if (!answer.toLowerCase().includes(word.word.toLowerCase())) {
          setError(`Your sentence must include the word "${word.word}".`);
        } else if (answer.split(' ').length < 5) {
          setError('Please write a complete sentence.');
        } else {
          isValid = true;
        }
        break;

      case 'synonym':
        const validSynonyms = word.synonyms ? word.synonyms.toLowerCase().split(',').map(s => s.trim()) : [];
        if (validSynonyms.length === 0) {
          setError('No synonyms available for this word.');
        } else if (!validSynonyms.includes(answer.toLowerCase().trim())) {
          setError('That\'s not a correct synonym. Try another word.');
        } else {
          isValid = true;
        }
        break;

      case 'antonym':
        const validAntonyms = word.antonyms ? word.antonyms.toLowerCase().split(',').map(s => s.trim()) : [];
        if (validAntonyms.length === 0) {
          setError('No antonyms available for this word.');
        } else if (!validAntonyms.includes(answer.toLowerCase().trim())) {
          setError('That\'s not a correct antonym. Try another word.');
        } else {
          isValid = true;
        }
        break;
    }
    
    // Track attempt (which will also update mastery if successful)
    await trackAttempt(step, isValid);
    
    if (isValid) {
        setIsCorrect(true);
    }

    return isValid;
  };

  const handleNext = async () => {
    const isValid = await validateAnswer(currentStep, answers[currentStep]);
    
    if (isValid) {
      if (currentStepIndex === steps.length - 1) {
        setShowCongrats(true);
        await updateStreak();
        setTimeout(() => {
          onComplete();
        }, 2000);
      } else {
        setCurrentStep(steps[currentStepIndex + 1]);
        setShowHint(false);
        setError('');
        setIsCorrect(false);
      }
    }
  };

  const getProgress = () => {
    return ((currentStepIndex + 1) / steps.length) * 100;
  };

  const renderInput = () => {
    if (currentStep === 'definition' || currentStep === 'usage') {
      return (
        <Textarea
          value={answers[currentStep]}
          onChange={(e) => {
            setAnswers({ ...answers, [currentStep]: e.target.value });
            setError('');
            setIsCorrect(false);
          }}
          placeholder={`Enter your ${currentStep}...`}
          className="mt-2"
        />
      );
    }
    return (
      <Input
        value={answers[currentStep]}
        onChange={(e) => {
          setAnswers({ ...answers, [currentStep]: e.target.value });
          setError('');
          setIsCorrect(false);
        }}
        placeholder={`Enter a ${currentStep}...`}
        className="mt-2"
      />
    );
  };

  if (showCongrats) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="p-6 text-center">
          <Trophy className="h-16 w-16 mx-auto text-yellow-500 mb-4" />
          <h2 className="text-2xl font-bold mb-2">Congratulations!</h2>
          <p className="text-gray-600">
            You've successfully completed all exercises for "{word.word}"
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardContent className="p-6">
        <div className="w-full h-2 bg-gray-200 rounded-full mb-6">
          <div
            className="h-full bg-blue-500 rounded-full transition-all duration-300"
            style={{ width: `${getProgress()}%` }}
          />
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">{word.word}</h2>
            <span className="text-sm text-gray-500">
              Step {currentStepIndex + 1} of {steps.length}
            </span>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold">
              {currentStep.charAt(0).toUpperCase() + currentStep.slice(1)} Test
            </h3>
            {renderInput()}
          </div>

          {error && (
            <Alert variant="destructive" className="mt-2">
              <XCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {isCorrect && (
            <Alert className="mt-2 bg-green-50 text-green-700 border-green-200">
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>Correct! You can proceed to the next step.</AlertDescription>
            </Alert>
          )}

          {showHint && (
            <Alert className="mt-2">
              <HelpCircle className="h-4 w-4" />
              <AlertDescription>{hints[currentStep]}</AlertDescription>
            </Alert>
          )}

          <div className="flex justify-between mt-6">
            <Button
              variant="outline"
              onClick={() => setShowHint(!showHint)}
            >
              {showHint ? 'Hide Hint' : 'Show Hint'}
            </Button>
            <div className="space-x-2">
              <Button
                variant="outline"
                onClick={onClose}
              >
                Cancel
              </Button>
              <Button
                onClick={handleNext}
                className="flex items-center gap-2"
                disabled={!answers[currentStep]}
              >
                {currentStepIndex === steps.length - 1 ? 'Complete' : 'Next'}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default VocabularyTest;