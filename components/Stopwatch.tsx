import React, { useState, useEffect, useRef, useCallback } from 'react';

// --- UTILIDAD DE SONIDO (Web Audio API) ---
// Genera sonidos simples sin necesidad de archivos de audio.
const playSound = (type: 'start' | 'pause' | 'lap' | 'reset' | 'countdownEnd') => {
    // Comprueba si estamos en un entorno de navegador
    if (typeof window === 'undefined') return;
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    if (!audioCtx) return;

    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    gainNode.connect(audioCtx.destination);
    oscillator.connect(gainNode);

    const now = audioCtx.currentTime;
    gainNode.gain.setValueAtTime(0.5, now);

    switch (type) {
        case 'start':
            oscillator.frequency.setValueAtTime(523.25, now); // C5
            gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.5);
            break;
        case 'pause':
            oscillator.frequency.setValueAtTime(349.23, now); // F4
            gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.5);
            break;
        case 'lap':
            oscillator.type = 'triangle';
            oscillator.frequency.setValueAtTime(880, now); // A5
            gainNode.gain.setValueAtTime(0.3, now);
            gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.2);
            break;
        case 'reset':
            oscillator.frequency.setValueAtTime(261.63, now); // C4
            gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.4);
            break;
        case 'countdownEnd':
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(1046.50, now); // C6
            oscillator.frequency.setValueAtTime(1318.51, now + 0.15); // E6
            gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.5);
            break;
        default:
            oscillator.disconnect();
            gainNode.disconnect();
            return;
    }

    oscillator.start(now);
    oscillator.stop(now + 1);
};


// --- HOOKS PERSONALIZADOS ---

const useStopwatch = () => {
    const [time, setTime] = useState(0);
    const [laps, setLaps] = useState<number[]>([]);
    const [isRunning, setIsRunning] = useState(false);
    const timerRef = useRef<number | null>(null);
    const startTimeRef = useRef(0);
    const lastLapTimeRef = useRef(0);

    const updateTimer = useCallback(() => {
        setTime(Date.now() - startTimeRef.current);
        timerRef.current = requestAnimationFrame(updateTimer);
    }, []);

    const start = () => {
        if (!isRunning) {
            setIsRunning(true);
            startTimeRef.current = Date.now() - time;
            lastLapTimeRef.current = time;
            timerRef.current = requestAnimationFrame(updateTimer);
            playSound('start');
        }
    };

    const pause = () => {
        if (isRunning) {
            setIsRunning(false);
            if (timerRef.current) cancelAnimationFrame(timerRef.current);
            playSound('pause');
        }
    };

    const addLap = () => {
        if (isRunning) {
            const currentTotalTime = Date.now() - startTimeRef.current;
            const lapTime = currentTotalTime - lastLapTimeRef.current;
            setLaps(prevLaps => [lapTime, ...prevLaps]);
            lastLapTimeRef.current = currentTotalTime;
            playSound('lap');
        }
    };

    const reset = () => {
        if(time > 0 || laps.length > 0) playSound('reset');
        setIsRunning(false);
        setTime(0);
        setLaps([]);
        lastLapTimeRef.current = 0;
        if (timerRef.current) cancelAnimationFrame(timerRef.current);
    };

    return { time, laps, isRunning, start, pause, reset, addLap };
};

const useCountdown = (onEnd?: () => void) => {
    const [time, setTime] = useState(0);
    const [initialTime, setInitialTime] = useState(0);
    const [isRunning, setIsRunning] = useState(false);
    const intervalRef = useRef<number | null>(null);
    const endTimeRef = useRef(0);

    const handleEnd = useCallback(() => {
        onEnd?.();
        playSound('countdownEnd');
    }, [onEnd]);

    const updateCountdown = useCallback(() => {
        const remaining = endTimeRef.current - Date.now();
        if (remaining <= 0) {
            setTime(0);
            setIsRunning(false);
            if (intervalRef.current) clearInterval(intervalRef.current);
            handleEnd();
        } else {
            setTime(remaining);
        }
    }, [handleEnd]);

    const start = (durationMs: number) => {
        setInitialTime(durationMs);
        setTime(durationMs);
        setIsRunning(true);
        endTimeRef.current = Date.now() + durationMs;
        if (intervalRef.current) clearInterval(intervalRef.current);
        intervalRef.current = window.setInterval(updateCountdown, 100);
        playSound('start');
    };
    
    const pause = () => {
        if(isRunning) {
            setIsRunning(false);
            if (intervalRef.current) clearInterval(intervalRef.current);
            playSound('pause');
        }
    };

    const resume = () => {
        if(!isRunning && time > 0) {
            setIsRunning(true);
            endTimeRef.current = Date.now() + time;
            if (intervalRef.current) clearInterval(intervalRef.current);
            intervalRef.current = window.setInterval(updateCountdown, 100);
            playSound('start');
        }
    };
    
    const addTime = useCallback((msToAdd: number) => {
        if (time > 0) { // Solo se puede añadir tiempo a un temporizador activo o pausado
            endTimeRef.current += msToAdd;
            setTime(prevTime => prevTime + msToAdd);
            setInitialTime(prevInitial => prevInitial + msToAdd);
            playSound('lap');
        }
    }, [time]);

    const reset = () => {
        if(time > 0) playSound('reset');
        setIsRunning(false);
        setTime(0);
        setInitialTime(0);
        if (intervalRef.current) clearInterval(intervalRef.current);
    };
    
    useEffect(() => () => { if (intervalRef.current) clearInterval(intervalRef.current) }, []);

    return { time, initialTime, isRunning, start, pause, resume, reset, addTime };
};


// --- COMPONENTES DE UI ---

const formatTime = (timeMs: number, showMilliseconds = true) => {
    const totalSeconds = Math.floor(Math.abs(timeMs) / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const ms = Math.floor((Math.abs(timeMs) % 1000) / 10);

    const formatted = {
        minutes: String(minutes).padStart(2, '0'),
        seconds: String(seconds).padStart(2, '0'),
        milliseconds: String(ms).padStart(2, '0'),
    };
    
    if (showMilliseconds) {
        return `${formatted.minutes}:${formatted.seconds}.${formatted.milliseconds}`;
    }
    return `${formatted.minutes}:${formatted.seconds}`;
};

const WatchFace: React.FC<{ timeMs: number, mode: 'stopwatch' | 'countdown', countdownInitialTime?: number, compact?: boolean }> = ({ timeMs, mode, countdownInitialTime = 0, compact = false }) => {
    const radius = compact ? 90 : 110;
    const circumference = 2 * Math.PI * radius;
    let progress = 0;

    if (mode === 'countdown' && countdownInitialTime > 0) {
        progress = timeMs / countdownInitialTime;
    } else if (mode === 'stopwatch') {
        progress = (timeMs % 60000) / 60000; // El anillo de progreso ahora representa el segundo actual en un minuto
    }

    const strokeDashoffset = circumference * (1 - progress);
    const watchSize = compact ? 'w-52 h-52 sm:w-56 sm:h-56' : 'w-64 h-64 sm:w-72 sm:h-72';
    const textSize = compact ? 'text-4xl sm:text-5xl' : 'text-5xl sm:text-6xl';
    const msTextSize = compact ? 'text-xl sm:text-2xl' : 'text-xl sm:text-2xl';
    const viewBoxSize = compact ? 210 : 250;
    const center = viewBoxSize / 2;

    return (
        <div className="relative">
            {!compact && <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-8 h-5 bg-gradient-to-b from-slate-500 to-slate-700 rounded-t-md border-x border-t border-slate-400"></div>}

            <div className={`relative ${watchSize} select-none`} role="timer" aria-live="assertive">
                <svg className="w-full h-full transform -rotate-90" viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`}>
                    <circle cx={center} cy={center} r={radius} stroke="#374151" strokeWidth="10" fill="transparent" />
                    <circle
                        cx={center}
                        cy={center}
                        r={radius}
                        stroke={mode === 'countdown' ? '#a855f7' : '#06b6d4'}
                        strokeWidth="10"
                        fill="transparent"
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        className="transition-all duration-100 ease-linear"
                    />
                    {!compact && (
                        <g transform={`translate(${center}, ${center})`}>
                            {Array.from({ length: 60 }).map((_, i) => (
                                <line
                                    key={i}
                                    y1={i % 5 === 0 ? -105 : -100}
                                    y2={-95}
                                    stroke={i % 5 === 0 ? "#9ca3af" : "#6b7280"}
                                    strokeWidth={i % 5 === 0 ? 2 : 1}
                                    transform={`rotate(${i * 6})`}
                                />
                            ))}
                        </g>
                    )}
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center font-mono">
                        <span className={`tracking-tighter ${textSize} ${mode === 'countdown' ? 'text-violet-300' : 'text-cyan-300'}`}>
                            {formatTime(timeMs, false)}
                        </span>
                        {mode === 'stopwatch' && (
                            <span className={`${msTextSize} text-cyan-400/70`}>
                                .{formatTime(timeMs).split('.')[1]}
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

const LapsDisplay: React.FC<{ laps: number[] }> = ({ laps }) => {
    if (laps.length === 0) return null;

    const fastestLap = Math.min(...laps);
    const slowestLap = Math.max(...laps);

    return (
        <div className="w-full max-w-sm mt-4">
            <div className="max-h-36 overflow-y-auto bg-zinc-900/80 rounded-lg p-2 border border-violet-900">
                <ul className="space-y-1">
                    {laps.map((lap, index) => {
                        const lapNumber = laps.length - index;
                        const isFastest = lap === fastestLap && laps.length > 1;
                        const isSlowest = lap === slowestLap && laps.length > 1;
                        return (
                            <li key={index} className={`flex justify-between items-center text-zinc-200 font-mono text-sm p-2 rounded-md transition-colors ${isFastest ? 'bg-green-500/20' : ''} ${isSlowest ? 'bg-red-500/20' : ''}`}>
                                <span>Vuelta {lapNumber}</span>
                                <span className={`${isFastest ? 'text-green-400' : ''} ${isSlowest ? 'text-red-400' : ''}`}>{formatTime(lap)}</span>
                            </li>
                        );
                    })}
                </ul>
            </div>
        </div>
    );
};

interface StopwatchProps {
    compact?: boolean;
}

const Stopwatch: React.FC<StopwatchProps> = ({ compact = false }) => {
    const [mode, setMode] = useState<'stopwatch' | 'countdown'>('stopwatch');
    const stopwatch = useStopwatch();
    const countdown = useCountdown(() => { /* Callback on end */ });

    const isActive = mode === 'stopwatch' ? stopwatch.isRunning : countdown.isRunning;
    const isCountdownActive = countdown.isRunning || countdown.time > 0;
    const displayTimeValue = mode === 'countdown' ? countdown.time : stopwatch.time;

    const handlePrimaryAction = () => {
        if (isActive) {
            mode === 'stopwatch' ? stopwatch.pause() : countdown.pause();
        } else {
            if (mode === 'stopwatch') {
                stopwatch.start();
            } else {
                if(countdown.time > 0) countdown.resume();
            }
        }
    };

    const handleReset = () => {
        stopwatch.reset();
        countdown.reset();
    };

    const primaryButtonText = isActive ? 'Pausar' : (displayTimeValue > 0 ? 'Continuar' : 'Iniciar');
    const resetButtonDisabled = displayTimeValue === 0 && !isActive && stopwatch.laps.length === 0;

    return (
        <div className={`flex flex-col items-center w-full bg-zinc-900/90 dark:bg-zinc-950 backdrop-blur-sm border border-zinc-700 rounded-2xl shadow-2xl ${compact ? 'p-3 space-y-3' : 'p-4 sm:p-6 space-y-6'}`}>
            <div className="p-1 bg-zinc-800/80 dark:bg-zinc-900/80 rounded-lg flex space-x-1 w-full max-w-sm">
                <button onClick={() => setMode('stopwatch')} className={`w-1/2 py-2 text-xs sm:text-sm font-semibold rounded-md transition-colors border ${mode === 'stopwatch' ? 'bg-violet-600 text-white border-violet-600' : 'text-zinc-300 hover:bg-zinc-700/50 border-transparent'}`}>Cronómetro</button>
                <button onClick={() => setMode('countdown')} className={`w-1/2 py-2 text-xs sm:text-sm font-semibold rounded-md transition-colors border ${mode === 'countdown' ? 'bg-violet-600 text-white border-violet-600' : 'text-zinc-300 hover:bg-zinc-700/50 border-transparent'}`}>Temporizador</button>
            </div>

            <WatchFace timeMs={displayTimeValue} mode={mode} countdownInitialTime={countdown.initialTime} compact={compact} />

            <div className="flex flex-col items-center gap-4 w-full max-w-sm">
                <div className="grid grid-cols-2 gap-4 w-full">
                    <button onClick={handleReset} disabled={resetButtonDisabled} className="p-3 bg-rose-700/80 hover:bg-rose-700 disabled:bg-zinc-700/50 disabled:text-zinc-400 text-white font-semibold rounded-lg shadow-lg focus:outline-none focus:ring-2 focus:ring-rose-400 focus:ring-offset-2 focus:ring-offset-zinc-900 transition-all duration-200 transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed text-sm">
                        Reiniciar
                    </button>
                    {mode === 'stopwatch' ? (
                         <button onClick={stopwatch.addLap} disabled={!stopwatch.isRunning} className="p-3 bg-violet-700/80 hover:bg-violet-700 disabled:bg-zinc-700/50 disabled:text-zinc-400 text-white font-semibold rounded-lg shadow-lg focus:outline-none focus:ring-2 focus:ring-violet-400 focus:ring-offset-2 focus:ring-offset-zinc-900 transition-all duration-200 transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed text-sm">
                            Vuelta
                        </button>
                    ) : (
                        <button onClick={() => countdown.addTime(60000)} disabled={!isCountdownActive} className="p-3 bg-violet-700/80 hover:bg-violet-700 disabled:bg-zinc-700/50 disabled:text-zinc-400 text-white font-semibold rounded-lg shadow-lg focus:outline-none focus:ring-2 focus:ring-violet-400 focus:ring-offset-2 focus:ring-offset-zinc-900 transition-all duration-200 transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed text-sm">
                            + 1 min
                        </button>
                    )}
                </div>
                <button onClick={handlePrimaryAction} className={`w-full p-3 text-base font-bold rounded-lg shadow-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-zinc-900 transition-all duration-200 transform active:scale-95 ${isActive ? 'bg-violet-500 hover:bg-violet-600 text-white focus:ring-violet-400' : 'bg-green-500 hover:bg-green-600 text-white focus:ring-green-400'}`}>
                    {primaryButtonText}
                </button>
            </div>
            
            {mode === 'stopwatch' && !compact && <LapsDisplay laps={stopwatch.laps} />}
            
            {mode === 'countdown' && !isCountdownActive && !compact && (
                <div className="w-full pt-4 border-t border-slate-700/50">
                  <p className="text-sm text-slate-400 text-center mb-3">o elige un tiempo rápido:</p>
                  <div className="grid grid-cols-3 gap-3">
                      {[1, 3, 5].map(min => (
                           <button key={min} onClick={() => countdown.start(min * 60 * 1000)} className="p-3 bg-violet-700/50 hover:bg-violet-700 text-white font-semibold rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-violet-400 focus:ring-offset-2 focus:ring-offset-zinc-900 transition-all duration-200 transform hover:scale-105 active:scale-95">
                              {min} min
                          </button>
                      ))}
                  </div>
                </div>
            )}
        </div>
    );
};

export default Stopwatch;
