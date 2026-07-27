import { Capacitor, registerPlugin } from '@capacitor/core';

export interface AndroidImageSaverResult {
  success: boolean;
  fileName: string;
  message: string;
  uri?: string;
}

interface AndroidImageSaverPlugin {
  savePngImage(options: {
    dataUrl: string;
    fileName: string;
    albumName?: string;
  }): Promise<AndroidImageSaverResult>;
}

const AndroidImageSaver =
  registerPlugin<AndroidImageSaverPlugin>('AndroidImageSaver');

export function isAndroidImageSaverAvailable(): boolean {
  return Capacitor.getPlatform() === 'android';
}

export async function saveAndroidPngImage(options: {
  dataUrl: string;
  fileName: string;
  albumName?: string;
}): Promise<AndroidImageSaverResult> {
  if (!isAndroidImageSaverAvailable()) {
    throw new Error(
      'Android image saver is only available inside the Android app.'
    );
  }

  if (!options.dataUrl.trim()) {
    throw new Error('Image data is missing.');
  }

  if (!options.fileName.trim()) {
    throw new Error('Image filename is missing.');
  }

  return AndroidImageSaver.savePngImage({
    dataUrl: options.dataUrl,
    fileName: options.fileName,
    albumName: options.albumName ?? 'Bitcoin Cash Topups',
  });
}
