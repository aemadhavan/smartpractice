'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

// Define TypeScript interfaces
interface ResourceItem {
  title: string;
  description: string;
  format: string;
  category: string;
  popular: boolean;
  url: string;
  difficulty?: 'Beginner' | 'Intermediate' | 'Advanced';
}

interface ResourcesData {
  practiceTests: ResourceItem[];
  studyGuides: ResourceItem[];
  examTips: ResourceItem[];
  faq: ResourceItem[];
}

export default function Resources() {
  const [searchQuery, setSearchQuery] = useState('');
  
  // Resource categories and items
  const resources: ResourcesData = {
    practiceTests: [
      {
        title: "Full-Length Selective Entry Mock Exam",
        description: "Complete simulation of the exam environment with timed sections for all five test areas.",
        difficulty: "Advanced",
        format: "PDF + Online",
        category: "Practice Tests",
        popular: true,
        url: "/resources/practice-tests/full-mock-exam"
      },
      {
        title: "Quick Assessment Test (30 min)",
        description: "Brief assessment covering key concepts from all sections to identify knowledge gaps.",
        difficulty: "Beginner",
        format: "Online",
        category: "Practice Tests",
        popular: false,
        url: "/resources/practice-tests/quick-assessment"
      },
      {
        title: "Mathematics Focused Test",
        description: "Concentrated practice on mathematical reasoning with problems of increasing difficulty.",
        difficulty: "Intermediate",
        format: "PDF",
        category: "Practice Tests",
        popular: true,
        url: "/resources/practice-tests/math-focused"
      },
      {
        title: "Verbal Reasoning Test",
        description: "Comprehensive verbal reasoning assessment with analogies, synonyms, and logical reasoning.",
        difficulty: "Intermediate",
        format: "Online",
        category: "Practice Tests",
        popular: false,
        url: "/resources/practice-tests/verbal-reasoning"
      }
    ],
    studyGuides: [
      {
        title: "Mathematics Study Guide",
        description: "Comprehensive coverage of all mathematical concepts tested in the selective exam.",
        format: "PDF",
        category: "Study Guides",
        popular: true,
        url: "/resources/study-guides/mathematics"
      },
      {
        title: "Reading Comprehension Strategies",
        description: "Effective techniques for understanding and analyzing different text types.",
        format: "PDF + Video",
        category: "Study Guides",
        popular: true,
        url: "/resources/study-guides/reading-comprehension"
      },
      {
        title: "Writing Skills Development",
        description: "Guide to improving narrative, descriptive, and persuasive writing for the exam.",
        format: "PDF",
        category: "Study Guides",
        popular: false,
        url: "/resources/study-guides/writing-skills"
      },
      {
        title: "Verbal Reasoning Techniques",
        description: "Methods for solving different types of verbal reasoning questions efficiently.",
        format: "PDF + Interactive",
        category: "Study Guides",
        popular: false,
        url: "/resources/study-guides/verbal-reasoning"
      }
    ],
    examTips: [
      {
        title: "Time Management Strategies",
        description: "Learn effective techniques to maximize your time during the exam.",
        format: "Article",
        category: "Exam Tips",
        popular: true,
        url: "/resources/exam-tips/time-management"
      },
      {
        title: "Exam Day Preparation Checklist",
        description: "Everything you need to know and prepare before the big day.",
        format: "PDF",
        category: "Exam Tips",
        popular: true,
        url: "/resources/exam-tips/preparation-checklist"
      },
      {
        title: "Stress Management for Test Takers",
        description: "Techniques to manage exam anxiety and perform at your best.",
        format: "Video + PDF",
        category: "Exam Tips",
        popular: false,
        url: "/resources/exam-tips/stress-management"
      },
      {
        title: "Common Mistakes to Avoid",
        description: "Learn from others' experiences and avoid frequent pitfalls.",
        format: "Article",
        category: "Exam Tips",
        popular: false,
        url: "/resources/exam-tips/common-mistakes"
      }
    ],
    faq: [
      {
        title: "Selective School Entry Exam FAQ",
        description: "Comprehensive answers to frequently asked questions about the selective entry process.",
        format: "Article",
        category: "FAQ",
        popular: true,
        url: "/resources/faq/selective-entry-process"
      },
      {
        title: "Parent's Guide to Supporting Your Child",
        description: "How parents can effectively support their children during exam preparation.",
        format: "PDF + Video",
        category: "FAQ",
        popular: true,
        url: "/resources/faq/parents-guide"
      },
      {
        title: "Application Process Explained",
        description: "Step-by-step guide to applying for selective entry high schools in Victoria.",
        format: "Article",
        category: "FAQ",
        popular: false,
        url: "/resources/faq/application-process"
      },
      {
        title: "Understanding Selective School Scoring",
        description: "How selective schools evaluate and score exam performance.",
        format: "Article",
        category: "FAQ",
        popular: false,
        url: "/resources/faq/scoring-system"
      }
    ]
  };

  // Filter resources based on search query
  const filterResources = (items: ResourceItem[]): ResourceItem[] => {
    if (!searchQuery) return items;
    
    return items.filter((item: ResourceItem) => 
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      item.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="container mx-auto px-4 py-12 max-w-7xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Resources</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Comprehensive study materials designed to help students excel in the Victorian Selective Entry High School Exam.
          </p>
        </div>

        <div className="mb-8">
          <Input
            type="text"
            placeholder="Search resources..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-md mx-auto"
          />
        </div>

        <Tabs defaultValue="practiceTests" className="mb-12">
          <TabsList className="grid w-full grid-cols-4 mb-8">
            <TabsTrigger value="practiceTests">Practice Tests</TabsTrigger>
            <TabsTrigger value="studyGuides">Study Guides</TabsTrigger>
            <TabsTrigger value="examTips">Exam Tips</TabsTrigger>
            <TabsTrigger value="faq">FAQ</TabsTrigger>
          </TabsList>
          
          <TabsContent value="practiceTests">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filterResources(resources.practiceTests).map((resource: ResourceItem, index: number) => (
                <ResourceCard key={index} resource={resource} />
              ))}
            </div>
            {filterResources(resources.practiceTests).length === 0 && (
              <p className="text-center text-gray-500 py-12">No practice tests match your search criteria.</p>
            )}
          </TabsContent>
          
          <TabsContent value="studyGuides">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filterResources(resources.studyGuides).map((resource: ResourceItem, index: number) => (
                <ResourceCard key={index} resource={resource} />
              ))}
            </div>
            {filterResources(resources.studyGuides).length === 0 && (
              <p className="text-center text-gray-500 py-12">No study guides match your search criteria.</p>
            )}
          </TabsContent>
          
          <TabsContent value="examTips">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filterResources(resources.examTips).map((resource: ResourceItem, index: number) => (
                <ResourceCard key={index} resource={resource} />
              ))}
            </div>
            {filterResources(resources.examTips).length === 0 && (
              <p className="text-center text-gray-500 py-12">No exam tips match your search criteria.</p>
            )}
          </TabsContent>
          
          <TabsContent value="faq">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filterResources(resources.faq).map((resource: ResourceItem, index: number) => (
                <ResourceCard key={index} resource={resource} />
              ))}
            </div>
            {filterResources(resources.faq).length === 0 && (
              <p className="text-center text-gray-500 py-12">No FAQs match your search criteria.</p>
            )}
          </TabsContent>
        </Tabs>

        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-8 shadow-sm border border-blue-100">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Most Popular Resources</h2>
            <p className="text-gray-600">Discover our most helpful and frequently accessed materials.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.values(resources)
              .flat()
              .filter(resource => resource.popular)
              .slice(0, 4)
              .map((resource, index) => (
                <Link key={index} href={resource.url} className="block">
                  <Card className="h-full hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">{resource.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="pb-4">
                      <Badge variant="outline" className="bg-blue-50">
                        {resource.category}
                      </Badge>
                    </CardContent>
                  </Card>
                </Link>
              ))}
          </div>
        </div>
      </main>
    </div>
  );
}

function ResourceCard({ resource }: { resource: ResourceItem }) {
  return (
    <Card className="h-full hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle className="text-xl">{resource.title}</CardTitle>
          {resource.popular && (
            <Badge variant="secondary" className="ml-2">
              Popular
            </Badge>
          )}
        </div>
        <CardDescription>
          {resource.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex gap-2">
          <Badge variant="outline">{resource.format}</Badge>
          {resource.difficulty && (
            <Badge variant="outline" className={
              resource.difficulty === "Beginner" ? "bg-green-50" :
              resource.difficulty === "Intermediate" ? "bg-yellow-50" :
              "bg-red-50"
            }>
              {resource.difficulty}
            </Badge>
          )}
        </div>
      </CardContent>
      <CardFooter>
        <Button asChild className="w-full">
          <Link href={resource.url}>
            Access Resource
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}