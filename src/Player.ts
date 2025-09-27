import {
  handleProgressClick,
  handleProgressMouseDown,
  handleToggleMute,
  handleVolumeClick,
  handleVolumeMouseDown,
} from './audio/handlers';
import { audioController } from './audio/utils';
import type { Track } from './types';
import { h } from './utils/dom';
import { formatTime, truncateText } from './utils/helpers';
import { PlayerIcons } from './utils/icons';
import { writable } from './utils/reactivity';

export function Player() {
  /* 
    Creation of reactive variables and their initialization
  */

  const playlist = writable<Track[]>([]);
  const currentIndex = writable(0);
  const playing = writable(false);
  const progress = writable(0);
  const isLoading = writable(false);
  const volume = writable(100);
  const isMuted = writable(false);
  const previousVolume = writable(100);

  /* 
    Functions for use in DOM, event handlers
  */

  const playTrack = (index: number) => {
    currentIndex.set(index);
    const currentPlaylist = playlist.get();
    const currentTrack = currentPlaylist[index];
    if (currentTrack) {
      audioController.createAudio(currentTrack);
      audioController.playAudio();
      playing.set(true);

      const currentVolume = volume.get() / 100;
      audioController.fadeVolume(currentVolume);

      // Scroll to the selected track after a short delay to ensure DOM is updated
      setTimeout(scrollToActiveSong, 100);
    }
  };

  const togglePlay = () => {
    const audio = audioController.getAudio();
    if (!audio) {
      const currentPlaylist = playlist.get();
      const currentIdx = currentIndex.get();
      const currentTrack = currentPlaylist[currentIdx];
      if (currentTrack) {
        audioController.createAudio(currentTrack);
      }
    }

    if (playing.get()) {
      // Pause with fade out
      playing.set(false);
      audioController.fadeVolume(0);

      setTimeout(() => {
        audioController.pauseAudio();
      }, 1000);
    } else {
      // Play with fade in
      const currentVolume = volume.get() / 100;
      audioController.playAudio();
      playing.set(true);
      audioController.fadeVolume(currentVolume);
    }
  };

  const next = () => {
    const wasPlaying = playing.get();
    const currentPlaylist = playlist.get();
    const currentIdx = currentIndex.get();
    currentIndex.set((currentIdx + 1) % currentPlaylist.length);

    const newIdx = (currentIdx + 1) % currentPlaylist.length;
    const nextTrack = currentPlaylist[newIdx];
    if (nextTrack) {
      audioController.createAudio(nextTrack);
      if (wasPlaying) {
        // Start with volume 0 and fade in
        audioController.setAudioVolume(0);
        audioController.playAudio();
        playing.set(true);

        const currentVolume = volume.get() / 100;
        audioController.fadeVolume(currentVolume);
      }

      // Scroll to the next track
      setTimeout(scrollToActiveSong, 100);
    }
  };

  const prev = () => {
    const wasPlaying = playing.get();
    const currentPlaylist = playlist.get();
    const currentIdx = currentIndex.get();
    const newIdx = (currentIdx - 1 + currentPlaylist.length) % currentPlaylist.length;
    currentIndex.set(newIdx);

    const prevTrack = currentPlaylist[newIdx];
    if (prevTrack) {
      audioController.createAudio(prevTrack);
      if (wasPlaying) {
        // Start with volume 0 and fade in
        audioController.setAudioVolume(0);
        audioController.playAudio();
        playing.set(true);

        const currentVolume = volume.get() / 100;
        audioController.fadeVolume(currentVolume);
      }

      // Scroll to the previous track
      setTimeout(scrollToActiveSong, 100);
    }
  };

  // Update volume icon based on volume level and mute state
  const updateVolumeIcon = (volumeValue: number) => {
    let icon: string | null = null;
    const muted = isMuted.get();

    if (muted || volumeValue === 0) {
      icon = PlayerIcons.volumeOff(24);
    } else if (volumeValue < 50) {
      icon = PlayerIcons.volumeLow(24);
    } else {
      icon = PlayerIcons.volume(24);
    }

    if (icon) {
      volumeIcon.innerHTML = icon;
    }
  };

  // Update song title with truncation
  const updateSongTitle = (title: string) => {
    const truncatedTitle = truncateText(title, 50); // Max 50 characters for song title
    songTitleElement.textContent = truncatedTitle;
    songTitleElement.title = title; // Show full title on hover
  };

  // Update artist name with truncation
  const updateArtistName = (name: string) => {
    const truncatedName = truncateText(name, 25); // Max 25 characters
    artistNameElement.textContent = truncatedName;
    artistNameElement.title = name; // Show full name on hover
  };

  // Function to scroll to active song
  const scrollToActiveSong = () => {
    const currentIdx = currentIndex.get();
    const playlistData = playlist.get();
    if (playlistData.length > 0 && playlistElement.children.length > currentIdx) {
      const activeLi = playlistElement.children[currentIdx] as HTMLElement;
      if (activeLi) {
        // Get current scroll position
        const currentScrollTop = playlistElement.scrollTop;

        // Get positions using getBoundingClientRect for accuracy
        const playlistRect = playlistElement.getBoundingClientRect();
        const activeRect = activeLi.getBoundingClientRect();

        // Calculate the center of the active element relative to the playlist
        const activeCenter = activeRect.top + activeRect.height / 2;
        const playlistCenter = playlistRect.top + playlistRect.height / 2;

        // Calculate how much we need to scroll to center the element
        const scrollOffset = activeCenter - playlistCenter;

        // Calculate the target scroll position
        const targetScrollTop = currentScrollTop + scrollOffset;

        // Ensure we don't scroll beyond the boundaries
        const maxScrollTop = playlistElement.scrollHeight - playlistElement.clientHeight;
        const finalScrollTop = Math.max(0, Math.min(targetScrollTop, maxScrollTop));

        // Scroll to the calculated position
        playlistElement.scrollTo({
          top: finalScrollTop,
          behavior: 'smooth',
        });
      }
    }
  };

  /* 
    Various events for DOM elements, in this case for the elements of the player control
  */

  // Handle progress bar click
  const handleProgressClickWrapper = (event: MouseEvent) => {
    handleProgressClick({
      event,
      onProgressUpdate: progress.set,
      audioController,
    });
  };

  // Toggle mute functionality
  const handleToggleMuteWrapper = () => {
    handleToggleMute({
      isMuted: isMuted.get(),
      currentVolume: volume.get(),
      previousVolume: previousVolume.get(),
      onMuteUpdate: isMuted.set,
      onVolumeUpdate: volume.set,
      onPreviousVolumeUpdate: previousVolume.set,
      audioController,
    });
  };

  // Handle volume click
  const handleVolumeClickWrapper = (event: MouseEvent) => {
    handleVolumeClick({
      event,
      onVolumeUpdate: (volumeValue) => {
        volume.set(volumeValue);
        updateVolumeIcon(volumeValue);
      },
      onMuteUpdate: isMuted.set,
      isMuted: isMuted.get(),
      audioController,
    });
  };

  // Handle volume drag start
  const handleVolumeMouseDownWrapper = (event: MouseEvent) => {
    handleVolumeMouseDown({
      event,
      onVolumeUpdate: (volumeValue) => {
        volume.set(volumeValue);
        updateVolumeIcon(volumeValue);
      },
      onMuteUpdate: isMuted.set,
      isMuted: isMuted.get(),
      audioController,
    });
  };

  // Handle drag start
  const handleProgressMouseDownWrapper = (event: MouseEvent) => {
    handleProgressMouseDown({
      event,
      onProgressUpdate: progress.set,
      audioController,
    });
  };

  /* 
    UI elements for the player control
  */

  // Create UI elements
  const container = h('div', { className: 'container' }, []);
  const player = h('div', { className: 'player' }, []);
  const playButton = h('button', { onClick: togglePlay }, []);
  const loadingElement = h('div', { className: 'loading', style: 'display: none;' }, ['Loading playlist...']);
  const progressBar = h('div', { className: 'progress-bar' }, []);
  const currentTimeElement = h('div', { className: 'time-display current-time' }, ['0:00']);
  const totalTimeElement = h('div', { className: 'time-display total-time' }, ['0:00']);

  // Volume control
  const volumeBar = h('div', { className: 'volume-bar', style: 'width: 100%' }, []);
  const volumeIcon = h(
    'div',
    {
      className: 'volume-icon',
      onClick: handleToggleMuteWrapper,
      style: 'cursor: pointer;',
    },
    [],
  );

  const volumeContainer = h(
    'div',
    {
      className: 'volume-progress',
      onClick: handleVolumeClickWrapper,
      onMouseDown: handleVolumeMouseDownWrapper,
    },
    [volumeBar],
  );

  const albumCoverElement = h('div', { className: 'album-cover-main', innerHTML: PlayerIcons.music(32) || '🎵' }, []);
  const songTitleElement = h('div', { className: 'song-title-main' }, ['Loading...']);
  const artistNameElement = h('div', { className: 'artist-name-main' }, ['']);
  const playlistElement = h('ul', {}, []);

  // Main title section with album cover
  const mainTitleSection = h('div', { className: 'main-title-section' }, [
    h('div', { className: 'track-info' }, [
      albumCoverElement,
      h('div', { className: 'title-text-section' }, [songTitleElement, artistNameElement]),
    ]),
    h('div', { className: 'controls' }, [
      h('div', { className: 'player-control' }, [
        h('button', { onClick: prev, innerHTML: PlayerIcons.prev(24) || '⏮' }, []),
        playButton,
        h('button', { onClick: next, innerHTML: PlayerIcons.next(24) || '⏭' }, []),
      ]),
      h('div', { className: 'volume-control' }, [volumeIcon, volumeContainer]),
    ]),
  ]);

  const progressContainer = h(
    'div',
    {
      className: 'progress',
      onClick: handleProgressClickWrapper,
      onMouseDown: handleProgressMouseDownWrapper,
    },
    [progressBar],
  );

  const progressWrapper = h('div', { className: 'progress-wrapper' }, [
    currentTimeElement,
    progressContainer,
    totalTimeElement,
  ]);

  // Build UI
  player.appendChild(mainTitleSection);
  player.appendChild(progressWrapper);
  player.appendChild(loadingElement);
  container.appendChild(player);

  /* 
    Audio callbacks
  */

  // Set up audio callbacks
  audioController.setAudioCallbacks({
    onTimeUpdate: () => {
      const audio = audioController.getAudio();
      if (audio) {
        const progressValue = (audio.currentTime / audio.duration) * 100;
        progress.set(progressValue);
        currentTimeElement.textContent = formatTime(audio.currentTime);
      }
    },
    onTrackEnd: () => {
      const currentPlaylist = playlist.get();
      const currentIdx = currentIndex.get();

      // Calculate next track index (loop back to 0 if at the end)
      const nextIndex = (currentIdx + 1) % currentPlaylist.length;

      // Switch to next track and play automatically
      currentIndex.set(nextIndex);
      const nextTrack = currentPlaylist[nextIndex];
      if (nextTrack) {
        audioController.createAudio(nextTrack);
        audioController.playAudio();
        playing.set(true);

        const currentVolume = volume.get() / 100;
        audioController.fadeVolume(currentVolume);

        // Scroll to the next track
        setTimeout(scrollToActiveSong, 100);
      }
    },
    onLoadedMetadata: () => {
      const audio = audioController.getAudio();
      if (audio?.duration && !Number.isNaN(audio.duration)) {
        totalTimeElement.textContent = formatTime(audio.duration);
      } else {
        totalTimeElement.textContent = '0:00';
      }
    },
  });

  /* 
    Updates when reactive variables change
  */

  // Common function to update current track UI
  const updateCurrentTrackUI = () => {
    const playlistData = playlist.get();
    const currentIdx = currentIndex.get();

    if (playlistData.length > 0) {
      const currentTrack = playlistData[currentIdx];
      const songTitle = currentTrack?.metadata?.song || currentTrack?.title || 'Loading...';
      const artistName = currentTrack?.metadata?.artist || '';

      // Update album cover
      if (currentTrack?.metadata?.cover) {
        albumCoverElement.innerHTML = `<img src="data:${currentTrack.metadata.cover.mimeType};base64,${currentTrack.metadata.cover.data}" alt="Album Cover" />`;
      }

      // Update song title and artist
      updateSongTitle(songTitle);
      updateArtistName(artistName);
    }
  };

  playlist.subscribe(updateCurrentTrackUI);
  currentIndex.subscribe(updateCurrentTrackUI);

  playing.subscribe((isPlaying) => {
    const icon = isPlaying ? PlayerIcons.pause(24) : PlayerIcons.play(24);
    if (icon) {
      playButton.innerHTML = icon;
    }
  });

  progress.subscribe((progressValue) => {
    const newWidth = `${progressValue}%`;
    if (progressBar.style.width !== newWidth) {
      progressBar.style.width = newWidth;
    }
  });

  volume.subscribe((volumeValue) => {
    const newWidth = `${volumeValue}%`;
    if (volumeBar.style.width !== newWidth) {
      volumeBar.style.width = newWidth;
    }
    updateVolumeIcon(volumeValue);
  });

  isMuted.subscribe((_muted) => {
    const currentVolume = volume.get();
    updateVolumeIcon(currentVolume);
  });

  // Function to update playlist UI
  const updatePlaylistUI = () => {
    const playlistData = playlist.get();
    playlistElement.innerHTML = '';

    if (playlistData.length) {
      player.appendChild(playlistElement);

      const currentIdx = currentIndex.get();
      playlistData.forEach((track: Track, index: number) => {
        const isActive = index === currentIdx;

        // Album cover or placeholder
        const albumCoverOrPlaceholder = track.metadata?.cover
          ? h('img', {
              src: `data:${track.metadata.cover.mimeType};base64,${track.metadata.cover.data}`,
              className: 'album-cover',
            })
          : h(
              'div',
              {
                className: 'album-cover-placeholder',
                innerHTML: PlayerIcons.music(24) || '🎵',
              },
              [],
            );

        const trackTitle = h(
          'div',
          {
            className: `track-title ${isActive ? 'active' : 'inactive'}`,
            title: track.metadata?.song || track.title,
          },
          [track.metadata?.song || track.title],
        );

        const trackArtist = track.metadata?.artist
          ? [
              h(
                'div',
                {
                  className: 'track-artist',
                  title: track.metadata.artist,
                },
                [track.metadata.artist],
              ),
            ]
          : [];

        const trackDuration = track.metadata?.duration
          ? [
              h(
                'div',
                {
                  className: 'track-duration',
                },
                [
                  `${Math.floor(track.metadata.duration / 60)}:${(track.metadata.duration % 60).toString().padStart(2, '0')}`,
                ],
              ),
            ]
          : [];

        // Track details
        const trackDetails = h(
          'div',
          {
            className: 'track-details',
          },
          [trackTitle, ...trackArtist, ...trackDuration],
        );

        const li = h(
          'li',
          {
            onClick: () => playTrack(index),
            className: `playlist-item ${isActive ? 'active' : 'inactive'}`,
          },
          [albumCoverOrPlaceholder, trackDetails],
        );

        playlistElement.appendChild(li);
      });

      // No need to scroll here - it will be handled by playTrack
    }
  };

  // Update playlist UI when playlist changes
  playlist.subscribe(() => {
    updatePlaylistUI();
  });

  // Update playlist UI when currentIndex changes (without scroll)
  currentIndex.subscribe(() => {
    // Only update the active class, don't rebuild the entire playlist
    const playlistData = playlist.get();
    const currentIdx = currentIndex.get();

    // Update active classes for all items
    playlistData.forEach((_, index) => {
      const li = playlistElement.children[index] as HTMLElement;
      if (li) {
        const isActive = index === currentIdx;
        li.className = `playlist-item ${isActive ? 'active' : 'inactive'}`;

        // Update track title class
        const trackTitle = li.querySelector('.track-title') as HTMLElement;
        if (trackTitle) {
          trackTitle.className = `track-title ${isActive ? 'active' : 'inactive'}`;
        }
      }
    });
  });

  isLoading.subscribe((loading) => {
    const display = loading ? 'block' : 'none';
    if (loadingElement.style.display !== display) {
      loadingElement.style.display = display;
    }
  });

  /* 
    Something like mounting, only for playlist
  */

  const loadPlaylist = async () => {
    try {
      isLoading.set(true);
      const response = await fetch('/playlist.json');
      if (response.ok) {
        const songs = await response.json();
        playlist.set(songs);
        console.log('Playlist loaded:', songs.length, 'songs');
      } else {
        console.error('Failed to load playlist');
      }
    } catch (error) {
      console.error('Error loading playlist:', error);
    } finally {
      isLoading.set(false);
    }
  };

  // Initialization
  loadPlaylist().then(() => {
    if (playlist.get().length > 0) {
      const currentPlaylist = playlist.get();
      const currentIdx = currentIndex.get();
      const currentTrack = currentPlaylist[currentIdx];
      if (currentTrack) {
        audioController.createAudio(currentTrack);
      }

      // Scroll to active song after initialization
      setTimeout(scrollToActiveSong, 100);
    }
  });

  return container;
}
