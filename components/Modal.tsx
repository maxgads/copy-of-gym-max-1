import React, { ReactNode, useEffect } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscapeKey);
    }

    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-zinc-950/80 dark:bg-zinc-900/80 flex items-center justify-center z-50 animate-fade-in-scale">
      <div className="bg-zinc-900 dark:bg-zinc-950 border border-zinc-700 rounded-2xl shadow-2xl p-8 max-w-lg w-full relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-zinc-400 hover:text-violet-400 transition-colors text-xl font-bold">×</button>
        <h2 className="text-2xl font-bold text-violet-400 dark:text-violet-300 mb-4">{title}</h2>
        <div className="text-zinc-200 dark:text-zinc-100 mb-6">{children}</div>
      </div>
    </div>
  );
};

export default Modal;