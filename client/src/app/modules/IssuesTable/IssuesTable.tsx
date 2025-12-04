'use client';

import { DataTableSkeleton, InlineLoading, Loading } from '@carbon/react';
import { useSelectedIssueContext } from '@components/SelectedIssueContext';
import { useToastMessageContext } from '@components/ToastMessageContext';
import DetailsModal from '@modules/DetailsModal';
import { IssuePassRate, TestRunResult } from '@modules/utils';
import { APICallError } from '@types';
import { getEditActionToast } from '@utils/ag-grid/getEditActionToast';
import { carbonTheme, gridOptions } from '@utils/ag-grid/gridOptions';
import { OnStatusChangeParams } from '@utils/ag-grid/StatusCellEditor';
import { type Issue } from '@utils/getFunctions/getDashboardIssues';
import { mapIssueStatus } from '@utils/mapStatus';
import { patchDashboardIssue } from '@utils/patchFunctions/patchDashboardIssue';
import shortenID from '@utils/shortenID';
import { AllCommunityModule, GridOptions, ModuleRegistry } from 'ag-grid-community';
import { AgGridReact } from 'ag-grid-react';
import { useRouter } from 'next/navigation';
import { useCallback, useMemo, useRef, useState } from 'react';

import { useIssuesContext } from '../IssuesContext';
import styles from './IssuesTable.module.scss';
import { IssuesTableToolbar } from './IssuesTableToolbar';
import { ResolveIssueModal } from './ResolveIssueModal';
import { useColumnDefs } from './useColumnDefs';

// Register all Community features
ModuleRegistry.registerModules([AllCommunityModule]);

interface Props {
  issuePassRates: IssuePassRate[];
  selectedReportsMetadata: { runId: string; modelId: string }[];
}

export type GridData = Issue & {
  [key: string]: TestRunResult | Issue[keyof Issue] | undefined;
};

export const IssuesTable = ({ issuePassRates, selectedReportsMetadata }: Props) => {
  const router = useRouter();
  const { issues, loading: issueLoading, fetchIssues } = useIssuesContext();
  const { selectIssue } = useSelectedIssueContext();
  const { addToastMsg, removeToastfromQueue, addToastComponent } = useToastMessageContext();

  const [isIssueLoading, setIssueLoading] = useState<boolean>(false);
  const [displayedRowCount, setDisplayedRowCount] = useState<number>(0);
  const [resolveIssueId, setResolveIssueId] = useState<string | null>(null);
  const [resolutionNote, setResolutionNote] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const rowData = useMemo<GridData[] | null>(() => {
    if (!issues) return null;

    const activeIssues: GridData[] = issues.filter((issue) => issue.active);

    if (!issuePassRates) return activeIssues;
    return activeIssues.map((issue) => {
      const testRunResults = issuePassRates.find((d) => d.issueId === issue.id);
      if (testRunResults && testRunResults.testRunResults) {
        for (const result of testRunResults.testRunResults) {
          const { modelId, passedTestTotal, testTotal, tests } = result;
          issue[result.runId] = { modelId, passedTestTotal, testTotal, tests } as TestRunResult;
        }
      }
      return issue;
    });
  }, [issues, issuePassRates]);

  const openTest = useCallback(
    (id: string) => {
      setIssueLoading(true);
      selectIssue(id);
      router.push(`/test?prev=true`);
    },
    [router, selectIssue],
  );

  const [detailsModalProps, setDetailsModalProps] = useState<
    { id: string; kind: 'issue' | 'test' | 'feedback' } | undefined
  >(undefined);

  const closeUpdate = useCallback(
    (id: string) => {
      removeToastfromQueue(id);

      if (gridRef.current) {
        gridRef.current.api.stopEditing(true);
      }
    },
    [removeToastfromQueue],
  );

  const updateData = useCallback(
    async ({ newValue, dataId }: { newValue: string; dataId: string }) => {
      const fields = ['triage.ready_for_review', 'triage.approved', 'triage.resolved'];
      const successMessage = `Successfully saved the change${dataId ? ` for issue #${shortenID(dataId)}` : ''}`;
      let positiveIndexLimit = 0;

      closeUpdate(dataId);

      if (newValue === 'Deprecated') {
        setLoading(true);
        patchDashboardIssue(dataId, {
          key: 'active',
          value: false,
        })
          .then(() => {
            fetchIssues();
            addToastMsg(200, successMessage, 'Updated issue');
          })
          .catch((err: APICallError) => addToastMsg(err.status, err.message, 'Failed to update issue'))
          .finally(() => setLoading(false));
        return;
      }

      if (newValue === 'Resolved') {
        setResolutionNote(issues?.find((i) => i.id === dataId)?.note || null);
        setResolveIssueId(dataId);
        return;
      } else if (newValue === 'Approved') {
        positiveIndexLimit = 1;
      } else if (newValue === 'Ready for review') {
        positiveIndexLimit = 0;
      } else {
        positiveIndexLimit = -1;
      }

      setLoading(true);

      try {
        await Promise.all(
          fields.map((key, i) =>
            patchDashboardIssue(dataId || '', {
              key,
              value: i <= positiveIndexLimit,
            }),
          ),
        );

        fetchIssues();
        addToastMsg(200, successMessage, 'Updated issue');
      } catch (error) {
        console.error(error);
        if (error instanceof APICallError) {
          addToastMsg(error.status, error.message, 'Failed to update issue');
        } else {
          addToastMsg('error', 'Something went wrong while updating issue. Please try again', 'Failed to update issue');
        }
      } finally {
        setLoading(false);
      }
    },
    [addToastMsg, fetchIssues, issues, closeUpdate],
  );

  const onStatusChange = useCallback(
    (params: OnStatusChangeParams) => {
      const currentItem = issues?.find((i) => i.id === params.id);

      if (!currentItem) return;

      const currentItemStatus = mapIssueStatus(currentItem);

      if (params.newValue === currentItemStatus) {
        return;
      }

      addToastComponent(
        getEditActionToast({
          cancel: (id) => closeUpdate(id),
          dataId: params.id,
          dataType: 'issue',
          newValue: params.newValue,
          updateData,
        }),
        params.id,
      );
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [issues],
  );

  const [colDef] = useColumnDefs(selectedReportsMetadata, openTest, setDetailsModalProps, onStatusChange);

  const gridRef = useRef<AgGridReact>(null);

  const updateTotalRowItems = () => {
    setDisplayedRowCount(() => {
      if (!gridRef?.current) return 0;
      return gridRef.current.api.getDisplayedRowCount();
    });
  };

  const resolveIssue = ({ issueId, resolutionNote }: { issueId: string; resolutionNote: string }) => {
    setLoading(true);

    patchDashboardIssue(issueId, { key: 'triage.note', value: resolutionNote })
      .then(async () => {
        setResolveIssueId(null);

        try {
          await patchDashboardIssue(issueId, { key: 'triage.resolved', value: true });

          addToastMsg(200, `Successfully resolved issue #${shortenID(issueId)}`, 'Updated issue');
        } catch (error) {
          if (error instanceof APICallError) {
            addToastMsg(error.status, error.message, 'Failed to resolve the issue');
          }
        }
      })
      .catch((err) => addToastMsg(err.status, err.message, 'Failed to update issue resolution note'))
      .finally(() => {
        fetchIssues();
        setLoading(false);
      });
  };

  return (
    <>
      {' '}
      {loading && (
        <div className={styles.loading}>
          <InlineLoading description="Saving changes..." />
        </div>
      )}
      {colDef !== null && issues !== null ? (
        <>
          <IssuesTableToolbar gridRef={gridRef} />
          <AgGridReact
            ref={gridRef}
            rowData={rowData}
            loading={issueLoading}
            columnDefs={colDef}
            theme={carbonTheme}
            gridOptions={gridOptions as GridOptions<Issue>}
            onGridReady={updateTotalRowItems}
            onModelUpdated={updateTotalRowItems}
            tooltipShowDelay={750}
            defaultColDef={{ filter: 'agTextColumnFilter' }}
            maintainColumnOrder
          />
          <div className={styles.rowTotal}>{displayedRowCount} rows displayed</div>
          <DetailsModal
            id={detailsModalProps?.id}
            type={detailsModalProps?.kind}
            closeModal={() => {
              setDetailsModalProps(undefined);
            }}
          />
          <ResolveIssueModal
            issueId={resolveIssueId}
            resolutionNote={resolutionNote}
            close={() => {
              if (!loading) {
                setResolveIssueId(null);
                setResolutionNote(null);
              }
            }}
            resolveIssue={resolveIssue}
            disableActions={loading}
          />
        </>
      ) : (
        <DataTableSkeleton />
      )}
      {isIssueLoading && <Loading />}
    </>
  );
};
