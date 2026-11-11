import React, { useState, useEffect, useRef } from 'react';
import {
  Maximize2,
  HardDrive,
  FolderOpen,
  Keyboard,
  Play,
  Pause,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  SkipForward,
  SkipBack,
  ListVideo,
  Tv,
  CheckCircle2,
  Repeat,
} from 'lucide-react';
import { VideoSource, ZoomPanState, PlaybackRate } from './types/hockey';
import { VideoPlayerCanvas } from './components/VideoPlayerCanvas';
import { UgreenNasModal } from './components/UgreenNasModal';
import { KeyboardShortcutsModal } from './components/KeyboardShortcutsModal';
import { generateHockeySampleClip } from './utils/hockeyDemoVideo';

export default function App() {
  // Playlist State
  const [playlist, setPlaylist] = useState<VideoSource[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [loopPlaylist, setLoopPlaylist] = useState<boolean>(true);

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
  const [showPlaylistDrawer, setShowPlaylistDrawer] = useState<boolean>(true);

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

  // Pre-load 3 high-action hockey clips on startup to demonstrate continuous 0-delay playback
  useEffect(() => {
    let mounted = true;

    async function loadInitialClips() {
      const clip1Url = await generateHockeySampleClip(1, 'Period 1 - Neutral Zone Rush');
      if (!mounted || !clip1Url) return;

      const clip1: VideoSource = {
        id: 'clip_p1',
        name: 'Period 1: Neutral Zone Regroup & Entry (60fps)',
        type: 'sample',
        url: clip1Url,
        duration: 8,
        dateAdded: Date.now(),
      };

      setPlaylist([clip1]);

      // Generate clip 2 in background for seamless queue
      const clip2Url = await generateHockeySampleClip(2, 'Period 2 - Power Play Cycle');
      if (!mounted || !clip2Url) return;

      const clip2: VideoSource = {
        id: 'clip_p2',
        name: 'Period 2: Power Play Puck Movement (60fps)',
        type: 'sample',
        url: clip2Url,
        duration: 8,
        dateAdded: Date.now() + 1,
      };

      setPlaylist((prev) => [...prev, clip2]);

      // Generate clip 3
      const clip3Url = await generateHockeySampleClip(3, 'Period 3 - 6-on-5 Goalmouth Scramble');
      if (!mounted || !clip3Url) return;

      const clip3: VideoSource = {
        id: 'clip_p3',
        name: 'Period 3: Final Minute 6-on-5 Scramble (60fps)',
        type: 'sample',
        url: clip3Url,
        duration: 8,
        dateAdded: Date.now() + 2,
      };

      setPlaylist((prev) => [...prev, clip3]);
    }

    loadInitialClips();

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

  // Video File Selection (Supports selecting multiple files at once!)
  const handleFilesSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const newItems: VideoSource[] = Array.from(files).map((file, idx) => ({
      id: `file_${Date.now()}_${idx}`,
      name: file.name,
      type: 'upload',
      url: URL.createObjectURL(file),
      fileSize: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
      dateAdded: Date.now() + idx,
    }));

    setPlaylist((prev) => [...prev, ...newItems]);
    setIsPlaying(true);
  };

  // Add video source from Ugreen NAS Modal
  const handleAddNasSource = (source: VideoSource) => {
    setPlaylist((prev) => [...prev, source]);
    setIsPlaying(true);
  };

  // Playlist management helpers
  const handleRemoveTrack = (index: number) => {
    setPlaylist((prev) => {
      const next = prev.filter((_, i) => i !== index);
      if (currentIndex >= next.length) {
        setCurrentIndex(Math.max(0, next.length - 1));
      }
      return next;
    });
  };

  const handleMoveTrack = (index: number, direction: 'up' | 'down') => {
    const target = direction === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= playlist.length) return;

    setPlaylist((prev) => {
      const copy = [...prev];
      const item = copy[index];
      copy[index] = copy[target];
      copy[target] = item;
      return copy;
    });

    if (currentIndex === index) {
      setCurrentIndex(target);
    } else if (currentIndex === target) {
      setCurrentIndex(index);
    }
  };

  const handleClearPlaylist = () => {
    setPlaylist([]);
    setCurrentIndex(0);
  };

  const handleSkipNext = () => {
    if (playlist.length <= 1) return;
    const next = currentIndex + 1 < playlist.length ? currentIndex + 1 : loopPlaylist ? 0 : currentIndex;
    setCurrentIndex(next);
  };

  const handleSkipPrev = () => {
    if (playlist.length <= 1) return;
    const prev = currentIndex - 1 >= 0 ? currentIndex - 1 : loopPlaylist ? playlist.length - 1 : 0;
    setCurrentIndex(prev);
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

  // In fullscreen or clean mode: COMPLETELY UNOBSTRUCTED
  const isCompletelyUnobstructed = isFullscreen || isCleanMode;
  const currentVideo = playlist[currentIndex] || null;

  return (
    <div
      ref={mainContainerRef}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        if (e.dataTransfer.files) {
          handleFilesSelect(e.dataTransfer.files);
        }
      }}
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
            <div>
              <span className="text-base font-bold tracking-tight text-white whitespace-nowrap block">
                PuckVision Switcher Out
              </span>
            </div>
          </div>

          {/* Quick Action Links */}
          <nav className="hidden sm:flex items-center gap-6 text-xs font-medium text-slate-300">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="hover:text-white transition-colors flex items-center gap-1.5"
              title="Add video files from disk or mounted NAS"
            >
              <Plus className="w-3.5 h-3.5 text-sky-400" />
              <span>Add Videos</span>
            </button>
            <button
              onClick={() => setShowNasModal(true)}
              className="hover:text-white transition-colors flex items-center gap-1.5"
              title="Connect Ugreen NAS WebDAV or direct IP"
            >
              <HardDrive className="w-3.5 h-3.5 text-sky-400" />
              <span>Ugreen NAS</span>
            </button>
            <button
              onClick={() => setShowPlaylistDrawer(!showPlaylistDrawer)}
              className={`hover:text-white transition-colors flex items-center gap-1.5 ${
                showPlaylistDrawer ? 'text-sky-300 font-semibold' : ''
              }`}
            >
              <ListVideo className="w-3.5 h-3.5" />
              <span>Playlist ({playlist.length})</span>
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

          {/* Multi-file input (supports selecting multiple files at once!) */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="video/*,.mkv,.ts,.mp4,.mov,.m4v,.webm"
            className="hidden"
            onChange={(e) => {
              handleFilesSelect(e.target.files);
              e.target.value = '';
            }}
          />
        </header>
      )}

      {/* 2. MAIN BODY (Split between Video Viewport and Playlist Drawer when not in fullscreen) */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Central Video Viewport */}
        <main className="flex-1 relative w-full h-full bg-black overflow-hidden flex items-center justify-center">
          {playlist.length > 0 ? (
            <VideoPlayerCanvas
              playlist={playlist}
              currentIndex={currentIndex}
              onIndexChange={setCurrentIndex}
              isPlaying={isPlaying}
              onPlayStateChange={setIsPlaying}
              onTimeUpdate={setCurrentTime}
              onDurationChange={setDuration}
              playbackRate={playbackRate}
              zoomPan={zoomPan}
              onZoomPanChange={setZoomPan}
              isFullscreen={isFullscreen}
              onFullscreenChange={setIsFullscreen}
              isCleanMode={isCleanMode}
              onToggleCleanMode={() => setIsCleanMode(!isCleanMode)}
              loopPlaylist={loopPlaylist}
            />
          ) : (
            <div className="text-center text-slate-500 space-y-3 p-6">
              <ListVideo className="w-12 h-12 text-slate-600 mx-auto" />
              <p className="text-sm font-medium text-slate-300">Playlist is empty</p>
              <p className="text-xs text-slate-500">
                Add hockey clips from your Ugreen NAS or computer to start continuous playback
              </p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 text-xs bg-sky-600 hover:bg-sky-500 text-white font-medium rounded-lg shadow-sm"
              >
                Select Video Files
              </button>
            </div>
          )}
        </main>

        {/* 3. PLAYLIST DRAWER (Visible when enabled and NOT in fullscreen) */}
        {!isCompletelyUnobstructed && showPlaylistDrawer && (
          <aside className="w-80 bg-slate-900 border-l border-slate-800 flex flex-col h-full text-slate-200 select-none shrink-0 z-20">
            {/* Drawer Header */}
            <div className="p-3.5 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-300 block">
                  Continuous Playlist
                </span>
                <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-mono">
                  <CheckCircle2 className="w-3 h-3" />
                  0ms Gapless Dual-Deck Ready
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="p-1.5 rounded-lg bg-sky-600/30 hover:bg-sky-600/50 text-sky-300 border border-sky-500/40"
                  title="Add more videos"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setShowPlaylistDrawer(false)}
                  className="text-xs text-slate-400 hover:text-white px-2 py-1 rounded hover:bg-slate-800"
                >
                  Hide
                </button>
              </div>
            </div>

            {/* Loop Toggle Bar */}
            <div className="px-3.5 py-2 bg-slate-950/30 border-b border-slate-800/80 flex items-center justify-between text-xs">
              <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                <input
                  type="checkbox"
                  checked={loopPlaylist}
                  onChange={(e) => setLoopPlaylist(e.target.checked)}
                  className="rounded text-sky-500 focus:ring-0 bg-slate-800 border-slate-700"
                />
                <span className="flex items-center gap-1.5 text-[11px]">
                  <Repeat className="w-3 h-3 text-sky-400" />
                  Loop Continuous
                </span>
              </label>

              {playlist.length > 0 && (
                <button
                  onClick={handleClearPlaylist}
                  className="text-[11px] text-slate-400 hover:text-rose-400"
                >
                  Clear All
                </button>
              )}
            </div>

            {/* Playlist Queue Items */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
              {playlist.map((item, idx) => {
                const isActive = idx === currentIndex;
                return (
                  <div
                    key={item.id}
                    onClick={() => setCurrentIndex(idx)}
                    className={`p-2.5 rounded-lg border text-xs cursor-pointer transition-colors group ${
                      isActive
                        ? 'bg-sky-950/50 border-sky-500 text-sky-100 shadow-sm'
                        : 'bg-slate-800/40 hover:bg-slate-800 border-slate-700/60 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 truncate">
                        <span
                          className={`w-5 h-5 rounded flex items-center justify-center font-mono text-[10px] shrink-0 ${
                            isActive
                              ? 'bg-sky-500 text-white font-bold'
                              : 'bg-slate-700 text-slate-300'
                          }`}
                        >
                          {idx + 1}
                        </span>
                        <div className="truncate">
                          <span className="font-medium block truncate text-[11px]">
                            {item.name}
                          </span>
                          <span className="text-[10px] text-slate-400 uppercase font-mono">
                            {item.type} {item.fileSize ? `· ${item.fileSize}` : ''}
                          </span>
                        </div>
                      </div>

                      {/* Action buttons (Reorder / Delete) */}
                      <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 shrink-0">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMoveTrack(idx, 'up');
                          }}
                          disabled={idx === 0}
                          className="p-1 hover:text-white disabled:opacity-30"
                          title="Move up"
                        >
                          <ChevronUp className="w-3 h-3" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMoveTrack(idx, 'down');
                          }}
                          disabled={idx === playlist.length - 1}
                          className="p-1 hover:text-white disabled:opacity-30"
                          title="Move down"
                        >
                          <ChevronDown className="w-3 h-3" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveTrack(idx);
                          }}
                          className="p-1 hover:text-rose-400"
                          title="Remove from playlist"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Add More Videos Drag Drop Box */}
            <div className="p-3 border-t border-slate-800 bg-slate-950/40">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-medium text-slate-200 transition-colors flex items-center justify-center gap-2"
              >
                <Plus className="w-3.5 h-3.5 text-sky-400" />
                <span>Add More Videos to Playlist</span>
              </button>
            </div>
          </aside>
        )}
      </div>

      {/* 4. BOTTOM CONTROL BAR (Completely hidden in full-screen mode for 0% video obstruction) */}
      {!isCompletelyUnobstructed && (
        <footer className="bg-slate-900 border-t border-slate-800 p-3 sm:px-6 shrink-0 z-30 select-none">
          {/* Quick Hotkey Cheat Sheet Bar */}
          <div className="mb-2.5 flex flex-wrap items-center justify-between text-xs text-slate-300 gap-2 border-b border-slate-800/80 pb-2">
            <div className="flex items-center gap-3 font-mono text-[11px] overflow-x-auto">
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-sky-300 font-bold">
                  A
                </kbd>
                <span>Zoom In</span>
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-sky-300 font-bold">
                  S
                </kbd>
                <span>Zoom Out</span>
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-amber-300 font-bold">
                  ← → ↑ ↓
                </kbd>
                <span>Pan</span>
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 font-bold">
                  Space
                </kbd>
                <span>Play/Pause</span>
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-sky-300 font-bold">
                  N / P
                </kbd>
                <span>Next/Prev Video</span>
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 font-bold">
                  R
                </kbd>
                <span>Reset 100%</span>
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-emerald-300 font-bold">
                  F
                </kbd>
                <span>Fullscreen</span>
              </span>
            </div>

            <div className="text-[11px] font-mono text-slate-400 shrink-0">
              Playing Track {playlist.length > 0 ? currentIndex + 1 : 0} of {playlist.length} · Zoom:{' '}
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

          {/* Transport Controls */}
          <div className="flex items-center gap-3">
            {/* Previous Video Button */}
            <button
              onClick={handleSkipPrev}
              disabled={playlist.length <= 1}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white disabled:opacity-30 transition-colors"
              title="Previous Video (P)"
            >
              <SkipBack className="w-4 h-4" />
            </button>

            {/* Play / Pause Button */}
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

            {/* Next Video Button */}
            <button
              onClick={handleSkipNext}
              disabled={playlist.length <= 1}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white disabled:opacity-30 transition-colors"
              title="Next Video (N)"
            >
              <SkipForward className="w-4 h-4" />
            </button>

            {/* Time Indicator */}
            <span className="text-xs font-mono tabular-nums text-slate-400 shrink-0">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>

            {/* Scrubber */}
            <input
              type="range"
              min={0}
              max={duration || 100}
              step={0.1}
              value={currentTime}
              onChange={(e) => {
                const targetTime = parseFloat(e.target.value);
                setCurrentTime(targetTime);
                const vids = document.querySelectorAll('video');
                vids.forEach((v) => {
                  v.currentTime = targetTime;
                });
              }}
              className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer"
            />

            {/* Start Fullscreen Button */}
            <button
              onClick={handleToggleFullscreen}
              className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shrink-0 shadow-sm"
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
        onSelectSource={handleAddNasSource}
        onFileSelect={(file) => handleFilesSelect([file] as unknown as FileList)}
      />

      {/* Keyboard Shortcuts Modal */}
      <KeyboardShortcutsModal
        isOpen={showShortcutsModal}
        onClose={() => setShowShortcutsModal(false)}
      />
    </div>
  );
}
