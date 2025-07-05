
import { WorkoutSession } from '../types';
import { generateId } from './routineService'; // Assuming generateId is exported from routineService

// --- Internal Helper Functions ---

const getWorkoutsStorageKey = (userId: string): string => `gymMaxWorkouts_${userId}`;

const getAllWorkoutSessions = (userId: string): WorkoutSession[] => {
    if (!userId) return [];
    try {
        const sessionsJson = localStorage.getItem(getWorkoutsStorageKey(userId));
        // Ensure that parsed data is an array
        const sessions = sessionsJson ? JSON.parse(sessionsJson) : [];
        return Array.isArray(sessions) ? sessions : [];
    } catch (error) {
        console.error("Error reading workout sessions from localStorage:", error);
        // In case of error, clear corrupted data to prevent future issues
        localStorage.removeItem(getWorkoutsStorageKey(userId));
        return [];
    }
};

const saveAllWorkoutSessions = (userId: string, sessions: WorkoutSession[]): boolean => {
    if (!userId) return false;
    try {
        localStorage.setItem(getWorkoutsStorageKey(userId), JSON.stringify(sessions));
        return true;
    } catch (error) {
        console.error("Error saving workout sessions to localStorage:", error);
        return false;
    }
};


// --- Exported Service Functions ---

/**
 * Adds a new workout session to localStorage.
 * @param userId - The ID of the user.
 * @param sessionData - The workout session data to save.
 * @returns A promise that resolves to the newly created WorkoutSession or null on failure.
 */
export const addWorkoutSession = async (userId: string, sessionData: Omit<WorkoutSession, 'id' | 'userId'>): Promise<WorkoutSession | null> => {
    if (!userId) {
        console.error("User ID is required to add a workout session.");
        return null;
    }
    
    const allSessions = getAllWorkoutSessions(userId);
    const newSession: WorkoutSession = {
        ...sessionData,
        id: generateId(),
        userId,
    };
    
    allSessions.push(newSession);
    
    const success = saveAllWorkoutSessions(userId, allSessions);
    
    return success ? newSession : null;
};

/**
 * Reads all workout sessions from localStorage for a user.
 * This is not a real-time listener.
 * @param userId - The ID of the user.
 * @param callback - Function to be called with the session data.
 * @param onError - Function to be called on error.
 * @returns An empty unsubscribe function.
 */
export const getWorkoutSessionsListener = (
    userId: string,
    callback: (sessions: WorkoutSession[]) => void,
    onError: (error: Error) => void
): (() => void) => {
    if (!userId) {
        onError(new Error("User ID is required."));
        return () => {}; // Return an empty unsubscribe function
    }

    try {
        const sessions = getAllWorkoutSessions(userId);
        // The listener in ProgressChartView expects data sorted desc
        sessions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        callback(sessions);
    } catch (err) {
        onError(err instanceof Error ? err : new Error("An unknown error occurred while reading workout sessions."));
    }

    // Return an empty unsubscribe function as this is a one-time read.
    return () => {};
};

/**
 * Gets the most recent workout log for a specific routine from localStorage.
 * @param userId - The ID of the user.
 * @param routineId - The ID of the routine to find the latest log for.
 * @returns A promise resolving to the latest WorkoutSession or null if not found.
 */
export const getLatestLog = async (userId: string, routineId: string): Promise<WorkoutSession | null> => {
    if (!userId || !routineId) return null;
    
    const allSessions = getAllWorkoutSessions(userId);
    
    const routineSessions = allSessions.filter(session => session.routineId === routineId);
    
    if (routineSessions.length === 0) {
        return null;
    }
    
    // Sort by date descending to find the latest
    routineSessions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    return routineSessions[0];
};

/**
 * Extracts a sorted list of unique main exercise names from a list of sessions.
 * @param sessions - An array of WorkoutSession objects.
 * @returns A sorted array of unique exercise names.
 */
export const getUniqueLoggedExercises = (sessions: WorkoutSession[]): string[] => {
  const exerciseNames = new Set<string>();
  sessions.forEach(session => {
    session.loggedExercises.forEach(loggedEx => {
      if (!loggedEx.isWarmUp) { // Only count main exercises for progress tracking
        exerciseNames.add(loggedEx.exerciseName);
      }
    });
  });
  return Array.from(exerciseNames).sort();
};
