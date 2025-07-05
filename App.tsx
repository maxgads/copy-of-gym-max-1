import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import LoadingSpinner from './components/LoadingSpinner';
import AuthForm from './components/AuthForm';
import Modal from './components/Modal';
import UserProfileView from './components/views/UserProfileView';
import InicioView from './components/views/InicioView';
import RoutineDashboardView from './components/views/RoutineDashboardView';
import RoutineFormView from './components/views/RoutineFormView';
import SeguimientoView from './components/views/SeguimientoView';
import RecipeBookView from './components/views/RecipeBookView';
import WorkoutLoggerView from './components/views/WorkoutLoggerView';
import { AIAssistantView } from './components/views/AIAssistantView';
import DumbbellIcon from './components/Icons/DumbbellIcon';
import CloseIcon from './components/Icons/CloseIcon';
import MenuIcon from './components/Icons/MenuIcon';
import { getUserProfileData } from './services/profileService';
import { auth } from './services/firebaseService';
import type { AppView } from './types';
import type { User } from 'firebase/auth';
import { ThemeProvider } from './components/ThemeContext';
import NewRoutineCreator from './components/NewRoutineCreator';
import { db } from './services/firebaseService';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  // Removed unused userProfile state
  const [isLoadingAuth, setIsLoadingAuth] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<AppView>('inicio');
  const [editingRoutineId, setEditingRoutineId] = useState<string | null>(null);
  const [loggingRoutineId, setLoggingRoutineId] = useState<string | null>(null);
  const [loggingDayId, setLoggingDayId] = useState<string | null>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState<boolean>(false);
  const [initialAuthLoadComplete, setInitialAuthLoadComplete] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [showRoutineCreator, setShowRoutineCreator] = useState(false);

  const currentUserRef = useRef(currentUser);

  // Debug log to help diagnose blank/black screen
  console.log({
    initialAuthLoadComplete,
    isLoadingAuth,
    currentUser,
    authError
  });

  // --- Profile & Theme Management ---
  useEffect(() => {
    if (currentUser?.uid) {
        const unsubscribe = getUserProfileData(
            currentUser.uid,
            (profile: any) => {
                const root = window.document.documentElement;
                if (profile.theme === 'light') {
                    root.classList.remove('dark');
                } else {
                    root.classList.add('dark');
                }
            },
            (error: any) => console.error("Failed to get profile:", error)
        );
        return () => unsubscribe();
    } else {
        window.document.documentElement.classList.add('dark'); // Default to dark if no user
    }
  }, [currentUser]);

  useEffect(() => {
    if (!auth) {
      console.error("Firebase auth not initialized!");
      setIsLoadingAuth(false);
      toast.error("La aplicación Firebase no está inicializada. Revisa tu configuración.");
      setInitialAuthLoadComplete(true);
      return;
    }

    const unsubscribe = auth.onAuthStateChanged(
      (user) => {
        const previousUser = currentUserRef.current;
        setCurrentUser(user); 
        currentUserRef.current = user;

        if (user) {
          const wasPreviouslyLoggedOut = !previousUser;
          if (wasPreviouslyLoggedOut && initialAuthLoadComplete) {
            setCurrentView('inicio');
          } else if (!initialAuthLoadComplete) {
            setCurrentView('inicio');
          }
        } else {
          // User logged out
          setCurrentView('inicio');
          setEditingRoutineId(null);
          setLoggingRoutineId(null);
          setLoggingDayId(null);
        }
        
        setIsLoadingAuth(false);
        setAuthError(null);
        if (!initialAuthLoadComplete) setInitialAuthLoadComplete(true);
      },
      (error) => {
        console.error("Error en cambio de estado de autenticación:", error);
        toast.error("Error al monitorear el estado de autenticación.");
        setCurrentUser(null);
        currentUserRef.current = null;
        setCurrentView('inicio');
        setIsLoadingAuth(false);
        if (!initialAuthLoadComplete) setInitialAuthLoadComplete(true);
      }
    );
    return () => unsubscribe();
  }, [initialAuthLoadComplete]);
  

  const handleSignOut = useCallback(async () => {
    setIsLoadingAuth(true);
    try {
      await auth.signOut();
      setIsProfileModalOpen(false);
      setIsMobileMenuOpen(false); 
      toast.success("Sesión cerrada con éxito.");
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
      toast.error("Error al cerrar sesión.");
    }
  }, []);

  const navigateTo = (view: AppView, params?: { routineId?: string | null; dayId?: string | null }) => {
    setIsMobileMenuOpen(false);
    
    if (view === 'profile') {
      setIsProfileModalOpen(true);
    } else {
      setIsProfileModalOpen(false);
      setCurrentView(view);

      if (view === 'routineForm' ) setEditingRoutineId(params?.routineId || null);
      else if (view === 'workoutLogger') {
        setLoggingRoutineId(params?.routineId || null);
        setLoggingDayId(params?.dayId || null);
      }
    }
  };
  
  const handleProfileUpdate = () => {
    if (auth.currentUser) {
        setCurrentUser(auth.currentUser); 
        toast.success("Perfil actualizado con éxito.");
    }
  };
  
  const showToast = (message: string) => toast.success(message);

  if (!initialAuthLoadComplete && isLoadingAuth) {
    return <div className="flex items-center justify-center min-h-screen">Cargando...</div>;
  }

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <AuthForm
          setAuthErrorExt={setAuthError}
          authErrorExt={authError}
          setIsLoadingAuthExt={setIsLoadingAuth}
        />
      </div>
    );
  }

  const navItems: { view: AppView; label: string }[] = [
    { view: 'inicio', label: 'Inicio' },
    { view: 'routineDashboard', label: 'Rutinas' },
    { view: 'seguimiento', label: 'Seguimiento' },
    { view: 'recipeBook', label: 'Recetario' },
    { view: 'aiAssistant', label: 'Asistente IA' },
    { view: 'profile', label: 'Perfil' },
  ];

  const getNavButtonClass = (itemView: AppView, isMobile: boolean = false) => {
    let isActive = false;
    if (itemView === 'profile') isActive = isProfileModalOpen;
    else if (itemView === 'routineDashboard' && (currentView === 'routineDashboard' || currentView === 'routineForm' || currentView === 'workoutLogger')) isActive = true;
    else isActive = currentView === itemView && !isProfileModalOpen;
    
    if (isMobile) {
        return `block w-full text-left px-4 py-3 text-base rounded-md
        ${isActive ? 'bg-violet-600 text-white font-semibold' : 'text-slate-200 hover:bg-zinc-700 hover:text-white'}`;
    }

    return `px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ease-in-out
      ${isActive ? 'bg-violet-600 text-white shadow-lg transform scale-105' : 'text-slate-300 hover:bg-zinc-700 hover:text-white hover:shadow-md'}`;
  };


  return (
    <ThemeProvider>
    <div className="min-h-screen flex flex-col bg-zinc-900 text-slate-100 selection:bg-violet-500 selection:text-white">
       <Toaster />
      <header className="bg-zinc-900/80 backdrop-blur-md shadow-xl sticky top-0 z-50 border-b border-zinc-700/50">
        <nav className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-2 cursor-pointer group" onClick={() => navigateTo('inicio')}>
              <DumbbellIcon className="h-8 w-8 text-violet-400 group-hover:text-violet-300 transition-colors" />
              <span className="font-extrabold text-2xl bg-gradient-to-r from-violet-500 to-indigo-500 text-transparent bg-clip-text">Gym Max</span>
            </div>
            
            <div className="hidden sm:flex items-center space-x-2">
              {navItems.map((item) => (
                <button key={item.view} onClick={() => navigateTo(item.view)} className={getNavButtonClass(item.view)}>
                  {item.label}
                </button>
              ))}
            </div>

            <div className="sm:hidden">
              <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 rounded-md text-slate-300 hover:text-white hover:bg-zinc-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-violet-500">
                {isMobileMenuOpen ? <CloseIcon className="block h-6 w-6" /> : <MenuIcon className="block h-6 w-6" />}
              </button>
            </div>
          </div>
        </nav>

        {isMobileMenuOpen && (
          <div className="sm:hidden absolute top-16 inset-x-0 bg-zinc-800 border-b border-zinc-700 shadow-lg z-40 p-3">
            <div className="space-y-1">
              {navItems.map((item) => <button key={`mobile-${item.view}`} onClick={() => navigateTo(item.view)} className={getNavButtonClass(item.view, true)}>{item.label}</button>)}
            </div>
          </div>
        )}
      </header>

      <main className="flex-grow container mx-auto py-10 px-4 sm:px-6 lg:px-8 max-w-6xl w-full">
        {isLoadingAuth && <div className="min-h-[50vh] flex items-center justify-center"><LoadingSpinner size="lg" /></div>}
        {!isLoadingAuth && currentView === 'inicio' && <InicioView currentUser={currentUser} navigateTo={navigateTo} showToast={showToast} />}
        {!isLoadingAuth && currentView === 'routineDashboard' && <RoutineDashboardView currentUser={currentUser} navigateTo={navigateTo} />}
        {!isLoadingAuth && currentView === 'routineForm' && <RoutineFormView currentUser={currentUser} routineId={editingRoutineId} navigateTo={navigateTo} />}
        {!isLoadingAuth && currentView === 'seguimiento' && <SeguimientoView currentUser={currentUser} navigateTo={navigateTo} showToast={showToast} />}
        {!isLoadingAuth && currentView === 'recipeBook' && <RecipeBookView currentUser={currentUser as User} navigateTo={navigateTo} />}
        {!isLoadingAuth && currentView === 'workoutLogger' && loggingRoutineId && loggingDayId && (
            <WorkoutLoggerView currentUser={currentUser} routineId={loggingRoutineId} dayId={loggingDayId} navigateTo={navigateTo} />
        )}
        {!isLoadingAuth && currentView === 'aiAssistant' && <AIAssistantView currentUser={currentUser} showToast={showToast} />}
      </main>

      {isProfileModalOpen && (
        <Modal isOpen={isProfileModalOpen} onClose={() => setIsProfileModalOpen(false)}>
          <UserProfileView currentUser={currentUser} handleSignOut={handleSignOut} onProfileUpdated={handleProfileUpdate} />
        </Modal>
      )}

      {showRoutineCreator && currentUser && (
        <Modal onClose={() => setShowRoutineCreator(false)} title="Nueva Rutina">
          <NewRoutineCreator db={db} userId={currentUser.uid} onClose={() => setShowRoutineCreator(false)} />
        </Modal>
      )}

      <button
        className="fixed bottom-6 right-6 z-40 bg-violet-600 hover:bg-violet-700 text-white rounded-full shadow-lg p-4 text-2xl font-bold focus:outline-none focus:ring-4 focus:ring-violet-400"
        onClick={() => setShowRoutineCreator(true)}
        aria-label="Crear nueva rutina (mobile)"
      >
        +
      </button>

      <footer className="bg-zinc-800/50 text-center text-slate-400 text-xs p-5 mt-auto border-t border-zinc-700/50">
        <p>&copy; {new Date().getFullYear()} Gym Max. Tu compañero de fitness definitivo.</p>
      </footer>
    </div>
    </ThemeProvider>
  );
};

export default App;