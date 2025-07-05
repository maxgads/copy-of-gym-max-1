
import { Routine } from '../types';

// Simple unique ID generator
export const generateId = () => '_' + Math.random().toString(36).substr(2, 9);

const getRoutinesStorageKey = (userId: string) => `gymMaxRoutines_${userId}`;

const getAllRoutines = (userId: string): Routine[] => {
    if (!userId) return [];
    try {
        const routinesJson = localStorage.getItem(getRoutinesStorageKey(userId));
        return routinesJson ? JSON.parse(routinesJson) : [];
    } catch (error) {
        console.error("Error reading routines from localStorage:", error);
        return [];
    }
};

const saveAllRoutines = (userId: string, routines: Routine[]) => {
    if (!userId) return;
    try {
        localStorage.setItem(getRoutinesStorageKey(userId), JSON.stringify(routines));
    } catch (error) {
        console.error("Error saving routines to localStorage:", error);
    }
};

export const getRoutines = (userId: string): Routine[] => {
    return getAllRoutines(userId);
}

export const addRoutine = async (userId: string, routineData: Omit<Routine, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<Routine> => {
    const allRoutines = getAllRoutines(userId);
    const timestamp = new Date().toISOString();
    
    const newRoutine: Routine = {
        ...routineData,
        id: generateId(),
        userId,
        createdAt: timestamp,
        updatedAt: timestamp,
    };

    allRoutines.push(newRoutine);
    saveAllRoutines(userId, allRoutines);
    return Promise.resolve(newRoutine);
};

export const getRoutineById = async (userId: string, routineId: string): Promise<Routine | null> => {
  const allRoutines = getAllRoutines(userId);
  const routine = allRoutines.find(r => r.id === routineId) || null;
  return Promise.resolve(routine);
};

export const updateRoutine = async (userId: string, updatedRoutine: Routine): Promise<boolean> => {
  if (!userId || !updatedRoutine || !updatedRoutine.id) return Promise.resolve(false);
  
  let allRoutines = getAllRoutines(userId);
  const routineIndex = allRoutines.findIndex(r => r.id === updatedRoutine.id);

  if (routineIndex === -1) {
    return Promise.resolve(false); // Routine not found
  }

  allRoutines[routineIndex] = {
      ...updatedRoutine,
      updatedAt: new Date().toISOString(),
  };

  saveAllRoutines(userId, allRoutines);
  return Promise.resolve(true);
};

export const deleteRoutine = async (userId: string, routineId: string): Promise<boolean> => {
  if (!userId || !routineId) return Promise.resolve(false);

  let allRoutines = getAllRoutines(userId);
  const filteredRoutines = allRoutines.filter(r => r.id !== routineId);

  if (allRoutines.length === filteredRoutines.length) {
    return Promise.resolve(false); // Nothing was deleted
  }

  saveAllRoutines(userId, filteredRoutines);
  return Promise.resolve(true);
};

// This function is for the dashboard to get all routines.
export const getRoutinesListener = (
    userId: string,
    callback: (routines: Routine[]) => void,
    onError: (error: Error) => void
) => {
    try {
        const allRoutines = getAllRoutines(userId);
        // Sort by updatedAt descending to show most recent first
        allRoutines.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
        callback(allRoutines);
    } catch (err) {
        onError(err instanceof Error ? err : new Error("An unknown error occurred"));
    }
    // Since this isn't a real-time listener, we return an empty unsubscribe function.
    // The component will need to re-fetch manually if it needs updated data.
    return () => {};
};

// Helper to generate IDs for days and exercises if not present
export const ensureDayExerciseIds = (routine: Routine): Routine => {
    return {
        ...routine,
        days: routine.days.map((day, dayIndex) => ({
            ...day,
            id: day.id || generateId(),
            order: day.order !== undefined ? day.order : dayIndex,
            name: day.name || `Día ${dayIndex + 1}`,
            exercises: day.exercises.map(ex => ({
                ...ex,
                id: ex.id || generateId(),
            })),
            warmUpExercises: (day.warmUpExercises || []).map(wEx => ({
                ...wEx,
                id: wEx.id || generateId(),
            })),
        })),
    };
};

export const importFullRoutine = async (userId: string, parsedRoutineData: Partial<Routine>): Promise<Routine | null> => {
  if (!userId || !parsedRoutineData || !parsedRoutineData.name) {
    console.error("Invalid data for importing routine: userId or routine name missing.");
    return null;
  }
  
  const routineBase: Omit<Routine, 'id' | 'userId' | 'createdAt' | 'updatedAt'> = {
    name: parsedRoutineData.name,
    description: parsedRoutineData.description || undefined,
    days: (parsedRoutineData.days || []).map((day, dayIndex) => ({
        id: day.id || generateId(),
        name: day.name || `Día ${dayIndex + 1}`,
        order: day.order !== undefined ? day.order : dayIndex,
        exercises: (day.exercises || []).map(ex => ({ ...ex, id: ex.id || generateId() })),
        warmUpExercises: (day.warmUpExercises || []).map(wEx => ({ ...wEx, id: wEx.id || generateId() }))
    })),
  };
  
  return await addRoutine(userId, routineBase);
};