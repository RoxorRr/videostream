import { ZoomPanState, DrawingElement } from './hockey';

export type HdmiFeedMode = 'original_raw' | 'live_program' | 'smpte_bars';

export interface HdmiSyncMessage {
  type:
    | 'SYNC_STATE'
    | 'PLAY'
    | 'PAUSE'
    | 'SEEK'
    | 'RATE'
    | 'ZOOM_PAN'
    | 'DRAWINGS'
    | 'SOURCE_CHANGE'
    | 'FEED_MODE'
    | 'PING'
    | 'PONG';
  videoUrl?: string;
  videoName?: string;
  currentTime?: number;
  isPlaying?: boolean;
  playbackRate?: number;
  zoomPan?: ZoomPanState;
  drawings?: DrawingElement[];
  feedMode?: HdmiFeedMode;
  timestamp: number;
}
