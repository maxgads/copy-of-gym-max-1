
import React from 'react';
import firebase from 'firebase/compat/app';
import { AppView } from '../../../types';
import { SuggestedWorkout } from '../../hooks/useNextWorkoutSuggestion';
import LoadingSpinner from '../../LoadingSpinner';

// --- ÍCONOS SVG PARA LAS FUNCIONALIDADES ---
const FlameIcon = ({ className = "w-5 h-5" }) => (<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"></path></svg>);
const LightbulbIcon = ({ className = "w-5 h-5" }) => (<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M15 14c.2-1 .7-1.7 1.5-2.5C17.7 10.2 18 9 18 7.5a6 6 0 0 0-12 0c0 1.5.3 2.7 1.5 3.5.7.8 1.3 1.5 1.5 2.5"></path><path d="M9 18h6"></path><path d="M10 22h4"></path></svg>);
const DumbbellIcon = ({ className = "w-5 h-5" }) => (<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M14.4 14.4 9.6 9.6"></path><path d="M18.657 21.485a2 2 0 1 1-2.829-2.828l-1.767 1.768a2 2 0 1 1-2.829-2.829l6.364-6.364a2 2 0 1 1 2.829 2.829l-1.768 1.767a2 2 0 1 1 2.828 2.829z"></path><path d="m21.5 21.5-1.4-1.4"></path><path d="M3.9 3.9 2.5 2.5"></path><path d="M6.404 12.768a2 2 0 1 1-2.829-2.829l1.768-1.767a2 2 0 1 1 2.828-2.829l6.364 6.364a2 2 0 1 1-2.829 2.829l-1.767-1.768a2 2 0 1 1-2.829 2.829z"></path></svg>);
const CheckCircleIcon = ({ className = "w-5 h-5" }) => (<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>);
const PlayIcon = ({ className = "w-6 h-6" }) => (<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>);
const ListIcon = ({ className = "w-6 h-6" }) => (<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>);
const RecipeBookIcon = ({ className = "w-5 h-5" }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg>;
const CameraIcon = ({className = "w-5 h-5"}) => <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>;

// --- PROPS DEL COMPONENTE ---
interface WelcomeSectionProps {
    currentUser: firebase.User;
    quote: string;
    dailyTip: string;
    workoutStreak: number;
    weeklySummary: { workoutsDone: number; workoutsTotal: number; volume: number; };
    onStartWorkout: () => void;
    onChooseOtherWorkout: () => void;
    onViewRoutine: () => void;
    onNavigate: (view: AppView) => void;
    onOpenMealAnalyzer: () => void;
    onOpenRecipeGenerator: () => void;
    isLoadingSuggestion: boolean;
    nextWorkoutSuggestion: SuggestedWorkout | null;
}

// --- COMPONENTE MEJORADO ---
const WelcomeSection: React.FC<WelcomeSectionProps> = ({
    currentUser, quote, dailyTip, workoutStreak, weeklySummary,
    onStartWorkout, onChooseOtherWorkout, onViewRoutine, onNavigate,
    onOpenMealAnalyzer, onOpenRecipeGenerator,
    isLoadingSuggestion, nextWorkoutSuggestion
}) => {

    const mainButtonBaseStyles = "w-full text-white font-semibold py-3 px-4 rounded-xl transition-all duration-300 ease-in-out transform focus:outline-none focus:ring-4 focus:ring-opacity-50 shadow-lg text-base flex justify-center items-center gap-2";
    const aiToolButtonStyles = "w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all duration-200";

    return (
        <div className="relative bg-zinc-900/50 backdrop-blur-xl shadow-2xl rounded-2xl p-4 sm:p-6 border border-zinc-700/80 w-full max-w-md mx-auto">
            
            {workoutStreak > 1 && (
                <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-orange-500/20 text-orange-300 px-3 py-1 rounded-full text-sm font-semibold border border-orange-500/50">
                    <FlameIcon className="w-4 h-4" />
                    <span>{workoutStreak}</span>
                </div>
            )}

            <div className="flex items-center gap-4 mb-6">
                <div className="relative flex-shrink-0">
                    <img
                        src={currentUser.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.displayName || 'U')}&background=8b5cf6&color=fff&size=96&font-size=0.33&bold=true&rounded=true`}
                        alt="Avatar de usuario"
                        onClick={() => onNavigate('profile')}
                        className="w-14 h-14 sm:w-16 sm:h-16 rounded-full object-cover shadow-lg cursor-pointer transition-transform duration-300 hover:scale-110"
                    />
                    <div className="absolute -inset-1 rounded-full bg-gradient-to-tr from-violet-600 to-indigo-500 blur-sm -z-10"></div>
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-zinc-100 to-zinc-300 drop-shadow-sm leading-tight">
                    ¡Hola, {currentUser.displayName?.split(' ')[0] || 'Campeón'}!
                </h1>
            </div>

            <p className="text-zinc-400 text-sm italic mb-6 border-l-2 border-violet-500 pl-4">{quote}</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                <button onClick={onStartWorkout} disabled={isLoadingSuggestion || !nextWorkoutSuggestion} className={`${mainButtonBaseStyles} bg-violet-600 hover:bg-violet-500 focus:ring-violet-400 hover:shadow-violet-500/30 disabled:bg-slate-500 disabled:cursor-not-allowed`} autoFocus>
                    {isLoadingSuggestion ? <LoadingSpinner size="sm"/> : <><PlayIcon className="w-5 h-5" /><span className="truncate">{nextWorkoutSuggestion ? `Empezar: ${nextWorkoutSuggestion.dayName}` : 'No hay sugerencias'}</span></>}
                </button>
                <button onClick={onChooseOtherWorkout} className={`${mainButtonBaseStyles} bg-zinc-800/80 hover:bg-zinc-700/90 focus:ring-zinc-600 border border-zinc-700`}>
                    <ListIcon className="w-5 h-5" /><span>Elegir Otro</span>
                </button>
            </div>

            <div className="mb-6">
                <button onClick={onViewRoutine} disabled={!nextWorkoutSuggestion} className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl text-sm font-bold bg-violet-800/80 text-violet-100 hover:bg-violet-700/90 border border-violet-700/90 transition-all duration-200 shadow-lg hover:shadow-violet-500/30 transform hover:-translate-y-0.5 disabled:bg-slate-500 disabled:cursor-not-allowed">
                    <ListIcon className="w-5 h-5" /> Ver Rutina de Hoy
                </button>
            </div>
            
            <div className="pt-6 border-t border-zinc-700/80 space-y-4">
                <h3 className="text-center text-base font-semibold text-zinc-300">Asistente de Nutrición IA</h3>
                <div className="space-y-3 sm:grid sm:grid-cols-2 sm:gap-3 sm:space-y-0">
                    <button onClick={onOpenMealAnalyzer} className={`${aiToolButtonStyles} bg-teal-900/60 text-teal-200 hover:bg-teal-900/90 border border-teal-800`}>
                        <CameraIcon /> Analizar Comida
                    </button>
                    <button onClick={onOpenRecipeGenerator} className={`${aiToolButtonStyles} bg-violet-900/60 text-violet-200 hover:bg-violet-900/90 border border-violet-800`}>
                        <RecipeBookIcon /> Generar Receta
                    </button>
                </div>
            </div>

            <div className="pt-6 border-t border-zinc-800/70 space-y-4 mt-6">
                <div className="space-y-3">
                    <h3 className="text-center text-sm font-semibold text-zinc-400">Resumen de la Semana</h3>
                    <div className="grid grid-cols-2 gap-3 text-center">
                        <div className="bg-zinc-800/50 p-2 rounded-lg"><CheckCircleIcon className="w-6 h-6 text-green-400 mx-auto mb-1" /><p className="text-xs text-zinc-400">Completados</p><p className="font-bold text-lg text-white">{weeklySummary.workoutsDone} / {weeklySummary.workoutsTotal}</p></div>
                        <div className="bg-zinc-800/50 p-2 rounded-lg"><DumbbellIcon className="w-6 h-6 text-sky-400 mx-auto mb-1" /><p className="text-xs text-zinc-400">Volumen Total</p><p className="font-bold text-lg text-white">{weeklySummary.volume.toLocaleString('es-ES')} kg</p></div>
                    </div>
                </div>
                <div className="p-3 bg-zinc-800/50 rounded-lg flex items-start gap-3">
                    <LightbulbIcon className="w-4 h-4 text-amber-300 mt-0.5 flex-shrink-0" />
                    <p className="text-zinc-400 text-xs"><span className="font-semibold text-zinc-300">Consejo:</span> {dailyTip}</p>
                </div>
            </div>
        </div>
    );
};

export default WelcomeSection;
