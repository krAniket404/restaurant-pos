'use client';
import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from './Button';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
  position?: 'center' | 'top';
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, className, position = 'center' }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.body.style.height = '100vh';
      document.documentElement.style.overflow = 'hidden';
      document.body.classList.add('modal-open-lock');
    } else {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
      document.body.classList.remove('modal-open-lock');
    }
    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
      document.body.classList.remove('modal-open-lock');
    };
  }, [isOpen]);

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div className={`fixed inset-0 z-[9999] flex justify-center p-4 sm:p-0 ${position === 'center' ? 'items-center' : 'items-start sm:pt-10 pt-4'}`}>
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        style={{ touchAction: 'none' }}
        onWheel={(e) => e.preventDefault()}
        onTouchMove={(e) => e.preventDefault()}
      />
      <div
        className={cn("relative bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90dvh] flex flex-col transform transition-all", className)}
      >
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          {title && <h2 className="text-xl font-bold">{title}</h2>}
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto flex-1 overscroll-contain modal-scroll-area">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
};
