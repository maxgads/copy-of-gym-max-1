
import { useState, useEffect } from 'react';
import * as workoutService from '../../services/workoutService';
import * as routineService from '../../services/routineService';
import { WorkoutSession } from '../../types';

interface WeeklySummary {
    workoutsDone: number;
    workoutsTotal: number;
    volume: number;
}

export const useWeeklySummary = (userId: string) => {
    const [summary, setSummary] = useState<WeeklySummary>({ workoutsDone: 0, workoutsTotal: 0, volume: 0 });
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!userId) {
            setIsLoading(false);
            return;
        }

        const calculateSummary = () => {
            setIsLoading(true);
            try {
                // Fetch sessions and routines
                const routines = routineService.getRoutines(userId);
                workoutService.getWorkoutSessionsListener(userId, (allSessions) => {
                    // 1. Calculate workoutsTotal from the most recent routine
                    let workoutsTotal = 0;
                    if (routines.length > 0) {
                        const sortedRoutines = [...routines].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
                        workoutsTotal = sortedRoutines[0]?.days.length || 0;
                    }

                    // 2. Filter sessions for the last 7 days
                    const oneWeekAgo = new Date();
                    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
                    const recentSessions = allSessions.filter(s => new Date(s.date) >= oneWeekAgo);

                    // 3. Calculate workoutsDone
                    const doneDays = new Set(recentSessions.map(s => new Date(s.date).toDateString()));
                    const workoutsDone = doneDays.size;

                    // 4. Calculate volume
                    let totalVolume = 0;
                    recentSessions.forEach(session => {
                        session.loggedExercises.forEach(loggedEx => {
                            loggedEx.setsPerformed.forEach(set => {
                                const reps = parseInt(String(set.reps).split('-')[0].trim(), 10); // Handle "8-12" by taking the lower bound
                                const weight = parseFloat(String(set.weightKg).replace(',', '.'));
                                if (!isNaN(reps) && !isNaN(weight) && weight > 0) {
                                    totalVolume += reps * weight;
                                }
                            });
                        });
                    });
                    
                    setSummary({
                        workoutsDone,
                        workoutsTotal,
                        volume: Math.round(totalVolume),
                    });
                    setIsLoading(false);
                }, (err) => {
                     throw err;
                });
            } catch (error) {
                console.error("Error calculating weekly summary:", error);
                setSummary({ workoutsDone: 0, workoutsTotal: 0, volume: 0 });
                setIsLoading(false);
            }
        };

        calculateSummary();
    }, [userId]);

    return { summary, isLoading };
};
