import type { Metadata } from 'next';
import { getReleases } from '@/lib/releases';
import ChangelogClient from './ChangelogClient';

export const metadata: Metadata = {
  title: "What's new — Ledger",
  description: 'Product updates and fixes for Ledger.',
};

export default function ChangelogPage() {
  const releases = getReleases();

  return <ChangelogClient releases={releases} />;
}
