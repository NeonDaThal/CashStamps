import jsQR from 'jsqr';

export function stopTreasuryQrCameraStream(stream: MediaStream | null): void {
  stream?.getTracks().forEach((track) => track.stop());
}

export async function openTreasuryQrCameraStream(): Promise<MediaStream> {
  if (!navigator.mediaDevices?.getUserMedia) {
    throw new Error('Camera scanning is not supported on this device.');
  }

  return navigator.mediaDevices.getUserMedia({
    audio: false,
    video: {
      facingMode: { ideal: 'environment' },
      width: { ideal: 1280 },
      height: { ideal: 720 },
    },
  });
}

export function readTreasuryQrFromImageData(
  imageData: ImageData
): string | null {
  const result = jsQR(imageData.data, imageData.width, imageData.height, {
    inversionAttempts: 'attemptBoth',
  });

  return result?.data?.trim() || null;
}

export function readTreasuryQrFromVideoFrame(
  video: HTMLVideoElement,
  canvas: HTMLCanvasElement
): string | null {
  if (!video.videoWidth || !video.videoHeight) {
    return null;
  }

  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  const context = canvas.getContext('2d', {
    willReadFrequently: true,
  });

  if (!context) {
    return null;
  }

  context.drawImage(video, 0, 0, canvas.width, canvas.height);

  const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
  return readTreasuryQrFromImageData(imageData);
}

function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const objectUrl = URL.createObjectURL(file);

    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Could not load the selected image.'));
    };

    image.src = objectUrl;
  });
}

export async function readTreasuryQrFromImageFile(file: File): Promise<string> {
  const image = await loadImageFromFile(file);
  const canvas = document.createElement('canvas');

  canvas.width = image.naturalWidth || image.width;
  canvas.height = image.naturalHeight || image.height;

  const context = canvas.getContext('2d', {
    willReadFrequently: true,
  });

  if (!context) {
    throw new Error('Could not read the selected image.');
  }

  context.drawImage(image, 0, 0, canvas.width, canvas.height);

  const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
  const qrValue = readTreasuryQrFromImageData(imageData);

  if (!qrValue) {
    throw new Error('No QR code was found in the selected image.');
  }

  return qrValue;
}
