import React, { useState, useEffect, useRef } from 'react';
import {
  Maximize2,
  HardDrive,
  FolderOpen,
  Keyboard,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Tv,
} from 'lucide-react';
import { VideoSource, ZoomPanState, PlaybackRate } from './types/hockey';
import { VideoPlayerCanvas } from './components/VideoPlayerCanvas';
import { UgreenNasModal } from './components/UgreenNasModal';
import { KeyboardShortcutsModal } from './components/KeyboardShortcutsModal';
import { generateHockeySampleClip } from './utils/hockeyDemoVideo';

export default function App() {
  // Video Source
  const [videoSources, setVideoSources] = useState<VideoSource[]>([]);
  const [currentSource, setCurrentSource] = useState<VideoSource | null>(null);

  // Playback State
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [playbackRate, setPlaybackRate] = useState<PlaybackRate>(1);

  // Zoom and Pan State
  const [zoomPan, setZoomPan] = useState<ZoomPanState>({
    scale: 1,
    panX: 0,
    panY: 0,
    panSpeed: 1,
  });

  // Full-screen and Clean Display
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isCleanMode, setIsCleanMode] = useState<boolean>(false);
  const [showNasModal, setShowNasModal] = useState<boolean>(false);
  const [showShortcutsModal, setShowShortcutsModal] = useState<boolean>(false);

  // Container ref for true fullscreen
  const mainContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Listen for native fullscreen changes
  useEffect(() => {
    const handleFsChange = () => {
      const isFs = !!(
        document.fullscreenElement ||
        (document as unknown as { webkitFullscreenElement?: Element }).webkitFullscreenElement
      );
      setIsFullscreen(isFs);
    };

    document.addEventListener('fullscreenchange', handleFsChange);
    document.addEventListener('webkitfullscreenchange', handleFsChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFsChange);
      document.removeEventListener('webkitfullscreenchange', handleFsChange);
    };
  }, []);

  // Pre-load high-action regulation hockey simulation clip on startup
  useEffect(() => {
    let mounted = true;
    generateHockeySampleClip().then((blobUrl) => {
      if (!mounted) return;
      if (blobUrl) {
        const sampleSource: VideoSource = {
          id: 'hockey_demo_match',
          name: 'Hockey Game Playout (60fps Regulation Ice)',
          type: 'sample',
          url: blobUrl,
          duration: 10,
          dateAdded: Date.now(),
        };
        setVideoSources([sampleSource]);
        setCurrentSource(sampleSource);
      }
    });

    return () => {
      mounted = false;
    };
  }, []);

  // Enter / Exit Fullscreen
  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      if (mainContainerRef.current) {
        mainContainerRef.current.requestFullscreen().catch(() => {});
      } else {
        document.documentElement.requestFullscreen().catch(() => {});
      }
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // Video File Selection (from mounted Ugreen NAS, local drive, or USB)
  const handleFileSelect = (file: File) => {
    const fileUrl = URL.createObjectURL(file);
    const newSource: VideoSource = {
      id: `file_${Date.now()}`,
      name: file.name,
      type: 'upload',
      url: fileUrl,
      fileSize: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
      dateAdded: Date.now(),
    };
    setVideoSources((prev) => [newSource, ...prev]);
    setCurrentSource(newSource);
    setZoomPan({ scale: 1, panX: 0, panY: 0, panSpeed: 1 });
    setIsPlaying(true);
  };

  // Reset Zoom
  const handleResetZoom = () => {
    setZoomPan({ scale: 1, panX: 0, panY: 0, panSpeed: 1 });
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) secs = 0;
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // When in fullscreen or clean mode: COMPLETELY UNOBSTRUCTED
  const isCompletelyUnobstructed = isFullscreen || isCleanMode;

  return (
    <div
      ref={mainContainerRef}
      className="flex flex-col h-screen w-screen bg-black text-slate-100 overflow-hidden font-sans select-none"
    >
      {/* 1. TOP HEADER (Completely hidden in full-screen mode for 0% video obstruction) */}
      {!isCompletelyUnobstructed && (
        <header className="flex items-center justify-between gap-8 px-6 py-3 border-b border-slate-800 bg-slate-950 shrink-0 z-30">
          {/* Brand */}
          <div className="flex items-center gap-2.5 whitespace-nowrap shrink-0">
            <div className="w-8 h-8 rounded-lg bg-sky-500/20 border border-sky-400/40 flex items-center justify-center text-sky-400">
              <Tv className="w-4 h-4 text-sky-400" />
            </div>
            <span className="text-base font-bold tracking-tight text-white whitespace-nowrap shrink-0">
              PuckVision Switcher Out
            </span>
          </div>

          {/* Quick Action Links */}
          <nav className="hidden sm:flex items-center gap-6 text-xs font-medium text-slate-300">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="hover:text-white transition-colors flex items-center gap-1.5"
            >
              <FolderOpen className="w-3.5 h-3.5 text-sky-400" />
              <span>Open Hockey Video</span>
            </button>
            <button
              onClick={() => setShowNasModal(true)}
              className="hover:text-white transition-colors flex items-center gap-1.5"
            >
              <HardDrive className="w-3.5 h-3.5 text-sky-400" />
              <span>Ugreen NAS Stream</span>
            </button>
            <button
              onClick={() => setShowShortcutsModal(true)}
              className="hover:text-white transition-colors flex items-center gap-1.5"
            >
              <Keyboard className="w-3.5 h-3.5 text-sky-400" />
              <span>Keys</span>
            </button>
          </nav>

          {/* Primary Action Button: Enter Fullscreen */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={handleToggleFullscreen}
              className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors flex items-center gap-2 shadow-sm"
            >
              <Maximize2 className="w-4 h-4" />
              <span>Start Full-Screen (Press F)</span>
            </button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="video/*,.mkv,.ts,.mp4,.mov"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileSelect(file);
            }}
          />
        </header>
      )}

      {/* 2. MAIN VIDEO VIEWPORT */}
      <main className="flex-1 relative w-full h-full bg-black overflow-hidden flex items-center justify-center">
        {currentSource ? (
          <VideoPlayerCanvas
            videoUrl={currentSource.url}
            isPlaying={isPlaying}
            onPlayStateChange={setIsPlaying}
            onTimeUpdate={setCurrentTime}
            onDurationChange={setDuration}
            seekTime={null}
            playbackRate={playbackRate}
            zoomPan={zoomPan}
            onZoomPanChange={setZoomPan}
            isFullscreen={isFullscreen}
            onFullscreenChange={setIsFullscreen}
            isCleanMode={isCleanMode}
            onToggleCleanMode={() => setIsCleanMode(!isCleanMode)}
            showMinimap={false}
            onToggleMinimap={() => {}}
          />
        ) : (
          <div className="text-center text-slate-500 space-y-3">
            <p className="text-sm">No video loaded</p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 text-xs bg-slate-800 text-slate-200 rounded-lg border border-slate-700"
            >
              Select Video File
            </button>
          </div>
        )}
      </main>

      {/* 3. BOTTOM CONTROL BAR (Completely hidden in full-screen mode for 0% video obstruction) */}
      {!isCompletelyUnobstructed && (
        <footer className="bg-slate-900 border-t border-slate-800 p-3 sm:px-6 shrink-0 z-30 select-none">
          {/* Quick Hotkey Cheat Sheet Bar */}
          <div className="mb-2.5 flex flex-wrap items-center justify-between text-xs text-slate-300 gap-2 border-b border-slate-800/80 pb-2">
            <div className="flex items-center gap-4 font-mono text-[11px]">
              <span className="flex items-center gap-1.5">
                <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-sky-300 font-bold">
                  A
                </kbd>
                <span>Zoom In</span>
              </span>
              <span className="flex items-center gap-1.5">
                <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-sky-300 font-bold">
                  S
                </kbd>
                <span>Zoom Out</span>
              </span>
              <span className="flex items-center gap-1.5">
                <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-amber-300 font-bold">
                  ← → ↑ ↓
                </kbd>
                <span>Pan Video</span>
              </span>
              <span className="flex items-center gap-1.5">
                <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 font-bold">
                  Space
                </kbd>
                <span>Play / Pause</span>
              </span>
              <span className="flex items-center gap-1.5">
                <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 font-bold">
                  R
                </kbd>
                <span>Reset (100%)</span>
              </span>
              <span className="flex items-center gap-1.5">
                <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-emerald-300 font-bold">
                  F
                </kbd>
                <span>Fullscreen</span>
              </span>
            </div>

            <div className="text-[11px] font-mono text-slate-400">
              Current Zoom:{' '}
              <span className="text-sky-400 font-bold">{zoomPan.scale.toFixed(1)}x</span>
              {zoomPan.scale > 1.05 && (
                <button
                  onClick={handleResetZoom}
                  className="ml-2 text-amber-400 hover:underline"
                >
                  (Reset)
                </button>
              )}
            </div>
          </div>

          {/* Scrubber & Basic Play Controls */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="w-8 h-8 rounded-lg bg-sky-600 hover:bg-sky-500 text-white flex items-center justify-center transition-colors shrink-0"
              title="Play / Pause (Space)"
            >
              {isPlaying ? (
                <Pause className="w-4 h-4 fill-white" />
              ) : (
                <Play className="w-4 h-4 fill-white ml-0.5" />
              )}
            </button>

            <span className="text-xs font-mono tabular-nums text-slate-400 shrink-0">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>

            <input
              type="range"
              min={0}
              max={duration || 100}
              step={0.1}
              value={currentTime}
              onChange={(e) => {
                const targetTime = parseFloat(e.target.value);
                setCurrentTime(targetTime);
                const vid = document.querySelector('video');
                if (vid) vid.currentTime = targetTime;
              }}
              className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer"
            />

            <button
              onClick={handleToggleFullscreen}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shrink-0"
              title="Enter Fullscreen (F)"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span>Full-Screen</span>
            </button>
          </div>
        </footer>
      )}

      {/* Ugreen NAS Connection Modal */}
      <UgreenNasModal
        isOpen={showNasModal}
        onClose={() => setShowNasModal(false)}
        onSelectSource={(src) => {
          setVideoSources((prev) => [src, ...prev]);
          setCurrentSource(src);
          handleResetZoom();
        }}
        onFileSelect={handleFileSelect}
      />

      {/* Keyboard Shortcuts Modal */}
      <KeyboardShortcutsModal
        isOpen={showShortcutsModal}
        onClose={() => setShowShortcutsModal(false)}
      />
    </div>
  );
}
