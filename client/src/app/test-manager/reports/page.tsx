'use client';

import containerStyles from '@styles/sidenav-container.module.scss';
import { useReportsContext } from '@test-manager/ReportsContext';
import { useEffect } from 'react';

import styles from './index.module.scss';
import { ReportsTable } from './modules/ReportsTable/ReportsTable';

export default function ReportsPage() {
  const { fetchReports } = useReportsContext();

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  return (
    <section className={`${containerStyles.container}  ${containerStyles.innerContainer}`}>
      <div className={styles.header}>
        <h2>Test reports</h2>
        <p>Below is the list of the reports generated from the test running.</p>
      </div>
      <div className={styles.tableWrapper}>
        <ReportsTable />
      </div>
    </section>
  );
}
