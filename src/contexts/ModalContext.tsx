import React, { createContext, useContext, useState, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useSound } from './SoundContext';

interface ModalProps {
  title: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  onConfirm?: () => void;
  onCancel?: () => void;
  confirmText?: string;
  cancelText?: string;
}

interface ModalContextType {
  showModal: (props: ModalProps) => void;
  hideModal: () => void;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export function useModal() {
  const context = useContext(ModalContext);
  if (context === undefined) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return context;
}

interface ModalProviderProps {
  children: ReactNode;
}

export const ModalProvider: React.FC<ModalProviderProps> = ({ children }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [modalProps, setModalProps] = useState<ModalProps | null>(null);
  const { playSound } = useSound();

  const showModal = (props: ModalProps) => {
    setModalProps(props);
    setIsVisible(true);
    playSound(props.type === 'error' ? 'error' : 'click');
  };

  const hideModal = () => {
    setIsVisible(false);
    playSound('click');
  };

  const handleConfirm = () => {
    if (modalProps?.onConfirm) {
      modalProps.onConfirm();
    }
    hideModal();
  };

  const handleCancel = () => {
    if (modalProps?.onCancel) {
      modalProps.onCancel();
    }
    hideModal();
  };

  // Modal icons based on type
  const getModalIcon = () => {
    switch (modalProps?.type) {
      case 'success':
        return (
          <div className="bg-green-100 rounded-full p-3">
            <svg className="w-8 h-8 text-green-500\" fill="none\" stroke="currentColor\" viewBox="0 0 24 24">
              <path strokeLinecap="round\" strokeLinejoin="round\" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        );
      case 'error':
        return (
          <div className="bg-red-100 rounded-full p-3">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        );
      case 'warning':
        return (
          <div className="bg-yellow-100 rounded-full p-3">
            <svg className="w-8 h-8 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
        );
      default: // info
        return (
          <div className="bg-blue-100 rounded-full p-3">
            <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
    }
  };

  return (
    <ModalContext.Provider value={{ showModal, hideModal }}>
      {children}
      <AnimatePresence>
        {isVisible && modalProps && (
          <motion.div
            className="fixed inset-0 flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div 
              className="fixed inset-0 bg-black bg-opacity-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={hideModal}
            />
            <motion.div
              className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 relative z-10 border-4"
              style={{
                borderColor: 
                  modalProps.type === 'success' ? '#10B981' :
                  modalProps.type === 'error' ? '#EF4444' :
                  modalProps.type === 'warning' ? '#F59E0B' : '#3B82F6'
              }}
              initial={{ scale: 0.9, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 20, opacity: 0 }}
              transition={{ type: "spring", bounce: 0.5 }}
            >
              <button 
                onClick={hideModal}
                className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
              
              <div className="flex items-start mb-4">
                {getModalIcon()}
                <h3 className="ml-4 text-xl font-bold text-gray-800 font-gaegu">{modalProps.title}</h3>
              </div>
              
              <p className="text-gray-700 mb-6">{modalProps.message}</p>
              
              <div className="flex justify-end space-x-3">
                {(modalProps.onCancel || modalProps.cancelText) && (
                  <button
                    onClick={handleCancel}
                    className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-full text-gray-800 font-medium transition-colors duration-200"
                  >
                    {modalProps.cancelText || "Cancel"}
                  </button>
                )}
                <button
                  onClick={handleConfirm}
                  className="btn-magic"
                >
                  <span>{modalProps.confirmText || "OK"}</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </ModalContext.Provider>
  );
};