import React, { useState, useEffect, useCallback } from 'react';
import firebase from 'firebase/compat/app';
import { SavedRecipe, AppView, MealType, FoodFormData } from '../../types';
import * as recipeBookService from '../../services/recipeBookService';
import * as nutritionService from '../../services/nutritionService';
import LoadingSpinner from '../LoadingSpinner';
import ConfirmationModal from '../ConfirmationModal';

// Icons
const PlusIcon = ({ className }: { className?: string }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" /></svg>;
const TrashIcon = ({ className }: { className?: string }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>;
const ChevronDownIcon = ({ className }: { className?: string }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>;
const BookIcon = ({ className }: { className?: string }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20v2H6.5a2.5 2.5 0 0 1 0-5H20V4H6.5A2.5 2.5 0 0 0 4 6.5v13z" /></svg>;

interface RecipeBookViewProps {
  currentUser: firebase.User;
  navigateTo: (view: AppView) => void;
}

const RecipeBookView: React.FC<RecipeBookViewProps> = ({ currentUser, navigateTo }) => {
  const [recipes, setRecipes] = useState<SavedRecipe[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ id: string, text: string } | null>(null);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [recipeToDelete, setRecipeToDelete] = useState<string | null>(null);
  const [expandedRecipeId, setExpandedRecipeId] = useState<string | null>(null);

  const fetchRecipes = useCallback(async () => {
    if (!currentUser?.uid) return;
    setIsLoading(true);
    try {
      const savedRecipes = await recipeBookService.getSavedRecipes(currentUser.uid);
      setRecipes(savedRecipes);
    } catch (err) {
      setError("Error al cargar el recetario.");
    } finally {
      setIsLoading(false);
    }
  }, [currentUser.uid]);

  useEffect(() => {
    fetchRecipes();
  }, [fetchRecipes]);
  
  const showTemporaryMessage = (recipeId: string, message: string) => {
    setStatusMessage({ id: recipeId, text: message });
    setTimeout(() => setStatusMessage(null), 3000);
  };
  
  const handleLogMeal = async (recipe: SavedRecipe) => {
    try {
        const formData: FoodFormData = {
            name: recipe.recipeName,
            calories: parseFloat(recipe.calories) || 0,
            protein: parseFloat(recipe.protein) || 0,
            carbs: parseFloat(recipe.carbs) || 0,
            fats: parseFloat(recipe.fats) || 0,
            meal: 'Snack' as MealType,
        };
        await nutritionService.addFoodEntry(currentUser.uid, formData);
        showTemporaryMessage(recipe.id, '¡Comida registrada!');
    } catch(e) {
        showTemporaryMessage(recipe.id, 'Error al registrar.');
    }
  };
  
  const openDeleteConfirmation = (e: React.MouseEvent, recipeId: string) => {
    e.stopPropagation();
    setRecipeToDelete(recipeId);
    setConfirmModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!currentUser?.uid || !recipeToDelete) return;
    await recipeBookService.deleteSavedRecipe(currentUser.uid, recipeToDelete);
    fetchRecipes();
  };

  const cardButtonStyles = "font-medium py-2 px-4 rounded-lg text-xs transition-all duration-200 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-opacity-60 shadow-md hover:shadow-lg flex items-center justify-center gap-1.5";
  const AnalysisCard = ({ label, value, icon }: {label: string, value: string, icon: React.ReactNode}) => (<div className="bg-slate-700/50 p-3 rounded-lg text-center flex flex-col items-center justify-center"><div className="text-2xl mb-1">{icon}</div><div className="text-xs text-slate-400">{label}</div><div className="text-md font-bold text-white">{value || '?'}</div></div>);

  return (
    <div className="space-y-10">
      <ConfirmationModal
        isOpen={confirmModalOpen}
        onClose={() => setConfirmModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Confirmar Eliminación"
        message="¿Estás seguro de que quieres eliminar esta receta de tu recetario?"
        confirmText="Sí, Eliminar"
      />

      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-violet-400 tracking-tight">
          Mi Recetario
        </h1>
        <button
          onClick={() => navigateTo('aiAssistant')}
          className="bg-gradient-to-r from-violet-500 to-indigo-600 hover:from-violet-600 hover:to-indigo-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-violet-400 focus:ring-opacity-50 shadow-lg hover:shadow-violet-500/40 flex items-center justify-center gap-2 text-sm sm:text-base"
        >
          <PlusIcon className="w-5 h-5" />
          Añadir Receta con IA
        </button>
      </div>

      {error && <p className="text-sm text-rose-300 bg-rose-800/50 p-3.5 rounded-lg border border-rose-700/70 text-center" role="alert">{error}</p>}

      {isLoading ? (
        <div className="text-center py-10"><LoadingSpinner size="lg" /></div>
      ) : recipes.length === 0 ? (
        <div className="text-center py-16 bg-slate-800/70 rounded-xl border border-dashed border-slate-700 p-8 shadow-lg">
          <BookIcon className="mx-auto h-20 w-20 text-slate-500 mb-6" />
          <p className="text-slate-300 text-xl font-semibold">Tu recetario está vacío.</p>
          <p className="text-slate-400 text-md mt-1">Usa el Asistente IA para generar y guardar nuevas recetas.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {recipes.map((recipe) => {
            const isExpanded = expandedRecipeId === recipe.id;
            return (
              <div key={recipe.id} className="bg-zinc-900/90 dark:bg-zinc-950 border border-zinc-700 rounded-xl shadow-xl transition-all duration-300 hover:shadow-violet-500/20 hover:border-violet-600/40">
                <button
                  onClick={() => setExpandedRecipeId(isExpanded ? null : recipe.id)}
                  className="w-full flex justify-between items-center text-left p-5 hover:bg-slate-700/50 rounded-t-xl transition-colors"
                  aria-expanded={isExpanded}
                >
                    <h2 className="text-2xl font-bold text-violet-400 dark:text-violet-300 break-words flex-1 min-w-0" title={recipe.recipeName}>{recipe.recipeName}</h2>
                    <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                        <button
                            onClick={(e) => openDeleteConfirmation(e, recipe.id)}
                            className={`${cardButtonStyles} bg-rose-600 hover:bg-rose-500 text-white focus:ring-rose-400`}
                            aria-label={`Eliminar receta ${recipe.recipeName}`}
                        >
                            <TrashIcon className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Eliminar</span>
                        </button>
                        <ChevronDownIcon className={`w-6 h-6 text-slate-400 transform transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                    </div>
                </button>
                
                {isExpanded && (
                  <div className="px-5 pb-5 animate-fade-in space-y-4">
                     <p className="text-sm text-slate-400 italic bg-slate-700/30 p-3 rounded-md">{recipe.description}</p>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <h5 className="font-semibold mb-2 text-slate-300 border-b border-slate-700 pb-1">Ingredientes:</h5>
                            <ul className="list-disc list-inside space-y-1 pl-2 text-sm">{(recipe.ingredients || []).map((ing, i) => <li key={i}>{ing}</li>)}</ul>
                        </div>
                        <div>
                            <h5 className="font-semibold mb-2 text-slate-300 border-b border-slate-700 pb-1">Pasos:</h5>
                            <ol className="list-decimal list-inside space-y-2 pl-2 text-sm">{(recipe.steps || []).map((step, i) => <li key={i}>{step}</li>)}</ol>
                        </div>
                    </div>
                    <div>
                        <h5 className="font-semibold mb-2 text-slate-300 border-b border-slate-700 pb-1">Valores Nutricionales (Aprox.)</h5>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
                            <AnalysisCard label="Calorías" value={recipe.calories} icon="🔥" />
                            <AnalysisCard label="Proteínas" value={recipe.protein} icon="💪" />
                            <AnalysisCard label="Carbs" value={recipe.carbs} icon="🍞" />
                            <AnalysisCard label="Grasas" value={recipe.fats} icon="🥑" />
                        </div>
                    </div>
                    <div className="pt-4 border-t border-slate-700">
                        {statusMessage && statusMessage.id === recipe.id ? (
                            <p className="text-center text-sm text-green-300">{statusMessage.text}</p>
                        ) : (
                            <button onClick={() => handleLogMeal(recipe)} className="w-full bg-green-600 hover:bg-green-500 text-white font-semibold py-2 px-4 rounded-lg transition-colors">
                                Registrar Comida
                            </button>
                        )}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  );
};

export default RecipeBookView;