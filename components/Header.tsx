'use client';

import { useState, useEffect } from 'react';
import { Mail, Share2, Check, ShieldCheck, Settings, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface HeaderProps {
  recipientEmail: string;
  onOpenSettings?: () => void;
}

export function Header({ recipientEmail, onOpenSettings }: HeaderProps) {
  const [copied, setCopied] = useState(false);
  const [currentUrl, setCurrentUrl] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setCurrentUrl(window.location.href);
    }
  }, []);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
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

  const whatsappShareUrl = currentUrl
    ? `https://wa.me/?text=${encodeURIComponent(
        `Please use this link to draw and submit your signature to ${recipientEmail}: ${currentUrl}`
      )}`
    : '#';

  return (
    <header className="w-full border-b border-zinc-100 bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        {/* Brand */}
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
              <Badge variant="secondary" className="gap-1 font-semibold text-[11px] bg-zinc-100 text-zinc-700">
                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                Next.js 16
              </Badge>
            </div>
            <p className="text-xs text-zinc-500">Fast, minimalist digital signature submission</p>
          </div>
        </div>

        {/* Recipient & Share Actions */}
        <div className="flex items-center flex-wrap gap-2">
          {/* Recipient Indicator */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-50 border border-zinc-200/80 text-xs font-medium text-zinc-700 shadow-2xs">
            <Mail className="w-3.5 h-3.5 text-zinc-500" />
            <span className="text-zinc-500 hidden md:inline">Sends to:</span>
            <span className="font-semibold text-zinc-900 font-mono text-[11px] sm:text-xs">
              {recipientEmail}
            </span>
          </div>

          {/* Share to WhatsApp Button */}
          <a
            href={whatsappShareUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-1.5 h-8 px-3 rounded-lg text-xs font-semibold bg-emerald-50 border border-emerald-200 text-emerald-800 hover:bg-emerald-100 hover:border-emerald-300 transition-colors shadow-2xs active:scale-95"
            title="Share this signature request via WhatsApp"
          >
            <MessageCircle className="w-3.5 h-3.5 text-emerald-600 fill-emerald-600/20" />
            <span>WhatsApp</span>
          </a>

          {/* Copy Share Link Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyLink}
            className="h-8 gap-1.5 text-xs rounded-lg"
            title="Copy link to clipboard"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700 font-medium">Copied</span>
              </>
            ) : (
              <>
                <Share2 className="w-3.5 h-3.5 text-zinc-500" />
                <span>Copy Link</span>
              </>
            )}
          </Button>

          {onOpenSettings && (
            <button
              onClick={onOpenSettings}
              type="button"
              className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors"
              title="Resend email delivery settings"
            >
              <Settings className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
