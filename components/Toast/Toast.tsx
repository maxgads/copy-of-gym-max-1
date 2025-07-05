import React, { useEffect } from 'react';

const Toast = ({ message, show, onDismiss }: {message: string, show: boolean, onDismiss: () => void}) => {
    useEffect(() => {
        if (show) {
            const timer = setTimeout(() => onDismiss(), 3000);
            return () => clearTimeout(timer);
        }
    }, [show, onDismiss]);
    return (
      <div className="fixed top-6 right-6 z-50">
        <div className="bg-zinc-900 dark:bg-zinc-950 border border-zinc-700 text-violet-200 dark:text-violet-100 rounded-lg shadow-lg px-6 py-4 flex items-center gap-3 animate-fade-in-scale">
          <span>{message}</span>
          <button onClick={onDismiss} className="ml-auto text-zinc-400 hover:text-violet-400 transition-colors text-lg font-bold">×</button>
        </div>
      </div>
    );
};

export default Toast;
