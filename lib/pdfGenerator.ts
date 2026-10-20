import { jsPDF } from 'jspdf';
import { exportHighResJpeg } from './canvasRenderer';
import { Stroke, SignatureExportResult } from './types';

export interface GenerateDocumentsOptions {
  strokes: Stroke[];
  canvasWidth: number;
  canvasHeight: number;
  signerName?: string;
  notes?: string;
  recipientEmail?: string;
}

export async function generateSignatureDocuments({
  strokes,
  canvasWidth,
  canvasHeight,
  signerName = 'Signer',
  notes = '',
  recipientEmail = 'okaforrichard76@gmail.com',
}: GenerateDocumentsOptions): Promise<SignatureExportResult> {
  const timestamp = new Date().toISOString();
  const formattedDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const formattedTime = new Date().toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZoneName: 'short',
  });

  // 1. Generate High-Res JPEG with solid white background
  const { dataUrl: jpegDataUrl, base64: jpegBase64, blob: jpegBlob } =
    await exportHighResJpeg(strokes, canvasWidth, canvasHeight, 2400);

  // 2. Generate PDF using jsPDF (Portrait, mm, standard A4: 210 x 297 mm)
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;

  // Solid white background
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');

  // Outer decorative border
  doc.setDrawColor(228, 228, 231);
  doc.setLineWidth(0.6);
  doc.roundedRect(margin - 5, margin - 5, contentWidth + 10, pageHeight - (margin * 2) + 10, 3, 3, 'S');

  // Header band
  doc.setFillColor(250, 250, 250);
  doc.rect(margin - 4.5, margin - 4.5, contentWidth + 9, 28, 'F');

  // Header Title
  doc.setTextColor(24, 24, 27);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('DIGITAL SIGNATURE RECORD', margin + 4, margin + 11);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(113, 113, 122);
  doc.text('OFFICIAL ELECTRONIC SIGNATURE & VERIFICATION CERTIFICATE', margin + 4, margin + 17);
  doc.text(`DELIVERED TO: ${recipientEmail.toUpperCase()}`, margin + 4, margin + 22);

  // Status Badge
  doc.setFillColor(240, 253, 244);
  doc.setDrawColor(187, 247, 208);
  doc.roundedRect(pageWidth - margin - 40, margin + 6, 38, 14, 2, 2, 'FD');
  doc.setTextColor(22, 101, 52);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('STATUS: EXECUTED', pageWidth - margin - 37, margin + 15);

  let currentY = margin + 38;

  // Document Details Section
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(24, 24, 27);
  doc.text('Signature Metadata', margin, currentY);

  currentY += 4;
  doc.setDrawColor(244, 244, 245);
  doc.setLineWidth(0.4);
  doc.line(margin, currentY, pageWidth - margin, currentY);

  currentY += 8;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);

  const drawRow = (label: string, value: string) => {
    doc.setTextColor(113, 113, 122);
    doc.text(label, margin, currentY);
    doc.setTextColor(24, 24, 27);
    doc.setFont('helvetica', 'bold');
    doc.text(value, margin + 45, currentY);
    doc.setFont('helvetica', 'normal');
    currentY += 7;
  };

  const documentRefId = `SIG-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

  drawRow('Signer Name:', signerName || 'Not specified');
  drawRow('Execution Date:', formattedDate);
  drawRow('Execution Time:', formattedTime);
  drawRow('Authorized Recipient:', recipientEmail);
  drawRow('Reference Code:', documentRefId);
  if (notes) {
    drawRow('Signer Note:', notes);
  }

  currentY += 8;

  // Signature Display Box
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(24, 24, 27);
  doc.text('Executed Signature', margin, currentY);

  currentY += 6;

  const boxWidth = contentWidth;
  const boxHeight = 70;

  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(228, 228, 231);
  doc.setLineWidth(0.5);
  doc.roundedRect(margin, currentY, boxWidth, boxHeight, 3, 3, 'FD');

  const lineY = currentY + boxHeight - 16;
  doc.setDrawColor(212, 212, 216);
  doc.setLineWidth(0.3);
  doc.line(margin + 15, lineY, margin + boxWidth - 15, lineY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(161, 161, 170);
  doc.text('SIGNATURE OF RECORD', margin + 16, lineY + 5);

  const imgMargin = 10;
  const imgAvailableWidth = boxWidth - imgMargin * 2;
  const imgAvailableHeight = boxHeight - 24;

  const canvasAspect = canvasWidth / canvasHeight;
  let renderWidth = imgAvailableWidth;
  let renderHeight = renderWidth / canvasAspect;

  if (renderHeight > imgAvailableHeight) {
    renderHeight = imgAvailableHeight;
    renderWidth = renderHeight * canvasAspect;
  }

  const imgX = margin + (boxWidth - renderWidth) / 2;
  const imgY = currentY + 6;

  doc.addImage(jpegDataUrl, 'JPEG', imgX, imgY, renderWidth, renderHeight, undefined, 'FAST');

  currentY += boxHeight + 14;

  // Legal / Intent Attestation Statement
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, currentY, contentWidth, 26, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text('ELECTRONIC SIGNATURE ATTESTATION & ACKNOWLEDGEMENT', margin + 6, currentY + 7);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  const legalText = `The undersigned party has executed this electronic signature intentionally and with full legal authorization. In accordance with electronic signature statutes, this digital representation is officially recorded, time-stamped, and archived for transmission directly to ${recipientEmail}.`;
  doc.text(doc.splitTextToSize(legalText, contentWidth - 12), margin + 6, currentY + 13);

  // Footer
  const footerY = pageHeight - margin - 2;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(161, 161, 170);
  doc.text(`Document Reference: ${documentRefId}  •  Archived for: ${recipientEmail}`, margin, footerY);
  doc.text('Page 1 of 1', pageWidth - margin - 16, footerY);

  const pdfBlob = doc.output('blob');
  const pdfDataUrl = doc.output('datauristring');
  const pdfBase64 = pdfDataUrl.split(',')[1];

  return {
    jpegDataUrl,
    jpegBase64,
    pdfDataUrl,
    pdfBase64,
    pdfBlob,
    jpegBlob,
    signerName,
    timestamp,
  };
}
