



import React, { useState, useEffect, useRef } from 'react';
import * as geminiService from '../services/geminiService';
import LoadingSpinner from './LoadingSpinner';
import * as recipeBookService from '../services/recipeBookService';
import * as nutritionService from '../services/nutritionService';
import { Recipe, FoodFormData, MealType } from '../types';

const PencilIcon = ({className="w-5 h-5"}) => <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>;
const CameraIcon = ({className="w-5 h-5"}) => <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>;

interface MealAnalyzerProps {
    userId: string;
    onClose: () => void;
    showToast: (message: string) => void;
}

const MealAnalyzer: React.FC<MealAnalyzerProps> = ({ userId, showToast }) => {
    const [inputType, setInputType] = useState('text');
    const [image, setImage] = useState<string | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [textInput, setTextInput] = useState('');
    const [analysis, setAnalysis] = useState<Recipe | null>(null);
    const [analysisProgress, setAnalysisProgress] = useState<{ step: number, message: string } | null>(null);
    const [error, setError] = useState('');
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);

    useEffect(() => { return () => { if (stream) { stream.getTracks().forEach(track => track.stop()); } }; }, [stream]);
    
    const startCamera = async () => {
        stopCamera();
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
            setStream(mediaStream);
            if (videoRef.current) { videoRef.current.srcObject = mediaStream; }
        } catch (err) {
            console.error("Error accessing camera:", err);
            setError("No se pudo acceder a la cámara. Asegúrate de dar los permisos necesarios.");
            setInputType('text');
        }
    };

    const stopCamera = () => { if (stream) { stream.getTracks().forEach(track => track.stop()); setStream(null); } };
    
    useEffect(() => { 
        if (inputType === 'camera') { 
            startCamera(); 
        } else { 
            stopCamera(); 
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [inputType]);

    const capturePhoto = () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const context = canvas.getContext('2d');
            if (context) {
                context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
                const dataUrl = canvas.toDataURL('image/jpeg');
                setImage(dataUrl);
                setImagePreview(dataUrl);
                stopCamera();
            }
        }
    };

    const handleLogMeal = async () => {
        if (!analysis || !userId) return;
        try {
            const formData: FoodFormData = {
                name: analysis.recipeName,
                calories: parseFloat(analysis.calories) || 0,
                protein: parseFloat(analysis.protein) || 0,
                carbs: parseFloat(analysis.carbs) || 0,
                fats: parseFloat(analysis.fats) || 0,
                meal: 'Snack' as MealType,
            };
            await nutritionService.addFoodEntry(userId, formData);
            showToast('¡Comida registrada con éxito!');
        } catch (e) {
            showToast('Error al registrar la comida.');
        }
    };
    
    const handleSaveRecipe = async () => {
        if (!analysis || !userId) return;
        try {
            const recipeToSave: Recipe = {
                ...analysis,
                steps: analysis.steps || ['No se generaron pasos para esta comida analizada.'],
                ingredients: analysis.ingredients || ['Ingredientes no detallados en el análisis.'],
            };
            await recipeBookService.saveRecipe(userId, recipeToSave);
            showToast('¡Receta guardada en tu recetario!');
        } catch(e) {
            showToast('Error al guardar la receta.');
        }
    };

    const handleAnalyzeMeal = async () => {
        setAnalysis(null);
        setError('');
        
        let imagePayload: { mimeType: 'image/jpeg', data: string } | undefined;
        if (image) {
            imagePayload = { mimeType: 'image/jpeg', data: image.split(',')[1] };
        }
        
        try {
            setAnalysisProgress({ step: 1, message: imagePayload ? 'Procesando imagen...' : 'Analizando texto...' });
            await new Promise(res => setTimeout(res, 1000));
            
            setAnalysisProgress({ step: 2, message: 'Consultando a la IA...' });
            
            const analyzedMeal = await geminiService.analyzeMeal(textInput, imagePayload);
            if (analyzedMeal) {
                setAnalysis(analyzedMeal);
            } else {
                throw new Error("La IA no devolvió un análisis válido.");
            }
        } catch (err) {
            console.error("Error analyzing meal:", err);
            setError(err instanceof Error ? err.message : "Error al analizar. La IA puede haber devuelto un formato inesperado.");
        } finally {
            setAnalysisProgress(null);
        }
    };

    const resetState = () => {
        setAnalysis(null);
        setTextInput('');
        setImage(null);
        setImagePreview(null);
        setError('');
        if (inputType === 'camera') {
            startCamera();
        }
    }

    const AnalysisCard = ({ label, value, icon }: { label: string, value: string, icon: React.ReactNode }) => (<div className="bg-slate-700/50 p-3 rounded-lg text-center flex flex-col items-center justify-center"><div className="text-2xl mb-1">{icon}</div><div className="text-xs text-slate-400">{label}</div><div className="text-md font-bold text-white">{value}</div></div>);
    const InputTypeButton = ({ type, label, icon }: { type: string, label: string, icon: React.ReactNode }) => (<button onClick={() => setInputType(type)} className={`flex-1 px-3 py-2.5 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2 ${inputType === type ? 'bg-teal-600 text-white shadow-md' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}>{icon} <span>{label}</span></button>);
    const commonTextAreaStyles = "w-full min-h-[100px] p-3 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all duration-300 placeholder-slate-400 shadow-sm text-sm";
    
    return (
        <div className="space-y-6">
            <h3 className="text-2xl sm:text-3xl font-bold text-teal-400 text-center">Analizador Nutricional</h3>
            
            {!analysis ? (
                <div className="space-y-4">
                    <div className="flex space-x-2 p-1 bg-slate-800/80 rounded-lg border border-slate-700">
                        <InputTypeButton type="text" label="Describir" icon={<PencilIcon />} />
                        <InputTypeButton type="camera" label="Escanear" icon={<CameraIcon />} />
                    </div>
                
                    {inputType === 'text' && <textarea value={textInput} onChange={(e) => setTextInput(e.target.value)} placeholder="Describe tu comida. Para mejores resultados, incluye cantidades (ej: 1 milanesa de pollo con 2 tazas de puré de papas)." className={commonTextAreaStyles} />}
                    
                    {inputType === 'camera' && (
                        <div className="mt-4 w-full aspect-video bg-slate-800/50 rounded-lg overflow-hidden relative flex items-center justify-center border border-slate-700">
                            {stream ? (
                                <>
                                <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover"></video>
                                <button onClick={capturePhoto} className="absolute bottom-4 left-1/2 -translate-x-1/2 w-16 h-16 bg-white/30 rounded-full border-4 border-white backdrop-blur-sm shadow-2xl transition transform hover:scale-110 active:scale-95"></button>
                                </>
                            ) : (<p className="text-slate-400 text-sm">Iniciando cámara...</p>)}
                            <canvas ref={canvasRef} className="hidden"></canvas>
                        </div>
                    )}

                    {imagePreview && (<div className="text-center"><img src={imagePreview} alt="Foto capturada" className="mt-2 rounded-lg max-h-40 w-auto mx-auto border-2 border-slate-600" /></div>)}
                    
                    <button onClick={handleAnalyzeMeal} disabled={!!analysisProgress || (!image && !textInput.trim())} className="w-full px-4 py-3 bg-teal-600 text-white font-bold rounded-lg hover:bg-teal-500 disabled:bg-slate-600 flex items-center justify-center transition-all duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-teal-400 focus:ring-opacity-50 shadow-lg hover:shadow-teal-500/40">
                         {analysisProgress ? (
                            <>
                                <LoadingSpinner size="sm" /> 
                                <span className="ml-2">[{analysisProgress.step}/2] {analysisProgress.message}</span>
                            </>
                         ) : "🔬 Analizar Comida"}
                    </button>
                </div>
            ) : (
                <div className="space-y-4 animate-fade-in-scale bg-slate-800/80 p-4 sm:p-6 rounded-xl border border-slate-700">
                    <h4 className="text-xl font-bold text-teal-300">{analysis.recipeName}</h4>
                    <p className="italic text-slate-400 text-sm">{analysis.description}</p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <AnalysisCard label="Calorías" value={analysis.calories || '?'} icon="🔥" />
                        <AnalysisCard label="Proteínas" value={analysis.protein || '?'} icon="💪" />
                        <AnalysisCard label="Carbs" value={analysis.carbs || '?'} icon="🍞" />
                        <AnalysisCard label="Grasas" value={analysis.fats || '?'} icon="🥑" />
                    </div>
                    <div className="p-3 bg-slate-700/50 rounded-lg"><h5 className="font-semibold text-teal-300 mb-1">Consejo del Experto:</h5><p className="text-sm text-slate-300">{analysis.feedback}</p></div>
                    {analysis.disclaimer && <div className="p-2 bg-yellow-900/40 text-yellow-300 text-xs rounded-lg border border-yellow-800">{analysis.disclaimer}</div>}

                    <div className="pt-4 border-t border-slate-700 flex flex-col sm:flex-row gap-3">
                        <button onClick={handleSaveRecipe} className="flex-1 w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors shadow-md">Guardar Receta</button>
                        <button onClick={handleLogMeal} className="flex-1 w-full bg-green-600 hover:bg-green-500 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors shadow-md">Registrar Comida</button>
                    </div>
                    <button onClick={resetState} className="w-full text-sm text-slate-400 hover:text-white mt-3 py-2">Analizar otra comida</button>
                </div>
            )}
            {error && <div className="mt-4 p-3 bg-red-900/50 text-red-300 rounded-lg text-sm border border-red-700/60">{error}</div>}
        </div>
    );
};

export default MealAnalyzer;