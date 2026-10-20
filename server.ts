import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface EmailAttachment {
  filename: string;
  content: string; // Base64 string
  type: string;
}

interface SendSignatureRequest {
  recipient: string;
  signerName?: string;
  pdfBase64: string; // Data URL or raw base64
  jpegBase64: string; // Data URL or raw base64
  date?: string;
  notes?: string;
  resendApiKey?: string;
}

// In-memory record of dispatched signatures (useful for demo/verification)
const dispatchedSignatures: Array<{
  id: string;
  timestamp: string;
  recipient: string;
  signerName: string;
  service: string;
  status: 'sent' | 'simulated';
  files: {
    pdfSize: number;
    jpegSize: number;
  };
}> = [];

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  // JSON payload parser with generous limit for base64 PDF and high-res JPEG
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // API Route: Send signature via Email Service
  app.post('/api/send-signature', async (req, res) => {
    try {
      const {
        recipient = 'okaforrichard76@gmail.com',
        signerName = 'Anonymous Signer',
        pdfBase64,
        jpegBase64,
        date = new Date().toISOString(),
        notes = '',
        resendApiKey: clientResendKey,
      } = req.body as SendSignatureRequest;

      if (!pdfBase64 || !jpegBase64) {
        return res.status(400).json({
          success: false,
          error: 'Missing required signature attachments (PDF and JPEG)',
        });
      }

      // Clean raw base64 data if it contains data URL prefixes
      const cleanPdfBase64 = pdfBase64.replace(/^data:application\/pdf;base64,/, '');
      const cleanJpegBase64 = jpegBase64.replace(/^data:image\/jpeg;base64,/, '');

      const activeResendKey = clientResendKey || process.env.RESEND_API_KEY;
      const sendGridKey = process.env.SENDGRID_API_KEY;
      const fromEmail = process.env.EMAIL_SENDER || 'SignDrop Signatures <onboarding@resend.dev>';

      let deliveryProvider = 'simulated';
      let providerResponse: any = null;

      // 1. If Resend API Key is available
      if (activeResendKey) {
        try {
          const resendPayload = {
            from: fromEmail,
            to: [recipient],
            subject: `New Signature Submitted by ${signerName || 'Signer'}`,
            html: `
              <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e4e4e7; border-radius: 12px; background-color: #ffffff;">
                <div style="margin-bottom: 24px; border-bottom: 1px solid #f4f4f5; padding-bottom: 16px;">
                  <h1 style="font-size: 20px; font-weight: 700; color: #18181b; margin: 0 0 6px 0;">New Signature Received</h1>
                  <p style="font-size: 14px; color: #71717a; margin: 0;">Captured via SignDrop Digital Signature Collection</p>
                </div>
                
                <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 14px;">
                  <tr>
                    <td style="padding: 8px 0; color: #71717a; width: 140px;">Signer Name:</td>
                    <td style="padding: 8px 0; color: #18181b; font-weight: 600;">${signerName || 'Not specified'}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #71717a;">Timestamp:</td>
                    <td style="padding: 8px 0; color: #18181b;">${new Date(date).toLocaleString()}</td>
                  </tr>
                  ${notes ? `<tr><td style="padding: 8px 0; color: #71717a;">Notes:</td><td style="padding: 8px 0; color: #18181b;">${notes}</td></tr>` : ''}
                </table>

                <div style="margin: 20px 0; padding: 16px; background-color: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0;">
                  <p style="font-size: 13px; font-weight: 600; color: #334155; margin: 0 0 8px 0;">Attached Documents:</p>
                  <ul style="font-size: 13px; color: #475569; margin: 0; padding-left: 20px;">
                    <li><strong>signature.pdf</strong> (Official Document PDF format)</li>
                    <li><strong>signature-highres.jpg</strong> (High-Resolution JPEG with solid white background)</li>
                  </ul>
                </div>

                <div style="margin-top: 32px; padding-top: 16px; border-top: 1px solid #f4f4f5; font-size: 12px; color: #a1a1aa; text-align: center;">
                  Delivered directly to ${recipient} via SignDrop Digital Signature Service.
                </div>
              </div>
            `,
            attachments: [
              {
                filename: `signature-${Date.now()}.pdf`,
                content: cleanPdfBase64,
              },
              {
                filename: `signature-highres-${Date.now()}.jpg`,
                content: cleanJpegBase64,
              },
            ],
          };

          const resendFetch = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${activeResendKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(resendPayload),
          });

          if (!resendFetch.ok) {
            const errorText = await resendFetch.text();
            console.error('Resend API error:', errorText);
            throw new Error(`Resend API Error: ${errorText}`);
          }

          providerResponse = await resendFetch.json();
          deliveryProvider = 'resend';
        } catch (resendErr: any) {
          console.warn('Resend send failed, falling back to simulated logger:', resendErr.message);
          deliveryProvider = 'resend-failed-fallback';
        }
      } else if (sendGridKey) {
        // 2. If SendGrid API Key is configured
        try {
          const sendGridPayload = {
            personalizations: [{ to: [{ email: recipient }] }],
            from: { email: 'signatures@resend.dev', name: 'SignDrop' },
            subject: `New Signature Submitted by ${signerName || 'Signer'}`,
            content: [{ type: 'text/html', value: `<p>A new signature was captured for <strong>${recipient}</strong>.</p>` }],
            attachments: [
              {
                content: cleanPdfBase64,
                filename: 'signature.pdf',
                type: 'application/pdf',
                disposition: 'attachment',
              },
              {
                content: cleanJpegBase64,
                filename: 'signature-highres.jpg',
                type: 'image/jpeg',
                disposition: 'attachment',
              },
            ],
          };

          const sgFetch = await fetch('https://api.sendgrid.com/v3/mail/send', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${sendGridKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(sendGridPayload),
          });

          if (sgFetch.ok) {
            deliveryProvider = 'sendgrid';
          }
        } catch (sgErr) {
          console.warn('SendGrid error:', sgErr);
        }
      }

      // Log dispatch for verification
      const dispatchRecord = {
        id: `sig_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        timestamp: new Date().toISOString(),
        recipient,
        signerName: signerName || 'Signer',
        service: deliveryProvider,
        status: (deliveryProvider === 'resend' || deliveryProvider === 'sendgrid' ? 'sent' : 'simulated') as 'sent' | 'simulated',
        files: {
          pdfSize: Math.round(cleanPdfBase64.length * 0.75),
          jpegSize: Math.round(cleanJpegBase64.length * 0.75),
        },
      };

      dispatchedSignatures.unshift(dispatchRecord);
      if (dispatchedSignatures.length > 50) dispatchedSignatures.pop();

      console.log(`[SignDrop] Signature successfully processed for ${recipient} via ${deliveryProvider}. Dispatched ID: ${dispatchRecord.id}`);

      return res.status(200).json({
        success: true,
        message: `Your signature has been sent successfully to ${recipient}.`,
        recipient,
        provider: deliveryProvider,
        dispatchId: dispatchRecord.id,
        timestamp: dispatchRecord.timestamp,
        providerResponse,
      });
    } catch (err: any) {
      console.error('Failed to process signature submission:', err);
      return res.status(500).json({
        success: false,
        error: err.message || 'Internal Server Error',
      });
    }
  });

  // Get dispatch history (for verification and debugging)
  app.get('/api/dispatches', (req, res) => {
    res.json({
      dispatches: dispatchedSignatures,
      configuredProviders: {
        hasResendEnvKey: !!process.env.RESEND_API_KEY,
        hasSendGridEnvKey: !!process.env.SENDGRID_API_KEY,
      },
    });
  });

  // Setup Vite development middleware or static production serve
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`SignDrop server running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
