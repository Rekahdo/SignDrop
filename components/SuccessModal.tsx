'use client';

import { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { CheckCircle2, Download, FileText, Image as ImageIcon, X, ArrowRight, Info, MessageCircle } from 'lucide-react';
import { SignatureExportResult } from '@/lib/types';
import { Dialog, DialogPopup, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSignAnother: () => void;
  recipientEmail: string;
  deliveredTo?: string;
  sandboxWarning?: string | null;
  exportResult: SignatureExportResult | null;
  dispatchId?: string;
  provider?: string;
}

export function SuccessModal({
  isOpen,
  onClose,
  onSignAnother,
  recipientEmail,
  deliveredTo,
  sandboxWarning,
  exportResult,
  dispatchId,
  provider,
}: SuccessModalProps) {
  useEffect(() => {
    if (isOpen) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#18181b', '#10b981', '#3b82f6', '#f59e0b'],
        });
      } catch (err) {
        console.warn('Confetti error:', err);
      }
    }
  }, [isOpen]);

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

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogPopup className="max-w-lg">
        {/* Close Button */}
        <button
          onClick={onClose}
          type="button"
          className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-full transition-colors z-10"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex flex-col items-center text-center">
          {/* Success Checkmark */}
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-5 ring-8 ring-emerald-50/50">
            <CheckCircle2 className="w-10 h-10 stroke-[2.2]" />
          </div>

          <DialogHeader className="items-center">
            <DialogTitle className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-950">
              Submission Confirmed!
            </DialogTitle>
          </DialogHeader>

          {/* Exact required text notification banner */}
          <div className="mt-3.5 w-full bg-emerald-50/80 border border-emerald-200/90 rounded-xl p-3.5 text-center">
            <p className="text-sm font-semibold text-emerald-950 leading-relaxed">
              Your signature has been sent successfully to {recipientEmail}.
            </p>
          </div>

          {/* Resend Sandbox Note if routed to owner inbox */}
          {sandboxWarning && (
            <div className="w-full mt-3 bg-amber-50/80 border border-amber-200/80 rounded-xl p-3 text-left flex items-start gap-2.5 text-xs text-amber-900">
              <Info className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold text-amber-950">Delivered via Resend Sandbox</p>
                <p className="text-[11px] text-amber-800 mt-0.5 leading-relaxed">
                  Email and attachments sent to your registered Resend inbox: <strong>{deliveredTo}</strong>. Under Resend's free sandbox test domain, messages are delivered to the API key owner until a custom domain is verified.
                </p>
              </div>
            </div>
          )}

          {/* Details */}
          <div className="w-full mt-4 bg-zinc-50 border border-zinc-200/60 rounded-xl p-3 text-left text-xs text-zinc-600 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-zinc-500">Destination:</span>
              <span className="font-mono font-medium text-zinc-900">{recipientEmail}</span>
            </div>
            {deliveredTo && deliveredTo !== recipientEmail && (
              <div className="flex items-center justify-between">
                <span className="text-zinc-500">Delivered To:</span>
                <span className="font-mono font-medium text-amber-900">{deliveredTo}</span>
              </div>
            )}
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

          {/* Document download preview */}
          {exportResult && (
            <div className="w-full mt-4 text-left">
              <p className="text-xs font-semibold text-zinc-700 mb-2">Attached Documents:</p>
              <div className="grid grid-cols-2 gap-2.5">
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
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDownloadPdf}
                    className="w-full h-8 text-[11px] gap-1"
                  >
                    <Download className="w-3 h-3" />
                    Download PDF
                  </Button>
                </div>

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
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDownloadJpeg}
                    className="w-full h-8 text-[11px] gap-1"
                  >
                    <Download className="w-3 h-3" />
                    Download JPEG
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Share to WhatsApp */}
          <a
            href={`https://wa.me/?text=${encodeURIComponent(
              `I have signed and submitted my official signature to ${recipientEmail} on SignDrop.${
                dispatchId ? ` Ref: ${dispatchId}` : ''
              }`
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full mt-4 py-2.5 px-4 rounded-xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold flex items-center justify-center gap-2 transition-colors active:scale-98"
          >
            <MessageCircle className="w-4 h-4 text-emerald-600 fill-emerald-600/20" />
            <span>Share Confirmation on WhatsApp</span>
          </a>

          {/* Action buttons */}
          <div className="w-full mt-4 flex flex-col sm:flex-row items-center gap-2.5">
            <Button
              onClick={onSignAnother}
              className="w-full sm:flex-1 py-3 h-11"
            >
              <span>Sign Another Signature</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
            <Button
              variant="secondary"
              onClick={onClose}
              className="w-full sm:w-auto py-3 h-11"
            >
              Done
            </Button>
          </div>
        </div>
      </DialogPopup>
    </Dialog>
  );
}
