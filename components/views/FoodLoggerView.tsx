import React, { useState, useEffect, useMemo, useRef } from 'react';
import { User } from 'firebase/auth';
import * as nutritionService from '../../services/nutritionService';
import * as profileService from '../../services/profileService';
import { FoodEntry, MealType, AppView, FoodFormData, UserProfileData } from '../../types';
import LoadingSpinner from '../LoadingSpinner';
import ConfirmationModal from '../ConfirmationModal';
import FoodModal from '../FoodModal';
import ModalV2 from '../ModalV2';
import MealAnalyzer from '../MealAnalyzer';
import RecipeGenerator from '../RecipeGenerator';


// --- ÍCONOS ---
const PlusIcon = ({ className = 'w-6 h-6' }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>;
const FlameIcon = ({ className = 'w-6 h-6' }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" /></svg>;
const ZapIcon = ({ className = 'w-6 h-6' }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>;
const LeafIcon = ({ className = 'w-6 h-6' }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 20A7 7 0 0 1 4 13c0-3.9 3.1-7 7-7 2.2 0 4.2 1 5.5 2.6L18 6"></path><path d="M11 13a2 2 0 0 0-2-2c-1.1 0-2 .9-2 2s.9 2 2 2h4a2 2 0 0 0 2-2c0-1.1-.9-2-2-2h-1"></path></svg>;
const WheatIcon = ({ className = 'w-6 h-6' }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14l4 1 3-4 3 4 4-1L13 2zm4.5 14.5L19 22l-2-2-2 2-1.5-1.5L15 19l2-2 2 2zM9.5 14.5L11 16l-2 2-2-2-1.5 1.5L7 19l2 2-2 2z"/></svg>;
const SunIcon = ({ className = 'w-5 h-5' }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>;
const MoonIcon = ({ className = 'w-5 h-5' }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>;
const CoffeeIcon = ({ className = 'w-5 h-5' }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8h1a4 4 0 0 1 0 8h-1"></path><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"></path><line x1="6" y1="1" x2="6" y2="4"></line><line x1="10" y1="1" x2="10" y2="4"></line><line x1="14" y1="1" x2="14" y2="4"></line></svg>;
const TrashIcon = ({ className = 'w-4 h-4' }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>;
const EditIcon = ({ className = 'w-4 h-4' }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;
const CameraIcon = ({className = "w-4 h-4"}) => <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>;
const RecipeBookIcon = ({className = "w-4 h-4"}) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg>;
const SaveIcon = ({ className = 'w-4 h-4' }) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className}><path d="M7.5 2.5a.5.5 0 00-1 0v3.5a.5.5 0 001 0v-3.5z" /><path d="M3.5 3A1.5 1.5 0 002 4.5v11A1.5 1.5 0 003.5 17h13a1.5 1.5 0 001.5-1.5v-11A1.5 1.5 0 0016.5 3h-13zM10 14a1 1 0 11-2 0 1 1 0 012 0zm3-3a1 1 0 11-2 0 1 1 0 012 0zm3 3a1 1 0 11-2 0 1 1 0 012 0zm-6-4a.5.5 0 00-.5.5v1a.5.5 0 101 0v-1a.5.5 0 00-.5-.5z" /></svg>;

const mealIcons: Record<MealType, React.ReactNode> = {
    Desayuno: <CoffeeIcon className="w-5 h-5 text-yellow-500 dark:text-yellow-400" />,
    Almuerzo: <SunIcon className="w-5 h-5 text-orange-500 dark:text-orange-400" />,
    Cena: <MoonIcon className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />,
    Snack: <ZapIcon className="w-5 h-5 text-green-500 dark:text-green-400" />,
};

type EditableCalorieGoalProps = {
  userId: string;
  goal: number;
  onGoalUpdated: (msg: string) => void;
};
const EditableCalorieGoal: React.FC<EditableCalorieGoalProps> = ({ userId, goal, onGoalUpdated }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [newGoal, setNewGoal] = useState(goal);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setNewGoal(goal);
    }, [goal]);

    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [isEditing]);

    const handleSave = async () => {
        const numericGoal = Number(newGoal);
        if (!isNaN(numericGoal) && numericGoal > 0) {
            await profileService.saveUserProfileData(userId, { calorieGoal: numericGoal });
            onGoalUpdated('Objetivo de calorías actualizado.');
        }
        setIsEditing(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') handleSave();
        if (e.key === 'Escape') setIsEditing(false);
    };

    if (isEditing) {
        return (
            <div className="flex items-center gap-2">
                <input
                    ref={inputRef}
                    type="number"
                    value={newGoal}
                    onChange={(e) => setNewGoal(e.target.value)}
                    onBlur={handleSave}
                    onKeyDown={handleKeyDown}
                    className="w-24 text-right bg-zinc-700 border border-zinc-600 rounded-md p-1 text-sm font-bold text-white"
                />
                <button onClick={handleSave} className="text-green-400 hover:text-green-300"><SaveIcon className="w-5 h-5" /></button>
            </div>
        );
    }
    
    return (
         <button onClick={() => setIsEditing(true)} className="flex items-center gap-1.5 group">
            <span className="text-slate-500 dark:text-slate-400">{goal} kcal</span>
            <EditIcon className="w-3 h-3 text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity" />
        </button>
    );
}

type CalorieProgressBarProps = {
  current: number;
  goal: number;
  userId: string;
  onGoalUpdated: (msg: string) => void;
};
const CalorieProgressBar: React.FC<CalorieProgressBarProps> = ({ current, goal, userId, onGoalUpdated }) => {
    const [animatedPercentage, setAnimatedPercentage] = useState(0);

    useEffect(() => {
        const percentage = goal > 0 ? Math.min((current / goal) * 100, 100) : 0;
        const timer = setTimeout(() => setAnimatedPercentage(percentage), 100);
        return () => clearTimeout(timer);
    }, [current, goal]);
    
    return (
        <div className="mb-8">
            <div className="flex justify-between items-end mb-1">
                <span className="text-slate-300 font-medium">Progreso de Calorías</span>
                <span className={`text-sm font-bold ${current > goal ? 'text-red-400' : 'text-white'}`}>
                    {current.toFixed(0)} / <EditableCalorieGoal userId={userId} goal={goal} onGoalUpdated={onGoalUpdated}/>
                </span>
            </div>
            <div className="w-full bg-zinc-700 rounded-full h-2.5 overflow-hidden">
                <div 
                    className={`h-2.5 rounded-full transition-all duration-1000 ease-out ${current > goal ? 'bg-red-500' : 'bg-violet-500'}`} 
                    style={{ width: `${animatedPercentage}%` }}
                ></div>
            </div>
        </div>
    );
};


// --- COMPONENTES AUXILIARES MODERNIZADOS ---
type MacroSummaryProps = { macros: { calories: number; protein: number; carbs: number; fats: number } };
const MacroSummary: React.FC<MacroSummaryProps> = ({ macros }) => (
  <div className="flex flex-wrap gap-3 justify-between mb-6">
    <div className="flex-1 min-w-[120px] bg-zinc-900/80 rounded-xl p-4 flex flex-col items-center border-2 border-violet-700/40 shadow-sm">
      <FlameIcon className="w-6 h-6 text-orange-400 mb-1" />
      <span className="text-xs text-slate-400">Calorías</span>
      <span className="text-xl font-bold text-white">{macros.calories.toFixed(0)} <span className="text-xs font-normal text-slate-400">kcal</span></span>
    </div>
    <div className="flex-1 min-w-[120px] bg-zinc-900/80 rounded-xl p-4 flex flex-col items-center border-2 border-violet-700/40 shadow-sm">
      <ZapIcon className="w-6 h-6 text-violet-400 mb-1" />
      <span className="text-xs text-slate-400">Proteínas</span>
      <span className="text-xl font-bold text-white">{macros.protein.toFixed(1)} <span className="text-xs font-normal text-slate-400">g</span></span>
    </div>
    <div className="flex-1 min-w-[120px] bg-zinc-900/80 rounded-xl p-4 flex flex-col items-center border-2 border-violet-700/40 shadow-sm">
      <WheatIcon className="w-6 h-6 text-violet-400 mb-1" />
      <span className="text-xs text-slate-400">Carbohidratos</span>
      <span className="text-xl font-bold text-white">{macros.carbs.toFixed(1)} <span className="text-xs font-normal text-slate-400">g</span></span>
    </div>
    <div className="flex-1 min-w-[120px] bg-zinc-900/80 rounded-xl p-4 flex flex-col items-center border-2 border-violet-700/40 shadow-sm">
      <LeafIcon className="w-6 h-6 text-rose-400 mb-1" />
      <span className="text-xs text-slate-400">Grasas</span>
      <span className="text-xl font-bold text-white">{macros.fats.toFixed(1)} <span className="text-xs font-normal text-slate-400">g</span></span>
    </div>
  </div>
);

type FoodItemModernProps = { food: FoodEntry; onEdit: (food: FoodEntry) => void; onDelete: (food: FoodEntry) => void };
const FoodItemModern: React.FC<FoodItemModernProps> = React.memo(({ food, onEdit, onDelete }) => (
  <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-zinc-900/60 border-none md:border md:border-zinc-800 hover:md:border-violet-500 transition-colors group shadow-sm">
    <div className="flex items-center gap-3 min-w-0">
      {mealIcons[food.mealType as MealType]}
      <div className="min-w-0">
        <p className="font-semibold text-white truncate" title={food.foodName}>{food.foodName}</p>
        <p className="text-xs text-slate-500">{new Date(food.date.toDate()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
      </div>
    </div>
    <div className="flex items-center gap-2">
      <span className="font-bold text-violet-400 text-base">{food.calories}</span>
      <span className="text-xs text-slate-500">kcal</span>
      <button onClick={() => onEdit(food)} className="p-1 text-zinc-500 hover:text-violet-400 transition-colors"><EditIcon /></button>
      <button onClick={() => onDelete(food)} className="p-1 text-zinc-500 hover:text-red-500 transition-colors"><TrashIcon /></button>
    </div>
  </div>
));


interface FoodLoggerViewProps {
  currentUser: User | null;
  navigateTo: (view: AppView) => void;
  showToast: (message: string) => void;
}

const FoodLoggerView: React.FC<FoodLoggerViewProps> = ({ currentUser, showToast }) => {
  const [entries, setEntries] = useState<FoodEntry[]>([]);
  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [foodToEdit, setFoodToEdit] = useState<FoodEntry | null>(null);
  const [foodToDelete, setFoodToDelete] = useState<FoodEntry | null>(null);

  // AI Modal States
  const [isMealAnalyzerModalOpen, setIsMealAnalyzerModalOpen] = useState(false);
  const [isRecipeGeneratorModalOpen, setIsRecipeGeneratorModalOpen] = useState(false);

  // Fetch Profile
  useEffect(() => {
    if (!currentUser?.uid) return;
    const unsub = profileService.getUserProfileData(currentUser.uid, setProfile, (err) => console.error(err.message));
    return () => unsub();
  }, [currentUser?.uid]);

  // Fetch Food Entries
  useEffect(() => {
    if (!currentUser?.uid) {
      setIsLoading(false);
      return;
    };
    setIsLoading(true);
    const unsub = nutritionService.getDailyFoodEntriesListener(currentUser.uid, new Date(), setEntries, (err) => console.error(err.message));
    setIsLoading(false);
    return () => unsub();
  }, [currentUser?.uid]);

  const handleSaveFood = async (formData: FoodFormData, foodId?: string) => {
    if (!currentUser?.uid) return;
    if (foodId) {
        await nutritionService.updateFoodEntry(currentUser.uid, foodId, formData);
        showToast('Alimento actualizado.');
    } else {
        await nutritionService.addFoodEntry(currentUser.uid, formData);
        showToast('Alimento añadido.');
    }
  };
  
  const handleDeleteFood = async () => {
    if (!currentUser?.uid || !foodToDelete) return;
    await nutritionService.deleteFoodEntry(currentUser.uid, foodToDelete.id);
    showToast('Alimento eliminado.');
    setFoodToDelete(null);
  };
  
  const handleOpenModal = (food: FoodEntry | null = null) => {
    setFoodToEdit(food);
    setIsModalOpen(true);
  };

  const macros = useMemo(() => {
    return entries.reduce((acc, item) => {
        acc.calories += item.calories;
        acc.protein += item.macros.protein;
        acc.carbs += item.macros.carbs;
        acc.fats += item.macros.fats;
        return acc;
    }, { calories: 0, protein: 0, carbs: 0, fats: 0 });
  }, [entries]);

  const groupedFood = useMemo(() => {
    return entries.reduce((acc, food) => {
        const meal = food.mealType;
        if (!acc[meal]) acc[meal] = { foods: [], totalCalories: 0 };
        acc[meal].foods.push(food);
        acc[meal].totalCalories += food.calories;
        return acc;
    }, {} as Record<MealType, { foods: FoodEntry[], totalCalories: number }>);
  }, [entries]);
  
  const mealOrder: MealType[] = ['Desayuno', 'Almuerzo', 'Cena', 'Snack'];

  if (isLoading || !profile) {
    return <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>;
  }

  return (
    <>
      <FoodModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSaveFood} foodToEdit={foodToEdit} />
      <ConfirmationModal 
        isOpen={!!foodToDelete} 
        onClose={() => setFoodToDelete(null)} 
        onConfirm={handleDeleteFood} 
        title="Confirmar Eliminación"
        message={`¿Estás seguro de que quieres eliminar "${foodToDelete?.foodName || 'este alimento'}"? Esta acción no se puede deshacer.`}
      />
      {currentUser && (
        <>
          <ModalV2 isOpen={isMealAnalyzerModalOpen} onClose={() => setIsMealAnalyzerModalOpen(false)}>
            <MealAnalyzer userId={currentUser.uid} onClose={() => setIsMealAnalyzerModalOpen(false)} showToast={showToast} />
          </ModalV2>
          <ModalV2 isOpen={isRecipeGeneratorModalOpen} onClose={() => setIsRecipeGeneratorModalOpen(false)}>
            <RecipeGenerator userId={currentUser.uid} onClose={() => setIsRecipeGeneratorModalOpen(false)} showToast={showToast} />
          </ModalV2>
        </>
      )}

      <section className="max-w-2xl mx-auto w-full px-2 sm:px-0">
        <header className="mb-4 flex flex-col gap-1">
          <h2 className="text-2xl font-bold text-violet-300">Nutrición diaria</h2>
          <span className="text-slate-400 text-sm">Resumen y registro de tus alimentos</span>
        </header>
        <CalorieProgressBar current={macros.calories} goal={profile?.calorieGoal || 2000} userId={currentUser?.uid || ''} onGoalUpdated={showToast} />
        <MacroSummary macros={macros} />
        <div className="flex flex-col gap-2 mb-6">
          <button onClick={() => setIsMealAnalyzerModalOpen(true)} className="bg-teal-600 hover:bg-teal-500 text-white font-semibold py-2 rounded-xl flex items-center justify-center gap-2 shadow-sm transition-colors"><CameraIcon /> Analizar con IA</button>
          <button onClick={() => setIsRecipeGeneratorModalOpen(true)} className="bg-violet-600 hover:bg-violet-500 text-white font-semibold py-2 rounded-xl flex items-center justify-center gap-2 shadow-sm transition-colors"><RecipeBookIcon /> Generar Receta</button>
          <button onClick={() => handleOpenModal()} className="bg-violet-700 hover:bg-violet-600 text-white font-semibold py-2 rounded-xl flex items-center justify-center gap-2 shadow-sm transition-colors"><PlusIcon className="w-4 h-4" /> Añadir Manual</button>
        </div>
        {entries.length === 0 ? (
          <div className="text-center py-10 bg-zinc-900/40 rounded-xl">
            <p className="text-slate-400">No has registrado ningún alimento hoy.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {mealOrder.map(meal => {
              const data = groupedFood[meal];
              if (!data) return null;
              return (
                <section key={meal} className="">
                  <div className="flex justify-between items-center mb-1">
                    <h4 className="text-lg font-semibold text-violet-400 flex items-center gap-2">{mealIcons[meal]} {meal}</h4>
                    <span className="text-sm text-slate-400">{data.totalCalories} kcal</span>
                  </div>
                  <div className="flex flex-col gap-2">
                    {data.foods.map(food => <FoodItemModern key={food.id} food={food} onEdit={handleOpenModal} onDelete={setFoodToDelete} />)}
                  </div>
                </section>
              )
            })}
          </div>
        )}
      </section>
    </>
  );
};

export default FoodLoggerView;