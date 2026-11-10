import React from 'react';

interface RinkMinimapProps {
  scale: number;
  panX: number;
  panY: number;
  containerWidth: number;
  containerHeight: number;
  visible: boolean;
  onClose?: () => void;
}

export const RinkMinimap: React.FC<RinkMinimapProps> = ({
  scale,
  panX,
  panY,
  containerWidth,
  containerHeight,
  visible,
}) => {
  if (!visible || scale <= 1.05) return null;

  // Rink canvas aspect ratio roughly 2:1 (regulation 200ft x 85ft)
  const mapWidth = 140;
  const mapHeight = 70;

  // Calculate viewport rectangle position inside the minimap
  // When scale is 2, viewport shows 50% width and height
  const viewportW = Math.max(16, mapWidth / scale);
  const viewportH = Math.max(12, mapHeight / scale);

  // Pan offset is inverted and scaled to minimap
  const maxPanX = ((scale - 1) * containerWidth) / 2;
  const maxPanY = ((scale - 1) * containerHeight) / 2;

  const normalizedPanX = maxPanX > 0 ? -panX / maxPanX : 0;
  const normalizedPanY = maxPanY > 0 ? -panY / maxPanY : 0;

  const rectX = Math.max(
    0,
    Math.min(
      mapWidth - viewportW,
      (mapWidth - viewportW) / 2 + (normalizedPanX * (mapWidth - viewportW)) / 2
    )
  );
  const rectY = Math.max(
    0,
    Math.min(
      mapHeight - viewportH,
      (mapHeight - viewportH) / 2 + (normalizedPanY * (mapHeight - viewportH)) / 2
    )
  );

  return (
    <div
      className="absolute bottom-20 right-6 pointer-events-none z-30 transition-opacity duration-300"
      style={{ opacity: 0.9 }}
    >
      <div className="bg-slate-900/90 border border-slate-700/80 rounded-lg p-1.5 shadow-2xl backdrop-blur-md">
        <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono mb-1 px-1">
          <span>RINK RADAR</span>
          <span className="text-sky-400 font-bold">{scale.toFixed(1)}x</span>
        </div>
        <div
          className="relative bg-slate-800 rounded border border-slate-700 overflow-hidden"
          style={{ width: mapWidth, height: mapHeight }}
        >
          {/* Rink Outline & Markings */}
          {/* Center Red Line */}
          <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-red-600/70 -translate-x-1/2" />
          {/* Blue Lines */}
          <div className="absolute top-0 bottom-0 left-[35%] w-0.5 bg-blue-500/80" />
          <div className="absolute top-0 bottom-0 right-[35%] w-0.5 bg-blue-500/80" />
          {/* Goal Creases */}
          <div className="absolute top-1/2 left-1 w-2 h-3 -translate-y-1/2 rounded-r-full bg-cyan-400/40 border border-red-500/60" />
          <div className="absolute top-1/2 right-1 w-2 h-3 -translate-y-1/2 rounded-l-full bg-cyan-400/40 border border-red-500/60" />
          {/* Center Circle */}
          <div className="absolute top-1/2 left-1/2 w-5 h-5 -translate-x-1/2 -translate-y-1/2 rounded-full border border-blue-500/50" />

          {/* Viewport Box (where current zoom/pan is looking) */}
          <div
            className="absolute border-2 border-amber-400 bg-amber-400/20 rounded-xs transition-all duration-75"
            style={{
              width: `${viewportW}px`,
              height: `${viewportH}px`,
              left: `${rectX}px`,
              top: `${rectY}px`,
              boxShadow: '0 0 6px rgba(251, 191, 36, 0.6)',
            }}
          />
        </div>
      </div>
    </div>
  );
};
