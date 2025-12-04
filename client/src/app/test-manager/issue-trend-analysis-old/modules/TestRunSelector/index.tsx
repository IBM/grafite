import { useState } from 'react';
import styles from './TestRunSelector.module.scss';
import { SelectedReport } from '@test-manager/issue-trend-analysis-old/[id]/utils';
import { Button, DismissibleTag } from '@carbon/react';
import TestRunSelectorModal from '@modules/TestRunSelectorModal';
import { type TestRun } from '@utils/getFunctions/getDashboardRunningTests';
import { usePathname, useRouter } from 'next/navigation';

type Props = {
  selectedReports: SelectedReport[];
  selectReports: (reports: SelectedReport[]) => void;
};

const TestRunSelector = ({ selectedReports, selectReports }: Props) => {
  const router = useRouter();
  const pathname = usePathname();
  const [modalOpen, setModalOpen] = useState<boolean>(false);

  const deselectTestRun = (id: string) => {
    const newSelectedReports = selectedReports.filter((d) => d.report.id !== id);
    selectReports(newSelectedReports);
  };

  const routeTestRuns = (testRuns: TestRun[]) => {
    const newRoute = testRuns.map((d) => `run_id=${d.runId}`).join('&');
    router.push(`${pathname}?${newRoute}`);
    setModalOpen(false);
  };

  return (
    <div className={styles.root}>
      {selectedReports.map((d) => (
        <DismissibleTag
          onClose={() => deselectTestRun(d.report.id || '')}
          className={styles.selectedTag}
          key={`selected_${d.report.id}`}
          text={`${d.report.modelId}: ${d.report.runId}`}
          title="Dismiss"
        ></DismissibleTag>
      ))}
      {!selectedReports.length && <span className={styles.empty}>No report selected</span>}
      <Button kind="ghost" size="sm" onClick={() => setModalOpen(true)}>
        Select reports
      </Button>
      <TestRunSelectorModal
        open={modalOpen}
        close={() => {
          setModalOpen(false);
        }}
        submit={routeTestRuns}
        defaultSelectedReports={selectedReports}
      />
    </div>
  );
};

export default TestRunSelector;
