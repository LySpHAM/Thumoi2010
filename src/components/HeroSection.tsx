import React from 'react';
import { CuteCat } from './CuteCat';

interface HeroSectionProps {
  onScrollToForm: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onScrollToForm }) => {
  return (
    <section className="relative pt-8 pb-10 sm:pt-14 sm:pb-14 flex flex-col items-center text-center px-4 max-w-4xl mx-auto z-10">
      {/* Animated Big Cute Cat */}
      <div className="animate-gentle-bounce mb-3 relative flex justify-center">
        <CuteCat className="w-72 h-72 sm:w-[350px] sm:h-[350px] md:w-[420px] md:h-[420px] lg:w-[460px] lg:h-[460px]" />
      </div>

      {/* Greeting */}
      <p className="text-sm sm:text-base text-[#916E85] font-semibold tracking-wide mb-3">
        Hiiluu các gái đẹp nhà ai si taaa ^^
      </p>

      {/* Main Title matching screenshot */}
      <h1 className="text-3xl sm:text-4xl md:text-[42px] leading-tight sm:leading-snug font-extrabold text-[#3B2C37] tracking-tight max-w-2xl">
        Sắp tới chúng tớ có tổ chức <br className="hidden sm:inline" />
        một buổi tiệc 20/10 nho nhỏ <br className="hidden sm:inline" />
        cho các cậu <span className="inline-block transform hover:scale-125 transition-transform">💖</span>
      </h1>

      {/* Description */}
      <p className="mt-4 text-sm sm:text-base text-[#775C6F] font-medium max-w-xl">
        Các cậu điền thông tin giúp tớ để tớ chuẩn bị chu đáo hơn nha!
      </p>

      {/* Meo Meo Button in Tactile 3D style */}
      <div className="mt-6 sm:mt-8">
        <button
          onClick={onScrollToForm}
          type="button"
          className="group relative inline-flex items-center justify-center gap-3 px-10 py-4 rounded-full btn-3d-pink text-white font-extrabold text-base sm:text-lg cursor-pointer select-none"
        >
          <span>Meo meo</span>
          <span className="text-lg group-hover:scale-125 group-hover:rotate-12 transition-transform">🐾</span>
        </button>
      </div>
    </section>
  );
};
