'use client';

import { Button } from '@carbon/react';
import { ArrowRight, Download } from '@carbon/react/icons';
import { useIsAdmin } from '@hooks/permissionHooks';
import AgGridToolbar from '@utils/ag-grid/AgGridToolbar';
import { downloadJSON } from '@utils/downloadJSON';
import { type Issue } from '@utils/getFunctions/getDashboardIssues';
import { AgGridReact } from 'ag-grid-react';
import { useRouter } from 'next/navigation';
import { RefObject, useCallback, useMemo } from 'react';

import { useIssuesContext } from '../IssuesContext';

export const IssuesTableToolbar = ({ gridRef }: { gridRef: RefObject<AgGridReact<Issue>> }) => {
  const { fetchIssues } = useIssuesContext();

  const isAdmin = useIsAdmin();

  const router = useRouter();

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

      if (rowNode?.data && rowNode.data.active) {
        filteredData.push(rowNode.data);
      }
    }

    return filteredData;
  }, [gridRef]);

  const toolbarActions = useMemo(
    () => [
      <Button
        key="download-issue-btn"
        kind="ghost"
        renderIcon={Download}
        iconDescription="Download"
        hasIconOnly
        onClick={() => {
          const data = getFilteredData();

          downloadJSON(data, 'grafite_issues.json');
        }}
      />,
      ...(isAdmin
        ? [
            <Button
              key="open-an-issue-btn"
              renderIcon={ArrowRight}
              iconDescription="Open an issue"
              onClick={() => router.push('/issue?prev=true')}
            >
              Open new issue
            </Button>,
          ]
        : []),
    ],
    [isAdmin, router, getFilteredData],
  );

  return <AgGridToolbar search={search} refresh={fetchIssues} actions={toolbarActions} />;
};
