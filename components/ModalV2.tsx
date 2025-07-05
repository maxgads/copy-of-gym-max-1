
import React from 'react';

const XIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" x2="6" y1="6" y2="18"></line><line x1="6" x2="18" y1="6" y2="18"></line></svg>;

const ModalV2 = ({ isOpen, onClose, children }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-slate-900 text-white rounded-xl shadow-2xl max-w-lg w-full mx-auto font-sans flex flex-col relative animate-fade-in-scale max-h-[90vh]">
                <button onClick={onClose} className="absolute top-2 right-2 p-2 text-slate-400 hover:text-white transition-colors z-10">
                    <XIcon />
                </button>
                <div className="p-4 sm:p-6 bg-slate-800/50 flex-grow overflow-y-auto custom-scrollbar">
                    {children}
                </div>
            </div>
        </div>
    );
};
export default ModalV2;
