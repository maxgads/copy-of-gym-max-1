
import React from 'react';
import Modal from './Modal';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
}) => {
  if (!isOpen) {
    return null;
  }

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="space-y-6">
        <p className="text-slate-300 text-md">{message}</p>
        <div className="flex justify-end gap-4 pt-4 border-t border-slate-700">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors duration-200 ease-in-out bg-slate-600 hover:bg-slate-500 text-white shadow-md hover:shadow-lg"
          >
            {cancelText}
          </button>
          <button
            onClick={handleConfirm}
            className="px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors duration-200 ease-in-out bg-rose-600 hover:bg-rose-500 text-white shadow-md hover:shadow-lg"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmationModal;
