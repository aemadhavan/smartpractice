// src/app/vocabulary/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { VocabularyCard } from './components/VocabularyCard';
import VocabularyTest from './components/VocabularyTest';
import VocabularyMetricsDashboard from './components/VocabularyMetricsDashboard';
import { BarChart, BookOpen } from 'lucide-react';

interface AlphabetCategory {
  id: number;
  letter: string;
  description: string;
}

interface VocabularyWord {
  id: number;
  word: string;
  definition: string;
  synonyms: string;
  antonyms: string;
  partOfSpeech: string;
  sentence: string;
}

export default function VocabularyPage() {
  const { user, isLoaded } = useUser();
  const [categories, setCategories] = useState<AlphabetCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [vocabularies, setVocabularies] = useState<VocabularyWord[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingVocabulary, setLoadingVocabulary] = useState(false);
  const [showTest, setShowTest] = useState(false);

  useEffect(() => {
    async function fetchCategories() {
      try {
        const response = await fetch('/api/vocabulary/alphabetcategories');
        const data = await response.json();
        setCategories(data.categories);
      } catch (error) {
        console.error('Error fetching categories:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchCategories();
  }, []);

  useEffect(() => {
    async function fetchVocabularies() {
      if (selectedCategory === null) {
        setVocabularies([]);
        return;
      }
      
      try {
        setLoadingVocabulary(true);
        const response = await fetch(`/api/vocabulary/${selectedCategory}`);
        const data = await response.json();
        
        if (Array.isArray(data.words) && data.words.length > 0) {
          setVocabularies(data.words);
          setCurrentIndex(0);
        } else {
          setVocabularies([]);
        }
      } catch (error) {
        console.error('Error fetching vocabularies:', error);
        setVocabularies([]);
      } finally {
        setLoadingVocabulary(false);
      }
    }

    fetchVocabularies();
  }, [selectedCategory]);

  if (!isLoaded || loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p className="text-gray-600">Please sign in to access vocabulary practice.</p>
      </div>
    );
  }

  const handleCategoryClick = (categoryId: number) => {
    setSelectedCategory(categoryId);
  };

  const handleNext = () => {
    if (currentIndex < vocabularies.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleTestComplete = () => {
    setShowTest(false);
    handleNext();
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Vocabulary Practice</h1>
      </div>

      <Tabs defaultValue="practice" className="space-y-6">
        <TabsList className="w-full md:w-auto">
          <TabsTrigger value="practice" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Practice
          </TabsTrigger>
          <TabsTrigger value="progress" className="flex items-center gap-2">
            <BarChart className="h-4 w-4" />
            Progress
          </TabsTrigger>
        </TabsList>

        <TabsContent value="practice" className="space-y-6">
          {!selectedCategory ? (
            <div>
              <h2 className="text-lg font-semibold mb-4">Select a Category</h2>
              <div className="grid grid-cols-2 md:grid-cols-5 lg:grid-cols-10 gap-4">
                {categories.map((category) => (
                  <Card 
                    key={category.id}
                    className="p-4 text-center cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => handleCategoryClick(category.id)}
                  >
                    <div className="text-2xl font-bold">{category.letter}</div>
                  </Card>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <button
                onClick={() => setSelectedCategory(null)}
                className="text-blue-600 hover:underline mb-4"
              >
                ← Back to categories
              </button>
              
              {loadingVocabulary ? (
                <div className="flex justify-center items-center h-64">
                  <p className="text-gray-600">Loading vocabulary...</p>
                </div>
              ) : vocabularies.length === 0 ? (
                <div className="flex justify-center items-center h-64">
                  <p className="text-gray-600">No vocabulary words found for this category.</p>
                </div>
              ) : showTest ? (
                <VocabularyTest
                  word={vocabularies[currentIndex]}
                  userId={user.id}
                  onComplete={handleTestComplete}
                  onClose={() => setShowTest(false)}
                />
              ) : (
                <VocabularyCard
                  word={vocabularies[currentIndex]}
                  onNext={handleNext}
                  onPrevious={handlePrevious}
                  onTest={() => setShowTest(true)}
                  hasNext={currentIndex < vocabularies.length - 1}
                  hasPrevious={currentIndex > 0}
                />
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="progress">
          <VocabularyMetricsDashboard userId={user.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}