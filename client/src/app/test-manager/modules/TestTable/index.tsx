import { DataTableSkeleton, InlineLoading } from '@carbon/react';
import { useToastMessageContext } from '@components/ToastMessageContext';
import { useIsAdmin } from '@hooks/permissionHooks';
import { useTestContext } from '@modules/TestContext';
import { APICallError } from '@types';
import { getEditActionToast } from '@utils/ag-grid/getEditActionToast';
import { carbonTheme } from '@utils/ag-grid/gridOptions';
import { OnStatusChangeParams } from '@utils/ag-grid/StatusCellEditor';
import { type Issue } from '@utils/getFunctions/getDashboardIssues';
import { type Test } from '@utils/getFunctions/getDashboardTests';
import { mapTestStatus } from '@utils/mapStatus';
import { patchDashboardTest } from '@utils/patchFunctions/patchDashboardTest';
import shortenID from '@utils/shortenID';
import { AllCommunityModule, ModuleRegistry, RowSelectionOptions, SelectionChangedEvent } from 'ag-grid-community';
import { AgGridReact } from 'ag-grid-react';
import { useCallback, useMemo, useRef, useState } from 'react';

import styles from './TestTable.module.scss';
import Toolbar from './Toolbar';
import { useColumnDefs } from './useColumnDefs';
import { isTestAvailable } from './utils';

// Register all Community features
ModuleRegistry.registerModules([AllCommunityModule]);

const TestTable = ({
  tests,
  issues,
  dataLoading,
  selectDetail,
}: {
  tests: Test[] | null;
  issues?: Issue[] | null;
  dataLoading: boolean;
  selectDetail: (id: string, type: 'issue' | 'test') => void;
}) => {
  const { fetchTests } = useTestContext();
  const [selectedTests, setSelectedTests] = useState<string[]>([]);
  const [displayedRowCount, setDisplayedRowCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);

  const { addToastMsg, addToastComponent, removeToastfromQueue } = useToastMessageContext();

  const isAdmin = useIsAdmin();

  const rowData = useMemo(() => {
    if (!issues) return tests;
    return tests?.map((d) => {
      const issueTitle = issues.find((i) => i.id === d.issueId)?.title;
      return { ...d, issueTitle };
    });
  }, [tests, issues]);

  const rowSelection = useMemo<RowSelectionOptions<Test> | undefined>(
    () =>
      isAdmin
        ? {
            mode: 'multiRow',
            selectAll: 'filtered',
            isRowSelectable: (row) => isTestAvailable(row.data),
            hideDisabledCheckboxes: true,
          }
        : undefined,
    [isAdmin],
  );

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
      const fields = ['triage.ready_for_review', 'triage.approved'];
      const successMessage = `Successfully saved the change${dataId ? ` for test #${shortenID(dataId)}` : ''}`;
      let positiveIndexLimit = 0;

      closeUpdate(dataId);
      setLoading(true);

      if (newValue === 'Deprecated') {
        patchDashboardTest(dataId, {
          key: 'active',
          value: false,
        })
          .then(() => {
            fetchTests();
            addToastMsg(200, successMessage, 'Updated test');
          })
          .catch((err: APICallError) => addToastMsg(err.status, err.message, 'Failed to update test'))
          .finally(() => setLoading(false));
        return;
      } else if (!tests?.find((d) => d.id === dataId)?.active) {
        //re-activate it if changed to another state
        try {
          await patchDashboardTest(dataId, {
            key: 'active',
            value: true,
          });
        } catch (err) {
          console.error(err);
          addToastMsg((err as APICallError).status, (err as APICallError).message, 'Failed to update test');
          setLoading(false);
          return;
        }
      }

      if (newValue === 'Approved') {
        positiveIndexLimit = 1;
      } else if (newValue === 'Ready for review') {
        positiveIndexLimit = 0;
      } else {
        positiveIndexLimit = -1;
      }

      try {
        await Promise.all(
          fields.map((key, i) =>
            patchDashboardTest(dataId || '', {
              key,
              value: i <= positiveIndexLimit,
            }),
          ),
        );

        fetchTests();
        addToastMsg(200, successMessage, 'Updated test');
      } catch (error) {
        console.error(error);
        if (error instanceof APICallError) {
          addToastMsg(error.status, error.message, 'Failed to update test');
        } else {
          addToastMsg('error', 'Something went wrong while updating test. Please try again', 'Failed to update test');
        }
      } finally {
        setLoading(false);
      }
    },
    [addToastMsg, fetchTests, closeUpdate, tests],
  );

  const onStatusChange = useCallback(
    (params: OnStatusChangeParams) => {
      const currentItem = tests?.find((t) => t.id === params.id);

      if (!currentItem) return;

      const currentItemStatus = mapTestStatus(currentItem);

      if (params.newValue === currentItemStatus) {
        return;
      }

      addToastComponent(
        getEditActionToast({
          cancel: (id) => closeUpdate(id),
          dataId: params.id,
          dataType: 'test',
          newValue: params.newValue,
          updateData,
        }),
        params.id,
      );
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [tests],
  );

  const [colDef] = useColumnDefs(selectDetail, onStatusChange);
  const gridRef = useRef<AgGridReact>(null);

  const updateTotalRowItems = () => {
    setDisplayedRowCount(() => {
      if (!gridRef?.current) return 0;
      return gridRef.current.api.getDisplayedRowCount();
    });
  };
  return (
    <>
      {colDef !== null && (
        <>
          <Toolbar
            gridRef={gridRef}
            selectedTests={selectedTests}
            selectableTestTotal={tests?.filter((row) => isTestAvailable(row))?.length ?? 0}
          />
          {tests === null ? (
            <DataTableSkeleton />
          ) : (
            <AgGridReact
              ref={gridRef}
              rowData={rowData}
              columnDefs={colDef}
              loading={dataLoading}
              theme={carbonTheme}
              defaultColDef={{ filter: 'agTextColumnFilter' }}
              rowSelection={rowSelection}
              selectionColumnDef={{ pinned: 'left' }}
              onSelectionChanged={(e: SelectionChangedEvent<Test>) =>
                setSelectedTests(e.api.getSelectedRows().map((t) => t.id ?? ''))
              }
              alwaysShowHorizontalScroll
              alwaysShowVerticalScroll
              onGridReady={updateTotalRowItems}
              onModelUpdated={updateTotalRowItems}
              maintainColumnOrder
            />
          )}
          <div className={styles.rowTotal}>{displayedRowCount} rows displayed</div>
          {loading && (
            <div className={styles.loading}>
              <InlineLoading description="Saving changes..." />
            </div>
          )}
        </>
      )}
    </>
  );
};

export default TestTable;
