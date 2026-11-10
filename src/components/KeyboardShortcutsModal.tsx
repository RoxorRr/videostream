import React from 'react';
import { X, Keyboard } from 'lucide-react';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const shortcutGroups = [
    {
      category: 'Zoom & Pan Controls (Video Switcher)',
      items: [
        { key: 'A', desc: 'Zoom In (magnify puck / hockey play)' },
        { key: 'S', desc: 'Zoom Out' },
        { key: '←  →  ↑  ↓', desc: 'Pan video Left, Right, Up, Down' },
        { key: 'R  or  0', desc: 'Reset zoom & pan to 100% Fit' },
        { key: 'Shift + Arrow', desc: 'Turbo fast pan speed' },
      ],
    },
    {
      category: 'Full-Screen & Switcher Playout',
      items: [
        { key: 'F', desc: 'Toggle 100% Unobstructed Full-Screen Mode' },
        { key: 'Space', desc: 'Play / Pause video' },
        { key: 'Esc', desc: 'Exit Full-Screen' },
        { key: '<  or  ,', desc: 'Previous frame (1/30s step back)' },
        { key: '>  or  .', desc: 'Next frame (1/30s step forward)' },
      ],
    },
    {
      category: 'Hockey Video Editing & Scrubbing',
      items: [
        { key: 'Space', desc: 'Play / Pause video' },
        { key: '<  or  ,', desc: 'Previous frame (1/30 sec step back)' },
        { key: '>  or  .', desc: 'Next frame (1/30 sec step forward)' },
        { key: 'J / K / L', desc: 'Standard shuttle: Rewind / Pause / Fast Forward' },
        { key: 'I / O', desc: 'Mark Clip In / Out points for highlight clipping' },
        { key: 'S', desc: 'Snapshot / grab current zoomed frame as image' },
        { key: 'R', desc: 'Record zoomed viewport action to MP4/WebM' },
        { key: 'T / C', desc: 'Toggle Telestrator pen / Clear drawings' },
      ],
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-xl overflow-hidden text-slate-100">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <Keyboard className="w-5 h-5 text-sky-400" />
            <h2 className="text-base font-semibold tracking-tight">Hockey Video Editor Hotkeys</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
          {shortcutGroups.map((grp, gIdx) => (
            <div key={gIdx} className="space-y-2">
              <h3 className="text-xs font-semibold text-sky-400 uppercase tracking-wider">
                {grp.category}
              </h3>
              <div className="bg-slate-950/40 border border-slate-800 rounded-lg divide-y divide-slate-800/60">
                {grp.items.map((item, iIdx) => (
                  <div key={iIdx} className="flex items-center justify-between px-3 py-2 text-xs">
                    <span className="text-slate-300">{item.desc}</span>
                    <kbd className="px-2 py-1 text-[11px] font-mono font-medium text-slate-200 bg-slate-800 border border-slate-700 rounded shadow-xs">
                      {item.key}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/40 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
};
