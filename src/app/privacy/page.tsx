import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Privacy Policy — Ledger',
  description: 'Privacy policy for Ledger, a personal budget tracking app.',
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-10">
      <h2 className="text-[15px] font-semibold text-[#1a1a1a] mb-3 tracking-[-0.2px]">{title}</h2>
      <div className="text-[14px] text-[#444] leading-[1.7] space-y-3">{children}</div>
    </section>
  );
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white text-[#1a1a1a]">
      <header className="flex justify-between items-center px-14 py-8 max-sm:px-[22px] max-sm:py-5 border-b border-[#f0f0f0]">
        <Link href="/" className="flex items-center gap-[10px] no-underline">
          <Image src="/ledger-A-512.png" alt="Ledger" width={22} height={22} className="rounded-full shrink-0" />
          <span className="text-[15px] font-semibold tracking-[-0.2px]">Ledger</span>
        </Link>
      </header>

      <main className="max-w-[680px] mx-auto px-14 py-16 max-sm:px-[22px] max-sm:py-10">
        <p className="text-[11px] text-[#888] uppercase tracking-[0.3px] mb-4">Legal</p>
        <h1
          className="font-semibold leading-[1.05] tracking-[-1.5px] mb-3"
          style={{ fontSize: 'clamp(32px, 5vw, 48px)' }}
        >
          Privacy Policy
        </h1>
        <p className="text-[13px] text-[#888] mb-12">Last updated: May 22, 2026</p>

        <Section title="Overview">
          <p>
            Ledger is a personal budget tracking application that connects to your Google Sheets to help
            you record and review your finances. This policy explains what data Ledger accesses, how it
            is used, and how it is protected.
          </p>
        </Section>

        <Section title="Data We Access">
          <p>When you sign in with Google, Ledger requests access to the following:</p>
          <ul className="list-none space-y-2 mt-2">
            {[
              ['Google account name and email address', 'To identify who is signed in and display your name in the app.'],
              ['Google Sheets (read and write)', 'To read your budget data from the sheet you select, and to write new transactions when you add them.'],
              ['Google Drive (read-only, file list)', 'To show you a list of your spreadsheets so you can choose which one to use. Ledger never reads the contents of any file other than the sheet you explicitly select.'],
            ].map(([label, desc]) => (
              <li key={label} className="pl-4 border-l-2 border-[#f0f0f0]">
                <span className="font-medium text-[#1a1a1a]">{label}</span>
                <br />
                <span className="text-[#666]">{desc}</span>
              </li>
            ))}
          </ul>
        </Section>

        <Section title="How Your Data Is Used">
          <p>
            Ledger uses your data solely to provide the budgeting features you see in the app. Specifically:
          </p>
          <ul className="list-disc list-inside space-y-1 text-[#555]">
            <li>Your name and email are displayed in the app UI only.</li>
            <li>Sheet data is read to display your transactions and budget summaries.</li>
            <li>New transactions you enter are written back to your chosen sheet.</li>
          </ul>
          <p>
            Ledger does <strong className="text-[#1a1a1a]">not</strong> sell, rent, share, or transfer
            your data to any third party for any purpose.
          </p>
        </Section>

        <Section title="Data Storage">
          <p>
            Ledger does not store your Google data on any server. All processing happens in your browser
            and directly against Google's APIs using your OAuth access token.
          </p>
          <p>
            Your access token is stored in your browser's <code className="bg-[#f5f5f5] px-1 rounded text-[13px]">localStorage</code> only,
            on your device. It expires automatically (typically within one hour) and is cleared when you
            log out.
          </p>
          <p>No sheet content, transaction records, or personal information ever leaves your browser to Ledger's servers.</p>
        </Section>

        <Section title="Data Retention and Deletion">
          <p>
            Because Ledger does not store your data server-side, there is nothing to delete. When you
            log out, your access token and profile information are immediately removed from your browser.
          </p>
          <p>
            To revoke Ledger's access to your Google account at any time, visit{' '}
            <a
              href="https://myaccount.google.com/permissions"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#1a1a1a] underline underline-offset-2"
            >
              myaccount.google.com/permissions
            </a>{' '}
            and remove Ledger from the list of connected apps.
          </p>
        </Section>

        <Section title="Google API Services">
          <p>
            Ledger's use and transfer of information received from Google APIs adheres to the{' '}
            <a
              href="https://developers.google.com/terms/api-services-user-data-policy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#1a1a1a] underline underline-offset-2"
            >
              Google API Services User Data Policy
            </a>
            , including the Limited Use requirements.
          </p>
        </Section>

        <Section title="Third-Party Services">
          <p>
            Ledger uses Google APIs (Google Sheets, Google Drive, Google Identity Services) to function.
            Your use of these services is also subject to{' '}
            <a
              href="https://policies.google.com/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#1a1a1a] underline underline-offset-2"
            >
              Google's Privacy Policy
            </a>
            . Ledger does not use any other third-party analytics, advertising, or tracking services.
          </p>
        </Section>

        <Section title="Changes to This Policy">
          <p>
            If this privacy policy changes materially, the "Last updated" date at the top of this page
            will be updated. Continued use of Ledger after any changes constitutes acceptance of the
            updated policy.
          </p>
        </Section>

        <Section title="Contact">
          <p>
            If you have any questions or concerns about this privacy policy or how Ledger handles your
            data, please contact:{' '}
            <a
              href="mailto:phuan516@mtroyal.ca"
              className="text-[#1a1a1a] underline underline-offset-2"
            >
              phuan516@mtroyal.ca
            </a>
          </p>
        </Section>
      </main>

      <footer className="border-t border-[#f0f0f0] px-14 py-6 max-sm:px-[22px]">
        <p className="text-[11px] text-[#888]">
          &copy; {new Date().getFullYear()} Ledger ·{' '}
          <Link href="/" className="text-[#888] underline underline-offset-2">
            Home
          </Link>
        </p>
      </footer>
    </div>
  );
}
