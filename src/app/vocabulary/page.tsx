// src/app/vocabulary/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';

interface AlphabetCategory {
  id: number;
  letter: string;
  description: string;
}

export default function VocabularyPage() {
  const [categories, setCategories] = useState<AlphabetCategory[]>([]);
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

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Vocabulary</h1>
      
      <div className="grid grid-cols-2 md:grid-cols-5 lg:grid-cols-10 gap-4">
        {categories.map((category) => (
          <Card 
            key={category.id}
            className="p-4 text-center cursor-pointer hover:bg-gray-100 transition-colors"
          >
            <div className="text-2xl font-bold mb-2">{category.letter}</div>
            {/* <div className="text-sm text-gray-600">{category.description}</div> */}
          </Card>
        ))}
      </div>
    </div>
  );
}