import React from 'react';

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Xác nhận xóa',
  cancelLabel = 'Hủy bỏ',
  isDestructive = true,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border-2 border-pink-100 transform transition-all animate-scale-up">
        <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center text-2xl mb-4 mx-auto">
          ⚠️
        </div>
        <h3 className="text-xl font-bold text-center text-[#3B2C37] mb-2">
          {title}
        </h3>
        <p className="text-sm text-center text-[#6F5B68] mb-6 leading-relaxed">
          {message}
        </p>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-3 px-4 rounded-xl border border-gray-200 text-gray-700 font-semibold hover:bg-gray-50 active:bg-gray-100 transition-colors cursor-pointer text-sm"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`flex-1 py-3 px-4 rounded-xl font-semibold text-white transition-colors cursor-pointer text-sm ${
              isDestructive
                ? 'bg-rose-500 hover:bg-rose-600 active:bg-rose-700'
                : 'bg-[#FF6E97] hover:bg-[#FF5886]'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
