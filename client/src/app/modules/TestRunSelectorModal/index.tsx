'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { InlineLoading, DataTableSkeleton, Modal } from '@carbon/react';
import { useReportsContext } from '@test-manager/ReportsContext';
import RunTable from './RunTable';
import { SelectedReport } from '@test-manager/issue-trend-analysis-old/[id]/utils';
import { type TestRun } from '@utils/getFunctions/getDashboardRunningTests';
import styles from './TestRunSelectorModal.module.scss';

type Props = {
  open: boolean;
  close: () => void;
  submit: (reports: TestRun[]) => void;
  defaultSelectedReports: SelectedReport[];
  comparisonMode?: boolean;
};
const TestRunSelectorModal = ({ open, defaultSelectedReports, comparisonMode = true, close, submit }: Props) => {
  const { reports, loading, fetchReports } = useReportsContext();
  const [data, setData] = useState<TestRun[] | null>(copyReport(reports));
  const [selectedReports, setSelectedReports] = useState<TestRun[]>(
    defaultSelectedReports.map((report) => report.report),
  );
  const [isClientReady, setIsClientReady] = useState<boolean>(false);

  function copyReport(reports: TestRun[] | null) {
    if (reports) return JSON.parse(JSON.stringify(reports));
    return [];
  }

  useEffect(() => {
    if (reports) setData(copyReport(reports));
  }, [reports]);

  useEffect(() => {
    if (open) {
      fetchReports();
      setSelectedReports(defaultSelectedReports.map((report) => report.report));
    }
  }, [open]);

  useEffect(() => {
    setIsClientReady(true);
  }, []);

  const selectReport = (id: string) => {
    const target = data?.find((d) => id === d.id);
    if (target) setSelectedReports((prev) => [...prev, target]);
  };

  const deselectReport = (id: string) => {
    setSelectedReports((prev) => prev.filter((d) => d.id !== id));
  };

  if (!isClientReady) return null;
  return (
    <>
      {createPortal(
        <Modal
          size="lg"
          open={open}
          modalHeading={`Select reports`}
          primaryButtonText="Select reports"
          onRequestClose={close}
          onRequestSubmit={() => {
            submit(selectedReports);
          }}
          preventCloseOnClickOutside
        >
          {open && (
            <>
              <div
                className={`${styles.reportList} ${comparisonMode ? styles.comparisonMode : ''}`}
                id="report-list-selected"
              >
                <label htmlFor="report-list-selected">Selected models:</label>
                {selectedReports.map((report) => (
                  <div key={report.id}>{report.modelId}</div>
                ))}
              </div>
              <div className={styles.loading}>
                {loading && <InlineLoading description={`Fetching the latest data...`} />}
              </div>
              {data ? (
                <RunTable
                  reports={data}
                  defaultSelected={defaultSelectedReports}
                  select={selectReport}
                  deselect={deselectReport}
                />
              ) : (
                <DataTableSkeleton />
              )}
            </>
          )}
        </Modal>,
        document.body,
      )}
    </>
  );
};

export default TestRunSelectorModal;
