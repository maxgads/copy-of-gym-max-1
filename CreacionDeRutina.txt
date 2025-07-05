  que cuando apretes el boton "agregar rutina nueva en el panel de rutinas, y en en "elegir otro" y "Crear rutina manualmnete"(en esos 2 botones de agregar rutina), se abra el sigueinte menu que te voy a pasar. que es el nuevo menu de creacion de rutinas. el anterior lo tendras que borrar.
elmenu es el siguiente ;
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

function RoutineCreatorProfessional({ db, userId }) {
const [step, setStep] = useState(0); // 0: Pantalla de inicio
const [routineName, setRoutineName] = useState('Mi Nueva Rutina');
const [selectedDays, setSelectedDays] = useState([]);
const [exercisesByDay, setExercisesByDay] = useState({});
const [currentDay, setCurrentDay] = useState(null);
const [exerciseInput, setExerciseInput] = useState('');
const [showAddExercise, setShowAddExercise] = useState(false);
const [isSaving, setIsSaving] = useState(false);

}

// Componente App que envuelve todo para la visualización
export default function App() {
const [firebaseServices, setFirebaseServices] = useState({ db: null, userId: null, isAuthReady: false });

useEffect(() => {
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : null;
const token = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;
if (!firebaseConfig) { console.error("La configuración de Firebase no está disponible."); return; }
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const unsubscribe = onAuthStateChanged(auth, async (user) => {
if (user) {
setFirebaseServices({ db, userId: user.uid, isAuthReady: true });
} else {
try {
if (token) await signInWithCustomToken(auth, token);
else await signInAnonymously(auth);
} catch (error) {
console.error("Error en la autenticación:", error);
setFirebaseServices({ db: null, userId: null, isAuthReady: true });
}
}
});
return () => unsubscribe();
}, []);

if (!firebaseServices.isAuthReady) {
return (<div className="bg-zinc-950 min-h-screen text-white flex items-center justify-center p-4"><p className="text-violet-400">Cargando y autenticando...</p></div>);
}

return (
<div className="bg-zinc-950 min-h-screen text-white flex items-center justify-center p-4">
<style>{          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');           body { font-family: 'Inter', sans-serif; }           @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }           .animate-fade-in { animation: fade-in 0.5s ease-in-out; }           @keyframes fade-in-scale-sm { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }           .animate-fade-in-scale-sm { animation: fade-in-scale-sm 0.3s ease-out; }           @keyframes slide-up { from { transform: translateY(100%); } to { transform: translateY(0); } }           .animate-slide-up { animation: slide-up 0.3s cubic-bezier(0.22, 1, 0.36, 1); }           .overflow-y-auto::-webkit-scrollbar { width: 8px; }           .overflow-y-auto::-webkit-scrollbar-track { background: #27272a; }           .overflow-y-auto::-webkit-scrollbar-thumb { background: #52525b; border-radius: 4px; }           .overflow-y-auto::-webkit-scrollbar-thumb:hover { background: #71717a; }      }</style>
{firebaseServices.db && firebaseServices.userId ? (
<RoutineCreatorProfessional db={firebaseServices.db} userId={firebaseServices.userId} />
) : (
<div className="text-center">
<h2 className="text-rose-500 text-xl">Error de Conexión</h2>
<p className="text-zinc-400">No se pudo conectar con la base de datos. Por favor, refresca la página.</p>
</div>
)}
</div>
);
}