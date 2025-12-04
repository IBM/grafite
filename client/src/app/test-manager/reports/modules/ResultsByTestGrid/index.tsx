import { DataTableSkeleton } from '@carbon/react';
import { useToastMessageContext } from '@components/ToastMessageContext';
import { useIssuesContext } from '@modules/IssuesContext';
import { Props as RunResultModalProps } from '@test-manager/modules/ResultTestDetailsModal';
import { useReportsContext } from '@test-manager/ReportsContext';
import styles from '@utils/ag-grid/ag-grid.module.scss';
import AgGridToolbar from '@utils/ag-grid/AgGridToolbar';
import { carbonTheme } from '@utils/ag-grid/gridOptions';
import ScoreAggregator from '@utils/ag-grid/ScoreAggregator';
import { JudgeResult, Result } from '@utils/getFunctions/getDashboardResult';
import { getAvgJudgeScore } from '@utils/parseJudgeScore';
import { isHumanEval } from '@utils/isHumanEval';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';
import { AgGridReact } from 'ag-grid-react';
import { memo, MutableRefObject, RefObject, useCallback, useEffect, useRef, useState } from 'react';

import gridStyles from './ResultsByTestGrid.module.scss';
import { useColumnDefs } from './useColumnDefs';
import { GridRow, sortSanityCheck } from './utils';

interface Props {
  data: Result[] | null;
  filters: { passed: boolean; failed: boolean };
  updateData: () => void;
  setSelectedDetailModalData: (param: { type: 'test' | 'issue'; id: string }) => void;
  setSelectedTestRun: (data: RunResultModalProps['test']) => void;
  gridDataRefreshRef: MutableRefObject<(() => void) | null>;
}

// Register all Community features
ModuleRegistry.registerModules([AllCommunityModule]);

const ResultsByTestGrid = memo(function ResultsByTestGrid({
  data,
  filters,
  updateData,
  setSelectedDetailModalData,
  setSelectedTestRun,
  gridDataRefreshRef,
}: Props) {
  const { addToastMsg } = useToastMessageContext();
  const { issues } = useIssuesContext();

  const [displayedRowCount, setDisplayedRowCount] = useState<number>(0);
  const [rows, setRows] = useState<GridRow[] | null>(null);
  const [judgeModels, setJudgeModels] = useState<{ id: string; type?: string }[] | null>(null);
  const aggregatedScores = useRef<number>(0);
  const humanEvalTotal = useRef<number>(0);

  const selectTest = useCallback(
    (id: string | undefined) => {
      if (id) setSelectedDetailModalData({ type: 'test', id });
      else addToastMsg('error', 'Failed to retrieve the test ID', 'Failed to open test details');
    },
    [setSelectedDetailModalData, addToastMsg],
  );

  const selectIssue = useCallback(
    (id: string | undefined) => {
      if (id) setSelectedDetailModalData({ type: 'issue', id });
      else addToastMsg('error', 'Failed to retrieve the test ID', 'Failed to open test details');
    },
    [setSelectedDetailModalData, addToastMsg],
  );

  const selectTestRun = useCallback(
    (data: GridRow | undefined) => {
      if (!data) return addToastMsg('error', 'Failed to retrieve the test run data', 'Failed to open test run details');
      setSelectedTestRun({
        testId: data.testId,
        promptText: data.promptText,
        messages: data.messages,
        modelResponse: data.modelResponse,
        groundTruth: data.groundTruth,
        judgePrompt: data.judgePrompt,
        judgeGuidelines: data.judgeGuidelines,
        judgeResults: data.judgeResults,
      });
    },
    [setSelectedTestRun, addToastMsg],
  );

  const getJudges = useCallback(() => {
    const judges = (() => {
      if (rows?.find((d) => d.judgeResults)) {
        const ensembleJudges: { id: string; type?: string }[] = rows
          .map((d) => d.judgeResults?.map((d) => ({ id: d.modelId, ...(d.type ? { type: d.type } : undefined) })))
          .flat();
        const judgeIds = rows.map((d) => d.judgeResults?.map((d) => d.modelId)).flat();
        return ensembleJudges.filter((d, i) => judgeIds.indexOf(d.id) === i);
      }
      return null;
    })();
    setJudgeModels(judges);
  }, [rows]);

  const [colDef] = useColumnDefs(selectTest, selectIssue, selectTestRun, judgeModels);
  const gridRef = useRef<AgGridReact>(null);

  const getAggregatedScores = useCallback(() => {
    const totals = { passed: 0, hasHumanEval: 0 };
    if (gridRef?.current) {
      const rowCount = gridRef.current.api.getDisplayedRowCount();

      Array.from({ length: rowCount })
        .map((_, i) => gridRef.current!.api.getDisplayedRowAtIndex(i))
        .filter((rowNode) => {
          if (!rowNode) return false;

          const score = Number(getAvgJudgeScore(rowNode.data));
          if (!isNaN(score) && score > 0.5) totals.passed += 1;
          if (rowNode.data.judgeResults?.find((d: JudgeResult) => isHumanEval(d))) totals.hasHumanEval += 1;
          return;
        });
    }
    return totals;
  }, [gridRef]);

  const updateTotalRowItems = useCallback(() => {
    setDisplayedRowCount(() => {
      if (!gridRef?.current) return 0;
      return gridRef.current.api.getDisplayedRowCount();
    });
    const { passed, hasHumanEval } = getAggregatedScores();

    aggregatedScores.current = passed;
    humanEvalTotal.current = hasHumanEval;
  }, [aggregatedScores, humanEvalTotal, gridRef, getAggregatedScores]);

  useEffect(() => {
    if (gridRef.current?.api) {
      const isMultiJudge = judgeModels && judgeModels.length > 1
      const colName = isMultiJudge ? 'avgScore' : 'testScore';
      const filterType = isMultiJudge ? (filters.passed ? 'greaterThan' : 'lessThan') : 'contains';
      const filterScore = isMultiJudge ? 0.5 : (filters.passed ? '1' : '0');
      const currentFilter = gridRef.current.api.getColumnFilterModel(colName);
      if (Object.values(filters).includes(true)) {
        gridRef.current.api.setColumnFilterModel(colName, { type: filterType, filter: filterScore });
        gridRef.current.api.onFilterChanged();
      } else if (!!currentFilter) {
        gridRef.current.api.setColumnFilterModel(colName, {});
        gridRef.current.api.onFilterChanged();
      }
    }
  }, [filters, judgeModels]);

  useEffect(() => {
    if (!rows) return;
    gridDataRefreshRef.current = (testId?: string, annotation?: JudgeResult) => {
      if (testId && annotation) {
        const target = rows?.find((d) => d.testId === testId);
        if (target) {
          if (!target.judgeResults) target.judgeResults = [];
          const existingAnnotation = target.judgeResults.find((d) => isHumanEval(d));
          if (existingAnnotation) {
            existingAnnotation.testScore = annotation.testScore;
            existingAnnotation.testJustification = annotation.testJustification;
            existingAnnotation.modelId = annotation.modelId;
          } else target.judgeResults.push(annotation);
        }
      }
      getJudges();
      updateTotalRowItems();
      gridRef.current?.api.refreshCells({ force: true });
    };
    getJudges();
  }, [rows, getJudges, updateTotalRowItems, gridDataRefreshRef]);

  useEffect(() => {
    if (!issues || !data) return;
    setRows(
      data
        ?.map((r) => {
          const issue = issues?.find((d) => (r.testId ? d.testIds.includes(r.testId) : null));
          return {
            id: r.testId,
            issueId: issue?.id ?? '',
            issueTitle: issue?.title ?? '',
            ...r,
          };
        })
        .sort(sortSanityCheck) || null,
    );
    gridRef.current?.api.refreshCells({ force: true });
  }, [data, issues]);

  return (
    <>
      {colDef !== null && (
        <>
          <Toolbar gridRef={gridRef} updateData={updateData} />
          {rows === null ? (
            <DataTableSkeleton />
          ) : (
            <AgGridReact
              ref={gridRef}
              rowData={rows}
              columnDefs={colDef}
              theme={carbonTheme}
              defaultColDef={{ filter: 'agTextColumnFilter' }}
              onGridReady={updateTotalRowItems}
              onModelUpdated={updateTotalRowItems}
            />
          )}
          <div className={styles.rowTotal}>
            <div className={gridStyles.gridFooter}>
              <div>{displayedRowCount} rows displayed</div>
              <ScoreAggregator.Table>
                <ScoreAggregator.Row
                  passed={aggregatedScores.current}
                  failed={displayedRowCount - aggregatedScores.current}
                  hasHumanEval={humanEvalTotal.current}
                />
              </ScoreAggregator.Table>
            </div>
          </div>
        </>
      )}
    </>
  );
});

const Toolbar = memo(function Toolbar({
  gridRef,
  updateData,
}: {
  gridRef: RefObject<AgGridReact>;
  updateData: () => void;
}) {
  const { fetchIssues, loading } = useIssuesContext();
  const { fetchReports } = useReportsContext();

  const search = useCallback(
    (keyword: string) => {
      gridRef.current?.api.setGridOption('quickFilterText', keyword);
    },
    [gridRef],
  );

  const refresh = useCallback(() => {
    fetchIssues();
    fetchReports();
    updateData();
  }, [fetchIssues, fetchReports, updateData]);

  return <AgGridToolbar search={search} refresh={refresh} loading={loading} />;
});

export default ResultsByTestGrid;
