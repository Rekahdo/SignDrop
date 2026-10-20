import { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { CheckCircle2, Download, FileText, Image as ImageIcon, X, ArrowRight, ExternalLink } from 'lucide-react';
import { SignatureExportResult } from '../types';

interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSignAnother: () => void;
  recipientEmail: string;
  exportResult: SignatureExportResult | null;
  dispatchId?: string;
  provider?: string;
}

export function SuccessModal({
  isOpen,
  onClose,
  onSignAnother,
  recipientEmail,
  exportResult,
  dispatchId,
  provider,
}: SuccessModalProps) {
  useEffect(() => {
    if (isOpen) {
      // Fire confetti celebration
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#18181b', '#10b981', '#3b82f6', '#f59e0b'],
        });
      } catch (err) {
        console.warn('Confetti trigger failed:', err);
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const downloadFile = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadPdf = () => {
    if (exportResult?.pdfBlob) {
      downloadFile(exportResult.pdfBlob, `signature-document-${Date.now()}.pdf`);
    }
  };

  const handleDownloadJpeg = () => {
    if (exportResult?.jpegBlob) {
      downloadFile(exportResult.jpegBlob, `signature-highres-${Date.now()}.jpg`);
    }
  };

  const handleOpenPdfPreview = () => {
    if (exportResult?.pdfDataUrl) {
      const win = window.open();
      if (win) {
        win.document.write(
          `<iframe src="${exportResult.pdfDataUrl}" frameborder="0" style="border:0; top:0; left:0; bottom:0; right:0; width:100%; height:100%;" allowfullscreen></iframe>`
        );
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-zinc-100 overflow-hidden text-zinc-900 animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          type="button"
          className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-full transition-colors z-10"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6 sm:p-8 flex flex-col items-center text-center">
          {/* Success Checkmark Badge */}
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-5 ring-8 ring-emerald-50/50">
            <CheckCircle2 className="w-10 h-10 stroke-[2.2]" />
          </div>

          {/* Heading */}
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-950">
            Submission Confirmed!
          </h2>

          {/* Exact required text notification banner */}
          <div className="mt-3 w-full bg-emerald-50/70 border border-emerald-200/80 rounded-xl p-3.5 text-center">
            <p className="text-sm font-semibold text-emerald-950 leading-relaxed">
              Your signature has been sent successfully to {recipientEmail}.
            </p>
          </div>

          {/* Delivery Details */}
          <div className="w-full mt-4 bg-zinc-50 border border-zinc-200/60 rounded-xl p-3 text-left text-xs text-zinc-600 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-zinc-500">Destination:</span>
              <span className="font-mono font-medium text-zinc-900">{recipientEmail}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-zinc-500">Attachments:</span>
              <span className="font-medium text-zinc-900">PDF &amp; High-Res JPEG</span>
            </div>
            {dispatchId && (
              <div className="flex items-center justify-between">
                <span className="text-zinc-500">Transaction Ref:</span>
                <span className="font-mono text-[11px] text-zinc-700">{dispatchId}</span>
              </div>
            )}
          </div>

          {/* Preview of Generated Attachments */}
          {exportResult && (
            <div className="w-full mt-4 text-left">
              <p className="text-xs font-semibold text-zinc-700 mb-2">Attached Documents:</p>
              <div className="grid grid-cols-2 gap-2.5">
                {/* PDF Card */}
                <div className="p-3 bg-white border border-zinc-200 rounded-xl flex flex-col justify-between hover:border-zinc-300 transition-colors">
                  <div className="flex items-start gap-2 mb-2">
                    <div className="p-2 bg-rose-50 text-rose-600 rounded-lg">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div className="text-left overflow-hidden">
                      <p className="text-xs font-bold text-zinc-900 truncate">Signature PDF</p>
                      <p className="text-[10px] text-zinc-500">Official Document</p>
                    </div>
                  </div>
                  <button
                    onClick={handleDownloadPdf}
                    type="button"
                    className="w-full py-1.5 px-2 bg-zinc-50 hover:bg-zinc-100 text-zinc-800 text-[11px] font-semibold rounded-lg flex items-center justify-center gap-1 transition-colors border border-zinc-200/60"
                  >
                    <Download className="w-3 h-3" />
                    Download PDF
                  </button>
                </div>

                {/* High-Res JPEG Card */}
                <div className="p-3 bg-white border border-zinc-200 rounded-xl flex flex-col justify-between hover:border-zinc-300 transition-colors">
                  <div className="flex items-start gap-2 mb-2">
                    <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                      <ImageIcon className="w-4 h-4" />
                    </div>
                    <div className="text-left overflow-hidden">
                      <p className="text-xs font-bold text-zinc-900 truncate">High-Res JPEG</p>
                      <p className="text-[10px] text-zinc-500">Solid White Background</p>
                    </div>
                  </div>
                  <button
                    onClick={handleDownloadJpeg}
                    type="button"
                    className="w-full py-1.5 px-2 bg-zinc-50 hover:bg-zinc-100 text-zinc-800 text-[11px] font-semibold rounded-lg flex items-center justify-center gap-1 transition-colors border border-zinc-200/60"
                  >
                    <Download className="w-3 h-3" />
                    Download JPEG
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="w-full mt-6 flex flex-col sm:flex-row items-center gap-2.5">
            <button
              onClick={onSignAnother}
              type="button"
              className="w-full sm:flex-1 py-3 px-4 bg-zinc-900 hover:bg-zinc-800 text-white text-sm font-semibold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 active:scale-98"
            >
              <span>Sign Another Signature</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              type="button"
              className="w-full sm:w-auto py-3 px-5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-sm font-semibold rounded-xl transition-colors active:scale-98"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
