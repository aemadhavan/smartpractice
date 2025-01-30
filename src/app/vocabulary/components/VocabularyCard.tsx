// src/app/vocabulary/components/VocabularyCard.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface VocabularyWord {
  id: number;
  word: string;
  definition: string;
  synonyms: string;
  antonyms: string;
  partOfSpeech: string;
  sentence: string;
}

interface VocabularyCardProps {
  word: VocabularyWord | null;
  onNext: () => void;
  onPrevious: () => void;
  hasNext: boolean;
  hasPrevious: boolean;
}

export function VocabularyCard({
  word,
  onNext,
  onPrevious,
  hasNext,
  hasPrevious,
}: VocabularyCardProps) {
  if (!word) {
    return <div>No vocabulary words available.</div>;
  }

  const highlightWordInSentence = (sentence: string, word: string) => {
    // Case-insensitive search for the word
    const regex = new RegExp(`(${word})`, 'gi');
    const parts = sentence.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <span key={index} className="font-bold text-blue-700">{part}</span>
      ) : (
        part
      )
    );
  };

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-3xl font-bold">{word.word}</CardTitle>
        <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
          {word.partOfSpeech}
        </span>
      </CardHeader>
      <CardContent className="space-y-4">
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
          <p className="text-gray-700 italic">
            {highlightWordInSentence(word.sentence, word.word)}
          </p>
        </div>

        <div className="flex justify-between pt-4">
          <Button
            variant="outline"
            onClick={onPrevious}
            disabled={!hasPrevious}
          >
            <ChevronLeft className="mr-2 h-4 w-4" /> Previous
          </Button>
          
          <Button
            variant="outline"
            onClick={onNext}
            disabled={!hasNext}
          >
            Next <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}