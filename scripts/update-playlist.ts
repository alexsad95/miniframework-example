import fs from 'node:fs';
import path from 'node:path';
import { parseFile } from 'music-metadata';

// Path to music folder
const musicDir = path.join(import.meta.dir, '../public/music');
const playlistPath = path.join(import.meta.dir, '../public/playlist.json');

// Supported audio formats (only mp3 and wav)
const audioExtensions = ['.mp3', '.wav'];

interface MusicFile {
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
      data: string; // base64 encoded image
      mimeType: string; // image/jpeg, image/png, etc.
      size: number;
    };
  };
}

interface ParsedFilename {
  artist: string;
  song: string;
  fullTitle: string;
}

function parseFilename(filename: string): ParsedFilename {
  // Remove file extension
  const nameWithoutExt = path.basename(filename, path.extname(filename));

  // Common patterns for separating artist and song:
  // "Artist - Song", "Artist – Song", "Artist — Song", "Artist _ Song"
  const separators = [' - ', ' – ', ' — ', ' _ ', ' -', ' –', ' —', ' _'];

  for (const separator of separators) {
    if (nameWithoutExt.includes(separator)) {
      const parts = nameWithoutExt.split(separator);
      if (parts.length >= 2) {
        const artist = parts[0]?.trim();
        const song = parts.slice(1).join(separator).trim(); // Join remaining parts in case song title contains separator
        return {
          artist: artist || 'Unknown Artist',
          song,
          fullTitle: nameWithoutExt,
        };
      }
    }
  }

  // If no separator found, treat the whole filename as song title
  return {
    artist: 'Unknown Artist',
    song: nameWithoutExt,
    fullTitle: nameWithoutExt,
  };
}

async function extractMetadata(filePath: string): Promise<MusicFile['metadata']> {
  try {
    const metadata = await parseFile(filePath);
    const filename = path.basename(filePath);
    const parsedFilename = parseFilename(filename);
    const result: MusicFile['metadata'] = {};

    console.log('metadata for', filename, ':', {
      id3Title: metadata.common.title,
      id3Artist: metadata.common.artist,
      parsedArtist: parsedFilename.artist,
      parsedSong: parsedFilename.song,
      duration: metadata.format.duration,
    });

    // Extract basic metadata from ID3 tags first
    if (metadata.common.title) {
      result.title = metadata.common.title;
      result.song = metadata.common.title; // Also set song field
    }
    if (metadata.common.artist) {
      result.artist = metadata.common.artist;
    }
    if (metadata.common.album) {
      result.album = metadata.common.album;
    }
    if (metadata.common.year) {
      result.year = metadata.common.year;
    }
    if (metadata.common.genre && metadata.common.genre.length > 0) {
      result.genre = metadata.common.genre[0];
    }
    if (metadata.format.duration) {
      result.duration = Math.round(metadata.format.duration);
    }

    // If no ID3 tags found, use parsed filename data
    if (!metadata.common.title && !metadata.common.artist) {
      result.title = parsedFilename.fullTitle;
      result.artist = parsedFilename.artist;
      result.song = parsedFilename.song;
    } else if (!metadata.common.title) {
      // If we have artist but no title, use parsed song name
      result.title = parsedFilename.song;
      result.song = parsedFilename.song;
    } else if (!metadata.common.artist) {
      // If we have title but no artist, use parsed artist
      result.artist = parsedFilename.artist;
      // Keep the ID3 title as song
      result.song = metadata.common.title;
    }

    // Extract album cover
    if (metadata.common.picture && metadata.common.picture.length > 0) {
      const picture = metadata.common.picture[0];
      if (picture?.data) {
        result.cover = {
          data: Buffer.from(picture.data).toString('base64'),
          mimeType: picture.format || 'image/jpeg',
          size: picture.data.length,
        };
      }
    }

    return result;
  } catch (error) {
    console.error(`Error extracting metadata from ${filePath}:`, error);
    // Fallback to filename parsing if metadata extraction fails
    const filename = path.basename(filePath);
    const parsedFilename = parseFilename(filename);
    return {
      title: parsedFilename.fullTitle,
      artist: parsedFilename.artist,
      song: parsedFilename.song,
    };
  }
}

async function scanMusicDirectory(): Promise<MusicFile[]> {
  try {
    if (!fs.existsSync(musicDir)) {
      console.log('Music directory does not exist:', musicDir);
      return [];
    }

    const files = fs.readdirSync(musicDir);

    const musicFiles = await Promise.all(
      files
        .filter((file) => {
          const ext = path.extname(file).toLowerCase();
          return audioExtensions.includes(ext);
        })
        .map(async (file) => {
          const filePath = path.join(musicDir, file);
          const metadata = await extractMetadata(filePath);

          // Use metadata title if available, otherwise use parsed filename
          const parsedFilename = parseFilename(file);
          const title = metadata?.title || parsedFilename.fullTitle;

          return {
            title: title,
            src: `/music/${file}`,
            metadata: metadata && Object.keys(metadata).length > 0 ? metadata : undefined,
          };
        }),
    );

    // Sort by title
    musicFiles.sort((a, b) => a.title.localeCompare(b.title));

    console.log(`Found ${musicFiles.length} music files:`);
    musicFiles.forEach((file) => {
      console.log(`  - ${file.title}`);
      if (file.metadata?.artist) console.log(`    Artist: ${file.metadata.artist}`);
      if (file.metadata?.album) console.log(`    Album: ${file.metadata.album}`);
      if (file.metadata?.duration)
        console.log(
          `    Duration: ${Math.floor(file.metadata.duration / 60)}:${(file.metadata.duration % 60).toString().padStart(2, '0')}`,
        );
      if (file.metadata?.cover)
        console.log(`    Cover: ${file.metadata.cover.mimeType} (${file.metadata.cover.size} bytes)`);
    });

    return musicFiles;
  } catch (error) {
    console.error('Error scanning music directory:', error);
    return [];
  }
}

async function updatePlaylist(): Promise<void> {
  const musicFiles = await scanMusicDirectory();

  if (musicFiles.length === 0) {
    console.log('No music files found. Creating empty playlist.');
    // Create empty playlist
    fs.writeFileSync(playlistPath, JSON.stringify([], null, 2));
    console.log('Empty playlist written to', playlistPath);
    return;
  }

  // Write playlist to JSON file directly in public folder
  fs.writeFileSync(playlistPath, JSON.stringify(musicFiles, null, 2));
  console.log(`Playlist updated: ${musicFiles.length} songs written to ${playlistPath}`);
}

// Run update
updatePlaylist().catch(console.error);
