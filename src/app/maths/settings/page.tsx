'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useUser } from '@clerk/nextjs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Slider } from '@/components/ui/slider';
import { 
  ChevronLeft, 
  Brain, 
  Settings, 
  Sliders, 
  BarChart4,
  Save,
  RefreshCw
} from 'lucide-react';

type AdaptiveSettings = {
  adaptivityLevel: number;
  difficultyPreference: string;
  enableAdaptiveLearning: boolean;
};

export default function MathsSettingsPage() {
  const { user, isLoaded } = useUser();
  const [settings, setSettings] = useState<AdaptiveSettings>({
    adaptivityLevel: 5,
    difficultyPreference: 'balanced',
    enableAdaptiveLearning: true
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Fetch user settings
  useEffect(() => {
    const fetchSettings = async () => {
      if (!user?.id) return;
      
      try {
        setLoading(true);
        const response = await fetch('/api/maths/adaptive-settings');
        
        if (!response.ok) {
          throw new Error('Failed to fetch settings');
        }
        
        const data = await response.json();
        
        if (data.success) {
          setSettings(data.settings);
        } else {
          throw new Error(data.error || 'Unknown error');
        }
      } catch (err) {
        console.error('Error fetching adaptive settings:', err);
        setError('Failed to load settings. Using defaults.');
      } finally {
        setLoading(false);
      }
    };
    
    if (isLoaded && user) {
      fetchSettings();
    }
  }, [isLoaded, user]);

  // Save settings
  const saveSettings = async () => {
    if (!user?.id) return;
    
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);
      
      const response = await fetch('/api/maths/adaptive-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(settings)
      });
      
      if (!response.ok) {
        throw new Error('Failed to save settings');
      }
      
      const data = await response.json();
      
      if (data.success) {
        setSuccess('Settings saved successfully');
      } else {
        throw new Error(data.error || 'Unknown error');
      }
    } catch (err) {
      console.error('Error saving adaptive settings:', err);
      setError('Failed to save settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Reset to defaults
  const resetToDefaults = () => {
    setSettings({
      adaptivityLevel: 5,
      difficultyPreference: 'balanced',
      enableAdaptiveLearning: true
    });
    
    setSuccess(null);
    setError(null);
  };

  if (!isLoaded || loading) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="mb-4 h-6 w-32 bg-gray-200 rounded animate-pulse"></div>
        <Card className="shadow-sm">
          <CardHeader>
            <div className="h-6 w-48 bg-gray-200 rounded animate-pulse mb-2"></div>
            <div className="h-4 w-64 bg-gray-200 rounded animate-pulse"></div>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="h-24 bg-gray-100 rounded animate-pulse"></div>
              <div className="h-24 bg-gray-100 rounded animate-pulse"></div>
              <div className="h-24 bg-gray-100 rounded animate-pulse"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-6 max-w-4xl mx-auto text-center">
        <p className="text-gray-600">Please sign in to access settings.</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-4">
        <Link href="/maths">
          <Button variant="ghost" className="flex items-center gap-1 text-blue-600 hover:text-blue-800 p-0">
            <ChevronLeft className="h-4 w-4" />
            <span>Back to Mathematics</span>
          </Button>
        </Link>
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-gray-700" />
            <span>Mathematics Settings</span>
          </CardTitle>
          <CardDescription>
            Configure your learning experience and preferences
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
              {error}
            </div>
          )}
          
          {success && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md text-green-700 text-sm">
              {success}
            </div>
          )}

          <div className="space-y-6">
            {/* Adaptive Learning Toggle */}
            <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-indigo-600" />
                  <h3 className="font-medium text-indigo-900">Adaptive Learning</h3>
                </div>
                <Switch
                  checked={settings.enableAdaptiveLearning}
                  onCheckedChange={(checked) => 
                    setSettings(prev => ({ ...prev, enableAdaptiveLearning: checked }))
                  }
                  aria-label="Enable adaptive learning"
                />
              </div>
              <p className="text-sm text-indigo-700 mb-2">
                Adaptive learning personalizes your practice experience by adjusting questions to your skill level and focusing on areas that need improvement.
              </p>
              
              {settings.enableAdaptiveLearning && (
                <div className="mt-4 space-y-6">
                  {/* Adaptivity Level */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Sliders className="h-4 w-4 text-indigo-600" />
                      <Label className="text-sm font-medium text-indigo-800">Adaptivity Intensity</Label>
                    </div>
                    <div className="mb-1">
                      <Slider 
                        value={[settings.adaptivityLevel]}
                        min={1}
                        max={10}
                        step={1}
                        onValueChange={(value) => 
                          setSettings(prev => ({ ...prev, adaptivityLevel: value[0] }))
                        }
                        className="py-4"
                      />
                    </div>
                    <div className="flex justify-between text-xs text-indigo-600">
                      <span>Subtle</span>
                      <span>Balanced</span>
                      <span>Aggressive</span>
                    </div>
                    <p className="text-xs text-indigo-600 mt-2">
                      {settings.adaptivityLevel <= 3 ? 
                        "Subtle adaptation with gradual difficulty changes" : 
                        settings.adaptivityLevel <= 7 ? 
                          "Balanced adaptation that responds moderately to your performance" : 
                          "Aggressive adaptation that quickly adjusts based on your performance"
                      }
                    </p>
                  </div>
                  
                  {/* Difficulty Preference */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <BarChart4 className="h-4 w-4 text-indigo-600" />
                      <Label className="text-sm font-medium text-indigo-800">Difficulty Preference</Label>
                    </div>
                    <RadioGroup 
                      value={settings.difficultyPreference}
                      onValueChange={(value) => 
                        setSettings(prev => ({ ...prev, difficultyPreference: value }))
                      }
                      className="space-y-3"
                    >
                      <div className="flex items-start space-x-2">
                        <RadioGroupItem value="easier" id="easier" className="mt-1" />
                        <div>
                          <Label htmlFor="easier" className="text-sm font-medium text-indigo-800">
                            Confidence Building
                          </Label>
                          <p className="text-xs text-indigo-600">
                            Focus on strengthening fundamentals with slightly easier questions
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-start space-x-2">
                        <RadioGroupItem value="balanced" id="balanced" className="mt-1" />
                        <div>
                          <Label htmlFor="balanced" className="text-sm font-medium text-indigo-800">
                            Balanced
                          </Label>
                          <p className="text-xs text-indigo-600">
                            Mix of questions at your current skill level
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-start space-x-2">
                        <RadioGroupItem value="challenging" id="challenging" className="mt-1" />
                        <div>
                          <Label htmlFor="challenging" className="text-sm font-medium text-indigo-800">
                            Challenging
                          </Label>
                          <p className="text-xs text-indigo-600">
                            Push your limits with slightly more difficult questions
                          </p>
                        </div>
                      </div>
                    </RadioGroup>
                  </div>
                </div>
              )}
            </div>
            
            {/* Action Buttons */}
            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={resetToDefaults}
                className="flex items-center gap-1"
                disabled={saving}
              >
                <RefreshCw className="h-4 w-4" />
                <span>Reset to Defaults</span>
              </Button>
              
              <Button
                onClick={saveSettings}
                className="flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700"
                disabled={saving}
              >
                {saving ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    <span>Save Settings</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}