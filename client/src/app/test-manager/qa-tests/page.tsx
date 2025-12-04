'use client';

import { useIsAdmin } from '@hooks/permissionHooks';
import containerStyles from '@styles/sidenav-container.module.scss';

import TestModule from '../modules/TestModule';
import styles from './index.module.scss';

export default function Home() {
  const isAdmin = useIsAdmin();

  return (
    <section className={`${containerStyles.container}  ${containerStyles.innerContainer}`}>
      <div className={styles.header}>
        <h2>QA tests</h2>
        <p>
          QA tests have been created for LLM issues over time.
          {isAdmin && (
            <>
              <br />
              To generate a report for <span className={styles.strong}>approved</span> and{' '}
              <span className={styles.strong}>active</span> tests, use the &quot;Run tests&quot; button in the top right
              corner.
            </>
          )}
        </p>
      </div>
      <div className={styles.tableWrapper}>
        <TestModule />
      </div>
    </section>
  );
}
