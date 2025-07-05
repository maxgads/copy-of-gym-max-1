import React, { useState, useEffect, memo } from 'react';
import { CheckCircle2, Circle, X, Flame, Dumbbell } from 'lucide-react';

// --- COMPONENTES AUXILIARES ---
const LoadingSpinner = ({ size = 'md', color = 'text-violet-400' }) => {
    const sizes = { sm: 'w-5 h-5', md: 'w-8 h-8', lg: 'w-12 h-12' };
    return (
        <svg
            className={`animate-spin ${sizes[size]} ${color}`}
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            role="status"
            aria-label="Cargando..."
        >
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
            <path
                fill="currentColor"
                className="opacity-75"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
        </svg>
    );
};

const ExerciseItem = memo(({ exercise, type, isChecked, onToggle }) => {
    const base = 'transition duration-300 transform hover:scale-[1.02]';
    const status = isChecked ? 'opacity-50 line-through' : '';
    const iconColor = type === 'warmup' ? 'text-amber-400' : 'text-violet-400';

    return (
        <li
            onClick={onToggle}
            className={`bg-slate-700/60 p-2.5 rounded-lg border border-slate-600/50 flex items-center gap-3 cursor-pointer hover:bg-slate-700 ${base} ${status}`}
        >
            {isChecked ? (
                <CheckCircle2 className="w-5 h-5 text-green-400" />
            ) : (
                <Circle className="w-5 h-5 text-slate-500" />
            )}
            <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-100 break-words" title={exercise.exerciseName}>
                    {exercise.exerciseName || 'Ejercicio sin nombre'}
                </p>
                <p className="text-xs text-slate-300">
                    <span className={iconColor}>{exercise.sets}</span> series
                    <span className="mx-1.5 text-slate-500">|</span>
                    <span className={iconColor}>{exercise.reps}</span> reps
                </p>
            </div>
        </li>
    );
});
ExerciseItem.displayName = 'ExerciseItem';

const TabButton = ({ label, icon, isActive, onClick }) => {
    const active = 'bg-slate-700/80 text-white shadow-inner';
    const inactive = 'text-slate-400 hover:bg-slate-700/50 hover:text-slate-200';

    return (
        <button
            onClick={onClick}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-2 text-sm font-bold rounded-t-md transition ${isActive ? active : inactive}`}
        >
            {icon}
            {label}
        </button>
    );
};

// --- COMPONENTE PRINCIPAL ---
const QuickDayCard = ({ routineName, dayName, dayDetails, isLoading, onClose }) => {
    const [activeTab, setActiveTab] = useState('main');
    const [checked, setChecked] = useState(new Set());

    useEffect(() => {
        setChecked(new Set());
        if (dayDetails) {
            if (dayDetails.exercises?.length) setActiveTab('main');
            else if (dayDetails.warmUpExercises?.length) setActiveTab('warmup');
        }
    }, [dayDetails]);

    const toggleCheck = (id) => {
        setChecked((prev) => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    const renderList = (items, type) => {
        if (!items?.length)
            return <p className="text-slate-400 text-sm text-center py-6">No hay ejercicios de {type === 'warmup' ? 'calentamiento' : 'este tipo'}.</p>;

        return (
            <ul className="space-y-2 pt-2 animate-fade-in">
                {items.map((ex) => (
                    <ExerciseItem
                        key={ex.id}
                        exercise={ex}
                        type={type}
                        isChecked={checked.has(ex.id)}
                        onToggle={() => toggleCheck(ex.id)}
                    />
                ))}
            </ul>
        );
    };

    const renderContent = () => {
        if (isLoading) return <div className="flex justify-center items-center min-h-[200px]"><LoadingSpinner /></div>;
        if (!dayDetails) return <p className="text-slate-400 text-sm text-center py-6">No se pudieron cargar los detalles.</p>;

        const hasWarmup = !!dayDetails.warmUpExercises?.length;
        const hasMain = !!dayDetails.exercises?.length;

        if (!hasWarmup && !hasMain)
            return <p className="text-slate-400 text-sm text-center py-6">No hay ejercicios planificados para hoy.</p>;

        return (
            <div className="flex flex-col flex-grow min-h-0">
                {hasWarmup && hasMain && (
                    <div className="flex bg-slate-800/70 rounded-t-md p-1 gap-1">
                        <TabButton
                            label="Calentamiento"
                            icon={<Flame className={`w-4 h-4 ${activeTab === 'warmup' ? 'text-amber-400' : ''}`} />}
                            isActive={activeTab === 'warmup'}
                            onClick={() => setActiveTab('warmup')}
                        />
                        <TabButton
                            label="Principal"
                            icon={<Dumbbell className={`w-4 h-4 ${activeTab === 'main' ? 'text-violet-400' : ''}`} />}
                            isActive={activeTab === 'main'}
                            onClick={() => setActiveTab('main')}
                        />
                    </div>
                )}
                <div className="overflow-y-auto flex-grow custom-scrollbar pr-2 -mr-2 bg-slate-800/50 rounded-b-md p-2">
                    {activeTab === 'warmup' && renderList(dayDetails.warmUpExercises, 'warmup')}
                    {activeTab === 'main' && renderList(dayDetails.exercises, 'main')}
                </div>
            </div>
        );
    };

    return (
        <div className="bg-zinc-900/90 dark:bg-zinc-950 border border-zinc-700 rounded-xl shadow-xl p-6 transition-colors h-full flex flex-col">
            <div className="flex justify-between items-start mb-3 pb-3 border-b border-slate-700">
                <div className="flex-1 min-w-0">
                    <h2 className="text-lg font-bold text-violet-300 break-words" title={`${routineName} - ${dayName}`}>
                        <span className="text-slate-200 font-semibold">{routineName}</span>
                        <span className="text-slate-500 font-medium mx-2">/</span>
                        <span className="text-violet-400">{dayName}</span>
                    </h2>
                </div>
                <button
                    onClick={onClose}
                    className="text-slate-400 hover:text-white p-1 rounded-full hover:bg-slate-700 transition ml-2"
                    aria-label="Cerrar vista rápida"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>
            <div className="flex-grow min-h-0">
                {renderContent()}
            </div>
        </div>
    );
};

export default QuickDayCard;
