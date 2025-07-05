import { useState, useEffect } from 'react';
import * as routineService from '../../services/routineService';
import * as workoutService from '../../services/workoutService';
import { Routine, Day, WorkoutSession } from '../../types';

export interface SuggestedWorkout {
  routineId: string;
  dayId: string;
  routineName: string;
  dayName: string;
}

export const useNextWorkoutSuggestion = (userId: string) => {
  const [suggestion, setSuggestion] = useState<SuggestedWorkout | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
        setIsLoading(false);
        return;
    }

    const findSuggestion = async () => {
      setIsLoading(true);
      try {
        const routines = routineService.getRoutines(userId);
        if (routines.length === 0) {
            setSuggestion(null);
            return;
        }

        // Use the most recently updated routine as the "active" one
        const sortedRoutines = [...routines].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
        const activeRoutine = sortedRoutines[0]; 

        if (!activeRoutine || activeRoutine.days.length === 0) {
          setSuggestion(null);
          return;
        }

        const sortedDays = [...activeRoutine.days].sort((a, b) => a.order - b.order);

        const lastLog = await workoutService.getLatestLog(userId, activeRoutine.id);

        let nextDay: Day;
        if (lastLog) {
          const lastDayIndex = sortedDays.findIndex(d => d.id === lastLog.dayId);
          if (lastDayIndex === -1) {
            // Last logged day not in current version of routine, suggest first day
            nextDay = sortedDays[0];
          } else {
            // The next day is the one that follows, or the first one if the last was the final day (cycle)
            nextDay = sortedDays[(lastDayIndex + 1) % sortedDays.length];
          }
        } else {
          // If no logs for this routine, suggest the first day
          nextDay = sortedDays[0];
        }

        if (nextDay) {
          setSuggestion({
            routineId: activeRoutine.id,
            dayId: nextDay.id,
            routineName: activeRoutine.name,
            dayName: nextDay.name || `Día ${nextDay.order + 1}`,
          });
        }

      } catch (error) {
        console.error("Error finding next workout suggestion:", error);
        setSuggestion(null);
      } finally {
        setIsLoading(false);
      }
    };

    findSuggestion();
  }, [userId]);

  return { suggestion, isLoading };
};
