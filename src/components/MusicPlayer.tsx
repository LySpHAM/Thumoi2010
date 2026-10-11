import React, { useState, useRef, useEffect } from 'react';

export const MusicPlayer: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  const videoId = '4qNALNWoGmI'; // Official AMEE - Ưng Quá Chừng

  const sendIframeCommand = (func: string, args: any[] = []) => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      try {
        iframeRef.current.contentWindow.postMessage(
          JSON.stringify({
            event: 'command',
            func,
            args,
          }),
          '*'
        );
      } catch (err) {
        console.warn('Iframe postMessage error:', err);
      }
    }
  };

  const startPlayback = () => {
    sendIframeCommand('unMute');
    sendIframeCommand('playVideo');
    setIsPlaying(true);
  };

  const togglePlay = () => {
    if (isPlaying) {
      sendIframeCommand('pauseVideo');
      setIsPlaying(false);
    } else {
      startPlayback();
    }
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isMuted) {
      sendIframeCommand('unMute');
      setIsMuted(false);
    } else {
      sendIframeCommand('mute');
      setIsMuted(true);
    }
  };

  // Autoplay setup with automatic fallback on user interaction
  useEffect(() => {
    // Attempt play immediately on mount
    const timer1 = setTimeout(() => {
      startPlayback();
    }, 500);

    const timer2 = setTimeout(() => {
      startPlayback();
    }, 1500);

    // Browsers require user interaction to unmute/play audio; listen to first user action
    const onUserInteract = () => {
      startPlayback();
      // Remove listeners once interacted
      window.removeEventListener('click', onUserInteract);
      window.removeEventListener('touchstart', onUserInteract);
      window.removeEventListener('scroll', onUserInteract);
      window.removeEventListener('keydown', onUserInteract);
    };

    window.addEventListener('click', onUserInteract, { passive: true });
    window.addEventListener('touchstart', onUserInteract, { passive: true });
    window.addEventListener('scroll', onUserInteract, { passive: true });
    window.addEventListener('keydown', onUserInteract, { passive: true });

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      window.removeEventListener('click', onUserInteract);
      window.removeEventListener('touchstart', onUserInteract);
      window.removeEventListener('scroll', onUserInteract);
      window.removeEventListener('keydown', onUserInteract);
    };
  }, []);

  return (
    <aside aria-label="Music Player" className="fixed bottom-4 left-4 z-40 select-none">
      {/* Hidden YouTube Iframe that streams the audio */}
      <div className="hidden">
        <iframe
          ref={iframeRef}
          width="200"
          height="200"
          src={`https://www.youtube.com/embed/${videoId}?enablejsapi=1&autoplay=1&loop=1&playlist=${videoId}&controls=0&modestbranding=1&rel=0`}
          title="AMEE - Ưng Quá Chừng"
          allow="autoplay; encrypted-media"
          onLoad={() => {
            // Trigger play as soon as iframe loads
            startPlayback();
          }}
        />
      </div>

      {/* Floating Cute Player Widget */}
      <div className="relative">
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
            isPlaying ? 'ring-2 ring-[#FF6E97]/30' : ''
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
              <span>AMEE</span>
              <span>•</span>
              <span className="text-[#FF5886]">{isPlaying ? 'Đang tự phát meow' : 'Nhấn để nghe'}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1 ml-1">
            {/* Play / Pause Toggle Button */}
            <button
              onClick={togglePlay}
              type="button"
              className="w-8 h-8 rounded-full bg-[#FFF0F4] hover:bg-[#FFE0E9] text-[#FF5886] flex items-center justify-center text-xs font-bold transition-colors cursor-pointer"
              title={isPlaying ? 'Tạm dừng' : 'Bật nhạc'}
            >
              {isPlaying ? '❚❚' : '▶'}
            </button>

            {/* Mute Toggle */}
            <button
              onClick={toggleMute}
              type="button"
              className="w-8 h-8 rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-800 flex items-center justify-center text-xs transition-colors cursor-pointer"
              title={isMuted ? 'Bật âm thanh' : 'Tắt tiếng'}
            >
              {isMuted ? '🔇' : '🔊'}
            </button>
          </div>
        </div>

        {/* Small expanded drawer with cute lyrics or video link */}
        {isExpanded && (
          <div className="absolute bottom-16 left-0 w-64 bg-white/95 backdrop-blur-md rounded-2xl border-2 border-pink-200 p-3.5 shadow-2xl text-xs space-y-2 animate-scale-up">
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
