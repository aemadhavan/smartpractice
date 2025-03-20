// src/app/api/maths/adaptive-settings/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { userAdaptiveSettings } from '@/db/adaptive-schema';
import { eq } from 'drizzle-orm';
import { auth } from '@clerk/nextjs/server';

export const dynamic = 'force-dynamic';

// Define a type for the update data to avoid using 'any'
type UserAdaptiveSettingsUpdate = {
  adaptivityLevel?: number;
  difficultyPreference?: string;
  enableAdaptiveLearning?: boolean;
  updatedAt?: Date;
};

// GET user's adaptive settings
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function GET(_request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get user settings
    const settings = await db.query.userAdaptiveSettings.findFirst({
      where: (settings, { eq }) => eq(settings.userId, userId)
    });

    // If no settings exist, create default settings
    if (!settings) {
      const defaultSettings = {
        userId,
        adaptivityLevel: 5,
        difficultyPreference: 'balanced',
        enableAdaptiveLearning: true
      };

      await db.insert(userAdaptiveSettings).values(defaultSettings);
      
      return NextResponse.json({
        success: true,
        settings: defaultSettings
      });
    }

    return NextResponse.json({
      success: true,
      settings
    });
  } catch (error) {
    console.error('Error in GET adaptive settings:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST to update user's adaptive settings
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const data = await request.json();
    const { 
      adaptivityLevel, 
      difficultyPreference, 
      enableAdaptiveLearning 
    } = data;

    // Validate input
    if (adaptivityLevel !== undefined && (adaptivityLevel < 1 || adaptivityLevel > 10)) {
      return NextResponse.json(
        { success: false, error: 'Adaptivity level must be between 1 and 10' },
        { status: 400 }
      );
    }

    if (difficultyPreference !== undefined && 
        !['easier', 'balanced', 'challenging'].includes(difficultyPreference)) {
      return NextResponse.json(
        { success: false, error: 'Invalid difficulty preference' },
        { status: 400 }
      );
    }

    // Check if settings exist
    const existingSettings = await db.query.userAdaptiveSettings.findFirst({
      where: (settings, { eq }) => eq(settings.userId, userId)
    });

    if (existingSettings) {
      // Update existing settings
      const updateData: UserAdaptiveSettingsUpdate = {};
      
      if (adaptivityLevel !== undefined) {
        updateData.adaptivityLevel = adaptivityLevel;
      }
      
      if (difficultyPreference !== undefined) {
        updateData.difficultyPreference = difficultyPreference;
      }
      
      if (enableAdaptiveLearning !== undefined) {
        updateData.enableAdaptiveLearning = enableAdaptiveLearning;
      }
      
      updateData.updatedAt = new Date();
      
      await db.update(userAdaptiveSettings)
        .set(updateData)
        .where(eq(userAdaptiveSettings.userId, userId));
        
      return NextResponse.json({
        success: true,
        settings: {
          ...existingSettings,
          ...updateData
        }
      });
    } else {
      // Create new settings
      const newSettings = {
        userId,
        adaptivityLevel: adaptivityLevel ?? 5,
        difficultyPreference: difficultyPreference ?? 'balanced',
        enableAdaptiveLearning: enableAdaptiveLearning ?? true
      };
      
      await db.insert(userAdaptiveSettings).values(newSettings);
      
      return NextResponse.json({
        success: true,
        settings: newSettings
      });
    }
  } catch (error) {
    console.error('Error in POST adaptive settings:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}