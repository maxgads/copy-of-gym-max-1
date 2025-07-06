import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import * as profileService from '../../services/profileService';
import { UserProfileData, Theme } from '../../types';
import LoadingSpinner from '../LoadingSpinner'; 
import { useTheme } from '../ThemeContext';

const SunIcon = ({ className = 'w-5 h-5' }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>;
const MoonIcon = ({ className = 'w-5 h-5' }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>;

interface UserProfileViewProps {
  currentUser: User;
  handleSignOut: () => Promise<void>;
  onClose?: () => void;
  onProfileUpdated?: () => void;
}

const UserProfileView: React.FC<UserProfileViewProps> = ({ currentUser, handleSignOut, onProfileUpdated }) => {
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [profileData, setProfileData] = useState<UserProfileData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [profileMessage, setProfileMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const { theme, setTheme } = useTheme();
  
  useEffect(() => {
    if (!currentUser?.uid) return;
    
    setIsLoading(true);
    const unsubscribe = profileService.getUserProfileData(
        currentUser.uid,
        (profile) => {
            setProfileData({
              ...profile,
              displayName: profile.displayName || currentUser.displayName || ''
            });
            setIsLoading(false);
        },
        (error) => {
            console.error(error);
            setProfileMessage({type: 'error', text: "No se pudo cargar el perfil."});
            setIsLoading(false);
        }
    );
    return () => unsubscribe();
  }, [currentUser.uid, currentUser.displayName]);

  const onSignOutClick = async () => {
    setIsSigningOut(true);
    await handleSignOut();
  };

  const handleFieldChange = (field: keyof UserProfileData, value: string | number | Theme) => {
    setProfileData(prev => prev ? { ...prev, [field]: value } : null);
  };
  
  const handleSaveProfile = async () => {
    if (!profileData) return;

    setIsSaving(true);
    setProfileMessage(null);

    // Update Firebase Auth display name if changed
    if (currentUser.displayName !== profileData.displayName) {
      try {
        await currentUser.updateProfile({ displayName: profileData.displayName });
      } catch (error) {
         console.error("Error updating Firebase Auth display name:", error);
         setProfileMessage({ type: 'error', text: 'El nombre no pudo actualizarse en la autenticación.' });
      }
    }

    // Save all data to Firestore
    try {
      const success = await profileService.saveUserProfileData(currentUser.uid, profileData);
      if (success) {
        setProfileMessage({ type: 'success', text: '¡Perfil guardado con éxito!' });
        onProfileUpdated?.();
      } else {
        throw new Error("Firestore save operation failed.");
      }
    } catch (error) {
      console.error("Error saving profile data:", error);
      setProfileMessage({ type: 'error', text: 'Error al guardar el perfil.' });
    } finally {
      setIsSaving(false);
      setTimeout(() => setProfileMessage(null), 3500);
    }
  };

  const inputBaseClasses = "w-full px-4 py-3 bg-slate-700/70 border border-slate-600 rounded-lg text-slate-100 focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none transition-all duration-300 placeholder-slate-400 shadow-sm";
  const labelBaseClasses = "block text-sm font-medium text-slate-300 mb-1.5 ml-1";

  if (isLoading) {
    return <div className="flex justify-center my-8 min-h-[400px] items-center"><LoadingSpinner /></div>
  }

  return (
    <div className="bg-zinc-900/80 dark:bg-zinc-950 rounded-xl shadow-2xl p-6 border border-zinc-700 flex flex-col items-center">
      <h1 className="text-3xl sm:text-4xl font-bold text-violet-400 mb-10 text-center">Tu Perfil</h1>
      
      <div className="flex flex-col items-center mb-10">
        <div className="w-32 h-32 rounded-full mb-5 border-4 border-zinc-700 object-cover shadow-xl bg-zinc-900 dark:bg-zinc-950" />
        <h2 className="text-2xl font-semibold text-zinc-100 dark:text-zinc-900">{profileData?.displayName || currentUser.email}</h2>
        <p className="text-sm text-zinc-400 dark:text-zinc-600">{currentUser.email}</p>
      </div>

      <div className="space-y-6">
          <div>
            <label htmlFor="profileDisplayName" className={labelBaseClasses}>Nombre de Usuario</label>
            <input id="profileDisplayName" type="text" value={profileData?.displayName || ''} onChange={(e) => handleFieldChange('displayName', e.target.value)} placeholder="Tu nombre para mostrar" className={inputBaseClasses} disabled={isSaving}/>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label htmlFor="profileHeight" className={labelBaseClasses}>Altura (cm)</label>
              <input id="profileHeight" type="number" value={profileData?.height || ''} onChange={(e) => handleFieldChange('height', e.target.value)} placeholder="Ej: 175" className={inputBaseClasses} disabled={isSaving}/>
            </div>
            <div>
              <label htmlFor="profileWeight" className={labelBaseClasses}>Peso (kg)</label>
              <input id="profileWeight" type="number" value={profileData?.weight || ''} onChange={(e) => handleFieldChange('weight', e.target.value)} placeholder="Ej: 70" className={inputBaseClasses} disabled={isSaving}/>
            </div>
          </div>
          
          <div>
            <label className={labelBaseClasses}>Tema de la Aplicación</label>
            <div className="flex gap-2 rounded-lg bg-slate-700/50 p-1.5">
                <button
                  onClick={() => { setTheme('light'); handleFieldChange('theme', 'light'); }}
                  className={`w-full p-2 rounded-md font-semibold transition-colors flex items-center justify-center gap-2 text-sm ${theme === 'light' ? 'bg-violet-50 shadow text-violet-700' : 'text-slate-400 hover:bg-zinc-700'}`}
                >
                  <SunIcon/> Claro
                </button>
                <button
                  onClick={() => { setTheme('dark'); handleFieldChange('theme', 'dark'); }}
                  className={`w-full p-2 rounded-md font-semibold transition-colors flex items-center justify-center gap-2 text-sm ${theme === 'dark' ? 'bg-zinc-900 shadow text-violet-400' : 'text-slate-400 hover:bg-zinc-700'}`}
                >
                  <MoonIcon/> Oscuro
                </button>
            </div>
          </div>
          
          {profileMessage && (
            <p className={`text-sm p-3 rounded-lg text-center ${ profileMessage.type === 'success' ? 'bg-green-800/50 text-green-300 border border-green-700/60' : 'bg-rose-800/50 text-rose-300 border border-rose-700/60'}`}>
              {profileMessage.text}
            </p>
          )}

          <div className="pt-2">
            <button onClick={handleSaveProfile} disabled={isSaving} className="w-full flex justify-center items-center bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-teal-400 focus:ring-opacity-50 disabled:opacity-60 disabled:cursor-not-allowed shadow-lg hover:shadow-teal-500/40">
              {isSaving ? <LoadingSpinner size="sm" /> : 'Guardar Cambios de Perfil'}
            </button>
          </div>
      </div>
      
      <div className="mt-12 pt-8 border-t border-slate-700">
        <button onClick={onSignOutClick} disabled={isSigningOut} className="w-full bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-rose-500 focus:ring-opacity-50 disabled:opacity-60 disabled:transform-none shadow-lg hover:shadow-rose-600/40">
          {isSigningOut ? <LoadingSpinner size="sm"/> : 'Cerrar Sesión'}
        </button>
      </div>
    </div>
  );
};

export default UserProfileView;