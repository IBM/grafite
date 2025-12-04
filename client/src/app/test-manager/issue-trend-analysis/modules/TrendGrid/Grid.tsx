import { DataTableSkeleton } from '@carbon/react';
import { useIssuesContext } from '@modules/IssuesContext';
import { useTestContext } from '@modules/TestContext';
import { SelectedReport } from '@test-manager/issue-trend-analysis-old/[id]/utils';
import { carbonTheme } from '@utils/ag-grid/gridOptions';
import { JudgeResult, Result } from '@utils/getFunctions/getDashboardResult';
import { isHumanEval } from '@utils/isHumanEval';
import { getAvgJudgeScore } from '@utils/parseJudgeScore';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';
import { AgGridReact } from 'ag-grid-react';
import { memo, MutableRefObject, RefObject, useCallback, useEffect, useState } from 'react';

import { filterByTag } from '../TrendAnalysisByIssueTag/utils';
import Toolbar from './Toolbar';
import { useColumnDefs } from './useColumnDefs';

// Register all Community features
ModuleRegistry.registerModules([AllCommunityModule]);

type GridRow = { testId: string; testFlags: string[]; issueId: string; issueTitle: string; issueTags: string[] } & {
  [key: string]: { score: number | string; hasHumanEval: boolean };
};

const Grid = memo(function Grid({
  selectedReports,
  selectedTags,
  selectTest,
  selectIssue,
  selectTestRun,
  updateTotalRowItems,
  gridDataRefreshRef,
  gridRef,
}: {
  selectedReports: SelectedReport[];
  selectedTags: string[] | undefined;
  selectTest: (id: string | undefined) => void;
  selectIssue: (id: string | undefined) => void;
  selectTestRun: (reportId: string, testId: string) => void;
  updateTotalRowItems: () => void;
  gridDataRefreshRef: MutableRefObject<(() => void) | null>;
  gridRef: RefObject<AgGridReact>;
}) {
  const { issues } = useIssuesContext();
  const { tests } = useTestContext();

  const [selectedReportLoading, setSelectedReportLoading] = useState<boolean>(false);
  const [rowData, setRowData] = useState<GridRow[] | null>(null);
  const [colDef] = useColumnDefs(selectedReports, selectTest, selectIssue, selectTestRun);

  const getRowData = useCallback(() => {
    setSelectedReportLoading(true);
    const testIds =
      selectedReports
        ?.map((d) => d.results?.map((r) => r.testId))
        .flat()
        .filter((d, i, arr) => d !== undefined && arr.indexOf(d) === i) || [];

    if (!testIds) return null;

    setSelectedReportLoading(false);

    const getTestScore = (results: Result[] | null, id: string) => {
      const target = results?.find((result) => result.testId === id);
      if (!target) return undefined;
      return getAvgJudgeScore(target);
    };

    const hasHumanEval = (results: Result[] | null, id: string) => {
      const target = results?.find((result) => result.testId === id);
      if (!target) return undefined;
      return !!target.judgeResults?.find((d) => isHumanEval(d));
    };

    return testIds.map((id) => {
      const validReports = selectedReports.filter((report) => !!report.results);
      const reportScores = validReports.map((report) => [
        report.report.runId,
        { score: getTestScore(report.results, id!), hasHumanEval: hasHumanEval(report.results, id!) },
      ]);
      const issue = issues?.find((d) => d.testIds.includes(id || ''));

      const testFlags = tests?.find((v) => v.id === id)?.flags || [];

      return {
        testId: id,
        testFlags,
        issueId: issue?.id,
        issueTitle: issue?.title,
        issueTags: issue?.tags ?? [],
        ...Object.fromEntries(reportScores),
      };
    });
  }, [selectedReports, issues, tests]);

  useEffect(() => {
    setRowData(getRowData());
    gridDataRefreshRef.current = (testId?: string, annotation?: JudgeResult, runId?: string) => {
      setRowData((prev) => {
        if (testId && annotation && runId) {
          const target = prev?.find((d) => d.testId === testId);
          if (target) {
            target[runId].score = annotation.testScore;
            target[runId].hasHumanEval = true;
          }
        }
        return prev;
      });
      updateTotalRowItems();
      gridRef.current?.api.refreshCells({ force: true });
    };
  }, [updateTotalRowItems, getRowData, gridRef, gridDataRefreshRef]);

  return (
    colDef !== null && (
      <>
        <Toolbar gridRef={gridRef} selectedReportLoading={selectedReportLoading} />
        {rowData === null || selectedReportLoading ? (
          <DataTableSkeleton />
        ) : (
          <AgGridReact
            ref={gridRef}
            rowData={rowData.filter((row) => filterByTag(selectedTags ?? [], row?.issueTags ?? []))}
            columnDefs={colDef}
            theme={carbonTheme}
            defaultColDef={{ filter: 'agTextColumnFilter' }}
            onGridReady={updateTotalRowItems}
            onModelUpdated={updateTotalRowItems}
          />
        )}
      </>
    )
  );
});

export default Grid;
