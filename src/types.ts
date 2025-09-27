export interface Track {
  title: string;
  src: string;
  metadata?: {
    title?: string;
    artist?: string;
    song?: string;
    album?: string;
    year?: number;
    duration?: number;
    genre?: string;
    cover?: {
      data: string;
      mimeType: string;
      size: number;
    };
  };
}

export interface PlayerState {
  playlist: Track[];
  currentIndex: number;
  playing: boolean;
  progress: number;
  isLoading: boolean;
  volume: number;
  isMuted: boolean;
  previousVolume: number;
}

export interface AudioControls {
  audio: HTMLAudioElement | null;
  isDragging: boolean;
  isVolumeDragging: boolean;
  fadeInterval: ReturnType<typeof setInterval> | null;
}
