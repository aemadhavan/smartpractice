// src/app/vocabulary/components/CategoryHome.tsx

import React, { useState, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, Clock, LucideIcon, Play, Volume2 } from "lucide-react";
import { VocabularyCard } from "./VocabularyCard";
import VocabularyTest from "./VocabularyTest";
import Flashcard from "./FlashCard";

interface WordEntry {
  id: number;
  word: string;
  difficulty: "Easy" | "Medium" | "Hard";
  status: "Mastered" | "Learning" | "To Start";
  progress: number;
}

interface CategoryStats {
  totalWords: number;
  masteredCount: number;
  learningCount: number;
  toStartCount: number;
}

interface CategoryHomeProps {
  categoryId: number;
  categoryLetter: string;
  userId: string;
  onBack: () => void;
}

interface ApiWord {
  id: number;
  word: string;
  difficultyLevel?: string;
  masteryLevel?: number;
}

interface WordCardProps {
  word: WordEntry;
  onPractice: (word: WordEntry) => void;
  onPronounce: (word: string) => void;
}

interface StatsCardProps {
  title: string;
  count: number;
  icon: LucideIcon;
  color: string;
}

interface VocabularyWordDetails {
  id: number;
  word: string;
  definition: string;
  synonyms: string;
  antonyms: string;
  partOfSpeech: string;
  sentence: string;
  difficulty: string;
  status: string;
  difficultyLevel?: string;
  masteryLevel?: number;
}

const StatsCard = ({ title, count, icon: Icon, color }: StatsCardProps) => (
  <Card className="bg-white p-6">
    <div className="space-y-2">
      <h3 className="text-lg text-gray-600">{title}</h3>
      <div className="flex items-center gap-2">
        <span className="text-4xl font-bold">{count}</span>
        {Icon && <Icon className={`h-6 w-6 ${color}`} />}
      </div>
    </div>
  </Card>
);

const WordCard = ({ word, onPractice, onPronounce }: WordCardProps) => {
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
    <Card className="bg-white p-4">
      <div className="flex justify-between items-start mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-xl font-bold">{word.word}</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onPronounce(word.word)}
              className="p-1 hover:bg-gray-100 rounded-full"
            >
              <Volume2 className="h-4 w-4" />
            </Button>
          </div>
          <span
            className={`inline-block px-2 py-1 rounded-full text-sm mt-2 ${getDifficultyColor(word.difficulty)}`}
          >
            {word.difficulty}
          </span>
        </div>
        {word.status === "Mastered" && (
          <CheckCircle className="h-5 w-5 text-green-500" />
        )}
        {word.status === "Learning" && (
          <Clock className="h-5 w-5 text-yellow-500" />
        )}
        {word.status === "To Start" && (
          <Play className="h-5 w-5 text-blue-500" />
        )}
      </div>
      <Progress value={word.progress} className="h-2 mb-4" />
      <Button
        className="w-full"
        variant={word.status === "Mastered" ? "outline" : "default"}
        onClick={() => onPractice(word)}
      >
        {word.status === "Mastered" ? "Review" : "Practice"}
      </Button>
    </Card>
  );
};

const CategoryHome = ({
  categoryId,
  categoryLetter,
  userId,
  onBack,
}: CategoryHomeProps) => {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [words, setWords] = useState<WordEntry[]>([]);
  const [stats, setStats] = useState<CategoryStats>({
    totalWords: 0,
    masteredCount: 0,
    learningCount: 0,
    toStartCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [flashcardsLoading, setFlashcardsLoading] = useState(false);
  const [selectedWord, setSelectedWord] = useState<VocabularyWordDetails | null>(null);
  const [showTest, setShowTest] = useState(false);
  const [showFlashcards, setShowFlashcards] = useState(false);
  const [flashcardWords, setFlashcardWords] = useState<VocabularyWordDetails[]>([]);

  const fetchFlashcardData = async () => {
    try {
      setFlashcardsLoading(true);
      const promises = words.map(async word => {
        try {
          // Update the API endpoint to match the route structure
          const response = await fetch(`/api/vocabulary/${categoryId}/${word.id}`);
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
          }
          const data = await response.json();
          if (!data.word) {
            throw new Error('Word data not found in response');
          }
          const status = determineStatus(data.word.masteryLevel || 0);
          const difficulty = data.word.difficultyLevel || "Medium";
          return {
            ...data.word,
            difficulty,
            status,
            definition: data.word.definition || "",
            synonyms: data.word.synonyms || "",
            antonyms: data.word.antonyms || "",
          };
        } catch (error) {
          console.error(`Error fetching word ${word.id}:`, error);
          return {
            id: word.id,
            word: word.word,
            difficulty: word.difficulty,
            status: word.status,
            definition: "Failed to load definition",
            synonyms: "Failed to load synonyms",
            antonyms: "Failed to load antonyms",
            partOfSpeech: "",
            sentence: "",
          };
        }
      });

      const wordDetails = await Promise.all(promises);
      const validWords = wordDetails.filter(word => word.definition !== "Failed to load definition");
      
      if (validWords.length === 0) {
        throw new Error("Failed to load any word details");
      }

      setFlashcardWords(validWords);
      setShowFlashcards(true);
    } catch (error) {
      console.error("Error fetching flashcard details:", error);
      alert("Failed to load flashcards. Please try again later.");
    } finally {
      setFlashcardsLoading(false);
    }
  };

  const fetchCategoryData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/vocabulary/${categoryId}?userId=${userId}`
      );
      const data = await response.json();

      const transformedWords = data.words.map(
        (word: ApiWord): WordEntry => ({
          id: word.id,
          word: word.word,
          difficulty:
            (word.difficultyLevel as "Easy" | "Medium" | "Hard") || "Medium",
          status: determineStatus(word.masteryLevel || 0),
          progress: word.masteryLevel || 0,
        })
      );

      const masteredCount = transformedWords.filter(
        (w: WordEntry) => w.status === "Mastered"
      ).length;
      const learningCount = transformedWords.filter(
        (w: WordEntry) => w.status === "Learning"
      ).length;

      setWords(transformedWords);
      setStats({
        totalWords: transformedWords.length,
        masteredCount,
        learningCount,
        toStartCount: transformedWords.length - (masteredCount + learningCount),
      });
    } catch (error) {
      console.error("Error fetching category data:", error);
    } finally {
      setLoading(false);
    }
  }, [categoryId, userId]);

  useEffect(() => {
    fetchCategoryData();
  }, [fetchCategoryData]);

  const determineStatus = (
    masteryLevel: number
  ): "Mastered" | "Learning" | "To Start" => {
    if (masteryLevel >= 80) return "Mastered";
    if (masteryLevel > 0) return "Learning";
    return "To Start";
  };

  const handlePronunciation = (word: string) => {
    const utterance = new SpeechSynthesisUtterance(word);
    utterance.rate = 0.8;
    window.speechSynthesis.speak(utterance);
  };

  const handlePractice = async (word: WordEntry) => {
    try {
      const response = await fetch(
        `/api/vocabulary/${categoryId}/${word.id}?userId=${userId}`
      );
      const data = await response.json();
      setSelectedWord(data.word);
    } catch (error) {
      console.error("Error fetching word details:", error);
    }
  };

  const handleTestComplete = async () => {
    setShowTest(false);
    setSelectedWord(null);
    await fetchCategoryData(); // Refresh the word list
  };

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  // Show VocabularyCard if a word is selected
  if (selectedWord) {
    return (
      <div className="space-y-6">
        <button
          onClick={() => setSelectedWord(null)}
          className="text-blue-600 hover:underline"
        >
          ← Back to word list
        </button>

        {showTest ? (
          <VocabularyTest
            word={selectedWord}
            userId={userId}
            onComplete={handleTestComplete}
            onClose={() => setShowTest(false)}
          />
        ) : (
          <VocabularyCard
            word={selectedWord}
            userId={userId}
            onNext={() => {}}
            onPrevious={() => {}}
            onTest={() => setShowTest(true)}
            hasNext={false}
            hasPrevious={false}
          />
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">  
        <div>
          <button onClick={onBack} className="text-blue-600 hover:underline mb-4">
            ← Back to categories
          </button>
          <h1 className="text-3xl font-bold">Category &apos;{categoryLetter}&apos;</h1>
          <p className="text-gray-600 mt-2">{stats.totalWords} words to learn</p>
        </div>
        <div className="flex items-start gap-3">
          <div className="flex gap-3">
            <StatsCard
              title="Mastered"
              count={stats.masteredCount}
              icon={CheckCircle}
              color="text-green-500"
            />
            <StatsCard
              title="Learning"
              count={stats.learningCount}
              icon={Clock}
              color="text-yellow-500"
            />
            <StatsCard
              title="To Start"
              count={stats.toStartCount}
              icon={Play}
              color="text-blue-500"
            />
          </div>
          <Button
            variant="outline"
            onClick={() => fetchFlashcardData()}
            className="px-4 h-10 ml-3"
            disabled={flashcardsLoading}
          >
            {flashcardsLoading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-b-transparent border-white rounded-full animate-spin"></div>
                Loading...
              </div>
            ) : (
              "Flashcards"
            )}
          </Button>
        </div>
      </div>
      
      {flashcardsLoading && (
        <div className="fixed inset-0 flex items-center justify-center bg-white/80 z-50">
          <div className="flex flex-col items-center gap-4">
            <div className="w-8 h-8 border-4 border-b-transparent border-blue-600 rounded-full animate-spin"></div>
            <p className="text-lg text-gray-600">Loading flashcards...</p>
          </div>
        </div>
      )}
      
      {showFlashcards && flashcardWords.length > 0 && !flashcardsLoading && (
        <Flashcard
          words={flashcardWords}
          onClose={() => setShowFlashcards(false)}
          onPronounce={handlePronunciation}
        />
      )}

      <div className="flex justify-end gap-2">
        <Button
          variant={viewMode === "grid" ? "default" : "outline"}
          onClick={() => setViewMode("grid")}
        >
          Grid
        </Button>
        <Button
          variant={viewMode === "list" ? "default" : "outline"}
          onClick={() => setViewMode("list")}
        >
          List
        </Button>
      </div>

      <div
        className={`grid ${
          viewMode === "grid"
            ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-5"
            : "grid-cols-1"
        } gap-4`}
      >
        {words.map((word) => (
          <WordCard
            key={word.id}
            word={word}
            onPractice={handlePractice}
            onPronounce={handlePronunciation}
          />
        ))}
      </div>
    </div>
  );
};

export default CategoryHome;