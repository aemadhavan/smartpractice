// src/app/vocabulary/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { VocabularyCard } from './components/VocabularyCard';

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
  const [categories, setCategories] = useState<AlphabetCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [vocabularies, setVocabularies] = useState<VocabularyWord[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

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
      if (selectedCategory === null) return;
      
      try {
        setLoading(true);
        const response = await fetch(`/api/vocabulary/${selectedCategory}`);
        const data = await response.json();
        setVocabularies(data.words);
        setCurrentIndex(0);
      } catch (error) {
        console.error('Error fetching vocabularies:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchVocabularies();
  }, [selectedCategory]);

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
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

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Vocabulary</h1>
      
      {!selectedCategory ? (
        <div className="grid grid-cols-2 md:grid-cols-5 lg:grid-cols-10 gap-4">
          {categories.map((category) => (
            <Card 
              key={category.id}
              className="p-4 text-center cursor-pointer hover:bg-gray-100 transition-colors"
              onClick={() => handleCategoryClick(category.id)}
            >
              <div className="text-2xl font-bold mb-2">{category.letter}</div>
              {/* <div className="text-sm text-gray-600">{category.description}</div> */}
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          <button
            onClick={() => setSelectedCategory(null)}
            className="text-blue-600 hover:underline mb-4"
          >
            ← Back to categories
          </button>
          
          <VocabularyCard
            word={vocabularies[currentIndex]}
            onNext={handleNext}
            onPrevious={handlePrevious}
            hasNext={currentIndex < vocabularies.length - 1}
            hasPrevious={currentIndex > 0}
          />
        </div>
      )}
    </div>
  );
}