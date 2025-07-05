import React, { useState, useEffect, useMemo } from 'react';
import * as nutritionService from '../services/nutritionService';
import { WorkoutSession } from '../types';
import LoadingSpinner from './LoadingSpinner';

const ChartSkeleton = () => (
    <div className="flex justify-around items-end h-64 gap-2 border-l border-b border-slate-700 p-2 animate-pulse">
        {Array.from({ length: 7 }).map((_, i) => (
             <div key={i} className="flex-1 flex flex-col items-center justify-end gap-2 group">
                <div className="w-full bg-slate-700 rounded-t-md" style={{height: `${Math.random() * 80 + 10}%`}}></div>
             </div>
        ))}
    </div>
);

const ProgressChartView = ({ userId }: { userId: string }) => {
  const [chartData, setChartData] = useState<{date: string, calories: number}[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
        setIsLoading(false);
        setError("Usuario no válido.");
        return;
    }

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const data = await nutritionService.getWeeklyChartData(userId);
            setChartData(data);
        } catch (e) {
            console.error(e);
            setError("No se pudieron cargar los datos del gráfico.");
        } finally {
            setIsLoading(false);
        }
    };
    
    fetchData();
  }, [userId]);
  
  const maxCalories = useMemo(() => {
      if (chartData.length === 0) return 1; // Avoid division by zero
      return Math.max(...chartData.map(d => d.calories), 2000); // Set a minimum height for the chart
  }, [chartData]);


  if (error) {
      return <p className="text-rose-400 text-center py-10 bg-rose-800/30 rounded-lg">{error}</p>;
  }

  return (
    <div className="bg-slate-800 p-4 sm:p-6 rounded-xl shadow-2xl space-y-6 text-white border border-slate-700/50">
        <h3 className="text-xl font-bold text-violet-300">Consumo de Calorías (Últimos 7 Días)</h3>
        {isLoading ? <ChartSkeleton /> : (
            <div className="flex justify-around items-end h-64 gap-2 border-l border-b border-slate-700 p-2">
                {chartData.map((day, index) => (
                    <div key={index} className="flex-1 flex flex-col items-center justify-end gap-2 group">
                        <div className="text-xs font-bold text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity -mb-2">{day.calories.toFixed(0)}</div>
                        <div className="w-full bg-violet-500 hover:bg-violet-400 rounded-t-md transition-all duration-300" 
                            style={{ height: `${(day.calories / maxCalories) * 100}%` }}
                        ></div>
                        <div className="text-xs text-slate-400 font-medium capitalize">{day.date}</div>
                    </div>
                ))}
            </div>
        )}
    </div>
  );
};

export default ProgressChartView;
