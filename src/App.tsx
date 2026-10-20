import { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { SignatureCanvas } from './components/SignatureCanvas';
import { SuccessModal } from './components/SuccessModal';
import { EmailConfigModal } from './components/EmailConfigModal';
import { Stroke, SignatureExportResult, SubmissionResponse } from './types';
import { generateSignatureDocuments } from './utils/pdfGenerator';
import { RotateCcw, Send, CheckCircle2, AlertCircle, Calendar, User, FileCheck2, Loader2, Sparkles, Shield } from 'lucide-react';

const TARGET_RECIPIENT_EMAIL = 'okaforrichard76@gmail.com';

export default function App() {
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [canvasDimensions, setCanvasDimensions] = useState<{ width: number; height: number }>({
    width: 800,
    height: 400,
  });

  const [signerName, setSignerName] = useState('');
  const [signerNotes, setSignerNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Success Pop-up state
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [exportResult, setExportResult] = useState<SignatureExportResult | null>(null);
  const [submissionResponse, setSubmissionResponse] = useState<SubmissionResponse | null>(null);

  // Settings modal
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [resendApiKey, setResendApiKey] = useState('');

  // Load saved resend key if any
  useEffect(() => {
    const saved = localStorage.getItem('signdrop_resend_key');
    if (saved) setResendApiKey(saved);
  }, []);

  const handleCanvasDimensionsChange = (newStrokes: Stroke[], width: number, height: number) => {
    setCanvasDimensions({ width, height });
  };

  // Reset button action: Clears the canvas for the user to try again
  const handleReset = () => {
    setStrokes([]);
    setErrorMessage(null);
    setStatusMessage(null);
  };

  // Submit button action: Converts signature into PDF & high-res JPEG and emails both
  const handleSubmit = async () => {
    // Validation
    if (strokes.length === 0) {
      setErrorMessage('Please provide your signature on the canvas before submitting.');
      return;
    }

    setErrorMessage(null);
    setIsSubmitting(true);
    setStatusMessage('Generating high-resolution JPEG and official PDF...');

    try {
      // 1. Generate PDF & high-res JPEG (with solid white background)
      const docs = await generateSignatureDocuments({
        strokes,
        canvasWidth: canvasDimensions.width,
        canvasHeight: canvasDimensions.height,
        signerName: signerName.trim() || 'Signer',
        notes: signerNotes.trim(),
        recipientEmail: TARGET_RECIPIENT_EMAIL,
      });

      setExportResult(docs);
      setStatusMessage(`Transmitting documents to ${TARGET_RECIPIENT_EMAIL}...`);

      // 2. Dispatch to backend API
      const response = await fetch('/api/send-signature', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipient: TARGET_RECIPIENT_EMAIL,
          signerName: signerName.trim() || 'Signer',
          pdfBase64: docs.pdfBase64,
          jpegBase64: docs.jpegBase64,
          notes: signerNotes.trim(),
          resendApiKey: resendApiKey.trim() || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to submit signature email.');
      }

      const result: SubmissionResponse = await response.json();
      setSubmissionResponse(result);

      // Open Success Pop-up modal
      setIsSuccessModalOpen(true);
    } catch (err: any) {
      console.error('Submission error:', err);
      setErrorMessage(
        err.message || 'An error occurred while sending your signature. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
      setStatusMessage(null);
    }
  };

  const handleSignAnother = () => {
    setIsSuccessModalOpen(false);
    handleReset();
    setSignerName('');
    setSignerNotes('');
  };

  const formattedDate = new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="min-h-screen bg-white text-zinc-900 flex flex-col selection:bg-zinc-950 selection:text-white">
      {/* Header */}
      <Header
        recipientEmail={TARGET_RECIPIENT_EMAIL}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-10 flex flex-col justify-between">
        <div className="space-y-6">
          {/* Page Heading & Prompt */}
          <div className="text-center sm:text-left space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-100 text-zinc-700 text-xs font-semibold mb-1">
              <Sparkles className="w-3.5 h-3.5 text-zinc-600" />
              <span>Digital Signature Portal</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-950">
              Sign &amp; Submit Document
            </h2>
            <p className="text-sm text-zinc-500 max-w-xl">
              Draw your signature below using black ink. When you click Submit, your signature is
              instantly packaged into a verified PDF and high-resolution JPEG and delivered to{' '}
              <strong className="text-zinc-800 font-semibold">{TARGET_RECIPIENT_EMAIL}</strong>.
            </p>
          </div>

          {/* Optional Signer Details Card */}
          <div className="bg-zinc-50/70 border border-zinc-200/70 rounded-2xl p-4 sm:p-5 space-y-3">
            <div className="flex items-center justify-between text-xs font-semibold text-zinc-700">
              <span className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-zinc-500" />
                Signer Details
              </span>
              <span className="flex items-center gap-1 text-zinc-400 font-normal">
                <Calendar className="w-3.5 h-3.5" />
                {formattedDate}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-zinc-600 mb-1">
                  Your Full Name
                </label>
                <input
                  type="text"
                  value={signerName}
                  onChange={(e) => setSignerName(e.target.value)}
                  placeholder="e.g. Richard Okafor"
                  className="w-full text-sm px-3.5 py-2.5 bg-white border border-zinc-200 rounded-xl placeholder:text-zinc-400 focus:outline-hidden focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-600 mb-1">
                  Note / Reference (Optional)
                </label>
                <input
                  type="text"
                  value={signerNotes}
                  onChange={(e) => setSignerNotes(e.target.value)}
                  placeholder="e.g. Agreement Approval, Contract #104"
                  className="w-full text-sm px-3.5 py-2.5 bg-white border border-zinc-200 rounded-xl placeholder:text-zinc-400 focus:outline-hidden focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-all"
                />
              </div>
            </div>
          </div>

          {/* Error Message Alert */}
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200/80 text-rose-800 text-xs sm:text-sm flex items-start gap-2.5 animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" />
              <div className="flex-1">
                <p className="font-semibold">Unable to submit signature</p>
                <p className="text-xs text-rose-700 mt-0.5">{errorMessage}</p>
              </div>
            </div>
          )}

          {/* Signature Canvas Area */}
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-600 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-zinc-950 inline-block"></span>
                Signature Canvas (Black Ink)
              </label>
              <span className="text-[11px] text-zinc-400">Solid white background</span>
            </div>

            <SignatureCanvas
              strokes={strokes}
              setStrokes={setStrokes}
              onStrokesChange={handleCanvasDimensionsChange}
            />
          </div>

          {/* Action Buttons: "Reset" and "Submit" */}
          <div className="pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Reset Button */}
              <button
                type="button"
                onClick={handleReset}
                disabled={isSubmitting || strokes.length === 0}
                className="w-full py-3.5 px-5 rounded-2xl border-2 border-zinc-200 bg-white hover:bg-zinc-50 hover:border-zinc-300 text-zinc-800 font-bold text-sm transition-all shadow-xs flex items-center justify-center gap-2 active:scale-98 disabled:opacity-40 disabled:pointer-events-none"
              >
                <RotateCcw className="w-4 h-4 text-zinc-600" />
                <span>Reset</span>
              </button>

              {/* Submit Button */}
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="w-full py-3.5 px-6 rounded-2xl bg-zinc-950 hover:bg-zinc-800 active:scale-98 text-white font-bold text-sm transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-wait"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-zinc-300" />
                    <span>Processing &amp; Sending...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 text-zinc-200" />
                    <span>Submit</span>
                  </>
                )}
              </button>
            </div>

            {/* Submission status hint */}
            {isSubmitting && statusMessage && (
              <p className="text-xs text-center text-zinc-500 mt-2.5 animate-pulse font-medium">
                {statusMessage}
              </p>
            )}
          </div>

          {/* Destination & Security Guarantee Note */}
          <div className="rounded-xl border border-zinc-100 bg-zinc-50/50 p-3.5 flex items-center gap-3 text-xs text-zinc-500">
            <Shield className="w-4 h-4 text-zinc-400 shrink-0" />
            <p>
              Your signature is converted into a PDF certificate and a 2400px high-resolution JPEG,
              then transmitted directly to{' '}
              <span className="font-semibold text-zinc-800">{TARGET_RECIPIENT_EMAIL}</span>.
            </p>
          </div>
        </div>

        {/* Minimal Footer */}
        <footer className="mt-12 pt-6 border-t border-zinc-100 text-center text-xs text-zinc-400">
          <p>SignDrop • Clean &amp; Secure Digital Signature Delivery</p>
        </footer>
      </main>

      {/* Success Pop-up Modal */}
      <SuccessModal
        isOpen={isSuccessModalOpen}
        onClose={() => setIsSuccessModalOpen(false)}
        onSignAnother={handleSignAnother}
        recipientEmail={TARGET_RECIPIENT_EMAIL}
        exportResult={exportResult}
        dispatchId={submissionResponse?.dispatchId}
        provider={submissionResponse?.provider}
      />

      {/* Email Delivery & Settings Modal */}
      <EmailConfigModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        recipientEmail={TARGET_RECIPIENT_EMAIL}
        resendApiKey={resendApiKey}
        setResendApiKey={setResendApiKey}
      />
    </div>
  );
}
