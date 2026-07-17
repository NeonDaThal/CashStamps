import { Capacitor, registerPlugin } from '@capacitor/core';

export interface AndroidReportPrinterResult {
  success: boolean;
  jobName: string;
  message: string;
}

interface AndroidReportPrinterPlugin {
  printHtml(options: {
    html: string;
    jobName?: string;
  }): Promise<AndroidReportPrinterResult>;
}

const AndroidReportPrinter = registerPlugin<AndroidReportPrinterPlugin>(
  'AndroidReportPrinter'
);

export function isAndroidReportPrinterAvailable(): boolean {
  return Capacitor.getPlatform() === 'android';
}

export async function printAndroidReportHtml(options: {
  html: string;
  jobName?: string;
}): Promise<AndroidReportPrinterResult> {
  if (!isAndroidReportPrinterAvailable()) {
    throw new Error(
      'Android report printer is only available inside the Android app.'
    );
  }

  if (!options.html.trim()) {
    throw new Error('Report HTML is missing.');
  }

  return AndroidReportPrinter.printHtml({
    html: options.html,
    jobName: options.jobName ?? 'Bitcoin Cash Topups Merchant Report',
  });
}
