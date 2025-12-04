import { IconButton } from '@carbon/react';
import { Add, Analytics, Close } from '@carbon/react/icons';
import { SelectedReport } from '@test-manager/issue-trend-analysis-old/[id]/utils';

import styles from './Sidebar.module.scss';

interface Props {
  close: () => void;
  selectedReports: SelectedReport[];
  openSelectorModal: () => void;
  deselectReport: (runId: string) => void;
}
const Sidebar = ({ close, selectedReports, openSelectorModal, deselectReport }: Props) => {
  return (
    <section className={styles.panel}>
      <div className={styles.header}>
        <div>
          <span className={styles.label}>Admin only</span>
          <div className={styles.row}>
            <span>Trend analysis</span>
            <Analytics />
          </div>
        </div>
        <IconButton kind="ghost" label="Close" size="md" align="left" onClick={close}>
          <Close />
        </IconButton>
      </div>
      <div className={styles.description}>
        Select reports to display the <strong>pass rate</strong> per model in the table
      </div>
      <div className={styles.actions}>
        {selectedReports.map(({ report: { runId, modelId } }) => (
          <button
            key={runId}
            onClick={() => {
              deselectReport(runId);
            }}
          >
            <div>
              <div className={styles.model}>{modelId}</div>
              <div className={styles.id}>({runId})</div>
            </div>
            <Close />
          </button>
        ))}
        <IconButton kind="ghost" size="sm" label="add" className={styles.addBtn} onClick={openSelectorModal}>
          <Add />
        </IconButton>
      </div>
    </section>
  );
};
export default Sidebar;
