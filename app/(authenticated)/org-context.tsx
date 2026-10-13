'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Organization = {
  id: number;
  name: string;
  slug: string;
  kybStatus: string;
};

type OrgContextType = {
  orgs: Organization[];
  activeOrg: Organization | null;
  setActiveOrg: (org: Organization) => void;
  setOrgs: (orgs: Organization[]) => void;
};

const OrgContext = createContext<OrgContextType | undefined>(undefined);

export function OrgProvider({ children }: { children: ReactNode }) {
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [activeOrg, setActiveOrg] = useState<Organization | null>(null);

  useEffect(() => {
    if (orgs.length > 0 && !activeOrg) {
      setActiveOrg(orgs[0]);
    }
  }, [orgs, activeOrg]);

  return (
    <OrgContext.Provider value={{ orgs, activeOrg, setActiveOrg, setOrgs }}>
      {children}
    </OrgContext.Provider>
  );
}

export function useOrg() {
  const context = useContext(OrgContext);
  if (context === undefined) {
    throw new Error('useOrg must be used within an OrgProvider');
  }
  return context;
}
