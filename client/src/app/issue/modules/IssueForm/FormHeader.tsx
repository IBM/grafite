import { TriageStatus } from '@api/dashboard/issues/utils';
import { ActionableNotification, Button, InlineLoading, Tag } from '@carbon/react';
import { ArrowLeft } from '@carbon/react/icons';
import { DiscardConfirmation } from '@components/DiscardConfirmation';
import { type Issue } from '@utils/getFunctions/getDashboardIssues';
import shortenID from '@utils/shortenID';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';

import styles from './IssueForm.module.scss';
import { tagColorMap } from './utils';

type Props = {
  issue: Issue | null;
  status: TriageStatus;
  loading: boolean;
  toastOpen: boolean;
  save: () => void;
  updateStatus: (status: TriageStatus) => void;
  closeToast: () => void;
  initiateIssueCopy: () => void;
  disableSave: boolean;
};

const FormHeader = ({
  issue,
  status,
  loading,
  toastOpen,
  save,
  updateStatus,
  closeToast,
  initiateIssueCopy,
  disableSave,
}: Props) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const prev = searchParams.get('prev');

  const [discardModalOpen, setDiscardModalOpen] = useState<boolean>(false);
  return (
    <>
      <header className={styles.header}>
        <div className={styles.titleWrapper}>
          {prev && (
            <button className={styles.breadcrumb} onClick={() => router.back()} aria-label="go back">
              <ArrowLeft />
              Back
            </button>
          )}
          <h3>{issue?.id ? `Edit issue: ${shortenID(issue.id)}` : 'Create new issue'}</h3>
          <div>
            <Tag type={tagColorMap[status]} size="sm">
              {status}
            </Tag>
            {status === TriageStatus.READY_FOR_REVIEW && (
              <Button
                kind="ghost"
                size="sm"
                onClick={() => {
                  updateStatus(TriageStatus.DRAFT);
                }}
              >
                Revert to draft
              </Button>
            )}
          </div>
        </div>
        <div className={styles.actions}>
          <Button kind="secondary" size="md" onClick={() => setDiscardModalOpen(true)}>
            Discard
          </Button>
          {loading ? (
            <InlineLoading description="Saving..." />
          ) : disableSave ? (
            <InlineLoading description="Initializing..." />
          ) : (
            <Button disabled={disableSave} onClick={save} size="md">
              Save
            </Button>
          )}
        </div>
        {toastOpen && (
          <div className={styles.notification}>
            <ActionableNotification
              title="Successfully saved issue"
              kind="success"
              subtitle={`Successfully saved the issue. Is this issue ready for review?`}
              lowContrast
              aria-label="Change test status"
              actionButtonLabel="Mark as ready"
              onActionButtonClick={() => updateStatus(TriageStatus.READY_FOR_REVIEW)}
              onCloseButtonClick={closeToast}
            />
          </div>
        )}
      </header>
      <DiscardConfirmation
        open={discardModalOpen}
        close={() => {
          setDiscardModalOpen(false);
        }}
        submit={() => {
          initiateIssueCopy();
          setDiscardModalOpen(false);
        }}
      />
    </>
  );
};

export default FormHeader;
