import React, { useState, useEffect } from 'react';

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
  requiredSecurityCode?: string;
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
  requiredSecurityCode,
  onConfirm,
  onCancel,
}) => {
  const [inputCode, setInputCode] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [showCode, setShowCode] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setInputCode('');
      setErrorMessage('');
      setShowCode(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleConfirmClick = () => {
    if (requiredSecurityCode) {
      if (inputCode.trim().toLowerCase() !== requiredSecurityCode.trim().toLowerCase()) {
        setErrorMessage('Mã bảo mật không chính xác! Vui lòng nhập đúng mã để xóa.');
        return;
      }
    }
    onConfirm();
  };

  const isCodeValid = !requiredSecurityCode || inputCode.trim().toLowerCase() === requiredSecurityCode.trim().toLowerCase();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border-2 border-pink-100 transform transition-all animate-scale-up">
        <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center text-2xl mb-4 mx-auto">
          🔒
        </div>

        <h3 className="text-xl font-bold text-center text-[#3B2C37] mb-2">
          {title}
        </h3>

        <p className="text-sm text-center text-[#6F5B68] mb-4 leading-relaxed">
          {message}
        </p>

        {/* Security Code Input if required */}
        {requiredSecurityCode && (
          <div className="mb-5 space-y-2">
            <label className="block text-xs font-bold text-[#4A3543]">
              Nhập mã bảo mật để xác nhận:
            </label>
            <div className="relative">
              <input
                type={showCode ? 'text' : 'password'}
                value={inputCode}
                onChange={(e) => {
                  setInputCode(e.target.value);
                  setErrorMessage('');
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleConfirmClick();
                  }
                }}
                placeholder="Nhập mã bảo mật..."
                className={`w-full px-4 py-2.5 pr-10 rounded-xl text-sm border focus:outline-none transition-all ${
                  errorMessage
                    ? 'border-rose-400 bg-rose-50/50 text-rose-800 focus:ring-2 focus:ring-rose-200'
                    : 'border-gray-300 focus:border-[#FF6E97] focus:ring-2 focus:ring-pink-100'
                }`}
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowCode(!showCode)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs cursor-pointer select-none"
              >
                {showCode ? 'Ẩn' : 'Hiện'}
              </button>
            </div>

            {errorMessage && (
              <p className="text-xs text-rose-600 font-semibold animate-shake">
                {errorMessage}
              </p>
            )}
          </div>
        )}

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
            onClick={handleConfirmClick}
            disabled={requiredSecurityCode ? !inputCode.trim() : false}
            className={`flex-1 py-3 px-4 rounded-xl font-semibold text-white transition-all cursor-pointer text-sm shadow-sm disabled:opacity-50 disabled:cursor-not-allowed ${
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
