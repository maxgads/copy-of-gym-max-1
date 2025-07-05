import React, { useState } from 'react';
import { useNextWorkoutSuggestion } from '../hooks/useNextWorkoutSuggestion';
import { useWeeklySummary } from '../hooks/useWeeklySummary';
import { useQuickView } from '../hooks/useQuickView';
import BMICalculator from '../BMICalculator';
import LoadingSpinner from '../LoadingSpinner';
import MealAnalyzer from '../MealAnalyzer';
import RecipeGenerator from '../RecipeGenerator';
import ModalV2 from '../ModalV2';
import SelectWorkoutDayModal from '../SelectWorkoutDayModal';
import QuickDayCard from '../QuickDayCard';
import Stopwatch from '../Stopwatch';
import WelcomeSection from './inicio/WelcomeSection';

// =================================================================================
// --- ICONOS ---
// =================================================================================
const WaterDropIcon = ({className}: {className?: string}) => (<svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm0-2a6 6 0 100-12 6 6 0 000 12zm0-4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" /></svg>);
const MoonIcon = ({className}: {className?: string}) => (<svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" /></svg>);

// =================================================================================
// --- VISTA DE INICIO (Refactorizada y Corregida) ---
// =================================================================================
const InicioView = ({ currentUser, navigateTo, showToast }) => {
    const [isBmiModalOpen, setIsBmiModalOpen] = useState(false);
    const [isDaySelectorOpen, setIsDaySelectorOpen] = useState(false);
    const [isMealAnalyzerModalOpen, setIsMealAnalyzerModalOpen] = useState(false);
    const [isRecipeGeneratorModalOpen, setIsRecipeGeneratorModalOpen] = useState(false);

    const { suggestion, isLoading: isLoadingSuggestion } = useNextWorkoutSuggestion(currentUser.uid);
    const { summary: weeklySummary, isLoading: isLoadingSummary } = useWeeklySummary(currentUser.uid);
    const { isQuickViewActive, quickViewDayDetails, isLoadingQuickView, selectedDayForQuickViewInfo, selectDayForQuickView, closeQuickView } = useQuickView(currentUser.uid);
    
    const [quote] = useState("La constancia vence al talento.");
    const [dailyTip] = useState("Un buen calentamiento es clave para prevenir lesiones.");
    const workoutStreak = 7; // Placeholder, podría venir de un futuro hook

    const handleStartWorkout = () => {
        if (suggestion) {
            navigateTo('workoutLogger', { routineId: suggestion.routineId, dayId: suggestion.dayId });
        }
    };
    
    const handleDaySelection = (routineId: string, dayId: string) => {
        navigateTo('workoutLogger', { routineId, dayId });
        setIsDaySelectorOpen(false);
    };

    const handleViewRoutine = () => {
        if (suggestion) {
            selectDayForQuickView(suggestion.routineId, suggestion.dayId);
        }
    };

    const toolButtonStyles = "bg-violet-600 hover:bg-violet-500 text-white font-semibold py-2.5 px-5 rounded-lg transition-colors shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-violet-400 focus:ring-opacity-50 flex items-center gap-2 text-sm sm:text-base";
    const placeholderToolButtonStyles = "bg-slate-600 hover:bg-slate-500 text-slate-300 font-semibold py-2.5 px-5 rounded-lg transition-colors shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-opacity-50 flex items-center gap-2 cursor-not-allowed opacity-70 text-sm sm:text-base";

    return (
        <div className="space-y-6 sm:space-y-8 pb-8 sm:pb-12 text-white">
            <WelcomeSection
                currentUser={currentUser}
                quote={quote}
                dailyTip={dailyTip}
                workoutStreak={workoutStreak}
                weeklySummary={weeklySummary}
                onStartWorkout={handleStartWorkout}
                onChooseOtherWorkout={() => setIsDaySelectorOpen(true)}
                onViewRoutine={handleViewRoutine}
                onNavigate={navigateTo}
                isLoadingSuggestion={isLoadingSuggestion || isLoadingSummary}
                nextWorkoutSuggestion={suggestion}
                onOpenMealAnalyzer={() => setIsMealAnalyzerModalOpen(true)}
                onOpenRecipeGenerator={() => setIsRecipeGeneratorModalOpen(true)}
            />
            
            <div className="w-full max-w-md mx-auto">
                 <Stopwatch />
            </div>

            <div className="bg-zinc-900/90 dark:bg-zinc-950 border border-violet-800 rounded-xl shadow-xl p-6 transition-colors">
                <h1 className="text-violet-400 dark:text-violet-300 font-bold text-xl mb-2">Inicio</h1>
                <p className="text-zinc-300 dark:text-zinc-100">Bienvenido de nuevo, {currentUser.displayName}.</p>
                <p className="text-zinc-300 dark:text-zinc-100">{quote}</p>
                <p className="text-zinc-300 dark:text-zinc-100">{dailyTip}</p>
                <button className="mt-4 bg-violet-600 hover:bg-violet-700 text-white font-semibold py-2 px-4 rounded-lg shadow transition-colors">Comenzar</button>
            </div>
            
            {/* --- Modals --- */}
            <ModalV2 isOpen={isBmiModalOpen} onClose={() => setIsBmiModalOpen(false)}>
                <BMICalculator userId={currentUser.uid} />
            </ModalV2>

            <ModalV2 isOpen={isMealAnalyzerModalOpen} onClose={() => setIsMealAnalyzerModalOpen(false)}>
                <MealAnalyzer userId={currentUser.uid} onClose={() => setIsMealAnalyzerModalOpen(false)} showToast={showToast} />
            </ModalV2>

            <ModalV2 isOpen={isRecipeGeneratorModalOpen} onClose={() => setIsRecipeGeneratorModalOpen(false)}>
                <RecipeGenerator userId={currentUser.uid} onClose={() => setIsRecipeGeneratorModalOpen(false)} showToast={showToast} />
            </ModalV2>

            <SelectWorkoutDayModal
                isOpen={isDaySelectorOpen}
                onClose={() => setIsDaySelectorOpen(false)}
                onDaySelect={handleDaySelection}
                currentUserId={currentUser.uid}
                navigateTo={navigateTo}
            />

            {isQuickViewActive && (
                 <ModalV2 isOpen={isQuickViewActive} onClose={closeQuickView}>
                    <QuickDayCard 
                        routineName={selectedDayForQuickViewInfo?.routineName || ''}
                        dayName={selectedDayForQuickViewInfo?.dayName || ''}
                        dayDetails={quickViewDayDetails}
                        isLoading={isLoadingQuickView}
                        onClose={closeQuickView}
                    />
                 </ModalV2>
            )}
        </div>
    );
};

export default InicioView;