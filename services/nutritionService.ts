import { db } from './firebaseService';
import { FoodEntry, FoodFormData, MealType } from '../types';
import {
  collection,
  doc,
  query,
  where,
  orderBy,
  onSnapshot,
  setDoc,
  Timestamp,
  FirestoreError
} from 'firebase/firestore';

const getFoodLogCollection = (userId: string) => collection(db, 'users', userId, 'foodLog');

export const getDailyFoodEntriesListener = (
    userId: string,
    date: Date,
    callback: (entries: FoodEntry[]) => void,
    onError: (error: Error) => void
): (() => void) => {
    if (!userId) {
        onError(new Error("User ID is required."));
        return () => {};
    }

    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const q = query(
      getFoodLogCollection(userId),
      where('date', '>=', Timestamp.fromDate(startOfDay)),
      where('date', '<=', Timestamp.fromDate(endOfDay)),
      orderBy('date', 'desc')
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const entries: FoodEntry[] = [];
        querySnapshot.forEach((doc) => {
            entries.push({ id: doc.id, ...doc.data() } as FoodEntry);
        });
        callback(entries);
    }, (error: FirestoreError) => {
        console.error("Error fetching food log:", error);
        onError(error);
    });

    return unsubscribe;
};


export const addFoodEntry = async (
  userId: string,
  entryData: FoodFormData
): Promise<FoodEntry | null> => {
    if (!userId) {
        console.error("User ID is required to add a food entry.");
        return null;
    }

    const foodLogCol = getFoodLogCollection(userId);
    const newEntryForDb = {
      date: Timestamp.now(),
      foodName: entryData.name,
      quantity: '1 porción',
      calories: entryData.calories,
      macros: {
        protein: entryData.protein,
        carbs: 0,
        fats: 0,
      },
      mealType: 'Desayuno', // Default, update as needed
      userId,
    };
    // Aquí deberías usar addDoc(foodLogCol, newEntryForDb) si quieres generar un ID automáticamente
    // await addDoc(foodLogCol, newEntryForDb);
    // O usa setDoc si tienes un ID específico
    return null; // Implementa según tu lógica
};


export const updateFoodEntry = async (userId: string, entryId: string, entryData: FoodFormData): Promise<boolean> => {
    if (!userId || !entryId) return false;

    const entryToUpdate = {
      foodName: entryData.name,
      calories: entryData.calories,
      macros: {
        protein: entryData.protein,
        carbs: entryData.carbs,
        fats: entryData.fats,
      },
      mealType: entryData.meal,
      // We don't update date or quantity on edit, assume they stay the same
    };

    try {
        await getFoodLogCollection(userId).doc(entryId).update(entryToUpdate);
        return true;
    } catch (error) {
        console.error("Error updating food entry:", error);
        return false;
    }
};


export const deleteFoodEntry = async (userId: string, entryId: string): Promise<boolean> => {
    if (!userId || !entryId) return false;

    try {
        await getFoodLogCollection(userId).doc(entryId).delete();
        return true;
    } catch (error) {
        console.error("Error deleting food entry:", error);
        return false;
    }
};

export const getWeeklyChartData = async (userId: string): Promise<{date: string, calories: number}[]> => {
    const today = new Date();
    const result: {date: string, calories: number}[] = [];

    for (let i = 6; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        result.push({
            date: d.toLocaleDateString('es-ES', { weekday: 'short' }).replace('.', ''),
            calories: 0
        });
    }

    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const q = getFoodLogCollection(userId)
        .where('date', '>=', firebase.firestore.Timestamp.fromDate(sevenDaysAgo));
    
    const querySnapshot = await q.get();

    querySnapshot.forEach(doc => {
        const food = doc.data() as FoodEntry;
        const foodDateStr = food.date.toDate().toLocaleDateString('es-ES', { weekday: 'short' }).replace('.', '');
        const day = result.find(d => d.date === foodDateStr);
        if (day) {
            day.calories += food.calories;
        }
    });

    return result;
};