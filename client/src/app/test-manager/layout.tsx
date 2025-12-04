'use client';

import { TestContextProvider } from '@modules/TestContext';
import { ReportsContextProvider } from '@test-manager/ReportsContext';
import { ReactElement } from 'react';

export default function Layout({ children }: { children: ReactElement }) {
  return (
    <TestContextProvider>
      <ReportsContextProvider>{children}</ReportsContextProvider>
    </TestContextProvider>
  );
}
