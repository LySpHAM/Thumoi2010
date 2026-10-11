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
  getStoredWebhookUrl,
  saveStoredWebhookUrl,
  sendSubmissionToWebhook,
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
  const [activeTab, setActiveTab] = useState<'webhook' | 'oauth' | 'responses'>('webhook');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [accessToken, setToken] = useState<string | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [sheetId, setSheetId] = useState<string>('');
  const [customSheetInput, setCustomSheetInput] = useState<string>('');
  const [webhookUrlInput, setWebhookUrlInput] = useState<string>('');
  const [responses, setResponses] = useState<SurveySubmission[]>([]);
  const [isCreatingSheet, setIsCreatingSheet] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isTestingWebhook, setIsTestingWebhook] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDomainUnauthorized, setIsDomainUnauthorized] = useState(false);
  const [copiedDomain, setCopiedDomain] = useState(false);
  const [copiedScript, setCopiedScript] = useState(false);

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

    const storedWebhook = getStoredWebhookUrl() || '';
    setWebhookUrlInput(storedWebhook);

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
    setIsDomainUnauthorized(false);
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
      console.error('Sign-in error:', err);
      if (
        err.code === 'auth/unauthorized-domain' ||
        err.message?.includes('unauthorized-domain')
      ) {
        setIsDomainUnauthorized(true);
        setStatusMessage({
          text: 'Tên miền chưa được thêm vào Authorized Domains của Firebase. Bạn có thể dùng Cách 1 (Webhook) ở tab bên cạnh để kết nối ngay mà không cần cấu hình domain!',
          type: 'error',
        });
      } else {
        setStatusMessage({
          text: err.message || 'Không thể đăng nhập tài khoản Google.',
          type: 'error',
        });
      }
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

  const handleCopyDomain = () => {
    navigator.clipboard.writeText(window.location.hostname);
    setCopiedDomain(true);
    setTimeout(() => setCopiedDomain(false), 2500);
  };

  const appsScriptCode = `function doPost(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var data = {};
  
  if (e && e.postData && e.postData.contents) {
    try {
      data = JSON.parse(e.postData.contents);
    } catch (err) {
      data = e.parameter || {};
    }
  } else if (e && e.parameter) {
    data = e.parameter;
  } else {
    // Dữ liệu mẫu khi bấm nút "▶ Chạy" trực tiếp trong Apps Script
    data = {
      timestamp: new Date().toLocaleString(),
      name: "Chạy thử thành công 🌸",
      department: "Ban Rap",
      grade: "K20",
      attending: "Chắc chắn có mặt nha! 🥳",
      notes: "Kiểm tra kết nối Google Sheet"
    };
  }

  sheet.appendRow([
    data.timestamp || new Date().toLocaleString(),
    data.name || "Ẩn danh",
    data.department || "",
    data.grade || "",
    data.attending || "",
    data.notes || ""
  ]);

  return ContentService.createTextOutput(JSON.stringify({ status: "success" })).setMimeType(ContentService.MimeType.JSON);
}

function doGet(e) {
  return doPost(e);
}`;

  const handleCopyScript = () => {
    navigator.clipboard.writeText(appsScriptCode);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2500);
  };

  const handleSaveWebhook = () => {
    const cleaned = webhookUrlInput.trim();
    saveStoredWebhookUrl(cleaned);
    setStatusMessage({
      text: cleaned ? 'Đã lưu liên kết Google Apps Script Webhook thành công! 🎉 Giờ đây mọi phản hồi sẽ tự động lưu vào Google Sheet.' : 'Đã xóa Webhook.',
      type: 'success',
    });
    if (onDataUpdated) onDataUpdated();
  };

  const handleTestWebhook = async () => {
    const url = webhookUrlInput.trim();
    if (!url) {
      setStatusMessage({
        text: 'Vui lòng dán URL Webhook trước khi kiểm tra!',
        type: 'error',
      });
      return;
    }

    setIsTestingWebhook(true);
    setStatusMessage(null);

    const testSubmission: SurveySubmission = {
      id: 'test_' + Date.now(),
      timestamp: new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }),
      name: 'Thử nghiệm hệ thống 🌸',
      department: 'Ban Test',
      grade: 'K20',
      attending: 'Có mặt 💖',
      notes: 'Dòng kiểm tra kết nối từ website iStar 20/10',
    };

    try {
      await sendSubmissionToWebhook(url, testSubmission);
      setStatusMessage({
        text: 'Đã gửi lệnh kiểm tra tới Google Sheet! Bạn hãy mở file Google Sheet để xem dòng mới xuất hiện nhé! ✨',
        type: 'success',
      });
    } catch {
      setStatusMessage({
        text: 'Không thể kết nối tới URL Webhook này. Vui lòng kiểm tra lại quyền truy cập (Who has access: Anyone).',
        type: 'error',
      });
    } finally {
      setIsTestingWebhook(false);
    }
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
    // 1. If Webhook exists, push unsynced to Webhook
    const webhookUrl = getStoredWebhookUrl();
    if (webhookUrl) {
      setIsSyncing(true);
      const unsynced = responses.filter((r) => !r.syncedToSheets);
      let count = 0;
      for (const item of unsynced) {
        await sendSubmissionToWebhook(webhookUrl, item);
        count++;
      }
      refreshResponses();
      setIsSyncing(false);
      setStatusMessage({
        text: `Đã đồng bộ ${count} phản hồi qua Google Sheet Webhook! ✨`,
        type: 'success',
      });
      return;
    }

    // 2. Otherwise use OAuth
    const token = accessToken || getAccessToken();
    if (!token) {
      setStatusMessage({
        text: 'Vui lòng cấu hình Webhook (Tab 1) hoặc Đăng nhập Google (Tab 2) để đồng bộ.',
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
      setStatusMessage({
        text: `Đã đồng bộ thành công ${result.syncedCount} phản hồi vào Google Sheets! 🌟`,
        type: 'success',
      });
    } catch (err: any) {
      setStatusMessage({
        text: err.message || 'Lỗi khi đồng bộ vào Google Sheet.',
        type: 'error',
      });
    } finally {
      setIsSyncing(false);
    }
  };

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

  const requestClearAllResponses = () => {
    setConfirmationState({
      isOpen: true,
      title: 'Xác thực bảo mật để xóa dữ liệu',
      message:
        'Hành động này sẽ xóa sạch toàn bộ danh sách phản hồi khảo sát đã lưu. Chỉ người quản trị có mã bảo mật mới có quyền thực hiện thao tác này.',
      action: () => {
        try {
          localStorage.removeItem('istar_2010_survey_responses');
          refreshResponses();
          setStatusMessage({
            text: 'Đã xác thực mã bảo mật thành công và xóa sạch danh sách phản hồi.',
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

  const isWebhookActive = Boolean(webhookUrlInput.trim());

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/45 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-[28px] sm:rounded-[36px] max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border-2 border-pink-200 overflow-hidden animate-scale-up">
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-pink-100 flex items-center justify-between bg-[#FFF5F7]">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">📊</span>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-[#3B2C37]">
                Lưu Trữ Dữ Liệu &amp; Google Sheets
              </h2>
              <p className="text-xs sm:text-sm text-[#775C6F]">
                Thu thập phản hồi khảo sát và tự động lưu vào Google Sheets
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

        {/* Tab Navigation */}
        <div className="flex border-b border-pink-100 bg-pink-50/50 px-6 pt-2 gap-2 text-xs sm:text-sm font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('webhook')}
            className={`py-2.5 px-4 rounded-t-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'webhook'
                ? 'bg-white text-[#FF5886] border-t-2 border-x border-[#FFCCD7] shadow-xs'
                : 'text-gray-600 hover:text-[#3B2C37]'
            }`}
          >
            <span>⭐ Kết nối Webhook (Khuyên dùng)</span>
            {isWebhookActive && <span className="w-2 h-2 rounded-full bg-emerald-500"></span>}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('responses')}
            className={`py-2.5 px-4 rounded-t-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'responses'
                ? 'bg-white text-[#FF5886] border-t-2 border-x border-[#FFCCD7] shadow-xs'
                : 'text-gray-600 hover:text-[#3B2C37]'
            }`}
          >
            <span>Danh sách phản hồi</span>
            <span className="px-1.5 py-0.2 rounded-full bg-pink-100 text-[#FF5886] text-[11px]">
              {responses.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('oauth')}
            className={`py-2.5 px-4 rounded-t-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'oauth'
                ? 'bg-white text-[#FF5886] border-t-2 border-x border-[#FFCCD7] shadow-xs'
                : 'text-gray-600 hover:text-[#3B2C37]'
            }`}
          >
            <span>Đăng nhập Google (OAuth)</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5">
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
                className="text-xs opacity-70 hover:opacity-100 ml-2 cursor-pointer"
              >
                ✕
              </button>
            </div>
          )}

          {/* TAB 1: WEBHOOK (RECOMMENDED, 0-ERROR) */}
          {activeTab === 'webhook' && (
            <div className="space-y-4">
              <div className="p-4 sm:p-5 rounded-2xl bg-emerald-50/60 border border-emerald-200">
                <div className="flex items-center gap-2 mb-2 font-bold text-emerald-900 text-sm sm:text-base">
                  <span>✨</span>
                  <span>Phương pháp tốt nhất cho Google Sheets (Không lo lỗi domain)</span>
                </div>
                <p className="text-xs sm:text-sm text-emerald-800 leading-relaxed">
                  Với Google Apps Script Webhook, bất cứ ai vào trang web điền khảo sát, thông tin sẽ được tự động lưu trực tiếp vào Google Sheet của bạn. Người dùng <strong>không cần đăng nhập Google</strong> và <strong>không bao giờ bị lỗi unauthorized domain</strong>!
                </p>
              </div>

              {/* Webhook Input Card */}
              <div className="p-4 sm:p-5 rounded-2xl bg-[#FFF9FA] border border-[#FFCCD7] space-y-3">
                <label className="block text-sm font-bold text-[#3B2C37]">
                  Dán URL Google Apps Script Webhook của bạn:
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="url"
                    value={webhookUrlInput}
                    onChange={(e) => setWebhookUrlInput(e.target.value)}
                    placeholder="https://script.google.com/macros/s/.../exec"
                    className="flex-1 px-4 py-2.5 rounded-xl text-xs sm:text-sm border border-gray-300 focus:outline-none focus:border-[#FF6E97] bg-white text-[#3B2C37]"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleSaveWebhook}
                      className="px-5 py-2.5 rounded-xl bg-[#FF6E97] hover:bg-[#FF5886] text-white text-xs sm:text-sm font-bold transition-colors cursor-pointer"
                    >
                      Lưu Webhook
                    </button>
                    {webhookUrlInput && (
                      <button
                        type="button"
                        onClick={handleTestWebhook}
                        disabled={isTestingWebhook}
                        className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold transition-colors cursor-pointer disabled:opacity-60"
                      >
                        {isTestingWebhook ? 'Đang gửi...' : '🧪 Gửi thử'}
                      </button>
                    )}
                  </div>
                </div>

                {isWebhookActive && (
                  <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 bg-emerald-100/60 p-2.5 rounded-xl">
                    <span>✓</span>
                    <span>Webhook đang hoạt động! Khảo sát gửi từ form sẽ tự động ghi vào Google Sheet.</span>
                  </div>
                )}
              </div>

              {/* Step by Step Setup Guide */}
              <div className="p-4 sm:p-5 rounded-2xl bg-white border border-gray-200 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h4 className="text-sm font-bold text-[#3B2C37]">
                    📖 Hướng dẫn tạo Webhook Google Sheet (chỉ mất 1 phút):
                  </h4>
                  <button
                    type="button"
                    onClick={handleCopyScript}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-pink-50 hover:bg-pink-100 text-[#FF5886] text-xs font-bold border border-pink-200 transition-colors cursor-pointer"
                  >
                    <span>{copiedScript ? '✓ Đã sao chép mã!' : '📋 Sao chép mã Apps Script'}</span>
                  </button>
                </div>

                <div className="bg-gray-900 text-gray-100 p-3.5 rounded-xl text-xs font-mono overflow-x-auto relative">
                  <pre>{appsScriptCode}</pre>
                </div>

                <ol className="list-decimal list-inside text-xs text-[#554250] space-y-2 leading-relaxed">
                  <li>
                    Mở file Google Sheet của bạn &gt; chọn menu <strong>Tiện ích mở rộng (Extensions)</strong> &gt; chọn <strong>Apps Script</strong>.
                  </li>
                  <li>
                    Xóa hết mã cũ trong file <code className="bg-gray-100 px-1 py-0.5 rounded">Mã.gs</code>, dán đoạn mã bên trên vào và bấm biểu tượng <strong>Lưu</strong> (💾).
                  </li>
                  <li>
                    Nhấn nút xanh <strong>Triển khai (Deploy)</strong> &gt; chọn <strong>Triển khai mới (New deployment)</strong>.
                  </li>
                  <li>
                    Bấm icon bánh răng ⚙️ &gt; chọn loại <strong>Ứng dụng web (Web app)</strong>.
                  </li>
                  <li>
                    Ở mục <em>Thực thi dưới dạng (Execute as)</em>: Chọn <strong>Tôi (Me)</strong>.
                  </li>
                  <li>
                    Ở mục <em>Ai có quyền truy cập (Who has access)</em>: Chọn <strong>Bất kỳ ai (Anyone)</strong>.
                  </li>
                  <li>
                    Bấm <strong>Triển khai</strong> &gt; Cho phép quyền &gt; Sao chép <strong>URL ứng dụng web</strong> dán vào ô bên trên và bấm <strong>Lưu Webhook</strong>!
                  </li>
                </ol>
              </div>
            </div>
          )}

          {/* TAB 2: RESPONSES TABLE */}
          {activeTab === 'responses' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold text-[#3B2C37] flex items-center gap-2">
                    <span>Danh sách phản hồi khảo sát ({responses.length})</span>
                    {unsyncedCount > 0 && (
                      <span className="text-xs font-semibold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                        {unsyncedCount} chưa lưu vào Sheet
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-[#775C6F]">
                    Dữ liệu luôn được lưu an toàn tại máy của bạn và có thể xuất ra file Excel/CSV bất cứ lúc nào.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleExportCSV}
                    className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <span>Xuất file Excel / CSV</span>
                    <span>📥</span>
                  </button>

                  {unsyncedCount > 0 && (
                    <button
                      onClick={handleSyncAll}
                      disabled={isSyncing}
                      className="px-3.5 py-2 rounded-xl bg-[#FF6E97] hover:bg-[#FF5886] text-white text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      {isSyncing ? 'Đang đồng bộ...' : 'Đồng bộ Sheet 🔄'}
                    </button>
                  )}

                  <button
                    onClick={requestClearAllResponses}
                    className="px-3 py-2 rounded-xl border border-rose-200 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                  >
                    Xóa sạch
                  </button>
                </div>
              </div>

              {/* Search */}
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm kiếm theo tên, ban, khóa..."
                className="w-full px-4 py-2.5 rounded-xl text-xs sm:text-sm bg-gray-50 border border-gray-200 focus:outline-none focus:border-[#FF6E97]"
              />

              {/* Table */}
              <div className="border border-pink-100 rounded-2xl overflow-hidden bg-white shadow-xs">
                {filteredResponses.length === 0 ? (
                  <div className="py-12 text-center text-sm text-[#8E7886]">
                    Chưa có phản hồi nào được gửi nè meow~ 🐾
                  </div>
                ) : (
                  <div className="overflow-x-auto max-h-80">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#FFF5F7] text-[#4A3543] font-bold border-b border-pink-100 sticky top-0">
                        <tr>
                          <th className="p-3">Họ và tên</th>
                          <th className="p-3">Ban</th>
                          <th className="p-3">Khóa</th>
                          <th className="p-3">Tham gia?</th>
                          <th className="p-3">Lời nhắn</th>
                          <th className="p-3">Thời gian</th>
                          <th className="p-3 text-right">Trạng thái Sheet</th>
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
                                <span className="text-emerald-600 font-bold">✓ Đã lưu</span>
                              ) : (
                                <span className="text-amber-500 font-semibold">Chờ đồng bộ</span>
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
          )}

          {/* TAB 3: OAUTH VIA FIREBASE */}
          {activeTab === 'oauth' && (
            <div className="space-y-4">
              {/* Domain Warning if unauthorized */}
              {isDomainUnauthorized && (
                <div className="p-4 sm:p-5 rounded-2xl bg-amber-50 border-2 border-amber-300 text-amber-900 space-y-3 animate-fade-in">
                  <div className="flex items-center gap-2 font-bold text-sm sm:text-base text-amber-800">
                    <span className="text-xl">⚠️</span>
                    <span>Tại sao gặp lỗi auth/unauthorized-domain?</span>
                  </div>
                  <p className="text-xs sm:text-sm text-amber-800 leading-relaxed">
                    Firebase chặn đăng nhập từ các tên miền chưa được thêm vào mục <strong>Authorized domains</strong>. Để dùng phương thức này, bạn chỉ cần thêm domain hiện tại vào Firebase Console:
                  </p>

                  <div className="bg-white p-3 rounded-xl border border-amber-200 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-gray-500">Domain cần thêm:</span>
                      <code className="text-xs font-mono font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded break-all">
                        {window.location.hostname}
                      </code>
                    </div>
                    <button
                      type="button"
                      onClick={handleCopyDomain}
                      className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-colors cursor-pointer"
                    >
                      {copiedDomain ? '✓ Đã sao chép!' : '📋 Sao chép Domain'}
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 pt-1">
                    <a
                      href="https://console.firebase.google.com/project/gen-lang-client-0076712275/authentication/settings"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#3B2C37] hover:bg-black text-white text-xs font-bold transition-colors"
                    >
                      <span>Mở Cài đặt Firebase Console &gt; Authorized Domains</span>
                      <span>↗</span>
                    </a>
                  </div>

                  <div className="pt-2 border-t border-amber-200 text-xs text-amber-800">
                    💡 <em>Gợi ý nhanh:</em> Bạn có thể chuyển sang <strong>Tab 1: Kết nối Webhook</strong> để lưu trực tiếp vào Google Sheet mà không cần cấu hình domain!
                  </div>
                </div>
              )}

              {/* Account Status */}
              <div className="p-4 sm:p-5 rounded-2xl bg-[#FFF9FA] border border-[#FFCCD7]">
                <h3 className="text-sm font-bold text-[#3B2C37] mb-3">
                  1. Tài khoản Google
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
                      Đăng nhập tài khoản Google để cấp quyền tạo và cập nhật bảng tính Google Sheets.
                    </p>
                    <GoogleSignInButton onClick={handleSignIn} isLoading={isAuthLoading} />
                  </div>
                )}
              </div>

              {/* Spreadsheets configuration */}
              <div className="p-4 sm:p-5 rounded-2xl bg-[#FFF9FA] border border-[#FFCCD7]">
                <h3 className="text-sm font-bold text-[#3B2C37] mb-3">
                  2. Bảng tính Google Sheets
                </h3>

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
                  </div>
                ) : (
                  <div className="bg-white p-4 rounded-xl border border-pink-100 space-y-3">
                    <button
                      onClick={handleCreateSheet}
                      disabled={isCreatingSheet}
                      className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-[#FF6E97] hover:bg-[#FF5886] text-white font-bold text-xs sm:text-sm transition-all cursor-pointer"
                    >
                      {isCreatingSheet ? 'Đang tạo Sheet...' : '✨ Tạo mới Google Sheet tự động'}
                    </button>
                    <div className="flex flex-col sm:flex-row gap-2 pt-2">
                      <input
                        type="text"
                        value={customSheetInput}
                        onChange={(e) => setCustomSheetInput(e.target.value)}
                        placeholder="Dán link hoặc Sheet ID..."
                        className="flex-1 px-3.5 py-2 rounded-xl text-xs border border-gray-200"
                      />
                      <button
                        onClick={handleSaveCustomSheet}
                        className="px-4 py-2 rounded-xl bg-gray-800 text-white text-xs font-bold"
                      >
                        Lưu liên kết
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
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

      {/* Confirmation Modal with Security Passcode */}
      <ConfirmationModal
        isOpen={confirmationState.isOpen}
        title={confirmationState.title}
        message={confirmationState.message}
        requiredSecurityCode="istar"
        confirmLabel="Xác nhận xóa"
        onConfirm={confirmationState.action}
        onCancel={() => setConfirmationState((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};
