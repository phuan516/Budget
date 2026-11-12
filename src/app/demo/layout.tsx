// Demo dates are relative to today, so a build-time snapshot would go stale.
export const dynamic = 'force-dynamic';

export default function DemoLayout({ children }: { children: React.ReactNode }) {
  return children;
}
