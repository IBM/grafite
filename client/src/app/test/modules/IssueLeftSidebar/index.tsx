import { InlineLoading } from '@carbon/react';
import { Menu, SidePanelCloseFilled } from '@carbon/react/icons';
import LabelledItem from '@components/LabelledItem';
import OperationalIdTag from '@components/OperationalIdTag';
import ShortIdTag from '@components/ShortIdTag';
import FeedbackModal from '@modules/FeedbackModal';
import { ViewTestDetailsModal } from '@modules/ViewDetailsModal/ViewTestDetailsModal';
import { Feedback, getDashboardFeedback } from '@utils/getFunctions/getDashboardFeedbacks';
import { Issue } from '@utils/getFunctions/getDashboardIssues';
import { getDashboardTest, Test } from '@utils/getFunctions/getDashboardTests';
import { MutableRefObject, useState } from 'react';

import { useTestDataContext } from '../TestDataContext';
import styles from './IssueLeftSidebar.module.scss';

interface Props {
  selectedIssue: Issue | undefined;
  isLoading: boolean;
  updatePromptWFeedback: MutableRefObject<((value: string) => void) | null>;
}

const IssueLeftSidebar = ({ updatePromptWFeedback, selectedIssue, isLoading }: Props) => {
  const { testInfo } = useTestDataContext();
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null);
  const [selectedTest, setSelectedTest] = useState<Test | null>(null);
  const [collapsed, setCollapsed] = useState<boolean>(false);

  const action = () => {
    if (updatePromptWFeedback?.current) updatePromptWFeedback.current(selectedFeedback?.modelInput || '');
  };

  const selectTest = (id: string) => {
    getDashboardTest(id).then((test) => setSelectedTest(test));
  };

  const selectFeedback = (id: string) => {
    getDashboardFeedback(id).then((feedback) => {
      setSelectedFeedback(feedback);
    });
  };

  return (
    <div className={`${styles.widthHolder} ${collapsed ? styles.collapsed : ''}`}>
      <section className={styles.wrapper}>
        {!isLoading ? (
          <>
            <div>
              <div className={styles.row}>
                <h3>Issue</h3>
                <button
                  onClick={() => {
                    setCollapsed((prev) => !prev);
                  }}
                  aria-label="toggle issue panel"
                >
                  {collapsed ? <Menu /> : <SidePanelCloseFilled />}
                </button>
              </div>
              {!selectedIssue ? (
                <></>
              ) : (
                <>
                  <div>{selectedIssue.title}</div>

                  {selectedIssue.description && (
                    <div className={styles.description}>
                      <label>Additional info / example</label>
                      <div>{selectedIssue.description}</div>
                    </div>
                  )}
                </>
              )}
            </div>
            <div className={styles.main}>
              <LabelledItem id="issue-sidebar-feedback" label="Connected feedback">
                <div className={styles.tags}>
                  {!!selectedIssue?.feedbackIds?.length ? (
                    selectedIssue.feedbackIds.map((id) => (
                      <OperationalIdTag
                        key={`selected-issue-feedback-tag-${id}`}
                        size="md"
                        id={id}
                        onClick={() => selectFeedback(id)}
                      />
                    ))
                  ) : (
                    <span className={styles.na}>No feedback connected</span>
                  )}
                </div>
              </LabelledItem>
              <LabelledItem id="issue-sidebar-test" label="Opened tests">
                <div className={styles.tags}>
                  {!!selectedIssue?.testIds?.length ? (
                    selectedIssue.testIds.map((id) => {
                      const isCurrent = testInfo.id === id;

                      return isCurrent ? (
                        <ShortIdTag key={`selected-issue-feedback-tag-${id}`} id={id} color="blue" />
                      ) : (
                        <OperationalIdTag
                          key={`selected-issue-feedback-tag-${id}`}
                          id={id}
                          onClick={() => selectTest(id)}
                        />
                      );
                    })
                  ) : (
                    <span className={styles.na}>No test opened</span>
                  )}
                </div>
              </LabelledItem>
            </div>
          </>
        ) : (
          <InlineLoading description="loading issue..." />
        )}
      </section>
      <FeedbackModal
        open={selectedFeedback !== null}
        close={() => {
          setSelectedFeedback(null);
        }}
        feedback={selectedFeedback}
        actionable
        action={action}
      />
      <ViewTestDetailsModal
        isModalOpen={selectedTest !== null}
        close={() => {
          setSelectedTest(null);
        }}
        test={selectedTest ? selectedTest : undefined}
      />
    </div>
  );
};

export default IssueLeftSidebar;
