import React from 'react';
import RoutineCreatorProfessional from './RoutineCreatorProfessional';

interface RoutineCreatorProModalProps {
  onClose: () => void;
}

const RoutineCreatorProModal: React.FC<RoutineCreatorProModalProps> = ({ onClose }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-2">
    <div className="bg-zinc-950 rounded-2xl shadow-2xl max-w-md w-full mx-2 p-0 relative animate-fade-in-scale">
      <button
        className="absolute top-3 right-3 text-zinc-400 hover:text-violet-400 text-2xl font-bold z-10"
        onClick={onClose}
        aria-label="Cerrar"
      >×</button>
      <RoutineCreatorProfessional />
    </div>
  </div>
);

export default RoutineCreatorProModal;
