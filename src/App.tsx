/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { FloatingDecorations } from './components/FloatingDecorations';
import { HeroSection } from './components/HeroSection';
import { InfoCards } from './components/InfoCards';
import { SurveyForm } from './components/SurveyForm';
import { GoogleSheetsModal } from './components/GoogleSheetsModal';
import { MusicPlayer } from './components/MusicPlayer';
import { getStoredResponses, getStoredSheetId, getStoredWebhookUrl } from './services/googleSheets';
import { initAuth, getAccessToken } from './lib/firebase';
import { User } from 'firebase/auth';

export default function App() {
  const formRef = useRef<HTMLDivElement | null>(null);
  const [isSheetsModalOpen, setIsSheetsModalOpen] = useState(false);
  const [responseCount, setResponseCount] = useState(0);
  const [hasSheetLinked, setHasSheetLinked] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    // Check initial responses count & sheet status
    const list = getStoredResponses();
    setResponseCount(list.length);
    const isLinked = Boolean(getStoredSheetId() || getStoredWebhookUrl());
    setHasSheetLinked(isLinked);

    const unsubscribe = initAuth(
      (user) => {
        setCurrentUser(user);
        const linked = Boolean(getStoredSheetId() || localStorage.getItem('istar_2010_webhook_url'));
        setHasSheetLinked(linked);
      },
      () => {
        setCurrentUser(null);
      }
    );

    return () => unsubscribe();
  }, []);

  const handleScrollToForm = () => {
    if (formRef.current) {
      formRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleDataUpdated = () => {
    const list = getStoredResponses();
    setResponseCount(list.length);
    const linked = Boolean(getStoredSheetId() || getStoredWebhookUrl());
    setHasSheetLinked(linked);
  };

  return (
    <div className="min-h-screen bg-[#FFF2F4] text-[#443341] relative selection:bg-pink-200 selection:text-pink-900 overflow-x-hidden font-['Nunito',sans-serif]">
      {/* Background Floating Decorative Paws & Fish */}
      <FloatingDecorations />

      {/* Top Floating Control Bar for Organizer / Google Sheets */}
      <header className="relative z-30 max-w-5xl mx-auto px-4 pt-4 sm:pt-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl sm:text-2xl">🐾</span>
          <span className="font-extrabold text-[#3B2C37] text-sm sm:text-base tracking-wide">
            iStar Party 20/10
          </span>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => setIsSheetsModalOpen(true)}
            className="group inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-full bg-white/90 hover:bg-white border border-[#FFCCD7] hover:border-[#FFAEC0] text-[#3B2C37] text-xs sm:text-sm font-bold shadow-xs hover:shadow-md transition-all cursor-pointer backdrop-blur-xs"
            title="Quản lý dữ liệu và Google Sheets"
          >
            <span className="text-sm">📊</span>
            <span className="hidden sm:inline">Google Sheets:</span>
            {hasSheetLinked ? (
              <span className="text-emerald-600 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Đã kết nối</span>
              </span>
            ) : (
              <span className="text-rose-500 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-rose-400"></span>
                <span>Chưa liên kết</span>
              </span>
            )}

            {responseCount > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full bg-pink-100 text-[#FF5886] text-[11px] font-extrabold">
                {responseCount}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Main Content Sections */}
      <main className="relative z-10 pb-16">
        {/* Section 1: Hero with cute cat, greeting & meo meo button */}
        <HeroSection onScrollToForm={handleScrollToForm} />

        {/* Section 2: Info Cards (Thời gian, Địa điểm, Chuẩn bị) */}
        <InfoCards />

        {/* Section 3: RSVP & Survey Form */}
        <SurveyForm
          formRef={formRef}
          onSubmissionSuccess={handleDataUpdated}
        />
      </main>

      {/* Modal for Google Sheets connection, auth, and response review */}
      <GoogleSheetsModal
        isOpen={isSheetsModalOpen}
        onClose={() => {
          setIsSheetsModalOpen(false);
          handleDataUpdated();
        }}
        onDataUpdated={handleDataUpdated}
      />
      {/* Floating Music Player for AMEE - Ưng Quá Chừng */}
      <MusicPlayer />
    </div>
  );
}
