import React, { useState, useRef, useEffect, useCallback } from 'react';

// Declaration for YouTube Iframe API
declare global {
  interface Window {
    YT?: any;
    onYouTubeIframeAPIReady?: () => void;
  }
}

// Melody notes for "Ưng Quá Chừng" chorus (Music-box fallback if YouTube is blocked/fails)
// "Uầy uầy uầy meo meo meo meo trả lại tâm trí tôi đây..."
const MELODY_NOTES: { note: number; duration: number }[] = [
  { note: 392.0, duration: 0.25 }, // G4
  { note: 392.0, duration: 0.25 }, // G4
  { note: 392.0, duration: 0.4 },  // G4
  { note: 329.63, duration: 0.25 }, // E4
  { note: 329.63, duration: 0.25 }, // E4
  { note: 329.63, duration: 0.25 }, // E4
  { note: 329.63, duration: 0.4 },  // E4
  { note: 293.66, duration: 0.25 }, // D4
  { note: 293.66, duration: 0.25 }, // D4
  { note: 293.66, duration: 0.4 },  // D4
  { note: 261.63, duration: 0.5 },  // C4
  { note: 329.63, duration: 0.35 }, // E4
  { note: 392.0, duration: 0.35 },  // G4
  { note: 440.0, duration: 0.5 },   // A4
  { note: 392.0, duration: 0.35 },  // G4
  { note: 329.63, duration: 0.5 },  // E4
  { note: 293.66, duration: 0.5 },  // D4
  { note: 261.63, duration: 0.7 },  // C4
];

export const MusicPlayer: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [needsUserTap, setNeedsUserTap] = useState(true);
  const [usingFallback, setUsingFallback] = useState(false);

  const playerRef = useRef<any>(null);
  const fallbackAudioCtxRef = useRef<AudioContext | null>(null);
  const fallbackLoopTimerRef = useRef<any>(null);
  const fallbackIsPlayingRef = useRef(false);

  const videoId = '4qNALNWoGmI'; // Official AMEE - Ưng Quá Chừng

  // --- Fallback Web Audio Cute Music Box Player ---
  const stopFallbackMusic = useCallback(() => {
    fallbackIsPlayingRef.current = false;
    if (fallbackLoopTimerRef.current) {
      clearTimeout(fallbackLoopTimerRef.current);
      fallbackLoopTimerRef.current = null;
    }
  }, []);

  const playFallbackMelody = useCallback(() => {
    if (!fallbackIsPlayingRef.current) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!fallbackAudioCtxRef.current) {
        fallbackAudioCtxRef.current = new AudioCtx();
      }
      const ctx = fallbackAudioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      let currentTime = ctx.currentTime + 0.05;

      MELODY_NOTES.forEach((item) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        // Music-box bell tone: sine + soft harmonics
        osc.type = 'sine';
        osc.frequency.setValueAtTime(item.note, currentTime);

        // Music box envelope: crisp attack, gentle ring decay
        gain.gain.setValueAtTime(0.001, currentTime);
        gain.gain.linearRampToValueAtTime(0.18, currentTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, currentTime + item.duration * 0.95);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(currentTime);
        osc.stop(currentTime + item.duration);

        currentTime += item.duration;
      });

      // Loop after melody ends (~6.5 seconds)
      const totalDurationMs = (currentTime - ctx.currentTime) * 1000 + 400;
      fallbackLoopTimerRef.current = setTimeout(() => {
        if (fallbackIsPlayingRef.current) {
          playFallbackMelody();
        }
      }, totalDurationMs);
    } catch (e) {
      console.warn('Fallback Web Audio error:', e);
    }
  }, []);

  const startFallbackMusic = useCallback(() => {
    setUsingFallback(true);
    fallbackIsPlayingRef.current = true;
    setIsPlaying(true);
    setIsMuted(false);
    setNeedsUserTap(false);
    playFallbackMelody();
  }, [playFallbackMelody]);

  // --- Unmute and start real sound ---
  const triggerUnmuteAndPlay = useCallback(() => {
    setNeedsUserTap(false);

    if (usingFallback) {
      fallbackIsPlayingRef.current = true;
      playFallbackMelody();
      setIsPlaying(true);
      return;
    }

    if (playerRef.current) {
      try {
        if (typeof playerRef.current.unMute === 'function') {
          playerRef.current.unMute();
        }
        if (typeof playerRef.current.setVolume === 'function') {
          playerRef.current.setVolume(100);
        }
        if (typeof playerRef.current.playVideo === 'function') {
          playerRef.current.playVideo();
        }
        setIsPlaying(true);
        setIsMuted(false);
      } catch (err) {
        console.warn('Error unmuting YouTube player:', err);
        startFallbackMusic();
      }
    }
  }, [usingFallback, playFallbackMelody, startFallbackMusic]);

  // --- Toggle Play / Pause ---
  const togglePlay = () => {
    if (usingFallback) {
      if (isPlaying) {
        stopFallbackMusic();
        setIsPlaying(false);
      } else {
        fallbackIsPlayingRef.current = true;
        playFallbackMelody();
        setIsPlaying(true);
      }
      return;
    }

    if (!playerRef.current) {
      triggerUnmuteAndPlay();
      return;
    }

    try {
      if (isPlaying) {
        playerRef.current.pauseVideo();
        setIsPlaying(false);
      } else {
        playerRef.current.unMute();
        playerRef.current.setVolume(100);
        playerRef.current.playVideo();
        setIsPlaying(true);
        setNeedsUserTap(false);
      }
    } catch (e) {
      console.warn('Toggle play error:', e);
      startFallbackMusic();
    }
  };

  // --- Toggle Mute ---
  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (usingFallback) {
      if (isMuted) {
        fallbackIsPlayingRef.current = true;
        playFallbackMelody();
        setIsMuted(false);
      } else {
        stopFallbackMusic();
        setIsMuted(true);
      }
      return;
    }

    if (!playerRef.current) return;
    try {
      if (isMuted) {
        playerRef.current.unMute();
        playerRef.current.setVolume(100);
        setIsMuted(false);
      } else {
        playerRef.current.mute();
        setIsMuted(true);
      }
    } catch (e) {
      console.warn('Toggle mute error:', e);
    }
  };

  // --- Initialize YouTube Player API ---
  useEffect(() => {
    let isCancelled = false;

    const initYT = () => {
      if (isCancelled) return;
      if (!window.YT || !window.YT.Player) return;

      try {
        playerRef.current = new window.YT.Player('yt-player-box', {
          height: '240',
          width: '240',
          videoId,
          playerVars: {
            autoplay: 1,
            mute: 1, // Start muted to bypass browser autoplay block
            loop: 1,
            playlist: videoId,
            controls: 0,
            showinfo: 0,
            modestbranding: 1,
            playsinline: 1,
            enablejsapi: 1,
            origin: window.location.origin,
          },
          events: {
            onReady: (event: any) => {
              if (isCancelled) return;
              try {
                event.target.playVideo();
              } catch (e) {}

              // Try immediately unmuting in case browser allows it
              setTimeout(() => {
                try {
                  event.target.unMute();
                  event.target.setVolume(100);
                  setIsPlaying(true);
                  setNeedsUserTap(false);
                } catch (e) {
                  // Browser policy blocked unmuted sound on mount; will unmute on first gesture
                }
              }, 600);
            },
            onStateChange: (event: any) => {
              if (isCancelled) return;
              if (window.YT) {
                if (event.data === window.YT.PlayerState.PLAYING) {
                  setIsPlaying(true);
                } else if (event.data === window.YT.PlayerState.PAUSED) {
                  setIsPlaying(false);
                } else if (event.data === window.YT.PlayerState.ENDED) {
                  event.target.playVideo();
                }
              }
            },
            onError: (err: any) => {
              console.warn('YouTube error encountered, switching to cute music-box fallback:', err);
              if (!isCancelled) {
                startFallbackMusic();
              }
            },
          },
        });
      } catch (e) {
        console.warn('Failed to construct YT.Player:', e);
      }
    };

    // If script is already loaded and YT is ready
    if (window.YT && window.YT.Player) {
      initYT();
    } else {
      // Wait for API callback
      const previousCallback = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        if (previousCallback) previousCallback();
        initYT();
      };

      // Fallback timer if YT API takes longer than 2.5s
      const fallbackTimer = setTimeout(() => {
        if (!playerRef.current && !usingFallback) {
          if (window.YT && window.YT.Player) {
            initYT();
          }
        }
      }, 2500);

      return () => {
        isCancelled = true;
        clearTimeout(fallbackTimer);
      };
    }

    return () => {
      isCancelled = true;
      if (playerRef.current && typeof playerRef.current.destroy === 'function') {
        try {
          playerRef.current.destroy();
        } catch (e) {}
      }
      stopFallbackMusic();
    };
  }, [videoId, startFallbackMusic, stopFallbackMusic, usingFallback]);

  // --- Listen for ANY user interaction on the entire page to unmute sound automatically ---
  useEffect(() => {
    const handleFirstGesture = () => {
      triggerUnmuteAndPlay();
      window.removeEventListener('click', handleFirstGesture);
      window.removeEventListener('touchstart', handleFirstGesture);
      window.removeEventListener('pointerdown', handleFirstGesture);
      window.removeEventListener('keydown', handleFirstGesture);
      window.removeEventListener('scroll', handleFirstGesture);
    };

    window.addEventListener('click', handleFirstGesture, { passive: true });
    window.addEventListener('touchstart', handleFirstGesture, { passive: true });
    window.addEventListener('pointerdown', handleFirstGesture, { passive: true });
    window.addEventListener('keydown', handleFirstGesture, { passive: true });
    window.addEventListener('scroll', handleFirstGesture, { passive: true });

    return () => {
      window.removeEventListener('click', handleFirstGesture);
      window.removeEventListener('touchstart', handleFirstGesture);
      window.removeEventListener('pointerdown', handleFirstGesture);
      window.removeEventListener('keydown', handleFirstGesture);
      window.removeEventListener('scroll', handleFirstGesture);
    };
  }, [triggerUnmuteAndPlay]);

  return (
    <aside aria-label="Music Player" className="fixed bottom-4 left-4 z-40 select-none">
      {/* 
        OFF-SCREEN YouTube Player container.
        Must NOT have `display: none` (hidden) or browsers freeze iframe execution!
      */}
      <div
        style={{
          position: 'fixed',
          top: '-9999px',
          left: '-9999px',
          width: '240px',
          height: '240px',
          opacity: 0.001,
          pointerEvents: 'none',
          zIndex: -99,
        }}
        aria-hidden="true"
      >
        <div id="yt-player-box" />
      </div>

      {/* Floating Cute Player Widget */}
      <div className="relative">
        {/* Pulsing prompt badge if waiting for initial user touch to unmute */}
        {needsUserTap && !isPlaying && (
          <div
            onClick={triggerUnmuteAndPlay}
            className="absolute -top-10 left-1 cursor-pointer whitespace-nowrap animate-bounce z-50"
          >
            <div className="bg-gradient-to-r from-[#FF5886] to-[#FF7B9E] text-white text-[11px] font-extrabold px-3.5 py-1 rounded-full shadow-lg border-2 border-white flex items-center gap-1.5 cute-shadow">
              <span>🎵 Chạm để bật nhạc Ưng Quá Chừng! 🌸</span>
            </div>
          </div>
        )}

        {/* Floating notes when playing */}
        {isPlaying && (
          <div className="absolute -top-7 left-3 pointer-events-none flex gap-2">
            <span
              className="text-[#FF6E97] font-bold text-sm"
              style={{ animation: 'float-note 2s ease-in-out infinite', animationDelay: '0s' }}
            >
              ♪
            </span>
            <span
              className="text-[#A0D2F4] font-bold text-base"
              style={{ animation: 'float-note 2.4s ease-in-out infinite', animationDelay: '0.6s' }}
            >
              ♫
            </span>
            <span
              className="text-[#FF9AA2] font-bold text-xs"
              style={{ animation: 'float-note 1.8s ease-in-out infinite', animationDelay: '1.1s' }}
            >
              🐾
            </span>
          </div>
        )}

        {/* Player Capsule */}
        <div
          className={`flex items-center gap-3 p-2 pr-4 rounded-full bg-white/95 backdrop-blur-md border-2 border-[#FFCCD7] shadow-xl transition-all duration-300 hover:border-[#FFAEC0] ${
            isPlaying ? 'ring-2 ring-[#FF6E97]/40 shadow-pink-200' : ''
          }`}
        >
          {/* Vinyl Disc Icon with Cat Paw */}
          <button
            onClick={togglePlay}
            type="button"
            className="relative w-11 h-11 rounded-full bg-gradient-to-tr from-[#3B2C37] via-[#2A1F27] to-[#4A3B45] flex items-center justify-center text-white shadow-md cursor-pointer group flex-shrink-0"
            title={isPlaying ? 'Tạm dừng nhạc' : 'Phát nhạc Ưng Quá Chừng'}
          >
            {/* Spinning Groove lines */}
            <div
              className={`w-full h-full rounded-full flex items-center justify-center transition-transform ${
                isPlaying ? 'animate-spin-slow' : ''
              }`}
            >
              <div className="w-8 h-8 rounded-full border border-gray-600/50 flex items-center justify-center">
                <div className="w-5 h-5 rounded-full bg-[#FF6E97] flex items-center justify-center text-[10px]">
                  🐱
                </div>
              </div>
            </div>

            {/* Play/Pause overlay badge */}
            <div className="absolute inset-0 rounded-full bg-black/35 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
              <span className="text-white text-xs">{isPlaying ? '❚❚' : '▶'}</span>
            </div>
          </button>

          {/* Song Info & Controls */}
          <div className="flex flex-col cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-[#3B2C37] truncate max-w-[140px] sm:max-w-[170px]">
                Ưng Quá Chừng 🌸
              </span>
              {isPlaying && (
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#FF6E97] animate-ping" />
              )}
            </div>
            <div className="flex items-center gap-2 text-[11px] text-[#775C6F] font-semibold">
              <span>{usingFallback ? 'Music Box' : 'AMEE'}</span>
              <span>•</span>
              <span className="text-[#FF5886]">
                {isPlaying ? 'Đang tự phát meow' : 'Chạm để phát'}
              </span>
            </div>
          </div>

          {/* Action Buttons in 3D Style */}
          <div className="flex items-center gap-1.5 ml-1">
            {/* Play / Pause Toggle Button */}
            <button
              onClick={togglePlay}
              type="button"
              className="w-8 h-8 rounded-full btn-3d-pink text-white flex items-center justify-center text-xs font-bold cursor-pointer select-none"
              title={isPlaying ? 'Tạm dừng' : 'Bật nhạc'}
            >
              {isPlaying ? '❚❚' : '▶'}
            </button>

            {/* Mute Toggle */}
            <button
              onClick={toggleMute}
              type="button"
              className="w-8 h-8 rounded-full btn-3d-secondary flex items-center justify-center text-xs cursor-pointer select-none"
              title={isMuted ? 'Bật âm thanh' : 'Tắt tiếng'}
            >
              {isMuted ? '🔇' : '🔊'}
            </button>
          </div>
        </div>

        {/* Small expanded drawer with cute lyrics or video link */}
        {isExpanded && (
          <div className="absolute bottom-16 left-0 w-64 bg-white/95 backdrop-blur-md rounded-2xl border-2 border-pink-200 p-3.5 shadow-2xl text-xs space-y-2 animate-scale-up z-50">
            <div className="flex items-center justify-between font-bold text-[#3B2C37]">
              <span>🎵 Ưng Quá Chừng - AMEE</span>
              <button
                onClick={() => setIsExpanded(false)}
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                ✕
              </button>
            </div>
            <p className="text-[#6F5B68] italic bg-pink-50/70 p-2 rounded-xl text-[11px] leading-relaxed">
              &quot;Uầy uầy uầy meo meo meo meo trả lại tâm trí tôi đây... Cứ như mèo con ngắm trăng sao mà ngắm ai hoài zậy? 🐾&quot;
            </p>
            <div className="flex items-center justify-between text-[11px] pt-1">
              <span className="text-gray-400">Nhạc tự phát 20/10</span>
              <a
                href="https://www.youtube.com/watch?v=4qNALNWoGmI"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#FF5886] hover:underline font-bold"
              >
                Xem trên YouTube ↗
              </a>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
