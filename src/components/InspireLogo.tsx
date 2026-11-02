import React from 'react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  variant?: 'light' | 'dark'; // 'light' is for light backgrounds, 'dark' is for dark backgrounds
}

export const InspireLogo: React.FC<LogoProps> = ({ 
  className = '', 
  size = 'md',
  showText = true,
  variant = 'light'
}) => {
  const sizeMap = {
    sm: { w: 32, h: 32, fontSize: 'text-xs', subSize: 'text-[9px]' },
    md: { w: 42, h: 42, fontSize: 'text-sm', subSize: 'text-[10px]' },
    lg: { w: 56, h: 56, fontSize: 'text-base', subSize: 'text-xs' },
    xl: { w: 76, h: 76, fontSize: 'text-xl', subSize: 'text-sm' }
  };

  const { w, h, fontSize, subSize } = sizeMap[size];
  const isDark = variant === 'dark';

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      {/* Inspire Dark Crest & Laurel Emblem */}
      <svg 
        width={w} 
        height={h} 
        viewBox="0 0 100 100" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0 drop-shadow-md"
      >
        <defs>
          <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FDE047" />
            <stop offset="45%" stopColor="#EAB308" />
            <stop offset="85%" stopColor="#CA8A04" />
            <stop offset="100%" stopColor="#854D0E" />
          </linearGradient>
          <linearGradient id="shieldGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#1E293B" />
            <stop offset="100%" stopColor="#090D16" />
          </linearGradient>
          <linearGradient id="laurelGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FEF08A" />
            <stop offset="50%" stopColor="#EAB308" />
            <stop offset="100%" stopColor="#A16207" />
          </linearGradient>
          <linearGradient id="ribbonGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#A16207" />
            <stop offset="50%" stopColor="#FACC15" />
            <stop offset="100%" stopColor="#854D0E" />
          </linearGradient>
        </defs>

        {/* Laurel Wreath Left Leaves */}
        <g fill="url(#laurelGrad)" opacity="0.95">
          <path d="M22 62 C 14 52 14 36 24 24 C 23 29 25 35 29 39 C 24 45 22 53 22 62 Z" />
          <path d="M16 48 C 11 41 12 30 20 22 C 19 26 21 31 25 34 C 20 38 17 43 16 48 Z" />
          <path d="M25 72 C 18 64 17 52 23 42 C 24 47 27 52 32 55 C 28 61 26 66 25 72 Z" />
          <circle cx="20" cy="50" r="2.5" />
          <circle cx="23" cy="35" r="2" />
          <circle cx="28" cy="24" r="2" />
        </g>

        {/* Laurel Wreath Right Leaves */}
        <g fill="url(#laurelGrad)" opacity="0.95">
          <path d="M78 62 C 86 52 86 36 76 24 C 77 29 75 35 71 39 C 76 45 78 53 78 62 Z" />
          <path d="M84 48 C 89 41 88 30 80 22 C 81 26 79 31 75 34 C 80 38 83 43 84 48 Z" />
          <path d="M75 72 C 82 64 83 52 77 42 C 76 47 73 52 68 55 C 72 61 74 66 75 72 Z" />
          <circle cx="80" cy="50" r="2.5" />
          <circle cx="77" cy="35" r="2" />
          <circle cx="72" cy="24" r="2" />
        </g>

        {/* Shield Outer Gold Rim */}
        <path 
          d="M50 14 C 64 14 74 18 74 25 C 74 52 64 68 50 78 C 36 68 26 52 26 25 C 26 18 36 14 50 14 Z" 
          fill="url(#laurelGrad)" 
        />
        {/* Shield Inner Dark Fill */}
        <path 
          d="M50 17 C 62 17 71 21 71 27 C 71 50 62 65 50 74 C 38 65 29 50 29 27 C 29 21 38 17 50 17 Z" 
          fill="url(#shieldGrad)" 
        />

        {/* Arm and Hand in Sleeve Holding Diploma Scroll */}
        {/* Sleeve */}
        <path d="M42 66 L58 66 L56 50 L44 50 Z" fill="#14171D" stroke="#D99B26" strokeWidth="0.8" />
        {/* Wrist & Hand */}
        <path d="M45 50 C 45 44 46 41 50 41 C 54 41 55 44 55 50 Z" fill="#F0C39A" />
        {/* Fingers gripping scroll */}
        <rect x="44" y="38" width="12" height="4" rx="2" fill="#E8B58A" />
        <rect x="43" y="34" width="13" height="4" rx="2" fill="#F4C7A2" />
        <rect x="44" y="30" width="11" height="4" rx="2" fill="#F8D3B4" />

        {/* Scroll / Diploma (White rolled parchment with gold/red seal) */}
        <g transform="rotate(-30 50 36)">
          <path d="M36 28 L64 28 C 66 28 67 36 65 39 L37 39 C 35 36 34 28 36 28 Z" fill="#F5F3E9" stroke="#D3CEBF" strokeWidth="0.8" />
          <ellipse cx="64" cy="33.5" rx="2" ry="5.5" fill="#E8E4D5" />
          <ellipse cx="36" cy="33.5" rx="2" ry="5.5" fill="#D3CEBF" />
          {/* Red Ribbon Seal */}
          <rect x="48" y="27" width="5" height="13" rx="1" fill="#DC2626" />
          <circle cx="50.5" cy="33.5" r="2" fill="#F59E0B" />
        </g>

        {/* Gold Ribbon at base */}
        <path 
          d="M26 69 Q 50 78 74 69 Q 70 78 50 82 Q 30 78 26 69 Z" 
          fill="url(#ribbonGrad)" 
          stroke="#FEF08A" 
          strokeWidth="0.5" 
        />
      </svg>

      {/* Brand Wordmark */}
      {showText && (
        <div className="flex flex-col text-left leading-none">
          <span className={`font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-950 dark:text-white'} ${fontSize} uppercase font-sans`}>
            Inspire
          </span>
          <span className={`font-bold tracking-[0.22em] ${isDark ? 'text-amber-400' : 'text-amber-600 dark:text-amber-400'} ${subSize} uppercase font-sans mt-0.5`}>
            Institution
          </span>
        </div>
      )}
    </div>
  );
};
