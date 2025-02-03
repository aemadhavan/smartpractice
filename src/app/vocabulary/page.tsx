// src/app/vocabulary/page.tsx
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useUser } from '@clerk/nextjs';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { VocabularyCard } from './components/VocabularyCard';
import VocabularyTest from './components/VocabularyTest';
import VocabularyMetricsDashboard from './components/VocabularyMetricsDashboard';
import { BookOpen, BarChart, Award, Target } from 'lucide-react';
import { CategoryCard } from './components/CategoryCard';


interface AlphabetCategory {
  id: number;
  letter: string;
  wordCount: number;
  progress: number;
  masteredCount: number;
  inProgressCount: number;
  status: 'success' | 'warning' | 'error';  // Added status property
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

interface Stats {
  totalWords: number;
  masteredWords: number;
  dailyGoal: number;
  dailyProgress: number;
  currentStreak: number;
}

const StatCard = ({ icon: Icon, label, value, bgColor, textColor }: any) => (
  <div className={`p-4 rounded-lg ${bgColor}`}>
    <div className="flex items-center gap-3">
      <Icon className={`h-5 w-5 ${textColor}`} />
      <div>
        <div className={`font-semibold text-lg ${textColor}`}>{value}</div>
        <div className="text-sm text-gray-600">{label}</div>
      </div>
    </div>
  </div>
);

export default function VocabularyPage() {
  const { user, isLoaded } = useUser();
  const [categories, setCategories] = useState<AlphabetCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [vocabularies, setVocabularies] = useState<VocabularyWord[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingVocabulary, setLoadingVocabulary] = useState(false);
  const [showTest, setShowTest] = useState(false);
  const [stats, setStats] = useState<Stats>({
    totalWords: 0,
    masteredWords: 0,
    dailyGoal: 15,
    dailyProgress: 0,
    currentStreak: 0
  });

  const fetchData = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      const [categoriesRes, statsRes] = await Promise.all([
        fetch(`/api/vocabulary/alphabetcategories?userId=${user.id}`),
        fetch(`/api/vocabulary/metrics?userId=${user.id}`)
      ]);
      
      const categoriesData = await categoriesRes.json();
      const statsData = await statsRes.json();
      
      setCategories(categoriesData.categories);
      setStats({
        totalWords: statsData.totalWords,
        masteredWords: statsData.masteredWords,
        dailyGoal: statsData.dailyGoal,
        dailyProgress: statsData.dailyProgress,
        currentStreak: statsData.currentStreak
      });
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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
  
  const handleTestComplete = useCallback(async () => {
    setShowTest(false);
    await fetchData(); // Refresh data after test completion
    if (currentIndex < vocabularies.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  }, [currentIndex, vocabularies.length, fetchData]);
  
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

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Vocabulary Practice</h1>

      <Tabs defaultValue="practice" className="space-y-6">
        <TabsList className="w-full sm:w-auto">
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
          <div className="space-y-4">
            {!selectedCategory && (
              <>
                <h2 className="text-lg font-semibold">Select a Category</h2>
                
                {/* Stats Cards */}
                <div className="grid gap-4 mb-6">
                  <StatCard
                    icon={BookOpen}
                    label="Total Words"
                    value={stats.totalWords}
                    bgColor="bg-blue-50"
                    textColor="text-blue-600"
                  />
                  <StatCard
                    icon={Award}
                    label="Mastered"
                    value={stats.masteredWords}
                    bgColor="bg-green-50"
                    textColor="text-green-600"
                  />
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Target className="h-5 w-5 text-purple-600" />
                        <div className="text-sm text-gray-600">Daily Goal</div>
                      </div>
                      <div className="text-purple-600">
                        {stats.dailyProgress}/{stats.dailyGoal}
                      </div>
                    </div>
                    <Progress 
                      value={(stats.dailyProgress / stats.dailyGoal) * 100}
                      className="h-2"
                    />
                  </div>
                </div>

                {/* Category Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {categories.map((category) => (
                    <CategoryCard
                      key={category.id}
                      id={category.id}
                      letter={category.letter}
                      wordCount={category.wordCount}
                      progress={category.progress}
                      masteredCount={category.masteredCount}
                      onClick={() => setSelectedCategory(category.id)}
                      status={category.status}
                    />
                  ))}
                </div>
              </>
            )}

            {selectedCategory && (
              <div className="space-y-6">
                <button
                  onClick={() => setSelectedCategory(null)}
                  className="text-blue-600 hover:underline"
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
                    userId={user.id} // Add this line
                    onNext={() => currentIndex < vocabularies.length - 1 && setCurrentIndex(currentIndex + 1)}
                    onPrevious={() => currentIndex > 0 && setCurrentIndex(currentIndex - 1)}
                    onTest={() => setShowTest(true)}
                    hasNext={currentIndex < vocabularies.length - 1}
                    hasPrevious={currentIndex > 0}
                  />
                )}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="progress">
          <VocabularyMetricsDashboard userId={user.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}