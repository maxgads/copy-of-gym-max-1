import { SavedRecipe, Recipe } from '../types';
import { generateId } from './routineService';

const getRecipeBookStorageKey = (userId: string) => `gymMaxRecipeBook_${userId}`;

const getAllSavedRecipes = (userId: string): SavedRecipe[] => {
    if (!userId) return [];
    try {
        const recipesJson = localStorage.getItem(getRecipeBookStorageKey(userId));
        const recipes = recipesJson ? JSON.parse(recipesJson) : [];
        return Array.isArray(recipes) ? recipes : [];
    } catch (error) {
        console.error("Error reading saved recipes from localStorage:", error);
        localStorage.removeItem(getRecipeBookStorageKey(userId));
        return [];
    }
};

const saveAllSavedRecipes = (userId: string, recipes: SavedRecipe[]) => {
    if (!userId) return;
    try {
        localStorage.setItem(getRecipeBookStorageKey(userId), JSON.stringify(recipes));
    } catch (error) {
        console.error("Error saving recipes to localStorage:", error);
    }
};

export const getSavedRecipes = async (userId: string): Promise<SavedRecipe[]> => {
    return Promise.resolve(getAllSavedRecipes(userId).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
};

export const saveRecipe = async (userId: string, recipeData: Recipe): Promise<SavedRecipe> => {
    const allRecipes = getAllSavedRecipes(userId);
    const timestamp = new Date().toISOString();
    
    // Check if a recipe with the same name already exists
    const existingRecipeIndex = allRecipes.findIndex(r => r.recipeName.toLowerCase() === recipeData.recipeName.toLowerCase());
    if (existingRecipeIndex > -1) {
        // Optional: you could update the existing one, or just return it, or throw an error.
        // For simplicity, we'll just return the existing one.
        console.log("Recipe with this name already exists.");
        return allRecipes[existingRecipeIndex];
    }
    
    const newSavedRecipe: SavedRecipe = {
        ...recipeData,
        id: generateId(),
        userId,
        createdAt: timestamp,
    };

    allRecipes.unshift(newSavedRecipe); // Add to the beginning
    saveAllSavedRecipes(userId, allRecipes);
    return Promise.resolve(newSavedRecipe);
};

export const deleteSavedRecipe = async (userId: string, recipeId: string): Promise<boolean> => {
  if (!userId || !recipeId) return Promise.resolve(false);

  let allRecipes = getAllSavedRecipes(userId);
  const filteredRecipes = allRecipes.filter(r => r.id !== recipeId);

  if (allRecipes.length === filteredRecipes.length) {
    return Promise.resolve(false); // Nothing was deleted
  }

  saveAllSavedRecipes(userId, filteredRecipes);
  return Promise.resolve(true);
};