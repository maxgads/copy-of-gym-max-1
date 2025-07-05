import React, { useState, useEffect, useCallback, useRef } from 'react'; // Added useRef
import firebase from 'firebase/compat/app';
import { Routine, Day, Exercise, AppView } from '../../types';
import * as routineService from '../../services/routineService';
import LoadingSpinner from '../LoadingSpinner'; // Asegúrate de que este path es correcto
import ConfirmationModal from '../ConfirmationModal'; // Asegúrate de que este path es correcto

// Icons (Mantienen su definición original)
const TrashIconSmall: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
  </svg>
);

const PlusCircleIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
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

const ChevronUpIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
    </svg>
);

// New Icon for increment/decrement
const PlusIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
  </svg>
);

const MinusIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M18 12H6" />
  </svg>
);


interface RoutineFormViewProps {
  currentUser: firebase.User;
  routineId: string | null;
  navigateTo: (view: AppView, params?: { routineId?: string | null; dayId?: string | null }) => void;
}

// Datos de ejercicios simulados para el autocompletado
const commonExercises = [
  "Press de Banca", "Sentadilla", "Peso Muerto", "Press Militar", "Remo con Barra",
  "Dominadas", "Fondos en Paralelas", "Curl de Bíceps", "Extensiones de Tríceps",
  "Prensa de Piernas", "Zancadas", "Elevaciones Laterales", "Face Pull", "Hip Thrust",
  "Flexiones", "Plancha", "Crunch Abdominal", "Remo con Mancuerna", "Press de Hombros con Mancuernas",
  "Bicicleta Estática", "Cinta de Correr", "Elíptica", "Saltar la Cuerda", "Estiramientos Dinámicos",
  "Movilidad Articular", "Sentadilla Búlgara", "Curl Femoral", "Extensiones de Cuádriceps",
  "Elevación de Gemelos", "Remo en Máquina", "Pull Over", "Prensa Inclinada"
].sort();

const RoutineFormView: React.FC<RoutineFormViewProps> = ({ currentUser, routineId, navigateTo }) => {
  const [routine, setRoutine] = useState<Routine | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [initialRoutineName, setInitialRoutineName] = useState<string>('');
  const [expandedDayId, setExpandedDayId] = useState<string | null>(null);
  const [expandedExercises, setExpandedExercises] = useState<Set<string>>(new Set());

  const [isConfirmModalOpen, setConfirmModalOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{ type: 'deleteDay' | 'deleteExercise', payload: any } | null>(null);

  // Estado y ref para el autocompletado del nombre del ejercicio
  const [showSuggestions, setShowSuggestions] = useState<{ [key: string]: boolean }>({});
  const suggestionRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});


  useEffect(() => {
    const loadRoutine = async () => {
      setIsLoading(true);
      setError(null);
      try {
        if (!currentUser?.uid) {
          throw new Error("Usuario no identificado.");
        }
        if (routineId) {
          const fetchedRoutine = await routineService.getRoutineById(currentUser.uid, routineId);
          if (fetchedRoutine) {
            const routineWithIds = routineService.ensureDayExerciseIds(fetchedRoutine);
            setRoutine(routineWithIds);
            setInitialRoutineName(routineWithIds.name);
            if (routineWithIds.days.length > 0) {
              setExpandedDayId(routineWithIds.days.sort((a, b) => a.order - b.order)[0].id);
            }
          } else {
            throw new Error("Rutina no encontrada.");
          }
        } else {
          const newRoutine: Routine = {
            id: routineService.generateId(), // This is a temporary client-side ID
            userId: currentUser.uid,
            name: '',
            days: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          setRoutine(newRoutine);
          setInitialRoutineName('');
        }
      } catch (err) {
        console.error("Error loading routine:", err);
        setError(err instanceof Error ? err.message : "Error al cargar la rutina.");
        setRoutine(null);
      } finally {
        setIsLoading(false);
      }
    };

    loadRoutine();
  }, [routineId, currentUser.uid]);

  useEffect(() => {
    // Cerrar sugerencias al hacer clic fuera
    const handleClickOutside = (event: MouseEvent) => {
      for (const key in suggestionRefs.current) {
        if (suggestionRefs.current[key] && !suggestionRefs.current[key]?.contains(event.target as Node)) {
          setShowSuggestions(prev => ({ ...prev, [key]: false }));
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);


  const handleRoutineNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRoutine(prev => prev ? { ...prev, name: e.target.value } : null);
  };

  const handleToggleDayExpansion = (dayId: string) => {
    setExpandedDayId(prevExpandedDayId => prevExpandedDayId === dayId ? null : dayId);
  };

  const handleToggleExerciseExpansion = (exerciseId: string) => {
    setExpandedExercises(prev => {
        const newSet = new Set(prev);
        if (newSet.has(exerciseId)) {
            newSet.delete(exerciseId);
        } else {
            newSet.add(exerciseId);
        }
        return newSet;
    });
  };

  const handleAddDay = useCallback(() => {
    setRoutine(prevRoutine => {
      if (!prevRoutine) return null;
      const newDayOrder = prevRoutine.days.length > 0 ? Math.max(...prevRoutine.days.map(d => d.order)) + 1 : 0;
      const newDay: Day = {
        id: routineService.generateId(),
        name: `Día ${newDayOrder + 1}`,
        order: newDayOrder,
        exercises: [],
        warmUpExercises: [],
      };
      const updatedRoutine = { ...prevRoutine, days: [...prevRoutine.days, newDay] };
      setExpandedDayId(newDay.id); // Expand the newly added day
      return updatedRoutine;
    });
  }, []);

  const handleUpdateDayName = useCallback((dayId: string, newName: string) => {
    setRoutine(prevRoutine => {
      if (!prevRoutine) return null;
      return {
        ...prevRoutine,
        days: prevRoutine.days.map(d => d.id === dayId ? { ...d, name: newName } : d),
      };
    });
  }, []);

  const confirmDeleteDay = useCallback((dayId: string) => {
    setConfirmAction({ type: 'deleteDay', payload: { dayId } });
    setConfirmModalOpen(true);
  }, []);

  const handleDeleteDay = useCallback((dayId: string) => {
    setRoutine(prevRoutine => {
      if (!prevRoutine) return null;
      const updatedDays = prevRoutine.days
        .filter(d => d.id !== dayId)
        .map((d, index) => ({ ...d, order: index }));
      if (expandedDayId === dayId) {
        setExpandedDayId(updatedDays.length > 0 ? updatedDays.sort((a, b) => a.order - b.order)[0].id : null);
      }
      return { ...prevRoutine, days: updatedDays };
    });
  }, [expandedDayId]);

  const handleAddExerciseToDay = useCallback((dayId: string, isWarmUp: boolean = false) => {
    setRoutine(prevRoutine => {
      if (!prevRoutine) return null;
      const newExercise: Exercise = {
        id: routineService.generateId(),
        exerciseName: '',
        sets: 3,
        reps: '10',
        weightKg: '',
        notes: '',
      };
      setExpandedExercises(prev => new Set(prev).add(newExercise.id));
      return {
        ...prevRoutine,
        days: prevRoutine.days.map(d => {
          if (d.id === dayId) {
            if (isWarmUp) {
              return { ...d, warmUpExercises: [...(d.warmUpExercises || []), newExercise] };
            }
            return { ...d, exercises: [...d.exercises, newExercise] };
          }
          return d;
        }),
      };
    });
  }, []);

  const handleUpdateExercise = useCallback((dayId: string, exerciseId: string, field: keyof Exercise, value: string | number, isWarmUp: boolean = false) => {
    setRoutine(prevRoutine => {
      if (!prevRoutine) return null;
      return {
        ...prevRoutine,
        days: prevRoutine.days.map(d => {
          if (d.id === dayId) {
            const targetArray = isWarmUp ? d.warmUpExercises : d.exercises;
            const updatedArray = (targetArray || []).map(ex =>
              ex.id === exerciseId ? { ...ex, [field]: value } : ex
            );
            if (isWarmUp) {
              return { ...d, warmUpExercises: updatedArray };
            }
            return { ...d, exercises: updatedArray };
          }
          return d;
        }),
      };
    });
  }, []);

  const confirmDeleteExercise = useCallback((dayId: string, exerciseId: string, isWarmUp: boolean) => {
    setConfirmAction({ type: 'deleteExercise', payload: { dayId, exerciseId, isWarmUp } });
    setConfirmModalOpen(true);
  }, []);

  const handleDeleteExercise = useCallback((dayId: string, exerciseId: string, isWarmUp: boolean = false) => {
    setRoutine(prevRoutine => {
      if (!prevRoutine) return null;
      return {
        ...prevRoutine,
        days: prevRoutine.days.map(d => {
          if (d.id === dayId) {
            if (isWarmUp) {
              return { ...d, warmUpExercises: (d.warmUpExercises || []).filter(ex => ex.id !== exerciseId) };
            }
            return { ...d, exercises: d.exercises.filter(ex => ex.id !== exerciseId) };
          }
          return d;
        }),
      };
    });
  }, []);
  
  const handleNumericStepper = useCallback((dayId: string, exerciseId: string, isWarmUp: boolean, field: 'sets' | 'reps' | 'weightKg', delta: number) => {
      setRoutine(prevRoutine => {
          if (!prevRoutine) return null;
  
          return {
              ...prevRoutine,
              days: prevRoutine.days.map(d => {
                  if (d.id === dayId) {
                      const targetArray = isWarmUp ? d.warmUpExercises : d.exercises;
                      const updatedArray = (targetArray || []).map(ex => {
                          if (ex.id === exerciseId) {
                              const rawValue = ex[field];
                              const numericValue = parseFloat(String(rawValue));
                              
                              if (!isNaN(numericValue)) {
                                  let newValue = Math.max(0, numericValue + delta);
                                  const valueToSet = field === 'weightKg' ? newValue.toFixed(1).replace('.0', '') : String(Math.round(newValue));
                                  return { ...ex, [field]: valueToSet };
                              }
                              // If not a number (e.g., "Al fallo"), do nothing.
                              return ex; 
                          }
                          return ex;
                      });
                      if (isWarmUp) {
                          return { ...d, warmUpExercises: updatedArray };
                      }
                      return { ...d, exercises: updatedArray };
                  }
                  return d;
              })
          };
      });
  }, []);

  const handleConfirmAction = useCallback(() => {
    if (!confirmAction) return;
    if (confirmAction.type === 'deleteDay') {
      handleDeleteDay(confirmAction.payload.dayId);
    } else if (confirmAction.type === 'deleteExercise') {
      handleDeleteExercise(confirmAction.payload.dayId, confirmAction.payload.exerciseId, confirmAction.payload.isWarmUp);
    }
    setConfirmAction(null);
    setConfirmModalOpen(false); // Close modal after action
  }, [confirmAction, handleDeleteDay, handleDeleteExercise]);

  const handleSaveChanges = async () => {
    if (!routine || !currentUser?.uid) {
      setError("No hay datos de rutina para guardar o usuario no identificado.");
      return;
    }
    if (!routine.name.trim()) {
      setError("El nombre de la rutina no puede estar vacío.");
      return;
    }
    setIsSaving(true);
    setError(null);
    try {
      if (routineId) {
        await routineService.updateRoutine(currentUser.uid, routine);
      } else {
        await routineService.addRoutine(currentUser.uid, routine);
      }
      navigateTo('routineDashboard');
    } catch (err) {
      console.error("Error saving routine:", err);
      setError("Error al guardar la rutina.");
    } finally {
        setIsSaving(false);
    }
  };

  const commonInputStyles = "w-full bg-zinc-800 border border-zinc-700 rounded-md py-2.5 px-3.5 text-sm text-slate-100 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 placeholder-zinc-400 transition-colors shadow-sm";

  const renderExerciseFields = useCallback((dayId: string, ex: Exercise, exIndex: number, isWarmUp: boolean) => {
    const uniqueKey = `${dayId}-${ex.id}-${isWarmUp}`;
    const isExpanded = expandedExercises.has(ex.id);

    const filteredSuggestions = commonExercises.filter(name =>
      name.toLowerCase().includes(ex.exerciseName.toLowerCase()) && name.toLowerCase() !== ex.exerciseName.toLowerCase()
    ).slice(0, 5);
    
    const StepperButton = ({ children, ...props }: React.ComponentProps<'button'>) => (
        <button type="button" {...props} className="p-2.5 bg-zinc-700 hover:bg-zinc-600 text-slate-200 transition-colors border border-zinc-600 focus:outline-none focus:ring-2 focus:ring-sky-500 disabled:opacity-50">
            {children}
        </button>
    );

    return (
      <div key={ex.id} className="bg-zinc-800/70 rounded-lg shadow-md border border-zinc-700">
        <button
          type="button"
          onClick={() => handleToggleExerciseExpansion(ex.id)}
          className="w-full flex items-center justify-between text-left p-4 hover:bg-zinc-700/50 transition-colors rounded-t-lg"
        >
          <div className="flex-1 min-w-0" ref={(el) => { suggestionRefs.current[uniqueKey] = el; }}>
              <input
                id={`exName-${dayId}-${ex.id}`}
                type="text"
                value={ex.exerciseName}
                onChange={(e) => {
                  handleUpdateExercise(dayId, ex.id, 'exerciseName', e.target.value, isWarmUp);
                  setShowSuggestions(prev => ({ ...prev, [uniqueKey]: e.target.value.trim().length > 0 && filteredSuggestions.length > 0 }));
                }}
                onClick={(e) => e.stopPropagation()}
                onFocus={() => {
                    if (ex.exerciseName.trim().length > 0 && filteredSuggestions.length > 0) {
                        setShowSuggestions(prev => ({ ...prev, [uniqueKey]: true }));
                    }
                }}
                className="bg-transparent text-md font-medium text-slate-100 w-full outline-none placeholder-slate-400"
                placeholder={`Ejercicio ${exIndex + 1}${isWarmUp ? " (calentamiento)" : ""}`}
                aria-label={`Nombre del ejercicio ${exIndex + 1}`}
              />
              {showSuggestions[uniqueKey] && filteredSuggestions.length > 0 && (
                <div className="relative">
                  <div className="absolute z-20 w-full bg-zinc-700 border border-zinc-600 rounded-md mt-1 shadow-lg max-h-48 overflow-y-auto">
                    {filteredSuggestions.map((suggestion, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleUpdateExercise(dayId, ex.id, 'exerciseName', suggestion, isWarmUp);
                          setShowSuggestions(prev => ({ ...prev, [uniqueKey]: false }));
                        }}
                        className="block w-full text-left px-4 py-2 text-sm text-slate-100 hover:bg-zinc-600 transition-colors"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              )}
          </div>
          <div className="flex items-center gap-2 ml-3">
              <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); confirmDeleteExercise(dayId, ex.id, isWarmUp); }}
                  className="text-rose-400/70 hover:text-rose-300 p-1 rounded-full hover:bg-rose-600/40 transition-colors"
                  aria-label={`Eliminar ejercicio ${ex.exerciseName || 'sin nombre'}`}
              >
                  <TrashIconSmall className="w-4 h-4" />
              </button>
              <ChevronDownIcon className={`w-5 h-5 text-slate-400 transition-transform transform ${isExpanded ? 'rotate-180' : ''}`} />
          </div>
        </button>
        {isExpanded && (
          <div className="p-4 space-y-4 border-t border-zinc-700 animate-fade-in">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-4 gap-y-4">
                {/* Sets Stepper */}
                <div className="space-y-2">
                    <label htmlFor={`sets-${uniqueKey}`} className="block text-xs font-medium text-slate-300 mb-2 ml-0.5 text-center">Series</label>
                    <div className="flex items-center justify-center">
                        <StepperButton onClick={() => handleNumericStepper(dayId, ex.id, isWarmUp, 'sets', -1)} className="rounded-l-md"><MinusIcon className="w-4 h-4" /></StepperButton>
                        <input id={`sets-${uniqueKey}`} type="text" value={ex.sets} onChange={(e) => handleUpdateExercise(dayId, ex.id, 'sets', e.target.value, isWarmUp)} className="w-16 text-center bg-zinc-800 border-y border-zinc-700 py-2.5 text-sm outline-none" />
                        <StepperButton onClick={() => handleNumericStepper(dayId, ex.id, isWarmUp, 'sets', 1)} className="rounded-r-md"><PlusIcon className="w-4 h-4" /></StepperButton>
                    </div>
                </div>

                {/* Reps Stepper */}
                <div className="space-y-2">
                    <label htmlFor={`reps-${uniqueKey}`} className="block text-xs font-medium text-slate-300 mb-2 ml-0.5 text-center">Reps</label>
                     <div className="flex items-center justify-center">
                        <StepperButton onClick={() => handleNumericStepper(dayId, ex.id, isWarmUp, 'reps', -1)} className="rounded-l-md"><MinusIcon className="w-4 h-4" /></StepperButton>
                        <input id={`reps-${uniqueKey}`} type="text" value={ex.reps} onChange={(e) => handleUpdateExercise(dayId, ex.id, 'reps', e.target.value, isWarmUp)} className="w-20 text-center bg-zinc-800 border-y border-zinc-700 py-2.5 text-sm outline-none" placeholder="Al fallo" />
                        <StepperButton onClick={() => handleNumericStepper(dayId, ex.id, isWarmUp, 'reps', 1)} className="rounded-r-md"><PlusIcon className="w-4 h-4" /></StepperButton>
                    </div>
                </div>

                {/* Weight Stepper */}
                {!isWarmUp && (
                   <div className="space-y-2">
                        <label htmlFor={`weight-${uniqueKey}`} className="block text-xs font-medium text-slate-300 mb-2 ml-0.5 text-center">Peso (kg)</label>
                        <div className="flex items-center justify-center">
                            <StepperButton onClick={() => handleNumericStepper(dayId, ex.id, isWarmUp, 'weightKg', -2.5)} className="rounded-l-md"><MinusIcon className="w-4 h-4" /></StepperButton>
                            <input id={`weight-${uniqueKey}`} type="text" value={ex.weightKg || ''} onChange={(e) => handleUpdateExercise(dayId, ex.id, 'weightKg', e.target.value, isWarmUp)} placeholder="0" className="w-20 text-center bg-zinc-800 border-y border-zinc-700 py-2.5 text-sm outline-none placeholder:text-slate-400" />
                            <StepperButton onClick={() => handleNumericStepper(dayId, ex.id, isWarmUp, 'weightKg', 2.5)} className="rounded-r-md"><PlusIcon className="w-4 h-4" /></StepperButton>
                        </div>
                    </div>
                )}
              </div>
              <div>
                <input type="text" value={ex.notes || ''} onChange={e => handleUpdateExercise(dayId, ex.id, 'notes', e.target.value, isWarmUp)} placeholder="Notas (ej: técnica, descanso...)" className={`${commonInputStyles} text-xs`} aria-label="Notas adicionales"/>
              </div>
          </div>
        )}
      </div>
    );
  }, [handleUpdateExercise, confirmDeleteExercise, showSuggestions, expandedExercises, handleToggleExerciseExpansion, handleNumericStepper]);

  if (isLoading) return <div className="text-center py-20"><LoadingSpinner size="lg" /></div>;
  if (!routine) return <p className="text-slate-400 text-center py-20 bg-zinc-800/60 p-6 rounded-lg border border-zinc-700">{error || "No se pudo cargar la información de la rutina."}</p>;

  return (
    <div className="pb-24">
      <ConfirmationModal
        isOpen={isConfirmModalOpen}
        onClose={() => setConfirmModalOpen(false)}
        onConfirm={handleConfirmAction}
        title="Confirmar Eliminación"
        message={confirmAction?.type === 'deleteDay' ? '¿Eliminar este día y todos sus ejercicios?' : '¿Eliminar este ejercicio?'}
        confirmText="Sí, Eliminar"
      />

      <div className="bg-zinc-900/50 backdrop-blur-xl shadow-2xl rounded-xl p-6 sm:p-8 space-y-8 border border-zinc-700/80">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-zinc-700">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-violet-400 dark:text-violet-300 tracking-tight">
            {routineId ? `Editando: ${initialRoutineName || 'Rutina'}` : 'Crear Nueva Rutina'}
          </h1>
        </div>
        {error && <p className="text-sm text-rose-300 bg-rose-800/50 p-3 rounded-lg border border-rose-700/60 text-center -mt-4 mb-4" role="alert">{error}</p>}

        <div>
          <label htmlFor="routineName" className="block text-lg font-semibold text-slate-200 mb-2">Nombre de la Rutina</label>
          <input
            id="routineName"
            type="text"
            value={routine.name}
            onChange={handleRoutineNameChange}
            className="w-full text-xl bg-zinc-900/80 dark:bg-zinc-950 border border-violet-800 rounded-lg py-3 px-4 text-zinc-100 dark:text-zinc-100 focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none placeholder-zinc-400 shadow-md"
            placeholder="Ej: Lunes - Tren Superior"
            aria-label="Nombre de la rutina"
          />
        </div>

        {routine.days.sort((a,b) => a.order - b.order).map((day, dayIndex) => (
          <div key={day.id} className="bg-zinc-800/50 rounded-xl shadow-lg border border-zinc-700">
            <div
              className="flex justify-between items-center p-4 sm:p-5 cursor-pointer hover:bg-zinc-700/80 rounded-t-xl transition-colors"
              onClick={() => handleToggleDayExpansion(day.id)}
              aria-expanded={expandedDayId === day.id}
              aria-controls={`day-content-${day.id}`}
            >
              <input
                type="text"
                value={day.name}
                onClick={(e) => e.stopPropagation()}
                onChange={(e) => handleUpdateDayName(day.id, e.target.value)}
                className="text-xl font-semibold text-violet-300 dark:text-violet-400 bg-transparent focus:border-b-violet-400 focus:border-b-2 outline-none w-full placeholder-zinc-400 pb-1"
                placeholder={`Nombre del Día ${dayIndex + 1}`}
                aria-label={`Nombre del día ${dayIndex + 1}`}
              />
              <div className="flex items-center flex-shrink-0">
                  <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); confirmDeleteDay(day.id); }}
                      className="text-rose-400 hover:text-rose-300 hover:bg-rose-700/50 p-1.5 rounded-md transition-colors ml-3 flex items-center gap-1 text-xs"
                      aria-label={`Eliminar día ${day.name}`}
                  >
                      <TrashIconSmall className="w-4 h-4" />
                      <span className="hidden sm:inline">Eliminar Día</span>
                  </button>
                  {expandedDayId === day.id ? <ChevronUpIcon className="w-6 h-6 text-slate-400 ml-2"/> : <ChevronDownIcon className="w-6 h-6 text-slate-400 ml-2"/>}
              </div>
            </div>
            {expandedDayId === day.id && (
              <div id={`day-content-${day.id}`} className="p-4 sm:p-5 border-t border-zinc-700 space-y-5">
                <div className="pt-2">
                  <h4 className="text-md font-semibold text-amber-300 mb-2 flex items-center gap-2"><FireIcon className="w-5 h-5"/>Ejercicios de Calentamiento</h4>
                  <div className="space-y-2">
                    {(day.warmUpExercises || []).length === 0 && <p className="text-slate-400 text-sm italic mb-2">No hay ejercicios de calentamiento añadidos.</p>}
                    {(day.warmUpExercises || []).map((ex, exIndex) => renderExerciseFields(day.id, ex, exIndex, true))}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleAddExerciseToDay(day.id, true)}
                    className="w-full text-xs bg-amber-600/80 hover:bg-amber-500/80 text-white font-medium py-2 px-3 rounded-lg transition-colors mt-3 shadow-sm hover:shadow-amber-600/30 flex items-center justify-center gap-1.5"
                  >
                    <PlusCircleIcon className="w-4 h-4"/>
                    Añadir Ejercicio de Calentamiento
                  </button>
                </div>

                <div className="pt-3 border-t border-zinc-700/50">
                  <h4 className="text-md font-semibold text-violet-200 dark:text-violet-300 mb-2">Ejercicios Principales</h4>
                  <div className="space-y-2">
                    {day.exercises.length === 0 && <p className="text-slate-400 text-sm italic mb-2">No hay ejercicios principales añadidos.</p>}
                    {day.exercises.map((ex, exIndex) => renderExerciseFields(day.id, ex, exIndex, false))}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleAddExerciseToDay(day.id, false)}
                    className="w-full text-sm bg-teal-600 hover:bg-teal-500 text-white font-medium py-2.5 px-4 rounded-lg transition-colors mt-3 shadow-md hover:shadow-teal-600/40 flex items-center justify-center gap-2"
                  >
                    <PlusCircleIcon className="w-5 h-5"/>
                    Añadir Ejercicio Principal
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}

        <button type="button" onClick={handleAddDay} className="w-full bg-violet-600 hover:bg-violet-500 dark:bg-violet-700 dark:hover:bg-violet-600 text-white font-semibold py-3 px-4 rounded-lg transition-colors shadow-lg hover:shadow-violet-500/40 flex items-center justify-center gap-2">
          <PlusCircleIcon className="w-6 h-6"/>
          Añadir Día de Entrenamiento
        </button>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-zinc-800/90 backdrop-blur-sm p-4 border-t border-zinc-700 shadow-top-lg z-50">
        <div className="container mx-auto max-w-6xl flex flex-col sm:flex-row justify-end items-center gap-3">
          <button
            type="button"
            onClick={() => navigateTo('routineDashboard')}
            className="w-full sm:w-auto text-sm bg-zinc-700 dark:bg-zinc-800 hover:bg-zinc-600 dark:hover:bg-zinc-700 text-white font-medium py-2.5 px-5 rounded-lg transition-colors shadow-md hover:shadow-lg"
          >
            Volver al Panel
          </button>
          <button
            type="button"
            onClick={handleSaveChanges}
            disabled={isSaving || !routine || !routine.name.trim()}
            className="w-full sm:w-auto bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-green-400 focus:ring-opacity-50 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none shadow-lg hover:shadow-green-500/40 flex items-center justify-center gap-2"
          >
            <span>{isSaving ? 'Guardando...' : 'Guardar Cambios'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default RoutineFormView;
