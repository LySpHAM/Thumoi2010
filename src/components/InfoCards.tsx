import React from 'react';

export const InfoCards: React.FC = () => {
  return (
    <section className="relative py-8 sm:py-10 px-4 max-w-5xl mx-auto z-10">
      {/* Section Header */}
      <div className="text-center mb-7">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-[#3B2C37] flex items-center justify-center gap-2">
          <span>Meow meow</span>
          <span className="text-2xl transform hover:rotate-12 transition-transform">🐱</span>
        </h2>
        <p className="mt-2 text-sm sm:text-base text-[#775C6F] font-medium">
          Các cậu theo dõi để nắm được thời gian, địa điểm nha meow.
        </p>
      </div>

      {/* 3 Info Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 max-w-4xl mx-auto">
        {/* Card 1: Thời gian */}
        <div className="bg-white/95 rounded-[22px] border-2 border-[#FFCCD7] p-6 text-center cute-shadow transition-all duration-300 hover:-translate-y-1 hover:border-[#FFAEC0] hover:shadow-lg">
          <div className="text-3xl sm:text-4xl mb-3 flex items-center justify-center">
            🗓️
          </div>
          <h3 className="text-base sm:text-lg font-bold text-[#3B2C37] mb-1.5">
            Thời gian
          </h3>
          <p className="text-sm sm:text-base text-[#6F5B68] font-medium">
            18h00 - Thứ 2 - 19/10/2026
          </p>
        </div>

        {/* Card 2: Địa điểm */}
        <div className="bg-white/95 rounded-[22px] border-2 border-[#FFCCD7] p-6 text-center cute-shadow transition-all duration-300 hover:-translate-y-1 hover:border-[#FFAEC0] hover:shadow-lg">
          <div className="text-3xl sm:text-4xl mb-3 flex items-center justify-center">
            📍
          </div>
          <h3 className="text-base sm:text-lg font-bold text-[#3B2C37] mb-1.5">
            Địa điểm
          </h3>
          <p className="text-sm sm:text-base text-[#6F5B68] font-medium">
            Sân thư viện A11
          </p>
        </div>

        {/* Card 3: Chuẩn bị */}
        <div className="bg-white/95 rounded-[22px] border-2 border-[#FFCCD7] p-6 text-center cute-shadow transition-all duration-300 hover:-translate-y-1 hover:border-[#FFAEC0] hover:shadow-lg">
          <div className="text-3xl sm:text-4xl mb-3 flex items-center justify-center">
            🎀
          </div>
          <h3 className="text-base sm:text-lg font-bold text-[#3B2C37] mb-1.5">
            Chuẩn bị
          </h3>
          <p className="text-sm sm:text-base text-[#6F5B68] font-medium">
            Chỉ cần xinh xắn đến tham dự thui 💖
          </p>
        </div>
      </div>
    </section>
  );
};
