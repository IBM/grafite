'use client';

import { Button, Checkbox, Loading, Tag } from '@carbon/react';
import { useToastMessageContext } from '@components/ToastMessageContext';
import containerStyles from '@styles/sidenav-container.module.scss';
import { useReportsContext } from '@test-manager/ReportsContext';
import { getDashboardResult, type Result } from '@utils/getFunctions/getDashboardResult';
import { getDashboardRunningTest, type TestRun } from '@utils/getFunctions/getDashboardRunningTests';
import { isHumanEval } from '@utils/isHumanEval';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState, useTransition } from 'react';

import styles from './index.module.scss';
import TestRunSelector from './modules/TestRunSelector';
import TrendAnalysisByIssueTag from './modules/TrendAnalysisByIssueTag';
import TrendAnalysisByScore from './modules/TrendAnalysisByScore';
import { comparScores, filterOutNoOverlap, Filters } from './utils';

type SelectedReport = {
  report: TestRun;
  results: Result[] | null;
};

export default function Home() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const { addToastMsg } = useToastMessageContext();
  const { reports } = useReportsContext();
  const [selectedReports, setSelectedReports] = useState<SelectedReport[]>([]);
  const [loading, startTransition] = useTransition();

  const [globalFilters, setGlobalFilters] = useState<Filters | null>(null);

  const filteredData = useMemo(() => {
    if (!globalFilters || selectedReports.length === 1) return selectedReports;

    let filteredTestIds: string[] = [];
    if (globalFilters && !('better' in globalFilters)) {
      if (globalFilters.noOverlap) return selectedReports;
      filteredTestIds = [...filterOutNoOverlap(selectedReports)];
    } else {
      comparScores(selectedReports).map(({ group, testIds }) => {
        if (globalFilters.better && group === 'Better') filteredTestIds.push(...testIds);
        else if (globalFilters.same && group === 'Same') filteredTestIds.push(...testIds);
        else if (globalFilters.worse && group === 'Worse') filteredTestIds.push(...testIds);
        else if (globalFilters.noOverlap && group === 'No overlap') filteredTestIds.push(...testIds);
      });
    }
    return selectedReports.map((report) => ({
      ...report,
      results: report.results?.filter((d) => filteredTestIds.includes(d.testId)) ?? [],
    }));
  }, [selectedReports, globalFilters]);

  const selectReports = useCallback(
    (reports: SelectedReport[]) => {
      const reportsWOResults = reports.filter((d) => !d.results?.length).map((d) => d.report.runId);
      const promises = reportsWOResults.map((id) => getDashboardResult(id));
      Promise.all(promises)
        .then((results) => {
          setSelectedReports(() => {
            return reports.map((report) => {
              const index = reportsWOResults.indexOf(report.report.runId);
              return index > -1 ? { ...report, results: results[index] } : report;
            });
          });

          const params = new URLSearchParams(searchParams.toString());

          params.delete('report');

          if (reports.length > 0) {
            reports.forEach((r) => {
              params.append('report', r.report.runId);
            });
          }

          router.push(`?${params.toString()}`);
        })
        .catch((e) => {
          console.error(e);
          addToastMsg('error', 'Please try again or select another report', 'Failed to load report');
        });
    },
    [addToastMsg, router, searchParams],
  );

  useEffect(() => {
    const reportIds = searchParams.getAll('report');

    if (reportIds) {
      function fetchSelectedReports(ids: string[]) {
        startTransition(async () => {
          try {
            const reports = await Promise.all(
              ids.map(async (id) => {
                const [report, results] = await Promise.all([getDashboardRunningTest(id), getDashboardResult(id)]);
                return { report, results };
              }),
            );

            setSelectedReports((prev) => [...prev, ...reports]);
          } catch (e) {
            console.error(e);
            addToastMsg('error', 'Please try again or select another report', 'Failed to load report');
            router.push(pathname);
          }
        });
      }

      const notSelectedIds = reportIds.filter((id) => !selectedReports.find((r) => r.report.runId === id));

      if (notSelectedIds.length > 0) {
        fetchSelectedReports(notSelectedIds);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  useEffect(() => {
    if (selectedReports?.length < 2) setGlobalFilters(null);
    else
      setGlobalFilters(
        selectedReports?.length === 2
          ? {
              better: true,
              noOverlap: true,
              same: true,
              worse: true,
            }
          : { noOverlap: true },
      );
  }, [selectedReports?.length]);

  useEffect(() => {
    //when report is refreshed, update the data to be reloaded if there is any difference to the existing data
    const selectedReportIds = selectedReports.map((r) => r.report.runId!);
    const promises = selectedReportIds.map((id) => getDashboardResult(id));

    Promise.all(promises)
      .then((results) => {
        for (const index in results) {
          const result = results[index];
          const existingResults = selectedReports[index].results;
          if (!existingResults) return;

          for (let i = 0; i < existingResults.length; i++) {
            const target = existingResults[i];
            const curHumanEval = target.judgeResults?.find((d) => isHumanEval(d));
            const newHumanEval = result
              .find((d) => d.testId === target.testId)
              ?.judgeResults?.find((r) => isHumanEval(r));

            if (
              curHumanEval?.testScore !== newHumanEval?.testScore ||
              curHumanEval?.testJustification !== newHumanEval?.testJustification
            ) {
              if (newHumanEval) {
                if (!curHumanEval) target.judgeResults?.push(newHumanEval);
                else Object.assign(curHumanEval, newHumanEval);
              } else existingResults[i].judgeResults = target.judgeResults?.filter((d) => !isHumanEval(d));
            }
          }

          setSelectedReports(() => [...selectedReports]);
        }
      })
      .catch((e) => {
        console.error(e);
        addToastMsg('error', 'Please try again or select another report', 'Failed to load report');
      });
    // no need to re-run with selectedReports change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reports, addToastMsg]);

  return (
    <section className={`${containerStyles.container}  ${containerStyles.innerContainer}`}>
      {loading && <Loading />}
      <div className={styles.header}>
        <h2>
          Trend analysis{' '}
          <Tag type="green" size="sm">
            Beta
          </Tag>
        </h2>
        <p>Analytics dashboard to compare the test run results</p>
        <Button
          className={styles.old}
          kind="ghost"
          size="md"
          onClick={() => {
            router.push('/test-manager/issue-trend-analysis-old');
          }}
        >
          Open analysis per issue
        </Button>
      </div>
      <div className={styles.contents}>
        <div>
          <TestRunSelector selectedReports={selectedReports} selectReports={selectReports} />
        </div>
        <div className={styles.filterRow}>
          {globalFilters && (
            <div>
              <div>
                <h3>Data filter</h3>
                <span>Filter the data displayed on the page</span>
              </div>
              <div>
                {'better' in globalFilters && (
                  <>
                    <Checkbox
                      id="filter-better"
                      labelText="Better"
                      checked={globalFilters.better}
                      onChange={(_e, { checked }) => setGlobalFilters((prev) => ({ ...prev!, better: checked }))}
                    />
                    <Checkbox
                      id="filter-worse"
                      labelText="Worse"
                      checked={globalFilters.worse}
                      onChange={(_e, { checked }) => setGlobalFilters((prev) => ({ ...prev!, worse: checked }))}
                    />
                    <Checkbox
                      id="filter-same"
                      labelText="Same"
                      checked={globalFilters.same}
                      onChange={(_e, { checked }) => setGlobalFilters((prev) => ({ ...prev!, same: checked }))}
                    />
                  </>
                )}
                <Checkbox
                  id="filter-no-overlap"
                  labelText="No overlap"
                  checked={globalFilters.noOverlap}
                  onChange={(_e, { checked }) => setGlobalFilters((prev) => ({ ...prev!, noOverlap: checked }))}
                />
              </div>
            </div>
          )}
        </div>
        {!!selectedReports?.length && (
          <>
            <div className={styles.byScore}>
              <TrendAnalysisByScore selectedReports={filteredData} />
            </div>
            <TrendAnalysisByIssueTag selectedReports={filteredData} />
          </>
        )}
      </div>
    </section>
  );
}
