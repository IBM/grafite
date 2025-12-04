'use client';

import { Button } from '@carbon/react';
import { ArrowRight, Download, Information } from '@carbon/react/icons';
import { useIsAdmin } from '@hooks/permissionHooks';
import { useTestContext } from '@modules/TestContext';
import AgGridToolbar from '@utils/ag-grid/AgGridToolbar';
import { downloadJSON } from '@utils/downloadJSON';
import { type Test } from '@utils/getFunctions/getDashboardTests';
import { AgGridReact } from 'ag-grid-react';
import { RefObject, useCallback, useMemo, useState } from 'react';

import { RunTestsModal } from '../RunTestsModal/RunTestsModal';
import styles from './TestTable.module.scss';

const Toolbar = ({
  gridRef,
  selectedTests,
  selectableTestTotal,
}: {
  gridRef: RefObject<AgGridReact<Test>>;
  selectedTests: string[];
  selectableTestTotal: number;
}) => {
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const { fetchTests } = useTestContext();

  const isAdmin = useIsAdmin();

  const search = useCallback(
    (keyword: string) => {
      gridRef.current?.api.setGridOption('quickFilterText', keyword);
    },
    [gridRef],
  );

  const getFilteredData = useCallback(() => {
    if (!gridRef.current) return [];

    const filteredData = [];
    const displayedRowCount = gridRef.current.api.getDisplayedRowCount();

    for (let i = 0; i < displayedRowCount; i++) {
      const rowNode = gridRef.current.api.getDisplayedRowAtIndex(i);

      if (rowNode?.data) {
        filteredData.push(rowNode.data);
      }
    }

    return filteredData;
  }, [gridRef]);

  const toolbarActions = useMemo(
    () => [
      <Button
        key="download-test-btn"
        kind="ghost"
        renderIcon={Download}
        iconDescription="Download"
        hasIconOnly
        onClick={() => {
          const data = getFilteredData();

          downloadJSON(data, 'grafite_tests.json');
        }}
      />,
      ...(isAdmin
        ? [
            <Button
              key="run-test-btn"
              onClick={() => {
                setIsModalOpen(true);
              }}
              renderIcon={ArrowRight}
            >
              Run {!selectedTests.length || selectedTests.length === selectableTestTotal ? 'all' : 'selected'} test
              {selectedTests.length === 1 ? '' : 's'}
            </Button>,
          ]
        : []),
    ],
    [isAdmin, getFilteredData],
  );

  return (
    <>
      <AgGridToolbar
        search={search}
        refresh={fetchTests}
        actions={toolbarActions}
        title={
          <span className={styles.explanation}>
            <Information />
            <span>If no tests are selected, all tests will be run by default</span>
          </span>
        }
      />
      {isAdmin && (
        <RunTestsModal
          isModalOpen={isModalOpen}
          setIsModalOpen={setIsModalOpen}
          selectedTests={selectedTests}
          selectableTestTotal={selectableTestTotal}
        />
      )}
    </>
  );
};
export default Toolbar;
