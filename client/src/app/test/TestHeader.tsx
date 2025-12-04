import { ActionableNotification, Button, InlineLoading } from '@carbon/react';
import { ArrowLeft } from '@carbon/react/icons';
import { DiscardConfirmation } from '@components/DiscardConfirmation';
import { useSelectedIssueContext } from '@components/SelectedIssueContext';
import TestStatusTag from '@components/TestStatusTag';
import { useToastMessageContext } from '@components/ToastMessageContext';
import { useIssuesContext } from '@modules/IssuesContext';
import { getDashboardTest } from '@utils/getFunctions/getDashboardTests';
import { TestStatus } from '@utils/keyMappings';
import { patchDashboardIssue } from '@utils/patchFunctions/patchDashboardIssue';
import { patchDashboardTest } from '@utils/patchFunctions/patchDashboardTest';
import { postDashboardTest } from '@utils/postFunctions/postDashboardTest';
import { putDashboardTest } from '@utils/putFunctions/putDashboardTest';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useState } from 'react';

import { useTestDataContext } from './modules/TestDataContext';
import styles from './new-test.module.scss';
import { mapClientToServerSchema } from './utils';

const TestHeader = ({
  setRenderTrigger,
  initiate,
  disabled,
}: {
  setRenderTrigger: (status: boolean) => void;
  initiate?: (status: boolean) => void;
  disabled?: boolean;
}) => {
  const { data } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  const prev = searchParams.get('prev');

  const { addToastMsg } = useToastMessageContext();
  const { testInfo, updateTest, discardEdits } = useTestDataContext();
  const { fetchIssues, issues } = useIssuesContext();
  const { selectedIssueId } = useSelectedIssueContext();
  const [actionableToast, setActionableToast] = useState<boolean>(false);
  const [saveLoading, setSaveLoading] = useState<boolean>(false);
  const [modalOpen, setModalOpen] = useState<boolean>(false);

  const validateReviewReady = () => {
    const judgeInfo = testInfo.validators?.[0]?.parameters;

    const missingItems = [];
    if (!testInfo.prompt && !testInfo.messages?.length) missingItems.push('prompt text');
    if (!testInfo.sampleOutput) missingItems.push('model response');
    if (!judgeInfo?.judgeType) missingItems.push('judge prompt content type');
    if (!judgeInfo?.judgeGuidelines) missingItems.push('judge guidelines');
    return missingItems;
  };

  const save = async () => {
    const committer = data?.user;
    setSaveLoading(true);

    try {
      const newTest = mapClientToServerSchema(testInfo, selectedIssueId ?? '', committer?.email ?? '');

      const finishActs = () => {
        const isReady = validateReviewReady();
        const isDraft = !testInfo.readyForReview;

        if (!!isReady.length)
          addToastMsg(200, `Add ${isReady.join(', ')} to mark it as ready for review.`, 'Saved the changes');
        else if (isDraft) setActionableToast(true);
        else addToastMsg(200, 'Successfully saved the changes', 'Saved the changes');
      };

      if (testInfo.id) {
        getDashboardTest(testInfo.id)
          .then((test) => {
            if (test.id) {
              return putDashboardTest(test.id, newTest);
            } else throw Error('Cannot find the test from the database');
          })
          .then(() => finishActs())
          .catch((err) => addToastMsg(err.status || '404', err.message, 'Failed to save'))
          .finally(() => setSaveLoading(false));
      } else {
        setRenderTrigger(true); //updating the right sidebar's test ID

        const targetIssue = issues?.find((issue) => issue.id === selectedIssueId);
        postDashboardTest(newTest)
          .then((id) => {
            updateTest('id', id);
            return patchDashboardIssue(newTest.issue_id, {
              key: 'test_ids',
              value: [...(targetIssue?.testIds ?? []), id],
            });
          })
          .then((_res) => {
            fetchIssues(); //fetch issue to update the left sidebar
            finishActs();
            router.replace(`/test?id=${testInfo.id}${prev ? '&prev=true' : ''}`, { scroll: false });
          })
          .catch((err) => addToastMsg(err.status, err.message, 'Failed to save'))
          .finally(() => {
            setSaveLoading(false);
            setRenderTrigger(false);
          });
      }
    } catch (e) {
      setSaveLoading(false);
      addToastMsg('error', 'Please try again', `${e}`);
    }
  };

  const changeStatus = async (isReady: boolean) => {
    const unknownErr = () =>
      addToastMsg('error', 'Unknown error occured. Record is missing.', 'Failed to change the status');

    if (!testInfo.id) return unknownErr();

    setSaveLoading(true);

    patchDashboardTest(testInfo.id || '', { key: 'triage.ready_for_review', value: isReady })
      .then(() => {
        updateTest('readyForReview', isReady);
        addToastMsg(200, 'Successfully saved the changes', 'Saved the changes');
      })
      .catch((err) => addToastMsg(err.status, err.message, 'Failed to save'))
      .finally(() => setSaveLoading(false));

    if (!isReady) {
      patchDashboardTest(testInfo.id || '', { key: 'triage.approved', value: false }).catch((err) =>
        addToastMsg(err.status, err.message, 'Failed to save'),
      );
      testInfo.approved = false;
    }
  };

  return (
    <section className={styles.heading}>
      <div className={styles.titleArea}>
        {prev && (
          <button className={styles.breadcrumb} onClick={() => router.back()} aria-label="go back">
            <ArrowLeft />
            Back
          </button>
        )}
        <h2>{id === null ? 'Create new test' : 'Edit test'}</h2>
        <div>
          <TestStatusTag
            status={testInfo.readyForReview ? TestStatus.readyForReview : TestStatus.draft}
            isApproved={testInfo.approved}
          />
          {testInfo.readyForReview && (
            <Button kind="ghost" size="sm" onClick={() => changeStatus(false)}>
              Revert to draft
            </Button>
          )}
        </div>
      </div>
      <div className={styles.actions}>
        {saveLoading ? (
          <div className={styles.loadingBox}>
            <InlineLoading description="Saving..." />
          </div>
        ) : (
          <Button size="md" onClick={save} disabled={disabled}>
            Save
          </Button>
        )}
        <Button
          kind="secondary"
          size="md"
          onClick={() => {
            setModalOpen(true);
          }}
          disabled={disabled || saveLoading}
        >
          Discard
        </Button>
      </div>
      {actionableToast && (
        <div className={styles.notification}>
          <ActionableNotification
            title="Successfully saved test"
            kind="success"
            subtitle="Successfully saved the test. Is the test ready for review?"
            lowContrast
            aria-label="Change test status"
            actionButtonLabel="Mark as ready"
            onActionButtonClick={() => {
              changeStatus(true);
              setActionableToast(false);
            }}
            onCloseButtonClick={() => setActionableToast(false)}
          />
        </div>
      )}
      <DiscardConfirmation
        open={modalOpen}
        close={() => {
          setModalOpen(false);
        }}
        submit={() => {
          initiate?.(false);
          discardEdits();
          setModalOpen(false);
        }}
      />
    </section>
  );
};

export default TestHeader;
