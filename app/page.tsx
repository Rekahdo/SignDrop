'use client';

import { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { SignatureCanvas } from '@/components/SignatureCanvas';
import { SuccessModal } from '@/components/SuccessModal';
import { EmailConfigModal } from '@/components/EmailConfigModal';
import { Stroke, SignatureExportResult, SubmissionResponse } from '@/lib/types';
import { generateSignatureDocuments } from '@/lib/pdfGenerator';
import { RotateCcw, Send, AlertCircle, Calendar, User, Loader2, Sparkles, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const TARGET_RECIPIENT_EMAIL = 'okaforrichard76@gmail.com';

export default function SignaturePage() {
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

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('signdrop_resend_key');
      if (saved) setResendApiKey(saved);
    }
  }, []);

  const handleCanvasDimensionsChange = (newStrokes: Stroke[], width: number, height: number) => {
    setCanvasDimensions({ width, height });
  };

  // Reset button action: Clears canvas
  const handleReset = () => {
    setStrokes([]);
    setErrorMessage(null);
    setStatusMessage(null);
  };

  // Submit button action: Converts signature into PDF & high-res JPEG and emails via Resend
  const handleSubmit = async () => {
    if (strokes.length === 0) {
      setErrorMessage('Please provide your signature on the canvas before submitting.');
      return;
    }

    setErrorMessage(null);
    setIsSubmitting(true);
    setStatusMessage('Generating high-resolution JPEG and official PDF...');

    try {
      const docs = await generateSignatureDocuments({
        strokes,
        canvasWidth: canvasDimensions.width,
        canvasHeight: canvasDimensions.height,
        signerName: signerName.trim() || 'Signer',
        notes: signerNotes.trim(),
        recipientEmail: TARGET_RECIPIENT_EMAIL,
      });

      setExportResult(docs);
      setStatusMessage(`Transmitting documents to ${TARGET_RECIPIENT_EMAIL} via Resend...`);

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
      <Header
        recipientEmail={TARGET_RECIPIENT_EMAIL}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-10 flex flex-col justify-between">
        <div className="space-y-6">
          {/* Header Title & Prompt */}
          <div className="text-center sm:text-left space-y-1.5">
            <div className="inline-flex items-center gap-1.5 mb-1">
              <Badge variant="secondary" className="gap-1.5 py-1 px-3 text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5 text-zinc-600" />
                <span>Next.js 16 Signature Portal</span>
              </Badge>
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

          {/* Signer Details Card */}
          <Card className="bg-zinc-50/70 border-zinc-200/70">
            <CardContent className="p-4 sm:p-5 space-y-3">
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
                  <Input
                    type="text"
                    value={signerName}
                    onChange={(e) => setSignerName(e.target.value)}
                    placeholder="e.g. Richard Okafor"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-600 mb-1">
                    Note / Reference (Optional)
                  </label>
                  <Input
                    type="text"
                    value={signerNotes}
                    onChange={(e) => setSignerNotes(e.target.value)}
                    placeholder="e.g. Agreement Approval, Contract #104"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Error Message */}
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

          {/* Two Action Buttons: Reset & Submit */}
          <div className="pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Reset Button */}
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={handleReset}
                disabled={isSubmitting || strokes.length === 0}
                className="w-full gap-2 border-2"
              >
                <RotateCcw className="w-4 h-4 text-zinc-600" />
                <span>Reset</span>
              </Button>

              {/* Submit Button */}
              <Button
                type="button"
                variant="default"
                size="lg"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="w-full gap-2 bg-zinc-950 hover:bg-zinc-800"
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
              </Button>
            </div>

            {isSubmitting && statusMessage && (
              <p className="text-xs text-center text-zinc-500 mt-2.5 animate-pulse font-medium">
                {statusMessage}
              </p>
            )}
          </div>

          {/* Guarantee Note */}
          <div className="rounded-xl border border-zinc-100 bg-zinc-50/50 p-3.5 flex items-center gap-3 text-xs text-zinc-500">
            <Shield className="w-4 h-4 text-zinc-400 shrink-0" />
            <p>
              Your signature is converted into a PDF certificate and a 2400px high-resolution JPEG,
              then transmitted directly to{' '}
              <span className="font-semibold text-zinc-800">{TARGET_RECIPIENT_EMAIL}</span>.
            </p>
          </div>
        </div>

        <footer className="mt-12 pt-6 border-t border-zinc-100 text-center text-xs text-zinc-400">
          <p>SignDrop • Built with Next.js 16, Tailwind CSS, Base UI &amp; Resend</p>
        </footer>
      </main>

      {/* Success Pop-up Modal */}
      <SuccessModal
        isOpen={isSuccessModalOpen}
        onClose={() => setIsSuccessModalOpen(false)}
        onSignAnother={handleSignAnother}
        recipientEmail={TARGET_RECIPIENT_EMAIL}
        deliveredTo={submissionResponse?.deliveredTo}
        sandboxWarning={submissionResponse?.sandboxWarning}
        exportResult={exportResult}
        dispatchId={submissionResponse?.dispatchId}
        provider={submissionResponse?.provider}
      />

      {/* Settings Modal */}
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
