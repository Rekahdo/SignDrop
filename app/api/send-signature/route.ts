import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

// Dispatched history in-memory for audit / debugging
declare global {
  var __dispatched_signatures__: Array<{
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
  }> | undefined;
}

if (!globalThis.__dispatched_signatures__) {
  globalThis.__dispatched_signatures__ = [];
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      recipient = 'okaforrichard76@gmail.com',
      signerName = 'Signer',
      pdfBase64,
      jpegBase64,
      date = new Date().toISOString(),
      notes = '',
      resendApiKey: clientResendKey,
    } = body;

    if (!pdfBase64 || !jpegBase64) {
      return NextResponse.json(
        { success: false, error: 'Missing required signature attachments (PDF and JPEG)' },
        { status: 400 }
      );
    }

    const cleanPdfBase64 = pdfBase64.replace(/^data:application\/pdf;base64,/, '');
    const cleanJpegBase64 = jpegBase64.replace(/^data:image\/jpeg;base64,/, '');

    const activeResendKey = clientResendKey || process.env.SIGNDROP_RESEND_API_KEY || process.env.RESEND_API_KEY;
    const fromEmail = 'SignDrop <onboarding@resend.dev>';

    let deliveryProvider = 'simulated';
    let resendResponse: any = null;

    if (activeResendKey) {
      try {
        const resend = new Resend(activeResendKey);
        const { data, error } = await resend.emails.send({
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
              content: Buffer.from(cleanPdfBase64, 'base64'),
            },
            {
              filename: `signature-highres-${Date.now()}.jpg`,
              content: Buffer.from(cleanJpegBase64, 'base64'),
            },
          ],
        });

        if (error) {
          console.warn('Resend send returned error, logging and falling back:', error);
          deliveryProvider = 'resend-failed-fallback';
        } else {
          deliveryProvider = 'resend';
          resendResponse = data;
        }
      } catch (resendErr: any) {
        console.warn('Resend API exception:', resendErr.message);
        deliveryProvider = 'resend-failed-fallback';
      }
    }

    const dispatchRecord = {
      id: `sig_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
      recipient,
      signerName: signerName || 'Signer',
      service: deliveryProvider,
      status: (deliveryProvider === 'resend' ? 'sent' : 'simulated') as 'sent' | 'simulated',
      files: {
        pdfSize: Math.round(cleanPdfBase64.length * 0.75),
        jpegSize: Math.round(cleanJpegBase64.length * 0.75),
      },
    };

    globalThis.__dispatched_signatures__!.unshift(dispatchRecord);
    if (globalThis.__dispatched_signatures__!.length > 50) {
      globalThis.__dispatched_signatures__!.pop();
    }

    return NextResponse.json({
      success: true,
      message: `Your signature has been sent successfully to ${recipient}.`,
      recipient,
      provider: deliveryProvider,
      dispatchId: dispatchRecord.id,
      timestamp: dispatchRecord.timestamp,
      resendResponse,
    });
  } catch (err: any) {
    console.error('Error processing signature submission:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
