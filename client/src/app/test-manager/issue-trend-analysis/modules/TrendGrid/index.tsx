import { useToastMessageContext } from '@components/ToastMessageContext';
import DetailsModal from '@modules/DetailsModal';
import { SelectedReport } from '@test-manager/issue-trend-analysis-old/[id]/utils';
import ResultTestDetailsModal, { Props as RunResultModalProps } from '@test-manager/modules/ResultTestDetailsModal';
import { stringifyJudgeModelId } from '@utils/stringifyJudgeModelId';
import { AgGridReact } from 'ag-grid-react';
import { useCallback, useEffect, useRef, useState } from 'react';

import { useRouter } from 'next/navigation';
import Grid from './Grid';
import { aggregateReportScores } from '@utils/ag-grid/ScoreAggregator/utils';

import localStyles from './TrendGrid.module.scss';
import styles from '@utils/ag-grid/ag-grid.module.scss';
import ScoreAggregator from '@utils/ag-grid/ScoreAggregator';

const TrendGrid = ({
  selectedReports,
  selectedTags,
}: {
  selectedReports: SelectedReport[];
  selectedTags: string[] | undefined;
}) => {
  const { addToastMsg } = useToastMessageContext();
  const router = useRouter();

  const [selectedTestId, setSelectedTestId] = useState<{ type: 'test' | 'issue'; id: string } | undefined>(undefined);
  const [selectedTestRun, setSelectedTestRun] = useState<{
    test: RunResultModalProps['test'];
    modelId: string;
    judgeModelId: string;
    reportId: string;
  } | null>(null);

  const [displayedRowCount, setDisplayedRowCount] = useState<number>(0);
  const [aggregatedScores, setAggregatedScores] = useState<{
    [runId: string]: {
      passed: number;
      failed: number;
      none: number;
      hasHumanEval: number;
      modelId: string;
      createdAt: string;
    };
  }>({});

  const gridDataRefreshRef = useRef<(() => void) | null>(null);
  const gridRef = useRef<AgGridReact>(null);

  const selectTest = useCallback(
    (id: string | undefined) => {
      if (id) setSelectedTestId({ type: 'test', id });
      else addToastMsg('error', 'Failed to retrieve the test ID', 'Failed to open test details');
    },
    [addToastMsg],
  );

  const selectIssue = useCallback(
    (id: string | undefined) => {
      if (id) setSelectedTestId({ type: 'issue', id });
      else addToastMsg('error', 'Failed to retrieve the test ID', 'Failed to open test details');
    },
    [addToastMsg],
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

    setAggregatedScores(() => getAggregatedScores());
  }, [getAggregatedScores, gridRef]);

  useEffect(() => {
    setAggregatedScores(() => getAggregatedScores());
    router.refresh();
  }, [getAggregatedScores, router]);

  return (
    <>
      <Grid
        selectIssue={selectIssue}
        selectTest={selectTest}
        selectTestRun={selectTestRun}
        updateTotalRowItems={updateTotalRowItems}
        selectedReports={selectedReports}
        selectedTags={selectedTags}
        gridDataRefreshRef={gridDataRefreshRef}
        gridRef={gridRef}
      />
      <div className={styles.rowTotal}>
        <div className={localStyles.gridFooter}>
          <div>{displayedRowCount} rows displayed</div>
          <ScoreAggregator.Table>
            {Object.entries(aggregatedScores).map(
              ([runId, { passed, modelId, createdAt, failed, none, hasHumanEval }], i) => {
                const hasOtherRunWithSameModel = !!Object.values(aggregatedScores).find(
                  ({ modelId: searchModelId }, index) => searchModelId === modelId && i !== index,
                );

                const identifier = hasOtherRunWithSameModel ? `${modelId} (${runId})` : modelId;

                return (
                  <ScoreAggregator.Row
                    passed={passed}
                    failed={failed}
                    none={none}
                    hasHumanEval={hasHumanEval}
                    identifier={identifier}
                    key={`${modelId}-${createdAt}`}
                  />
                );
              },
            )}
          </ScoreAggregator.Table>
        </div>
      </div>
      <DetailsModal
        id={selectedTestId?.id}
        type={selectedTestId?.type}
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

export default TrendGrid;
