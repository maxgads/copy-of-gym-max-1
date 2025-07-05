import React, { useState } from 'react';

// Íconos SVG válidos como componentes React
const DumbbellIcon: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8 mb-2 text-violet-400"><path d="M14.4 14.4 9.6 9.6"/><path d="M18.657 21.485a2 2 0 1 1-2.829-2.828l-1.767 1.768a2 2 0 1 1-2.829-2.829l-1.768 1.768a2 2 0 1 1-2.828-2.828l-1.768 1.768a2 2 0 1 1-2.828-2.828l8.486-8.485a2 2 0 1 1 2.828 2.828l1.768-1.768a2 2 0 1 1 2.829 2.829l1.767-1.768a2 2 0 1 1 2.829 2.828z"/></svg>
);
const PlusIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8 mb-2 text-violet-400"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
);

const RoutineCreatorProfessional: React.FC = () => {
    const [name, setName] = useState('');
    const [exercises, setExercises] = useState<any[]>([{ id: Date.now(), series: 3, repeticiones: 10, descanso: 60, tipo: 'peso' }]);
    const [tipoRutina, setTipoRutina] = useState<'basico' | 'avanzado'>('basico');
    const [nivelDificultad, setNivelDificultad] = useState<'facil' | 'medio' | 'dificil'>('facil');
    const [objetivo, setObjetivo] = useState<'definicion' | 'aumento-masa' | 'fuerza'>('definicion');
    const [diasEntrenamiento, setDiasEntrenamiento] = useState<number[]>([1, 3, 5]);
    const [rutinasGuardadas, setRutinasGuardadas] = useState<any[]>([]);
    const [cargando, setCargando] = useState(false);
    const [exitoGuardado, setExitoGuardado] = useState(false);

    // Guardar rutina (simulado local, reemplaza con Firestore si quieres persistencia real)
    const guardarRutina = async () => {
        if (!name.trim()) return;
        setCargando(true);
        const rutina = {
            nombre: name,
            ejercicios: exercises,
            tipo: tipoRutina,
            nivel: nivelDificultad,
            objetivo: objetivo,
            dias: diasEntrenamiento,
            fecha: new Date(),
        };
        try {
            setRutinasGuardadas([...rutinasGuardadas, { id: Date.now().toString(), ...rutina }]);
            setExitoGuardado(true);
            setName('');
            setExercises([{ id: Date.now(), series: 3, repeticiones: 10, descanso: 60, tipo: 'peso' }]);
            setTipoRutina('basico');
            setNivelDificultad('facil');
            setObjetivo('definicion');
            setDiasEntrenamiento([1, 3, 5]);
        } catch (error) {
            console.error('Error al guardar la rutina: ', error);
        } finally {
            setCargando(false);
        }
    };

    return (
        <div className="w-full max-w-md mx-auto bg-zinc-900 text-zinc-100 p-4 sm:p-6 rounded-2xl shadow-2xl shadow-violet-900/20 font-sans">
            <h1 className="text-3xl font-bold text-center mb-6">Creador de Rutinas</h1>
            <div className="mb-4">
                <label className="block text-sm font-medium mb-2" htmlFor="nombre-rutina">Nombre de la Rutina</label>
                <input
                    id="nombre-rutina"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full p-3 text-zinc-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-400"
                    placeholder="Ej: Rutina de Fuerza Total"
                />
            </div>
            <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Tipo de Rutina</label>
                <div className="flex gap-2">
                    <button
                        onClick={() => setTipoRutina('basico')}
                        className={`flex-1 p-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-2
                        ${tipoRutina === 'basico' ? 'bg-violet-400 text-zinc-900' : 'bg-zinc-800 text-zinc-100 hover:bg-violet-500'}`}
                    >
                        <PlusIcon />
                        Básico
                    </button>
                    <button
                        onClick={() => setTipoRutina('avanzado')}
                        className={`flex-1 p-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-2
                        ${tipoRutina === 'avanzado' ? 'bg-violet-400 text-zinc-900' : 'bg-zinc-800 text-zinc-100 hover:bg-violet-500'}`}
                    >
                        <DumbbellIcon />
                        Avanzado
                    </button>
                </div>
            </div>
            <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Nivel de Dificultad</label>
                <select
                    value={nivelDificultad}
                    onChange={(e) => setNivelDificultad(e.target.value as 'facil' | 'medio' | 'dificil')}
                    className="w-full p-3 text-zinc-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-400"
                >
                    <option value="facil">Fácil</option>
                    <option value="medio">Medio</option>
                    <option value="dificil">Difícil</option>
                </select>
            </div>
            <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Objetivo</label>
                <select
                    value={objetivo}
                    onChange={(e) => setObjetivo(e.target.value as 'definicion' | 'aumento-masa' | 'fuerza')}
                    className="w-full p-3 text-zinc-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-400"
                >
                    <option value="definicion">Definición</option>
                    <option value="aumento-masa">Aumento de Masa</option>
                    <option value="fuerza">Fuerza</option>
                </select>
            </div>
            <div className="mb-6">
                <label className="block text-sm font-medium mb-2">Días de Entrenamiento</label>
                <div className="flex gap-2 flex-wrap">
                    {[1, 2, 3, 4, 5, 6, 7].map(dia => (
                        <button
                            key={dia}
                            onClick={() => {
                                if (diasEntrenamiento.includes(dia)) {
                                    setDiasEntrenamiento(diasEntrenamiento.filter(d => d !== dia));
                                } else {
                                    setDiasEntrenamiento([...diasEntrenamiento, dia]);
                                }
                            }}
                            className={`px-4 py-2 rounded-lg font-semibold transition-all
                            ${diasEntrenamiento.includes(dia) ? 'bg-violet-400 text-zinc-900' : 'bg-zinc-800 text-zinc-100 hover:bg-violet-500'}`}
                        >
                            {dia}
                        </button>
                    ))}
                </div>
            </div>
            <div className="mb-6">
                <label className="block text-sm font-medium mb-2">Ejercicios</label>
                {exercises.map((exercise, index) => (
                    <div key={exercise.id} className="bg-zinc-800 p-4 rounded-lg mb-4">
                        <div className="flex gap-2 mb-2">
                            <select
                                value={exercise.tipo}
                                onChange={(e) => {
                                    const newExercises = [...exercises];
                                    newExercises[index].tipo = e.target.value as 'peso' | 'repeticiones';
                                    setExercises(newExercises);
                                }}
                                className="flex-1 p-3 text-zinc-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-400"
                            >
                                <option value="peso">Por Peso</option>
                                <option value="repeticiones">Por Repeticiones</option>
                            </select>
                            <button
                                onClick={() => {
                                    const newExercises = exercises.filter((_, i) => i !== index);
                                    setExercises(newExercises);
                                }}
                                className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all"
                            >
                                Eliminar
                            </button>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                            <div>
                                <label className="block text-xs font-medium mb-1" htmlFor={`series-${exercise.id}`}>Series</label>
                                <input
                                    id={`series-${exercise.id}`}
                                    type="number"
                                    value={exercise.series}
                                    onChange={(e) => {
                                        const newExercises = [...exercises];
                                        newExercises[index].series = Number(e.target.value);
                                        setExercises(newExercises);
                                    }}
                                    className="w-full p-2 text-zinc-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-400"
                                    min={1}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium mb-1" htmlFor={`repeticiones-${exercise.id}`}>Repeticiones</label>
                                <input
                                    id={`repeticiones-${exercise.id}`}
                                    type="number"
                                    value={exercise.repeticiones}
                                    onChange={(e) => {
                                        const newExercises = [...exercises];
                                        newExercises[index].repeticiones = Number(e.target.value);
                                        setExercises(newExercises);
                                    }}
                                    className="w-full p-2 text-zinc-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-400"
                                    min={1}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium mb-1" htmlFor={`descanso-${exercise.id}`}>Descanso (segundos)</label>
                                <input
                                    id={`descanso-${exercise.id}`}
                                    type="number"
                                    value={exercise.descanso}
                                    onChange={(e) => {
                                        const newExercises = [...exercises];
                                        newExercises[index].descanso = Number(e.target.value);
                                        setExercises(newExercises);
                                    }}
                                    className="w-full p-2 text-zinc-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-400"
                                    min={0}
                                />
                            </div>
                        </div>
                    </div>
                ))}
                <button
                    onClick={() => setExercises([...exercises, { id: Date.now(), series: 3, repeticiones: 10, descanso: 60, tipo: 'peso' }])}
                    className="w-full p-3 bg-violet-500 text-zinc-900 rounded-lg hover:bg-violet-600 transition-all flex items-center justify-center gap-2"
                >
                    <PlusIcon />
                    Agregar Ejercicio
                </button>
            </div>
            <div className="text-center py-10">
                <div className="text-6xl mb-4">🚀</div>
                <h2 className="text-2xl font-bold text-violet-400 mb-2">¡Rutina Guardada!</h2>
                <p className="text-zinc-300 mb-6">Tu rutina está segura en la nube.</p>
                <button
                    onClick={guardarRutina}
                    className="px-6 py-3 bg-violet-500 text-zinc-900 rounded-lg hover:bg-violet-600 transition-all font-semibold"
                >
                    {cargando ? 'Guardando...' : 'Guardar Rutina'}
                </button>
            </div>
            {exitoGuardado && (
                <div className="mt-4 text-center">
                    <p className="text-sm text-green-400">Rutina guardada con éxito.</p>
                </div>
            )}
            <div className="mt-8">
                <h3 className="text-xl font-semibold mb-4">Rutinas Guardadas</h3>
                {cargando ? (
                    <p className="text-center text-zinc-400">Cargando rutinas guardadas...</p>
                ) : (
                    <div className="space-y-4">
                        {rutinasGuardadas.length === 0 ? (
                            <p className="text-center text-zinc-400">No tienes rutinas guardadas.</p>
                        ) : (
                            rutinasGuardadas.map(rutina => (
                                <div key={rutina.id} className="bg-zinc-800 p-4 rounded-lg">
                                    <h4 className="text-lg font-bold mb-2">{rutina.nombre}</h4>
                                    <p className="text-sm text-zinc-400 mb-2">Objetivo: {rutina.objetivo}</p>
                                    <p className="text-sm text-zinc-400 mb-2">Dificultad: {rutina.nivel}</p>
                                    <p className="text-sm text-zinc-400">Días: {rutina.dias.join(', ')}</p>
                                    <div className="mt-2 flex gap-2">
                                        <button
                                            onClick={async () => {
                                                setCargando(true);
                                                try {
                                                    setRutinasGuardadas(rutinasGuardadas.filter(r => r.id !== rutina.id));
                                                } catch (error) {
                                                    console.error('Error al eliminar la rutina: ', error);
                                                } finally {
                                                    setCargando(false);
                                                }
                                            }}
                                            className="flex-1 p-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all"
                                        >
                                            Eliminar
                                        </button>
                                        <button
                                            onClick={() => {
                                                setName(rutina.nombre);
                                                setExercises(rutina.ejercicios);
                                                setTipoRutina(rutina.tipo);
                                                setNivelDificultad(rutina.nivel);
                                                setObjetivo(rutina.objetivo);
                                                setDiasEntrenamiento(rutina.dias);
                                            }}
                                            className="flex-1 p-3 bg-violet-500 text-zinc-900 rounded-lg hover:bg-violet-600 transition-all"
                                        >
                                            Editar
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default RoutineCreatorProfessional;
