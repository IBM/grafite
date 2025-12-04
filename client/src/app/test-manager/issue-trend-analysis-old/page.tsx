'use client';

import containerStyles from '@styles/sidenav-container.module.scss';

import styles from './index.module.scss';
import IssuesTable from './modules/IssuesTable';

export default function Home() {
  return (
    <section className={`${containerStyles.container}  ${containerStyles.innerContainer}`}>
      <div className={styles.header}>
        <h2>Issue trend analysis</h2>
        <p>Compare the test scores of a selected issue over test runs to analyze the model performance trend.</p>
      </div>
      <div className={styles.tableWrapper}>
        <IssuesTable />
      </div>
    </section>
  );
}
