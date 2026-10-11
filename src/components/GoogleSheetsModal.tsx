import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import {
  googleSignIn,
  logout,
  getAccessToken,
  initAuth,
} from '../lib/firebase';
import {
  SurveySubmission,
  getStoredResponses,
  getStoredSheetId,
  saveStoredSheetId,
  createSurveySpreadsheet,
  syncAllSubmissionsToSheet,
  checkSpreadsheetAccess,
} from '../services/googleSheets';
import { GoogleSignInButton } from './GoogleSignInButton';
import { ConfirmationModal } from './ConfirmationModal';

interface GoogleSheetsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDataUpdated?: () => void;
}

export const GoogleSheetsModal: React.FC<GoogleSheetsModalProps> = ({
  isOpen,
  onClose,
  onDataUpdated,
}) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [accessToken, setToken] = useState<string | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [sheetId, setSheetId] = useState<string>('');
  const [customSheetInput, setCustomSheetInput] = useState<string>('');
  const [responses, setResponses] = useState<SurveySubmission[]>([]);
  const [isCreatingSheet, setIsCreatingSheet] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Confirmation Modal state for destructive operations
  const [confirmationState, setConfirmationState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    action: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    action: () => {},
  });

  useEffect(() => {
    const unsubscribe = initAuth(
      (user, token) => {
        setCurrentUser(user);
        setToken(token);
      },
      () => {
        setCurrentUser(null);
        setToken(null);
      }
    );

    const token = getAccessToken();
    if (token) setToken(token);

    const storedId = getStoredSheetId();
    if (storedId) {
      setSheetId(storedId);
      setCustomSheetInput(storedId);
    }

    setResponses(getStoredResponses());

    return () => unsubscribe();
  }, [isOpen]);

  const refreshResponses = () => {
    const list = getStoredResponses();
    setResponses(list);
    if (onDataUpdated) onDataUpdated();
  };

  const handleSignIn = async () => {
    setIsAuthLoading(true);
    setStatusMessage(null);
    try {
      const res = await googleSignIn();
      if (res) {
        setCurrentUser(res.user);
        setToken(res.accessToken);
        setStatusMessage({
          text: `Đã kết nối tài khoản Google: ${res.user.displayName || res.user.email}! 🌸`,
          type: 'success',
        });
      }
    } catch (err: any) {
      console.error(err);
      setStatusMessage({
        text: err.message || 'Không thể đăng nhập tài khoản Google.',
        type: 'error',
      });
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    setCurrentUser(null);
    setToken(null);
    setStatusMessage({
      text: 'Đã đăng xuất tài khoản Google.',
      type: 'info',
    });
  };

  const handleCreateSheet = async () => {
    const token = accessToken || getAccessToken();
    if (!token) {
      setStatusMessage({
        text: 'Cậu cần đăng nhập tài khoản Google trước khi tạo bảng tính nha!',
        type: 'error',
      });
      return;
    }

    setIsCreatingSheet(true);
    setStatusMessage(null);
    try {
      const newId = await createSurveySpreadsheet(token);
      setSheetId(newId);
      setCustomSheetInput(newId);
      setStatusMessage({
        text: 'Đã tạo mới Google Sheet thành công! Bảng tính đã sẵn sàng nhận dữ liệu.',
        type: 'success',
      });

      // Auto sync existing data
      const syncResult = await syncAllSubmissionsToSheet(token, newId);
      refreshResponses();
      if (syncResult.syncedCount > 0) {
        setStatusMessage({
          text: `Đã tạo Google Sheet mới và đồng bộ ${syncResult.syncedCount} phản hồi! 🎉`,
          type: 'success',
        });
      }
    } catch (err: any) {
      setStatusMessage({
        text: err.message || 'Lỗi khi tạo Google Sheet.',
        type: 'error',
      });
    } finally {
      setIsCreatingSheet(false);
    }
  };

  const handleSaveCustomSheet = async () => {
    let cleaned = customSheetInput.trim();
    if (!cleaned) {
      setStatusMessage({
        text: 'Vui lòng nhập ID hoặc link Google Sheet.',
        type: 'error',
      });
      return;
    }

    // If full URL pasted, extract ID
    const match = cleaned.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (match && match[1]) {
      cleaned = match[1];
    }

    const token = accessToken || getAccessToken();
    if (token) {
      try {
        await checkSpreadsheetAccess(token, cleaned);
      } catch (err: any) {
        setStatusMessage({
          text: err.message || 'Không thể truy cập Google Sheet này. Hãy kiểm tra quyền chỉnh sửa.',
          type: 'error',
        });
        return;
      }
    }

    saveStoredSheetId(cleaned);
    setSheetId(cleaned);
    setStatusMessage({
      text: 'Đã lưu liên kết Google Sheet thành công! 📄',
      type: 'success',
    });
  };

  const handleSyncAll = async () => {
    const token = accessToken || getAccessToken();
    if (!token) {
      setStatusMessage({
        text: 'Vui lòng đăng nhập Google để đồng bộ dữ liệu vào Google Sheet.',
        type: 'error',
      });
      return;
    }

    if (!sheetId) {
      setStatusMessage({
        text: 'Chưa có Google Sheet được liên kết. Vui lòng tạo hoặc nhập Sheet ID trước.',
        type: 'error',
      });
      return;
    }

    setIsSyncing(true);
    try {
      const result = await syncAllSubmissionsToSheet(token, sheetId);
      refreshResponses();
      if (result.errors > 0) {
        setStatusMessage({
          text: `Đã đồng bộ ${result.syncedCount} dòng, gặp lỗi ở ${result.errors} dòng.`,
          type: 'info',
        });
      } else {
        setStatusMessage({
          text: `Đã đồng bộ thành công ${result.syncedCount} phản hồi vào Google Sheets! 🌟`,
          type: 'success',
        });
      }
    } catch (err: any) {
      setStatusMessage({
        text: err.message || 'Lỗi khi đồng bộ vào Google Sheet.',
        type: 'error',
      });
    } finally {
      setIsSyncing(false);
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    if (responses.length === 0) {
      setStatusMessage({
        text: 'Chưa có dữ liệu nào để xuất tệp CSV.',
        type: 'info',
      });
      return;
    }

    const headers = ['Thời gian', 'Họ và tên', 'Ban', 'Khóa', 'Tham gia', 'Lời nhắn'];
    const rows = responses.map((r) => [
      `"${r.timestamp}"`,
      `"${r.name.replace(/"/g, '""')}"`,
      `"${r.department.replace(/"/g, '""')}"`,
      `"${r.grade.replace(/"/g, '""')}"`,
      `"${(r.attending || '').replace(/"/g, '""')}"`,
      `"${(r.notes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `danh_sach_khao_sat_20_10_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Destructive: Clear responses (requires explicit ConfirmationModal)
  const requestClearAllResponses = () => {
    setConfirmationState({
      isOpen: true,
      title: 'Xóa toàn bộ phản hồi đã lưu?',
      message:
        'Thao tác này sẽ xóa toàn bộ danh sách phản hồi khảo sát đã lưu trong ứng dụng này. Bạn có chắc chắn muốn tiếp tục không?',
      action: () => {
        try {
          localStorage.removeItem('istar_2010_survey_responses');
          refreshResponses();
          setStatusMessage({
            text: 'Đã xóa sạch dữ liệu phản hồi trong ứng dụng.',
            type: 'info',
          });
        } catch {
          // ignore
        }
        setConfirmationState((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  if (!isOpen) return null;

  const unsyncedCount = responses.filter((r) => !r.syncedToSheets).length;
  const filteredResponses = responses.filter(
    (r) =>
      r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.grade.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/45 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-[28px] sm:rounded-[36px] max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border-2 border-pink-200 overflow-hidden animate-scale-up">
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-pink-100 flex items-center justify-between bg-[#FFF5F7]">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">📊</span>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-[#3B2C37]">
                Quản Lý Dữ Liệu &amp; Google Sheets
              </h2>
              <p className="text-xs sm:text-sm text-[#775C6F]">
                Lưu trữ phản hồi khảo sát và tự động đồng bộ vào bảng tính
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white hover:bg-pink-100 text-gray-500 hover:text-gray-800 flex items-center justify-center transition-colors cursor-pointer text-lg font-bold border border-pink-100"
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6">
          {/* Status Message */}
          {statusMessage && (
            <div
              className={`p-3.5 rounded-2xl text-sm font-semibold flex items-center justify-between ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : statusMessage.type === 'error'
                  ? 'bg-rose-50 text-rose-800 border border-rose-200'
                  : 'bg-amber-50 text-amber-800 border border-amber-200'
              }`}
            >
              <span>{statusMessage.text}</span>
              <button
                onClick={() => setStatusMessage(null)}
                className="text-xs opacity-70 hover:opacity-100 ml-2"
              >
                ✕
              </button>
            </div>
          )}

          {/* Section 1: Google Account Connection */}
          <div className="p-4 sm:p-5 rounded-2xl bg-[#FFF9FA] border border-[#FFCCD7]">
            <h3 className="text-sm font-bold text-[#3B2C37] mb-3 flex items-center gap-2">
              <span>1. Trạng thái tài khoản Google</span>
            </h3>

            {currentUser ? (
              <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-pink-100">
                <div className="flex items-center gap-3">
                  {currentUser.photoURL ? (
                    <img
                      src={currentUser.photoURL}
                      alt="avatar"
                      className="w-10 h-10 rounded-full border border-pink-200 object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-pink-100 text-[#FF6E97] font-bold flex items-center justify-center">
                      {currentUser.displayName ? currentUser.displayName[0] : 'U'}
                    </div>
                  )}
                  <div>
                    <div className="text-sm font-bold text-[#3B2C37]">
                      {currentUser.displayName || 'Tài khoản Google'}
                    </div>
                    <div className="text-xs text-[#775C6F]">{currentUser.email}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2.5 py-1 rounded-full">
                    Đã cấp quyền Sheets ✓
                  </span>
                  <button
                    onClick={handleLogout}
                    className="px-3 py-1.5 text-xs font-semibold rounded-lg text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-colors cursor-pointer"
                  >
                    Đăng xuất
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-xl border border-pink-100">
                <p className="text-xs sm:text-sm text-[#775C6F]">
                  Đăng nhập để cho phép ứng dụng tạo và ghi phản hồi khảo sát vào Google Sheets của bạn.
                </p>
                <GoogleSignInButton onClick={handleSignIn} isLoading={isAuthLoading} />
              </div>
            )}
          </div>

          {/* Section 2: Google Sheets Connection */}
          <div className="p-4 sm:p-5 rounded-2xl bg-[#FFF9FA] border border-[#FFCCD7]">
            <h3 className="text-sm font-bold text-[#3B2C37] mb-3 flex items-center gap-2">
              <span>2. Bảng tính Google Sheets</span>
            </h3>

            <div className="space-y-3">
              {sheetId ? (
                <div className="bg-white p-4 rounded-xl border border-pink-100 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">📄</span>
                      <span className="text-sm font-bold text-[#3B2C37]">Sheet ID:</span>
                      <code className="text-xs bg-pink-50 text-pink-700 px-2 py-1 rounded font-mono break-all max-w-xs">
                        {sheetId}
                      </code>
                    </div>

                    <a
                      href={`https://docs.google.com/spreadsheets/d/${sheetId}/edit`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors"
                    >
                      <span>Mở Google Sheet</span>
                      <span>↗</span>
                    </a>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-gray-100">
                    <button
                      onClick={handleSyncAll}
                      disabled={isSyncing}
                      className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-[#FF6E97] hover:bg-[#FF5886] disabled:opacity-60 rounded-full transition-all cursor-pointer cute-shadow-sm"
                    >
                      {isSyncing ? (
                        <>
                          <span className="animate-spin text-xs">🌀</span>
                          <span>Đang đồng bộ...</span>
                        </>
                      ) : (
                        <>
                          <span>Đồng bộ dữ liệu ({unsyncedCount} chưa gửi)</span>
                          <span>🔄</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={handleCreateSheet}
                      disabled={isCreatingSheet}
                      className="inline-flex items-center gap-1 px-3 py-2 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors cursor-pointer"
                    >
                      <span>Tạo Sheet mới khác</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-white p-4 rounded-xl border border-pink-100 space-y-4">
                  <div className="flex flex-col sm:flex-row items-center gap-3">
                    <button
                      onClick={handleCreateSheet}
                      disabled={isCreatingSheet}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full bg-[#FF6E97] hover:bg-[#FF5886] active:scale-95 text-white font-bold text-sm cute-shadow-sm transition-all cursor-pointer"
                    >
                      {isCreatingSheet ? (
                        <span>Đang tạo Sheet...</span>
                      ) : (
                        <>
                          <span>Tạo mới Google Sheet tự động</span>
                          <span>✨</span>
                        </>
                      )}
                    </button>
                    <span className="text-xs text-gray-400 font-medium">hoặc liên kết sheet có sẵn:</span>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      value={customSheetInput}
                      onChange={(e) => setCustomSheetInput(e.target.value)}
                      placeholder="Dán URL hoặc Spreadsheet ID..."
                      className="flex-1 px-3.5 py-2 rounded-xl text-xs sm:text-sm border border-gray-200 focus:outline-none focus:border-[#FF6E97]"
                    />
                    <button
                      onClick={handleSaveCustomSheet}
                      className="px-4 py-2 rounded-xl bg-gray-800 hover:bg-black text-white text-xs font-bold transition-colors cursor-pointer"
                    >
                      Lưu liên kết
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Section 3: Submissions Table */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h3 className="text-sm font-bold text-[#3B2C37] flex items-center gap-2">
                <span>3. Danh sách phản hồi khảo sát ({responses.length})</span>
                {unsyncedCount > 0 && (
                  <span className="text-xs font-semibold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                    {unsyncedCount} chưa lên Sheet
                  </span>
                )}
              </h3>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleExportCSV}
                  className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <span>Xuất CSV</span>
                  <span>📥</span>
                </button>
                <button
                  onClick={requestClearAllResponses}
                  className="px-3 py-1.5 rounded-lg border border-rose-200 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                >
                  Xóa dữ liệu
                </button>
              </div>
            </div>

            {/* Search Input */}
            <div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm kiếm theo tên, ban, khóa..."
                className="w-full px-3.5 py-2 rounded-xl text-xs sm:text-sm bg-gray-50 border border-gray-200 focus:outline-none focus:border-[#FF6E97]"
              />
            </div>

            {/* Responses List / Table */}
            <div className="border border-pink-100 rounded-2xl overflow-hidden bg-white">
              {filteredResponses.length === 0 ? (
                <div className="py-10 text-center text-sm text-[#8E7886]">
                  Chưa có người nào điền khảo sát nè meow~ 🐾
                </div>
              ) : (
                <div className="overflow-x-auto max-h-72">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#FFF5F7] text-[#4A3543] font-bold border-b border-pink-100 sticky top-0">
                      <tr>
                        <th className="p-3">Họ và tên</th>
                        <th className="p-3">Ban</th>
                        <th className="p-3">Khóa</th>
                        <th className="p-3">Tham gia?</th>
                        <th className="p-3">Lời nhắn</th>
                        <th className="p-3">Thời gian</th>
                        <th className="p-3 text-right">Sheet</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredResponses.map((item) => (
                        <tr key={item.id} className="hover:bg-pink-50/40 transition-colors">
                          <td className="p-3 font-bold text-[#3B2C37]">{item.name}</td>
                          <td className="p-3 text-gray-600">{item.department}</td>
                          <td className="p-3 text-gray-600">{item.grade}</td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 rounded-full bg-pink-100 text-[#FF5886] font-semibold text-[11px]">
                              {item.attending || 'Có'}
                            </span>
                          </td>
                          <td className="p-3 text-gray-500 max-w-xs truncate" title={item.notes}>
                            {item.notes || '—'}
                          </td>
                          <td className="p-3 text-gray-400 whitespace-nowrap">{item.timestamp}</td>
                          <td className="p-3 text-right whitespace-nowrap">
                            {item.syncedToSheets ? (
                              <span className="text-emerald-600 font-bold" title="Đã lưu vào Google Sheet">
                                ✓ Đã lưu
                              </span>
                            ) : (
                              <span className="text-amber-500 font-semibold" title="Chưa đồng bộ lên Sheet">
                                Chờ đồng bộ
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-pink-100 bg-[#FFF9FA] flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-full bg-[#FF6E97] hover:bg-[#FF5886] text-white font-bold text-sm cursor-pointer transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>

      {/* Confirmation Modal for destructive clear */}
      <ConfirmationModal
        isOpen={confirmationState.isOpen}
        title={confirmationState.title}
        message={confirmationState.message}
        onConfirm={confirmationState.action}
        onCancel={() => setConfirmationState((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};
