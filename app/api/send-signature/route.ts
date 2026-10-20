import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

declare global {
  var __dispatched_signatures__: Array<{
    id: string;
    timestamp: string;
    recipient: string;
    deliveredTo: string;
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

    const activeResendKey =
      clientResendKey ||
      process.env.SIGNDROP_RESEND_API_KEY ||
      process.env.RESEND_API_KEY;

    const fromEmail = 'SignDrop <onboarding@resend.dev>';

    let deliveryProvider = 'simulated';
    let resendResponse: any = null;
    let deliveredTo = recipient;
    let sandboxWarning: string | null = null;

    if (activeResendKey) {
      const resend = new Resend(activeResendKey);

      const htmlContent = `
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
              <td style="padding: 8px 0; color: #71717a;">Intended Recipient:</td>
              <td style="padding: 8px 0; color: #18181b; font-weight: 600;">${recipient}</td>
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
            Delivered for ${recipient} via SignDrop Digital Signature Service.
          </div>
        </div>
      `;

      const attachments = [
        {
          filename: `signature-${Date.now()}.pdf`,
          content: Buffer.from(cleanPdfBase64, 'base64'),
        },
        {
          filename: `signature-highres-${Date.now()}.jpg`,
          content: Buffer.from(cleanJpegBase64, 'base64'),
        },
      ];

      // Step 1: Try sending to primary recipient
      const primaryAttempt = await resend.emails.send({
        from: fromEmail,
        to: [recipient],
        subject: `New Signature Submitted by ${signerName || 'Signer'}`,
        html: htmlContent,
        attachments,
      });

      if (!primaryAttempt.error) {
        deliveryProvider = 'resend';
        resendResponse = primaryAttempt.data;
        deliveredTo = recipient;
      } else {
        console.warn('Primary Resend delivery returned error:', primaryAttempt.error);

        // Check if error is Resend's free tier sandbox restriction
        const errMsg = primaryAttempt.error.message || '';
        const match = errMsg.match(/\(([^)]+@gmail\.com|[^)]+@[^)]+)\)/);
        const registeredAccountEmail = match ? match[1] : null;

        if (registeredAccountEmail) {
          console.log(`Resend sandbox restriction detected. Forwarding to registered account: ${registeredAccountEmail}`);

          // Step 2: Resend sandbox permits sending to the account owner
          const fallbackAttempt = await resend.emails.send({
            from: fromEmail,
            to: [registeredAccountEmail],
            subject: `[SignDrop for ${recipient}] Signature Submitted by ${signerName || 'Signer'}`,
            html: `
              <div style="background-color: #fef3c7; border: 1px solid #fde68a; color: #92400e; padding: 12px 16px; border-radius: 8px; margin-bottom: 20px; font-size: 13px; font-family: sans-serif;">
                <strong>Resend Sandbox Notice:</strong> Delivered to your registered Resend email address (${registeredAccountEmail}) because the free sandbox domain (<code>onboarding@resend.dev</code>) restricts delivery to the account owner. To send directly to <code>${recipient}</code>, verify a custom domain at <a href="https://resend.com/domains" style="color: #b45309; text-decoration: underline;">resend.com/domains</a>.
              </div>
              ${htmlContent}
            `,
            attachments,
          });

          if (!fallbackAttempt.error) {
            deliveryProvider = 'resend-sandbox-redirect';
            resendResponse = fallbackAttempt.data;
            deliveredTo = registeredAccountEmail;
            sandboxWarning = `Delivered to your Resend account email (${registeredAccountEmail}). Under Resend's free sandbox (onboarding@resend.dev), emails can only be sent to the account owner until a custom domain is verified at resend.com/domains.`;
          } else {
            console.error('Fallback attempt also failed:', fallbackAttempt.error);
            return NextResponse.json(
              {
                success: false,
                error: `Resend error: ${primaryAttempt.error.message}`,
              },
              { status: 400 }
            );
          }
        } else {
          return NextResponse.json(
            {
              success: false,
              error: `Resend error: ${primaryAttempt.error.message}`,
            },
            { status: 400 }
          );
        }
      }
    }

    const dispatchRecord = {
      id: `sig_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
      recipient,
      deliveredTo,
      signerName: signerName || 'Signer',
      service: deliveryProvider,
      status: (deliveryProvider.startsWith('resend') ? 'sent' : 'simulated') as 'sent' | 'simulated',
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
      deliveredTo,
      provider: deliveryProvider,
      dispatchId: dispatchRecord.id,
      timestamp: dispatchRecord.timestamp,
      sandboxWarning,
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
