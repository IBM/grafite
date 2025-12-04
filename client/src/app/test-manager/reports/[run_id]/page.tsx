'use client';

import { DataTableSkeleton, Layer, Link, SkeletonText, Tab, TabList, TabPanel, TabPanels, Tabs } from '@carbon/react';
import { Button } from '@carbon/react';
import { PopoverContent } from '@carbon/react';
import { Popover } from '@carbon/react';
import { ArrowLeft, WarningFilled } from '@carbon/react/icons';
import Chart from '@components/DonutChart';
import LabelledItem from '@components/LabelledItem';
import { useToastMessageContext } from '@components/ToastMessageContext';
import DetailsModal from '@modules/DetailsModal';
import containerStyles from '@styles/sidenav-container.module.scss';
import ResultTestDetailsModal, { Props as RunResultModalProps } from '@test-manager/modules/ResultTestDetailsModal';
import { APICallError } from '@types';
import { getDashboardResult, JudgeResult, type Result } from '@utils/getFunctions/getDashboardResult';
import { getDashboardRunningTest, type TestRun } from '@utils/getFunctions/getDashboardRunningTests';
import { getAvgJudgeScore, parseBinaryJudgeScore } from '@utils/parseJudgeScore';
import { stringifyJudgeModelId } from '@utils/stringifyJudgeModelId';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import ResultsByIssueTable from '../modules/ResultsByIssueTable';
import ResultsByTestGrid from '../modules/ResultsByTestGrid';
import styles from './index.module.scss';

export default function ReportResultsPage() {
  const params = useParams();
  const { addToastMsg } = useToastMessageContext();
  const [reportResults, setReportResults] = useState<Result[] | null>(null);
  const [filters, setFilters] = useState<{ passed: boolean; failed: boolean }>({ failed: false, passed: false });
  const [numberOfTests, setNumberOfTests] = useState<{ total: number; failed: number }>({ failed: 0, total: 0 });
  const [loadingResults, setLoadingResults] = useState(true);
  const [loadingReport, setLoadingReport] = useState(true);
  const [report, setReport] = useState<TestRun | null>(null);

  const [selectedTabIdx, setSelectedTabIdx] = useState<number>(0);
  const [selectedDetailModalData, _setSelectedDetailModalData] = useState<
    { type: 'test' | 'issue'; id: string } | undefined
  >(undefined);
  const [selectedTestRun, _setSelectedTestRun] = useState<RunResultModalProps['test'] | null>(null);

  const [popoverOpen, setPopoverOpen] = useState<boolean>(false);
  const [isTableRendered, setTableRendered] = useState<boolean>(false); //delay the initial render of the table for performance

  const gridDataRefreshRef = useRef<((testId?: string, result?: JudgeResult) => void) | null>(null);

  const { run_id: runId } = params;

  const modelId = report?.modelId ?? '';
  const judgeModelId = useMemo(() => {
    return stringifyJudgeModelId((report?.judgeModelId ?? report?.judgeModelIds) || '');
  }, [report]);
  const setSelectedTestRun = useCallback((data: RunResultModalProps['test']) => _setSelectedTestRun(data), []);
  const setSelectedDetailModalData = useCallback(
    (param: { type: 'test' | 'issue'; id: string }) => _setSelectedDetailModalData(param),
    [],
  );
  const filter = useCallback((group: string) => {
    setFilters({ failed: group === 'Failed', passed: group === 'Passed' });
  }, []);

  const clearFilter = useCallback(() => {
    setFilters({ passed: false, failed: false });
  }, []);

  const removeFilter = useCallback((filter: string) => {
    setFilters((prev) => ({ ...prev, [filter]: !prev[filter as keyof typeof prev] }));
  }, []);

  const updateData = useCallback(() => {
    getDashboardResult(typeof runId === 'string' ? runId : '')
      .then((value) => {
        setReportResults(value);

        const total = value.length;
        const failed = value.reduce((prev, curr) => (Number(parseBinaryJudgeScore(curr)) === 0 ? prev + 1 : prev), 0);

        setNumberOfTests({ failed, total });
      })
      .catch((error: APICallError) => addToastMsg(error.status, error.message, 'Failed to fetch report results'))
      .finally(() => setLoadingResults(false));
  }, [addToastMsg, runId]);

  useEffect(() => {
    getDashboardRunningTest(typeof runId === 'string' ? runId : '')
      .then((value) => setReport(value))
      .catch((error: APICallError) => addToastMsg(error.status, error.message, 'Failed to fetch report'))
      .finally(() => setLoadingReport(false));

    updateData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [updateData]);

  return (
    <section className={`${containerStyles.container}  ${containerStyles.innerContainer} ${styles.root}`}>
      <div className={styles.header}>
        <div className={styles.runInfo}>
          <Link className={styles.link} href="/test-manager/reports">
            <ArrowLeft /> Back to report dashboard
          </Link>
          <h2>
            Report: <span>{runId}</span>
          </h2>
          <div className={styles.info}>
            <LabelledItem label="Creator" id="report-detail-creator" narrow>
              {loadingReport ? <SkeletonText /> : (report?.creator ?? '')}
            </LabelledItem>
            <div className={styles.row}>
              <LabelledItem label="Model" id="report-detail-model" narrow>
                {loadingReport ? <SkeletonText /> : modelId}
              </LabelledItem>
              <div className={styles.row}>
                <LabelledItem label="Judge model(s)" id="report-detail-judge-model" narrow>
                  {loadingReport || loadingResults ? <SkeletonText /> : judgeModelId}
                </LabelledItem>
              </div>
            </div>
          </div>
        </div>
        <Chart
          data={[
            { group: 'Passed', value: numberOfTests.total - numberOfTests.failed },
            { group: 'Failed', value: numberOfTests.failed },
          ]}
          filter={filter}
          centerLabel="Tests"
          loading={loadingResults}
        />
      </div>
      <Tabs
        selectedIndex={selectedTabIdx}
        onChange={({ selectedIndex }: { selectedIndex: number }) => {
          setSelectedTabIdx(selectedIndex);
        }}
      >
        <TabList aria-label="Data views">
          <Tab>Raw data</Tab>
          <Tab
            onClick={() => {
              if (!isTableRendered) setTableRendered(true);
            }}
          >
            Grouped by issue
          </Tab>
          <Popover open={popoverOpen} align="right" autoAlign isTabTip caret>
            <div className="trigger">
              <Button kind="ghost" size="md" renderIcon={WarningFilled} onClick={() => setPopoverOpen(true)}>
                Sanity check guideline
              </Button>
              {popoverOpen && <div className={styles.popoverBackdrop} onClick={() => setPopoverOpen(false)} />}
            </div>
            <PopoverContent>
              <SanityCheckMessage />
            </PopoverContent>
          </Popover>
        </TabList>
        <TabPanels>
          <TabPanel>
            <div className={styles.gridWrapper}>
              <ResultsByTestGrid
                data={reportResults}
                filters={filters}
                updateData={updateData}
                setSelectedDetailModalData={setSelectedDetailModalData}
                setSelectedTestRun={setSelectedTestRun}
                gridDataRefreshRef={gridDataRefreshRef}
              />
            </div>
          </TabPanel>
          <TabPanel>
            {isTableRendered && (
              <Layer>
                {reportResults && !loadingResults ? (
                  <ResultsByIssueTable
                    results={reportResults.filter((value) => {
                      const score = getAvgJudgeScore(value);
                      if (score === undefined) return false;
                      return filters.passed ? Number(score) > 0.5 : filters.failed ? Number(score) <= 0.5 : true;
                    })}
                    filters={Object.entries(filters)
                      .filter((d) => d[1] === true)
                      .map((d) => d[0])}
                    clearFilter={clearFilter}
                    removeFilter={removeFilter}
                    setSelectedDetailModalData={setSelectedDetailModalData}
                    setSelectedTestRun={setSelectedTestRun}
                  />
                ) : (
                  <DataTableSkeleton />
                )}
              </Layer>
            )}
          </TabPanel>
        </TabPanels>
      </Tabs>
      <DetailsModal
        id={selectedDetailModalData?.id}
        type={selectedDetailModalData?.type}
        closeModal={() => {
          _setSelectedDetailModalData(undefined);
        }}
      />
      <ResultTestDetailsModal
        open={!!selectedTestRun}
        close={() => {
          _setSelectedTestRun(null);
        }}
        test={selectedTestRun}
        modelId={modelId}
        judgeModelId={judgeModelId}
        runId={runId as string}
        gridDataRefreshRef={gridDataRefreshRef}
      />
    </section>
  );
}

const SanityCheckMessage = () => {
  return (
    <div className={styles.sanityCheckMessage}>
      The result may include outputs that should be filtered out for analysis. Below are the list of known issues as of
      September 2025:
      <ol>
        <li>
          <strong>Empty outputs</strong>
          <br />
          Some empty outputs might incorrectly have a score of 1.
        </li>
        <li>
          <strong>Parsing error</strong>
          <br />
          Incomplete outputs or extra tokens can cause parsing errors, resulting in a score of 0.
        </li>
      </ol>
      These items are displayed at the top of the list in the Raw data tab.
    </div>
  );
};
