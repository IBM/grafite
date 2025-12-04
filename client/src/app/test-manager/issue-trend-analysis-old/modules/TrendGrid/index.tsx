import { DataTableSkeleton } from '@carbon/react';
import { useToastMessageContext } from '@components/ToastMessageContext';
import DetailsModal from '@modules/DetailsModal';
import { useTestContext } from '@modules/TestContext';
import { SelectedReport } from '@test-manager/issue-trend-analysis-old/[id]/utils';
import ResultTestDetailsModal, { Props as RunResultModalProps } from '@test-manager/modules/ResultTestDetailsModal';
import { useReportsContext } from '@test-manager/ReportsContext';
import styles from '@utils/ag-grid/ag-grid.module.scss';
import AgGridToolbar from '@utils/ag-grid/AgGridToolbar';
import { carbonTheme } from '@utils/ag-grid/gridOptions';
import ScoreAggregator from '@utils/ag-grid/ScoreAggregator';
import { aggregateReportScores } from '@utils/ag-grid/ScoreAggregator/utils';
import { getDashboardResult, JudgeResult, Result } from '@utils/getFunctions/getDashboardResult';
import { getDashboardRunningTest } from '@utils/getFunctions/getDashboardRunningTests';
import { Test } from '@utils/getFunctions/getDashboardTests';
import { getAvgJudgeScore } from '@utils/parseJudgeScore';
import { stringifyJudgeModelId } from '@utils/stringifyJudgeModelId';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';
import { AgGridReact } from 'ag-grid-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { memo, RefObject, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { isHumanEval } from '@utils/isHumanEval';

import TestRunSelector from '../TestRunSelector';
import localStyles from './TrendGrid.module.scss';
import { useColumnDefs } from './useColumnDefs';
import { GridRow } from './utils';

// Register all Community features
ModuleRegistry.registerModules([AllCommunityModule]);

interface Props {
  tests: Test[] | undefined;
}
const TrendGrid = ({ tests }: Props) => {
  const { addToastMsg } = useToastMessageContext();
  const { loading: reportLoading } = useReportsContext();

  const { push, refresh } = useRouter();
  const searchParams = useSearchParams();
  const runIds = useMemo(() => searchParams.getAll('run_id'), [searchParams]);

  const [selectedReports, _setSelectedReports] = useState<SelectedReport[]>([]);
  const [selectedReportLoading, setSelectedReportLoading] = useState<boolean>(false);
  const [selectedTestId, setSelectedTestId] = useState<string | undefined>(undefined);
  const [displayedRowCount, setDisplayedRowCount] = useState<number>(0);
  const [selectedTestRun, setSelectedTestRun] = useState<{
    test: RunResultModalProps['test'];
    modelId: string;
    judgeModelId: string;
    reportId: string;
  } | null>(null);
  const [rowData, setRowData] = useState<GridRow[] | null>(null);

  const gridDataRefreshRef = useRef<(() => void) | null>(null);
  const aggregatedScores = useRef<{
    [runId: string]: {
      passed: number;
      failed: number;
      none: number;
      hasHumanEval: number;
      modelId: string;
      createdAt: string;
    };
  }>({});

  const selectTest = useCallback(
    (id: string | undefined) => {
      if (id) setSelectedTestId(id);
      else addToastMsg('error', 'Failed to retrieve the test ID', 'Failed to open test details');
    },
    [addToastMsg],
  );

  const selectReports = useCallback(
    (reports: SelectedReport[]) => {
      const ids = reports.map((r) => r.report.runId);
      const newSearchParams = new URLSearchParams();
      for (const id of ids) newSearchParams.append('run_id', id);
      push(`?${newSearchParams.toString()}`);
    },
    [push],
  );

  const selectTestRun = useCallback(
    (reportId: string, testId: string) => {
      const selectedReport = selectedReports.find(({ report }) => report.runId === reportId);
      if (selectedReport) {
        const { modelId, judgeModelId: rawJudgeModelId, judgeModelIds: rawJudgeModelIds } = selectedReport.report;
        const judgeModelId = stringifyJudgeModelId((rawJudgeModelId ?? rawJudgeModelIds) || '');
        const selectedTestRun = selectedReport.results;
        const testResult = selectedTestRun?.find((result) => result.testId === testId) ?? null;

        if (!testResult) return;
        setSelectedTestRun(() => ({
          modelId,
          judgeModelId,
          reportId,
          test: {
            testId: testId,
            promptText: testResult.promptText,
            messages: testResult.messages,
            modelResponse: testResult.modelResponse,
            groundTruth: testResult.groundTruth,
            judgePrompt: testResult.judgePrompt,
            judgeGuidelines: testResult.judgeGuidelines,
            judgeResults: testResult.judgeResults,
          },
        }));
      }
    },
    [selectedReports],
  );

  const getRowData = useCallback(() => {
    if (!tests) return null;

    //TODO find a better way to display the score for multiple judges
    const getTestScore = (results: Result[] | null, id: string) => {
      const target = results?.find((result) => result.testId === id);
      if (target) return getAvgJudgeScore(target);
    };

    const hasHumanEval = (results: Result[] | null, id: string) => {
      const target = results?.find((result) => result.testId === id);
      if (!target) return undefined;
      return !!target.judgeResults?.find((d) => isHumanEval(d));
    };

    return tests.map((test) => {
      const validReports = selectedReports.filter((report) => !!report.results);
      const reportScores = validReports.map((report) => [
        report.report.runId,
        { score: getTestScore(report.results, test.id!), hasHumanEval: hasHumanEval(report.results, test.id!) },
      ]);
      return { ...test, ...Object.fromEntries(reportScores) };
    });
  }, [tests, selectedReports]);

  const [colDef] = useColumnDefs(selectedReports, selectTest, selectTestRun);
  const gridRef = useRef<AgGridReact>(null);

  const getAggregatedScores = useCallback(() => {
    const reports = selectedReports.map((r) => ({
      runId: r.report.runId,
      modelId: r.report.modelId,
      createdAt: r.report.createdAt,
    }));

    if (gridRef?.current) return aggregateReportScores(reports, gridRef.current);
    return {};
  }, [selectedReports, gridRef]);

  const updateTotalRowItems = useCallback(() => {
    setDisplayedRowCount(() => {
      if (!gridRef?.current) return 0;
      return gridRef.current.api.getDisplayedRowCount();
    });

    aggregatedScores.current = getAggregatedScores();
  }, [gridRef, aggregatedScores, getAggregatedScores]);

  const fetchSelectedReports = useCallback(
    async (ids: string[], mergeData?: boolean) => {
      setSelectedReportLoading(true);
      try {
        const reports = await Promise.all(
          ids.map(async (id) => {
            const [report, results] = await Promise.all([getDashboardRunningTest(id), getDashboardResult(id)]);
            return { report, results };
          }),
        );

        _setSelectedReports((prev) => {
          if (mergeData) {
            const existingReports = prev.filter((d) => runIds?.includes(d.report.runId)); //deselect
            return [...existingReports, ...reports];
          } else return [...reports];
        });
      } catch (e) {
        console.error(e);
        addToastMsg('error', 'Please try again or select another report', 'Failed to load report');
      } finally {
        setSelectedReportLoading(false);
      }
    },
    [runIds, addToastMsg],
  );

  const refreshData = useCallback(() => {
    const runIds = selectedReports.map((d) => d.report.runId);
    fetchSelectedReports(runIds);
  }, [selectedReports, fetchSelectedReports]);

  useEffect(() => {
    aggregatedScores.current = getAggregatedScores();
    refresh();
  }, [getAggregatedScores, refresh]);

  useEffect(() => {
    setRowData(getRowData());
    gridDataRefreshRef.current = (testId?: string, annotation?: JudgeResult, runId?: string) => {
      setRowData((prev) => {
        if (testId && annotation && runId) {
          const target = prev?.find((d) => d.id === testId);
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
  }, [getRowData, updateTotalRowItems, gridDataRefreshRef]);

  useEffect(() => {
    if (reportLoading) return;
    if (runIds) {
      _setSelectedReports((prev) => {
        const existingReports = prev.filter((d) => runIds?.includes(d.report.runId)); //deselect
        const newReports = runIds.filter((id) => !existingReports.find((r) => r.report.runId === id));

        if (newReports.length > 0) {
          fetchSelectedReports(newReports, true);
        }
        return existingReports;
      });
    }
  }, [runIds, reportLoading, addToastMsg, fetchSelectedReports]);

  return (
    <>
      {colDef !== null && (
        <>
          <Toolbar gridRef={gridRef} selectedReportLoading={selectedReportLoading} refreshData={refreshData} />
          <TestRunSelector selectReports={selectReports} selectedReports={selectedReports} />
          {rowData === null ? (
            <DataTableSkeleton />
          ) : (
            <AgGridReact
              ref={gridRef}
              rowData={rowData}
              columnDefs={colDef}
              theme={carbonTheme}
              defaultColDef={{ filter: 'agTextColumnFilter' }}
              onGridReady={updateTotalRowItems}
              onModelUpdated={updateTotalRowItems}
            />
          )}
          <div className={styles.rowTotal}>
            <div className={localStyles.gridFooter}>
              <div>{displayedRowCount} rows displayed</div>
              <ScoreAggregator.Table>
                {Object.entries(aggregatedScores.current).map(
                  ([runId, { passed, modelId, createdAt, failed, none, hasHumanEval }], i) => {
                    const hasOtherRunWithSameModel = !!Object.values(aggregatedScores.current).find(
                      ({ modelId: searchModelId }, index) => searchModelId === modelId && i !== index,
                    );

                    const identifier = hasOtherRunWithSameModel ? `${modelId} (${runId})` : modelId;

                    return (
                      <ScoreAggregator.Row
                        passed={passed}
                        failed={failed}
                        none={none}
                        identifier={identifier}
                        key={`${modelId}-${createdAt}`}
                        hasHumanEval={hasHumanEval}
                      />
                    );
                  },
                )}
              </ScoreAggregator.Table>
            </div>
          </div>
        </>
      )}
      <DetailsModal
        type="test"
        id={selectedTestId}
        closeModal={() => {
          setSelectedTestId(undefined);
        }}
      />
      <ResultTestDetailsModal
        open={!!selectedTestRun}
        close={() => {
          setSelectedTestRun(null);
        }}
        test={selectedTestRun?.test || null}
        modelId={selectedTestRun?.modelId || ''}
        judgeModelId={selectedTestRun?.judgeModelId || ''}
        runId={selectedTestRun?.reportId || ''}
        gridDataRefreshRef={gridDataRefreshRef}
      />
    </>
  );
};

const Toolbar = memo(function Toolbar({
  gridRef,
  selectedReportLoading,
  refreshData,
}: {
  gridRef: RefObject<AgGridReact>;
  selectedReportLoading: boolean;
  refreshData: () => void;
}) {
  const { fetchReports, loading: reportLoading } = useReportsContext();
  const { fetchTests, loading: testLoading } = useTestContext();

  const search = useCallback(
    (keyword: string) => {
      gridRef.current?.api.setGridOption('quickFilterText', keyword);
    },
    [gridRef],
  );

  const refresh = () => {
    fetchTests();
    fetchReports();
    refreshData();
  };

  return (
    <AgGridToolbar search={search} refresh={refresh} loading={testLoading || reportLoading || selectedReportLoading} />
  );
});

export default TrendGrid;
