import React, { useState } from 'react';
import { AppShell, DashboardMode } from '@/components/app-shell';
import { Dashboard } from '@/components/dashboard';
import { VisualBuilder } from "@/components/visual-builder";
import { ErrorBoundary } from '@/src/ErrorBoundary';
import { LaunchMode } from '@/components/launch-mode';
import { GrowthMode } from '@/components/growth-mode';
import type { SiteRecord } from '@/components/ui/onboarding-wizard';

interface EfferdDashboard2Props {
  onLogout?: () => void;
  site: SiteRecord;
  onUpdateSite?: (site: SiteRecord) => void;
}

export function EfferdDashboard2({ onLogout, site, onUpdateSite }: EfferdDashboard2Props) {
  const [activeTab, setActiveTab] = useState<string>('launch');
  const initialMode = (site.theme?.mode as DashboardMode) || 'business';
  const [dashboardMode] = useState<DashboardMode>(initialMode);

  // If the active tab is 'builder' (Website Builder), render the full screen website builder workspace
  if (activeTab === 'builder') {
    return (
      <ErrorBoundary>
        <VisualBuilder
          site={site}
          onUpdateSite={onUpdateSite}
          onNavigateModule={setActiveTab}
          onExit={() => {
            // Instead of logging out, return back to the main dashboard workspace Command Center
            setActiveTab('home');
          }}
        />
      </ErrorBoundary>
    );
  }

  if (activeTab === 'launch') {
    return (
      <AppShell activeTab={activeTab} setActiveTab={setActiveTab} dashboardMode={dashboardMode} onLogout={onLogout} site={site}>
        <LaunchMode
          site={site}
          onUpdateSite={onUpdateSite}
          onOpenStudio={() => setActiveTab('builder')}
          onNavigate={setActiveTab}
        />
      </AppShell>
    );
  }

  if (activeTab === 'growth') {
    return (
      <AppShell activeTab={activeTab} setActiveTab={setActiveTab} dashboardMode={dashboardMode} onLogout={onLogout} site={site}>
        <GrowthMode site={site} onNavigate={setActiveTab} />
      </AppShell>
    );
  }

  // Otherwise, wrap the active page inside our premium AppShell navigation
  return (
    <AppShell 
      activeTab={activeTab} 
      setActiveTab={setActiveTab} 
      dashboardMode={dashboardMode}
      onLogout={onLogout}
      site={site}
    >
      <Dashboard
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        dashboardMode={dashboardMode}
        site={site}
      />
    </AppShell>
  );
}

export default EfferdDashboard2;

