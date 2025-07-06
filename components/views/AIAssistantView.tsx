import React, { useState, useEffect, useRef } from 'react';
import { User } from 'firebase/auth';
import { getFitnessAdviceStream, parseRoutineFromFileContent } from '../../services/geminiService';
import * as routineService from '../../services/routineService';
import { ChatMessage } from '../../types';
import ModalV2 from '../ModalV2';
import MealAnalyzer from '../MealAnalyzer';
import RecipeGenerator from '../RecipeGenerator';

// Icons
const SendIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
    <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 16.571V11.5a1 1 0 012 0v5.071a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
  </svg>
);

const PaperClipIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3.375 3.375 0 1112.81 7.69l-7.693 7.693a.75.75 0 01-1.06-1.06l7.693-7.693a4.875 4.875 0 10-6.895 6.895l-7.693-7.693a.75.75 0 011.06-1.06l7.693 7.693 7.693-7.693a3.375 3.375 0 014.773 4.773l-10.94 10.94a6 6 0 11-8.486-8.486l7.693-7.693" />
  </svg>
);

const LoadingSpinner: React.FC<{ size?: 'sm' | 'md' | 'lg', color?: string }> = ({ size = 'sm', color = 'text-white' }) => {
  const sizeClasses = { sm: 'w-5 h-5', md: 'w-8 h-8', lg: 'w-12 h-12' };
  return (
    <svg className={`animate-spin ${sizeClasses[size]} ${color}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
  );
};

const CameraIcon = ({className = "w-5 h-5"}) => <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>;
const RecipeBookIcon = ({className = "w-5 h-5"}) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg>;

interface AIAssistantViewProps {
  currentUser: User; 
  showToast: (message: string) => void;
}

export const AIAssistantView: React.FC<AIAssistantViewProps> = ({ currentUser, showToast }) => {
  const [userInput, setUserInput] = useState<string>('');
  const [conversation, setConversation] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isMealAnalyzerModalOpen, setIsMealAnalyzerModalOpen] = useState(false);
  const [isRecipeGeneratorModalOpen, setIsRecipeGeneratorModalOpen] = useState(false);

  const getChatStorageKey = (userId: string) => `gymMaxChatHistory_${userId}`;

  useEffect(() => {
    if (currentUser?.uid) {
      const storedConversationJson = localStorage.getItem(getChatStorageKey(currentUser.uid));
      if (storedConversationJson) {
        try {
          const storedConversation: any[] = JSON.parse(storedConversationJson);
          setConversation(storedConversation.map(msg => ({ ...msg, role: msg.role === 'assistant' ? 'model' : msg.role })) as ChatMessage[]);
        } catch (e) {
          localStorage.removeItem(getChatStorageKey(currentUser.uid));
        }
      } 
      
      if (conversation.length === 0) {
        setConversation([{ id: `model-${Date.now()}`, role: 'model', content: "¡Hola! Soy tu asistente de IA. Pregúntame sobre fitness, nutrición o sube un archivo con tu rutina." }]);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser.uid]);

  useEffect(() => {
    if (currentUser?.uid && conversation.length > 0) {
      const limitedHistory = conversation.slice(-10);
      localStorage.setItem(getChatStorageKey(currentUser.uid), JSON.stringify(limitedHistory));
    }
  }, [conversation, currentUser.uid]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !currentUser?.uid) return;

    if(fileInputRef.current) fileInputRef.current.value = ""; 

    const userMessageId = `user-${Date.now()}`;
    setConversation(prev => [...prev, { id: userMessageId, role: 'user', content: `Archivo subido: ${file.name}`, fileName: file.name }]);
    
    setIsLoading(true);
    setError(null);
    const assistantMessageId = `model-${Date.now()}`;
    setConversation(prev => [...prev, { id: assistantMessageId, role: 'model', content: '' }]);

    try {
      let fileContent: string;
      let mimeType: 'text/plain' | 'application/pdf';

      if (file.type === 'application/pdf') {
        mimeType = 'application/pdf';
        fileContent = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = () => resolve((reader.result as string).split(',')[1]); 
          reader.onerror = error => reject(error);
        });
      } else if (file.type === 'text/plain') {
        mimeType = 'text/plain';
        fileContent = await file.text();
      } else {
        throw new Error('Tipo de archivo no soportado. Por favor, sube un PDF o TXT.');
      }

      const parsedRoutine = await parseRoutineFromFileContent(fileContent, mimeType, file.name);

      if (parsedRoutine && parsedRoutine.name) {
        const savedRoutine = await routineService.importFullRoutine(currentUser.uid, parsedRoutine);
        if (savedRoutine) {
          setConversation(prev => prev.map(msg => msg.id === assistantMessageId ? { ...msg, content: `¡Éxito! La rutina "${savedRoutine.name}" ha sido importada desde tu archivo y guardada. Puedes verla en la sección 'Rutinas'.` } : msg));
        } else {
          throw new Error("No se pudo guardar la rutina procesada en la base de datos.");
        }
      } else {
        throw new Error("El AI no pudo generar una estructura de rutina válida a partir del archivo.");
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Error desconocido al procesar el archivo.";
      setError(errorMessage);
      setConversation(prev => prev.map(msg => msg.id === assistantMessageId ? { ...msg, content: `Error al procesar "${file.name}": ${errorMessage}` } : msg));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedInput = userInput.trim();
    if (!trimmedInput || isLoading) return;

    const userMessage: ChatMessage = { id: `user-${Date.now()}`, role: 'user', content: trimmedInput };
    setConversation(prev => [...prev, userMessage]);
    setUserInput('');
    setIsLoading(true);
    setError(null);

    const assistantMessageId = `model-${Date.now()}`;
    setConversation(prev => [...prev, { id: assistantMessageId, role: 'model', content: '' }]);

    try {
      const stream = await getFitnessAdviceStream(trimmedInput, conversation);
      let fullResponse = '';
      for await (const chunk of stream) {
        fullResponse += chunk.text;
        setConversation(prev => prev.map(msg => msg.id === assistantMessageId ? { ...msg, content: fullResponse } : msg));
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Error al obtener respuesta del asistente.";
      setError(errorMessage);
      setConversation(prev => prev.map(msg => msg.id === assistantMessageId ? { ...msg, content: `Lo siento, tuve problemas para procesar tu solicitud: ${errorMessage}` } : msg));
    } finally {
      setIsLoading(false);
    }
  };
  
  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const assistantTyping = isLoading && conversation.length > 0 && conversation[conversation.length - 1].role === 'model' && conversation[conversation.length - 1].content === '';

  const getAvatar = (role: 'user' | 'model') => {
    if (role === 'model') {
      return <img className="w-8 h-8 rounded-full bg-violet-500 p-1 shadow-md object-contain flex-shrink-0" src={`https://ui-avatars.com/api/?name=AI&background=1f2937&color=a78bfa&font-size=0.4&bold=true`} alt="AI Avatar" />;
    }
    return <img className="w-8 h-8 rounded-full bg-slate-600 object-cover shadow-md flex-shrink-0" src={currentUser.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.displayName || currentUser.email || 'U')}&background=475569&color=fff&size=96&font-size=0.33&bold=true`} alt="User Avatar" />;
  }
  
  const toolButtonStyles = "flex-1 sm:flex-none flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all duration-200 shadow-md border";
  
  return (
    <>
    <div className="bg-zinc-900/50 backdrop-blur-xl shadow-2xl rounded-xl border border-zinc-700/80 flex flex-col h-full max-h-[calc(100vh-180px)] sm:max-h-[750px]">
      <div className="text-center p-4 border-b border-zinc-700 flex-shrink-0">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-violet-400 tracking-tight">
          Asistente de Fitness IA
        </h1>
        <p className="text-slate-400 text-xs sm:text-sm mt-1 max-w-2xl mx-auto">
          Haz una pregunta o usa las herramientas de IA.
        </p>
         <div className="mt-4 flex flex-col sm:flex-row justify-center gap-3">
            <button onClick={() => setIsMealAnalyzerModalOpen(true)} className={`${toolButtonStyles} bg-teal-900/60 text-teal-200 hover:bg-teal-900/90 border-teal-800`}>
                <CameraIcon /> Analizar Comida
            </button>
            <button onClick={() => setIsRecipeGeneratorModalOpen(true)} className={`${toolButtonStyles} bg-violet-900/60 text-violet-200 hover:bg-violet-900/90 border-violet-800`}>
                <RecipeBookIcon /> Generar Receta
            </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {conversation.map((msg) => (
          <div key={msg.id} className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'model' && getAvatar('model')}
            
            <div 
              className={`p-3 rounded-lg max-w-[75%] break-words min-w-0 shadow-md text-sm sm:text-base ${
                  msg.role === 'user' 
                  ? 'bg-violet-600 text-white' 
                  : 'bg-zinc-700 text-slate-200'
              }`}
            >
              {msg.fileName && <p className="text-xs text-violet-200 mb-1.5 font-semibold italic border-b border-violet-400/30 pb-1.5">Archivo: {msg.fileName}</p>}
              <div className="whitespace-pre-wrap">{msg.content}</div>
            </div>
            
            {msg.role === 'user' && getAvatar('user')}
          </div>
        ))}
        {assistantTyping && (
           <div className="flex items-start gap-3 justify-start">
             {getAvatar('model')}
             <div className="flex items-center space-x-1.5 px-4 py-3 rounded-lg bg-zinc-700">
               <span className="inline-block w-2 h-2 bg-violet-300 rounded-full animate-pulse [animation-delay:-0.3s]"></span>
               <span className="inline-block w-2 h-2 bg-violet-300 rounded-full animate-pulse [animation-delay:-0.15s]"></span>
               <span className="inline-block w-2 h-2 bg-violet-300 rounded-full animate-pulse"></span>
             </div>
           </div>
        )}
        <div ref={chatEndRef} />
      </div>

      <div className="p-4 border-t border-zinc-700 flex-shrink-0">
        {error && ( 
          <p className="text-xs text-rose-300 bg-rose-800/50 p-2.5 rounded-lg border border-rose-700/70 text-center mb-3">
            Error: {error}
          </p>
        )}
        <form onSubmit={handleSubmit} className="flex items-center gap-2 sm:gap-3">
          <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              className="hidden"
              accept=".txt,.pdf"
          />
          <button
              type="button"
              onClick={triggerFileInput}
              disabled={isLoading}
              className="p-3 rounded-full text-slate-300 hover:text-violet-400 hover:bg-zinc-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-violet-500 disabled:opacity-50 flex-shrink-0"
              aria-label="Adjuntar archivo de rutina"
          >
              <PaperClipIcon className="w-5 h-5"/>
          </button>
          <input
            type="text"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            placeholder={isLoading ? "Esperando respuesta..." : "Escribe tu pregunta..."}
            className="flex-1 min-w-0 px-4 py-3 bg-zinc-700/80 border border-zinc-600 rounded-full text-slate-100 focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none transition-all duration-300 placeholder-slate-400 shadow-sm text-sm sm:text-base"
            aria-label="Campo para ingresar pregunta al asistente IA"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !userInput.trim()}
            className="bg-violet-600 hover:bg-violet-500 text-white font-semibold p-3 rounded-full transition-all duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 ring-offset-2 ring-offset-slate-800 focus:ring-violet-500 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none shadow-lg hover:shadow-violet-500/40 flex-shrink-0"
            aria-label="Enviar pregunta"
          >
            {(assistantTyping) ? <LoadingSpinner size="sm" color="text-white"/> : <SendIcon className="w-5 h-5"/>}
          </button>
        </form>
      </div>
    </div>
    {currentUser && (
        <>
        <ModalV2 isOpen={isMealAnalyzerModalOpen} onClose={() => setIsMealAnalyzerModalOpen(false)}>
            <MealAnalyzer userId={currentUser.uid} onClose={() => setIsMealAnalyzerModalOpen(false)} showToast={showToast} />
        </ModalV2>
        <ModalV2 isOpen={isRecipeGeneratorModalOpen} onClose={() => setIsRecipeGeneratorModalOpen(false)}>
            <RecipeGenerator userId={currentUser.uid} onClose={() => setIsRecipeGeneratorModalOpen(false)} showToast={showToast} />
        </ModalV2>
        </>
    )}
    </>
  );
};