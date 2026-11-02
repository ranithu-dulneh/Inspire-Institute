import React, { useState, useEffect, useRef, useCallback } from 'react';
import { VideoModule } from '../types';
import { resolveR2Url } from '../lib/supabase';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  RotateCw, 
  Volume2, 
  VolumeX, 
  Maximize, 
  Minimize, 
  X,
  Sparkles,
  Clock
} from 'lucide-react';

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

interface CustomVideoPlayerProps {
  video: VideoModule;
  onClose?: () => void;
  onTimeUpdate?: (currentSec: number, totalSec: number) => void;
  seekToTime?: number | null;
  onSeekHandled?: () => void;
}

export const CustomVideoPlayer: React.FC<CustomVideoPlayerProps> = ({
  video,
  onClose,
  onTimeUpdate,
  seekToTime,
  onSeekHandled
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const ytPlayerRef = useRef<any>(null);
  const ytContainerId = useRef<string>(`yt-player-${Math.random().toString(36).substring(2, 9)}`);

  // Playback state
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(3600); // fallback 1 hour
  const [volume, setVolume] = useState<number>(0.9);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Overlay visibility state
  const [showControls, setShowControls] = useState<boolean>(true);
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const hideTimeoutRef = useRef<any>(null);

  // Big play/pause pulse animation
  const [showActionIcon, setShowActionIcon] = useState<'play' | 'pause' | null>(null);

  // Determine media source
  const directVideoUrl = video.videoUrl || (video.filePath ? resolveR2Url(video.filePath) : null);
  const isDirectVideo = Boolean(
    directVideoUrl && 
    (directVideoUrl.endsWith('.mp4') || 
     directVideoUrl.endsWith('.webm') || 
     directVideoUrl.includes('r2.dev') || 
     directVideoUrl.includes('storage'))
  );

  const getYouTubeId = (url?: string) => {
    if (!url) return null;
    const match = url.match(/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/);
    return match && match[2].length === 11 ? match[2] : null;
  };
  const youtubeId = getYouTubeId(video.youtubeUrl);

  // -------------------------------------------------------------
  // CONTROLS AUTO-HIDE (3 SECONDS INACTIVITY)
  // -------------------------------------------------------------
  const resetHideTimer = useCallback(() => {
    setShowControls(true);
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
    }
    // Only auto-hide if playing
    if (isPlaying) {
      hideTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }
  }, [isPlaying]);

  useEffect(() => {
    resetHideTimer();
    return () => {
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    };
  }, [resetHideTimer, isPlaying]);

  // Fullscreen change listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // -------------------------------------------------------------
  // YOUTUBE IFRAME API INITIALIZATION WITH controls: 0
  // -------------------------------------------------------------
  useEffect(() => {
    if (!youtubeId || isDirectVideo) return;

    let pollInterval: any;

    const initYT = () => {
      if (!window.YT || !window.YT.Player) return;

      if (ytPlayerRef.current) {
        try {
          ytPlayerRef.current.destroy();
        } catch {}
      }

      ytPlayerRef.current = new window.YT.Player(ytContainerId.current, {
        videoId: youtubeId,
        playerVars: {
          autoplay: 1,
          controls: 0,          // HIDE NATIVE CONTROLS
          disablekb: 1,         // DISABLE NATIVE KEYBOARD
          fs: 0,                // HIDE NATIVE FULLSCREEN
          modestbranding: 1,    // MINIMAL BRANDING
          rel: 0,               // NO RELATED VIDEOS
          iv_load_policy: 3,    // NO ANNOTATIONS
          playsinline: 1
        },
        events: {
          onReady: (event: any) => {
            const player = event.target;
            const dur = player.getDuration();
            if (dur && dur > 0) setDuration(dur);
            player.setVolume(isMuted ? 0 : volume * 100);
            player.setPlaybackRate(playbackSpeed);
            player.playVideo();
            setIsPlaying(true);
          },
          onStateChange: (event: any) => {
            // YT.PlayerState: PLAYING (1), PAUSED (2), ENDED (0), BUFFERING (3)
            if (event.data === 1) {
              setIsPlaying(true);
              const dur = event.target.getDuration();
              if (dur && dur > 0) setDuration(dur);
            } else if (event.data === 2 || event.data === 0) {
              setIsPlaying(false);
              setShowControls(true);
            }
          }
        }
      });

      // Poll playback timestamp
      pollInterval = setInterval(() => {
        if (ytPlayerRef.current && typeof ytPlayerRef.current.getCurrentTime === 'function') {
          try {
            const curr = ytPlayerRef.current.getCurrentTime() || 0;
            const dur = ytPlayerRef.current.getDuration() || 0;
            setCurrentTime(curr);
            if (dur > 0) setDuration(dur);
            if (onTimeUpdate) onTimeUpdate(curr, dur || duration);
          } catch {}
        }
      }, 300);
    };

    if (window.YT && window.YT.Player) {
      initYT();
    } else {
      const existingScript = document.getElementById('yt-iframe-api');
      if (!existingScript) {
        const tag = document.createElement('script');
        tag.id = 'yt-iframe-api';
        tag.src = 'https://www.youtube.com/iframe_api';
        const firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
      }
      window.onYouTubeIframeAPIReady = () => {
        initYT();
      };
    }

    return () => {
      if (pollInterval) clearInterval(pollInterval);
      if (ytPlayerRef.current) {
        try {
          ytPlayerRef.current.destroy();
        } catch {}
        ytPlayerRef.current = null;
      }
    };
  }, [youtubeId, isDirectVideo]);

  // -------------------------------------------------------------
  // EXTERNAL SEEK HANDLING (e.g. from Chapter click)
  // -------------------------------------------------------------
  useEffect(() => {
    if (seekToTime !== undefined && seekToTime !== null) {
      handleSeek(seekToTime);
      if (onSeekHandled) onSeekHandled();
    }
  }, [seekToTime]);

  // -------------------------------------------------------------
  // CONTROLLER ACTIONS
  // -------------------------------------------------------------
  const togglePlay = () => {
    resetHideTimer();
    const nextState = !isPlaying;
    setIsPlaying(nextState);

    // Trigger visual pulse
    setShowActionIcon(nextState ? 'play' : 'pause');
    setTimeout(() => setShowActionIcon(null), 600);

    if (youtubeId && ytPlayerRef.current) {
      try {
        if (nextState) {
          ytPlayerRef.current.playVideo();
        } else {
          ytPlayerRef.current.pauseVideo();
        }
      } catch {}
    } else if (videoRef.current) {
      if (nextState) {
        videoRef.current.play();
      } else {
        videoRef.current.pause();
      }
    }
  };

  const handleSeek = (newTimeSec: number) => {
    resetHideTimer();
    const boundedTime = Math.max(0, Math.min(duration, newTimeSec));
    setCurrentTime(boundedTime);

    if (youtubeId && ytPlayerRef.current) {
      try {
        ytPlayerRef.current.seekTo(boundedTime, true);
      } catch {}
    } else if (videoRef.current) {
      videoRef.current.currentTime = boundedTime;
    }
  };

  const handleSkip = (seconds: number) => {
    handleSeek(currentTime + seconds);
  };

  const handleVolumeChange = (newVol: number) => {
    resetHideTimer();
    setVolume(newVol);
    const muted = newVol === 0;
    setIsMuted(muted);

    if (youtubeId && ytPlayerRef.current) {
      try {
        if (muted) {
          ytPlayerRef.current.mute();
        } else {
          ytPlayerRef.current.unMute();
          ytPlayerRef.current.setVolume(newVol * 100);
        }
      } catch {}
    } else if (videoRef.current) {
      videoRef.current.volume = newVol;
      videoRef.current.muted = muted;
    }
  };

  const toggleMute = () => {
    resetHideTimer();
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);

    if (youtubeId && ytPlayerRef.current) {
      try {
        if (nextMuted) {
          ytPlayerRef.current.mute();
        } else {
          ytPlayerRef.current.unMute();
          ytPlayerRef.current.setVolume((volume || 0.8) * 100);
        }
      } catch {}
    } else if (videoRef.current) {
      videoRef.current.muted = nextMuted;
    }
  };

  const handleSpeedChange = (speed: number) => {
    resetHideTimer();
    setPlaybackSpeed(speed);

    if (youtubeId && ytPlayerRef.current) {
      try {
        ytPlayerRef.current.setPlaybackRate(speed);
      } catch {}
    } else if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
  };

  const toggleFullscreen = () => {
    resetHideTimer();
    if (!containerRef.current) return;

    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  // Formatter for time display
  const formatTime = (seconds: number) => {
    const s = Math.floor(seconds || 0);
    const hrs = Math.floor(s / 3600);
    const mins = Math.floor((s % 3600) / 60);
    const secs = s % 60;
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercent = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;

  return (
    <div 
      ref={containerRef}
      onMouseMove={resetHideTimer}
      onTouchStart={resetHideTimer}
      onMouseEnter={() => {
        setIsHovered(true);
        resetHideTimer();
      }}
      onMouseLeave={() => {
        setIsHovered(false);
        if (isPlaying) setShowControls(false);
      }}
      className={`relative w-full h-full min-h-[320px] md:min-h-[460px] bg-black select-none overflow-hidden group flex items-center justify-center ${
        isFullscreen ? 'fixed inset-0 z-50 min-h-screen rounded-none' : 'rounded-2xl md:rounded-3xl'
      }`}
    >
      {/* ─────────────────────────────────────────────────────────────
          MEDIA LAYER: YouTube (controls=0) OR HTML5 Video OR Fallback
         ───────────────────────────────────────────────────────────── */}
      {isDirectVideo && directVideoUrl ? (
        <video
          ref={videoRef}
          src={directVideoUrl}
          autoPlay
          playsInline
          className="w-full h-full object-contain pointer-events-none"
          onTimeUpdate={() => {
            if (videoRef.current) {
              const curr = videoRef.current.currentTime;
              const dur = videoRef.current.duration || duration;
              setCurrentTime(curr);
              setDuration(dur);
              if (onTimeUpdate) onTimeUpdate(curr, dur);
            }
          }}
          onLoadedMetadata={() => {
            if (videoRef.current) {
              setDuration(videoRef.current.duration || 3600);
              videoRef.current.volume = volume;
            }
          }}
          onEnded={() => {
            setIsPlaying(false);
            setShowControls(true);
          }}
        />
      ) : youtubeId ? (
        <div className="relative w-full h-full pointer-events-none">
          <div 
            id={ytContainerId.current} 
            className="w-full h-full min-h-[320px] md:min-h-[460px]" 
          />
        </div>
      ) : (
        /* Fallback for simulated/recorded lecture sessions without external URL */
        <div className="relative w-full h-full flex items-center justify-center bg-gradient-to-tr from-slate-950 via-slate-900 to-indigo-950 text-white p-8">
          <div className="absolute inset-0 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:20px_20px] opacity-10" />
          <div className="relative z-10 text-center space-y-3 max-w-md">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-300 border border-blue-500/20 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Inspire HD Academic Stream</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              {video.title}
            </h3>
            <p className="text-xs text-slate-300 line-clamp-2">
              {video.description}
            </p>
            <div className="flex items-center justify-center gap-3 text-xs text-slate-400 font-mono pt-1">
              <Clock className="w-3.5 h-3.5 text-blue-400" />
              <span>{video.duration}</span>
              <span>·</span>
              <span className="text-emerald-400 font-semibold">Certified Module</span>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          CLICK-CAPTURE CANVAS (Click anywhere to play / pause)
         ───────────────────────────────────────────────────────────── */}
      <div 
        onClick={togglePlay}
        className="absolute inset-0 z-10 cursor-pointer"
        title={isPlaying ? 'Click to pause' : 'Click to play'}
      />

      {/* Center Big Play / Pause Action Pulse */}
      {showActionIcon && (
        <div className="absolute z-20 pointer-events-none flex items-center justify-center animate-ping duration-300">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-black/60 backdrop-blur-md border border-white/20 flex items-center justify-center text-white shadow-2xl">
            {showActionIcon === 'play' ? (
              <Play className="w-8 h-8 sm:w-10 sm:h-10 fill-white ml-1" />
            ) : (
              <Pause className="w-8 h-8 sm:w-10 sm:h-10 fill-white" />
            )}
          </div>
        </div>
      )}

      {/* Center Persistent Pause Button when Paused */}
      {!isPlaying && (
        <div 
          onClick={togglePlay}
          className="absolute z-20 cursor-pointer flex items-center justify-center group/center-play transition-transform hover:scale-105 active:scale-95"
        >
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-blue-600/90 hover:bg-blue-600 text-white flex items-center justify-center shadow-[0_0_30px_rgba(37,99,235,0.5)] border border-white/30 backdrop-blur-md transition-all">
            <Play className="w-7 h-7 sm:w-9 sm:h-9 fill-white ml-1" />
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TOP IN-VIDEO BAR (Embedded inside video, fades on idle)
         ───────────────────────────────────────────────────────────── */}
      <div 
        className={`absolute top-0 inset-x-0 z-30 p-4 sm:p-5 bg-gradient-to-b from-black/80 via-black/40 to-transparent flex items-center justify-between gap-3 text-white transition-opacity duration-300 pointer-events-auto ${
          showControls || !isPlaying ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-300 bg-emerald-950/70 border border-emerald-500/30 px-2.5 py-0.5 rounded-lg shrink-0 font-sans">
            {video.month}
          </span>
          <h2 className="text-xs sm:text-sm font-bold text-white truncate max-w-sm sm:max-w-md drop-shadow-sm">
            {video.title}
          </h2>
        </div>

        {onClose && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="p-1.5 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-colors backdrop-blur-sm shrink-0"
            title="Close video"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* ─────────────────────────────────────────────────────────────
          BOTTOM IN-VIDEO CONTROLS (Embedded directly inside video)
         ───────────────────────────────────────────────────────────── */}
      <div 
        onClick={(e) => e.stopPropagation()}
        className={`absolute bottom-0 inset-x-0 z-30 p-3 sm:p-5 bg-gradient-to-t from-black/90 via-black/60 to-transparent text-white space-y-2.5 transition-opacity duration-300 pointer-events-auto ${
          showControls || !isPlaying ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Interactive Precision Scrubber Bar */}
        <div 
          className="relative w-full h-3 group/scrub flex items-center cursor-pointer"
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const clickPos = (e.clientX - rect.left) / rect.width;
            handleSeek(clickPos * duration);
          }}
        >
          {/* Background Track */}
          <div className="w-full h-1 sm:h-1.5 bg-white/20 rounded-full overflow-hidden transition-all group-hover/scrub:h-2">
            <div 
              className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-100"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* Scrub Head Handle */}
          <div 
            className="absolute w-3.5 h-3.5 rounded-full bg-white shadow-lg border border-blue-600 -translate-x-1/2 scale-0 group-hover/scrub:scale-100 transition-transform duration-150"
            style={{ left: `${progressPercent}%` }}
          />
        </div>

        {/* Toolbar Buttons Row */}
        <div className="flex items-center justify-between text-xs font-semibold gap-2">
          
          {/* LEFT: Play/Pause, -10s, +10s, Volume, Time */}
          <div className="flex items-center gap-1.5 sm:gap-2.5">
            {/* Play/Pause */}
            <button
              onClick={togglePlay}
              className="p-1.5 sm:p-2 rounded-xl text-white hover:bg-white/15 active:scale-95 transition-all"
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? (
                <Pause className="w-4 h-4 sm:w-5 sm:h-5 fill-white" />
              ) : (
                <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-white ml-0.5" />
              )}
            </button>

            {/* Skip Backward 10s */}
            <button
              onClick={() => handleSkip(-10)}
              className="p-1.5 sm:p-2 rounded-xl text-white/90 hover:text-white hover:bg-white/15 transition-all flex items-center gap-0.5"
              title="Rewind 10 seconds"
            >
              <RotateCcw className="w-4 h-4" />
              <span className="text-[10px] font-mono font-bold hidden sm:inline">-10s</span>
            </button>

            {/* Skip Forward 10s */}
            <button
              onClick={() => handleSkip(10)}
              className="p-1.5 sm:p-2 rounded-xl text-white/90 hover:text-white hover:bg-white/15 transition-all flex items-center gap-0.5"
              title="Forward 10 seconds"
            >
              <RotateCw className="w-4 h-4" />
              <span className="text-[10px] font-mono font-bold hidden sm:inline">+10s</span>
            </button>

            {/* Volume with Hover Slider */}
            <div className="flex items-center group/vol relative">
              <button
                onClick={toggleMute}
                className="p-1.5 sm:p-2 rounded-xl text-white/90 hover:text-white hover:bg-white/15 transition-all"
                title={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="w-4 h-4 text-red-400" />
                ) : (
                  <Volume2 className="w-4 h-4" />
                )}
              </button>
              
              <div className="w-0 group-hover/vol:w-16 sm:group-hover/vol:w-20 overflow-hidden transition-all duration-200 flex items-center pl-1">
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={isMuted ? 0 : volume}
                  onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                  className="w-16 sm:w-20 h-1 bg-white/30 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
              </div>
            </div>

            {/* Time Stamp Display */}
            <div className="font-mono text-[11px] sm:text-xs text-slate-300 font-medium pl-1 shrink-0">
              <span className="text-white font-bold">{formatTime(currentTime)}</span>
              <span className="text-white/40 mx-1">/</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* RIGHT: Speed Selector & Fullscreen */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Speed Selector */}
            <div className="flex items-center bg-white/10 backdrop-blur-md rounded-xl p-0.5 border border-white/10 text-[10px] sm:text-xs font-mono">
              {[1, 1.25, 1.5, 2].map((spd) => (
                <button
                  key={spd}
                  onClick={() => handleSpeedChange(spd)}
                  className={`px-1.5 sm:px-2 py-0.5 rounded-lg transition-all ${
                    playbackSpeed === spd
                      ? 'bg-blue-600 text-white font-bold shadow-xs'
                      : 'text-white/70 hover:text-white'
                  }`}
                >
                  {spd}x
                </button>
              ))}
            </div>

            {/* Fullscreen Toggle */}
            <button
              onClick={toggleFullscreen}
              className="p-1.5 sm:p-2 rounded-xl text-white/90 hover:text-white hover:bg-white/15 transition-all"
              title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            >
              {isFullscreen ? (
                <Minimize className="w-4 h-4" />
              ) : (
                <Maximize className="w-4 h-4" />
              )}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};
