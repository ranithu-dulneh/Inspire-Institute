import React, { useState, useEffect } from 'react';

interface TeacherPortraitProps {
  className?: string;
  customImageUrl?: string;
  customImageScale?: number;
  customImageOffsetY?: number;
}

export const TeacherPortraitCutout: React.FC<TeacherPortraitProps> = ({
  className = '',
  customImageUrl,
  customImageScale,
  customImageOffsetY
}) => {
  const [activeImage, setActiveImage] = useState<string | null>(customImageUrl || null);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const [activeScale, setActiveScale] = useState<number>(() => {
    if (customImageScale !== undefined) return customImageScale;
    const saved = localStorage.getItem('inspire_teacher_photo_scale');
    return saved ? parseInt(saved, 10) : 100;
  });
  const [activeOffsetY, setActiveOffsetY] = useState<number>(() => {
    if (customImageOffsetY !== undefined) return customImageOffsetY;
    const saved = localStorage.getItem('inspire_teacher_photo_offset_y');
    return saved ? parseInt(saved, 10) : 0;
  });

  // Keep scale and offset synced with props
  useEffect(() => {
    if (customImageScale !== undefined) {
      setActiveScale(customImageScale);
    }
  }, [customImageScale]);

  useEffect(() => {
    if (customImageOffsetY !== undefined) {
      setActiveOffsetY(customImageOffsetY);
    }
  }, [customImageOffsetY]);

  // Listen to live broadcast events from Admin Panel across tabs & components
  useEffect(() => {
    const handleUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<{ imageUrl?: string | null; scale?: number; offsetY?: number }>;
      if (customEvent.detail) {
        if (customEvent.detail.imageUrl !== undefined) {
          setActiveImage(customEvent.detail.imageUrl);
          setIsLoaded(true);
        }
        if (typeof customEvent.detail.scale === 'number') {
          setActiveScale(customEvent.detail.scale);
        }
        if (typeof customEvent.detail.offsetY === 'number') {
          setActiveOffsetY(customEvent.detail.offsetY);
        }
      }
    };
    window.addEventListener('teacher-photo-updated', handleUpdate);
    return () => window.removeEventListener('teacher-photo-updated', handleUpdate);
  }, []);

  // Check admin-configured image, server endpoint, localStorage, or public candidate image paths
  useEffect(() => {
    setIsLoaded(false);
    if (customImageUrl) {
      setActiveImage(customImageUrl);
      const img = new Image();
      img.onload = () => setIsLoaded(true);
      img.onerror = () => setIsLoaded(true);
      img.src = customImageUrl;
      return;
    }
    const saved = localStorage.getItem('inspire_teacher_photo_cutout');
    if (saved) {
      setActiveImage(saved);
      const img = new Image();
      img.onload = () => setIsLoaded(true);
      img.onerror = () => setIsLoaded(true);
      img.src = saved;
      return;
    }

    // Fetch from public server so all visitors on the public site see the configured teacher image
    fetch('/api/teacher-photo')
      .then(res => res.json())
      .then(data => {
        if (data?.success && data.imageUrl) {
          setActiveImage(data.imageUrl);
          if (typeof data.scale === 'number') setActiveScale(data.scale);
          if (typeof data.offsetY === 'number') setActiveOffsetY(data.offsetY);
          const img = new Image();
          img.onload = () => setIsLoaded(true);
          img.onerror = () => setIsLoaded(true);
          img.src = data.imageUrl;
        } else {
          // If no server photo, test candidate local files
          const candidatePaths = [
            '/688785651_1572341544899956_8069124974790945836_n.jpg',
            '/teacher-cutout.png',
            '/teacher.jpg',
            '/teacher.png'
          ];
          let found = false;
          const testNext = (idx: number) => {
            if (idx >= candidatePaths.length || found) {
              if (!found) {
                setTimeout(() => setIsLoaded(true), 80);
              }
              return;
            }
            const testImg = new Image();
            testImg.onload = () => {
              found = true;
              setActiveImage(testImg.src);
              setTimeout(() => setIsLoaded(true), 80);
            };
            testImg.onerror = () => testNext(idx + 1);
            testImg.src = candidatePaths[idx];
          };
          testNext(0);
        }
      })
      .catch(() => {
        setTimeout(() => setIsLoaded(true), 80);
      });
  }, [customImageUrl]);

  const scaleMultiplier = (activeScale || 100) / 100;

  return (
    <div className={`relative flex flex-col items-center justify-center select-none ${className}`}>
      
      {/* Soft Ambient Luminous Halo */}
      <div 
        className="absolute inset-0 -top-6 bg-gradient-to-tr from-blue-400/20 via-sky-300/25 to-teal-200/15 rounded-full blur-3xl pointer-events-none scale-125 transition-opacity duration-1000"
        style={{
          opacity: isLoaded ? 0.85 : 0.2
        }}
      />
      <div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4/5 h-4/5 bg-radial from-amber-300/15 via-blue-200/10 to-transparent rounded-full blur-2xl pointer-events-none"
      />

      {/* Signature Modern Graphic Backdrop Inspired by image.png */}
      {/* 1. Geometric Starburst / Asterisk Line-Art Motif */}
      <div 
        className="absolute -left-2 sm:-left-10 top-1/4 sm:top-1/3 -translate-y-1/2 w-32 h-32 sm:w-56 sm:h-56 pointer-events-none z-0 opacity-70"
        aria-hidden="true"
      >
        <svg viewBox="0 0 200 200" className="w-full h-full text-blue-300/60 stroke-current" fill="none">
          {/* 8-pointed geometric starburst line art */}
          <path 
            d="M100 15 L115 65 L165 50 L145 95 L190 115 L145 135 L165 180 L115 165 L100 215 L85 165 L35 180 L55 135 L10 115 L55 95 L35 50 L85 65 Z" 
            strokeWidth="2.5" 
            strokeLinejoin="round"
          />
        </svg>
      </div>

      {/* Main Cutout Container Stage (Blue box and teacher picture share the exact same bottom edge with NO gap) */}
      <div className="relative z-10 w-full max-w-[270px] sm:max-w-[340px] md:max-w-[420px] lg:max-w-[650px] xl:max-w-[720px] 2xl:max-w-[760px] aspect-[4/5] flex items-end justify-center">
        
        {/* 2. Vibrant Royal Blue Rounded Backdrop Card: Flush to bottom-0 so no space exists under teacher's picture */}
        <div 
          className="absolute right-0 sm:right-4 md:right-6 top-3 sm:top-6 md:top-8 bottom-0 w-[160px] sm:w-[220px] md:w-[280px] lg:w-[360px] xl:w-[410px] bg-gradient-to-b from-blue-600 via-blue-600 to-blue-700 rounded-2xl sm:rounded-3xl md:rounded-[36px] shadow-[0_20px_50px_-15px_rgba(37,99,235,0.4)] overflow-hidden pointer-events-none z-0 flex items-center justify-center"
          aria-hidden="true"
        >
          {/* Subtle decorative inner glow */}
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-white/20" />
          {/* "RS" Monogram Watermark matching "LR" watermark from image.png */}
          <span className="text-white/20 font-black text-6xl sm:text-7xl md:text-9xl lg:text-[140px] tracking-tighter select-none font-sans scale-110">
            RS
          </span>
        </div>

        {activeImage ? (
          /* Real photographic cutout of Mrs. Ruwanthi Senanayaka anchored flush to bottom-0 */
          <div className="relative z-10 w-full h-full flex items-end justify-center overflow-visible">
            <img 
              src={activeImage} 
              alt="Mrs. Ruwanthi Senanayaka - Lead A/L Accounting Faculty"
              onLoad={() => setIsLoaded(true)}
              style={{
                transform: `translateY(${activeOffsetY}px) scale(${scaleMultiplier})`,
                transformOrigin: 'bottom center'
              }}
              className={`w-full h-full object-contain object-bottom drop-shadow-[0_24px_48px_rgba(15,23,42,0.18)] transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                isLoaded 
                  ? 'opacity-100 blur-0' 
                  : 'opacity-0 blur-xs'
              }`}
            />
          </div>
        ) : (
          /* High-Fidelity Studio Portrait Rendering with Realistic Shading & Pinstripes anchored flush to bottom */
          <div 
            style={{
              transform: `translateY(${activeOffsetY}px) scale(${scaleMultiplier})`,
              transformOrigin: 'bottom center'
            }}
            className={`relative z-10 w-full h-full flex items-end justify-center transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
              isLoaded 
                ? 'opacity-100 translate-y-0' 
                : 'opacity-0 translate-y-6'
            }`}
          >
            <svg 
              viewBox="0 0 500 620" 
              preserveAspectRatio="xMidYMax meet"
              className="w-full h-full drop-shadow-[0_25px_45px_rgba(15,23,42,0.16)]"
              fill="none" 
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <linearGradient id="photoSkin" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#D29875" />
                  <stop offset="40%" stopColor="#C28662" />
                  <stop offset="70%" stopColor="#B07350" />
                  <stop offset="100%" stopColor="#965D3C" />
                </linearGradient>
                <linearGradient id="photoSkinHighlight" x1="30%" y1="0%" x2="70%" y2="100%">
                  <stop offset="0%" stopColor="#E0AB8A" />
                  <stop offset="60%" stopColor="#C98B68" />
                  <stop offset="100%" stopColor="#AF7351" />
                </linearGradient>
                <linearGradient id="photoHair" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#251915" />
                  <stop offset="60%" stopColor="#17100D" />
                  <stop offset="100%" stopColor="#0B0706" />
                </linearGradient>
                <linearGradient id="photoVest" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#21252D" />
                  <stop offset="50%" stopColor="#181B22" />
                  <stop offset="100%" stopColor="#101217" />
                </linearGradient>
                <linearGradient id="photoPants" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#252A33" />
                  <stop offset="100%" stopColor="#16191E" />
                </linearGradient>
                <linearGradient id="goldAcc" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#FDE047" />
                  <stop offset="40%" stopColor="#EAB308" />
                  <stop offset="80%" stopColor="#CA8A04" />
                  <stop offset="100%" stopColor="#854D0E" />
                </linearGradient>
                <pattern id="realPinstripe" width="14" height="20" patternUnits="userSpaceOnUse">
                  <line x1="7" y1="0" x2="7" y2="20" stroke="#FFFFFF" strokeWidth="0.75" opacity="0.32" />
                </pattern>
              </defs>

              {/* Hair Bun with hair texture */}
              <circle cx="250" cy="85" r="32" fill="url(#photoHair)" />
              <path d="M225 75 Q 250 68 275 75 Q 260 95 225 75 Z" fill="#3A2822" opacity="0.4" />

              {/* Neck & Shading */}
              <path d="M232 175 L268 175 L275 225 L225 225 Z" fill="url(#photoSkin)" />
              <path d="M232 175 Q 250 190 268 175 L270 195 Q 250 205 230 195 Z" fill="#935839" opacity="0.45" />

              {/* Real Gold Chain Necklace */}
              <path d="M228 184 Q 250 216 272 184" stroke="url(#goldAcc)" strokeWidth="3" fill="none" />
              <path d="M230 186 Q 250 218 270 186" stroke="#FEF08A" strokeWidth="1" fill="none" opacity="0.8" />

              {/* Head & Natural Facial Geometry */}
              <ellipse cx="250" cy="140" rx="38" ry="46" fill="url(#photoSkinHighlight)" />
              {/* Sleek combed back front hair */}
              <path d="M212 135 C 212 90 288 90 288 135 C 280 102 220 102 212 135 Z" fill="url(#photoHair)" />
              <path d="M246 95 Q 250 108 248 118" stroke="#3A2922" strokeWidth="2" opacity="0.5" fill="none" />

              {/* Almond Eyes & Pupils */}
              <ellipse cx="236" cy="138" rx="5.5" ry="3.5" fill="#1A110D" />
              <ellipse cx="264" cy="138" rx="5.5" ry="3.5" fill="#1A110D" />
              <circle cx="237.5" cy="137" r="1.3" fill="#FFFFFF" />
              <circle cx="265.5" cy="137" r="1.3" fill="#FFFFFF" />
              {/* Eyebrows */}
              <path d="M227 129 Q 236 125 244 129" stroke="#140D0B" strokeWidth="2.8" strokeLinecap="round" />
              <path d="M256 129 Q 264 125 273 129" stroke="#140D0B" strokeWidth="2.8" strokeLinecap="round" />

              {/* Nose Contour */}
              <path d="M250 138 L247.5 152 L253 152" stroke="#8A4828" strokeWidth="1.6" strokeLinecap="round" fill="none" />

              {/* Confident Warm Smile */}
              <path d="M239 162 Q 250 171 261 162" stroke="#7A2218" strokeWidth="3.2" strokeLinecap="round" fill="none" />
              <path d="M241 162 Q 250 166 259 162" stroke="#FFFFFF" strokeWidth="1.2" strokeLinecap="round" fill="none" opacity="0.9" />

              {/* Gold Stud Earrings */}
              <circle cx="212" cy="142" r="3.5" fill="url(#goldAcc)" />
              <circle cx="288" cy="142" r="3.5" fill="url(#goldAcc)" />

              {/* Cleavage V-Neck Skin */}
              <path d="M234 220 L250 256 L266 220 Z" fill="url(#photoSkin)" />

              {/* Torso: Black Pinstripe Sleeveless Waistcoat */}
              <path d="M190 225 L234 220 L250 258 L266 220 L310 225 L318 360 L290 400 L250 420 L210 400 L182 360 Z" fill="url(#photoVest)" />
              <path d="M190 225 L234 220 L250 258 L266 220 L310 225 L318 360 L290 400 L250 420 L210 400 L182 360 Z" fill="url(#realPinstripe)" />

              {/* Vest Buttons */}
              <circle cx="250" cy="285" r="3.2" fill="#0E1116" stroke="#334155" strokeWidth="0.8" />
              <circle cx="250" cy="320" r="3.2" fill="#0E1116" stroke="#334155" strokeWidth="0.8" />
              <circle cx="250" cy="355" r="3.2" fill="#0E1116" stroke="#334155" strokeWidth="0.8" />

              {/* Crossed Arms */}
              <path d="M310 225 C 335 250 345 320 320 370 C 295 400 230 380 200 370 L 210 330 C 240 345 285 360 295 330 C 310 300 295 250 270 230 Z" fill="url(#photoSkin)" />
              <path d="M190 225 C 165 250 155 310 175 365 C 195 410 270 415 315 375 L 300 340 C 265 370 220 365 205 335 C 195 305 205 250 230 230 Z" fill="url(#photoSkin)" />

              {/* Left Wrist Real Gold Watch */}
              <rect x="238" y="360" width="22" height="10" rx="3" fill="url(#goldAcc)" transform="rotate(-15 249 365)" />
              <circle cx="249" cy="365" r="6" fill="#FFFFFF" stroke="url(#goldAcc)" strokeWidth="1.5" />
              <line x1="249" y1="365" x2="251" y2="362" stroke="#1E293B" strokeWidth="0.8" />

              {/* Gold Ring on Finger */}
              <circle cx="198" cy="358" r="3" fill="url(#goldAcc)" />

              {/* Hands / Fingers Tucked */}
              <path d="M185 345 Q 170 370 195 385" stroke="#BA7854" strokeWidth="3" fill="none" />
              <path d="M305 340 Q 325 365 300 380" stroke="#BA7854" strokeWidth="3" fill="none" />

              {/* Matching Pinstripe Trousers */}
              <path d="M205 400 L295 400 L310 620 L190 620 Z" fill="url(#photoPants)" />
              <path d="M205 400 L295 400 L310 620 L190 620 Z" fill="url(#realPinstripe)" />
            </svg>
          </div>
        )}

      </div>

      {/* Faculty Name Tag */}
      <div className="mt-3 sm:mt-5 text-center px-3.5 py-1.5 sm:px-5 sm:py-2.5 rounded-xl sm:rounded-2xl bg-white/70 backdrop-blur-md border border-white/80 shadow-[0_4px_20px_-4px_rgba(15,23,42,0.06)] space-y-0.5">
        <div className="flex items-center justify-center gap-1.5">
          <h3 className="text-xs sm:text-base md:text-lg font-extrabold text-slate-900 tracking-tight">
            Mrs. Ruwanthi Senanayaka
          </h3>
          <span className="inline-flex items-center justify-center w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-blue-600 text-white" title="Verified Faculty">
            <svg className="w-2 h-2 sm:w-2.5 sm:h-2.5 fill-current" viewBox="0 0 20 20">
              <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
            </svg>
          </span>
        </div>
        <p className="text-[10px] sm:text-xs font-semibold text-slate-500">
          Lead Faculty · A/L Accounting (Island Rank 1 Mentor)
        </p>
      </div>

    </div>
  );
};
