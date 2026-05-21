import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useSidebarStore } from '../../stores/sidebar.store';
import { cn } from '../../lib/utils';
import { RealtimeBridge } from '../RealtimeBridge';
import { useCompanyBrandingStore } from '../../stores/company-branding.store';

export function AppShell() {
  const { isCollapsed } = useSidebarStore();
  const loadBranding = useCompanyBrandingStore((s) => s.load);

  useEffect(() => {
    void loadBranding();
  }, [loadBranding]);

  return (
    <div className="min-h-screen bg-background">
      <RealtimeBridge />
      <Sidebar />
      <Header />
      <main
        className={cn(
          'pt-16 transition-all duration-300',
          isCollapsed ? 'pl-16' : 'pl-64'
        )}
      >
        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
