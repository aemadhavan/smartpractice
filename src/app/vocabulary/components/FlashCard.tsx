//src/app/vocabulary/components/FlashCard.tsx

import React, { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, RotateCw, X, Volume2 } from "lucide-react";

interface FlashcardProps {
  words: Array<{
    id: number;
    word: string;
    difficulty: string;
    status: string;
    definition: string;
    synonyms: string;
    antonyms: string;
    partOfSpeech?: string;
    sentence?: string;
    difficultyLevel?: string;
    masteryLevel?: number;
  }>;
  onClose: () => void;
  onPronounce: (word: string) => void;
}

const Flashcard: React.FC<FlashcardProps> = ({ words, onClose, onPronounce }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  
  const handleNext = () => {
    if (currentIndex < words.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setIsFlipped(false);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setIsFlipped(false);
    }
  };

  const currentWord = words[currentIndex];

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case "easy":
        return "bg-green-100 text-green-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "hard":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-white z-50">
      <div className="w-full max-w-2xl p-6">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-xl font-semibold">Flashcards</h2>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={onClose}
            className="h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="text-center mb-6">
          <span className="text-sm text-gray-500">
            Card {currentIndex + 1} of {words.length}
          </span>
        </div>

        <Card 
          className="min-h-[400px] mb-8 cursor-pointer"
          onClick={() => setIsFlipped(!isFlipped)}
        >
          <div className="h-full flex items-center justify-center p-8">
            {!isFlipped ? (
              <div className="text-center">
                <div className="flex items-center justify-center gap-3 mb-4">
                  <h3 className="text-4xl font-bold">{currentWord.word}</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onPronounce(currentWord.word);
                    }}
                    className="rounded-full hover:bg-gray-100"
                  >
                    <Volume2 className="h-5 w-5" />
                  </Button>
                </div>
                <span className={`inline-block px-3 py-1 rounded-full text-sm ${getDifficultyColor(currentWord.difficulty)}`}>
                  {currentWord.difficulty}
                </span>
              </div>
            ) : (
              <div className="text-center space-y-6 max-w-md">
                {currentWord.definition && (
                  <div>
                    <h4 className="text-lg font-semibold mb-2">Definition</h4>
                    <p className="text-gray-600">{currentWord.definition}</p>
                  </div>
                )}
                
                {currentWord.synonyms && (
                  <div>
                    <h4 className="text-lg font-semibold mb-2">Synonyms</h4>
                    <p className="text-gray-600">{currentWord.synonyms}</p>
                  </div>
                )}
                
                {currentWord.antonyms && (
                  <div>
                    <h4 className="text-lg font-semibold mb-2">Antonyms</h4>
                    <p className="text-gray-600">{currentWord.antonyms}</p>
                  </div>
                )}
                
                <div className="mt-4">
                  <span className="text-sm text-gray-500">Status: {currentWord.status}</span>
                </div>
              </div>
            )}
          </div>
        </Card>

        <div className="flex justify-between items-center px-4">
          <Button
            onClick={handlePrevious}
            disabled={currentIndex === 0}
            variant="ghost"
            className="text-gray-600"
          >
            <ChevronLeft className="h-4 w-4 mr-2" /> 
            Previous
          </Button>

          <Button
            variant="outline"
            onClick={() => setIsFlipped(!isFlipped)}
            className="min-w-[100px]"
          >
            <RotateCw className="h-4 w-4 mr-2" /> 
            Flip
          </Button>

          <Button
            onClick={handleNext}
            disabled={currentIndex === words.length - 1}
            variant="ghost"
            className="text-gray-600"
          >
            Next
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Flashcard;