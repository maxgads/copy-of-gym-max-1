import React, { useState, useEffect, useMemo } from 'react';
import * as profileService from '../services/profileService';
import { GoogleGenAI } from '@google/genai';
import LoadingSpinner from './LoadingSpinner';

// Gemini Action Button Component (from original file)
interface GeminiActionButtonProps {
  prompt: string;
  onCompletion: (text: string) => void;
  onStart?: () => void;
  onError?: (error: string) => void;
  children: React.ReactNode;
  disabled?: boolean;
  className?: string;
}

const GeminiActionButton: React.FC<GeminiActionButtonProps> = ({
  prompt,
  onCompletion,
  onStart,
  onError,
  children,
  disabled = false,
  className = ''
}) => {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleClick = async () => {
    if (onStart) onStart();
    setIsGenerating(true);

    try {
      if (!process.env.API_KEY) {
        throw new Error("La clave API de Gemini no está configurada.");
      }
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-preview-04-17',
        contents: prompt,
      });

      onCompletion(response.text.replace(/\*/g, '•'));
    } catch (error) {
      console.error("Error calling Gemini API:", error);
      const errorMessage = "Hubo un error al conectar con el servicio de IA. Por favor, inténtalo más tarde.";
      if (onError) {
        onError(errorMessage);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <button onClick={handleClick} disabled={disabled || isGenerating} className={className}>
      {isGenerating ? (
        <div className="flex items-center justify-center">
          <LoadingSpinner size="sm"/>
          <span className="ml-2">Generando...</span>
        </div>
      ) : (
        children
      )}
    </button>
  );
};

// =================================================================================
// Icono SVG para la persona (from user's new code)
// =================================================================================
const PersonIcon: React.FC<{color: string}> = ({color}) => (
    <svg viewBox="0 0 24 24" className="max-h-full w-auto" fill={color} style={{ transition: 'fill 0.5s ease-in-out' }}>
        <path d="M12,12.5c-3.04,0-5.5,2.46-5.5,5.5v1.5h11v-1.5C17.5,15,15.04,12.5,12,12.5z M12,11.5c2.21,0,4-1.79,4-4s-1.79-4-4-4 s-4,1.79-4,4S9.79,11.5,12,11.5z" />
    </svg>
);


interface BMICalculatorProps {
  userId: string;
}

const BMICalculator: React.FC<BMICalculatorProps> = ({ userId }) => {
  const [height, setHeight] = useState<string>('');
  const [weight, setWeight] = useState<string>('');
  const [bmi, setBmi] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [aiAdvice, setAiAdvice] = useState('');
  const [aiError, setAiError] = useState('');

  const bmiInfo = useMemo(() => {
    if (bmi === null) {
      return { category: 'Calcula tu IMC', color: '#64748b', progress: 0, description: 'Ingresa tus datos para empezar.' };
    }
    const minBmi = 15;
    const maxBmi = 40;
    const clampedBmi = Math.max(minBmi, Math.min(bmi, maxBmi));
    const progress = ((clampedBmi - minBmi) / (maxBmi - minBmi)) * 100;
    if (bmi < 18.5) return { category: 'Bajo peso', color: '#facc15', progress, description: 'Un IMC bajo puede indicar desnutrición.' };
    if (bmi < 24.9) return { category: 'En tu peso ideal', color: '#4ade80', progress, description: '¡Felicidades! Estás en un rango saludable.' };
    if (bmi < 29.9) return { category: 'Sobrepeso', color: '#fb923c', progress, description: 'Pequeños cambios pueden hacer una gran diferencia.' };
    return { category: 'Obesidad', color: '#f87171', progress, description: 'Considera buscar asesoramiento médico.' };
  }, [bmi]);

  useEffect(() => {
    setIsLoading(true);
    const unsubscribe = profileService.getUserProfileData(
        userId,
        (profileData) => {
            if (profileData) {
                if (profileData.height) setHeight(profileData.height);
                if (profileData.weight) setWeight(profileData.weight);
            }
            setIsLoading(false);
        },
        (error) => {
            console.error("Error fetching profile data for BMI calculator:", error);
            setIsLoading(false);
        }
    );
    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [userId]);

  useEffect(() => {
    const h = parseFloat(height);
    const w = parseFloat(weight);
    setSaveMessage('');
    if (h > 0 && w > 0) {
      const heightInMeters = h / 100;
      setBmi(w / (heightInMeters * heightInMeters));
    } else {
      setBmi(null);
    }
  }, [height, weight]);

  const handleSave = async () => {
    setIsSaving(true);
    setSaveMessage('');
    try {
        await profileService.saveUserProfileData(userId, { height, weight });
        setSaveMessage('¡Guardado!');
    } catch (error) {
        setSaveMessage('Error al guardar');
    } finally {
        setIsSaving(false);
        setTimeout(() => setSaveMessage(''), 2500);
    }
  };

  const advicePrompt = useMemo(() => {
    if (!bmi) return "";
    return `Mi Índice de Masa Corporal (IMC) es ${bmi.toFixed(1)}, que se clasifica como '${bmiInfo.category}'. Basado en esto, por favor dame 5 consejos prácticos y accionables sobre nutrición y 5 sobre ejercicio para mejorar mi salud y composición corporal. Formatea la respuesta con viñetas y un tono motivador y amigable.`;
  }, [bmi, bmiInfo.category]);
  
  const commonInputStyles = "w-full px-4 py-3 bg-slate-700/70 border border-slate-600 rounded-lg text-slate-100 focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none transition-all duration-300 placeholder-slate-400 shadow-sm";
  const labelStyles = "block text-sm font-medium text-slate-300 mb-1.5 ml-1";
  
  if (isLoading) {
    return (
        <div className="flex items-center justify-center" style={{minHeight: '480px'}}>
             <div className="text-center p-4"><LoadingSpinner /> <p className="mt-2 text-slate-400">Cargando datos del perfil...</p></div>
        </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in-scale">
        {/* Sección de Entradas de Datos */}
        <div className="grid grid-cols-2 gap-4">
            <div>
                <label htmlFor="heightBmi" className={labelStyles}>Altura (cm)</label>
                <input id="heightBmi" type="number" value={height} onChange={(e) => setHeight(e.target.value)} className={commonInputStyles} placeholder="Ej: 175"/>
            </div>
            <div>
                <label htmlFor="weightBmi" className={labelStyles}>Peso (kg)</label>
                <input id="weightBmi" type="number" value={weight} onChange={(e) => setWeight(e.target.value)} className={commonInputStyles} placeholder="Ej: 70"/>
            </div>
        </div>

        {/* Sección de Resultados */}
        <div className="text-center p-6 rounded-lg bg-slate-700/50 space-y-6">
            <div className="flex items-center justify-center sm:justify-around gap-6">
                <div className="w-24 h-24 flex-shrink-0">
                    <PersonIcon color={bmiInfo.color} />
                </div>
                <div className="text-left">
                    <p className="text-lg text-slate-400">Tu IMC es:</p>
                    <p className="text-5xl font-bold" style={{color: bmiInfo.color}}>{bmi ? bmi.toFixed(1) : '-'}</p>
                    <p className="text-xl font-semibold" style={{color: bmiInfo.color}}>{bmiInfo.category}</p>
                </div>
            </div>

            <div className="pt-2 space-y-2">
                <div className="relative w-full h-3 bg-gradient-to-r from-yellow-400 via-green-400 to-red-500 rounded-full">
                     {bmi !== null && (
                        <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-5 h-5 bg-zinc-900 dark:bg-zinc-800 rounded-full border-4 border-zinc-700 shadow-lg" style={{ left: `${bmiInfo.progress}%`, transition: 'left 0.5s ease-out' }}></div>
                    )}
                </div>
                <div className="flex justify-between text-xs text-slate-400 px-1">
                    <span>Bajo</span>
                    <span>Ideal</span>
                    <span>Sobrepeso</span>
                    <span>Obesidad</span>
                </div>
            </div>
             <p className="text-sm text-slate-400 pt-2 h-5">{bmiInfo.description}</p>
        </div>
        
        {/* AI Advice Section */}
        <div className="pt-2 space-y-3">
            <GeminiActionButton
                prompt={advicePrompt}
                onStart={() => { setAiAdvice(''); setAiError(''); }}
                onCompletion={setAiAdvice}
                onError={setAiError}
                disabled={!bmi}
                className="w-full bg-teal-600 hover:bg-teal-500 text-white font-semibold py-2.5 px-5 rounded-lg transition-colors shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-teal-400 focus:ring-opacity-50 flex items-center justify-center gap-2 text-sm disabled:bg-slate-500 disabled:cursor-not-allowed"
            >
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 16.571V11.5a1 1 0 012 0v5.071a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" /></svg>
                  Obtener Consejos de la IA
                </>
            </GeminiActionButton>
            {aiError && <p className="text-sm text-rose-300 bg-rose-800/40 p-3 mt-2 rounded-lg">{aiError}</p>}
            {aiAdvice && <div className="text-left text-sm text-slate-200 bg-slate-600/40 p-4 mt-2 rounded-lg whitespace-pre-wrap">{aiAdvice}</div>}
        </div>

        {/* Save Button */}
        <div className="pt-2">
            <button onClick={handleSave} disabled={isSaving || !height || !weight} className="w-full px-4 py-3 bg-violet-600 text-white font-bold rounded-lg hover:bg-violet-500 disabled:bg-slate-600 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center">
                {isSaving ? <LoadingSpinner size="sm"/> : (saveMessage || 'Guardar Cambios en Perfil')}
            </button>
        </div>
    </div>
  );
};

export default BMICalculator;