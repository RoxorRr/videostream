import React, { useRef, useEffect, useState, useCallback } from 'react';
import { VideoSource, ZoomPanState } from '../types/hockey';

interface VideoPlayerCanvasProps {
  playlist: VideoSource[];
  currentIndex: number;
  onIndexChange: (newIndex: number) => void;
  isPlaying: boolean;
  onPlayStateChange: (playing: boolean) => void;
  onTimeUpdate: (time: number) => void;
  onDurationChange: (duration: number) => void;
  playbackRate: number;
  zoomPan: ZoomPanState;
  onZoomPanChange: (state: ZoomPanState) => void;
  isFullscreen: boolean;
  onFullscreenChange: (fullscreen: boolean) => void;
  isCleanMode: boolean;
  onToggleCleanMode: () => void;
  loopPlaylist?: boolean;
}

export const VideoPlayerCanvas: React.FC<VideoPlayerCanvasProps> = ({
  playlist,
  currentIndex,
  onIndexChange,
  isPlaying,
  onPlayStateChange,
  onTimeUpdate,
  onDurationChange,
  playbackRate,
  zoomPan,
  onZoomPanChange,
  isFullscreen,
  onFullscreenChange,
  isCleanMode,
  onToggleCleanMode,
  loopPlaylist = true,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Dual-Deck Video Elements for 0ms delay gapless transition
  const videoDeckARef = useRef<HTMLVideoElement>(null);
  const videoDeckBRef = useRef<HTMLVideoElement>(null);

  // Active deck currently visible and playing: 'A' or 'B'
  const [activeDeck, setActiveDeck] = useState<'A' | 'B'>('A');

  // Track what index each deck is holding
  const deckAIndexRef = useRef<number>(currentIndex);
  const deckBIndexRef = useRef<number>(-1);

  // Dimensions & idle cursor
  const [dimensions, setDimensions] = useState({ width: 1920, height: 1080 });
  const [mouseIdle, setMouseIdle] = useState(false);
  const mouseTimerRef = useRef<number | null>(null);

  // Dragging state for mouse pan
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0, initialPanX: 0, initialPanY: 0 });

  // Continuous zoom and pan keys
  const keysDownRef = useRef<Set<string>>(new Set());
  const zoomPanRef = useRef(zoomPan);
  zoomPanRef.current = zoomPan;

  // Next index helper
  const getNextIndex = useCallback(
    (idx: number) => {
      if (playlist.length <= 1) return 0;
      if (idx + 1 < playlist.length) return idx + 1;
      return loopPlaylist ? 0 : idx;
    },
    [playlist.length, loopPlaylist]
  );

  // Prev index helper
  const getPrevIndex = useCallback(
    (idx: number) => {
      if (playlist.length <= 1) return 0;
      if (idx - 1 >= 0) return idx - 1;
      return loopPlaylist ? playlist.length - 1 : 0;
    },
    [playlist.length, loopPlaylist]
  );

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

  // Listen for native fullscreen changes
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

  // Synchronize playbackRate across both decks
  useEffect(() => {
    if (videoDeckARef.current) videoDeckARef.current.playbackRate = playbackRate;
    if (videoDeckBRef.current) videoDeckBRef.current.playbackRate = playbackRate;
  }, [playbackRate]);

  // Play / Pause active deck
  useEffect(() => {
    const currentVideo = activeDeck === 'A' ? videoDeckARef.current : videoDeckBRef.current;
    if (!currentVideo) return;

    if (isPlaying) {
      currentVideo.play().catch(() => {
        onPlayStateChange(false);
      });
    } else {
      currentVideo.pause();
    }
  }, [isPlaying, activeDeck, onPlayStateChange]);

  // PRIME / PRELOAD NEXT VIDEO IN STANDBY DECK
  // When activeDeck or currentIndex changes, ensure the standby deck preloads the NEXT track
  useEffect(() => {
    if (playlist.length === 0) return;

    const nextIdx = getNextIndex(currentIndex);

    if (activeDeck === 'A') {
      // Deck A is active with currentIndex
      deckAIndexRef.current = currentIndex;
      if (videoDeckARef.current && videoDeckARef.current.src !== playlist[currentIndex]?.url) {
        videoDeckARef.current.src = playlist[currentIndex]?.url || '';
        if (isPlaying) videoDeckARef.current.play().catch(() => {});
      }

      // Preload next track into Deck B
      if (playlist.length > 1 && playlist[nextIdx]) {
        deckBIndexRef.current = nextIdx;
        if (videoDeckBRef.current && videoDeckBRef.current.src !== playlist[nextIdx].url) {
          videoDeckBRef.current.src = playlist[nextIdx].url;
          videoDeckBRef.current.preload = 'auto';
          videoDeckBRef.current.currentTime = 0;
          videoDeckBRef.current.load();
        }
      }
    } else {
      // Deck B is active with currentIndex
      deckBIndexRef.current = currentIndex;
      if (videoDeckBRef.current && videoDeckBRef.current.src !== playlist[currentIndex]?.url) {
        videoDeckBRef.current.src = playlist[currentIndex]?.url || '';
        if (isPlaying) videoDeckBRef.current.play().catch(() => {});
      }

      // Preload next track into Deck A
      if (playlist.length > 1 && playlist[nextIdx]) {
        deckAIndexRef.current = nextIdx;
        if (videoDeckARef.current && videoDeckARef.current.src !== playlist[nextIdx].url) {
          videoDeckARef.current.src = playlist[nextIdx].url;
          videoDeckARef.current.preload = 'auto';
          videoDeckARef.current.currentTime = 0;
          videoDeckARef.current.load();
        }
      }
    }
  }, [activeDeck, currentIndex, playlist, isPlaying, getNextIndex]);

  // SEAMLESS INSTANT HANDOFF FROM ACTIVE DECK TO STANDBY DECK (0ms Delay)
  const triggerSeamlessNext = useCallback(() => {
    if (playlist.length <= 1) {
      // Single video loop
      const activeVideo = activeDeck === 'A' ? videoDeckARef.current : videoDeckBRef.current;
      if (activeVideo) {
        activeVideo.currentTime = 0;
        activeVideo.play().catch(() => {});
      }
      return;
    }

    const nextIdx = getNextIndex(currentIndex);

    if (activeDeck === 'A') {
      const videoB = videoDeckBRef.current;
      if (videoB) {
        // Start standby deck B immediately
        videoB.play().then(() => {
          // Switch visible active deck with 0ms transition
          setActiveDeck('B');
          onIndexChange(nextIdx);
        }).catch(() => {
          setActiveDeck('B');
          onIndexChange(nextIdx);
        });
      }
    } else {
      const videoA = videoDeckARef.current;
      if (videoA) {
        // Start standby deck A immediately
        videoA.play().then(() => {
          // Switch visible active deck with 0ms transition
          setActiveDeck('A');
          onIndexChange(nextIdx);
        }).catch(() => {
          setActiveDeck('A');
          onIndexChange(nextIdx);
        });
      }
    }
  }, [activeDeck, currentIndex, getNextIndex, onIndexChange, playlist.length]);

  // Jump immediately to specific index
  const jumpToIndex = useCallback(
    (targetIdx: number) => {
      if (targetIdx < 0 || targetIdx >= playlist.length) return;
      onIndexChange(targetIdx);

      const activeVideo = activeDeck === 'A' ? videoDeckARef.current : videoDeckBRef.current;
      if (activeVideo && playlist[targetIdx]) {
        activeVideo.src = playlist[targetIdx].url;
        activeVideo.currentTime = 0;
        if (isPlaying) activeVideo.play().catch(() => {});
      }
    },
    [activeDeck, isPlaying, onIndexChange, playlist]
  );

  // Clamping helper for pan coordinates
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

  // Smooth continuous pan and zoom loop
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

        // Continuous zoom with Key A (Zoom In)
        if (keys.has('KeyA') || keys.has('Equal') || keys.has('NumpadAdd')) {
          scale = Math.min(10, scale + 0.025 * (isShift ? 2.5 : 1));
          changed = true;
        }
        // Continuous zoom with Key S (Zoom Out)
        if (keys.has('KeyS') || keys.has('Minus') || keys.has('NumpadSubtract')) {
          scale = Math.max(1, scale - 0.025 * (isShift ? 2.5 : 1));
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

  // Global Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA'
      ) {
        return;
      }

      keysDownRef.current.add(e.code);
      if (e.key === 'Shift') keysDownRef.current.add('Shift');
      if (e.key === 'Alt') keysDownRef.current.add('Alt');

      // Prevent scroll on arrow keys / space
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space'].includes(e.code)) {
        e.preventDefault();
      }

      // Key A: Tap to zoom in
      if (e.code === 'KeyA') {
        e.preventDefault();
        const nextScale = Math.min(10, zoomPanRef.current.scale + 0.35);
        const clamped = clampPan(zoomPanRef.current.panX, zoomPanRef.current.panY, nextScale);
        onZoomPanChange({ ...zoomPanRef.current, scale: nextScale, panX: clamped.x, panY: clamped.y });
      }

      // Key S: Tap to zoom out
      else if (e.code === 'KeyS') {
        e.preventDefault();
        const nextScale = Math.max(1, zoomPanRef.current.scale - 0.35);
        const clamped = clampPan(zoomPanRef.current.panX, zoomPanRef.current.panY, nextScale);
        onZoomPanChange({ ...zoomPanRef.current, scale: nextScale, panX: clamped.x, panY: clamped.y });
      }

      // Key R or 0: Reset zoom to 100% Fit
      else if (e.code === 'KeyR' || e.key === '0' || e.code === 'Numpad0') {
        e.preventDefault();
        onZoomPanChange({ ...zoomPanRef.current, scale: 1, panX: 0, panY: 0 });
      }

      // Space: Play / Pause
      else if (e.code === 'Space') {
        e.preventDefault();
        onPlayStateChange(!isPlaying);
      }

      // Key F: Fullscreen Toggle
      else if (e.code === 'KeyF' || (e.code === 'Enter' && e.altKey)) {
        e.preventDefault();
        if (!containerRef.current) return;
        if (!document.fullscreenElement) {
          containerRef.current.requestFullscreen().catch(() => {});
        } else {
          document.exitFullscreen().catch(() => {});
        }
      }

      // Key N or PageDown: Next video in playlist
      else if (e.code === 'KeyN' || e.code === 'PageDown') {
        e.preventDefault();
        triggerSeamlessNext();
      }

      // Key P or PageUp: Previous video in playlist
      else if (e.code === 'KeyP' || e.code === 'PageUp') {
        e.preventDefault();
        const prevIdx = getPrevIndex(currentIndex);
        jumpToIndex(prevIdx);
      }

      // Frame stepping (< or , and > or .)
      else if (e.key === '<' || e.key === ',') {
        e.preventDefault();
        const activeVideo = activeDeck === 'A' ? videoDeckARef.current : videoDeckBRef.current;
        if (activeVideo) {
          activeVideo.pause();
          onPlayStateChange(false);
          activeVideo.currentTime = Math.max(0, activeVideo.currentTime - 1 / 30);
        }
      } else if (e.key === '>' || e.key === '.') {
        e.preventDefault();
        const activeVideo = activeDeck === 'A' ? videoDeckARef.current : videoDeckBRef.current;
        if (activeVideo) {
          activeVideo.pause();
          onPlayStateChange(false);
          activeVideo.currentTime = Math.min(activeVideo.duration || 9999, activeVideo.currentTime + 1 / 30);
        }
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
    activeDeck,
    clampPan,
    currentIndex,
    getPrevIndex,
    isPlaying,
    jumpToIndex,
    onPlayStateChange,
    onZoomPanChange,
    triggerSeamlessNext,
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

  const handleDoubleClick = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  // In fullscreen or clean mode: ZERO UI obstruction
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
      {/* Both decks share the identical hardware-accelerated transform */}
      <div
        className="w-full h-full flex items-center justify-center transition-transform duration-75 ease-out will-change-transform"
        style={{
          transform: `translate3d(${zoomPan.panX}px, ${zoomPan.panY}px, 0) scale(${zoomPan.scale})`,
          transformOrigin: 'center center',
        }}
      >
        {/* DECK A */}
        <video
          ref={videoDeckARef}
          playsInline
          crossOrigin="anonymous"
          preload="auto"
          className="absolute max-w-full max-h-full object-contain pointer-events-none"
          style={{
            opacity: activeDeck === 'A' ? 1 : 0,
            zIndex: activeDeck === 'A' ? 2 : 1,
            imageRendering: 'auto',
            filter: 'none',
          }}
          onTimeUpdate={() => {
            if (activeDeck === 'A' && videoDeckARef.current) {
              onTimeUpdate(videoDeckARef.current.currentTime);
              // Pre-trigger transition at the very last frame to eliminate any frame stall
              if (
                videoDeckARef.current.duration > 0 &&
                videoDeckARef.current.currentTime >= videoDeckARef.current.duration - 0.04
              ) {
                triggerSeamlessNext();
              }
            }
          }}
          onLoadedMetadata={() => {
            if (activeDeck === 'A' && videoDeckARef.current) {
              onDurationChange(videoDeckARef.current.duration);
            }
          }}
          onEnded={() => {
            if (activeDeck === 'A') {
              triggerSeamlessNext();
            }
          }}
        />

        {/* DECK B (Standby / Gapless Ping-Pong Partner) */}
        <video
          ref={videoDeckBRef}
          playsInline
          crossOrigin="anonymous"
          preload="auto"
          className="absolute max-w-full max-h-full object-contain pointer-events-none"
          style={{
            opacity: activeDeck === 'B' ? 1 : 0,
            zIndex: activeDeck === 'B' ? 2 : 1,
            imageRendering: 'auto',
            filter: 'none',
          }}
          onTimeUpdate={() => {
            if (activeDeck === 'B' && videoDeckBRef.current) {
              onTimeUpdate(videoDeckBRef.current.currentTime);
              // Pre-trigger transition at the very last frame
              if (
                videoDeckBRef.current.duration > 0 &&
                videoDeckBRef.current.currentTime >= videoDeckBRef.current.duration - 0.04
              ) {
                triggerSeamlessNext();
              }
            }
          }}
          onLoadedMetadata={() => {
            if (activeDeck === 'B' && videoDeckBRef.current) {
              onDurationChange(videoDeckBRef.current.duration);
            }
          }}
          onEnded={() => {
            if (activeDeck === 'B') {
              triggerSeamlessNext();
            }
          }}
        />
      </div>

      {/* Note: In Fullscreen or Clean Mode, absolutely ZERO elements are rendered on top of the video */}
    </div>
  );
};
