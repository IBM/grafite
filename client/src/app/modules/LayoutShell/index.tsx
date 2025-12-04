'use client';

import { SessionProvider } from 'next-auth/react';
import SelectedIssueContextProvider from '@components/SelectedIssueContext';
import ShellHeader from '@components/ShellHeader';
import ThemePreference from '@components/ThemePreference';
import ToastMessageContextProvider from '@components/ToastMessageContext';
import { Session } from 'next-auth';
import WxModelContextProvider from '@components/WxModelContext';
import { IssuesContextProvider } from '@modules/IssuesContext';

/*
 * Wrapper element for context providers
 * TODO: review WxModelContextProvider position once the flow design is done
 */

const LayoutShell = ({ session, children }: { session: Session | null; children: React.ReactNode }) => {
  return (
    <SessionProvider
      // "refetchInterval" set to session maxAge + 1 second to ensure that when the refetch happens, the session will have expired.
      refetchInterval={Number(process.env.NEXT_PUBLIC_SESSION_MAXAGE) + 1}
      session={session}
    >
      <ThemePreference>
        <IssuesContextProvider>
          <SelectedIssueContextProvider>
            <main>
              <ShellHeader />
              <ToastMessageContextProvider>
                <WxModelContextProvider>
                  <>{children}</>
                </WxModelContextProvider>
              </ToastMessageContextProvider>
            </main>
          </SelectedIssueContextProvider>
        </IssuesContextProvider>
      </ThemePreference>
    </SessionProvider>
  );
};

export default LayoutShell;
