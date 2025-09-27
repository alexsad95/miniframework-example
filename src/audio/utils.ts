import type { Track } from '../types';

/*
 * Audio controller class
 */
export class AudioController {
  private audio: HTMLAudioElement | null = null;
  private isDragging = false;
  private isVolumeDragging = false;
  private fadeInterval: ReturnType<typeof setInterval> | null = null;
  private callbacks: {
    onTimeUpdate?: () => void;
    onTrackEnd?: () => void;
    onLoadedMetadata?: () => void;
  } = {};

  // Smooth volume fade function
  fadeVolume = (targetVolume: number, duration: number = 1000) => {
    if (!this.audio) return;

    // Clear any existing fade
    if (this.fadeInterval) {
      clearInterval(this.fadeInterval);
    }

    const startVolume = this.audio.volume;
    const volumeDiff = targetVolume - startVolume;
    const steps = 20; // Number of steps for smooth transition
    const stepDuration = duration / steps;
    let currentStep = 0;

    this.fadeInterval = setInterval(() => {
      currentStep++;
      const progress = currentStep / steps;
      const currentVolume = startVolume + volumeDiff * progress;

      if (this.audio) {
        this.audio.volume = Math.max(0, Math.min(1, currentVolume));
      }

      if (currentStep >= steps) {
        clearInterval(this.fadeInterval!);
        this.fadeInterval = null;
      }
    }, stepDuration);
  };

  // Create new audio object
  createAudio = (track: Track) => {
    if (this.audio) {
      this.audio.pause();
      this.audio.removeEventListener('timeupdate', this.callbacks.onTimeUpdate!);
      this.audio.removeEventListener('ended', this.callbacks.onTrackEnd!);
    }

    this.audio = new Audio(track.src);

    // Set initial volume to 0 - will be faded in by calling functions
    this.audio.volume = 0;

    if (this.callbacks.onTimeUpdate) this.audio.addEventListener('timeupdate', this.callbacks.onTimeUpdate);
    if (this.callbacks.onTrackEnd) this.audio.addEventListener('ended', this.callbacks.onTrackEnd);
    if (this.callbacks.onLoadedMetadata) this.audio.addEventListener('loadedmetadata', this.callbacks.onLoadedMetadata);

    return this.audio;
  };

  // Get current audio instance
  getAudio = () => this.audio;

  // Set audio event callbacks
  setAudioCallbacks = (callbacks: {
    onTimeUpdate?: () => void;
    onTrackEnd?: () => void;
    onLoadedMetadata?: () => void;
  }) => {
    this.callbacks = callbacks;
  };

  // Audio control functions
  playAudio = () => {
    if (this.audio) {
      this.audio.play();
    }
  };

  pauseAudio = () => {
    if (this.audio) {
      this.audio.pause();
    }
  };

  setAudioVolume = (volume: number) => {
    if (this.audio) {
      this.audio.volume = volume;
    }
  };

  setAudioTime = (time: number) => {
    if (this.audio) {
      this.audio.currentTime = time;
    }
  };

  getAudioTime = () => {
    return this.audio ? this.audio.currentTime : 0;
  };

  getAudioDuration = () => {
    return this.audio ? this.audio.duration : 0;
  };

  // Drag state management
  setDragging = (value: boolean) => {
    this.isDragging = value;
  };

  setVolumeDragging = (value: boolean) => {
    this.isVolumeDragging = value;
  };

  getDragging = () => this.isDragging;
  getVolumeDragging = () => this.isVolumeDragging;

  // Clear fade interval
  clearFadeInterval = () => {
    if (this.fadeInterval) {
      clearInterval(this.fadeInterval);
      this.fadeInterval = null;
    }
  };

  // Cleanup function
  cleanup = () => {
    if (this.audio) {
      this.audio.pause();
      this.audio.removeEventListener('timeupdate', this.callbacks.onTimeUpdate!);
      this.audio.removeEventListener('ended', this.callbacks.onTrackEnd!);
      this.audio.removeEventListener('loadedmetadata', this.callbacks.onLoadedMetadata!);
      this.audio = null;
    }

    this.clearFadeInterval();
  };
}

// Create and export a default instance
export const audioController = new AudioController();
