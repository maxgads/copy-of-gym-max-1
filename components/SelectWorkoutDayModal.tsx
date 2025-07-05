import React, { useState, useEffect, useMemo } from 'react';
import { Routine, Day, AppView } from '../types';
import * as routineService from '../services/routineService';
import * as geminiService from '../services/geminiService';
import Modal from './Modal';
import LoadingSpinner from './LoadingSpinner';
import NewRoutineCreator from './NewRoutineCreator';
import { db } from '../services/firebaseService';

interface SelectWorkoutDayModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDaySelect: (routineId: string, dayId: string) => void;
  currentUserId: string;
  navigateTo: (view: AppView, params?: { routineId?: string | null }) => void;
}

interface FlattenedDay {
  routineId: string;
  routineName: string;
  dayId: string;
  dayName: string;
  dayOrder: number;
}

const SelectWorkoutDayModal: React.FC<SelectWorkoutDayModalProps> = ({ isOpen, onClose, onDaySelect, currentUserId, navigateTo }) => {
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  
  // State for AI routine generation
  const [isGeneratingRoutine, setIsGeneratingRoutine] = useState(false);
  const [generationStep, setGenerationStep] = useState<'idle' | 'promptDays'>('idle');
  const [numDays, setNumDays] = useState('3');
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [showRoutineCreator, setShowRoutineCreator] = useState(false);

  const fetchRoutines = () => {
     if (isOpen && currentUserId) {
      setIsLoading(true);
      routineService.getRoutinesListener(
          currentUserId,
          (userRoutines) => {
              setRoutines(userRoutines);
              setError(null);
              setIsLoading(false);
          },
          (err) => {
              console.error("Error fetching routines for modal:", err);
              setError("Error al cargar las rutinas disponibles.");
              setRoutines([]);
              setIsLoading(false);
          }
      );
    }
  }

  useEffect(() => {
    fetchRoutines();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, currentUserId]);

  useEffect(() => {
    // Reset generation state when modal opens
    if (isOpen) {
        setGenerationStep('idle');
        setGenerationError(null);
        setIsGeneratingRoutine(false);
    }
  }, [isOpen]);

  const flattenedDays: FlattenedDay[] = useMemo(() => {
    let days: FlattenedDay[] = [];
    routines.forEach(routine => {
      (routine.days || []).forEach(day => {
        days.push({
          routineId: routine.id,
          routineName: routine.name,
          dayId: day.id,
          dayName: day.name || `Día ${day.order + 1}`,
          dayOrder: day.order,
        });
      });
    });
    return days.sort((a, b) => {
        if (a.routineName < b.routineName) return -1;
        if (a.routineName > b.routineName) return 1;
        return a.dayOrder - b.dayOrder;
    });
  }, [routines]);

  const filteredDays = useMemo(() => {
    if (!searchTerm.trim()) return flattenedDays;
    return flattenedDays.filter(day => 
      day.routineName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      day.dayName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [flattenedDays, searchTerm]);

  const handleSelect = (routineId: string, dayId: string) => {
    onDaySelect(routineId, dayId);
    onClose(); 
  };

  const handleGenerateRoutine = async () => {
    setIsGeneratingRoutine(true);
    setGenerationError(null);
    try {
        const days = parseInt(numDays, 10);
        if (isNaN(days) || days < 1 || days > 7) {
            throw new Error("Por favor, introduce un número de días válido (1-7).");
        }
        
        const newRoutineData = await geminiService.generateRoutine(days);
        if (newRoutineData) {
            const imported = await routineService.importFullRoutine(currentUserId, newRoutineData);
            if(imported) {
                // Success! Refresh routines list.
                fetchRoutines();
                setGenerationStep('idle');
            } else {
                 throw new Error("No se pudo guardar la rutina generada.");
            }
        } else {
            throw new Error("La IA no devolvió una rutina válida.");
        }
    } catch (e) {
        setGenerationError(e instanceof Error ? e.message : "Un error desconocido ocurrió.");
    } finally {
        setIsGeneratingRoutine(false);
    }
  };


  const renderNoRoutinesContent = () => {
    if (generationStep === 'promptDays') {
        return (
             <div className="text-center p-4 space-y-4 animate-fade-in">
                <h3 className="text-lg font-bold text-violet-300">Generar Rutina con IA</h3>
                <p className="text-slate-300 text-sm">¿Para cuántos días quieres la rutina?</p>
                <div>
                    <input
                        type="number"
                        min="1"
                        max="7"
                        value={numDays}
                        onChange={(e) => setNumDays(e.target.value)}
                        className="w-24 text-center px-4 py-2.5 bg-zinc-800 border border-zinc-600 rounded-lg text-slate-100 focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none placeholder-slate-400 shadow-sm"
                        disabled={isGeneratingRoutine}
                    />
                </div>
                {generationError && <p className="text-xs text-rose-300 bg-rose-800/50 p-2.5 rounded-lg border border-rose-700/70">{generationError}</p>}
                <div className="flex flex-col sm:flex-row justify-center gap-3">
                    <button onClick={() => setGenerationStep('idle')} disabled={isGeneratingRoutine} className="bg-zinc-700 hover:bg-zinc-600 text-white font-bold py-2 px-4 rounded-lg">
                        Volver
                    </button>
                    <button onClick={handleGenerateRoutine} disabled={isGeneratingRoutine} className="bg-green-600 hover:bg-green-500 text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center">
                        {isGeneratingRoutine ? <LoadingSpinner size="sm" /> : 'Generar Rutina'}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="text-center p-4 space-y-3 animate-fade-in">
            <h3 className="text-lg font-bold text-violet-300 mb-2">¡Aún no tienes rutinas!</h3>
            <p className="text-slate-300 mb-4">
                Para empezar a registrar tus entrenamientos, primero necesitas una rutina.
            </p>
            <button 
                onClick={() => setShowRoutineCreator(true)}
                className="w-full bg-violet-600 hover:bg-violet-500 text-white font-bold py-2 px-4 rounded-lg"
            >
                Crear una Rutina Manualmente
            </button>
            <p className="text-xs text-slate-400">O</p>
            <button 
                onClick={() => setGenerationStep('promptDays')}
                className="w-full bg-teal-600 hover:bg-teal-500 text-white font-bold py-2 px-4 rounded-lg"
            >
                Pedirle una rutina al Asistente IA
            </button>
        </div>
    );
  };

  const renderContent = () => {
    if (isLoading) {
      return <div className="flex justify-center py-10"><LoadingSpinner /></div>;
    }
    if (error) {
      return <p className="text-rose-400 text-center">{error}</p>;
    }
    if (routines.length === 0) {
      return renderNoRoutinesContent();
    }
    if (filteredDays.length === 0) {
      return (
          <p className="text-slate-400 text-center py-10">
            {searchTerm ? "No se encontraron días que coincidan con tu búsqueda." : "No hay días de entrenamiento disponibles."}
          </p>
      );
    }
    return (
        <ul className="space-y-2 overflow-y-auto max-h-[calc(70vh-100px)] pr-1 custom-scrollbar">
            {filteredDays.map(({ routineId, routineName, dayId, dayName }) => (
            <li key={`${routineId}-${dayId}`}>
                <button
                onClick={() => handleSelect(routineId, dayId)}
                className="w-full text-left p-3.5 bg-zinc-700 hover:bg-violet-700/70 rounded-lg transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-violet-500 shadow-md"
                >
                <span className="block font-semibold text-violet-300 text-sm">{routineName}</span>
                <span className="block text-slate-200 text-md">{dayName}</span>
                </button>
            </li>
            ))}
        </ul>
    );
  };


  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Selecciona un Día de Entrenamiento">
      {showRoutineCreator ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-zinc-950 rounded-2xl shadow-2xl max-w-4xl w-full mx-2 p-0 relative animate-fade-in-scale">
            <button
              className="absolute top-3 right-3 text-zinc-400 hover:text-violet-400 text-2xl font-bold z-10"
              onClick={() => setShowRoutineCreator(false)}
              aria-label="Cerrar"
            >×</button>
            <NewRoutineCreator db={db} userId={currentUserId} onClose={() => setShowRoutineCreator(false)} />
          </div>
        </div>
      ) : (
        <div className="space-y-4 max-h-[70vh]">
          {routines.length > 0 && (
              <input
                  type="text"
                  placeholder="Buscar rutina o día..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2.5 bg-zinc-700 border border-zinc-600 rounded-lg text-slate-100 focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none placeholder-slate-400 shadow-sm text-sm mb-2"
              />
          )}
          {renderContent()}
        </div>
      )}
    </Modal>
  );
};

export default SelectWorkoutDayModal;
