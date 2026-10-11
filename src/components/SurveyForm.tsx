import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import {
  SurveySubmission,
  saveResponseLocally,
  appendRowToSheet,
  getStoredSheetId,
} from '../services/googleSheets';
import { getAccessToken } from '../lib/firebase';

interface SurveyFormProps {
  onSubmissionSuccess?: (submission: SurveySubmission) => void;
  formRef?: React.RefObject<HTMLDivElement | null>;
}

export const SurveyForm: React.FC<SurveyFormProps> = ({
  onSubmissionSuccess,
  formRef,
}) => {
  const [name, setName] = useState('');
  const [department, setDepartment] = useState('');
  const [grade, setGrade] = useState('');
  const [attending, setAttending] = useState('Chắc chắn có mặt nha! 🥳');
  const [notes, setNotes] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'local_only' | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const triggerCuteConfetti = () => {
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#FF6E97', '#FFAEC0', '#A0D2F4', '#FFD166', '#FF9AA2'],
      });
    } catch {
      // ignore
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Cậu ơi, nhập tên của cậu giúp tớ nha!');
      return;
    }
    if (!department.trim()) {
      setErrorMsg('Cậu đang ở ban nào nè?');
      return;
    }
    if (!grade.trim()) {
      setErrorMsg('Cậu học khóa bao nhiêu dzo?');
      return;
    }

    setErrorMsg('');
    setIsSubmitting(true);

    const submission: SurveySubmission = {
      id: 'sub_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      timestamp: new Date().toLocaleString('vi-VN', {
        timeZone: 'Asia/Ho_Chi_Minh',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      }),
      name: name.trim(),
      department: department.trim(),
      grade: grade.trim(),
      attending,
      notes: notes.trim(),
      syncedToSheets: false,
    };

    // 1. Save response locally first
    saveResponseLocally(submission);

    // 2. Attempt sync to Google Sheets if token & sheet ID exist
    const token = getAccessToken();
    const sheetId = getStoredSheetId();

    if (token && sheetId) {
      try {
        await appendRowToSheet(token, sheetId, submission);
        submission.syncedToSheets = true;
        setSyncStatus('synced');
      } catch (err) {
        console.warn('Could not auto-sync to Google Sheet immediately:', err);
        setSyncStatus('local_only');
      }
    } else {
      setSyncStatus('local_only');
    }

    setIsSubmitting(false);
    setIsSuccess(true);
    triggerCuteConfetti();

    if (onSubmissionSuccess) {
      onSubmissionSuccess(submission);
    }
  };

  const handleReset = () => {
    setName('');
    setDepartment('');
    setGrade('');
    setNotes('');
    setAttending('Chắc chắn có mặt nha! 🥳');
    setIsSuccess(false);
    setSyncStatus(null);
    setErrorMsg('');
  };

  return (
    <section ref={formRef} className="relative py-8 sm:py-12 px-4 max-w-4xl mx-auto z-10">
      <div className="bg-white rounded-[28px] sm:rounded-[36px] border-2 border-[#FFCCD7] p-6 sm:p-10 md:p-12 cute-shadow relative">
        {isSuccess ? (
          <div className="text-center py-6 sm:py-10 animate-fade-in">
            <div className="text-6xl mb-4 animate-bounce">💌</div>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-[#3B2C37] mb-3">
              Cảm ơn cậu nhiều nha! 💖
            </h3>
            <p className="text-base sm:text-lg text-[#6F5B68] font-medium max-w-md mx-auto mb-5">
              Chúng tớ đã nhận được thông tin từ <span className="font-bold text-[#FF6E97]">{name}</span>. Hẹn gặp cậu vào tối 19/10 tại Sân thư viện A11 nhé meow!
            </p>

            {syncStatus === 'synced' && (
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 text-emerald-700 text-xs sm:text-sm font-semibold border border-emerald-200 mb-6">
                <span>✓</span>
                <span>Dữ liệu đã tự động lưu thành công vào Google Sheets</span>
              </div>
            )}

            {syncStatus === 'local_only' && (
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-pink-50 text-pink-700 text-xs sm:text-sm font-medium border border-pink-200 mb-6">
                <span>🐾</span>
                <span>Thông tin đã được lưu trữ an toàn trên thiết bị và sẵn sàng đồng bộ</span>
              </div>
            )}

            <div>
              <button
                onClick={handleReset}
                className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-full bg-[#FFF0F4] hover:bg-[#FFE3EC] text-[#FF5886] font-bold text-sm sm:text-base border border-[#FFAEC0] transition-all cursor-pointer"
              >
                <span>Điền phản hồi khác</span>
                <span>✨</span>
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-7">
            {/* Header */}
            <div className="text-center mb-6 sm:mb-8">
              <h2 className="text-2xl sm:text-3xl md:text-[34px] font-extrabold text-[#3B2C37] flex items-center justify-center gap-2">
                <span>Cậu sẽ đến chứ?</span>
                <span className="text-2xl sm:text-3xl">💌</span>
              </h2>
              <p className="mt-2 text-sm sm:text-base text-[#775C6F] font-medium">
                Điền thông tin bên dưới để chúng tớ nắm số lượng nhé!
              </p>
            </div>

            {errorMsg && (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 text-sm font-semibold text-center animate-shake">
                {errorMsg}
              </div>
            )}

            {/* Field 1: Tên của cậu */}
            <div>
              <label className="block text-sm sm:text-base font-bold text-[#3B2C37] mb-2">
                Tên của cậu
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ví dụ: Đào Duy Tuấn"
                className="w-full px-4 sm:px-5 py-3 sm:py-3.5 rounded-2xl bg-[#FFF5F7] border border-[#FFCCD7] focus:border-[#FF6E97] focus:bg-white focus:outline-none focus:ring-3 focus:ring-[#FF6E97]/20 text-[#3B2C37] placeholder-[#B49AA9] text-base font-medium transition-all"
                required
              />
            </div>

            {/* Field 2: Cậu đến từ ban nào dzo? */}
            <div>
              <label className="block text-sm sm:text-base font-bold text-[#3B2C37] mb-2">
                Cậu đến từ ban nào dzo?
              </label>
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="Ví dụ: Ban Rap"
                className="w-full px-4 sm:px-5 py-3 sm:py-3.5 rounded-2xl bg-[#FFF5F7] border border-[#FFCCD7] focus:border-[#FF6E97] focus:bg-white focus:outline-none focus:ring-3 focus:ring-[#FF6E97]/20 text-[#3B2C37] placeholder-[#B49AA9] text-base font-medium transition-all"
                required
              />
            </div>

            {/* Field 3: Cậu học khóa bao nhiêu? */}
            <div>
              <label className="block text-sm sm:text-base font-bold text-[#3B2C37] mb-2">
                Cậu học khóa bao nhiêu?
              </label>
              <input
                type="text"
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                placeholder="Ví dụ: K20 meow"
                className="w-full px-4 sm:px-5 py-3 sm:py-3.5 rounded-2xl bg-[#FFF5F7] border border-[#FFCCD7] focus:border-[#FF6E97] focus:bg-white focus:outline-none focus:ring-3 focus:ring-[#FF6E97]/20 text-[#3B2C37] placeholder-[#B49AA9] text-base font-medium transition-all"
                required
              />
            </div>

            {/* Khảo sát tham gia */}
            <div>
              <label className="block text-sm sm:text-base font-bold text-[#3B2C37] mb-2.5">
                Cậu có chắc chắn sẽ tham gia cùng chúng tớ không nè?
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {[
                  'Chắc chắn có mặt nha! 🥳',
                  'Tớ sẽ cố gắng đến nè 🥰',
                  'Tiếc quá tớ bận mất 🥺',
                ].map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setAttending(opt)}
                    className={`px-3.5 py-3 rounded-2xl text-xs sm:text-sm font-bold text-center border transition-all cursor-pointer ${
                      attending === opt
                        ? 'bg-[#FF6E97] text-white border-[#FF6E97] shadow-sm'
                        : 'bg-[#FFF5F7] text-[#6F5B68] border-[#FFCCD7] hover:bg-[#FFEBF0]'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            {/* Field 4: Lời nhắn gửi / Góp ý */}
            <div>
              <label className="block text-sm sm:text-base font-bold text-[#3B2C37] mb-2">
                Lời nhắn gửi hoặc món ăn/bài hát cậu thích <span className="text-xs font-normal text-[#917688]">(không bắt buộc)</span>
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="Ví dụ: Thích nghe nhạc acoustic, mong có bánh ngọt dâu tây meow~"
                className="w-full px-4 sm:px-5 py-3 rounded-2xl bg-[#FFF5F7] border border-[#FFCCD7] focus:border-[#FF6E97] focus:bg-white focus:outline-none focus:ring-3 focus:ring-[#FF6E97]/20 text-[#3B2C37] placeholder-[#B49AA9] text-base font-medium transition-all resize-none"
              />
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 rounded-2xl sm:rounded-full bg-[#FF759D] hover:bg-[#FF5A88] active:scale-[0.99] disabled:opacity-70 text-white font-extrabold text-base sm:text-lg transition-all duration-200 cute-btn-shadow cursor-pointer flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Đang gửi thông tin...</span>
                  </>
                ) : (
                  <>
                    <span>Hẹn cậu tối đó nha!</span>
                    <span>💖</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Footer Text matching Screenshot 2 */}
      <div className="text-center mt-7 sm:mt-9 text-sm sm:text-base font-medium text-[#775C6F] flex items-center justify-center gap-1.5 select-none">
        <span>iStar with luv</span>
        <span className="text-sm">🐾</span>
      </div>
    </section>
  );
};
