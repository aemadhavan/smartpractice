import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Volume2, ChevronLeft, ChevronRight } from 'lucide-react';

interface VocabularyWord {
  id: number;
  word: string;
  definition: string;
  synonyms: string;
  antonyms: string;
  partOfSpeech: string;
  sentence: string;
  audioUrl?: string; // New optional field for audio URL
}

interface VocabularyCardProps {
  word: VocabularyWord;
  onNext: () => void;
  onPrevious: () => void;
  hasNext: boolean;
  hasPrevious: boolean;
}

export const VocabularyCard = ({
  word,
  onNext,
  onPrevious,
  hasNext,
  hasPrevious,
}: VocabularyCardProps) => {
  const [isPlaying, setIsPlaying] = useState(false);

  const handlePronunciation = async () => {
    try {
      setIsPlaying(true);
      // Using the Web Speech API for basic pronunciation
      const utterance = new SpeechSynthesisUtterance(word.word);
      utterance.rate = 0.8; // Slightly slower for clarity
      utterance.onend = () => setIsPlaying(false);
      window.speechSynthesis.speak(utterance);
    } catch (error) {
      console.error('Error playing pronunciation:', error);
      setIsPlaying(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardContent className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-3xl font-bold">{word.word}</h2>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={handlePronunciation}
              disabled={isPlaying}
              className="rounded-full"
            >
              <Volume2 className={isPlaying ? 'animate-pulse' : ''} />
            </Button>
            <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
              {word.partOfSpeech}
            </span>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <h3 className="font-semibold text-lg mb-1">Definition</h3>
            <p className="text-gray-700">{word.definition}</p>
          </div>

          <div>
            <h3 className="font-semibold text-lg mb-1">Synonyms</h3>
            <p className="text-gray-700">{word.synonyms}</p>
          </div>

          <div>
            <h3 className="font-semibold text-lg mb-1">Antonyms</h3>
            <p className="text-gray-700">{word.antonyms}</p>
          </div>

          <div>
            <h3 className="font-semibold text-lg mb-1">Example Sentence</h3>
            <p className="text-gray-700 italic">{word.sentence}</p>
          </div>
        </div>

        <div className="flex justify-between mt-6">
          <Button
            onClick={onPrevious}
            disabled={!hasPrevious}
            variant="outline"
            className="flex items-center gap-2"
          >
            <ChevronLeft size={16} /> Previous
          </Button>
          <Button
            onClick={onNext}
            disabled={!hasNext}
            variant="outline"
            className="flex items-center gap-2"
          >
            Next <ChevronRight size={16} />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};