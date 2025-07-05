import React, { useState } from 'react';
import firebase from 'firebase/compat/app';
import FoodLoggerView from './FoodLoggerView';
import ProgressChartView from '../ProgressChartView';
import BMICalculator from '../BMICalculator';
import WeightProgressChart from '../WeightProgressChart';
import { AppView } from '../../types';

interface SeguimientoViewProps {
    currentUser: firebase.User;
    navigateTo: (view: AppView) => void;
    showToast: (message: string) => void;
}

const ChartIcon = ({ className = 'w-4 h-4' }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>
);
const FoodIcon = ({ className = 'w-4 h-4' }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 11.5c0-3.31 2.69-6 6-6h6c3.31 0 6 2.69 6 6v2c0 3.31-2.69 6-6 6H9c-3.31 0-6-2.69-6-6v-2zm18 0H3" /></svg>
);


const SeguimientoView: React.FC<SeguimientoViewProps> = ({ currentUser, navigateTo, showToast }) => {
    const [activeTab, setActiveTab] = useState<'nutrition' | 'progress'>('nutrition');

    const TabButton = ({
        label,
        icon,
        isActive,
        onClick,
    }: {
        label: string;
        icon: React.ReactNode;
        isActive: boolean;
        onClick: () => void;
    }) => {
        return (
            <button
                onClick={onClick}
                className={`flex-1 flex flex-row items-center justify-center gap-2 px-3 py-2 min-h-10 h-10 rounded-xl transition-all duration-200 text-base font-semibold
                    ${isActive ? 'bg-violet-600/90 text-white border-2 border-violet-400 shadow-md scale-105' : 'bg-zinc-800/70 text-zinc-400 hover:bg-zinc-700/60 hover:text-violet-300 border-2 border-transparent'}
                `}
                style={{
                  boxShadow: isActive ? '0 2px 8px 0 #a78bfa33' : undefined,
                }}
            >
                <span className="flex items-center justify-center w-6 h-6">{icon}</span>
                <span className="leading-tight whitespace-nowrap">{label}</span>
            </button>
        );
    };

    return (
        <div className="max-w-2xl mx-auto w-full px-2 sm:px-0 py-4">
            <h1 className="text-violet-400 dark:text-violet-300 font-bold text-xl mb-2">
                Seguimiento
            </h1>
            <div className="flex gap-2 mb-3">
                <TabButton
                    label="Nutrición"
                    icon={<FoodIcon className="w-5 h-5"/>}
                    isActive={activeTab === 'nutrition'}
                    onClick={() => setActiveTab('nutrition')}
                />
                <TabButton
                    label="Progreso Físico"
                    icon={<ChartIcon className="w-5 h-5"/>}
                    isActive={activeTab === 'progress'}
                    onClick={() => setActiveTab('progress')}
                />
            </div>
            <div className="animate-fade-in">
                {activeTab === 'nutrition' && (
                    <FoodLoggerView currentUser={currentUser} navigateTo={navigateTo} showToast={showToast}/>
                )}
                {activeTab === 'progress' && (
                    <div className="space-y-8">
                        <ProgressChartView userId={currentUser.uid} />
                        <BMICalculator userId={currentUser.uid} />
                        <WeightProgressChart userId={currentUser.uid} />
                    </div>
                )}
            </div>
        </div>
    );
};

export default SeguimientoView;