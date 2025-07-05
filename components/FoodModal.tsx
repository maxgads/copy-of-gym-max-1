import React, { useState, useEffect } from 'react';
import { FoodEntry, FoodFormData, MealType } from '../types';
import LoadingSpinner from './LoadingSpinner';

interface FoodModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: FoodFormData, foodId?: string) => Promise<void>;
    foodToEdit: FoodEntry | null;
}

const FoodModal: React.FC<FoodModalProps> = ({ isOpen, onClose, onSave, foodToEdit }) => {
    const mealOrder: MealType[] = ['Desayuno', 'Almuerzo', 'Cena', 'Snack'];
    const initialFormState = {
        name: '', calories: '', protein: '', carbs: '', fats: '', meal: 'Almuerzo' as MealType,
    };

    const [formData, setFormData] = useState(initialFormState);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen) {
            if (foodToEdit) {
                setFormData({
                    name: foodToEdit.foodName,
                    calories: String(foodToEdit.calories),
                    protein: String(foodToEdit.macros.protein),
                    carbs: String(foodToEdit.macros.carbs),
                    fats: String(foodToEdit.macros.fats),
                    meal: foodToEdit.mealType,
                });
            } else {
                setFormData(initialFormState);
            }
            setIsSaving(false);
            setError('');
        }
    }, [foodToEdit, isOpen]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name.trim() || isSaving) return;
        
        setIsSaving(true);
        setError('');

        const foodData: FoodFormData = {
            name: formData.name.trim(),
            calories: parseInt(formData.calories, 10) || 0,
            protein: parseFloat(formData.protein) || 0,
            carbs: parseFloat(formData.carbs) || 0,
            fats: parseFloat(formData.fats) || 0,
            meal: formData.meal as MealType,
        };

        try {
            await onSave(foodData, foodToEdit?.id);
            onClose();
        } catch (e) {
            console.error("Failed to save food entry:", e);
            setError(e instanceof Error ? e.message : 'No se pudo guardar el registro.');
        } finally {
            // This will always run, ensuring the saving state is reset.
            setIsSaving(false);
        }
    };
    
    const inputBaseClasses = "w-full bg-zinc-800 border-none md:border md:border-zinc-700 rounded-xl py-3 px-4 text-sm text-slate-100 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 placeholder-zinc-400 transition-colors shadow-sm";

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4 animate-fade-in" onClick={onClose}>
            <div className="bg-zinc-950 border-none md:border md:border-zinc-800 rounded-3xl p-5 sm:p-8 w-full max-w-md relative animate-slide-up shadow-2xl" onClick={e => e.stopPropagation()}>
                <h2 className="text-2xl font-bold text-violet-300 mb-6 text-center tracking-tight drop-shadow">{foodToEdit ? 'Editar Alimento' : 'Añadir Alimento'}</h2>
                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label htmlFor="foodName" className="text-sm font-medium text-zinc-300 block mb-1">Nombre del Alimento</label>
                        <input type="text" name="name" id="foodName" value={formData.name} onChange={handleInputChange} required className={inputBaseClasses} placeholder="Ej: Pechuga de pollo" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="calories" className="text-sm font-medium text-zinc-300 block mb-1">Calorías</label>
                            <input type="number" step="any" name="calories" id="calories" value={formData.calories} onChange={handleInputChange} className={inputBaseClasses} placeholder="250" />
                        </div>
                        <div>
                             <label htmlFor="meal" className="text-sm font-medium text-zinc-300 block mb-1">Tipo de Comida</label>
                             <select name="meal" id="meal" value={formData.meal} onChange={handleInputChange} className={inputBaseClasses}>
                                {mealOrder.map(m => <option key={m} value={m}>{m}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                        <div><label htmlFor="protein" className="text-sm font-medium text-zinc-300 block mb-1">Proteína (g)</label><input type="number" step="any" name="protein" id="protein" value={formData.protein} onChange={handleInputChange} className={inputBaseClasses} placeholder="30" /></div>
                        <div><label htmlFor="carbs" className="text-sm font-medium text-zinc-300 block mb-1">Carbs (g)</label><input type="number" step="any" name="carbs" id="carbs" value={formData.carbs} onChange={handleInputChange} className={inputBaseClasses} placeholder="5" /></div>
                        <div><label htmlFor="fats" className="text-sm font-medium text-zinc-300 block mb-1">Grasa (g)</label><input type="number" step="any" name="fats" id="fats" value={formData.fats} onChange={handleInputChange} className={inputBaseClasses} placeholder="10" /></div>
                    </div>
                    {error && <p className="text-sm text-rose-400 text-center font-semibold animate-pulse">{error}</p>}
                    <div className="pt-4 flex flex-row justify-end gap-2 border-t-0 md:border-t md:border-zinc-800 mt-2">
                        <button type="button" onClick={onClose} className="flex items-center justify-center bg-zinc-700 hover:bg-zinc-600 text-zinc-100 font-semibold py-2 px-4 rounded-lg transition-colors shadow-sm min-w-[100px]">
                            Cancelar
                        </button>
                        <button type="submit" disabled={isSaving} className="flex items-center justify-center bg-violet-600 hover:bg-violet-500 text-white font-semibold py-2 px-5 rounded-lg transition-colors shadow-md disabled:opacity-60 disabled:cursor-not-allowed min-w-[100px]">
                            {isSaving ? <LoadingSpinner size="sm" /> : 'Guardar'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default FoodModal;