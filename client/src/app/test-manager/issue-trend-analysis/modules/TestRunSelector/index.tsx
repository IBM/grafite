import { Button } from '@carbon/react';
import { IconButton } from '@carbon/react';
import { Add, Close, DocumentAdd } from '@carbon/react/icons';
import TestRunSelectorModal from '@modules/TestRunSelectorModal';
import { SelectedReport } from '@test-manager/issue-trend-analysis-old/[id]/utils';
import { type TestRun } from '@utils/getFunctions/getDashboardRunningTests';
import { Fragment, useState } from 'react';

import ReportUploadModal from '../ReportUploadModal/ReportUploadModal';
import styles from './TestRunSelector.module.scss';

type Props = {
  selectedReports: SelectedReport[];
  selectReports: (reports: SelectedReport[]) => void;
};

const TestRunSelector = ({ selectedReports, selectReports }: Props) => {
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [uploadOpen, setUploadOpen] = useState<boolean>(false);

  const addUploadedReports = (uploaded: SelectedReport[]) => {
    const existIds = selectedReports.map((d) => d.report.id);
    selectReports([...selectedReports, ...uploaded.filter((u) => !existIds.includes(u.report.id))]);
    setUploadOpen(false);
  };

  const selectTestRuns = (testRuns: TestRun[]) => {
    const existReportIds = selectedReports.map((d) => d.report.id);
    const existReports = selectedReports.filter((d) => testRuns.find((run) => run.id === d.report.id));
    const newSelectedReports: SelectedReport[] = [
      ...existReports,
      ...testRuns.filter((d) => !existReportIds.includes(d.id)).map((run) => ({ report: run, results: [] })),
    ];

    selectReports(newSelectedReports);
    setModalOpen(false);
  };

  const deselectTestRun = (id: string) => {
    const newSelectedReports = selectedReports.filter((d) => d.report.id !== id);
    selectReports(newSelectedReports);
  };

  return (
    <div className={styles.root}>
      {selectedReports.map((d, i) => (
        <Fragment key={`selected_${d.report.id}`}>
          {i > 0 && <div className={styles.divider}></div>}
          <ReportCard index={i} report={d.report} deselect={deselectTestRun} />
        </Fragment>
      ))}
      {!selectedReports.length && <span className={styles.empty}>Select reports to start analysis</span>}
      {!selectedReports.length ? (
        <>
          <Button kind="ghost" size="sm" onClick={() => setModalOpen(true)}>
            Select reports
          </Button>
          <Button kind="ghost" size="sm" onClick={() => setUploadOpen(true)}>
            Upload reports
          </Button>
        </>
      ) : (
        <div className={styles.addBtn}>
          <IconButton
            label="Select more reports"
            kind="secondary"
            onClick={() => setModalOpen(true)}
            size="sm"
            autoAlign
          >
            <Add />
          </IconButton>
          <IconButton label="Upload reports" kind="secondary" onClick={() => setUploadOpen(true)} size="sm" autoAlign>
            <DocumentAdd />
          </IconButton>
        </div>
      )}
      <TestRunSelectorModal
        open={modalOpen}
        close={() => {
          setModalOpen(false);
        }}
        submit={selectTestRuns}
        defaultSelectedReports={selectedReports}
      />
      <ReportUploadModal
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onAdd={addUploadedReports}
        existingFilenames={selectedReports.filter((d) => d.uploaded).map((d) => d.report.modelId)}
      />
    </div>
  );
};

const ReportCard = ({
  report,
  deselect,
  index,
}: {
  report: SelectedReport['report'];
  deselect: (id: string) => void;
  index: number;
}) => {
  return (
    <div className={styles.reportCard}>
      <div className={styles.letter}>
        <span>{String.fromCharCode(65 + index)}</span>
      </div>
      <div className={styles.info}>
        <div>{report.modelId}</div>
        <div className={styles.runId}>({report.runId})</div>
        <div className={styles.description} title={report.description}>
          {report.description}
        </div>
      </div>
      <IconButton
        size="sm"
        kind="ghost"
        onClick={() => {
          deselect(report.id || '');
        }}
        label="Close"
      >
        <Close />
      </IconButton>
    </div>
  );
};

export default TestRunSelector;
