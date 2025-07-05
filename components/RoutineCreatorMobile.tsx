import React, { useState } from 'react';

const WEEK_DAYS = [
  { key: 'mon', label: 'Lun' },
  { key: 'tue', label: 'Mar' },
  { key: 'wed', label: 'Mié' },
  { key: 'thu', label: 'Jue' },
  { key: 'fri', label: 'Vie' },
  { key: 'sat', label: 'Sáb' },
  { key: 'sun', label: 'Dom' },
];

export default function RoutineCreatorMobile({ onSave, initialRoutine }) {
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [step, setStep] = useState(1);
  const [exercisesByDay, setExercisesByDay] = useState<Record<string, any[]>>({});
  const [currentDay, setCurrentDay] = useState<string | null>(null);
  const [exerciseInput, setExerciseInput] = useState('');
  const [showAddExercise, setShowAddExercise] = useState(false);
  const exerciseSuggestions = [
    'Press de Banca', 'Sentadilla', 'Peso Muerto', 'Press Militar', 'Remo con Barra',
    'Dominadas', 'Fondos en Paralelas', 'Curl de Bíceps', 'Extensiones de Tríceps',
    'Prensa de Piernas', 'Zancadas', 'Elevaciones Laterales', 'Plancha', 'Crunch Abdominal'
  ];

  // Paso 1: Selección de días
  const handleToggleDay = (dayKey: string) => {
    setSelectedDays((prev) =>
      prev.includes(dayKey) ? prev.filter((d) => d !== dayKey) : [...prev, dayKey]
    );
  };

  // Paso 2: Añadir ejercicios a cada día
  const handleAddExercise = (dayKey: string, exercise: string) => {
    setExercisesByDay(prev => ({
      ...prev,
      [dayKey]: [...(prev[dayKey] || []), { name: exercise, sets: 3, reps: 10, weight: '', notes: '' }]
    }));
    setExerciseInput('');
    setShowAddExercise(false);
  };
  const handleRemoveExercise = (dayKey: string, idx: number) => {
    setExercisesByDay(prev => ({
      ...prev,
      [dayKey]: prev[dayKey].filter((_, i) => i !== idx)
    }));
  };

  // Paso 3: Edición de sets, reps, peso y notas
  const handleEditExercise = (dayKey: string, idx: number, field: string, value: string | number) => {
    setExercisesByDay(prev => ({
      ...prev,
      [dayKey]: prev[dayKey].map((ex, i) => i === idx ? { ...ex, [field]: value } : ex)
    }));
  };

  // Paso 4: Resumen y guardar
  const handleSaveRoutine = () => {
    if (onSave) {
      onSave({ days: selectedDays, exercisesByDay });
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-4 sm:p-6">
      {/* Paso 1: Selección de días */}
      {step === 1 && (
        <div>
          <h2 className="text-xl font-bold text-violet-500 mb-4 text-center">¿Qué días entrenarás?</h2>
          <div className="flex justify-center gap-2 flex-wrap mb-8">
            {WEEK_DAYS.map((day) => (
              <button
                key={day.key}
                onClick={() => handleToggleDay(day.key)}
                className={`px-4 py-2 rounded-full font-semibold text-sm transition-colors shadow-md border-2 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:ring-offset-2
                  ${selectedDays.includes(day.key)
                    ? 'bg-violet-600 text-white border-violet-600'
                    : 'bg-zinc-800 text-zinc-300 border-zinc-700 hover:bg-zinc-700'}`}
                aria-pressed={selectedDays.includes(day.key)}
              >
                {day.label}
              </button>
            ))}
          </div>
          <button
            className="w-full py-3 rounded-lg bg-violet-600 text-white font-bold shadow-lg hover:bg-violet-700 transition-colors disabled:bg-zinc-700 disabled:text-zinc-400"
            disabled={selectedDays.length === 0}
            onClick={() => setStep(2)}
          >
            Siguiente
          </button>
        </div>
      )}
      {/* Paso 2: Añadir ejercicios */}
      {step === 2 && (
        <div>
          <h2 className="text-xl font-bold text-violet-500 mb-4 text-center">Añade ejercicios a cada día</h2>
          <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
            {selectedDays.map(dayKey => (
              <button
                key={dayKey}
                onClick={() => setCurrentDay(dayKey)}
                className={`px-4 py-2 rounded-full font-semibold text-sm transition-colors border-2 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:ring-offset-2
                  ${currentDay === dayKey ? 'bg-violet-600 text-white border-violet-600' : 'bg-zinc-800 text-zinc-300 border-zinc-700 hover:bg-zinc-700'}`}
              >
                {WEEK_DAYS.find(d => d.key === dayKey)?.label}
              </button>
            ))}
          </div>
          {currentDay && (
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <button onClick={() => setShowAddExercise(true)} className="flex-1 py-2 rounded-lg bg-violet-600 text-white font-bold shadow hover:bg-violet-700 transition-colors">+ Añadir ejercicio</button>
              </div>
              <ul className="space-y-2 mb-4">
                {(exercisesByDay[currentDay] || []).map((ex, idx) => (
                  <li key={idx} className="bg-zinc-800 rounded-lg p-3 flex items-center justify-between">
                    <span className="text-zinc-100 font-medium">{ex.name}</span>
                    <button onClick={() => handleRemoveExercise(currentDay, idx)} className="text-rose-400 hover:text-rose-300 text-lg font-bold">×</button>
                  </li>
                ))}
              </ul>
              {/* Modal bottom-sheet para añadir ejercicio */}
              {showAddExercise && (
                <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40">
                  <div className="bg-zinc-900 w-full max-w-md rounded-t-2xl p-6 pb-8 shadow-2xl animate-fade-in-scale">
                    <h3 className="text-lg font-bold text-violet-400 mb-4">Buscar ejercicio</h3>
                    <input
                      type="text"
                      value={exerciseInput}
                      onChange={e => setExerciseInput(e.target.value)}
                      className="w-full p-3 rounded-lg bg-zinc-800 text-zinc-100 border border-zinc-700 mb-4 focus:outline-none focus:ring-2 focus:ring-violet-400"
                      placeholder="Ej: Press de Banca"
                      autoFocus
                    />
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {exerciseSuggestions.filter(ex => ex.toLowerCase().includes(exerciseInput.toLowerCase())).map((ex, i) => (
                        <button key={i} onClick={() => handleAddExercise(currentDay, ex)} className="w-full text-left px-4 py-2 rounded-lg bg-zinc-800 hover:bg-violet-600 text-zinc-100 font-medium transition-colors">
                          {ex}
                        </button>
                      ))}
                    </div>
                    <button onClick={() => setShowAddExercise(false)} className="mt-6 w-full py-2 rounded-lg bg-zinc-700 text-zinc-300 font-bold hover:bg-zinc-800 transition-colors">Cancelar</button>
                  </div>
                </div>
              )}
            </div>
          )}
          <button
            className="w-full py-3 rounded-lg bg-violet-600 text-white font-bold shadow-lg hover:bg-violet-700 transition-colors mt-4"
            disabled={Object.values(exercisesByDay).every(arr => !arr || arr.length === 0)}
            onClick={() => setStep(3)}
          >
            Siguiente
          </button>
        </div>
      )}
      {/* Paso 3: Edición de ejercicios */}
      {step === 3 && (
        <div>
          <h2 className="text-xl font-bold text-violet-500 mb-4 text-center">Edita los detalles de cada ejercicio</h2>
          {selectedDays.map(dayKey => (
            <div key={dayKey} className="mb-8">
              <h3 className="text-lg font-semibold text-violet-400 mb-2">{WEEK_DAYS.find(d => d.key === dayKey)?.label}</h3>
              <ul className="space-y-3">
                {(exercisesByDay[dayKey] || []).map((ex, idx) => (
                  <li key={idx} className="bg-zinc-800 rounded-xl p-4 flex flex-col gap-2 shadow">
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-100 font-medium">{ex.name}</span>
                    </div>
                    <div className="flex gap-2 items-center">
                      <label className="text-xs text-zinc-400">Sets
                        <input type="number" min={1} max={10} value={ex.sets} onChange={e => handleEditExercise(dayKey, idx, 'sets', Number(e.target.value))} className="w-14 ml-1 p-1 rounded bg-zinc-900 text-zinc-100 border border-zinc-700 text-center" />
                      </label>
                      <label className="text-xs text-zinc-400">Reps
                        <input type="number" min={1} max={50} value={ex.reps} onChange={e => handleEditExercise(dayKey, idx, 'reps', Number(e.target.value))} className="w-14 ml-1 p-1 rounded bg-zinc-900 text-zinc-100 border border-zinc-700 text-center" />
                      </label>
                      <label className="text-xs text-zinc-400">Peso
                        <input type="number" min={0} max={500} value={ex.weight} onChange={e => handleEditExercise(dayKey, idx, 'weight', Number(e.target.value))} className="w-16 ml-1 p-1 rounded bg-zinc-900 text-zinc-100 border border-zinc-700 text-center" />
                        <span className="ml-1 text-xs text-zinc-500">kg</span>
                      </label>
                    </div>
                    <input type="text" value={ex.notes} onChange={e => handleEditExercise(dayKey, idx, 'notes', e.target.value)} className="w-full p-2 rounded bg-zinc-900 text-zinc-100 border border-zinc-700 text-xs mt-1" placeholder="Notas (opcional)" />
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <button
            className="w-full py-3 rounded-lg bg-violet-600 text-white font-bold shadow-lg hover:bg-violet-700 transition-colors mt-4"
            onClick={() => setStep(4)}
          >
            Siguiente
          </button>
        </div>
      )}
      {/* Paso 4: Resumen y guardar */}
      {step === 4 && (
        <div>
          <h2 className="text-xl font-bold text-violet-500 mb-4 text-center">Resumen de la rutina</h2>
          <div className="space-y-6">
            {selectedDays.map(dayKey => (
              <div key={dayKey} className="bg-zinc-900 rounded-xl p-4 shadow">
                <h3 className="text-lg font-semibold text-violet-400 mb-2">{WEEK_DAYS.find(d => d.key === dayKey)?.label}</h3>
                <ul className="space-y-2">
                  {(exercisesByDay[dayKey] || []).map((ex, idx) => (
                    <li key={idx} className="flex flex-col gap-1">
                      <span className="text-zinc-100 font-medium">{ex.name}</span>
                      <span className="text-xs text-zinc-400">{ex.sets}x{ex.reps} {ex.weight ? `- ${ex.weight}kg` : ''} {ex.notes && `- ${ex.notes}`}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <button
            className="w-full py-3 rounded-lg bg-green-600 text-white font-bold shadow-lg hover:bg-green-700 transition-colors mt-8"
            onClick={handleSaveRoutine}
          >
            Guardar Rutina
          </button>
        </div>
      )}
    </div>
  );
}
