import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Terms of Service — Ledger',
  description: 'Terms of service for Ledger, a personal budget tracking app.',
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-10">
      <h2 className="text-[15px] font-semibold text-[#1a1a1a] mb-3 tracking-[-0.2px]">{title}</h2>
      <div className="text-[14px] text-[#444] leading-[1.7] space-y-3">{children}</div>
    </section>
  );
}

export default function TermsPage() {
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
          Terms of Service
        </h1>
        <p className="text-[13px] text-[#888] mb-12">Last updated: June 1, 2026</p>

        <Section title="Acceptance of Terms">
          <p>
            By accessing or using Ledger, you agree to be bound by these Terms of Service. If you do not
            agree to these terms, please do not use the app.
          </p>
        </Section>

        <Section title="Description of Service">
          <p>
            Ledger is a personal budget tracking application that connects to your Google Sheets to help
            you record and review your finances. Ledger is provided free of charge for personal use.
          </p>
        </Section>

        <Section title="Google Account and Permissions">
          <p>
            Ledger requires you to sign in with a Google account. By doing so, you authorize Ledger to
            access your Google Sheets and Google Drive as described in our{' '}
            <Link href="/privacy" className="text-[#1a1a1a] underline underline-offset-2">
              Privacy Policy
            </Link>
            . You are responsible for maintaining the security of your Google account.
          </p>
          <p>
            You may revoke Ledger's access to your Google account at any time via{' '}
            <a
              href="https://myaccount.google.com/permissions"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#1a1a1a] underline underline-offset-2"
            >
              myaccount.google.com/permissions
            </a>
            .
          </p>
        </Section>

        <Section title="Your Data">
          <p>
            You retain full ownership of your data. Ledger does not store your financial data on any
            server — all data remains in your Google Sheets and is processed locally in your browser.
            See our{' '}
            <Link href="/privacy" className="text-[#1a1a1a] underline underline-offset-2">
              Privacy Policy
            </Link>{' '}
            for full details on how data is handled.
          </p>
        </Section>

        <Section title="Acceptable Use">
          <p>You agree not to:</p>
          <ul className="list-disc list-inside space-y-1 text-[#555]">
            <li>Use Ledger for any unlawful purpose or in violation of any applicable laws.</li>
            <li>Attempt to reverse-engineer, decompile, or tamper with the app.</li>
            <li>Use automated means to access or scrape the app.</li>
            <li>Interfere with or disrupt the integrity or performance of the service.</li>
          </ul>
        </Section>

        <Section title="Disclaimer of Warranties">
          <p>
            Ledger is provided <strong className="text-[#1a1a1a]">"as is"</strong> without warranties
            of any kind, express or implied. Ledger does not warrant that the service will be
            uninterrupted, error-free, or suitable for any particular purpose. You use Ledger at your
            own risk.
          </p>
          <p>
            Ledger is a personal tool and is not a substitute for professional financial advice.
          </p>
        </Section>

        <Section title="Limitation of Liability">
          <p>
            To the fullest extent permitted by law, Ledger and its developer shall not be liable for
            any indirect, incidental, special, or consequential damages arising from your use of or
            inability to use the service, including any loss of data.
          </p>
        </Section>

        <Section title="Changes to the Service">
          <p>
            Ledger may be updated, modified, or discontinued at any time without notice. Features may
            be added or removed at the developer's discretion.
          </p>
        </Section>

        <Section title="Changes to These Terms">
          <p>
            If these terms change materially, the "Last updated" date at the top of this page will be
            updated. Continued use of Ledger after any changes constitutes acceptance of the updated
            terms.
          </p>
        </Section>

        <Section title="Contact">
          <p>
            If you have any questions about these terms, please contact:{' '}
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
