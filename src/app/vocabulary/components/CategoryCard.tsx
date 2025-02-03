// src/app/vocabulary/components/CategoryCard.tsx
import React from 'react';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface CategoryCardProps {
  id: number;
  letter: string;
  wordCount: number;
  progress: number;
  masteredCount: number;
  onClick: (id: number) => void;
  status?: 'warning' | 'success' | 'error';  // For the dot indicator
}

export const CategoryCard = ({ 
  id, 
  letter, 
  wordCount, 
  progress, 
  onClick,
  status = 'success'
}: CategoryCardProps) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'warning':
        return 'bg-yellow-500';
      case 'error':
        return 'bg-red-500';
      default:
        return 'bg-green-500';
    }
  };

  return (
    <Card
      className="p-6 cursor-pointer hover:bg-gray-50 transition-colors relative"
      onClick={() => onClick(id)}
    >
      {/* Status Indicator */}
      <div 
        className={`absolute top-2 right-2 w-2 h-2 rounded-full ${getStatusColor(status)}`}
      />
      
      {/* Main Content */}
      <div className="text-center mb-4">
        <div className="text-2xl font-bold mb-1">{letter}</div>
        <div className="text-sm text-gray-500">{wordCount} words</div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <Progress 
          value={progress} 
          className="h-2 bg-gray-100"
        />
      </div>
    </Card>
  );
};