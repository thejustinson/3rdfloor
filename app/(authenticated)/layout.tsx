import AppShell from './AppShell';
import { OrgProvider } from './org-context';

export const instant = false;

export default function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  return (
    <OrgProvider>
      <AppShell>{children}</AppShell>
    </OrgProvider>
  );
}
