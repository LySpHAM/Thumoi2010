import React from 'react';

interface CuteCatProps {
  className?: string;
}

export const CuteCat: React.FC<CuteCatProps> = ({ className = 'w-44 h-44 sm:w-52 sm:h-52' }) => {
  return (
    <div className={`relative inline-block select-none transition-transform duration-300 hover:scale-105 ${className}`}>
      <svg
        viewBox="0 0 200 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-sm filter"
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
          d="M62 82 L72 38 C75 36, 88 45, 93 54 Z"
          fill="#FFA959"
          stroke="#F3923E"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        {/* Left Ear Inner */}
        <path
          d="M67 76 L74 46 C76 45, 84 52, 87 58 Z"
          fill="#FFB6C1"
        />

        {/* Right Ear */}
        <path
          d="M138 82 L128 38 C125 36, 112 45, 107 54 Z"
          fill="#FFA959"
          stroke="#F3923E"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        {/* Right Ear Inner */}
        <path
          d="M133 76 L126 46 C124 45, 116 52, 113 58 Z"
          fill="#FFB6C1"
        />

        {/* Head */}
        <ellipse cx="100" cy="92" rx="46" ry="38" fill="#FFA959" />

        {/* Head Stripes */}
        <path d="M100 58 L100 70" stroke="#E67E22" strokeWidth="3" strokeLinecap="round" />
        <path d="M92 60 L94 70" stroke="#E67E22" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M108 60 L106 70" stroke="#E67E22" strokeWidth="2.5" strokeLinecap="round" />

        {/* Cheeks blush */}
        <ellipse cx="73" cy="98" rx="8" ry="5" fill="#FF8CA3" opacity="0.65" />
        <ellipse cx="127" cy="98" rx="8" ry="5" fill="#FF8CA3" opacity="0.65" />

        {/* Left Eye */}
        <ellipse cx="82" cy="89" rx="5.5" ry="6.5" fill="#2D232A" />
        <circle cx="80" cy="86" r="2.2" fill="#FFFFFF" />
        <circle cx="84" cy="91" r="1" fill="#FFFFFF" />

        {/* Right Eye */}
        <ellipse cx="118" cy="89" rx="5.5" ry="6.5" fill="#2D232A" />
        <circle cx="116" cy="86" r="2.2" fill="#FFFFFF" />
        <circle cx="120" cy="91" r="1" fill="#FFFFFF" />

        {/* Nose */}
        <polygon points="100,97 96.5,93 103.5,93" fill="#FF758F" />

        {/* Smile mouth */}
        <path
          d="M93 99 C96 103, 100 103, 100 98 C100 103, 104 103, 107 99"
          stroke="#2D232A"
          strokeWidth="2"
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
