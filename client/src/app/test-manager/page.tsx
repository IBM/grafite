'use client';
import { Button } from '@carbon/react';
import { ArrowRight } from '@carbon/react/icons';
import containerStyles from '@styles/sidenav-container.module.scss';
import { useRouter } from 'next/navigation';

import styles from './index.module.scss';
import TestModule from './modules/TestModule';
import ReportsTable from './reports/modules/ReportsTable';

export default function Home() {
  const router = useRouter();
  const openPage = (url: string) => {
    router.push(`/test-manager/${url}`);
  };

  return (
    <section className={`${styles.container} ${containerStyles.container}  ${containerStyles.innerContainer}`}>
      <h2>Admin Page</h2>

      <section>
        <div className={styles.header}>
          <h3>QA tests pending review</h3>
          <Button
            onClick={() => {
              openPage('qa-tests');
            }}
            kind="ghost"
            size="md"
            renderIcon={ArrowRight}
          >
            View all tests
          </Button>
        </div>
        <div className={styles.tableWrapper}>
          <TestModule filterPending />
        </div>
      </section>

      <section>
        <div className={styles.header}>
          <h3>Recent reports</h3>
          <Button
            onClick={() => {
              openPage('reports');
            }}
            kind="ghost"
            size="md"
            renderIcon={ArrowRight}
          >
            View all reports
          </Button>
        </div>
        <div className={styles.tableWrapper}>
          <ReportsTable showOnlyFive />
        </div>
      </section>
    </section>
  );
}
