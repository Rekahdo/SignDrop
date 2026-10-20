import { useState, useEffect } from 'react';
import { Mail, Key, X, CheckCircle, Info, RefreshCw, Send, ShieldAlert } from 'lucide-react';

interface EmailConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipientEmail: string;
  resendApiKey: string;
  setResendApiKey: (key: string) => void;
}

export function EmailConfigModal({
  isOpen,
  onClose,
  recipientEmail,
  resendApiKey,
  setResendApiKey,
}: EmailConfigModalProps) {
  const [tempKey, setTempKey] = useState(resendApiKey);
  const [dispatches, setDispatches] = useState<any[]>([]);
  const [loadingDispatches, setLoadingDispatches] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    setTempKey(resendApiKey);
  }, [resendApiKey]);

  useEffect(() => {
    if (isOpen) {
      fetchDispatches();
    }
  }, [isOpen]);

  const fetchDispatches = async () => {
    try {
      setLoadingDispatches(true);
      const res = await fetch('/api/dispatches');
      if (res.ok) {
        const data = await res.json();
        setDispatches(data.dispatches || []);
      }
    } catch {
      // Ignore network errors
    } finally {
      setLoadingDispatches(false);
    }
  };

  if (!isOpen) return null;

  const handleSave = () => {
    setResendApiKey(tempKey.trim());
    localStorage.setItem('signdrop_resend_key', tempKey.trim());
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/50 backdrop-blur-xs">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-xl border border-zinc-200 overflow-hidden text-zinc-900">
        <div className="flex items-center justify-between p-5 border-b border-zinc-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-zinc-100 flex items-center justify-center text-zinc-700">
              <Mail className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-900">Email Delivery &amp; Services</h3>
              <p className="text-xs text-zinc-500">Configured to send to {recipientEmail}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="p-1.5 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Target destination banner */}
          <div className="bg-zinc-50 border border-zinc-200/80 rounded-xl p-3 text-xs space-y-1">
            <div className="flex items-center justify-between font-medium">
              <span className="text-zinc-500">Configured Recipient:</span>
              <span className="font-semibold text-zinc-900 font-mono">{recipientEmail}</span>
            </div>
            <p className="text-[11px] text-zinc-500">
              Every submitted signature is bundled into a PDF + High-Res JPEG and sent to this inbox.
            </p>
          </div>

          {/* Optional Resend API Key */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-zinc-800 flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-zinc-500" />
              <span>Resend API Key (Optional)</span>
            </label>
            <input
              type="password"
              value={tempKey}
              onChange={(e) => setTempKey(e.target.value)}
              placeholder="re_123456789... (optional)"
              className="w-full text-xs font-mono px-3 py-2 rounded-xl border border-zinc-200 focus:outline-hidden focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-colors"
            />
            <p className="text-[11px] text-zinc-500">
              If left blank, the app uses the built-in delivery system which converts both attachments, records the transmission, and logs the dispatch. Adding a key enables direct inbox transmission through your Resend account.
            </p>
          </div>

          {/* Recent Transmission Audit Log */}
          <div className="border-t border-zinc-100 pt-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold text-zinc-900">Recent Signature Dispatches</h4>
              <button
                type="button"
                onClick={fetchDispatches}
                className="text-[11px] text-zinc-500 hover:text-zinc-900 flex items-center gap-1"
              >
                <RefreshCw className={`w-3 h-3 ${loadingDispatches ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>

            {dispatches.length === 0 ? (
              <p className="text-xs text-zinc-400 italic py-2">No signatures dispatched yet this session.</p>
            ) : (
              <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                {dispatches.map((d) => (
                  <div
                    key={d.id}
                    className="p-2.5 rounded-lg border border-zinc-200/80 bg-zinc-50/50 text-[11px] flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-1.5 font-semibold text-zinc-900">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{d.signerName || 'Signer'}</span>
                        <span className="text-zinc-400 font-normal">→ {d.recipient}</span>
                      </div>
                      <p className="text-[10px] text-zinc-500 mt-0.5">
                        {new Date(d.timestamp).toLocaleTimeString()} • PDF ({Math.round(d.files?.pdfSize / 1024)}KB) &amp; JPEG ({Math.round(d.files?.jpegSize / 1024)}KB)
                      </p>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-100 text-emerald-800">
                      Dispatched
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="p-4 border-t border-zinc-100 flex items-center justify-between bg-zinc-50">
          <span className="text-[11px] text-zinc-500">
            {savedSuccess ? 'Settings saved!' : 'Configuration is stored locally.'}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              type="button"
              className="px-3 py-1.5 text-xs font-semibold text-zinc-600 hover:text-zinc-900"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              type="button"
              className="px-4 py-1.5 text-xs font-semibold bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg transition-colors"
            >
              Save Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
