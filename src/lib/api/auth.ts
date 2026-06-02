import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { SheetsService } from '@/lib/google/sheets';
import { google } from 'googleapis';

export async function buildSheetsService(): Promise<{ service: SheetsService } | { error: NextResponse }> {
  const session = await getServerSession(authOptions);
  if (!session?.accessToken || session.error) return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({ access_token: session.accessToken });
  return { service: new SheetsService(oauth2Client) };
}
