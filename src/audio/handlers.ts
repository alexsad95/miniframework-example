import type { AudioController } from './utils';

/*
 * Handle progress bar click
 */
export const handleProgressClick = ({
  event,
  onProgressUpdate,
  audioController,
}: {
  event: MouseEvent;
  onProgressUpdate: (progress: number) => void;
  audioController: AudioController;
}) => {
  const audio = audioController.getAudio();
  if (!audio || !audio.duration) return;

  const progressContainer = event.currentTarget as HTMLElement;
  const rect = progressContainer.getBoundingClientRect();
  const clickX = event.clientX - rect.left;
  const width = rect.width;
  const percentage = Math.max(0, Math.min(1, clickX / width));

  const newTime = percentage * audio.duration;
  audioController.setAudioTime(newTime);
  onProgressUpdate(percentage * 100);
};

/*
 * Handle progress bar drag start
 */
export const handleProgressMouseDown = ({
  event,
  onProgressUpdate,
  audioController,
}: {
  event: MouseEvent;
  onProgressUpdate: (progress: number) => void;
  audioController: AudioController;
}) => {
  const audio = audioController.getAudio();
  if (!audio || !audio.duration) return;

  event.preventDefault();
  const progressContainer = event.currentTarget as HTMLElement;
  progressContainer.classList.add('dragging');

  const handleMouseMove = (e: MouseEvent) => {
    const rect = progressContainer.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;
    const percentage = Math.max(0, Math.min(1, clickX / width));

    const newTime = percentage * audio.duration;
    audioController.setAudioTime(newTime);
    onProgressUpdate(percentage * 100);
  };

  const handleMouseUp = () => {
    progressContainer.classList.remove('dragging');
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };

  document.addEventListener('mousemove', handleMouseMove);
  document.addEventListener('mouseup', handleMouseUp);
};

/*
 * Handle volume click
 */
export const handleVolumeClick = ({
  event,
  onVolumeUpdate,
  onMuteUpdate,
  isMuted,
  audioController,
}: {
  event: MouseEvent;
  onVolumeUpdate: (volume: number) => void;
  onMuteUpdate: (muted: boolean) => void;
  isMuted: boolean;
  audioController: AudioController;
}) => {
  const audio = audioController.getAudio();
  if (!audio) return;

  const volumeContainer = event.currentTarget as HTMLElement;
  const rect = volumeContainer.getBoundingClientRect();
  const clickX = event.clientX - rect.left;
  const width = rect.width;
  const percentage = Math.max(0, Math.min(1, clickX / width));

  const newVolume = percentage * 100;
  onVolumeUpdate(newVolume);

  audioController.clearFadeInterval(); // Clear any existing fade and set volume immediately
  audioController.setAudioVolume(percentage);

  // If we're muted and user changes volume, unmute
  if (isMuted && newVolume > 0) {
    onMuteUpdate(false);
  }
};

/*
 * Handle volume drag start
 */
export const handleVolumeMouseDown = ({
  event,
  onVolumeUpdate,
  onMuteUpdate,
  isMuted,
  audioController,
}: {
  event: MouseEvent;
  onVolumeUpdate: (volume: number) => void;
  onMuteUpdate: (muted: boolean) => void;
  isMuted: boolean;
  audioController: AudioController;
}) => {
  const audio = audioController.getAudio();
  if (!audio) return;

  event.preventDefault();
  const volumeContainer = event.currentTarget as HTMLElement;
  volumeContainer.classList.add('dragging');

  const handleMouseMove = (e: MouseEvent) => {
    const rect = volumeContainer.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;
    const percentage = Math.max(0, Math.min(1, clickX / width));

    const newVolume = percentage * 100;
    onVolumeUpdate(newVolume);

    audioController.clearFadeInterval(); // Clear any existing fade and set volume immediately during drag
    audioController.setAudioVolume(percentage);

    // If we're muted and user changes volume, unmute
    if (isMuted && newVolume > 0) {
      onMuteUpdate(false);
    }
  };

  const handleMouseUp = () => {
    volumeContainer.classList.remove('dragging');
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };

  document.addEventListener('mousemove', handleMouseMove);
  document.addEventListener('mouseup', handleMouseUp);
};

/*
 * Toggle mute functionality
 */
export const handleToggleMute = ({
  isMuted,
  currentVolume,
  previousVolume,
  onMuteUpdate,
  onVolumeUpdate,
  onPreviousVolumeUpdate,
  audioController,
}: {
  isMuted: boolean;
  currentVolume: number;
  previousVolume: number;
  onMuteUpdate: (muted: boolean) => void;
  onVolumeUpdate: (volume: number) => void;
  onPreviousVolumeUpdate: (volume: number) => void;
  audioController: AudioController;
}) => {
  const audio = audioController.getAudio();
  if (!audio) return;

  if (isMuted) {
    // Unmute: restore previous volume
    onVolumeUpdate(previousVolume);
    audioController.setAudioVolume(previousVolume / 100);
    onMuteUpdate(false);
  } else {
    // Mute: save current volume and set to 0
    onPreviousVolumeUpdate(currentVolume);
    onVolumeUpdate(0);
    audioController.setAudioVolume(0);
    onMuteUpdate(true);
  }
};
