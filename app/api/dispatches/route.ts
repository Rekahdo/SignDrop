import { NextResponse } from 'next/server';

export async function GET() {
  const dispatches = globalThis.__dispatched_signatures__ || [];
  return NextResponse.json({
    dispatches,
    configuredProviders: {
      hasResendEnvKey: !!(process.env.SIGNDROP_RESEND_API_KEY || process.env.RESEND_API_KEY),
    },
  });
}
