import React, { useState, useEffect, useCallback } from 'react';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';

// --- Íconos SVG para las tarjetas ---
const DumbbellIcon = () => (
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8 mb-2 text-violet-400"><path d="M14.4 14.4 9.6 9.6"/><path d="M18.657 21.485a2 2 0 1 1-2.829-2.828l-1.767 1.768a2 2 0 1 1-2.829-2.829l-1.768 1.768a2 2 0 1 1-2.828-2.828l-1.768 1.768a2 2 0 1 1-2.828-2.828l8.486-8.485a2 2 0 1 1 2.828 2.828l1.768-1.768a2 2 0 1 1 2.829 2.829l1.767-1.768a2 2 0 1 1 2.829 2.828z"/></svg>
);

const BodyweightIcon = () => (
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8 mb-2 text-violet-400"><path d="M17.3 6.3a2 2 0 1 0-2.6 2.6"/><path d="M12 12.5a2 2 0 1 1-4 0 2 2 0 0 1 4 0Z"/><path d="M2.5 21.5a2 2 0 0 0 2-2l1.1-3.4A2 2 0 0 1 7.4 15l.9 2.5a2 2 0 0 0 3.8-.4l.9-2.5a2 2 0 0 1 1.8-1.2H18a2 2 0 0 0 2-2v-2a2 2 0 0 0-2-2h-3.4a2 2 0 0 1-1.8-1.2L12 3.4a2 2 0 0 0-3.8-.4L7.4 6.4A2 2 0 0 1 5.6 7.6L4.5 11a2 2 0 0 0 2 2.5h3.4a2 2 0 0 1 1.8 1.2l.9 2.5a2 2 0 0 0 3.8-.4l.9-2.5a2 2 0 0 1 1.8-1.2H22"/></svg>
);

const PlusIcon = () => (
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8 mb-2 text-violet-400"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
);

// --- Constantes y Datos ---
const WEEK_DAYS = [
{ key: 'mon', label: 'Lunes' }, { key: 'tue', label: 'Martes' }, { key: 'wed', label: 'Miércoles' },
{ key: 'thu', label: 'Jueves' }, { key: 'fri', label: 'Viernes' }, { key: 'sat', label: 'Sábado' }, { key: 'sun', 'label': 'Domingo' },
];

const exerciseSuggestions = [
'Abductores en Máquina', 'Aductores en Máquina', 'Aperturas con Mancuernas', 'Aperturas en Pec-Deck', 'Box Jumps', 'Burpees',
'Cruce de Poleas', 'Crunch Abdominal', 'Curl de Bíceps con Barra', 'Curl de Bíceps con Mancuernas', 'Curl de Bíceps en Máquina',
'Curl de Concentración', 'Curl en Banco Scott', 'Curl en Polea Baja', 'Curl Femoral Sentado', 'Curl Femoral Tumbado', 'Curl Martillo',
'Dominadas', 'Dominadas supinas (Chin-ups)', 'Elevación de Talones de Pie', 'Elevación de Talones en Prensa', 'Elevación de Talones Sentado',
'Elevaciones de Piernas Colgado', 'Elevaciones Frontales con Barra', 'Elevaciones Frontales con Mancuernas', 'Elevaciones Laterales con Mancuernas',
'Elevaciones Laterales en Polea', 'Encogimientos con Barra', 'Encogimientos con Mancuernas', 'Encogimientos en Polea Alta',
'Extensiones de Cuádriceps', 'Extensiones de Tríceps en Máquina', 'Extensiones de Tríceps en Polea Alta', 'Extensiones de Tríceps sobre la cabeza',
'Face Pull', 'Flexiones', 'Fondos en Paralelas', 'Fondos entre bancos', 'Giros Rusos', 'Good Mornings', 'Hip Thrust con Barra',
'Hiperextensiones', 'Jalón al Pecho', 'Jalón con Agarre Estrecho', 'Kettlebell Swing', 'Leñador con Polea', 'Mountain Climbers',
'Pájaros (Reverse Flys)', 'Patada de Tríceps', 'Peso Muerto', 'Peso Muerto Rumano', 'Plancha', 'Plancha Lateral', 'Prensa de Piernas',
'Press Arnold', 'Press de Banca con Agarre Cerrado', 'Press de Banca con Barra', 'Press de Banca con Mancuernas', 'Press de Hombros en Máquina',
'Press Declinado con Barra', 'Press en Máquina (Pecho)', 'Press Francés', 'Press Inclinado con Barra', 'Press Inclinado con Mancuernas',
'Press Militar con Barra', 'Press Militar con Mancuernas', 'Pullover con Mancuerna', 'Remo al Mentón', 'Remo con Barra', 'Remo con Mancuerna',
'Remo en Máquina', 'Remo en Polea Baja', 'Remo en Punta (T-Bar)', 'Reverse Pec-Deck', 'Rueda Abdominal', 'Sentadilla Búlgara',
'Sentadilla con Barra', 'Sentadilla con Salto', 'Sentadilla Frontal', 'Sentadilla Goblet', 'Sentadilla Hack', 'Sissy Squat',
'Zancadas con Barra', 'Zancadas con Mancuernas'
].sort();

const ROUTINE_TEMPLATES = {
ppl: {
name: "Push/Pull/Legs (PPL)", description: "Clásico de 6 días para maximizar hipertrofia.", icon: DumbbellIcon,
days: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat'],
exercises: {
mon: [{ name: 'Press de Banca con Barra', sets: 4, reps: 8, weight: 60, notes: 'Push' }, { name: 'Press Militar con Barra', sets: 3, reps: 10, weight: 40, notes: '' }],
tue: [{ name: 'Dominadas', sets: 4, reps: 8, weight: 0, notes: 'Pull' }, { name: 'Remo con Barra', sets: 4, reps: 8, weight: 50, notes: '' }],
wed: [{ name: 'Sentadilla con Barra', sets: 5, reps: 5, weight: 80, notes: 'Legs' }, { name: 'Prensa de Piernas', sets: 3, reps: 12, weight: 100, notes: '' }],
thu: [{ name: 'Press Inclinado con Mancuernas', sets: 4, reps: 8, weight: 60, notes: 'Push' }, { name: 'Fondos en Paralelas', sets: 3, reps: 12, weight: 0, notes: '' }],
fri: [{ name: 'Peso Muerto', sets: 3, reps: 5, weight: 100, notes: 'Pull' }, { name: 'Remo en Polea Baja', sets: 3, reps: 12, weight: 40, notes: '' }],
sat: [{ name: 'Zancadas con Mancuernas', sets: 4, reps: 12, weight: 20, notes: 'Legs' }, { name: 'Hip Thrust con Barra', sets: 3, reps: 10, weight: 80, notes: '' }],
}
},
upper_lower: {
name: "Torso / Pierna", description: "Split de 4 días para un balance de fuerza y tamaño.", icon: DumbbellIcon,
days: ['mon', 'tue', 'thu', 'fri'],
exercises: {
mon: [{ name: 'Press de Banca con Barra', sets: 4, reps: 8, weight: 60, notes: 'Torso' }, { name: 'Remo con Barra', sets: 4, reps: 8, weight: 50, notes: '' }, { name: 'Press Militar con Mancuernas', sets: 3, reps: 10, weight: 40, notes: '' }],
tue: [{ name: 'Sentadilla con Barra', sets: 4, reps: 8, weight: 80, notes: 'Pierna' }, { name: 'Prensa de Piernas', sets: 3, reps: 12, weight: 100, notes: '' }, { name: 'Zancadas con Mancuernas', sets: 3, reps: 12, weight: 20, notes: '' }],
thu: [{ name: 'Dominadas', sets: 4, reps: 8, weight: 0, notes: 'Torso' }, { name: 'Fondos en Paralelas', sets: 4, reps: 10, weight: 0, notes: '' }, { name: 'Aperturas con Mancuernas', sets: 3, reps: 12, weight: 15, notes: '' }],
fri: [{ name: 'Peso Muerto', sets: 4, reps: 6, weight: 100, notes: 'Pierna' }, { name: 'Hip Thrust con Barra', sets: 3, reps: 10, weight: 80, notes: '' }, { name: 'Elevaciones Laterales con Mancuernas', sets: 3, reps: 15, weight: 10, notes: '' }],
}
},
arnold: {
name: "Arnold Split", description: "Avanzado, 6 días. Pecho/Espalda, Hombros/Brazos, Piernas.", icon: DumbbellIcon,
days: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat'],
exercises: {
mon: [{ name: 'Press de Banca con Barra', sets: 4, reps: 10, weight: 60, notes: 'Pecho/Espalda' }, { name: 'Dominadas', sets: 4, reps: 10, weight: 0, notes: '' }],
tue: [{ name: 'Press Militar con Mancuernas', sets: 4, reps: 10, weight: 40, notes: 'Hombros/Brazos' }, { name: 'Curl de Bíceps con Mancuernas', sets: 3, reps: 12, weight: 15, notes: '' }, { name: 'Extensiones de Tríceps en Polea Alta', sets: 3, reps: 12, weight: 20, notes: '' }],
wed: [{ name: 'Sentadilla con Barra', sets: 5, reps: 8, weight: 80, notes: 'Piernas' }, { name: 'Prensa de Piernas', sets: 4, reps: 12, weight: 100, notes: '' }],
thu: [{ name: 'Remo con Barra', sets: 4, reps: 10, weight: 50, notes: 'Pecho/Espalda' }, { name: 'Fondos en Paralelas', sets: 4, reps: 10, weight: 0, notes: '' }],
fri: [{ name: 'Elevaciones Laterales con Mancuernas', sets: 5, reps: 15, weight: 10, notes: 'Hombros/Brazos' }, { name: 'Curl Martillo', sets: 3, reps: 12, weight: 15, notes: '' }, { name: 'Press Francés', sets: 3, reps: 12, weight: 20, notes: '' }],
sat: [{ name: 'Peso Muerto', sets: 4, reps: 6, weight: 100, notes: 'Piernas' }, { name: 'Zancadas con Mancuernas', sets: 3, reps: 12, weight: 20, notes: '' }],
}
},
bodyweight: {
name: "Rutina en Casa", description: "Entrena en cualquier lugar sin equipo. 3 días.", icon: BodyweightIcon,
days: ['mon', 'wed', 'fri'],
exercises: {
mon: [{ name: 'Flexiones', sets: 4, reps: 15, weight: 0, notes: 'Full Body' }, { name: 'Sentadillas con Salto', sets: 4, reps: 20, weight: 0, notes: '' }, { name: 'Plancha', sets: 3, reps: 60, weight: 0, notes: 'Segundos' }],
wed: [{ name: 'Dominadas', sets: 4, reps: 8, weight: 0, notes: 'Asistidas si es necesario' }, { name: 'Zancadas con Mancuernas', sets: 4, reps: 15, weight: 0, notes: 'Por pierna' }, { name: 'Burpees', sets: 3, reps: 10, weight: 0, notes: '' }],
fri: [{ name: 'Fondos en Paralelas', sets: 4, reps: 12, weight: 0, notes: 'O en silla' }, { name: 'Hip Thrust con Barra', sets: 4, reps: 20, weight: 0, notes: '' }, { name: 'Mountain Climbers', sets: 3, reps: 45, weight: 0, notes: 'Segundos' }],
}
}
};

// --- Componentes de UI ---

const NumberStepper = ({ value, onChange, min = 0, max = 500, step = 1 }) => {
const handleIncrement = () => onChange(Math.min(max, (Number(value) || 0) + step));
const handleDecrement = () => onChange(Math.max(min, (Number(value) || 0) - step));
return (
<div className="flex items-center justify-center gap-2">
<button onClick={handleDecrement} className="w-8 h-8 rounded-full bg-zinc-700 text-zinc-200 font-bold text-lg flex items-center justify-center transition hover:bg-zinc-600 active:bg-zinc-500 flex-shrink-0">-</button>
<input type="number" value={value} onChange={e => onChange(e.target.value === '' ? '' : Number(e.target.value))} className="w-16 p-2 rounded-lg bg-zinc-900 text-zinc-100 border border-zinc-700 text-center font-semibold"/>
<button onClick={handleIncrement} className="w-8 h-8 rounded-full bg-zinc-700 text-zinc-200 font-bold text-lg flex items-center justify-center transition hover:bg-zinc-600 active:bg-zinc-500 flex-shrink-0">+</button>
</div>
);
};

// --- Componente Principal ---

interface NewRoutineCreatorProps {
  db: any; // Firestore instance
  userId: string;
  onClose: () => void; // Callback to close the modal/view
}

const NewRoutineCreator: React.FC<NewRoutineCreatorProps> = ({ db, userId, onClose }) => {
  const [step, setStep] = useState(0); // 0: Pantalla de inicio
  const [routineName, setRoutineName] = useState('Mi Nueva Rutina');
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [exercisesByDay, setExercisesByDay] = useState<{ [key: string]: any[] }>({});
  const [currentDay, setCurrentDay] = useState<string | null>(null);
  const [exerciseInput, setExerciseInput] = useState('');
  const [showAddExercise, setShowAddExercise] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');

  const showNotification = (message: string, type: 'success' | 'error') => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const filteredExerciseSuggestions = exerciseSuggestions.filter(exercise =>
    exercise.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDayToggle = (dayKey: string) => {
    setSelectedDays(prev =>
      prev.includes(dayKey) ? prev.filter(d => d !== dayKey) : [...prev, dayKey].sort((a, b) => WEEK_DAYS.findIndex(d => d.key === a) - WEEK_DAYS.findIndex(d => d.key === b))
    );
  };

  const handleAddExercise = (day: string, exerciseName: string) => {
    setExercisesByDay(prev => ({
      ...prev,
      [day]: [...(prev[day] || []), { name: exerciseName, sets: 3, reps: 10, weight: 0, notes: '' }]
    }));
    setExerciseInput('');
    setSearchTerm('');
    setShowAddExercise(false);
  };

  const handleUpdateExercise = (day: string, index: number, field: string, value: any) => {
    setExercisesByDay(prev => {
      const newExercises = [...(prev[day] || [])];
      newExercises[index] = { ...newExercises[index], [field]: value };
      return { ...prev, [day]: newExercises };
    });
  };

  const handleDeleteExercise = (day: string, index: number) => {
    setExercisesByDay(prev => {
      const newExercises = [...(prev[day] || [])];
      newExercises.splice(index, 1);
      return { ...prev, [day]: newExercises };
    });
  };

  const handleSaveRoutine = async () => {
    if (!routineName.trim()) {
      showNotification('El nombre de la rutina no puede estar vacío.', 'error');
      return;
    }
    if (selectedDays.length === 0) {
      showNotification('Debes seleccionar al menos un día para la rutina.', 'error');
      return;
    }
    if (Object.values(exercisesByDay).every(dayExercises => dayExercises.length === 0)) {
      showNotification('Debes añadir al menos un ejercicio a la rutina.', 'error');
      return;
    }

    setIsSaving(true);
    try {
      const routineId = doc(db, `users/${userId}/routines`).id;
      const newRoutine = {
        id: routineId,
        name: routineName,
        days: selectedDays,
        exercises: exercisesByDay,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      await setDoc(doc(db, `users/${userId}/routines`, routineId), newRoutine);
      showNotification('Rutina guardada con éxito!', 'success');
      onClose(); // Close the modal/view after saving
    } catch (error) {
      console.error("Error al guardar la rutina:", error);
      showNotification('Error al guardar la rutina.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const applyTemplate = (templateKey: string) => {
    const template = ROUTINE_TEMPLATES[templateKey];
    if (template) {
      setRoutineName(template.name);
      setSelectedDays(template.days);
      setExercisesByDay(template.exercises);
      setStep(2); // Go directly to review
    }
  };

  const renderStepContent = () => {
    switch (step) {
      case 0: // Initial screen: Choose creation method
        return (
          <div className="flex flex-col items-center justify-center h-full p-4 animate-fade-in">
            <h2 className="text-3xl font-bold text-violet-400 mb-8">Crear Nueva Rutina</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-4xl">
              {Object.entries(ROUTINE_TEMPLATES).map(([key, template]) => (
                <div
                  key={key}
                  className="bg-zinc-800 rounded-xl p-6 flex flex-col items-center text-center cursor-pointer hover:bg-zinc-700 transition-all duration-300 shadow-lg hover:shadow-violet-500/30"
                  onClick={() => applyTemplate(key)}
                >
                  {template.icon && <template.icon />}
                  <h3 className="text-xl font-semibold text-zinc-100 mt-4 mb-2">{template.name}</h3>
                  <p className="text-zinc-400 text-sm">{template.description}</p>
                </div>
              ))}
              <div
                className="bg-zinc-800 rounded-xl p-6 flex flex-col items-center text-center cursor-pointer hover:bg-zinc-700 transition-all duration-300 shadow-lg hover:shadow-violet-500/30"
                onClick={() => setStep(1)}
              >
                <PlusIcon />
                <h3 className="text-xl font-semibold text-zinc-100 mt-4 mb-2">Crear desde Cero</h3>
                <p className="text-zinc-400 text-sm">Diseña tu rutina personalizada paso a paso.</p>
              </div>
            </div>
          </div>
        );
      case 1: // Step 1: Routine Name and Day Selection
        return (
          <div className="flex flex-col h-full p-4 animate-fade-in">
            <h2 className="text-2xl font-bold text-violet-400 mb-6 text-center">Paso 1: Detalles de la Rutina</h2>
            <div className="mb-6">
              <label htmlFor="routineName" className="block text-zinc-300 text-lg font-semibold mb-2">Nombre de la Rutina</label>
              <input
                type="text"
                id="routineName"
                value={routineName}
                onChange={(e) => setRoutineName(e.target.value)}
                className="w-full p-3 rounded-lg bg-zinc-900 text-zinc-100 border border-zinc-700 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 outline-none transition-all"
                placeholder="Ej. Rutina de Fuerza, Mi Rutina de Hipertrofia"
              />
            </div>

            <div className="mb-8">
              <label className="block text-zinc-300 text-lg font-semibold mb-3">Días de Entrenamiento</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
                {WEEK_DAYS.map(day => (
                  <button
                    key={day.key}
                    className={`p-3 rounded-lg font-medium transition-all duration-200 ${
                      selectedDays.includes(day.key)
                        ? 'bg-violet-600 text-white shadow-md shadow-violet-500/40'
                        : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-zinc-100'
                    }`}
                    onClick={() => handleDayToggle(day.key)}
                  >
                    {day.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-between mt-auto pt-4 border-t border-zinc-700">
              <button
                onClick={() => setStep(0)}
                className="px-6 py-3 bg-zinc-700 text-zinc-200 rounded-lg font-semibold hover:bg-zinc-600 transition-colors"
              >
                Atrás
              </button>
              <button
                onClick={() => {
                  if (selectedDays.length > 0) {
                    setStep(2);
                    // Initialize exercises for selected days if not already
                    const initialExercises = { ...exercisesByDay };
                    selectedDays.forEach(day => {
                      if (!initialExercises[day]) {
                        initialExercises[day] = [];
                      }
                    });
                    setExercisesByDay(initialExercises);
                  } else {
                    showNotification('Selecciona al menos un día para continuar.', 'error');
                  }
                }}
                className="px-6 py-3 bg-violet-600 text-white rounded-lg font-semibold hover:bg-violet-700 transition-colors shadow-lg shadow-violet-500/30"
              >
                Siguiente
              </button>
            </div>
          </div>
        );
      case 2: // Step 2: Exercise Selection per Day
        return (
          <div className="flex flex-col h-full p-4 animate-fade-in">
            <h2 className="text-2xl font-bold text-violet-400 mb-6 text-center">Paso 2: Ejercicios por Día</h2>

            <div className="mb-6">
              <label className="block text-zinc-300 text-lg font-semibold mb-3">Selecciona un Día</label>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 gap-3">
                {selectedDays.map(dayKey => {
                  const dayLabel = WEEK_DAYS.find(d => d.key === dayKey)?.label;
                  return (
                    <button
                      key={dayKey}
                      className={`p-3 rounded-lg font-medium transition-all duration-200 ${
                        currentDay === dayKey
                          ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/40'
                          : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-zinc-100'
                      }`}
                      onClick={() => setCurrentDay(dayKey)}
                    >
                      {dayLabel}
                    </button>
                  );
                })}
              </div>
            </div>

            {currentDay && (
              <div className="bg-zinc-800 p-5 rounded-xl shadow-inner mb-6 flex-grow overflow-y-auto">
                <h3 className="text-xl font-bold text-zinc-100 mb-4">Ejercicios para {WEEK_DAYS.find(d => d.key === currentDay)?.label}</h3>
                {exercisesByDay[currentDay]?.length === 0 && (
                  <p className="text-zinc-400 text-center py-8">Aún no hay ejercicios para este día. ¡Añade algunos!</p>
                )}
                <div className="space-y-4">
                  {exercisesByDay[currentDay]?.map((exercise, index) => (
                    <div key={index} className="bg-zinc-700 p-4 rounded-lg shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                      <div className="flex-grow">
                        <p className="text-zinc-100 font-semibold text-lg mb-1">{exercise.name}</p>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-zinc-300 text-sm">
                          <div className="flex items-center gap-1">
                            <span>Series:</span>
                            <NumberStepper
                              value={exercise.sets}
                              onChange={(val: number) => handleUpdateExercise(currentDay, index, 'sets', val)}
                              min={1} max={20}
                            />
                          </div>
                          <div className="flex items-center gap-1">
                            <span>Reps:</span>
                            <NumberStepper
                              value={exercise.reps}
                              onChange={(val: number) => handleUpdateExercise(currentDay, index, 'reps', val)}
                              min={1} max={100}
                            />
                          </div>
                          <div className="flex items-center gap-1">
                            <span>Peso (kg):</span>
                            <NumberStepper
                              value={exercise.weight}
                              onChange={(val: number) => handleUpdateExercise(currentDay, index, 'weight', val)}
                              min={0} max={500} step={2.5}
                            />
                          </div>
                          <input
                            type="text"
                            value={exercise.notes}
                            onChange={(e) => handleUpdateExercise(currentDay, index, 'notes', e.target.value)}
                            className="flex-grow p-2 rounded-md bg-zinc-600 border border-zinc-500 text-zinc-100 text-sm placeholder-zinc-400 outline-none focus:border-violet-500"
                            placeholder="Notas (opcional)"
                          />
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteExercise(currentDay, index)}
                        className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex-shrink-0"
                      >
                        Eliminar
                      </button>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => setShowAddExercise(true)}
                  className="mt-6 w-full py-3 bg-violet-600 text-white rounded-lg font-semibold hover:bg-violet-700 transition-colors shadow-lg shadow-violet-500/30 flex items-center justify-center gap-2"
                >
                  <PlusIcon /> Añadir Ejercicio
                </button>

                {showAddExercise && (
                  <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50 animate-fade-in">
                    <div className="bg-zinc-800 rounded-xl p-6 w-full max-w-md shadow-2xl animate-fade-in-scale-sm">
                      <h3 className="text-xl font-bold text-violet-400 mb-4">Añadir Ejercicio</h3>
                      <input
                        type="text"
                        className="w-full p-3 rounded-lg bg-zinc-900 text-zinc-100 border border-zinc-700 focus:border-violet-500 outline-none mb-4"
                        placeholder="Buscar o añadir ejercicio..."
                        value={searchTerm}
                        onChange={(e) => {
                          setSearchTerm(e.target.value);
                          setExerciseInput(e.target.value); // Keep exerciseInput in sync for direct add
                        }}
                      />
                      <div className="max-h-48 overflow-y-auto mb-4 border border-zinc-700 rounded-lg bg-zinc-900">
                        {filteredExerciseSuggestions.length > 0 ? (
                          filteredExerciseSuggestions.map((exercise, idx) => (
                            <button
                              key={idx}
                              className="block w-full text-left p-3 text-zinc-200 hover:bg-zinc-700 transition-colors border-b border-zinc-700 last:border-b-0"
                              onClick={() => {
                                handleAddExercise(currentDay, exercise);
                                setShowAddExercise(false);
                              }}
                            >
                              {exercise}
                            </button>
                          ))
                        ) : (
                          <p className="p-3 text-zinc-400 text-center">No se encontraron sugerencias.</p>
                        )}
                      </div>
                      <div className="flex justify-end gap-3">
                        <button
                          onClick={() => setShowAddExercise(false)}
                          className="px-5 py-2 bg-zinc-700 text-zinc-200 rounded-lg font-semibold hover:bg-zinc-600 transition-colors"
                        >
                          Cancelar
                        </button>
                        <button
                          onClick={() => {
                            if (exerciseInput.trim()) {
                              handleAddExercise(currentDay, exerciseInput.trim());
                            } else {
                              showNotification('El nombre del ejercicio no puede estar vacío.', 'error');
                            }
                          }}
                          className="px-5 py-2 bg-violet-600 text-white rounded-lg font-semibold hover:bg-violet-700 transition-colors"
                        >
                          Añadir
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-between mt-auto pt-4 border-t border-zinc-700">
              <button
                onClick={() => setStep(1)}
                className="px-6 py-3 bg-zinc-700 text-zinc-200 rounded-lg font-semibold hover:bg-zinc-600 transition-colors"
              >
                Atrás
              </button>
              <button
                onClick={handleSaveRoutine}
                className="px-6 py-3 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-500/30"
                disabled={isSaving}
              >
                {isSaving ? 'Guardando...' : 'Guardar Rutina'}
              </button>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="relative bg-zinc-900 rounded-xl shadow-2xl p-6 w-full max-w-5xl h-[90vh] flex flex-col">
      {renderStepContent()}
      {showToast && (
        <div className={`fixed bottom-6 right-6 p-4 rounded-lg shadow-xl text-white font-semibold z-50 animate-fade-in-scale-sm ${
          toastType === 'success' ? 'bg-green-500' : 'bg-red-500'
        }`}>
          {toastMessage}
        </div>
      )}
    </div>
  );
};

export default NewRoutineCreator;
