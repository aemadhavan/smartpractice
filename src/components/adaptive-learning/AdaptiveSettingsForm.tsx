// src/components/adaptive-learning/AdaptiveSettingsForm.tsx
'use client';

import React, { useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Brain, Save, Gauge, BarChart3, Loader2 } from 'lucide-react';
import AdaptiveLearningToggle from './AdaptiveLearningToggle';

interface AdaptiveSettingsFormProps {
  initialSettings?: {
    adaptivityLevel: number;
    difficultyPreference: string;
    enableAdaptiveLearning: boolean;
  };
  className?: string;
}

const AdaptiveSettingsForm: React.FC<AdaptiveSettingsFormProps> = ({ 
  initialSettings = {
    adaptivityLevel: 5,
    difficultyPreference: 'balanced',
    enableAdaptiveLearning: true
  },
  className = ''
}) => {
  const { user } = useUser();
  const [settings, setSettings] = useState(initialSettings);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/maths/adaptive-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });

      if (!response.ok) {
        throw new Error('Failed to update settings');
      }

      toast({
        title: "Settings updated",
        description: "Your adaptive learning preferences have been saved.",
      });
    } catch (error) {
      console.error('Error updating settings:', error);
      toast({
        title: "Failed to update settings",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdaptivityLevelChange = (value: number[]) => {
    setSettings({
      ...settings,
      adaptivityLevel: value[0],
    });
  };

  const handleAdaptiveLearningToggle = (isEnabled: boolean) => {
    setSettings({
      ...settings, 
      enableAdaptiveLearning: isEnabled
    });
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-indigo-600" />
          Adaptive Learning Settings
        </CardTitle>
        <CardDescription>
          Customize how your learning experience adapts to your performance
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-5">
            <div>
              <div className="flex justify-between items-center mb-2">
                <Label htmlFor="adaptivity-toggle">Enable Adaptive Learning</Label>
                <AdaptiveLearningToggle 
                  onSettingsChange={handleAdaptiveLearningToggle}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2">
                <Gauge className="h-4 w-4 text-indigo-600" />
                <Label htmlFor="adaptivity-level">
                  Adaptivity Intensity: {settings.adaptivityLevel}/10
                </Label>
              </div>
              <Slider
                id="adaptivity-level"
                defaultValue={[settings.adaptivityLevel]}
                max={10}
                min={1}
                step={1}
                onValueChange={handleAdaptivityLevelChange}
                disabled={!settings.enableAdaptiveLearning}
                className="my-4"
              />
              <p className="text-sm text-muted-foreground">
                Higher values make the system adapt more aggressively to your performance patterns
              </p>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2">
                <BarChart3 className="h-4 w-4 text-indigo-600" />
                <Label htmlFor="difficulty-preference">
                  Difficulty Preference
                </Label>
              </div>
              <Select 
                defaultValue={settings.difficultyPreference}
                onValueChange={(value) => 
                  setSettings({...settings, difficultyPreference: value})
                }
                disabled={!settings.enableAdaptiveLearning}
              >
                <SelectTrigger id="difficulty-preference" className="w-full">
                  <SelectValue placeholder="Select difficulty preference" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="easier">Easier - Focus on building confidence</SelectItem>
                  <SelectItem value="balanced">Balanced - Mix of easy and challenging questions</SelectItem>
                  <SelectItem value="challenging">Challenging - Push your limits</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground mt-2">
                This setting affects the overall difficulty of questions selected for you
              </p>
            </div>
          </div>
        </form>
      </CardContent>
      <CardFooter>
        <Button 
          type="submit"
          disabled={isLoading || !settings.enableAdaptiveLearning}
          onClick={handleSubmit}
          className="w-full"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Settings
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default AdaptiveSettingsForm;