// src/app/api/quantitative/adaptive-settings/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { auth } from '@clerk/nextjs/server';
import { userQuantAdaptiveSettings } from '@/db/quantitative-adaptive-schema';

export const dynamic = 'force-dynamic';

// GET user's adaptive learning settings for Quantitative module
export async function GET(request: NextRequest) {
  try {
    // Remove the console.log(request) - this might be causing issues
    // console.log(request);  // REMOVE THIS LINE
    
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    try {
      // Find existing adaptive settings or create default settings
      let settings = await db.query.userQuantAdaptiveSettings.findFirst({
        where: (settings, { eq }) => eq(settings.userId, userId)
      });

      if (!settings) {
        // If no settings exist, insert default settings
        try {
          const [newSettings] = await db
            .insert(userQuantAdaptiveSettings)
            .values({
              userId,
              adaptivityLevel: 5,
              difficultyPreference: 'balanced',
              enableAdaptiveLearning: true
            })
            .returning();
          
          settings = newSettings;
        } catch (insertError) {
          console.error('Error inserting default settings:', insertError);
          // Fallback to default settings if insert fails
          return NextResponse.json({
            success: true,
            settings: {
              adaptivityLevel: 5,
              difficultyPreference: 'balanced',
              enableAdaptiveLearning: true
            }
          });
        }
      }

      return NextResponse.json({
        success: true,
        settings: {
          adaptivityLevel: settings.adaptivityLevel,
          difficultyPreference: settings.difficultyPreference,
          enableAdaptiveLearning: settings.enableAdaptiveLearning
        }
      });
    } catch (dbError) {
      console.error('Database error fetching adaptive settings:', dbError);
      // Return default settings in case of DB error
      return NextResponse.json({
        success: true,
        settings: {
          adaptivityLevel: 5,
          difficultyPreference: 'balanced',
          enableAdaptiveLearning: true
        }
      });
    }
  } catch (error) {
    console.error('Error fetching quantitative adaptive settings:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// PUT to update user's adaptive learning settings
export async function PUT(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { 
      adaptivityLevel, 
      difficultyPreference, 
      enableAdaptiveLearning 
    } = body;

    // Validate input
    if (
      (adaptivityLevel !== undefined && (adaptivityLevel < 1 || adaptivityLevel > 10)) ||
      (difficultyPreference && !['easy', 'balanced', 'hard'].includes(difficultyPreference)) ||
      (enableAdaptiveLearning !== undefined && typeof enableAdaptiveLearning !== 'boolean')
    ) {
      return NextResponse.json(
        { success: false, error: 'Invalid settings' },
        { status: 400 }
      );
    }

    // Update or create settings
    try {
      const [updatedSettings] = await db
        .insert(userQuantAdaptiveSettings)
        .values({
          userId,
          ...(adaptivityLevel !== undefined && { adaptivityLevel }),
          ...(difficultyPreference && { difficultyPreference }),
          ...(enableAdaptiveLearning !== undefined && { enableAdaptiveLearning })
        })
        .onConflictDoUpdate({
          target: userQuantAdaptiveSettings.userId,
          set: {
            ...(adaptivityLevel !== undefined && { adaptivityLevel }),
            ...(difficultyPreference && { difficultyPreference }),
            ...(enableAdaptiveLearning !== undefined && { enableAdaptiveLearning }),
            updatedAt: new Date()
          }
        })
        .returning();

      return NextResponse.json({
        success: true,
        settings: {
          adaptivityLevel: updatedSettings.adaptivityLevel,
          difficultyPreference: updatedSettings.difficultyPreference,
          enableAdaptiveLearning: updatedSettings.enableAdaptiveLearning
        }
      });
    } catch (dbError) {
      console.error('Database error updating adaptive settings:', dbError);
      return NextResponse.json(
        { success: false, error: 'Database error', message: dbError instanceof Error ? dbError.message : 'Unknown database error' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error updating quantitative adaptive settings:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}