import { db } from './firebaseService';
import { UserProfileData } from '../types';
import { auth } from './firebaseService';
import {
  doc,
  setDoc,
  onSnapshot,
  FirestoreError
} from 'firebase/firestore';

const DEFAULT_PROFILE: UserProfileData = {
  calorieGoal: 2000,
  theme: 'dark',
  height: '',
  weight: '',
  displayName: '',
};

export const getUserProfileData = (
    userId: string,
    callback: (profile: UserProfileData) => void,
    onError: (error: Error) => void
): (() => void) => {
    if (!userId) {
        onError(new Error("User ID is required."));
        return () => {};
    }

    const userDocRef = doc(db, 'users', userId);

    const unsubscribe = onSnapshot(userDocRef, async (docSnap) => {
        if (docSnap.exists()) {
            callback({ ...DEFAULT_PROFILE, ...docSnap.data() });
        } else {
            // Profile doesn't exist, create a default one
            try {
                const defaultData = {
                    ...DEFAULT_PROFILE,
                    displayName: auth.currentUser?.displayName || `Usuario_${userId.substring(0, 5)}`,
                };
                await setDoc(userDocRef, defaultData);
                callback(defaultData);
            } catch (error) {
                 onError(error instanceof Error ? error : new Error("Failed to create default profile"));
            }
        }
    }, (error: FirestoreError) => {
        console.error("Error fetching user profile:", error);
        onError(error);
    });

    return unsubscribe;
};

export const saveUserProfileData = async (userId: string, data: Partial<UserProfileData>): Promise<boolean> => {
  if (!userId) return false;
  
  const userDocRef = doc(db, 'users', userId);
  
  try {
    // Using merge: true will create the doc if it doesn't exist, or update it if it does.
    await setDoc(userDocRef, data, { merge: true });
    return true;
  } catch (error) {
    console.error("Error saving user profile data to Firestore:", error);
    return false;
  }
};
