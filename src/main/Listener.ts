import { ipcMain } from 'electron';


interface ListenerProps {
  listenerName: string;
  callback: (event: Electron.IpcMainEvent, arg: any) => void;
}

export const createListener = ({ listenerName, callback }: ListenerProps) => {
  try {
    ipcMain.on(listenerName, (event, arg) => {
      callback(event, arg);
    });
  } catch (error) {
    console.error(`Failed to create listener for ${listenerName}:`, error);
  }
};

export const createOnceListener = ({ listenerName, callback }: ListenerProps) => {
  try {
    ipcMain.once(listenerName, (event, arg) => {
      callback(event, arg);
    });
  } catch (error) {
    console.error(`Failed to create once listener for ${listenerName}:`, error);
  }
};

export const removeListener = (listenerName: string) => {
  try {
    ipcMain.removeAllListeners(listenerName);
  } catch (error) {
    console.error(`Failed to remove listener for ${listenerName}:`, error);
  }
};

export const logActiveListeners = () => {
  const events = (ipcMain as any)._events;
  for (const eventName in events) {
    const listeners = events[eventName];
    console.log(`Active listeners for ${eventName}:`, listeners.length);
  }
};

export const flushAllListeners = () => {
  ipcMain.removeAllListeners();
  console.log('All listeners removed RESTART the APP to work properly');
}

export const countListeners = (listenerName: string) => {
  return ipcMain.listenerCount(listenerName);
};

export const hasListener = (listenerName: string, callback: Function) => {
  const listeners = ipcMain.listeners(listenerName);
  return listeners.includes(callback);
};


