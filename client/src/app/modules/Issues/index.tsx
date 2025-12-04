'use client';

import { useIsMaintainer } from '@hooks/permissionHooks';
import AdminAnalytics from '@modules/AdminAnalytics';
import { FeedbackContextProvider } from '@modules/FeedbacksContext';
import { IssuesTable } from '@modules/IssuesTable/IssuesTable';
import { TestContextProvider } from '@modules/TestContext';
import { IssuePassRate } from '@modules/utils';
import styles from '@styles/index.module.scss';
import containerStyles from '@styles/sidenav-container.module.scss';
import { ReportsContextProvider } from '@test-manager/ReportsContext';
import { useState } from 'react';

const Issues = () => {
  const [issuePassRates, _setIssuePassRates] = useState<IssuePassRate[]>([]);
  const [selectedReportsMetadata, _setSelectedReportsMetadata] = useState<{ runId: string; modelId: string }[]>([]);
  const isMaintainer = useIsMaintainer();

  const setIssuePassRates = (issuePassRates: IssuePassRate[]) => {
    _setIssuePassRates(issuePassRates);
  };
  const setSelectedReportsMetadata = (reports: { runId: string; modelId: string }[]) => {
    _setSelectedReportsMetadata(reports);
  };

  return (
    <section className={`${containerStyles.container}  ${containerStyles.innerContainer}`}>
      <div className={styles.header}>
        <h2>Issues</h2>
        <p>Reported issues of LLMs over time</p>
      </div>
      <div className={styles.tableWrapper}>
        <TestContextProvider>
          <FeedbackContextProvider>
            <IssuesTable issuePassRates={issuePassRates} selectedReportsMetadata={selectedReportsMetadata} />
          </FeedbackContextProvider>
        </TestContextProvider>
      </div>
      {isMaintainer && (
        <ReportsContextProvider>
          <AdminAnalytics
            setIssuePassRates={setIssuePassRates}
            issuePassRates={issuePassRates}
            setSelectedReportsMetadata={setSelectedReportsMetadata}
          />
        </ReportsContextProvider>
      )}
    </section>
  );
};

export default Issues;
