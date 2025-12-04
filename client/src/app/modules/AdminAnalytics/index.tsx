import { useState } from 'react';
import styles from './AdminAnalytics.module.scss';
import { SelectedReport } from '@test-manager/issue-trend-analysis-old/[id]/utils';
import { IssuePassRate } from '@modules/utils';
import { useIssuesContext } from '@modules/IssuesContext';
import { groupTestRunResultByIssues } from '@utils/reportProcessors';
import { IconButton } from '@carbon/react';
import { Analytics } from '@carbon/react/icons';
import Sidebar from './Sidebar';
import TestRunSelector from './TestRunSelector';

interface Props {
  setIssuePassRates: (issuePassRates: IssuePassRate[]) => void;
  issuePassRates: IssuePassRate[];
  setSelectedReportsMetadata: (reports: { modelId: string; runId: string }[]) => void;
}

const AdminAnalytics = ({ issuePassRates, setIssuePassRates, setSelectedReportsMetadata }: Props) => {
  const { issues } = useIssuesContext();
  const [expanded, setExpanded] = useState<boolean>(false);
  const [selectedReports, _setSelectedReports] = useState<SelectedReport[]>([]);
  const [selectorModalOpen, _setSelectorModalOpen] = useState<boolean>(false);

  const setSelectorModalOpen = (isOpen: boolean) => {
    _setSelectorModalOpen(isOpen);
  };
  const deselctReport = (runId: string) => {
    const newList = selectedReports.filter((report) => report.report.runId !== runId);
    _setSelectedReports(newList);
    setSelectedReportsMetadata(newList.map(({ report }) => ({ runId: report.runId, modelId: report.modelId })));
  };

  const selectReports = (selectedReports: SelectedReport[]) => {
    _setSelectedReports(selectedReports);
    setSelectedReportsMetadata(selectedReports.map(({ report }) => ({ runId: report.runId, modelId: report.modelId })));

    const newIssuePassRates = [...issuePassRates];
    const selectedTestRuns = issuePassRates.map((d) => d.testRunResults?.[0]?.runId);

    if (!issues) return [];
    for (const selectedReport of selectedReports.filter((report) => !selectedTestRuns.includes(report.report.runId))) {
      const { modelId, runId } = selectedReport.report;

      const testResults = groupTestRunResultByIssues(issues, selectedReport.results || []);
      for (const result of testResults) {
        const { issueId, passedTestTotal, testTotal, tests } = result;
        const target = newIssuePassRates.find((rate) => rate.issueId === issueId);
        if (target) {
          if (!target.testRunResults) target.testRunResults = [];
          if (target.testRunResults)
            target.testRunResults.push({
              modelId,
              runId,
              passedTestTotal,
              testTotal,
              tests,
            });
        } else {
          newIssuePassRates.push({
            issueId,
            testRunResults: [
              {
                modelId,
                runId,
                passedTestTotal,
                testTotal,
                tests,
              },
            ],
          });
        }
      }
    }
    setIssuePassRates(newIssuePassRates);
  };

  return (
    <div className={styles.root}>
      {!expanded && (
        <div className={styles.cta}>
          <IconButton
            kind="secondary"
            label="Trend analysis"
            align="left"
            onClick={() => {
              setExpanded(true);
            }}
          >
            <Analytics />
          </IconButton>
        </div>
      )}
      {expanded && (
        <Sidebar
          close={() => {
            setExpanded(false);
          }}
          selectedReports={selectedReports}
          openSelectorModal={() => setSelectorModalOpen(true)}
          deselectReport={deselctReport}
        />
      )}
      <TestRunSelector
        selectedReports={selectedReports}
        setSelectedReports={selectReports}
        setSelectorModalOpen={setSelectorModalOpen}
        selectorModalOpen={selectorModalOpen}
      />
    </div>
  );
};

export default AdminAnalytics;
