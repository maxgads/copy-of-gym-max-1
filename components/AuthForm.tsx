import React, { useState, FormEvent } from 'react';
import { auth } from '../services/firebaseService';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import LoadingSpinner from './LoadingSpinner';

interface AuthFormProps {
  setAuthErrorExt: (error: string | null) => void;
  authErrorExt: string | null;
  setIsLoadingAuthExt: (loading: boolean) => void;
}

const AuthForm: React.FC<AuthFormProps> = ({ setAuthErrorExt, authErrorExt, setIsLoadingAuthExt }) => {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [isLoginMode, setIsLoginMode] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setIsLoadingAuthExt(true);
    setAuthErrorExt(null);

    if (!auth) {
      setAuthErrorExt("Servicio de autenticación no disponible. Por favor, revisa la configuración.");
      setIsLoading(false);
      setIsLoadingAuthExt(false);
      return;
    }

    if (!isLoginMode && password !== confirmPassword) {
      setAuthErrorExt("Las contraseñas no coinciden.");
      setIsLoading(false);
      setIsLoadingAuthExt(false);
      return;
    }

    try {
      if (isLoginMode) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
    } catch (error: any) {
      console.error("Firebase auth error:", error); // <-- Agregado para depuración
      let friendlyMessage = "Ocurrió un error inesperado. Por favor, inténtalo de nuevo.";
      if (error.code) {
        switch (error.code) {
          case 'auth/user-not-found':
            friendlyMessage = 'Usuario no encontrado.';
            break;
          case 'auth/wrong-password':
            friendlyMessage = 'Contraseña incorrecta.';
            break;
          case 'auth/email-already-in-use':
            friendlyMessage = 'El correo ya está registrado.';
            break;
          case 'auth/invalid-email':
            friendlyMessage = 'Correo electrónico inválido.';
            break;
          case 'auth/weak-password':
            friendlyMessage = 'La contraseña es muy débil.';
            break;
          default:
            friendlyMessage = error.message || friendlyMessage;
        }
      }
      setAuthErrorExt(friendlyMessage);
    } finally {
      setIsLoading(false);
      setIsLoadingAuthExt(false);
    }
  };

  const toggleMode = () => {
    setIsLoginMode(!isLoginMode);
    setAuthErrorExt(null);
    setEmail('');
    setPassword('');
    setConfirmPassword('');
  };

  const inputBaseClasses = "w-full px-4 py-3 bg-zinc-800/70 border border-zinc-700 rounded-lg text-slate-100 focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none transition-all duration-300 placeholder-zinc-400 shadow-sm";

  return (
    <div className="bg-zinc-900/50 backdrop-blur-md shadow-2xl rounded-xl p-8 sm:p-12 border border-zinc-700/50">
      <h2 className="text-3xl sm:text-4xl font-bold text-center text-violet-400 mb-10">
        {isLoginMode ? '¡Bienvenido de Nuevo!' : 'Crea Tu Cuenta'}
      </h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputBaseClasses}
            placeholder="tu@ejemplo.com"
          />
        </div>
        <div>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputBaseClasses}
            placeholder="Contraseña"
          />
        </div>
        {!isLoginMode && (
          <div>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={inputBaseClasses}
              placeholder="Confirmar contraseña"
            />
          </div>
        )}
        {authErrorExt && (
          <div className="text-red-400 text-sm text-center font-semibold animate-fade-in">
            {authErrorExt}
          </div>
        )}
        <button
          type="submit"
          className="w-full py-3 px-4 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-lg transition-all duration-300 shadow-md disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          disabled={isLoading}
        >
          {isLoading ? <LoadingSpinner size="sm" /> : isLoginMode ? 'Iniciar Sesión' : 'Registrarse'}
        </button>
      </form>
      <div className="mt-8 text-center text-sm font-medium text-slate-400">
        {isLoginMode ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?'}{' '}
        <button
          type="button"
          onClick={toggleMode}
          className="text-violet-400 hover:underline font-bold transition"
        >
          {isLoginMode ? 'Regístrate' : 'Inicia sesión'}
        </button>
      </div>
    </div>
  );
};

export default AuthForm;
