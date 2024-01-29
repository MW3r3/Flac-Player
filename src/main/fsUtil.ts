import { dialog } from 'electron';
import { app } from 'electron';
import path from 'path';
import { promises as fs } from 'fs';
import * as musicMetadata from 'music-metadata';

const appDataDirectory = app.getPath('appData');
const appDirectory = path.join(appDataDirectory, 'myMusicApp');
const filePath = path.join(appDirectory, 'libraryPaths.json');
const libraryMapPath = path.join(appDirectory, 'libraryMap.json');

export interface Track {
  title: string;
  artwork: string;
  genre: string;
  duration: number;
  year: number;
  artist: string;
  // Add more properties as needed
}

export interface Album {
  albumName: string;
  albumCover: string;
  tracks: Track[];
}

export interface LibraryMap {
  [album: string]: Album;
}

export const selectDirectory = async (): Promise<string | undefined> => {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory']
  });

  if (result.canceled) {
    return undefined;
  } else {
    return result.filePaths[0];
  }
};

export const createLibraryMap = async (): Promise<LibraryMap> => {
  const libraryMap: LibraryMap = {};
  const libraryPaths = await readLibraryPaths();

  if (libraryPaths.length === 0) {
    // If there are no libraries, write an empty map to the file and return it
    await fs.writeFile(path.join(appDirectory, 'libraryMap.json'), JSON.stringify(libraryMap, null, 2));
    return libraryMap;
  }

  for (const libraryPath of libraryPaths) {
    const albumName = path.basename(libraryPath);
    const trackFiles = await readDirectory(libraryPath);

    const albumCoverPath = path.join(libraryPath, 'cover.jpg');
    const album: Album = {
      albumName,
      albumCover: albumCoverPath,
      tracks: [],
    };

    for (const trackFile of trackFiles) {
      const trackPath = path.join(libraryPath, trackFile);
      const metadata = await getMetadata(trackPath);

      album.tracks.push({
        title: metadata.common.title || "unknown",
        artwork: metadata.common.picture ? metadata.common.picture[0].data.toString('base64') : '',
        genre: metadata.common.genre ? metadata.common.genre[0] : '',
        duration: metadata.format.duration || 0,
        year: metadata.common.year || 0,
        artist: metadata.common.artist || "unknown",
        // Add more properties as needed
      });
    }

    libraryMap[albumName] = album;
  }

  await fs.writeFile(path.join(appDirectory, 'libraryMap.json'), JSON.stringify(libraryMap, null, 2));

  return libraryMap;
};

export const readLibraryMap = async (): Promise<LibraryMap> => {
  const libraryMapPath = path.join(appDirectory, 'libraryMap.json');
  
  try {
    const data = await fs.readFile(libraryMapPath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      // If the file doesn't exist, create the map
      return await createLibraryMap();
    } else {
      console.error(`Failed to read library map from ${libraryMapPath}:`, error);
      throw error;
    }
  }
};

export const readLibraryPaths = async (): Promise<string[]> => {
  try {
    const data = await fs.readFile(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return [];
    } else {
      console.error(`Failed to read library paths from ${filePath}:`, error);
      throw error;
    }
  }
};

export const writeLibraryPaths = async (paths: string[]): Promise<void> => {
  try {
    const data = JSON.stringify(paths, null, 2);
    await fs.writeFile(filePath, data);
  } catch (error) {
    console.error(`Failed to write library paths to ${filePath}:`, error);
    throw error;
  }
};

export const addPathToLibrary = async (newPath: string): Promise<void> => {
  const paths = await readLibraryPaths();
  paths.push(newPath);
  await writeLibraryPaths(paths);
};

export const removePathFromLibrary = async (pathToRemove: string): Promise<void> => {
  const paths = await readLibraryPaths();
  const index = paths.indexOf(pathToRemove);
  if (index !== -1) {
    paths.splice(index, 1);
    await writeLibraryPaths(paths);
  }
};

export const readDirectory = async (dirPath: string): Promise<string[]> => {
  return fs.readdir(dirPath);
};

export const getMetadata = async (filePath: string): Promise<musicMetadata.IAudioMetadata> => {
  return musicMetadata.parseFile(filePath);
};


export const isDirStructured = async (albumFolderPath: string): Promise<boolean | string> => {
  try {
    const albumFolderContents = await fs.readdir(albumFolderPath);

    const hasCover = albumFolderContents.includes('cover.jpg');
    if (!hasCover) {
      return 'Missing cover.jpg file';
    }

    const songFiles = albumFolderContents.filter((item) => {
      const ext = path.extname(item);
      return ext === '.mp3' || ext === '.wav' || ext === '.flac';
    });

    if (songFiles.length === 0) {
      return 'No song files found';
    }

    return true;
  } catch (error) {
    console.error(`Failed to check album folder structure:`, error);
    throw error;
  }
};

