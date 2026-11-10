import React, { useEffect, useRef, useState, useCallback } from 'react';
import { HdmiFeedMode, HdmiSyncMessage } from '../types/hdmi';
import { ZoomPanState, DrawingElement } from '../types/hockey';

export const HdmiProgramOutputView: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [feedMode, setFeedMode] = useState<HdmiFeedMode>('original_raw');
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [zoomPan, setZoomPan] = useState<ZoomPanState>({ scale: 1, panX: 0, panY: 0, panSpeed: 1 });
  const [drawings, setDrawings] = useState<DrawingElement[]>([]);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [showHelper, setShowHelper] = useState<boolean>(true);
  const helperTimerRef = useRef<number | null>(null);

  const channelRef = useRef<BroadcastChannel | null>(null);

  // Auto-hide helper after 3 seconds
  useEffect(() => {
    helperTimerRef.current = window.setTimeout(() => {
      setShowHelper(false);
    }, 3000);
    return () => {
      if (helperTimerRef.current) clearTimeout(helperTimerRef.current);
    };
  }, []);

  const handleMouseMove = () => {
    setShowHelper(true);
    if (helperTimerRef.current) clearTimeout(helperTimerRef.current);
    helperTimerRef.current = window.setTimeout(() => {
      setShowHelper(false);
    }, 2500);
  };

  // Fullscreen helper
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // BroadcastChannel listener
  useEffect(() => {
    const channel = new BroadcastChannel('puckvision_hdmi_channel');
    channelRef.current = channel;

    channel.onmessage = (e: MessageEvent<HdmiSyncMessage>) => {
      const msg = e.data;
      if (!msg) return;

      switch (msg.type) {
        case 'SYNC_STATE':
          if (msg.videoUrl) setVideoUrl(msg.videoUrl);
          if (msg.feedMode) setFeedMode(msg.feedMode);
          if (msg.zoomPan) setZoomPan(msg.zoomPan);
          if (msg.drawings) setDrawings(msg.drawings);
          if (msg.playbackRate && videoRef.current) {
            videoRef.current.playbackRate = msg.playbackRate;
          }
          if (typeof msg.currentTime === 'number' && videoRef.current) {
            const diff = Math.abs(videoRef.current.currentTime - msg.currentTime);
            if (diff > 0.08) {
              videoRef.current.currentTime = msg.currentTime;
            }
          }
          if (typeof msg.isPlaying === 'boolean') {
            setIsPlaying(msg.isPlaying);
            if (videoRef.current) {
              if (msg.isPlaying) videoRef.current.play().catch(() => {});
              else videoRef.current.pause();
            }
          }
          break;

        case 'PLAY':
          setIsPlaying(true);
          videoRef.current?.play().catch(() => {});
          break;

        case 'PAUSE':
          setIsPlaying(false);
          videoRef.current?.pause();
          break;

        case 'SEEK':
          if (typeof msg.currentTime === 'number' && videoRef.current) {
            videoRef.current.currentTime = msg.currentTime;
          }
          break;

        case 'RATE':
          if (typeof msg.playbackRate === 'number' && videoRef.current) {
            videoRef.current.playbackRate = msg.playbackRate;
          }
          break;

        case 'SOURCE_CHANGE':
          if (msg.videoUrl) {
            setVideoUrl(msg.videoUrl);
          }
          break;

        case 'FEED_MODE':
          if (msg.feedMode) {
            setFeedMode(msg.feedMode);
          }
          break;

        case 'ZOOM_PAN':
          if (msg.zoomPan) {
            setZoomPan(msg.zoomPan);
          }
          break;

        case 'DRAWINGS':
          if (msg.drawings) {
            setDrawings(msg.drawings);
          }
          break;

        case 'PING':
          // Reply with PONG to confirm HDMI window is alive
          channel.postMessage({
            type: 'PONG',
            timestamp: Date.now(),
          });
          break;
      }
    };

    // Request initial sync state from master
    channel.postMessage({
      type: 'PING',
      timestamp: Date.now(),
    });

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'f' || e.key === 'F' || e.key === 'F11') {
        e.preventDefault();
        toggleFullscreen();
      }
      if (e.code === 'Space') {
        e.preventDefault();
        // Toggle play on master
        if (videoRef.current) {
          if (videoRef.current.paused) {
            channel.postMessage({ type: 'PLAY', timestamp: Date.now() });
            videoRef.current.play().catch(() => {});
          } else {
            channel.postMessage({ type: 'PAUSE', timestamp: Date.now() });
            videoRef.current.pause();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKey);

    return () => {
      window.removeEventListener('keydown', handleKey);
      channel.close();
    };
  }, []);

  // Sync telestration drawing canvas in live program mode
  const renderDrawings = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (feedMode !== 'live_program') return;

    drawings.forEach((elem) => {
      if (elem.points.length < 2) return;
      ctx.strokeStyle = elem.color;
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      if (elem.type === 'circle') {
        const start = elem.points[0];
        const end = elem.points[elem.points.length - 1];
        const rx = Math.abs(end.x - start.x) / 2;
        const ry = Math.abs(end.y - start.y) / 2;
        const cx = (start.x + end.x) / 2;
        const cy = (start.y + end.y) / 2;
        ctx.beginPath();
        ctx.ellipse(cx, cy, Math.max(10, rx), Math.max(10, ry), 0, 0, Math.PI * 2);
        ctx.stroke();
      } else if (elem.type === 'arrow') {
        const start = elem.points[0];
        const end = elem.points[elem.points.length - 1];
        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
        ctx.stroke();

        const angle = Math.atan2(end.y - start.y, end.x - start.x);
        ctx.beginPath();
        ctx.moveTo(end.x, end.y);
        ctx.lineTo(end.x - 15 * Math.cos(angle - Math.PI / 6), end.y - 15 * Math.sin(angle - Math.PI / 6));
        ctx.moveTo(end.x, end.y);
        ctx.lineTo(end.x - 15 * Math.cos(angle + Math.PI / 6), end.y - 15 * Math.sin(angle + Math.PI / 6));
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.moveTo(elem.points[0].x, elem.points[0].y);
        elem.points.forEach((p) => ctx.lineTo(p.x, p.y));
        ctx.stroke();
      }
    });
  }, [drawings, feedMode]);

  useEffect(() => {
    renderDrawings();
  }, [renderDrawings]);

  // Transform styles:
  // In 'original_raw' mode, scale=1, pan=0 for 100% native original quality
  // In 'live_program' mode, follows operator zoom and pan
  const isTransformed = feedMode === 'live_program' && zoomPan.scale > 1;
  const transformStyle = isTransformed
    ? {
        transform: `translate3d(${zoomPan.panX}px, ${zoomPan.panY}px, 0) scale(${zoomPan.scale})`,
        transformOrigin: 'center center',
      }
    : {
        transform: 'none',
      };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onClick={toggleFullscreen}
      className={`fixed inset-0 w-screen h-screen bg-black overflow-hidden flex items-center justify-center select-none ${
        showHelper ? 'cursor-default' : 'cursor-none'
      }`}
      style={{
        margin: 0,
        padding: 0,
        backgroundColor: '#000000',
      }}
    >
      {/* 1. SMPTE / EBU Test Pattern Mode for Mixer Calibration */}
      {feedMode === 'smpte_bars' ? (
        <div className="relative w-full h-full flex flex-col pointer-events-none select-none">
          {/* Top 67% standard 7 color bars: White, Yellow, Cyan, Green, Magenta, Red, Blue */}
          <div className="flex-1 flex w-full">
            <div className="flex-1 bg-[#ffffff]" />
            <div className="flex-1 bg-[#c0c000]" />
            <div className="flex-1 bg-[#00c0c0]" />
            <div className="flex-1 bg-[#00c000]" />
            <div className="flex-1 bg-[#c000c0]" />
            <div className="flex-1 bg-[#c00000]" />
            <div className="flex-1 bg-[#0000c0]" />
          </div>
          {/* Middle 8% cast bars */}
          <div className="h-[8%] flex w-full">
            <div className="flex-1 bg-[#0000c0]" />
            <div className="flex-1 bg-[#131313]" />
            <div className="flex-1 bg-[#c000c0]" />
            <div className="flex-1 bg-[#131313]" />
            <div className="flex-1 bg-[#00c0c0]" />
            <div className="flex-1 bg-[#131313]" />
            <div className="flex-1 bg-[#c0c0c0]" />
          </div>
          {/* Bottom 25% PLUGE and reference blacks */}
          <div className="h-[25%] flex w-full">
            <div className="w-[18%] bg-[#002144]" />
            <div className="w-[14%] bg-[#ffffff]" />
            <div className="w-[18%] bg-[#310062]" />
            <div className="w-[10%] bg-[#090909]" />
            <div className="w-[10%] bg-[#131313]" />
            <div className="w-[10%] bg-[#1c1c1c]" />
            <div className="w-[20%] bg-[#131313] flex items-center justify-center">
              <span className="text-white/80 font-mono text-xs tracking-widest font-bold">
                1080p60 HDMI OUT
              </span>
            </div>
          </div>

          {/* Action Safe (90%) and Title Safe (80%) Overlays */}
          <div className="absolute inset-[5%] border border-white/40 pointer-events-none">
            <span className="text-[10px] text-white/60 font-mono pl-1">Action Safe 90%</span>
          </div>
          <div className="absolute inset-[10%] border border-amber-300/40 pointer-events-none">
            <span className="text-[10px] text-amber-300/60 font-mono pl-1">Title Safe 80%</span>
          </div>
          {/* Center Crosshair */}
          <div className="absolute top-1/2 left-0 right-0 h-px bg-white/30 -translate-y-1/2 pointer-events-none" />
          <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white/30 -translate-x-1/2 pointer-events-none" />
        </div>
      ) : (
        /* 2. Original Quality Native Video Playback */
        <div
          className="w-full h-full flex items-center justify-center transition-transform duration-75 will-change-transform"
          style={transformStyle}
        >
          {videoUrl ? (
            <video
              ref={videoRef}
              src={videoUrl}
              playsInline
              loop
              crossOrigin="anonymous"
              className="w-full h-full object-contain pointer-events-none"
              style={{
                imageRendering: 'auto',
                filter: 'none',
              }}
            />
          ) : (
            <div className="text-slate-600 font-mono text-xs text-center space-y-2 pointer-events-none">
              <div className="text-sky-500 font-bold text-sm tracking-wide">
                HDMI PROGRAM OUTPUT READY
              </div>
              <p>Waiting for video stream from master editor...</p>
            </div>
          )}

          {/* Telestration Layer in Live Program Mode */}
          {feedMode === 'live_program' && (
            <canvas
              ref={canvasRef}
              width={window.innerWidth}
              height={window.innerHeight}
              className="absolute inset-0 pointer-events-none"
            />
          )}
        </div>
      )}

      {/* Auto-Hiding Subtle Overlay (Displays for 2.5s on mouse move, then completely vanishes) */}
      {showHelper && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 pointer-events-none transition-opacity duration-300 animate-in fade-in duration-200">
          <div className="px-4 py-2 rounded-full bg-slate-950/85 border border-slate-700/80 backdrop-blur-md shadow-2xl flex items-center gap-3 text-xs font-mono text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-bold text-white uppercase tracking-wider">
              {feedMode === 'original_raw'
                ? 'HDMI Raw 1:1 Clean Feed'
                : feedMode === 'live_program'
                ? `Live Program Follower (${zoomPan.scale.toFixed(1)}x)`
                : 'SMPTE Test Bars'}
            </span>
            <span className="text-slate-500">·</span>
            <span className="text-sky-300">Click or Press F for Fullscreen</span>
          </div>
        </div>
      )}
    </div>
  );
};
