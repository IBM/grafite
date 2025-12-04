import { Fragment, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './IssueDetail.module.scss';
import { Button, Loading, Tag } from '@carbon/react';
import { ArrowRight, Radar } from '@carbon/react/icons';

import FeedbackModal from '@modules/FeedbackModal';
import { useSelectedIssueContext, Validator } from '@components/SelectedIssueContext';
import LabelledItem from '@components/LabelledItem';
import ValidatorTile from '@components/ValidatorTile';
import OperationalIdTag from '@components/OperationalIdTag';
import { type Test } from '@utils/getFunctions/getDashboardTests';
import { ViewTestDetailsModal } from '@modules/ViewDetailsModal/ViewTestDetailsModal';
import { Feedback, getDashboardFeedback } from '@utils/getFunctions/getDashboardFeedbacks';
import { useIssuesContext } from '@modules/IssuesContext';
import { getConnectedTests, getValidatorsFromIssue } from '@test/utils';

const IssueDetail = () => {
  const router = useRouter();
  const { selectedIssueId } = useSelectedIssueContext();
  const { issues } = useIssuesContext();
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null);
  const [selectedTest, setSelectedTest] = useState<Test | null>(null);
  const [pageLoading, setPageLoading] = useState<boolean>(false);
  const [openedTests, setOpenedTests] = useState<Test[]>([]);

  const selectedIssue = useMemo(() => {
    setPageLoading(true);
    const issue = issues?.find((d) => d.id === selectedIssueId);
    if (!issue) setPageLoading(false);

    return issue;
  }, [issues, selectedIssueId]);

  useEffect(() => {
    if (!selectedIssue) {
      setOpenedTests([]);
      return;
    }
    (async () => {
      const tests = await getConnectedTests(selectedIssue);
      setOpenedTests(tests);
    })();
  }, [selectedIssue]);

  const validators: Validator[] = useMemo(() => {
    const validators: Validator[] = getValidatorsFromIssue(openedTests);
    setPageLoading(false);
    return validators;
  }, [openedTests]);

  const selectTest = (id: string) => {
    const targetTest = openedTests?.find((d) => d.id === id);
    setSelectedTest(targetTest ? targetTest : null);
  };

  const selectFeedback = (id: string) => {
    getDashboardFeedback(id).then((feedback) => {
      setSelectedFeedback(feedback);
    });
  };

  return (
    <>
      <section className={styles.wrapper}>
        {pageLoading ? (
          <>
            <Loading withOverlay={true} />
          </>
        ) : !selectedIssue ? (
          <></>
        ) : (
          <>
            <div className={styles.header}>
              <div>{selectedIssue.title}</div>
              <Button
                renderIcon={ArrowRight}
                iconDescription="Create test"
                onClick={() => router.push('/test?prev=true')}
              >
                Create test
              </Button>
            </div>
            <div className={styles.content}>
              <div>
                <div className={styles.title}>
                  <Radar />
                  <span>Validator settings</span>
                </div>
                <div className={styles.validatorWrapper}>
                  {!!validators.length ? (
                    <>
                      {validators.map((validator, i) => (
                        <Fragment key={`validator_${i}`}>
                          <ValidatorTile validator={validator} index={i} selectTest={selectTest} />
                        </Fragment>
                      ))}
                    </>
                  ) : (
                    <span className={styles.na}>No judge setting created</span>
                  )}
                </div>
              </div>
              <div>
                <LabelledItem id="test-tags" label="Tags">
                  <div className={styles.row}>
                    {!!selectedIssue.tags?.length ? (
                      selectedIssue.tags.map((tag) => (
                        <Tag type="cool-gray" size="sm" key={`test_${tag.replace(' ', '')}`}>
                          {tag}
                        </Tag>
                      ))
                    ) : (
                      <span className={styles.na}>No tag added</span>
                    )}
                  </div>
                </LabelledItem>

                <LabelledItem id="opened-test-label" label="Opened tests">
                  <div className={styles.row}>
                    {!!openedTests.length ? (
                      openedTests.map((test) => (
                        <OperationalIdTag
                          id={test.id}
                          size="sm"
                          key={`test_${test.id}`}
                          onClick={() => setSelectedTest(test)}
                        />
                      ))
                    ) : (
                      <span className={styles.na}>No test opened</span>
                    )}
                  </div>
                </LabelledItem>

                <LabelledItem id="connected-feedback-label" label="Connected feedbacks">
                  <div className={styles.row}>
                    {!!selectedIssue.feedbackIds?.length ? (
                      selectedIssue.feedbackIds.map((id) => (
                        <OperationalIdTag size="sm" id={id} key={`feedback_${id}`} onClick={() => selectFeedback(id)} />
                      ))
                    ) : (
                      <span className={styles.na}>No feedback connected</span>
                    )}
                  </div>
                </LabelledItem>
              </div>
            </div>
          </>
        )}
      </section>
      <FeedbackModal
        open={selectedFeedback !== null}
        close={() => {
          setSelectedFeedback(null);
        }}
        feedback={selectedFeedback}
      />
      <ViewTestDetailsModal
        isModalOpen={selectedTest !== null}
        close={() => {
          setSelectedTest(null);
        }}
        test={selectedTest ? selectedTest : undefined}
      />
    </>
  );
};

export default IssueDetail;
