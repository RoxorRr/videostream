export interface VideoSource {
  id: string;
  name: string;
  type: 'nas' | 'upload' | 'sample';
  url: string;
  thumbnail?: string;
  duration?: number;
  nasDetails?: {
    host: string;
    port: number;
    path: string;
    protocol: 'http' | 'https';
    webdav?: boolean;
  };
  fileSize?: string;
  dateAdded: number;
}

export interface PlayClip {
  id: string;
  title: string;
  tag: 'Goal' | 'Offside' | 'Penalty' | 'Faceoff' | 'Breakout' | 'Defensive Zone' | 'Powerplay' | 'General';
  startTime: number;
  endTime: number;
  notes?: string;
  thumbnail?: string;
  zoomLevel?: number;
  panX?: number;
  panY?: number;
}

export interface ZoomPanState {
  scale: number;
  panX: number; // in pixels
  panY: number; // in pixels
  panSpeed: number; // multiplier
}

export interface DrawingElement {
  id: string;
  type: 'circle' | 'arrow' | 'freehand' | 'spotlight';
  color: string;
  points: { x: number; y: number }[];
  timestamp: number;
}

export type PlaybackRate = 0.1 | 0.25 | 0.5 | 0.75 | 1 | 1.5 | 2;
