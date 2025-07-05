import React, { useEffect, useState, useMemo } from 'react';
import * as workoutService from '../services/workoutService';
import { WorkoutSession } from '../types';

interface WeightProgressChartProps {
  userId: string;
}

// Muestra el peso máximo registrado por ejercicio a lo largo del tiempo
const WeightProgressChart: React.FC<WeightProgressChartProps> = ({ userId }) => {
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    setIsLoading(true);
    const unsub = workoutService.getWorkoutSessionsListener(
      userId,
      (data) => {
        setSessions(data);
        setIsLoading(false);
      },
      () => setIsLoading(false)
    );
    return () => unsub();
  }, [userId]);

  // Agrupa por ejercicio y obtiene el peso máximo por fecha
  const progressData = useMemo(() => {
    const byExercise: Record<string, { name: string; data: { date: string; maxKg: number }[] }> = {};
    sessions.forEach(session => {
      session.loggedExercises.forEach(ex => {
        const maxSet = ex.setsPerformed.reduce((max, set) => {
          const kg = parseFloat(set.weightKg);
          return !isNaN(kg) && kg > max ? kg : max;
        }, 0);
        if (!byExercise[ex.exerciseName]) byExercise[ex.exerciseName] = { name: ex.exerciseName, data: [] };
        byExercise[ex.exerciseName].data.push({ date: session.date, maxKg: maxSet });
      });
    });
    return byExercise;
  }, [sessions]);

  if (isLoading) return <div className="text-center py-8 text-slate-400">Cargando progreso de peso...</div>;
  if (Object.keys(progressData).length === 0) return <div className="text-center py-8 text-slate-400">No hay datos de peso registrados.</div>;

  return (
    <div className="space-y-8">
      {Object.values(progressData).map(ex => (
        <div key={ex.name} className="bg-zinc-900/80 rounded-xl p-4 border border-violet-700/40 shadow-sm">
          <h4 className="text-violet-300 font-bold mb-2 text-base">{ex.name}</h4>
          <div className="flex items-end gap-2 h-32">
            {ex.data.slice(-7).map((d, i) => (
              <div key={i} className="flex flex-col items-center flex-1">
                <div className="w-7 bg-violet-500/80 rounded-t-md" style={{ height: `${(d.maxKg / Math.max(...ex.data.map(e => e.maxKg), 1)) * 100}%`, minHeight: 8 }}></div>
                <span className="text-xs text-slate-400 mt-1">{d.maxKg}kg</span>
                <span className="text-[10px] text-slate-500">{new Date(d.date).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default WeightProgressChart;
