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
          onOpenAdmin={() => setIsSheetsModalOpen(true)}
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
