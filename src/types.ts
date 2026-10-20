export interface Point {
  x: number;
  y: number;
  time?: number;
}

export interface Stroke {
  points: Point[];
  color: string;
  width: number;
}

export interface SignatureExportResult {
  jpegDataUrl: string;
  jpegBase64: string;
  pdfDataUrl: string;
  pdfBase64: string;
  pdfBlob: Blob;
  jpegBlob: Blob;
  signerName: string;
  timestamp: string;
}

export interface SubmissionResponse {
  success: boolean;
  message: string;
  recipient: string;
  provider?: string;
  dispatchId?: string;
  timestamp?: string;
  error?: string;
}
