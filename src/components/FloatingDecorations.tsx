import React from 'react';

export const PawIcon: React.FC<{ className?: string; color?: string }> = ({
  className = 'w-6 h-6',
  color = '#C5B5C3',
}) => (
  <svg viewBox="0 0 32 32" fill={color} className={className} xmlns="http://www.w3.org/2000/svg">
    {/* Main pad */}
    <path d="M16 14 C12.5 14, 9 17, 10 21.5 C10.8 24.8, 14 26, 16 26 C18 26, 21.2 24.8, 22 21.5 C23 17, 19.5 14, 16 14 Z" />
    {/* Left toe */}
    <circle cx="9.5" cy="11.5" r="2.6" />
    {/* Middle left toe */}
    <circle cx="13.5" cy="8.5" r="2.7" />
    {/* Middle right toe */}
    <circle cx="18.5" cy="8.5" r="2.7" />
    {/* Right toe */}
    <circle cx="22.5" cy="11.5" r="2.6" />
  </svg>
);

export const FishIcon: React.FC<{ className?: string; color?: string }> = ({
  className = 'w-7 h-7',
  color = '#A9D6F3',
}) => (
  <svg viewBox="0 0 36 28" fill={color} className={className} xmlns="http://www.w3.org/2000/svg">
    {/* Fish body */}
    <path d="M4 14 C9 6, 20 6, 26 14 C20 22, 9 22, 4 14 Z" />
    {/* Tail fin with gentle flex */}
    <path d="M25 14 L33 7 L31 14 L33 21 Z" />
    {/* Little eye */}
    <circle cx="9" cy="12" r="1.3" fill="#FFFFFF" />
    <circle cx="9" cy="12" r="0.7" fill="#588BAE" />
  </svg>
);

export const FloatingDecorations: React.FC = () => {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 select-none">
      {/* Top Left Paws - Floating */}
      <div
        className="absolute top-[8%] left-[7%] opacity-70 animate-float-paw"
        style={{ animationDelay: '0s', animationDuration: '5.2s' }}
      >
        <div className="rotate-[-25deg]">
          <PawIcon className="w-5 h-5 text-[#CBB9C8]" color="#CBB9C8" />
        </div>
      </div>

      <div
        className="absolute top-[31%] left-[4%] opacity-75 animate-float-paw-alt"
        style={{ animationDelay: '1.4s', animationDuration: '6.4s' }}
      >
        <div className="rotate-[20deg]">
          <PawIcon className="w-6 h-6 text-[#CBB9C8]" color="#CBB9C8" />
        </div>
      </div>

      {/* Top Left Fish - Swimming */}
      <div
        className="absolute top-[36%] left-[12%] opacity-80 animate-swim"
        style={{ animationDelay: '0.5s', animationDuration: '8s' }}
      >
        <div className="rotate-[15deg]">
          <FishIcon className="w-7 h-7 text-[#A0D2F4]" color="#A0D2F4" />
        </div>
      </div>

      <div
        className="absolute top-[18%] left-[20%] opacity-65 animate-swim-reverse"
        style={{ animationDelay: '2.1s', animationDuration: '9.2s' }}
      >
        <div className="rotate-[-10deg]">
          <FishIcon className="w-6 h-6 text-[#B2DEF7]" color="#B2DEF7" />
        </div>
      </div>

      {/* Center Top Left Paw */}
      <div
        className="absolute top-[10%] left-[44%] opacity-60 animate-float-paw"
        style={{ animationDelay: '2.8s', animationDuration: '5.8s' }}
      >
        <div className="rotate-[35deg]">
          <PawIcon className="w-4 h-4 text-[#CBB9C8]" color="#CBB9C8" />
        </div>
      </div>

      {/* Top Right Fish - Swimming */}
      <div
        className="absolute top-[11%] right-[32%] opacity-75 animate-swim"
        style={{ animationDelay: '1.7s', animationDuration: '7.5s' }}
      >
        <div className="rotate-[-15deg]">
          <FishIcon className="w-6 h-6 text-[#A0D2F4]" color="#A0D2F4" />
        </div>
      </div>

      <div
        className="absolute top-[28%] right-[28%] opacity-80 animate-swim-reverse"
        style={{ animationDelay: '3.2s', animationDuration: '8.4s' }}
      >
        <div className="rotate-[25deg]">
          <FishIcon className="w-7 h-7 text-[#98CEF2]" color="#98CEF2" />
        </div>
      </div>

      {/* Top Right Paws */}
      <div
        className="absolute top-[8%] right-[10%] opacity-70 animate-float-paw"
        style={{ animationDelay: '0.8s', animationDuration: '6s' }}
      >
        <div className="rotate-[-15deg]">
          <PawIcon className="w-5 h-5 text-[#CBB9C8]" color="#CBB9C8" />
        </div>
      </div>

      <div
        className="absolute top-[20%] right-[5%] opacity-65 animate-float-paw-alt"
        style={{ animationDelay: '2.4s', animationDuration: '5.5s' }}
      >
        <div className="rotate-[40deg]">
          <PawIcon className="w-6 h-6 text-[#CBB9C8]" color="#CBB9C8" />
        </div>
      </div>

      {/* Middle Center Paws */}
      <div
        className="absolute top-[49%] left-[26%] opacity-65 animate-float-paw"
        style={{ animationDelay: '1.1s', animationDuration: '6.2s' }}
      >
        <div className="rotate-[-30deg]">
          <PawIcon className="w-4 h-4 text-[#D0C0CD]" color="#D0C0CD" />
        </div>
      </div>

      <div
        className="absolute top-[67%] right-[29%] opacity-65 animate-float-paw-alt"
        style={{ animationDelay: '3.6s', animationDuration: '5.9s' }}
      >
        <div className="rotate-[15deg]">
          <PawIcon className="w-4 h-4 text-[#D0C0CD]" color="#D0C0CD" />
        </div>
      </div>

      {/* Bottom Left Fish & Paws */}
      <div
        className="absolute bottom-[17%] left-[17%] opacity-75 animate-swim"
        style={{ animationDelay: '2.5s', animationDuration: '8.8s' }}
      >
        <div className="rotate-[35deg]">
          <FishIcon className="w-6 h-6 text-[#A0D2F4]" color="#A0D2F4" />
        </div>
      </div>

      <div
        className="absolute bottom-[6%] left-[7%] opacity-65 animate-float-paw"
        style={{ animationDelay: '0.3s', animationDuration: '5.6s' }}
      >
        <div className="rotate-[-15deg]">
          <PawIcon className="w-5 h-5 text-[#CBB9C8]" color="#CBB9C8" />
        </div>
      </div>

      {/* Bottom Center Paws */}
      <div
        className="absolute bottom-[9%] left-[41%] opacity-60 animate-float-paw"
        style={{ animationDelay: '1.9s', animationDuration: '6.7s' }}
      >
        <div className="rotate-[-10deg]">
          <PawIcon className="w-4 h-4 text-[#CBB9C8]" color="#CBB9C8" />
        </div>
      </div>

      <div
        className="absolute bottom-[7%] left-[44%] opacity-70 animate-float-paw-alt"
        style={{ animationDelay: '3.1s', animationDuration: '5.3s' }}
      >
        <div className="rotate-[15deg]">
          <PawIcon className="w-5 h-5 text-[#CBB9C8]" color="#CBB9C8" />
        </div>
      </div>

      {/* Bottom Right Fish & Paws */}
      <div
        className="absolute bottom-[20%] right-[17%] opacity-80 animate-swim-reverse"
        style={{ animationDelay: '0.9s', animationDuration: '7.8s' }}
      >
        <div className="rotate-[-10deg]">
          <FishIcon className="w-6 h-6 text-[#A0D2F4]" color="#A0D2F4" />
        </div>
      </div>

      <div
        className="absolute bottom-[33%] right-[7%] opacity-65 animate-float-paw"
        style={{ animationDelay: '2.7s', animationDuration: '6.1s' }}
      >
        <div className="rotate-[30deg]">
          <PawIcon className="w-5 h-5 text-[#CBB9C8]" color="#CBB9C8" />
        </div>
      </div>

      {/* Extra playful swimming fish in the middle */}
      <div
        className="absolute top-[58%] left-[6%] opacity-60 animate-swim"
        style={{ animationDelay: '4.2s', animationDuration: '10s' }}
      >
        <div className="rotate-[8deg]">
          <FishIcon className="w-5 h-5 text-[#BCE3FB]" color="#BCE3FB" />
        </div>
      </div>

      <div
        className="absolute top-[78%] right-[8%] opacity-65 animate-swim-reverse"
        style={{ animationDelay: '1.5s', animationDuration: '9.5s' }}
      >
        <div className="rotate-[-20deg]">
          <FishIcon className="w-6 h-6 text-[#A5D8F7]" color="#A5D8F7" />
        </div>
      </div>
    </div>
  );
};
