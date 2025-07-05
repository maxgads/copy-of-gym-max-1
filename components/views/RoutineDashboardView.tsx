import React, { useState, useEffect, useCallback, useRef } from 'react';
import firebase from 'firebase/compat/app';
import { Routine, AppView, Day, Exercise } from '../../types';
import * as routineService from '../../services/routineService';
import LoadingSpinner from '../LoadingSpinner';
import ConfirmationModal from '../ConfirmationModal';
import NewRoutineCreator from '../NewRoutineCreator';
import { db } from '../../services/firebaseService';

// Icons
const PlusIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
  </svg>
);

const TrashIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
  </svg>
);

const EditIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
        <path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" />
        <path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" />
    </svg>
);

const FireIcon: React.FC<{ className?: string }> = ({ className }) => ( 
  <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M12.25 6.167c0-1.66.86-3.079 2.031-3.923.328-.235.91-.703.91-1.244 0-.44-.288-.716-.549-.832a20.218 20.218 0 00-8.284 0c-.26.116-.548.392-.548.832 0 .54.582 1.009.91 1.244 1.17 1.07 2.031 2.262 2.031 3.923 0 .14-.007.28-.02.417C7.653 7.82 7 9.244 7 11c0 2.761 2.239 5 5 5s5-2.239 5-5c0-1.756-.653-3.18-1.73-4.416A2.997 2.997 0 0112.25 6.167zM10 14a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
  </svg>
);

const ChevronDownIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
    </svg>
);

interface RoutineDashboardViewProps {
  currentUser: firebase.User;
  navigateTo: (view: AppView, params?: { routineId?: string | null, dayId?: string | null }) => void;
}

const RoutineDashboardView: React.FC<RoutineDashboardViewProps> = ({ currentUser, navigateTo }) => {
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [routineToDelete, setRoutineToDelete] = useState<string | null>(null);
  const [expandedRoutineId, setExpandedRoutineId] = useState<string | null>(null);
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set());
  const [showRoutineCreator, setShowRoutineCreator] = useState(false);
  
  const initialLoadDone = useRef(false);

  const fetchRoutines = useCallback(() => {
    if (!currentUser?.uid) {
      setError("Usuario no identificado. No se pueden cargar rutinas.");
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    routineService.getRoutinesListener(
        currentUser.uid,
        (routinesData) => {
            const routinesWithIds = routinesData.map(r => routineService.ensureDayExerciseIds(r));
            setRoutines(routinesWithIds);
            if (routinesWithIds.length > 0 && !initialLoadDone.current) {
                setExpandedRoutineId(routinesWithIds[0].id);
                initialLoadDone.current = true;
            }
            setError(null);
            setIsLoading(false);
        },
        (err) => {
            console.error("Error fetching routines:", err);
            setError("Error al cargar las rutinas.");
            setRoutines([]);
            setIsLoading(false);
        }
    );
  }, [currentUser.uid]);

  useEffect(() => {
    fetchRoutines();
  }, [fetchRoutines]);
  
  const handleToggleRoutine = (routineId: string) => {
      const newExpandedId = expandedRoutineId === routineId ? null : routineId;
      setExpandedRoutineId(newExpandedId);
      if (newExpandedId !== expandedRoutineId) {
          setExpandedDays(new Set()); // Reset day expansion when routine changes
      }
  };

  const handleToggleDay = (dayId: string) => {
    setExpandedDays(prev => {
        const newSet = new Set(prev);
        if (newSet.has(dayId)) {
            newSet.delete(dayId);
        } else {
            newSet.add(dayId);
        }
        return newSet;
    });
  };

  const openDeleteConfirmation = (e: React.MouseEvent, routineId: string) => {
    e.stopPropagation(); // Prevent accordion from toggling
    setRoutineToDelete(routineId);
    setIsConfirmModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!currentUser?.uid || !routineToDelete) {
      setError("Error: Usuario o rutina no identificados. No se puede eliminar.");
      return;
    }
    const success = await routineService.deleteRoutine(currentUser.uid, routineToDelete);
    if (success) {
      // After deleting, the currently expanded routine might be gone.
      // We set it to null and let the logic decide if another should be opened.
      if (expandedRoutineId === routineToDelete) {
        setExpandedRoutineId(null);
      }
      fetchRoutines(); 
    } else {
      setError("No se pudo eliminar la rutina. Puede que ya no exista o haya ocurrido un error.");
    }
    setRoutineToDelete(null);
  };
  
  const cardButtonStyles = "font-medium py-2 px-4 rounded-lg text-xs transition-all duration-200 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-opacity-60 shadow-md hover:shadow-lg flex items-center justify-center gap-1.5";

  return (
    <div className="space-y-10">
      <ConfirmationModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Confirmar Eliminación"
        message="¿Estás seguro de que quieres eliminar esta rutina? Esta acción no se puede deshacer."
        confirmText="Sí, Eliminar"
      />

      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-violet-400 tracking-tight">
          Panel de Rutinas
        </h1>
        <div className="flex gap-2">
          <button
            onClick={() => setShowRoutineCreator(true)}
            className="bg-gradient-to-r from-violet-500 to-violet-600 hover:from-violet-600 hover:to-violet-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-violet-400 focus:ring-opacity-50 shadow-lg hover:shadow-violet-500/40 flex items-center justify-center gap-2 text-sm sm:text-base"
          >
            <PlusIcon className="w-5 h-5" />
            Agregar Rutina Nueva
          </button>
          
        </div>
      </div>

      {showRoutineCreator && currentUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-zinc-950 rounded-2xl shadow-2xl max-w-4xl w-full mx-2 p-0 relative animate-fade-in-scale">
            <button
              className="absolute top-3 right-3 text-zinc-400 hover:text-violet-400 text-2xl font-bold z-10"
              onClick={() => setShowRoutineCreator(false)}
              aria-label="Cerrar"
            >×</button>
            <NewRoutineCreator db={db} userId={currentUser.uid} onClose={() => setShowRoutineCreator(false)} />
          </div>
        </div>
      )}

      {error && <p className="text-sm text-rose-300 bg-rose-800/50 p-3.5 rounded-lg border border-rose-700/70 text-center" role="alert">{error}</p>}

      {isLoading ? (
        <div className="text-center py-10"><LoadingSpinner size="lg" /></div>
      ) : routines.length === 0 && !error ? (
        <div className="text-center py-16 bg-slate-800/70 rounded-xl border border-dashed border-slate-700 p-8 shadow-lg">
          <svg className="mx-auto h-20 w-20 text-slate-500 mb-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 3.104v5.625m0 0a2.25 2.25 0 01-4.5 0m4.5 0a2.25 2.25 0 00-4.5 0M9.75 3.104V1.875a1.125 1.125 0 011.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V3.104m-1.125 5.625h1.5a2.25 2.25 0 002.25-2.25V6.375c0-1.242-1.008-2.25-2.25-2.25H12M9.75 3.104H7.125A2.25 2.25 0 004.875 5.354v1.5a2.25 2.25 0 002.25 2.25m4.5 0v3.75m-3.75 0V18a2.25 2.25 0 002.25 2.25h1.5a2.25 2.25 0 002.25-2.25v-3.75m-3.75 0h3.75M9 12.75h6" />
          </svg>
          <p className="text-slate-300 text-xl font-semibold">Aún no tienes rutinas guardadas.</p>
          <p className="text-slate-400 text-md mt-1">¡Crea una para empezar a planificar tus entrenamientos!</p>
        </div>
      ) : (
        <div className="space-y-6">
          {routines.map((routine) => {
            const isExpanded = expandedRoutineId === routine.id;
            return (
              <div key={routine.id} className="bg-zinc-900/90 dark:bg-zinc-950 border border-zinc-700 rounded-xl shadow-xl transition-all duration-300 hover:shadow-violet-500/20 hover:border-violet-600/40">
                <button
                  onClick={() => handleToggleRoutine(routine.id)}
                  className="w-full flex justify-between items-center text-left p-5 hover:bg-slate-700/50 rounded-t-xl transition-colors"
                  aria-expanded={isExpanded}
                >
                    <h2 className="text-2xl font-bold text-violet-400 dark:text-violet-300 break-words flex-1 min-w-0" title={routine.name}>{routine.name}</h2>
                    <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                        <button
                            onClick={(e) => { e.stopPropagation(); navigateTo('routineForm', { routineId: routine.id }); }}
                            className={`${cardButtonStyles} bg-violet-600 hover:bg-violet-500 dark:bg-violet-700 dark:hover:bg-violet-600 text-white focus:ring-violet-400`}
                            aria-label={`Editar rutina ${routine.name}`}
                        >
                            <EditIcon className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Editar</span>
                        </button>
                        <button
                            onClick={(e) => openDeleteConfirmation(e, routine.id)}
                            className={`${cardButtonStyles} bg-rose-600 hover:bg-rose-500 text-white focus:ring-rose-400`}
                            aria-label={`Eliminar rutina ${routine.name}`}
                        >
                            <TrashIcon className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Eliminar</span>
                        </button>
                        <ChevronDownIcon className={`w-6 h-6 text-slate-400 transform transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                    </div>
                </button>
                
                {isExpanded && (
                  <div className="px-5 pb-5 animate-fade-in">
                    {routine.description && (
                      <p className="text-sm text-slate-400 mb-4 italic bg-slate-700/30 p-2 rounded-md">{routine.description}</p>
                    )}
                    
                    {routine.days && routine.days.length > 0 ? (
                      <div className="space-y-3">
                        {routine.days.sort((a,b) => a.order - b.order).map((day: Day) => {
                          const isDayExpanded = expandedDays.has(day.id);
                          return (
                            <div key={day.id} className="bg-slate-700/50 rounded-lg border border-slate-600/70 overflow-hidden">
                              <button
                                onClick={() => handleToggleDay(day.id)}
                                className="w-full text-left p-4 hover:bg-slate-700/70 transition-colors flex justify-between items-center"
                                aria-expanded={isDayExpanded}
                              >
                                <h3 className="text-lg font-semibold text-violet-300 dark:text-violet-400">{day.name || `Día ${day.order + 1}`}</h3>
                                <ChevronDownIcon className={`w-5 h-5 text-slate-400 transform transition-transform duration-300 ${isDayExpanded ? 'rotate-180' : ''}`} />
                              </button>

                              {isDayExpanded && (
                                <div className="px-4 pb-4 border-t border-slate-600/50 animate-fade-in">
                                  {day.warmUpExercises && day.warmUpExercises.length > 0 && (
                                    <div className="mt-3 mb-3 pb-2 border-b border-slate-600/50">
                                      <h4 className="text-xs font-semibold text-amber-400 flex items-center gap-1.5 mb-1"><FireIcon className="w-3.5 h-3.5"/>Calentamiento:</h4>
                                      <ul className="list-disc list-inside space-y-0.5 text-slate-300 text-xs pl-1">
                                        {day.warmUpExercises.map((wEx: Exercise) => (
                                          <li key={wEx.id} className="break-words">
                                            {wEx.exerciseName || "Ejercicio sin nombre"}
                                            <span className="text-slate-400">
                                              {wEx.sets ? ` / ${wEx.sets} series` : ''}
                                              {wEx.reps ? ` / ${wEx.reps} reps` : ''}
                                            </span>
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}

                                  {day.exercises && day.exercises.length > 0 ? (
                                    <ul className="list-disc list-inside space-y-1 text-slate-300 text-sm pl-1">
                                      {day.exercises.map((ex: Exercise) => (
                                        <li key={ex.id} className="break-words">
                                          {ex.exerciseName || "Ejercicio sin nombre"}
                                          <span className="text-slate-400 text-xs">
                                            {ex.sets ? ` / ${ex.sets} series` : ''}
                                            {ex.reps ? ` / ${ex.reps} reps` : ''}
                                            {ex.weightKg ? ` / ${ex.weightKg} kg` : ''}
                                          </span>
                                        </li>
                                      ))}
                                    </ul>
                                  ) : (
                                    <p className="text-slate-400 text-sm italic pt-2">No hay ejercicios principales para este día.</p>
                                  )}
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    ) : (
                      <p className="text-slate-400 italic my-4 text-center">Esta rutina no tiene días de entrenamiento definidos.</p>
                    )}
                    <p className="text-xs text-slate-500 mt-4 pt-3 border-t border-slate-700 text-right">
                        Última mod: {routine.updatedAt ? new Date(routine.updatedAt).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}
                    </p>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      
    </div>
  );
};

export default RoutineDashboardView;
