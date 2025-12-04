'use client';

import { useState } from 'react';
import styles from './index.module.scss';
import containerStyles from '@styles/sidenav-container.module.scss';
import RightSidebar from '@components/RightSidebar';
import HomeActions from '@modules/HomeActions';
import IssueDetail from '@modules/IssueDetail';
import { type Issue } from '@utils/getFunctions/getDashboardIssues';

export default function Home() {
  const [issueList, setIssueList] = useState<Issue[] | undefined>(undefined);

  const addIssues = (issueList: Issue[]) => {
    setIssueList(() => [...issueList]);
  };

  return (
    <div className={`${styles.wrapper} ${containerStyles.container}`}>
      <section className={styles.main}>
        <div className={styles.titleArea}>
          <h2>My QA tests</h2>
          <p>Your QA test workspace</p>
          <HomeActions issueList={issueList} addIssues={addIssues} />
        </div>
        <IssueDetail />
      </section>
      <RightSidebar issueList={issueList} />
    </div>
  );
}
