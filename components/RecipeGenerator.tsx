import React, { useState } from 'react';
import * as geminiService from '../services/geminiService';
import { Recipe, FoodFormData, MealType } from '../types';
import * as recipeBookService from '../services/recipeBookService';
import * as nutritionService from '../services/nutritionService';
import LoadingSpinner from './LoadingSpinner';

interface RecipeGeneratorProps {
    userId: string;
    onClose: () => void;
    showToast: (message: string) => void;
}

const RecipeGenerator: React.FC<RecipeGeneratorProps> = ({ userId, showToast }) => {
    const [goal, setGoal] = useState('perder peso');
    const [preferences, setPreferences] = useState('');
    const [recipe, setRecipe] = useState<Recipe | null>(null);
    const [generationProgress, setGenerationProgress] = useState<{ step: number, message: string } | null>(null);
    const [error, setError] = useState('');
    const [history, setHistory] = useState<string[]>([]); // Historial de nombres de recetas generadas

    const handleLogMeal = async () => {
        if (!recipe || !userId) return;
        try {
            const formData: FoodFormData = {
                name: recipe.recipeName,
                calories: parseFloat(recipe.calories) || 0,
                protein: parseFloat(recipe.protein) || 0,
                carbs: parseFloat(recipe.carbs) || 0,
                fats: parseFloat(recipe.fats) || 0,
                meal: 'Cena' as MealType,
            };
            await nutritionService.addFoodEntry(userId, formData);
            showToast('¡Comida registrada con éxito!');
        } catch (e) {
            setError("No se pudo registrar la comida.");
            showToast('Error al registrar la comida.');
        }
    };
    
    const handleSaveRecipe = async () => {
        if (!recipe || !userId) return;
        try {
            await recipeBookService.saveRecipe(userId, recipe);
            showToast('¡Receta guardada en tu recetario!');
        } catch(e) {
            setError('No se pudo guardar la receta.');
            showToast('Error al guardar la receta.');
        }
    };

    const handleGenerateRecipe = async () => {
        setRecipe(null);
        setError('');

        try {
            setGenerationProgress({ step: 1, message: 'Analizando petición...' });
            await new Promise(res => setTimeout(res, 700));

            setGenerationProgress({ step: 2, message: 'Buscando ingredientes...' });
            await new Promise(res => setTimeout(res, 1200));

            setGenerationProgress({ step: 3, message: 'Creando la receta...' });
            
            const generatedRecipe = await geminiService.generateRecipe(goal, preferences, history);
            if (generatedRecipe) {
                setRecipe(generatedRecipe);
                setHistory(prev => [generatedRecipe.recipeName, ...prev.slice(0, 4)]);
            } else {
                 throw new Error("La IA no devolvió una receta válida.");
            }
        } catch (err) {
            console.error("Error en el proceso de generación:", err);
            setError(err instanceof Error ? err.message : "Ocurrió un error. Inténtalo de nuevo.");
        } finally {
            setGenerationProgress(null);
        }
    };

    const AnalysisCard = ({ label, value, icon }: {label: string, value: string, icon: React.ReactNode}) => (<div className="bg-slate-700/50 p-3 rounded-lg text-center flex flex-col items-center justify-center"><div className="text-2xl mb-1">{icon}</div><div className="text-xs text-slate-400">{label}</div><div className="text-md font-bold text-white">{value}</div></div>);

    const commonInputStyles = "w-full px-4 py-2.5 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none transition-all duration-300 placeholder-slate-400 shadow-sm";

    return (
        <div className="space-y-6">
            <h3 className="text-2xl sm:text-3xl font-bold text-violet-400 text-center">Generador de Recetas</h3>
            <div className="p-4 sm:p-6 bg-slate-800/60 rounded-xl space-y-4 border border-slate-700">
                <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">Mi objetivo es:</label>
                    <select value={goal} onChange={(e) => setGoal(e.target.value)} className={commonInputStyles}>
                        <option value="perder peso">Perder peso</option>
                        <option value="ganar músculo">Ganar músculo</option>
                        <option value="mantener un estilo de vida saludable">Estilo de vida saludable</option>
                        <option value="cocina rápida">Algo rápido y fácil</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">Preferencias o alergias:</label>
                    <input type="text" value={preferences} onChange={(e) => setPreferences(e.target.value)} placeholder="vegano, sin gluten, barato, argentino..." className={commonInputStyles}/>
                    <p className="text-xs text-slate-500 mt-2">Nota: Las peticiones muy complejas pueden generar errores.</p>
                </div>
            </div>
            <button onClick={handleGenerateRecipe} disabled={!!generationProgress} className="w-full px-4 py-3 bg-violet-600 text-white font-bold rounded-lg hover:bg-violet-500 disabled:bg-slate-600 flex items-center justify-center transition-all duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-violet-400 focus:ring-opacity-50 shadow-lg hover:shadow-violet-500/40">
                {generationProgress ? (
                    <>
                        <LoadingSpinner size="sm" /> 
                        <span className="ml-2">[{generationProgress.step}/3] {generationProgress.message}</span>
                    </>
                ) : "🍳 Generar Receta"}
            </button>
            {error && <div className="mt-4 p-3 bg-red-900/50 text-red-300 rounded-lg text-sm border border-red-700/60">{error}</div>}
            
            {recipe && (
                <div className="mt-4 p-4 sm:p-6 bg-slate-800/80 rounded-xl text-left text-sm text-slate-200 animate-fade-in-scale border border-slate-700">
                    <h4 className="text-xl font-bold text-violet-300 mb-2">{recipe.recipeName}</h4>
                    <p className="italic text-slate-400 mb-4">{recipe.description}</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <h5 className="font-semibold mb-2 text-slate-300 border-b border-slate-700 pb-1">Ingredientes:</h5>
                            <ul className="list-disc list-inside space-y-1 pl-2">{(recipe.ingredients || []).map((ing, i) => <li key={i}>{ing}</li>)}</ul>
                        </div>
                        <div>
                            <h5 className="font-semibold mb-2 text-slate-300 border-b border-slate-700 pb-1">Pasos:</h5>
                            <ol className="list-decimal list-inside space-y-2 pl-2">{(recipe.steps || []).map((step, i) => <li key={i}>{step}</li>)}</ol>
                        </div>
                    </div>
                    <div className="mt-6">
                        <h5 className="font-semibold mb-2 text-slate-300 border-b border-slate-700 pb-1">Valores Nutricionales (Aprox. por porción)</h5>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
                            <AnalysisCard label="Calorías" value={recipe.calories || '?'} icon="🔥" />
                            <AnalysisCard label="Proteínas" value={recipe.protein || '?'} icon="💪" />
                            <AnalysisCard label="Carbs" value={recipe.carbs || '?'} icon="🍞" />
                            <AnalysisCard label="Grasas" value={recipe.fats || '?'} icon="🥑" />
                        </div>
                    </div>
                    <div className="pt-4 mt-4 border-t border-slate-700 flex flex-col sm:flex-row gap-3">
                        <button onClick={handleSaveRecipe} className="flex-1 w-full bg-violet-600 hover:bg-violet-500 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors shadow-md">Guardar en Recetario</button>
                        <button onClick={handleLogMeal} className="flex-1 w-full bg-green-600 hover:bg-green-500 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors shadow-md">Registrar Comida</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RecipeGenerator;