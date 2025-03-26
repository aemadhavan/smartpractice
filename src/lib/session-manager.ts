// src/lib/session-manager.ts
// Modified to align with the SessionManager interface

import { SessionManager as SessionManagerInterface, AttemptData } from '@/types/quiz';

/**
 * SessionManager - Handles test session initialization, tracking and completion
 * This utility prevents duplicate session creation
 */
class SessionManager implements SessionManagerInterface {
    private static instance: SessionManager;
    private activeSessionId: number | null = null;
    private isInitializing: boolean = false;
    private pendingPromise: Promise<number | null> | null = null;
  
    private constructor() {}
  
    public static getInstance(): SessionManager {
      if (!SessionManager.instance) {
        SessionManager.instance = new SessionManager();
      }
      return SessionManager.instance;
    }
  
    /**
     * Initialize a new session if one doesn't already exist
     * Implementation aligned with the SessionManagerInterface
     */
    public async initSession(
      userId: string,
      subtopicId: number,
      initSessionEndpoint: string,
      retryCount: number = 3
    ): Promise<number | null> {
      console.log('SessionManager.initSession called', { 
        userId, 
        subtopicId, 
        existingSessionId: this.activeSessionId,
        isInitializing: this.isInitializing 
      });
  
      // If we already have an active session, return it
      if (this.activeSessionId !== null) {
        console.log('Using existing session:', this.activeSessionId);
        return this.activeSessionId;
      }
  
      // If initialization is in progress, return the pending promise
      if (this.isInitializing && this.pendingPromise) {
        console.log('Session initialization already in progress, returning pending promise');
        return this.pendingPromise;
      }
  
      // Start initialization
      this.isInitializing = true;
      
      console.log('Initializing new session for subtopic:', subtopicId);
      this.pendingPromise = new Promise<number | null>(async (resolve, reject) => {
        try {
          const initResponse = await fetch(initSessionEndpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              userId,
              subtopicId
            })
          });
          
          if (!initResponse.ok) {
            const errorText = await initResponse.text();
            console.error('Failed to initialize test session:', errorText);
            
            // Retry logic
            if (retryCount > 0) {
              this.isInitializing = false;
              const result = await this.initSession(userId, subtopicId, initSessionEndpoint, retryCount - 1);
              resolve(result);
              return;
            }
            
            reject(new Error(`Failed to initialize session: ${initResponse.status} ${errorText}`));
            return;
          }
          
          const initResult = await initResponse.json();
          if (initResult.testAttemptId) {
            console.log('Session initialized with ID:', initResult.testAttemptId);
            this.activeSessionId = initResult.testAttemptId;
            resolve(this.activeSessionId);
          } else {
            console.error('Invalid response from init-session API:', initResult);
            reject(new Error('Invalid response from server'));
          }
        } catch (error) {
          console.error('Error initializing test session:', error);
          reject(error);
        } finally {
          this.isInitializing = false;
        }
      });
  
      return this.pendingPromise;
    }
  
    /**
     * Track an attempt in the current session
     * Aligned with the SessionManagerInterface
     */
    public async trackAttempt(
      attemptData: AttemptData,
      trackAttemptEndpoint: string
    ): Promise<boolean> {
      if (!this.activeSessionId) {
        console.error('Cannot track attempt - no valid session ID');
        return false;
      }
  
      try {
        console.log('Tracking attempt for question:', attemptData.questionId, 'with session:', this.activeSessionId);
        const apiResponse = await fetch(trackAttemptEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            testSessionId: this.activeSessionId,
            ...attemptData
          })
        });
        
        if (!apiResponse.ok) {
          console.error('Failed to submit answer');
          return false;
        }
        
        console.log('Answer submitted successfully');
        return true;
      } catch (error) {
        console.error('Error submitting answer:', error);
        return false;
      }
    }
  
    /**
     * Complete the current session
     * Aligned with the SessionManagerInterface
     */
    public async completeSession(
      userId: string,
      sessionId: number | null,
      completeSessionEndpoint: string
    ): Promise<boolean> {
      // Use the passed sessionId if provided, otherwise use active session
      const idToComplete = sessionId || this.activeSessionId;
      
      if (!idToComplete) {
        console.log('No session ID to complete');
        return true;
      }
      
      try {
        console.log('Completing test session:', idToComplete);
        const completeResponse = await fetch(completeSessionEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            testSessionId: idToComplete,
            userId
          })
        });
        
        if (completeResponse.ok) {
          console.log('Test session completed successfully');
          this.reset(); // Reset the manager
          return true;
        } else {
          const errorText = await completeResponse.text();
          console.error('Failed to complete test session:', 
            completeResponse.status, errorText);
          return false;
        }
      } catch (error) {
        console.error('Error completing test session:', error);
        return false;
      }
    }
  
    /**
     * Get the current session ID
     */
    public getSessionId(): number | null {
      return this.activeSessionId;
    }
  
    /**
     * Set the session ID manually (useful when loading from props)
     */
    public setSessionId(sessionId: number | null): void {
      this.activeSessionId = sessionId;
    }
  
    /**
     * Reset the session manager
     */
    public reset(): void {
      this.activeSessionId = null;
      this.isInitializing = false;
      this.pendingPromise = null;
    }
  }
  
  export default SessionManager.getInstance();