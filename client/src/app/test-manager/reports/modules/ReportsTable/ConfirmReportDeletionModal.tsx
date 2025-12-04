import { Dispatch, SetStateAction } from 'react';
import { createPortal } from 'react-dom';
import { Modal } from '@carbon/react';

import { deleteReport } from '@utils/deleteFunctions/deleteReport';
import { useToastMessageContext } from '@components/ToastMessageContext';
import { useReportsContext } from '@test-manager/ReportsContext';
import { deleteReportResults } from '@utils/deleteFunctions/deleteReportResults';
import { APICallError } from '@types';

type ConfirmReportDeletionModalProps = {
  setDeletingIds: Dispatch<SetStateAction<string[]>>;
  runId: string | null;
  setRunId: Dispatch<SetStateAction<string | null>>;
};

export const ConfirmReportDeletionModal = ({ setRunId, setDeletingIds, runId }: ConfirmReportDeletionModalProps) => {
  const { fetchReports } = useReportsContext();
  const { addToastMsg } = useToastMessageContext();

  const handleReportDelete = (runId: string) => {
    setDeletingIds((prev) => [...prev, runId]);

    deleteReport(runId)
      .then(async () => {
        addToastMsg(200, 'Successfully deleted the report', 'Deleted report');

        try {
          const status = await deleteReportResults(runId);

          if (status === 204) {
            addToastMsg(200, 'Successfully deleted the report results', 'Deleted report results');
          }
        } catch (error) {
          if (error instanceof APICallError) {
            if (error.status !== 404) {
              addToastMsg('error', error.message, 'Failed to delete the report results');
            }
          }
        }
      })
      .catch((e: Error) => {
        addToastMsg('error', e.message, 'Failed to delete the report');
      })
      .finally(() => {
        fetchReports();
        setDeletingIds((prev) => prev.filter((d) => d !== runId));
      });
  };

  return (
    <>
      {typeof window !== 'undefined' &&
        typeof document !== 'undefined' &&
        createPortal(
          <Modal
            modalHeading="Delete report"
            primaryButtonText="Delete"
            danger
            secondaryButtonText="Cancel"
            onSecondarySubmit={() => setRunId(null)}
            size="sm"
            onRequestSubmit={() => {
              if (runId !== null) {
                handleReportDelete(runId);
                setRunId(null);
              }
            }}
            open={runId !== null}
            onRequestClose={() => setRunId(null)}
          >
            <div>Are you sure you want to delete the report?</div>
          </Modal>,
          document.body,
        )}
    </>
  );
};
