'use client';

import { useMemo } from 'react';
import { useParams } from 'next/navigation';
import { Link } from '@carbon/react';
import { ArrowLeft } from '@carbon/react/icons';

import containerStyles from '@styles/sidenav-container.module.scss';

import styles from './index.module.scss';
import { useIssuesContext } from '@modules/IssuesContext';
import { useTestContext } from '@modules/TestContext';
import TrendGrid from '../modules/TrendGrid';

export default function ReportResultsPage() {
  const params = useParams();
  const { issues } = useIssuesContext();
  const { tests } = useTestContext();
  const { id } = params;

  const targetIssue = useMemo(() => {
    return issues?.find((d) => d.id === id);
  }, [issues]);

  const targetTests = useMemo(() => {
    if (!targetIssue) return [];
    return tests?.filter((d) => d.issueId === targetIssue.id);
  }, [tests, targetIssue]);

  return (
    <>
      {targetIssue && (
        <section className={`${containerStyles.container}  ${containerStyles.innerContainer} ${styles.root}`}>
          <div className={styles.header}>
            <div className={styles.runInfo}>
              <Link className={styles.link} href="/test-manager/issue-trend-analysis-old">
                <ArrowLeft /> Back to Issue trend dashboard
              </Link>
              <h2>
                Issue: <span>{targetIssue.title}</span>
              </h2>
            </div>
          </div>
          <div className={styles.gridWrapper}>
            <TrendGrid tests={targetTests} />
          </div>
        </section>
      )}
    </>
  );
}
