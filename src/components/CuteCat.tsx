import React, { useState } from 'react';

interface Particle {
  id: number;
  text: string;
  tx: number;
  ty: number;
  rot: number;
  size: string;
}

interface CuteCatProps {
  className?: string;
}

// Web Audio API purr & throat rumble synthesizer ("prrrr grrrr")
export const playCatPurrSound = () => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    const now = ctx.currentTime;
    const duration = 1.4;

    // 1. Cat Motor Purr Rumble (sawtooth ~26Hz modulated at ~22Hz)
    const purrOsc = ctx.createOscillator();
    const purrGain = ctx.createGain();
    const purrMod = ctx.createOscillator();
    const purrModGain = ctx.createGain();

    purrOsc.type = 'sawtooth';
    purrOsc.frequency.setValueAtTime(26, now);

    purrMod.type = 'sine';
    purrMod.frequency.setValueAtTime(22, now);
    purrModGain.gain.setValueAtTime(14, now);
    purrMod.connect(purrOsc.frequency);

    // Warm resonant lowpass filter for deep chest purr
    const purrFilter = ctx.createBiquadFilter();
    purrFilter.type = 'lowpass';
    purrFilter.frequency.setValueAtTime(170, now);

    purrGain.gain.setValueAtTime(0.01, now);
    purrGain.gain.linearRampToValueAtTime(0.24, now + 0.08);
    purrGain.gain.linearRampToValueAtTime(0.2, now + 0.8);
    purrGain.gain.linearRampToValueAtTime(0.001, now + duration);

    purrOsc.connect(purrFilter);
    purrFilter.connect(purrGain);
    purrGain.connect(ctx.destination);

    purrOsc.start(now);
    purrMod.start(now);
    purrOsc.stop(now + duration);
    purrMod.stop(now + duration);

    // 2. Throat Rasp Noise ("grrrrr" air vibration)
    // Generate 1 second of noise buffer
    const bufferSize = Math.floor(ctx.sampleRate * duration);
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;

    // Bandpass filter to isolate throat rasp frequencies (~280Hz)
    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.setValueAtTime(280, now);
    noiseFilter.Q.setValueAtTime(3.0, now);

    // Modulate noise with 22Hz LFO for fluttering "rrrrr / grrrrr" sound
    const noiseLfo = ctx.createOscillator();
    noiseLfo.type = 'sawtooth';
    noiseLfo.frequency.setValueAtTime(22, now);

    const noiseLfoGain = ctx.createGain();
    noiseLfoGain.gain.setValueAtTime(0.12, now);

    const noiseMasterGain = ctx.createGain();
    noiseMasterGain.gain.setValueAtTime(0.01, now);
    noiseMasterGain.gain.linearRampToValueAtTime(0.18, now + 0.1);
    noiseMasterGain.gain.linearRampToValueAtTime(0.14, now + 0.9);
    noiseMasterGain.gain.linearRampToValueAtTime(0.001, now + duration);

    whiteNoise.connect(noiseFilter);
    noiseFilter.connect(noiseMasterGain);
    noiseMasterGain.connect(ctx.destination);

    whiteNoise.start(now);
    whiteNoise.stop(now + duration);

    // 3. Sweet kitten chirrup meow accent (blends in gently)
    const meowOsc = ctx.createOscillator();
    const meowGain = ctx.createGain();
    meowOsc.type = 'sine';
    meowOsc.frequency.setValueAtTime(560, now);
    meowOsc.frequency.exponentialRampToValueAtTime(840, now + 0.18);
    meowOsc.frequency.exponentialRampToValueAtTime(480, now + 0.45);

    meowGain.gain.setValueAtTime(0.01, now);
    meowGain.gain.linearRampToValueAtTime(0.09, now + 0.08);
    meowGain.gain.exponentialRampToValueAtTime(0.001, now + 0.48);

    meowOsc.connect(meowGain);
    meowGain.connect(ctx.destination);

    meowOsc.start(now);
    meowOsc.stop(now + 0.5);
  } catch (e) {
    console.warn('Audio play purr error:', e);
  }
};

const PURR_SOUND_TEXTS = [
  'Prrrrr... Grrrrr~ 🐾💖',
  'Grrrrr~ Prrrrr... 💕',
  'Prrrr grrrr meowww~ 🥰',
  'Grrrr~ Xoa xoa meow~ 🐾',
  'Prrrrrr... Ưng quá chừng 💖',
  'Meo meo~ Prrrr Grrrr 🐾',
];

export const CuteCat: React.FC<CuteCatProps> = ({
  className = 'w-72 h-72 sm:w-[350px] sm:h-[350px] md:w-[400px] md:h-[400px] lg:w-[440px] lg:h-[440px]',
}) => {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [purrBubble, setPurrBubble] = useState<string | null>(null);
  const [isHappy, setIsHappy] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    // 1. Play realistic Web Audio "prrrr grrrr" purring rumble
    playCatPurrSound();

    // 2. Trigger squish & happy expression
    setIsHappy(true);
    setTimeout(() => setIsHappy(false), 900);

    // 3. Show comic purr sound bubble ("Prrrrr... Grrrrr~ 🐾💖")
    const randomText = PURR_SOUND_TEXTS[Math.floor(Math.random() * PURR_SOUND_TEXTS.length)];
    setPurrBubble(randomText);
    setTimeout(() => {
      setPurrBubble(null);
    }, 1900);

    // 4. Spawn vibrant burst of heart & paw particles radiating in all directions
    const icons = ['💖', '🐾', '💕', '🐾', '❤️', '🐾', '💗', '🐾', '💓', '✨', '🐾', '🌸', '💖', '🐾'];
    const newParticles: Particle[] = icons.map((icon, i) => {
      const angle = (i / icons.length) * 2 * Math.PI + (Math.random() * 0.4 - 0.2);
      const distance = 70 + Math.random() * 65;
      return {
        id: Date.now() + i + Math.random(),
        text: icon,
        tx: Math.cos(angle) * distance,
        ty: Math.sin(angle) * distance - 40,
        rot: (Math.random() - 0.5) * 70,
        size: icon === '🐾' ? 'text-2xl sm:text-3xl' : 'text-3xl sm:text-4xl',
      };
    });

    setParticles((prev) => [...prev, ...newParticles]);

    // Clean up particles
    setTimeout(() => {
      setParticles((prev) => prev.filter((p) => !newParticles.some((np) => np.id === p.id)));
    }, 1400);
  };

  return (
    <div
      onClick={handleClick}
      className={`relative inline-block select-none cursor-pointer group transition-transform duration-200 active:scale-95 ${isHappy ? 'animate-cat-squish' : ''} ${className}`}
      title="Bấm vào chú mèo để nghe tiếng prrrr grrrr và bắn tim, chân mèo nha! 🐾💖"
    >
      {/* Floating Purr Comic Speech Bubble - positioned nicely over cat's head */}
      {purrBubble && (
        <div className="absolute top-4 sm:top-8 md:top-10 left-1/2 -translate-x-1/2 z-30 pointer-events-none animate-purr-bubble whitespace-nowrap">
          <div className="relative bg-white/95 backdrop-blur-xs px-4 py-1.5 sm:px-5 sm:py-2 rounded-full border-2 border-pink-300 shadow-xl text-xs sm:text-sm md:text-base font-extrabold text-[#FF4878] flex items-center gap-1.5 cute-shadow">
            <span>{purrBubble}</span>
            {/* Comic speech bubble tail pointing down to cat */}
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-x-4 border-x-transparent border-t-6 border-t-pink-300" />
            <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-0 h-0 border-x-3.5 border-x-transparent border-t-5 border-t-white" />
          </div>
        </div>
      )}

      {/* Floating Hearts & Paws Particles Burst */}
      {particles.map((p) => (
        <span
          key={p.id}
          className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-30 animate-pop-particle ${p.size} drop-shadow-md`}
          style={
            {
              '--tx': `${p.tx}px`,
              '--ty': `${p.ty}px`,
              '--rot': `${p.rot}deg`,
            } as React.CSSProperties
          }
        >
          {p.text}
        </span>
      ))}

      {/* SVG Cat Artwork */}
      <svg
        viewBox="0 0 200 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-xl filter transition-transform duration-300 group-hover:scale-[1.03]"
      >
        {/* Tail on right */}
        <path
          d="M135 150 C155 150, 168 135, 165 110 C163 92, 148 95, 148 102 C148 112, 155 125, 140 135 C132 140, 126 145, 122 150 Z"
          fill="#FFA959"
          stroke="#F3923E"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Body */}
        <ellipse cx="100" cy="142" rx="42" ry="34" fill="#FFA959" />

        {/* Belly patch */}
        <ellipse cx="100" cy="144" rx="26" ry="24" fill="#FFF4E6" />

        {/* Back Feet / bottom curve */}
        <ellipse cx="70" cy="165" rx="15" ry="8" fill="#FFA959" />
        <ellipse cx="130" cy="165" rx="15" ry="8" fill="#FFA959" />

        {/* Front Paws */}
        <ellipse cx="88" cy="158" rx="10" ry="8" fill="#FFFDF8" stroke="#FFE3CE" strokeWidth="1.5" />
        <ellipse cx="112" cy="158" rx="10" ry="8" fill="#FFFDF8" stroke="#FFE3CE" strokeWidth="1.5" />

        {/* Left Ear */}
        <path
          d={isHappy ? "M60 84 L68 42 C72 40, 86 48, 92 56 Z" : "M62 82 L72 38 C75 36, 88 45, 93 54 Z"}
          fill="#FFA959"
          stroke="#F3923E"
          strokeWidth="2"
          strokeLinejoin="round"
          className="transition-all duration-200"
        />
        {/* Left Ear Inner */}
        <path
          d={isHappy ? "M65 78 L71 49 C73 48, 82 54, 86 60 Z" : "M67 76 L74 46 C76 45, 84 52, 87 58 Z"}
          fill="#FFB6C1"
          className="transition-all duration-200"
        />

        {/* Right Ear */}
        <path
          d={isHappy ? "M140 84 L132 42 C128 40, 114 48, 108 56 Z" : "M138 82 L128 38 C125 36, 112 45, 107 54 Z"}
          fill="#FFA959"
          stroke="#F3923E"
          strokeWidth="2"
          strokeLinejoin="round"
          className="transition-all duration-200"
        />
        {/* Right Ear Inner */}
        <path
          d={isHappy ? "M135 78 L129 49 C127 48, 118 54, 114 60 Z" : "M133 76 L126 46 C124 45, 116 52, 113 58 Z"}
          fill="#FFB6C1"
          className="transition-all duration-200"
        />

        {/* Head */}
        <ellipse cx="100" cy="92" rx="46" ry="38" fill="#FFA959" />

        {/* Head Stripes */}
        <path d="M100 58 L100 70" stroke="#E67E22" strokeWidth="3" strokeLinecap="round" />
        <path d="M92 60 L94 70" stroke="#E67E22" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M108 60 L106 70" stroke="#E67E22" strokeWidth="2.5" strokeLinecap="round" />

        {/* Cheeks blush (bigger & glowing when happy) */}
        <ellipse
          cx="73"
          cy="98"
          rx={isHappy ? 12 : 8.5}
          ry={isHappy ? 8 : 5.5}
          fill="#FF688B"
          opacity={isHappy ? 0.95 : 0.65}
          className="transition-all duration-300"
        />
        <ellipse
          cx="127"
          cy="98"
          rx={isHappy ? 12 : 8.5}
          ry={isHappy ? 8 : 5.5}
          fill="#FF688B"
          opacity={isHappy ? 0.95 : 0.65}
          className="transition-all duration-300"
        />

        {/* Eyes: Normal or Happy Smile Arc ^ ^ with heart sparkle */}
        {isHappy ? (
          <>
            {/* Happy Left Eye Arc ^ */}
            <path
              d="M75 91 Q82 81 89 91"
              stroke="#2D232A"
              strokeWidth="4"
              strokeLinecap="round"
              fill="none"
            />
            {/* Happy Right Eye Arc ^ */}
            <path
              d="M111 91 Q118 81 125 91"
              stroke="#2D232A"
              strokeWidth="4"
              strokeLinecap="round"
              fill="none"
            />
            {/* Little heart highlight above head */}
            <path
              d="M100 48 C98 44 93 45 93 48 C93 52 100 56 100 56 C100 56 107 52 107 48 C107 45 102 44 100 48 Z"
              fill="#FF4D79"
            />
          </>
        ) : (
          <>
            {/* Normal Left Eye */}
            <ellipse cx="82" cy="89" rx="5.5" ry="6.5" fill="#2D232A" />
            <circle cx="80" cy="86" r="2.2" fill="#FFFFFF" />
            <circle cx="84" cy="91" r="1" fill="#FFFFFF" />

            {/* Normal Right Eye */}
            <ellipse cx="118" cy="89" rx="5.5" ry="6.5" fill="#2D232A" />
            <circle cx="116" cy="86" r="2.2" fill="#FFFFFF" />
            <circle cx="120" cy="91" r="1" fill="#FFFFFF" />
          </>
        )}

        {/* Nose */}
        <polygon points="100,97 96.5,93 103.5,93" fill="#FF758F" />

        {/* Smile mouth */}
        <path
          d="M93 99 C96 103, 100 103, 100 98 C100 103, 104 103, 107 99"
          stroke="#2D232A"
          strokeWidth="2.2"
          strokeLinecap="round"
          fill="none"
        />

        {/* Left Whiskers */}
        <path d="M72 94 L50 91" stroke="#4A3B32" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M71 99 L48 101" stroke="#4A3B32" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M73 103 L52 110" stroke="#4A3B32" strokeWidth="1.8" strokeLinecap="round" />

        {/* Right Whiskers */}
        <path d="M128 94 L150 91" stroke="#4A3B32" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M129 99 L152 101" stroke="#4A3B32" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M127 103 L148 110" stroke="#4A3B32" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    </div>
  );
};
