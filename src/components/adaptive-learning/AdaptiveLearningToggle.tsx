//File: /src/components/adaptive-learning/AdaptiveLearningToggle.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { 
  Brain, 
  //Settings,
  Info
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface AdaptiveLearningToggleProps {
  onSettingsChange?: (isEnabled: boolean) => void;
  className?: string;
}

const AdaptiveLearningToggle: React.FC<AdaptiveLearningToggleProps> = ({
  onSettingsChange,
  className = ''
}) => {
  const { user, isLoaded } = useUser();
  const [isEnabled, setIsEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch user settings on component mount
  useEffect(() => {
    const fetchSettings = async () => {
      if (!user?.id) return;
      
      try {
        setLoading(true);
        const response = await fetch(`/api/maths/adaptive-settings`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch settings');
        }
        
        const data = await response.json();
        
        if (data.success) {
          setIsEnabled(data.settings.enableAdaptiveLearning);
        } else {
          throw new Error(data.error || 'Unknown error');
        }
      } catch (err) {
        console.error('Error fetching adaptive settings:', err);
        setError('Failed to load settings');
      } finally {
        setLoading(false);
      }
    };
    
    if (isLoaded && user) {
      fetchSettings();
    }
  }, [isLoaded, user]);

  // Update settings when toggle changes
  const handleToggleChange = async (checked: boolean) => {
    if (!user?.id) return;
    
    try {
      setIsEnabled(checked);
      
      const response = await fetch(`/api/maths/adaptive-settings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          enableAdaptiveLearning: checked
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to update settings');
      }
      
      if (onSettingsChange) {
        onSettingsChange(checked);
      }
    } catch (err) {
      console.error('Error updating adaptive settings:', err);
      setError('Failed to update settings');
      setIsEnabled(!checked); // Revert state on error
    }
  };

  if (!isLoaded || loading) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className="h-4 w-10 bg-gray-200 rounded animate-pulse"></div>
        <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`text-sm text-red-600 ${className}`}>
        {error}
      </div>
    );
  }

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <Switch
        id="adaptive-learning"
        checked={isEnabled}
        onCheckedChange={handleToggleChange}
      />
      <Label 
        htmlFor="adaptive-learning" 
        className="cursor-pointer flex items-center gap-1.5"
      >
        <Brain className="h-4 w-4 text-indigo-600" />
        <span>Adaptive Learning</span>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="h-4 w-4 text-gray-400 cursor-help" />
            </TooltipTrigger>
            <TooltipContent className="max-w-sm">
              <p>
                When enabled, questions adjust to your skill level, focusing on areas 
                that need improvement. The system identifies learning gaps and customizes
                your practice experience.
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </Label>
    </div>
  );
};

export default AdaptiveLearningToggle;