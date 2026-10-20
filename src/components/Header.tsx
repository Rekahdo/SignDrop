import { useState } from 'react';
import { Mail, Share2, Check, Sparkles, ShieldCheck, Settings } from 'lucide-react';

interface HeaderProps {
  recipientEmail: string;
  onOpenSettings?: () => void;
}

export function Header({ recipientEmail, onOpenSettings }: HeaderProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
      const input = document.createElement('input');
      input.value = window.location.href;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <header className="w-full border-b border-zinc-100 bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        {/* Brand / Title */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-zinc-950 text-white flex items-center justify-center shadow-xs">
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
              />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold tracking-tight text-zinc-900">SignDrop</h1>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-700">
                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                Secure Capture
              </span>
            </div>
            <p className="text-xs text-zinc-500">Fast, minimalist digital signature submission</p>
          </div>
        </div>

        {/* Recipient info & Actions */}
        <div className="flex items-center flex-wrap gap-2.5">
          {/* Target Email Indicator */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-50 border border-zinc-200/80 text-xs font-medium text-zinc-700 shadow-2xs">
            <Mail className="w-3.5 h-3.5 text-zinc-500" />
            <span className="text-zinc-500 hidden md:inline">Sends to:</span>
            <span className="font-semibold text-zinc-900 font-mono text-[11px] sm:text-xs">
              {recipientEmail}
            </span>
          </div>

          {/* Copy Share Link */}
          <button
            onClick={handleCopyLink}
            type="button"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900 transition-colors shadow-2xs active:scale-95"
            title="Copy link to easily share this signature page"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700 font-medium">Link Copied</span>
              </>
            ) : (
              <>
                <Share2 className="w-3.5 h-3.5 text-zinc-500" />
                <span>Share Link</span>
              </>
            )}
          </button>

          {/* Settings / Info Modal trigger */}
          {onOpenSettings && (
            <button
              onClick={onOpenSettings}
              type="button"
              className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors"
              title="Email delivery settings & log"
            >
              <Settings className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
