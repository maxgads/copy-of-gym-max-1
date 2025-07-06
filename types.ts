import { Timestamp } from 'firebase/firestore';

export interface Exercise {
  id: string; // Unique ID for the exercise (client-generated)
  exerciseName: string;
  sets: number | string; // Can be a number or a string like "3-4"
  reps: string; // e.g., "8-12", "15", "Al fallo"
  weightKg?: number | string; // Optional
  notes?: string; // Optional
}

export interface Day {
  id: string; // Unique ID for the day (client-generated)
  name: string; // e.g., "Día 1: Pecho y Tríceps", "Push A"
  order: number; // To maintain the order of the days
  exercises: Exercise[];
  warmUpExercises?: Exercise[]; // Optional: For warm-up exercises
}

export interface Routine {
  id: string; // Document ID from localStorage
  userId: string; 
  name: string; // Name of the routine
  description?: string; // Optional field for general notes, e.g., "Repeat for 3 months"
  days: Day[];
  createdAt: any; // ISO string date
  updatedAt: any; // ISO string date
}

// Represents the current view in the app
export type AppView = 
  | 'inicio' 
  | 'profile' 
  | 'tracker' // Assuming tracker might be a future view or legacy
  | 'aiAssistant'
  | 'routineDashboard' // New view for listing routines
  | 'routineForm'     // New view for creating/editing a routine
  | 'workoutLogger'  // New view for logging a workout session
  | 'recipeBook' // New view for the recipe book
  | 'seguimiento'; // New view for combined tracking (food, progress)

export type Theme = 'light' | 'dark';

export interface UserProfileData {
  height?: string; // in cm
  weight?: string; // in kg
  displayName?: string; // Optional display name
  calorieGoal?: number;
  theme?: Theme;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model'; // Aligned with Gemini API
  content: string;
  fileName?: string; // Optional: to indicate a file was processed
}

// ---- New types for Workout Logging ----
export interface PerformedSet {
  id:string;
  reps: string; // e.g., "10", "8", "AMRAP"
  weightKg: string; // e.g., "50", "BW" (Bodyweight)
  notes?: string;
}

export interface LoggedExercise {
  id: string; // Auto-generated ID for this logged instance
  exerciseId: string; // ID from the original Exercise in the Routine
  exerciseName: string; // Copied from Routine for easy display
  isWarmUp: boolean; // To distinguish between warm-up and main
  setsPerformed: PerformedSet[];
  exerciseNotes?: string; // Notes specific to this exercise during this session
}

export interface WorkoutSession {
  id: string; // Auto-generated ID
  userId: string;
  routineId: string;
  dayId: string;
  routineName: string; // Copied for convenience
  dayName: string; // Copied for convenience
  date: string; // ISO string when the session was performed/saved
  loggedExercises: LoggedExercise[];
  sessionNotes?: string; // General notes for the whole session
}
// ---- End of New types for Workout Logging ---

// ---- New types for Food Logging ----
export type MealType = 'Desayuno' | 'Almuerzo' | 'Cena' | 'Snack';

export interface FoodEntry {
  id: string; // Unique ID
  userId: string;
  date: Timestamp; // Firestore Timestamp
  foodName: string;
  quantity: string; // e.g., "100g", "1 apple"
  calories: number;
  macros: {
    protein: number; // in grams
    carbs: number;   // in grams
    fats: number;     // in grams
  };
  mealType: MealType;
}

export interface FoodFormData {
    name: string;
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
    meal: MealType;
}
// ---- End of New types for Food Logging ---

// ---- New type for Recipe Generation ----
export interface Recipe {
  recipeName: string;
  description: string;
  ingredients: string[];
  steps: string[];
  // Nutritional info is now part of the base Recipe
  calories: string; // e.g., "450-550 kcal"
  protein: string;  // e.g., "40g"
  carbs: string;    // e.g., "35g"
  fats: string;     // e.g., "20g"
  feedback?: string; // Optional feedback from meal analyzer
  disclaimer?: string; // Optional disclaimer from meal analyzer
}

// ---- New type for Saved Recipes in the book ----
export interface SavedRecipe extends Recipe {
  id: string;
  userId: string;
  createdAt: any; // ISO string date
}
// ---- End of New type for Recipe Generation ---