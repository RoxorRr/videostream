import React, { useRef, useEffect, useState, useCallback } from 'react';
import { ZoomPanState, DrawingElement } from '../types/hockey';
import { RinkMinimap } from './RinkMinimap';

interface VideoPlayerCanvasProps {
  videoUrl: string;
  isPlaying: boolean;
  onPlayStateChange: (playing: boolean) => void;
  onTimeUpdate: (time: number) => void;
  onDurationChange: (duration: number) => void;
  seekTime: number | null;
  playbackRate: number;
  zoomPan: ZoomPanState;
  onZoomPanChange: (state: ZoomPanState) => void;
  isFullscreen: boolean;
  onFullscreenChange: (fullscreen: boolean) => void;
  isCleanMode: boolean;
  onToggleCleanMode: () => void;
  showMinimap: boolean;
  onToggleMinimap: () => void;
  isTelestratorActive?: boolean;
  activeColor?: string;
  drawTool?: 'circle' | 'arrow' | 'freehand';
  onSnapshotTriggered?: (trigger: () => void) => void;
  onRecordTriggered?: (trigger: (recording: boolean) => void) => void;
  onStepFrameTriggered?: (trigger: (frames: number) => void) => void;
}

export const VideoPlayerCanvas: React.FC<VideoPlayerCanvasProps> = ({
  videoUrl,
  isPlaying,
  onPlayStateChange,
  onTimeUpdate,
  onDurationChange,
  seekTime,
  playbackRate,
  zoomPan,
  onZoomPanChange,
  isFullscreen,
  onFullscreenChange,
  isCleanMode,
  onToggleCleanMode,
  showMinimap,
  onToggleMinimap,
  isTelestratorActive = false,
  activeColor = '#facc15',
  drawTool = 'freehand',
  onSnapshotTriggered,
  onRecordTriggered,
  onStepFrameTriggered,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const drawingCanvasRef = useRef<HTMLCanvasElement>(null);

  // Dragging state for mouse pan
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0, initialPanX: 0, initialPanY: 0 });

  // Dimensions
  const [dimensions, setDimensions] = useState({ width: 1920, height: 1080 });
  const [mouseIdle, setMouseIdle] = useState(false);
  const mouseTimerRef = useRef<number | null>(null);

  // Update container dimensions on resize
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth || window.innerWidth,
          height: containerRef.current.clientHeight || window.innerHeight,
        });
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Listen for fullscreen change events from browser
  useEffect(() => {
    const handleFsChange = () => {
      const isFs = !!(
        document.fullscreenElement ||
        (document as unknown as { webkitFullscreenElement?: Element }).webkitFullscreenElement
      );
      onFullscreenChange(isFs);
    };

    document.addEventListener('fullscreenchange', handleFsChange);
    document.addEventListener('webkitfullscreenchange', handleFsChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFsChange);
      document.removeEventListener('webkitfullscreenchange', handleFsChange);
    };
  }, [onFullscreenChange]);

  // Video playback speed sync
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate]);

  // Handle Play/Pause
  useEffect(() => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.play().catch(() => {
        onPlayStateChange(false);
      });
    } else {
      videoRef.current.pause();
    }
  }, [isPlaying, onPlayStateChange]);

  // Handle external seek request
  useEffect(() => {
    if (seekTime !== null && videoRef.current) {
      videoRef.current.currentTime = seekTime;
    }
  }, [seekTime]);

  // Frame stepping helper (~30 fps = ~0.0333s)
  const stepFrame = useCallback(
    (frames: number) => {
      if (!videoRef.current) return;
      videoRef.current.pause();
      onPlayStateChange(false);
      const frameDelta = (1 / 30) * frames;
      videoRef.current.currentTime = Math.max(
        0,
        Math.min(videoRef.current.duration || 9999, videoRef.current.currentTime + frameDelta)
      );
    },
    [onPlayStateChange]
  );

  useEffect(() => {
    if (onStepFrameTriggered) {
      onStepFrameTriggered(stepFrame);
    }
  }, [onStepFrameTriggered, stepFrame]);

  // Clamping helper for pan coordinates so video remains visible within frame
  const clampPan = useCallback(
    (panX: number, panY: number, scale: number) => {
      if (scale <= 1) return { x: 0, y: 0 };
      const maxPanX = ((scale - 1) * dimensions.width) / 2;
      const maxPanY = ((scale - 1) * dimensions.height) / 2;
      return {
        x: Math.max(-maxPanX, Math.min(maxPanX, panX)),
        y: Math.max(-maxPanY, Math.min(maxPanY, panY)),
      };
    },
    [dimensions]
  );

  // Continuous keyboard panning & continuous zooming loop via requestAnimationFrame
  const keysDownRef = useRef<Set<string>>(new Set());
  const zoomPanRef = useRef(zoomPan);
  zoomPanRef.current = zoomPan;

  useEffect(() => {
    let animId: number;

    const loop = () => {
      const keys = keysDownRef.current;
      if (keys.size > 0) {
        let changed = false;
        let scale = zoomPanRef.current.scale;
        let px = zoomPanRef.current.panX;
        let py = zoomPanRef.current.panY;

        const isShift = keys.has('Shift') || keys.has('ShiftLeft') || keys.has('ShiftRight');
        const isAlt = keys.has('Alt') || keys.has('AltLeft') || keys.has('AltRight');

        // Continuous zoom with Key A (Zoom In) or Key S (Zoom Out)
        // Holding A zooms in smoothly
        if (keys.has('KeyA') || keys.has('Equal') || keys.has('NumpadAdd')) {
          scale = Math.min(10, scale + 0.02 * (isShift ? 2.5 : 1));
          changed = true;
        }
        // Holding S zooms out smoothly
        if (keys.has('KeyS') || keys.has('Minus') || keys.has('NumpadSubtract')) {
          scale = Math.max(1, scale - 0.02 * (isShift ? 2.5 : 1));
          changed = true;
        }

        // Panning with Arrow keys: Left, Right, Up, Down
        if (scale > 1) {
          let speed = 9;
          if (isShift) speed *= 2.8;
          if (isAlt) speed *= 0.3;

          if (keys.has('ArrowLeft')) {
            px += speed;
            changed = true;
          }
          if (keys.has('ArrowRight')) {
            px -= speed;
            changed = true;
          }
          if (keys.has('ArrowUp')) {
            py += speed;
            changed = true;
          }
          if (keys.has('ArrowDown')) {
            py -= speed;
            changed = true;
          }
        } else {
          px = 0;
          py = 0;
        }

        if (changed) {
          const clamped = clampPan(px, py, scale);
          onZoomPanChange({
            ...zoomPanRef.current,
            scale,
            panX: clamped.x,
            panY: clamped.y,
          });
        }
      }
      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [clampPan, onZoomPanChange]);

  // Global Keydown & Keyup listener for instant discrete taps and shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA'
      ) {
        return;
      }

      keysDownRef.current.add(e.code);
      if (e.key === 'Shift') keysDownRef.current.add('Shift');
      if (e.key === 'Alt') keysDownRef.current.add('Alt');

      // Prevent scrolling or unwanted default actions on arrows / space
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space'].includes(e.code)) {
        e.preventDefault();
      }

      // Discrete tap for Key A: Zoom In
      if (e.code === 'KeyA') {
        e.preventDefault();
        const nextScale = Math.min(10, zoomPanRef.current.scale + 0.35);
        const clamped = clampPan(zoomPanRef.current.panX, zoomPanRef.current.panY, nextScale);
        onZoomPanChange({ ...zoomPanRef.current, scale: nextScale, panX: clamped.x, panY: clamped.y });
      }

      // Discrete tap for Key S: Zoom Out
      else if (e.code === 'KeyS') {
        e.preventDefault();
        const nextScale = Math.max(1, zoomPanRef.current.scale - 0.35);
        const clamped = clampPan(zoomPanRef.current.panX, zoomPanRef.current.panY, nextScale);
        onZoomPanChange({ ...zoomPanRef.current, scale: nextScale, panX: clamped.x, panY: clamped.y });
      }

      // Reset Zoom & Pan: Key R or 0
      else if (e.code === 'KeyR' || e.key === '0' || e.code === 'Numpad0') {
        e.preventDefault();
        onZoomPanChange({ ...zoomPanRef.current, scale: 1, panX: 0, panY: 0 });
      }

      // Play / Pause: Space
      else if (e.code === 'Space') {
        e.preventDefault();
        onPlayStateChange(!isPlaying);
      }

      // Fullscreen toggle: Key F or Enter
      else if (e.code === 'KeyF' || (e.code === 'Enter' && e.altKey)) {
        e.preventDefault();
        if (!containerRef.current) return;
        if (!document.fullscreenElement) {
          containerRef.current.requestFullscreen().catch(() => {});
        } else {
          document.exitFullscreen().catch(() => {});
        }
      }

      // Frame stepping: < , or > .
      else if (e.key === '<' || e.key === ',') {
        e.preventDefault();
        stepFrame(-1);
      } else if (e.key === '>' || e.key === '.') {
        e.preventDefault();
        stepFrame(1);
      }

      // Zero UI toggle: Key H
      else if (e.code === 'KeyH') {
        e.preventDefault();
        onToggleCleanMode();
      }

      // Minimap toggle: Key M (only when not in strict fullscreen)
      else if (e.code === 'KeyM') {
        e.preventDefault();
        onToggleMinimap();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysDownRef.current.delete(e.code);
      if (e.key === 'Shift') keysDownRef.current.delete('Shift');
      if (e.key === 'Alt') keysDownRef.current.delete('Alt');
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [
    clampPan,
    isPlaying,
    onPlayStateChange,
    onToggleCleanMode,
    onToggleMinimap,
    onZoomPanChange,
    stepFrame,
  ]);

  // Mouse wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.15 : 0.87;
    const newScale = Math.max(1, Math.min(10, zoomPan.scale * zoomFactor));

    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const cursorX = e.clientX - rect.left - rect.width / 2;
      const cursorY = e.clientY - rect.top - rect.height / 2;

      const scaleRatio = newScale / zoomPan.scale;
      const targetPanX = cursorX - (cursorX - zoomPan.panX) * scaleRatio;
      const targetPanY = cursorY - (cursorY - zoomPan.panY) * scaleRatio;

      const clamped = clampPan(targetPanX, targetPanY, newScale);
      onZoomPanChange({
        ...zoomPan,
        scale: newScale,
        panX: clamped.x,
        panY: clamped.y,
      });
    }
  };

  // Mouse drag to pan
  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoomPan.scale > 1) {
      isDraggingRef.current = true;
      dragStartRef.current = {
        x: e.clientX,
        y: e.clientY,
        initialPanX: zoomPan.panX,
        initialPanY: zoomPan.panY,
      };
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    // Hide cursor after 2s of inactivity
    setMouseIdle(false);
    if (mouseTimerRef.current) clearTimeout(mouseTimerRef.current);
    mouseTimerRef.current = window.setTimeout(() => {
      setMouseIdle(true);
    }, 2000);

    if (isDraggingRef.current && zoomPan.scale > 1) {
      const dx = e.clientX - dragStartRef.current.x;
      const dy = e.clientY - dragStartRef.current.y;
      const clamped = clampPan(
        dragStartRef.current.initialPanX + dx,
        dragStartRef.current.initialPanY + dy,
        zoomPan.scale
      );
      onZoomPanChange({
        ...zoomPan,
        panX: clamped.x,
        panY: clamped.y,
      });
    }
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  // Double click on video to toggle fullscreen
  const handleDoubleClick = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  // Completely unobstructed:
  // When in fullscreen or clean mode, hide cursor and show ZERO overlay elements!
  const isCompletelyUnobstructed = isFullscreen || isCleanMode;
  const cursorClass = isCompletelyUnobstructed && mouseIdle
    ? 'cursor-none'
    : zoomPan.scale > 1
    ? 'cursor-grab active:cursor-grabbing'
    : 'cursor-default';

  return (
    <div
      ref={containerRef}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onDoubleClick={handleDoubleClick}
      className={`relative w-full h-full bg-black overflow-hidden flex items-center justify-center select-none ${cursorClass}`}
      style={{ touchAction: 'none', backgroundColor: '#000000' }}
    >
      {/* Video element with hardware-accelerated transform */}
      <div
        className="w-full h-full flex items-center justify-center transition-transform duration-75 ease-out will-change-transform"
        style={{
          transform: `translate3d(${zoomPan.panX}px, ${zoomPan.panY}px, 0) scale(${zoomPan.scale})`,
          transformOrigin: 'center center',
        }}
      >
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
          onTimeUpdate={() => {
            if (videoRef.current) onTimeUpdate(videoRef.current.currentTime);
          }}
          onLoadedMetadata={() => {
            if (videoRef.current) onDurationChange(videoRef.current.duration);
          }}
          onEnded={() => onPlayStateChange(false)}
        />
      </div>

      {/* Rink Radar Minimap (ONLY shown when NOT in fullscreen/clean mode and enabled) */}
      {!isCompletelyUnobstructed && showMinimap && (
        <RinkMinimap
          scale={zoomPan.scale}
          panX={zoomPan.panX}
          panY={zoomPan.panY}
          containerWidth={dimensions.width}
          containerHeight={dimensions.height}
          visible={showMinimap}
        />
      )}

      {/* Note: In Fullscreen or Clean Mode, absolutely ZERO elements are rendered on top of the video */}
    </div>
  );
};
