import { Button, InlineLoading, Layer, Search } from '@carbon/react';
import { Renew } from '@carbon/react/icons';
import ShortIdTag from '@components/ShortIdTag';
import TestStatusTag from '@components/TestStatusTag';
import { useToastMessageContext } from '@components/ToastMessageContext';
import { getDashboardIssue, type Issue } from '@utils/getFunctions/getDashboardIssues';
import { getDashboardTests, Test } from '@utils/getFunctions/getDashboardTests';
import { mapTestStatus } from '@utils/mapStatus';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { ChangeEvent, useCallback, useEffect, useRef, useState } from 'react';

import styles from './RightSidebar.module.scss';

export type TestWIssueTitle = Test & { issueTitle?: string | undefined };
const RightSidebar = ({ issueList }: { issueList?: Issue[] }) => {
  const router = useRouter();
  const { data } = useSession();
  const { addToastMsg } = useToastMessageContext();
  const tests = useRef<TestWIssueTitle[]>([]);
  const [filteredTests, setFilteredTests] = useState<TestWIssueTitle[]>([]); //displayed list
  const [testLoading, setTestLoading] = useState<boolean>(true);

  const fetchIssues = useCallback(async () => {
    if (!data?.user) return;

    const { email } = data?.user;

    setTestLoading(true);
    getDashboardTests()
      .then((t) => {
        const newTests: TestWIssueTitle[] = t.filter((test) => test.author === email);

        const promises = newTests.map((test) => {
          const issueId = test.issueId;
          if (!issueId) {
            test.issueTitle = undefined;
            return;
          }

          const foundIssue = issueList?.find((issue: Issue) => `${issue.id}` === issueId);
          if (foundIssue) {
            test.issueTitle = foundIssue.title;
            return;
          } //if not found from the retrieved issues, fetch the issue
          else
            return getDashboardIssue(issueId).then((issue) => {
              test.issueTitle = issue.title;
            });
        });
        return Promise.all(promises).then(() => {
          tests.current = [...newTests];
          setFilteredTests(() => [...newTests]);
        });
      })
      .catch((e) => {
        addToastMsg(e.status, e.message, 'Failed to retrieve my tests');
      })
      .finally(() => setTestLoading(false));
  }, [data?.user, issueList, addToastMsg]);

  const selectExistingTest = (id: string) => {
    router.push(`/test?id=${id}&prev=true`);
  };

  // search issue by title, approval status, status, and test ID, which are the values displayed on the UI
  const filterIssue = (e: ChangeEvent<HTMLInputElement>) => {
    const value = (e.target as HTMLInputElement).value?.toLowerCase();
    if (value) {
      setFilteredTests(() => [
        ...tests.current.filter((d) => {
          const { id, issueTitle } = d;
          const status = mapTestStatus(d);
          return (
            id?.toString().includes(value) ||
            status?.toLowerCase().includes(value) ||
            issueTitle?.toLowerCase().includes(value)
          );
        }),
      ]);
    } else {
      setFilteredTests(() => [...tests.current]);
    }
  };

  useEffect(() => {
    //fetch my issues only when the issues are ready to minimize the fetch calls
    if (!issueList) return;
    fetchIssues();
  }, [issueList, fetchIssues]);

  return (
    <aside className={styles.wrapper}>
      <div className={styles.header}>
        <h3>Opened tests</h3>
        <Button
          kind="ghost"
          hasIconOnly
          renderIcon={Renew}
          iconDescription="Refresh"
          tooltipAlignment="end"
          tooltipPosition="bottom"
          size="sm"
          onClick={fetchIssues}
        />
      </div>
      <Layer>
        <Search
          disabled={testLoading}
          autoComplete="off"
          isExpanded
          labelText="Search my issue"
          onChange={filterIssue}
          size="md"
          className={styles.search}
        />
      </Layer>
      <section className={styles.list}>
        {testLoading ? (
          <div style={{ paddingLeft: '1.5rem' }}>
            <InlineLoading description="Loading tests..." />
          </div>
        ) : (
          <>
            {!!tests.current?.length ? (
              <>
                {!!filteredTests?.length ? (
                  <>
                    {filteredTests.map((data) => {
                      const status = mapTestStatus(data);

                      return (
                        <button key={`my-test-${data.id}`} onClick={() => (data.id ? selectExistingTest(data.id) : '')}>
                          <div>
                            {data.issueTitle}
                            {data.issueTitle === undefined && (
                              <span className={`${styles.na} ${styles.noPadding}`}>No issue connected</span>
                            )}
                          </div>
                          <div className={styles.row}>
                            <span>
                              Test ID:&nbsp;
                              <ShortIdTag id={data.id?.toString()} size="sm" />
                            </span>
                            <TestStatusTag
                              status={status !== 'Draft' ? 'Ready for review' : 'Draft'}
                              isApproved={status === 'Approved'}
                            />
                          </div>
                        </button>
                      );
                    })}
                  </>
                ) : (
                  <span className={styles.na}>No test meet the criteria</span>
                )}
              </>
            ) : (
              <span className={styles.na}>You haven&apos;t opened any test yet</span>
            )}
          </>
        )}
      </section>
    </aside>
  );
};

export default RightSidebar;
