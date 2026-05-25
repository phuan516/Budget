import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

export async function POST(req: NextRequest) {
  const { name, email, note } = await req.json();

  if (!name || typeof name !== 'string' || !name.trim()) {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 });
  }
  if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Valid email is required' }, { status: 400 });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!apiKey || !adminEmail) {
    return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });
  }

  const resend = new Resend(apiKey);
  const timestamp = new Date().toLocaleString('en-US', { timeZone: 'America/New_York' });

  const { error } = await resend.emails.send({
    from: 'Ledger <onboarding@resend.dev>',
    to: adminEmail,
    subject: `Access Request — ${name.trim()}`,
    text: [
      `Access request received at ${timestamp}`,
      '',
      `Name:  ${name.trim()}`,
      `Email: ${email.trim()}`,
      note?.trim() ? `Note:  ${note.trim()}` : '',
      '',
      'To grant access, add this email as a test user in GCP:',
      'https://console.cloud.google.com/apis/credentials/consent',
    ].filter(Boolean).join('\n'),
  });

  if (error) {
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
