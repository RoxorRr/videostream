import React from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Maximize2,
  Minimize2,
  EyeOff,
  Camera,
  CircleDot,
  Volume2,
  VolumeX,
  ChevronLeft,
  ChevronRight,
  BookmarkPlus,
  Compass,
  Tv,
} from 'lucide-react';
import { PlaybackRate } from '../types/hockey';

interface PlaybackControlsProps {
  isPlaying: boolean;
  onTogglePlay: () => void;
  currentTime: number;
  duration: number;
  onSeek: (time: number) => void;
  playbackRate: PlaybackRate;
  onChangePlaybackRate: (rate: PlaybackRate) => void;
  onStepFrame: (frames: number) => void;
  scale: number;
  onResetZoom: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  inPoint: number | null;
  outPoint: number | null;
  onSetInPoint: () => void;
  onSetOutPoint: () => void;
  onClearPoints: () => void;
  onAddClip: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  isCleanMode: boolean;
  onToggleCleanMode: () => void;
  onTakeSnapshot: () => void;
  isRecordingZoom: boolean;
  onToggleRecordZoom: () => void;
  volume: number;
  isMuted: boolean;
  onToggleMute: () => void;
  onChangeVolume: (val: number) => void;
  showMinimap: boolean;
  onToggleMinimap: () => void;
  isHdmiConnected?: boolean;
  onOpenHdmiModal?: () => void;
}

export const PlaybackControls: React.FC<PlaybackControlsProps> = ({
  isPlaying,
  onTogglePlay,
  currentTime,
  duration,
  onSeek,
  playbackRate,
  onChangePlaybackRate,
  onStepFrame,
  scale,
  onResetZoom,
  onZoomIn,
  onZoomOut,
  inPoint,
  outPoint,
  onSetInPoint,
  onSetOutPoint,
  onClearPoints,
  onAddClip,
  isFullscreen,
  onToggleFullscreen,
  isCleanMode,
  onToggleCleanMode,
  onTakeSnapshot,
  isRecordingZoom,
  onToggleRecordZoom,
  volume,
  isMuted,
  onToggleMute,
  onChangeVolume,
  showMinimap,
  onToggleMinimap,
  isHdmiConnected,
  onOpenHdmiModal,
}) => {
  // If clean mode is enabled, hide the entire control bar
  if (isCleanMode) return null;

  const formatTimecode = (secs: number) => {
    if (isNaN(secs) || secs < 0) secs = 0;
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    const ms = Math.floor((secs % 1) * 30); // 30fps frames
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')};${ms.toString().padStart(2, '0')}`;
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
  const inPercent = inPoint !== null && duration > 0 ? (inPoint / duration) * 100 : null;
  const outPercent = outPoint !== null && duration > 0 ? (outPoint / duration) * 100 : null;

  const rates: PlaybackRate[] = [0.1, 0.25, 0.5, 1, 1.5, 2];

  return (
    <div className="bg-slate-900/95 border-t border-slate-800 p-3 sm:px-6 shadow-2xl backdrop-blur-md select-none text-slate-200">
      {/* 1. Scrubber & Timeline Bar */}
      <div className="relative mb-3 group">
        {/* In/Out Highlight Region */}
        {inPercent !== null && outPercent !== null && (
          <div
            className="absolute top-1/2 -translate-y-1/2 h-2.5 bg-amber-500/35 border-x border-amber-400 pointer-events-none rounded-xs z-10"
            style={{
              left: `${Math.min(inPercent, outPercent)}%`,
              width: `${Math.abs(outPercent - inPercent)}%`,
            }}
          />
        )}

        {/* In point marker tick */}
        {inPercent !== null && (
          <div
            className="absolute top-1/2 -translate-y-1/2 w-1.5 h-4 bg-amber-400 rounded-xs pointer-events-none z-20 shadow"
            style={{ left: `${inPercent}%` }}
            title={`In Point: ${formatTimecode(inPoint || 0)}`}
          />
        )}

        {/* Out point marker tick */}
        {outPercent !== null && (
          <div
            className="absolute top-1/2 -translate-y-1/2 w-1.5 h-4 bg-amber-400 rounded-xs pointer-events-none z-20 shadow"
            style={{ left: `${outPercent}%` }}
            title={`Out Point: ${formatTimecode(outPoint || 0)}`}
          />
        )}

        <input
          type="range"
          min={0}
          max={duration || 100}
          step={0.033}
          value={currentTime}
          onChange={(e) => onSeek(parseFloat(e.target.value))}
          className="w-full h-2 bg-slate-700/80 rounded-lg appearance-none cursor-pointer relative z-10 hover:h-2.5 transition-all"
        />

        {/* Time labels below bar */}
        <div className="flex justify-between items-center text-[11px] font-mono tabular-nums text-slate-400 mt-1">
          <div className="flex items-center gap-2">
            <span className="text-sky-400 font-bold">{formatTimecode(currentTime)}</span>
            <span>/</span>
            <span>{formatTimecode(duration)}</span>
            <span className="text-slate-500 text-[10px]">
              (Frm #{Math.floor(currentTime * 30)})
            </span>
          </div>

          <div className="flex items-center gap-3">
            {inPoint !== null && (
              <span className="text-amber-400 text-[10px]">
                IN: {formatTimecode(inPoint)}
              </span>
            )}
            {outPoint !== null && (
              <span className="text-amber-400 text-[10px]">
                OUT: {formatTimecode(outPoint)}
              </span>
            )}
            {inPoint !== null && outPoint !== null && (
              <span className="text-emerald-400 text-[10px]">
                CLIP: {(Math.abs(outPoint - inPoint)).toFixed(2)}s
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 2. Controls Toolbar Grid */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Left: Shuttle & Transport */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onSeek(0)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Restart Video (Home)"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Frame Step Back */}
          <button
            onClick={() => onStepFrame(-1)}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors flex items-center gap-0.5 text-xs font-mono"
            title="Step Back 1 Frame (< or ,)"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="text-[10px] hidden sm:inline">-1F</span>
          </button>

          {/* Play / Pause Main Button */}
          <button
            onClick={onTogglePlay}
            className="w-9 h-9 rounded-lg bg-sky-600 hover:bg-sky-500 text-white flex items-center justify-center transition-transform active:scale-95 shadow-md"
            title="Play / Pause (Space)"
          >
            {isPlaying ? <Pause className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-white ml-0.5" />}
          </button>

          {/* Frame Step Forward */}
          <button
            onClick={() => onStepFrame(1)}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors flex items-center gap-0.5 text-xs font-mono"
            title="Step Forward 1 Frame (> or .)"
          >
            <span className="text-[10px] hidden sm:inline">+1F</span>
            <ChevronRight className="w-4 h-4" />
          </button>

          {/* Speed Selector */}
          <div className="flex items-center gap-1 ml-2 p-1 bg-slate-800/80 rounded-lg border border-slate-700">
            {rates.map((rate) => (
              <button
                key={rate}
                onClick={() => onChangePlaybackRate(rate)}
                className={`px-1.5 py-0.5 text-[10px] font-mono font-medium rounded transition-colors ${
                  playbackRate === rate
                    ? 'bg-sky-500 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title={rate < 1 ? `Slow Motion (${rate}x)` : `${rate}x speed`}
              >
                {rate}x
              </button>
            ))}
          </div>

          {/* Volume Control */}
          <div className="hidden md:flex items-center gap-1 ml-2">
            <button
              onClick={onToggleMute}
              className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              {isMuted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={isMuted ? 0 : volume}
              onChange={(e) => onChangeVolume(parseFloat(e.target.value))}
              className="w-16 h-1 bg-slate-700 rounded appearance-none cursor-pointer"
            />
          </div>
        </div>

        {/* Center: Hockey In/Out Clip Editing */}
        <div className="flex items-center gap-1 bg-slate-950/60 p-1 rounded-lg border border-slate-800">
          <button
            onClick={onSetInPoint}
            className={`px-2 py-1 text-xs font-medium rounded transition-colors ${
              inPoint !== null
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
            title="Mark Play In Point (I)"
          >
            Mark In [I]
          </button>
          <button
            onClick={onSetOutPoint}
            className={`px-2 py-1 text-xs font-medium rounded transition-colors ${
              outPoint !== null
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
            title="Mark Play Out Point (O)"
          >
            Mark Out [O]
          </button>

          {(inPoint !== null || outPoint !== null) && (
            <>
              <button
                onClick={onAddClip}
                className="px-2 py-1 text-xs font-medium text-emerald-400 hover:bg-emerald-950/40 rounded transition-colors flex items-center gap-1"
                title="Save Highlight Play Clip"
              >
                <BookmarkPlus className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Save Play</span>
              </button>
              <button
                onClick={onClearPoints}
                className="px-1.5 py-1 text-[11px] text-slate-400 hover:text-slate-200"
                title="Clear In/Out markers"
              >
                Clear
              </button>
            </>
          )}
        </div>

        {/* Right: Zoom status, Clean Mode & Fullscreen */}
        <div className="flex items-center gap-2">
          {/* Zoom controls & indicator */}
          <div className="flex items-center gap-1 bg-slate-800/80 px-2 py-1 rounded-lg border border-slate-700">
            <button
              onClick={onZoomOut}
              className="text-xs font-mono text-slate-400 hover:text-white px-1"
              title="Zoom Out (-)"
            >
              -
            </button>
            <span className="text-xs font-mono text-sky-400 font-bold px-1 tabular-nums">
              {scale.toFixed(1)}x
            </span>
            <button
              onClick={onZoomIn}
              className="text-xs font-mono text-slate-400 hover:text-white px-1"
              title="Zoom In (+)"
            >
              +
            </button>
            {scale > 1.05 && (
              <button
                onClick={onResetZoom}
                className="text-[10px] text-slate-400 hover:text-amber-400 ml-1 border-l border-slate-700 pl-1.5"
                title="Reset zoom to 100% Fit (0)"
              >
                Reset
              </button>
            )}
          </div>

          {/* Minimap toggle */}
          <button
            onClick={onToggleMinimap}
            className={`p-2 rounded-lg transition-colors ${
              showMinimap ? 'bg-sky-500/20 text-sky-400 border border-sky-500/40' : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
            title="Toggle Rink Position Radar (M)"
          >
            <Compass className="w-4 h-4" />
          </button>

          {/* Snapshot grab */}
          <button
            onClick={onTakeSnapshot}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Capture HD Frame Snapshot (S)"
          >
            <Camera className="w-4 h-4" />
          </button>

          {/* Record Zoom Viewport */}
          <button
            onClick={onToggleRecordZoom}
            className={`p-2 rounded-lg transition-colors flex items-center gap-1 ${
              isRecordingZoom
                ? 'bg-rose-600 text-white animate-pulse'
                : 'text-slate-400 hover:text-rose-400 hover:bg-slate-800'
            }`}
            title={isRecordingZoom ? 'Stop Recording Zoom Clip' : 'Record Zoomed Action Video (R)'}
          >
            <CircleDot className="w-4 h-4" />
            {isRecordingZoom && <span className="text-[10px] font-mono font-bold pr-1">REC</span>}
          </button>

          {/* HDMI Mixer Clean Feed Button */}
          {onOpenHdmiModal && (
            <button
              onClick={onOpenHdmiModal}
              className={`p-2 rounded-lg transition-colors flex items-center gap-1.5 ${
                isHdmiConnected
                  ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-600/80 shadow-xs'
                  : 'text-slate-400 hover:text-emerald-300 hover:bg-slate-800'
              }`}
              title="HDMI Mixer & Program Output Setup (P)"
            >
              <Tv className="w-4 h-4" />
              {isHdmiConnected && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              )}
            </button>
          )}

          {/* ZERO UI / CLEAN MODE TOGGLE (Crucial for user request) */}
          <button
            onClick={onToggleCleanMode}
            className="px-2.5 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-medium flex items-center gap-1.5 transition-colors shadow-xs"
            title="Clean Review Mode: completely hide all UI overlays (H)"
          >
            <EyeOff className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Zero UI (H)</span>
          </button>

          {/* Fullscreen Toggle */}
          <button
            onClick={onToggleFullscreen}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
            title="Toggle Fullscreen (F)"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
};
