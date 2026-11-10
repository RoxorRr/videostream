import React, { useState } from 'react';
import {
  Tv,
  ExternalLink,
  CheckCircle2,
  Sliders,
  Sparkles,
  Info,
  X,
  Volume2,
  Layers,
  Monitor,
  Maximize2,
} from 'lucide-react';
import { HdmiFeedMode } from '../types/hdmi';

interface HdmiMixerModalProps {
  isOpen: boolean;
  onClose: () => void;
  feedMode: HdmiFeedMode;
  onChangeFeedMode: (mode: HdmiFeedMode) => void;
  isHdmiConnected: boolean;
  onOpenHdmiWindow: () => void;
  onEnterLocalCleanFullscreen: () => void;
  currentVideoName?: string;
}

export const HdmiMixerModal: React.FC<HdmiMixerModalProps> = ({
  isOpen,
  onClose,
  feedMode,
  onChangeFeedMode,
  isHdmiConnected,
  onOpenHdmiWindow,
  onEnterLocalCleanFullscreen,
  currentVideoName,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-700/80 rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400">
              <Tv className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold tracking-tight">HDMI Mixer &amp; Clean Program Output</h2>
                {isHdmiConnected ? (
                  <span className="flex items-center gap-1 text-[11px] font-mono text-emerald-400 bg-emerald-950/50 border border-emerald-800 px-2 py-0.2 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    HDMI Active
                  </span>
                ) : (
                  <span className="text-[11px] font-mono text-slate-400 bg-slate-800 px-2 py-0.2 rounded-full">
                    Standby
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                Send 100% original quality, zero-UI clean video to ATEM, Roland, vMix, or arena switchers
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 max-h-[72vh] overflow-y-auto">
          {/* Primary Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* 1. Popout Clean Window to HDMI */}
            <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/80 flex flex-col justify-between space-y-3">
              <div>
                <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider block mb-1">
                  Multi-Monitor Setup (Recommended)
                </span>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Opens a borderless, pure video window. Drag it to your HDMI-connected display/mixer and press <kbd className="px-1 py-0.5 bg-slate-700 rounded font-mono text-white text-[10px]">F</kbd> for fullscreen.
                </p>
              </div>
              <button
                onClick={() => {
                  onOpenHdmiWindow();
                  onClose();
                }}
                className="w-full py-2.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium flex items-center justify-center gap-2 transition-colors shadow-sm"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Launch HDMI Clean Feed Window</span>
              </button>
            </div>

            {/* 2. Direct Fullscreen on Current Display */}
            <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/80 flex flex-col justify-between space-y-3">
              <div>
                <span className="text-xs font-semibold text-sky-400 uppercase tracking-wider block mb-1">
                  Direct HDMI Display
                </span>
                <p className="text-xs text-slate-300 leading-relaxed">
                  If this computer is plugged directly into the HDMI mixer as the primary output, enters 100% borderless clean video at native resolution.
                </p>
              </div>
              <button
                onClick={() => {
                  onEnterLocalCleanFullscreen();
                  onClose();
                }}
                className="w-full py-2.5 px-3 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-xs font-medium flex items-center justify-center gap-2 transition-colors shadow-sm"
              >
                <Maximize2 className="w-4 h-4" />
                <span>Enter Direct Clean Fullscreen</span>
              </button>
            </div>
          </div>

          {/* Feed Mode Options */}
          <div className="space-y-2">
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
              HDMI Output Feed Mode
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {/* Option 1: Original Raw 1:1 */}
              <div
                onClick={() => onChangeFeedMode('original_raw')}
                className={`p-3 rounded-lg border text-xs cursor-pointer transition-all ${
                  feedMode === 'original_raw'
                    ? 'bg-emerald-950/40 border-emerald-500 text-emerald-100 shadow-sm'
                    : 'bg-slate-800/40 hover:bg-slate-800 border-slate-700 text-slate-300'
                }`}
              >
                <div className="flex items-center justify-between font-semibold mb-1">
                  <span>1:1 Original Quality</span>
                  {feedMode === 'original_raw' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                </div>
                <p className="text-[11px] text-slate-400 leading-normal">
                  Untouched native resolution and framerate without zoom interpolation. Lossless master stream.
                </p>
              </div>

              {/* Option 2: Live Program Follower */}
              <div
                onClick={() => onChangeFeedMode('live_program')}
                className={`p-3 rounded-lg border text-xs cursor-pointer transition-all ${
                  feedMode === 'live_program'
                    ? 'bg-sky-950/40 border-sky-500 text-sky-100 shadow-sm'
                    : 'bg-slate-800/40 hover:bg-slate-800 border-slate-700 text-slate-300'
                }`}
              >
                <div className="flex items-center justify-between font-semibold mb-1">
                  <span>Live Program Feed</span>
                  {feedMode === 'live_program' && <CheckCircle2 className="w-4 h-4 text-sky-400" />}
                </div>
                <p className="text-[11px] text-slate-400 leading-normal">
                  Sends live zoomed crops, pans, and coach telestrations directly to the mixer in real time.
                </p>
              </div>

              {/* Option 3: SMPTE Calibration Bars */}
              <div
                onClick={() => onChangeFeedMode('smpte_bars')}
                className={`p-3 rounded-lg border text-xs cursor-pointer transition-all ${
                  feedMode === 'smpte_bars'
                    ? 'bg-amber-950/40 border-amber-500 text-amber-100 shadow-sm'
                    : 'bg-slate-800/40 hover:bg-slate-800 border-slate-700 text-slate-300'
                }`}
              >
                <div className="flex items-center justify-between font-semibold mb-1">
                  <span>SMPTE Color Bars</span>
                  {feedMode === 'smpte_bars' && <CheckCircle2 className="w-4 h-4 text-amber-400" />}
                </div>
                <p className="text-[11px] text-slate-400 leading-normal">
                  Broadcast test bars with 90% Action Safe &amp; 80% Title Safe markers to verify mixer input levels.
                </p>
              </div>
            </div>
          </div>

          {/* Pro Broadcast Checklist */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2.5">
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Monitor className="w-3.5 h-3.5 text-sky-400" />
              HDMI Video Mixer Setup Guide
            </span>
            <ul className="text-xs text-slate-300 space-y-1.5 list-disc list-inside">
              <li>
                <strong className="text-slate-100">OS Display Mode</strong>: Set your operating system to <code className="text-sky-300 font-mono">Extend Display</code> (<kbd className="px-1 bg-slate-800 rounded font-mono text-[10px]">Win + P</kbd> on Windows or Displays &gt; Extended on Mac).
              </li>
              <li>
                <strong className="text-slate-100">Mixer Resolution</strong>: Video mixers typically accept standard <code className="text-emerald-300 font-mono">1080p 59.94Hz</code>, <code className="text-emerald-300 font-mono">1080p 60Hz</code>, or <code className="text-emerald-300 font-mono">1080p 50Hz</code>. Ensure your computer's HDMI output matches the mixer's project standard.
              </li>
              <li>
                <strong className="text-slate-100">Zero UI Clean Feed</strong>: The HDMI Program window contains 0% buttons, watermarks, or timeline bars for seamless broadcast switching.
              </li>
              <li>
                <strong className="text-slate-100">Hotkeys</strong>: On the HDMI window, press <kbd className="px-1 bg-slate-800 rounded font-mono text-[10px]">F</kbd> for fullscreen, or use your editor window to scrub, step frames, and play.
              </li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-slate-800 bg-slate-950/60">
          <div className="text-xs text-slate-400 font-mono truncate max-w-sm">
            Active: {currentVideoName || 'Default Stream'}
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
