// app/api/vocabulary/update-streak/route.ts
import { NextResponse, NextRequest } from 'next/server';
import { db } from '@/db';
import { userStreaks } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getAuth } from '@clerk/nextjs/server';

async function handleRequest(req: NextRequest) {
    try {
        const { userId } = getAuth(req);
        if (!userId) {
            return new NextResponse(
                JSON.stringify({ error: "Unauthorized" }),
                { status: 401, headers: { 'Content-Type': 'application/json' } }
            );
        }

        // Get current streak
        let [userStreak] = await db.select()
            .from(userStreaks)
            .where(eq(userStreaks.userId, userId));

        const now = new Date();
        const lastActivity = userStreak?.lastActivityAt || new Date(0);
        
        // Calculate days between last activity and now
        const daysDiff = Math.floor(
            (now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24)
        );

        let currentStreak = userStreak?.currentStreak || 0;
        let longestStreak = userStreak?.longestStreak || 0;

        // Update streak based on activity gap
        if (daysDiff <= 1) {
            // Maintain or increment streak
            if (daysDiff === 1) {
                currentStreak += 1;
                longestStreak = Math.max(currentStreak, longestStreak);
            }
        } else {
            // Reset streak if more than 1 day has passed
            currentStreak = 1;
        }

        // Update or create streak record
        if (userStreak) {
            [userStreak] = await db
                .update(userStreaks)
                .set({
                    currentStreak,
                    longestStreak,
                    lastActivityAt: now,
                })
                .where(eq(userStreaks.userId, userId))
                .returning();
        } else {
            [userStreak] = await db
                .insert(userStreaks)
                .values({
                    userId,
                    currentStreak,
                    longestStreak,
                    lastActivityAt: now,
                })
                .returning();
        }

        return NextResponse.json({
            currentStreak,
            longestStreak,
            lastActivityAt: now
        });
    } catch (error) {
        console.error('Error updating streak:', error);
        return new NextResponse(
            JSON.stringify({ 
                error: "Failed to update streak",
                details: error instanceof Error ? error.message : 'Unknown error'
            }),
            { 
                status: 500, 
                headers: { 'Content-Type': 'application/json' }
            }
        );
    }
}

export const POST = handleRequest;
export const PUT = handleRequest;