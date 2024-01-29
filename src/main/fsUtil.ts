import { dialog } from 'electron';
import { app } from 'electron';
import path from 'path';
import fs from 'fs';

const appDataDirectory = app.getPath('appData');
const appDirectory = path.join(appDataDirectory, 'myMusicApp');
const filePath = path.join(appDirectory, 'libraryPaths.json');

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

export const addPathToLibrary = async (newPath: string): Promise<void> => {
  let paths: string[];
  try {
    const data = await fs.promises.readFile(filePath, 'utf8');
    paths = JSON.parse(data);
  } catch (error) {
    if (error.code === 'ENOENT') {
      // File does not exist, start with an empty array
      paths = [];
    } else {
      // Other error
      console.error(`Failed to read library paths from ${filePath}:`, error);
      throw error;
    }
  }

  // Add the new path to the array
  paths.push(newPath);

  // Write the updated array back to the file
  try {
    const data = JSON.stringify(paths, null, 2);
    await fs.promises.writeFile(filePath, data);
  } catch (error) {
    console.error(`Failed to write library paths to ${filePath}:`, error);
    throw error;
  }
};


  

