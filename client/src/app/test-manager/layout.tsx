'use client';

import { TestContextProvider } from '@modules/TestContext';
import { ReportsContextProvider } from '@test-manager/ReportsContext';
import { ReactNode } from 'react';

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <TestContextProvider>
      <ReportsContextProvider>{children}</ReportsContextProvider>
    </TestContextProvider>
  );
}
