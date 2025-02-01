import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, XCircle, HelpCircle, ArrowRight } from 'lucide-react';

interface VocabularyWord {
  word: string;
  definition: string;
  synonyms: string;
  antonyms: string;
  partOfSpeech: string;
  sentence: string;
}

interface TestProps {
  word: VocabularyWord;
  onComplete: () => void;
  onClose: () => void;
}

type TestStep = 'definition' | 'usage' | 'synonym' | 'antonym';

export const VocabularyTest = ({ word, onComplete, onClose }: TestProps) => {
  const [currentStep, setCurrentStep] = useState<TestStep>('definition');
  const [answers, setAnswers] = useState({
    definition: '',
    usage: '',
    synonym: '',
    antonym: '',
  });
  const [showHint, setShowHint] = useState(false);
  const [error, setError] = useState('');
  const [isCorrect, setIsCorrect] = useState(false);

  const steps: TestStep[] = ['definition', 'usage', 'synonym', 'antonym'];
  const currentStepIndex = steps.indexOf(currentStep);

  const hints = {
    definition: `Try to explain what "${word.word}" means in your own words. Think about its core meaning.`,
    usage: `Create a sentence that clearly shows you understand how to use "${word.word}".`,
    synonym: `What word means the same as "${word.word}"? Think about: ${word.synonyms.split(',')[0]}`,
    antonym: `What word means the opposite of "${word.word}"? Think about: ${word.antonyms.split(',')[0]}`,
  };

  const validateAnswer = (step: TestStep, answer: string): boolean => {
    setError('');
    setIsCorrect(false);

    switch (step) {
      case 'definition':
        // Check if the answer contains key words from the definition
        const keyWords = word.definition
          .toLowerCase()
          .split(' ')
          .filter(word => word.length > 4);
        const hasKeyWords = keyWords.some(keyword =>
          answer.toLowerCase().includes(keyword)
        );
        if (answer.length < 10) {
          setError('Please provide a more detailed explanation.');
          return false;
        }
        if (!hasKeyWords) {
          setError('Try to include more specific details about the meaning.');
          return false;
        }
        break;

      case 'usage':
        if (!answer.toLowerCase().includes(word.word.toLowerCase())) {
          setError(`Your sentence must include the word "${word.word}".`);
          return false;
        }
        if (answer.split(' ').length < 5) {
          setError('Please write a complete sentence.');
          return false;
        }
        break;

      case 'synonym':
        const validSynonyms = word.synonyms.toLowerCase().split(',').map(s => s.trim());
        if (!validSynonyms.includes(answer.toLowerCase().trim())) {
          setError('That\'s not a correct synonym. Try another word.');
          return false;
        }
        break;

      case 'antonym':
        const validAntonyms = word.antonyms.toLowerCase().split(',').map(s => s.trim());
        if (!validAntonyms.includes(answer.toLowerCase().trim())) {
          setError('That\'s not a correct antonym. Try another word.');
          return false;
        }
        break;
    }
    
    setIsCorrect(true);
    return true;
  };

  const handleNext = () => {
    if (validateAnswer(currentStep, answers[currentStep])) {
      if (currentStepIndex === steps.length - 1) {
        onComplete();
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

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardContent className="p-6">
        {/* Progress Bar */}
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