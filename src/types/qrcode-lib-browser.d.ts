declare module 'qrcode/lib/browser' {
  export interface QRCodeToDataURLOptions {
    errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
    margin?: number;
    width?: number;
    scale?: number;
    color?: {
      dark?: string;
      light?: string;
    };
  }

  const QRCode: {
    toDataURL(
      text: string | Uint8Array,
      options?: QRCodeToDataURLOptions
    ): Promise<string>;
  };

  export default QRCode;
}
