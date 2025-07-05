import React, { useState, useEffect, useCallback } from 'react';
import { User } from 'firebase/auth';
import { AppView, Routine, Day, Exercise as RoutineExercise, WorkoutSession, LoggedExercise, PerformedSet } from '../../types';
import * as routineService from '../../services/routineService';
import * as workoutService from '../../services/workoutService';
import LoadingSpinner from '../LoadingSpinner';

const PlusIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
  </svg>
);

const TrashIconSmall: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
    </svg>
);

const ChevronDownIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
    </svg>
);

interface WorkoutLoggerViewProps {
  currentUser: User;
  routineId: string;
  dayId: string;
  navigateTo: (view: AppView) => void;
}

const WorkoutLoggerView: React.FC<WorkoutLoggerViewProps> = ({ currentUser, routineId, dayId, navigateTo }) => {
  const [routine, setRoutine] = useState<Routine | null>(null);
  const [day, setDay] = useState<Day | null>(null);
  const [loggedExercises, setLoggedExercises] = useState<LoggedExercise[]>([]);
  const [sessionNotes, setSessionNotes] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedExerciseId, setExpandedExerciseId] = useState<string | null>(null);

  const getPlannedExercise = useCallback((exerciseId: string): RoutineExercise | undefined => {
    return day?.exercises.find(ex => ex.id === exerciseId);
  }, [day]);

  const initializeLoggedExercises = useCallback((currentDay: Day | null, currentRoutine: Routine | null) => {
    if (!currentDay || !currentRoutine) return [];

    return currentDay.exercises.map(ex => ({
        id: routineService.generateId(),
        exerciseId: ex.id,
        exerciseName: ex.exerciseName,
        isWarmUp: false,
        setsPerformed: [{ id: routineService.generateId(), reps: '', weightKg: '', notes: '' }],
        exerciseNotes: '',
    }));
  }, []);

  useEffect(() => {
    const loadData = async () => {
        setIsLoading(true);
        setError(null);
        if (!currentUser?.uid || !routineId || !dayId) {
          setError("Faltan datos para cargar la sesión de entrenamiento.");
          setIsLoading(false);
          return;
        }
        try {
          const fetchedRoutine = await routineService.getRoutineById(currentUser.uid, routineId);
          if (fetchedRoutine) {
            setRoutine(fetchedRoutine);
            const currentDay = fetchedRoutine.days.find(d => d.id === dayId);
            if (currentDay) {
              setDay(currentDay);
              const initializedExercises = initializeLoggedExercises(currentDay, fetchedRoutine);
              setLoggedExercises(initializedExercises);
              // Expand the first exercise by default
              setExpandedExerciseId(initializedExercises[0]?.id || null);
            } else {
              setError("Día no encontrado en la rutina.");
              setDay(null);
              setLoggedExercises([]);
            }
          } else {
            setError("Rutina no encontrada.");
            setRoutine(null);
            setDay(null);
            setLoggedExercises([]);
          }
        } catch (err) {
          console.error("Error loading workout logger data:", err);
          setError("Error al cargar los datos para el registro.");
        } finally {
          setIsLoading(false);
        }
    };
    loadData();
  }, [currentUser.uid, routineId, dayId, initializeLoggedExercises]);

  const handleToggleExercise = (exerciseId: string) => {
    setExpandedExerciseId(prevId => (prevId === exerciseId ? null : exerciseId));
  };

  const handleSetChange = (loggedExId: string, setId: string, field: keyof Omit<PerformedSet, 'id'>, value: string) => {
    setLoggedExercises(prev =>
      prev.map(loggedEx => {
        if (loggedEx.id === loggedExId) {
          return {
            ...loggedEx,
            setsPerformed: loggedEx.setsPerformed.map(set =>
              set.id === setId ? { ...set, [field]: value } : set
            ),
          };
        }
        return loggedEx;
      })
    );
  };

  const handleAddSet = (loggedExId: string) => {
    setLoggedExercises(prevExercises => {
      let nextExerciseIdToExpand: string | null = null;
      const updatedExercises = prevExercises.map(loggedEx => {
        if (loggedEx.id === loggedExId) {
          const lastSet = loggedEx.setsPerformed[loggedEx.setsPerformed.length - 1];
          const updatedSets = [
            ...loggedEx.setsPerformed,
            { id: routineService.generateId(), reps: lastSet?.reps || '', weightKg: lastSet?.weightKg || '', notes: '' },
          ];

          // Auto-advance logic
          const plannedEx = getPlannedExercise(loggedEx.exerciseId);
          if (plannedEx && plannedEx.sets) {
            const plannedSetsCount = parseInt(String(plannedEx.sets).split('-')[0].trim(), 10);
            if (!isNaN(plannedSetsCount) && updatedSets.length >= plannedSetsCount) {
              const currentIndex = prevExercises.findIndex(ex => ex.id === loggedExId);
              if (currentIndex > -1 && currentIndex < prevExercises.length - 1) {
                nextExerciseIdToExpand = prevExercises[currentIndex + 1].id;
              }
            }
          }
          return { ...loggedEx, setsPerformed: updatedSets };
        }
        return loggedEx;
      });
      
      if (nextExerciseIdToExpand) {
        setExpandedExerciseId(nextExerciseIdToExpand);
      }
      
      return updatedExercises;
    });
  };

  const handleDeleteSet = (loggedExId: string, setId: string) => {
    setLoggedExercises(prev =>
      prev.map(loggedEx => {
        if (loggedEx.id === loggedExId) {
          if (loggedEx.setsPerformed.length <= 1) return loggedEx; 
          return {
            ...loggedEx,
            setsPerformed: loggedEx.setsPerformed.filter(set => set.id !== setId),
          };
        }
        return loggedEx;
      })
    );
  };
  
  const handleExerciseNotesChange = (loggedExId: string, value: string) => {
    setLoggedExercises(prev =>
      prev.map(loggedEx =>
        loggedEx.id === loggedExId ? { ...loggedEx, exerciseNotes: value } : loggedEx
      )
    );
  };

  const handleSaveSession = async () => {
    if (!currentUser?.uid || !routine || !day ) {
      setError("No se puede guardar la sesión. Faltan datos esenciales.");
      return;
    }
    const trulyLoggedExercises = loggedExercises.filter(le => 
        le.setsPerformed.length > 0 && 
        le.setsPerformed.some(set => set.reps.trim() !== '' || set.weightKg.trim() !== '')
    );

    if (trulyLoggedExercises.length === 0) {
        setError("No has registrado ninguna serie para ningún ejercicio. Completa algunos datos antes de guardar.");
        setTimeout(() => setError(null), 4000);
        return;
    }

    setIsSaving(true);
    setError(null);
    const sessionData: Omit<WorkoutSession, 'id' | 'userId'> = {
      routineId: routine.id,
      dayId: day.id,
      routineName: routine.name,
      dayName: day.name,
      date: new Date().toISOString(),
      loggedExercises: trulyLoggedExercises,
      sessionNotes: sessionNotes.trim(),
    };

    try {
      const saved = await workoutService.addWorkoutSession(currentUser.uid, sessionData);
      if (saved) {
        navigateTo('seguimiento'); 
      } else {
        setError("Error al guardar la sesión en el servicio.");
        setIsSaving(false);
      }
    } catch (err) {
      console.error("Error saving workout session:", err);
      setError("Ocurrió un error al guardar la sesión.");
      setIsSaving(false);
    }
  };
  
  const inputBaseStyles = "w-full bg-slate-600/70 border border-slate-500/80 rounded-md py-2 px-3 text-sm text-slate-100 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 placeholder-slate-400 transition-colors shadow-sm";
  const labelBaseStyles = "block text-xs font-medium text-slate-300 mb-1 ml-0.5";

  if (isLoading) return <div className="text-center py-20"><LoadingSpinner size="lg" /></div>;
  if (error || !routine || !day) return <p className="text-slate-400 text-center py-20 bg-slate-800/60 p-6 rounded-lg border border-slate-700">{error || "No se pudo cargar la información para el registro."}</p>;
  if (day.exercises.length === 0) return (
      <div className="bg-slate-800 shadow-2xl rounded-xl p-6 sm:p-8 space-y-8 border border-slate-700/80">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-violet-400 tracking-tight">Registrar Sesión</h1>
          <p className="text-slate-400 text-center py-10 bg-slate-700/30 rounded-lg">Este día ({day.name}) no tiene ejercicios principales planificados. No hay nada que registrar.</p>
          <button
            onClick={() => navigateTo('routineDashboard')}
            className="w-full sm:w-auto text-sm bg-zinc-700 dark:bg-zinc-800 hover:bg-zinc-600 dark:hover:bg-zinc-700 text-white font-medium py-2.5 px-5 rounded-lg transition-colors shadow-md hover:shadow-lg flex-shrink-0"
          >
            Volver al Panel
          </button>
      </div>
  );

  return (
    <div className="bg-slate-800 shadow-2xl rounded-xl p-6 sm:p-8 space-y-8 border border-slate-700/80">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-slate-700">
        <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-violet-400 tracking-tight">
                Registrar Sesión
            </h1>
            <p className="text-slate-400 text-sm mt-1">{routine.name} - {day.name}</p>
        </div>
        <button
          onClick={() => navigateTo('inicio')}
          className="text-sm bg-zinc-700 dark:bg-zinc-800 hover:bg-zinc-600 dark:hover:bg-zinc-700 text-white font-medium py-2.5 px-5 rounded-lg transition-colors shadow-md hover:shadow-lg flex-shrink-0"
        >
          Volver
        </button>
      </div>

      <div className="space-y-4">
        {loggedExercises.map((loggedEx) => {
          const plannedEx = getPlannedExercise(loggedEx.exerciseId);
          const isExpanded = expandedExerciseId === loggedEx.id;

          return (
              <div key={loggedEx.id} className="bg-slate-700/60 rounded-xl shadow-lg border border-slate-600/70 overflow-hidden transition-all duration-300">
                  <button
                      onClick={() => handleToggleExercise(loggedEx.id)}
                      className="w-full flex justify-between items-center text-left p-5 hover:bg-slate-700/80 transition-colors"
                      aria-expanded={isExpanded}
                      aria-controls={`exercise-body-${loggedEx.id}`}
                  >
                      <div className="flex-1 min-w-0">
                          <h3 className="text-xl font-semibold text-violet-300">
                              {loggedEx.exerciseName}
                          </h3>
                          {plannedEx && (
                              <p className="text-xs text-slate-400 mt-1">
                                  <span className="font-medium text-violet-200">Planeado: </span>
                                  {plannedEx.sets} series de {plannedEx.reps} reps
                                  {plannedEx.weightKg ? ` con ${plannedEx.weightKg}kg` : ''}
                              </p>
                          )}
                      </div>
                      <ChevronDownIcon className={`w-6 h-6 text-slate-400 transform transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {isExpanded && (
                      <div id={`exercise-body-${loggedEx.id}`} className="p-5 border-t border-slate-600/80 animate-fade-in space-y-3">
                          <div className="space-y-2">
                              {loggedEx.setsPerformed.map((set, setIndex) => (
                                  <div key={set.id} className="grid grid-cols-12 gap-x-2 sm:gap-x-3 items-center">
                                      <span className="col-span-1 text-sm font-semibold text-slate-400 text-center">#{setIndex + 1}</span>
                                      <div className="col-span-5 sm:col-span-5">
                                          <input 
                                              type="text" 
                                              value={set.reps} 
                                              onChange={e => handleSetChange(loggedEx.id, set.id, 'reps', e.target.value)} 
                                              placeholder="Reps" 
                                              className={`${inputBaseStyles} text-center`}
                                              aria-label={`Repeticiones para la serie ${setIndex + 1}`}
                                          />
                                      </div>
                                      <div className="col-span-5 sm:col-span-5">
                                          <input 
                                              type="text" 
                                              value={set.weightKg} 
                                              onChange={e => handleSetChange(loggedEx.id, set.id, 'weightKg', e.target.value)} 
                                              placeholder="Peso (kg)" 
                                              className={`${inputBaseStyles} text-center`}
                                              aria-label={`Peso para la serie ${setIndex + 1}`}
                                          />
                                      </div>
                                      <div className="col-span-1 flex justify-end">
                                          {loggedEx.setsPerformed.length > 1 && (
                                              <button 
                                                  onClick={() => handleDeleteSet(loggedEx.id, set.id)} 
                                                  className="text-rose-400/70 hover:text-rose-400 p-1.5 rounded-full hover:bg-rose-500/20 transition-colors" 
                                                  aria-label={`Eliminar serie ${setIndex + 1}`}
                                              >
                                                  <TrashIconSmall className="w-4 h-4" />
                                              </button>
                                          )}
                                      </div>
                                  </div>
                              ))}
                          </div>
                          
                          <div className="pt-3 mt-2 flex items-center gap-4 border-t border-slate-600/50">
                              <div className="flex-grow">
                                  <label htmlFor={`exNotes-${loggedEx.id}`} className={labelBaseStyles}>Notas del Ejercicio:</label>
                                  <input
                                      id={`exNotes-${loggedEx.id}`}
                                      type="text"
                                      value={loggedEx.exerciseNotes || ''}
                                      onChange={(e) => handleExerciseNotesChange(loggedEx.id, e.target.value)}
                                      placeholder="Sensaciones, técnica, etc."
                                      className={inputBaseStyles}
                                  />
                              </div>
                              <button 
                                  onClick={() => handleAddSet(loggedEx.id)} 
                                  className="flex-shrink-0 text-xs bg-violet-700/80 hover:bg-violet-600/80 text-white font-medium py-2 px-3 rounded-lg transition-colors shadow-sm flex items-center justify-center gap-1.5"
                              >
                                  <PlusIcon className="w-3.5 h-3.5"/> 
                                  <span className="hidden sm:inline">Añadir Serie</span>
                              </button>
                          </div>
                      </div>
                  )}
              </div>
          )
        })}
      </div>
      
      <div className="pt-5 border-t border-slate-700">
        <label htmlFor="sessionNotes" className="block text-md font-semibold text-slate-200 mb-2">Notas Generales de la Sesión (opcional):</label>
        <textarea id="sessionNotes" value={sessionNotes} onChange={(e) => setSessionNotes(e.target.value)} placeholder="¿Cómo te sentiste hoy? ¿Algún PR?" rows={3} className={`${inputBaseStyles} text-base min-h-[60px]`}></textarea>
      </div>

      {error && <p className="text-sm text-rose-300 bg-rose-800/50 p-3 rounded-lg border border-rose-700/60 text-center" role="alert">{error}</p>}

      <button
        onClick={handleSaveSession}
        disabled={isSaving}
        className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold py-3.5 px-6 rounded-lg transition-all duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-green-400 focus:ring-opacity-50 disabled:opacity-60 disabled:cursor-not-allowed shadow-lg hover:shadow-green-500/40"
      >
        {isSaving ? <LoadingSpinner size="sm" /> : 'Guardar Sesión de Entrenamiento'}
      </button>
    </div>
  );
};

export default WorkoutLoggerView;
