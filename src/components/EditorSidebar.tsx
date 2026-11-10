import React, { useState } from 'react';
import {
  Film,
  HardDrive,
  Upload,
  Sparkles,
  Bookmark,
  Trash2,
  Play,
  Share2,
  Download,
  PenTool,
  Move,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ZoomIn,
} from 'lucide-react';
import { VideoSource, PlayClip, ZoomPanState } from '../types/hockey';

interface EditorSidebarProps {
  currentSource: VideoSource | null;
  videoSources: VideoSource[];
  onSelectSource: (source: VideoSource) => void;
  onOpenNasModal: () => void;
  onFileUpload: (file: File) => void;
  onLoadSample: () => void;
  clips: PlayClip[];
  onSelectClip: (clip: PlayClip) => void;
  onDeleteClip: (id: string) => void;
  zoomPan: ZoomPanState;
  onZoomPanChange: (state: ZoomPanState) => void;
  isTelestratorActive: boolean;
  onToggleTelestrator: () => void;
  drawTool: 'circle' | 'arrow' | 'freehand';
  onChangeDrawTool: (tool: 'circle' | 'arrow' | 'freehand') => void;
  activeColor: string;
  onChangeColor: (color: string) => void;
  onClearDrawings: () => void;
  isOpen: boolean;
  onToggleOpen: () => void;
}

export const EditorSidebar: React.FC<EditorSidebarProps> = ({
  currentSource,
  videoSources,
  onSelectSource,
  onOpenNasModal,
  onFileUpload,
  onLoadSample,
  clips,
  onSelectClip,
  onDeleteClip,
  zoomPan,
  onZoomPanChange,
  isTelestratorActive,
  onToggleTelestrator,
  drawTool,
  onChangeDrawTool,
  activeColor,
  onChangeColor,
  onClearDrawings,
  isOpen,
  onToggleOpen,
}) => {
  const [activeTab, setActiveTab] = useState<'clips' | 'zoom' | 'sources'>('clips');

  if (!isOpen) return null;

  const zoomPresets = [1.0, 1.5, 2.0, 3.0, 4.0, 6.0];
  const colors = ['#facc15', '#ef4444', '#38bdf8', '#ffffff', '#22c55e'];

  const handlePanStep = (dx: number, dy: number) => {
    if (zoomPan.scale <= 1) return;
    onZoomPanChange({
      ...zoomPan,
      panX: zoomPan.panX + dx,
      panY: zoomPan.panY + dy,
    });
  };

  const exportClipsJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(clips, null, 2));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute('href', dataStr);
    dlAnchor.setAttribute('download', `Hockey_Game_Clips_${Date.now()}.json`);
    dlAnchor.click();
  };

  return (
    <aside className="w-80 bg-slate-900 border-l border-slate-800 flex flex-col h-full text-slate-200 select-none shrink-0 z-30">
      {/* Sidebar Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-950/40">
        <div className="flex items-center gap-2">
          <Film className="w-4 h-4 text-sky-400" />
          <span className="text-xs font-semibold tracking-wider uppercase text-slate-300">
            Editor Panel
          </span>
        </div>
        <button
          onClick={onToggleOpen}
          className="text-xs text-slate-400 hover:text-white px-2 py-0.5 rounded hover:bg-slate-800"
          title="Collapse Panel"
        >
          Hide
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800 bg-slate-950/20 text-xs font-medium">
        <button
          onClick={() => setActiveTab('clips')}
          className={`flex-1 py-2.5 text-center border-b-2 transition-colors ${
            activeTab === 'clips'
              ? 'border-sky-400 text-sky-400 font-semibold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Plays ({clips.length})
        </button>
        <button
          onClick={() => setActiveTab('zoom')}
          className={`flex-1 py-2.5 text-center border-b-2 transition-colors ${
            activeTab === 'zoom'
              ? 'border-sky-400 text-sky-400 font-semibold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Zoom &amp; Pan
        </button>
        <button
          onClick={() => setActiveTab('sources')}
          className={`flex-1 py-2.5 text-center border-b-2 transition-colors ${
            activeTab === 'sources'
              ? 'border-sky-400 text-sky-400 font-semibold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Videos
        </button>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* TAB 1: CLIPS & HIGHLIGHTS */}
        {activeTab === 'clips' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Tagged Game Plays
              </span>
              {clips.length > 0 && (
                <button
                  onClick={exportClipsJson}
                  className="text-[11px] text-sky-400 hover:text-sky-300 flex items-center gap-1 font-medium"
                  title="Export clips playlist as JSON"
                >
                  <Download className="w-3 h-3" />
                  Export
                </button>
              )}
            </div>

            {clips.length === 0 ? (
              <div className="p-6 text-center rounded-xl bg-slate-950/40 border border-slate-800 text-xs text-slate-400 space-y-2">
                <Bookmark className="w-6 h-6 text-slate-500 mx-auto" />
                <p className="font-medium text-slate-300">No play clips marked yet</p>
                <p className="text-[11px] text-slate-500">
                  Press <kbd className="px-1 py-0.5 bg-slate-800 rounded font-mono text-slate-300">I</kbd> to set In-Point, <kbd className="px-1 py-0.5 bg-slate-800 rounded font-mono text-slate-300">O</kbd> for Out-Point, then Save Play.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {clips.map((clip) => (
                  <div
                    key={clip.id}
                    className="p-3 rounded-lg bg-slate-800/70 hover:bg-slate-800 border border-slate-700/80 transition-colors group"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1 truncate">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-sky-500/20 text-sky-300 border border-sky-500/30">
                            {clip.tag}
                          </span>
                          <span className="text-xs font-medium text-slate-200 truncate">
                            {clip.title}
                          </span>
                        </div>
                        <div className="text-[11px] font-mono text-slate-400">
                          {clip.startTime.toFixed(2)}s – {clip.endTime.toFixed(2)}s (
                          {(clip.endTime - clip.startTime).toFixed(1)}s)
                        </div>
                      </div>
                      <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 shrink-0">
                        <button
                          onClick={() => onSelectClip(clip)}
                          className="p-1 rounded bg-sky-600 hover:bg-sky-500 text-white"
                          title="Jump to Clip"
                        >
                          <Play className="w-3.5 h-3.5 fill-white" />
                        </button>
                        <button
                          onClick={() => onDeleteClip(clip.id)}
                          className="p-1 rounded hover:bg-rose-950/60 text-slate-400 hover:text-rose-400"
                          title="Delete Clip"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Telestrator Coach Drawing Section */}
            <div className="pt-3 border-t border-slate-800 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <PenTool className="w-3.5 h-3.5 text-amber-400" />
                  Coach Telestrator (T)
                </span>
                <button
                  onClick={onToggleTelestrator}
                  className={`px-2 py-0.5 text-[11px] font-medium rounded transition-colors ${
                    isTelestratorActive
                      ? 'bg-amber-500 text-slate-950 font-bold'
                      : 'bg-slate-800 text-slate-300 hover:text-white'
                  }`}
                >
                  {isTelestratorActive ? 'Active' : 'Enable'}
                </button>
              </div>

              {isTelestratorActive && (
                <div className="space-y-2 p-2.5 rounded-lg bg-slate-950/50 border border-slate-800">
                  <div className="flex items-center gap-1">
                    {(['freehand', 'circle', 'arrow'] as const).map((t) => (
                      <button
                        key={t}
                        onClick={() => onChangeDrawTool(t)}
                        className={`flex-1 py-1 text-[11px] font-medium capitalize rounded transition-colors ${
                          drawTool === t
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                            : 'text-slate-400 hover:bg-slate-800'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>

                  {/* Colors */}
                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-1.5">
                      {colors.map((c) => (
                        <button
                          key={c}
                          onClick={() => onChangeColor(c)}
                          className={`w-5 h-5 rounded-full transition-transform ${
                            activeColor === c ? 'scale-125 ring-2 ring-white ring-offset-1 ring-offset-slate-900' : 'opacity-80 hover:opacity-100'
                          }`}
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                    <button
                      onClick={onClearDrawings}
                      className="text-[10px] text-slate-400 hover:text-rose-400"
                    >
                      Clear (C)
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: ZOOM & PAN */}
        {activeTab === 'zoom' && (
          <div className="space-y-4">
            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                Zoom Magnification
              </span>
              <div className="grid grid-cols-3 gap-1.5">
                {zoomPresets.map((pz) => (
                  <button
                    key={pz}
                    onClick={() => {
                      onZoomPanChange({
                        ...zoomPan,
                        scale: pz,
                        panX: pz === 1 ? 0 : zoomPan.panX,
                        panY: pz === 1 ? 0 : zoomPan.panY,
                      });
                    }}
                    className={`py-1.5 text-xs font-mono font-medium rounded-lg border transition-colors ${
                      Math.abs(zoomPan.scale - pz) < 0.1
                        ? 'bg-sky-600 text-white border-sky-500 shadow-sm'
                        : 'bg-slate-800/80 hover:bg-slate-800 border-slate-700 text-slate-300'
                    }`}
                  >
                    {pz.toFixed(1)}x
                  </button>
                ))}
              </div>
            </div>

            {/* Keyboard Pan Visual Guide & D-Pad */}
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                  <Move className="w-3.5 h-3.5 text-sky-400" />
                  Keyboard Pan
                </span>
                <span className="text-[10px] text-slate-500 font-mono">Arrow Keys / WASD</span>
              </div>

              {/* D-Pad Buttons */}
              <div className="flex flex-col items-center gap-1.5 py-1">
                <button
                  onClick={() => handlePanStep(0, 40)}
                  disabled={zoomPan.scale <= 1}
                  className="w-8 h-8 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center text-slate-200 border border-slate-700 shadow-xs"
                  title="Pan Up (ArrowUp or W)"
                >
                  <ArrowUp className="w-4 h-4" />
                </button>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handlePanStep(40, 0)}
                    disabled={zoomPan.scale <= 1}
                    className="w-8 h-8 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center text-slate-200 border border-slate-700 shadow-xs"
                    title="Pan Left (ArrowLeft or A)"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onZoomPanChange({ ...zoomPan, panX: 0, panY: 0 })}
                    disabled={zoomPan.scale <= 1}
                    className="w-8 h-8 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center text-[10px] font-mono text-slate-300 border border-slate-700"
                    title="Center Pan"
                  >
                    CTR
                  </button>
                  <button
                    onClick={() => handlePanStep(-40, 0)}
                    disabled={zoomPan.scale <= 1}
                    className="w-8 h-8 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center text-slate-200 border border-slate-700 shadow-xs"
                    title="Pan Right (ArrowRight or D)"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
                <button
                  onClick={() => handlePanStep(0, -40)}
                  disabled={zoomPan.scale <= 1}
                  className="w-8 h-8 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center text-slate-200 border border-slate-700 shadow-xs"
                  title="Pan Down (ArrowDown or S)"
                >
                  <ArrowDown className="w-4 h-4" />
                </button>
              </div>

              <div className="text-[11px] text-slate-400 space-y-1 border-t border-slate-800/80 pt-2 font-mono">
                <div className="flex justify-between">
                  <span>Pan X:</span>
                  <span className="text-sky-300">{Math.round(zoomPan.panX)}px</span>
                </div>
                <div className="flex justify-between">
                  <span>Pan Y:</span>
                  <span className="text-sky-300">{Math.round(zoomPan.panY)}px</span>
                </div>
                <div className="flex justify-between">
                  <span>Hold Shift:</span>
                  <span className="text-amber-300">Turbo Pan (3x)</span>
                </div>
              </div>
            </div>

            {/* Zero UI Instruction Box */}
            <div className="p-3 rounded-lg bg-sky-950/20 border border-sky-800/40 text-xs text-sky-200 space-y-1.5">
              <p className="font-semibold text-sky-100">Zero UI Fullscreen Review</p>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Press <kbd className="px-1 py-0.5 bg-slate-800 rounded font-mono text-white">F</kbd> for Fullscreen, then press <kbd className="px-1 py-0.5 bg-slate-800 rounded font-mono text-white">H</kbd> to hide all buttons and timeline. Enjoy 100% borderless hockey ice review.
              </p>
            </div>
          </div>
        )}

        {/* TAB 3: VIDEO SOURCES */}
        {activeTab === 'sources' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <button
                onClick={onOpenNasModal}
                className="w-full p-3 rounded-xl bg-sky-600/20 hover:bg-sky-600/30 border border-sky-500/40 text-sky-200 hover:text-white transition-colors flex items-center gap-3 text-left shadow-sm"
              >
                <div className="w-8 h-8 rounded-lg bg-sky-500/30 flex items-center justify-center text-sky-300 shrink-0">
                  <HardDrive className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-semibold block text-white">Connect Ugreen NAS</span>
                  <span className="text-[11px] text-slate-400 block">WebDAV / Direct IP stream</span>
                </div>
              </button>

              <label className="w-full p-3 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/80 text-slate-200 transition-colors flex items-center gap-3 text-left cursor-pointer">
                <div className="w-8 h-8 rounded-lg bg-slate-700 flex items-center justify-center text-slate-300 shrink-0">
                  <Upload className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-semibold block text-white">Open Local / Mounted Video</span>
                  <span className="text-[11px] text-slate-400 block">From mounted NAS drive or disk</span>
                </div>
                <input
                  type="file"
                  accept="video/*,.mkv,.ts"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) onFileUpload(f);
                  }}
                />
              </label>

              <button
                onClick={onLoadSample}
                className="w-full p-3 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/80 text-slate-200 transition-colors flex items-center gap-3 text-left"
              >
                <div className="w-8 h-8 rounded-lg bg-slate-700 flex items-center justify-center text-amber-400 shrink-0">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-semibold block text-white">Load Hockey Match Simulation</span>
                  <span className="text-[11px] text-slate-400 block">High-fps rink &amp; puck tracking</span>
                </div>
              </button>
            </div>

            {/* Video Library */}
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Video Queue ({videoSources.length})
              </span>
              <div className="space-y-1.5">
                {videoSources.map((src) => (
                  <div
                    key={src.id}
                    onClick={() => onSelectSource(src)}
                    className={`p-2.5 rounded-lg border text-xs cursor-pointer transition-colors flex items-center justify-between ${
                      currentSource?.id === src.id
                        ? 'bg-sky-500/15 border-sky-500/60 text-sky-200'
                        : 'bg-slate-800/40 hover:bg-slate-800 border-slate-700/60 text-slate-300'
                    }`}
                  >
                    <div className="truncate pr-2">
                      <span className="font-medium block truncate">{src.name}</span>
                      <span className="text-[10px] text-slate-500 uppercase">{src.type}</span>
                    </div>
                    {currentSource?.id === src.id && (
                      <span className="w-2 h-2 rounded-full bg-sky-400 shrink-0" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
