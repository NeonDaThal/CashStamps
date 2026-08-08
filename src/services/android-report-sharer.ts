import { Capacitor, registerPlugin } from '@capacitor/core';

export interface ShareAndroidPngReportOptions {
  dataUrl: string;
  fileName: string;
  title: string;
  text: string;
}

export interface ShareAndroidPngReportResult {
  success: boolean;
  fileName: string;
  message: string;
}

interface AndroidReportSharerPlugin {
  sharePngReport(
    options: ShareAndroidPngReportOptions
  ): Promise<ShareAndroidPngReportResult>;
}

const AndroidReportSharer = registerPlugin<AndroidReportSharerPlugin>(
  'AndroidReportSharer'
);

export function isAndroidReportSharerAvailable(): boolean {
  return Capacitor.getPlatform() === 'android' && Capacitor.isNativePlatform();
}

export async function shareAndroidPngReport(
  options: ShareAndroidPngReportOptions
): Promise<ShareAndroidPngReportResult> {
  return AndroidReportSharer.sharePngReport(options);
}
