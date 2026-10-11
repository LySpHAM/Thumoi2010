/**
 * Service for Google Sheets API operations and Webhook synchronization
 */

export interface SurveySubmission {
  id: string;
  timestamp: string;
  name: string;
  department: string;
  grade: string;
  attending: string;
  notes?: string;
  syncedToSheets?: boolean;
}

const STORAGE_KEY_RESPONSES = 'istar_2010_survey_responses';
const STORAGE_KEY_SHEET_ID = 'istar_2010_spreadsheet_id';
const STORAGE_KEY_WEBHOOK_URL = 'istar_2010_webhook_url';

export const getStoredResponses = (): SurveySubmission[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_RESPONSES);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const saveResponseLocally = (submission: SurveySubmission): SurveySubmission[] => {
  const current = getStoredResponses();
  const updated = [submission, ...current.filter((item) => item.id !== submission.id)];
  try {
    localStorage.setItem(STORAGE_KEY_RESPONSES, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to save response to local storage:', e);
  }
  return updated;
};

export const updateResponseSyncStatus = (id: string, synced: boolean): void => {
  const current = getStoredResponses();
  const updated = current.map((r) => (r.id === id ? { ...r, syncedToSheets: synced } : r));
  try {
    localStorage.setItem(STORAGE_KEY_RESPONSES, JSON.stringify(updated));
  } catch {
    // ignore
  }
};

export const getStoredSheetId = (): string | null => {
  try {
    return localStorage.getItem(STORAGE_KEY_SHEET_ID);
  } catch {
    return null;
  }
};

export const saveStoredSheetId = (id: string): void => {
  try {
    localStorage.setItem(STORAGE_KEY_SHEET_ID, id);
  } catch {
    // ignore
  }
};

export const getStoredWebhookUrl = (): string | null => {
  try {
    return localStorage.getItem(STORAGE_KEY_WEBHOOK_URL);
  } catch {
    return null;
  }
};

export const saveStoredWebhookUrl = (url: string): void => {
  try {
    localStorage.setItem(STORAGE_KEY_WEBHOOK_URL, url);
  } catch {
    // ignore
  }
};

/**
 * Send submission to Google Sheets via Google Apps Script Web App Webhook
 */
export const sendSubmissionToWebhook = async (
  webhookUrl: string,
  submission: SurveySubmission
): Promise<boolean> => {
  const jsonBody = JSON.stringify(submission);
  let success = false;

  // Method 1: Fetch with 'text/plain;charset=utf-8' (CORS-safelisted header, works in no-cors)
  try {
    await fetch(webhookUrl, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: jsonBody,
    });
    success = true;
  } catch (err) {
    console.warn('Method 1 text/plain fetch failed:', err);
  }

  // Method 2: Fallback with URLSearchParams (also CORS-safelisted)
  if (!success) {
    try {
      const formData = new URLSearchParams();
      formData.append('timestamp', submission.timestamp);
      formData.append('name', submission.name);
      formData.append('department', submission.department);
      formData.append('grade', submission.grade);
      formData.append('attending', submission.attending);
      formData.append('notes', submission.notes || '');

      await fetch(webhookUrl, {
        method: 'POST',
        mode: 'no-cors',
        body: formData,
      });
      success = true;
    } catch (err) {
      console.warn('Method 2 form-data failed:', err);
    }
  }

  // Method 3: Fallback using navigator.sendBeacon
  if (!success && typeof navigator !== 'undefined' && navigator.sendBeacon) {
    try {
      const blob = new Blob([jsonBody], { type: 'text/plain' });
      navigator.sendBeacon(webhookUrl, blob);
      success = true;
    } catch (err) {
      console.warn('Method 3 sendBeacon failed:', err);
    }
  }

  if (success) {
    updateResponseSyncStatus(submission.id, true);
  }
  return success;
};

/**
 * Creates a formatted Google Sheet for the 20/10 party survey
 */
export const createSurveySpreadsheet = async (
  accessToken: string,
  title = 'Danh Sách Khảo Sát & Tham Gia Tiệc 20/10 - iStar'
): Promise<string> => {
  const payload = {
    properties: {
      title,
    },
    sheets: [
      {
        properties: {
          title: 'Phản Hồi',
          gridProperties: {
            frozenRowCount: 1,
          },
        },
        data: [
          {
            startRow: 0,
            startColumn: 0,
            rowData: [
              {
                values: [
                  { userEnteredValue: { stringValue: 'Thời gian gửi' } },
                  { userEnteredValue: { stringValue: 'Họ và tên' } },
                  { userEnteredValue: { stringValue: 'Ban' } },
                  { userEnteredValue: { stringValue: 'Khóa' } },
                  { userEnteredValue: { stringValue: 'Trạng thái tham gia' } },
                  { userEnteredValue: { stringValue: 'Lời nhắn / Nguyện vọng' } },
                ],
              },
            ],
          },
        ],
      },
    ],
  };

  const res = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Không thể tạo Google Sheet mới');
  }

  const data = await res.json();
  const spreadsheetId = data.spreadsheetId;
  saveStoredSheetId(spreadsheetId);
  return spreadsheetId;
};

/**
 * Appends a single submission row into the Google Sheet via OAuth access token
 */
export const appendRowToSheet = async (
  accessToken: string,
  spreadsheetId: string,
  submission: SurveySubmission
): Promise<boolean> => {
  const rowValues = [
    submission.timestamp,
    submission.name,
    submission.department,
    submission.grade,
    submission.attending || 'Có tham gia 💖',
    submission.notes || '',
  ];

  const range = 'Phản Hồi!A:F';
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(
    spreadsheetId
  )}/values/${encodeURIComponent(range)}:append?valueInputOption=USER_ENTERED`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      values: [rowValues],
    }),
  });

  if (!res.ok) {
    // If "Phản Hồi" tab doesn't exist, try appending to default range
    const fallbackRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(
        spreadsheetId
      )}/values/A1:append?valueInputOption=USER_ENTERED`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          values: [rowValues],
        }),
      }
    );

    if (!fallbackRes.ok) {
      const err = await fallbackRes.json().catch(() => ({}));
      throw new Error(err.error?.message || 'Lỗi khi ghi dữ liệu vào Google Sheet');
    }
  }

  updateResponseSyncStatus(submission.id, true);
  return true;
};

/**
 * Syncs all unsynced stored submissions to Google Sheets
 */
export const syncAllSubmissionsToSheet = async (
  accessToken: string,
  spreadsheetId: string
): Promise<{ syncedCount: number; errors: number }> => {
  const submissions = getStoredResponses();
  const unsynced = submissions.filter((s) => !s.syncedToSheets);

  if (unsynced.length === 0) {
    return { syncedCount: 0, errors: 0 };
  }

  let count = 0;
  let errors = 0;

  for (const item of unsynced) {
    try {
      await appendRowToSheet(accessToken, spreadsheetId, item);
      count++;
    } catch (e) {
      console.error(`Error syncing response ${item.id}:`, e);
      errors++;
    }
  }

  return { syncedCount: count, errors };
};

/**
 * Verify access to a spreadsheet ID
 */
export const checkSpreadsheetAccess = async (
  accessToken: string,
  spreadsheetId: string
): Promise<{ title: string; url: string }> => {
  const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    throw new Error('Không thể truy cập Google Sheet này. Hãy kiểm tra quyền truy cập.');
  }

  const data = await res.json();
  return {
    title: data.properties?.title || 'Google Sheet',
    url: `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`,
  };
};
