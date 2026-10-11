import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  User,
  signOut,
} from 'firebase/auth';
import firebaseConfig from '@/firebase-applet-config.json';

// Initialize Firebase App
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

export const SHEETS_SCOPE = 'https://www.googleapis.com/auth/spreadsheets';

const provider = new GoogleAuthProvider();
provider.addScope(SHEETS_SCOPE);
provider.setCustomParameters({
  prompt: 'select_account',
});

let isSigningIn = false;
let cachedAccessToken: string | null = null;

// Initialize auth state listener
export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user && cachedAccessToken) {
      if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
    } else if (user) {
      // User is logged into Firebase, but we need the OAuth credential token for Google Sheets API
      if (onAuthSuccess && cachedAccessToken) {
        onAuthSuccess(user, cachedAccessToken);
      } else {
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

// Sign in with Google Popup to obtain Sheets access token
export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Không thể lấy access token từ Google');
    }

    cachedAccessToken = credential.accessToken;
    // Keep in session memory for the current active session
    try {
      sessionStorage.setItem('temp_sheets_token', cachedAccessToken);
    } catch {
      // ignore
    }
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Lỗi đăng nhập Google:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = (): string | null => {
  if (cachedAccessToken) return cachedAccessToken;
  try {
    const stored = sessionStorage.getItem('temp_sheets_token');
    if (stored) {
      cachedAccessToken = stored;
      return stored;
    }
  } catch {
    // ignore
  }
  return null;
};

export const setAccessToken = (token: string | null) => {
  cachedAccessToken = token;
  if (token) {
    try {
      sessionStorage.setItem('temp_sheets_token', token);
    } catch {
      // ignore
    }
  } else {
    try {
      sessionStorage.removeItem('temp_sheets_token');
    } catch {
      // ignore
    }
  }
};

export const logout = async () => {
  await signOut(auth);
  cachedAccessToken = null;
  try {
    sessionStorage.removeItem('temp_sheets_token');
  } catch {
    // ignore
  }
};
