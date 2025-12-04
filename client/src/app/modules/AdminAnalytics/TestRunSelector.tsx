import { useToastMessageContext } from '@components/ToastMessageContext';
import TestRunSelectorModal from '@modules/TestRunSelectorModal';
import { SelectedReport } from '@test-manager/issue-trend-analysis-old/[id]/utils';
import { getDashboardResult } from '@utils/getFunctions/getDashboardResult';
import { TestRun } from '@utils/getFunctions/getDashboardRunningTests';

interface Props {
  selectedReports: SelectedReport[];
  setSelectedReports: (reports: SelectedReport[]) => void;
  selectorModalOpen: boolean;
  setSelectorModalOpen: (isOpen: boolean) => void;
}
const TestRunSelector = ({ selectedReports, setSelectedReports, selectorModalOpen, setSelectorModalOpen }: Props) => {
  const { addToastMsg } = useToastMessageContext();

  const selectTestRuns = (testRuns: TestRun[]) => {
    const existReportIds = selectedReports.map((d) => d.report.id);
    const existReports = selectedReports.filter((d) => testRuns.find((run) => run.id === d.report.id));
    const reports: SelectedReport[] = [
      ...existReports,
      ...testRuns.filter((d) => !existReportIds.includes(d.id)).map((run) => ({ report: run, results: [] })),
    ];

    const reportsWOResults = reports.filter((d) => !d.results?.length).map((d) => d.report.runId);
    const promises = reportsWOResults.map((id) => getDashboardResult(id));
    Promise.all(promises)
      .then((results) => {
        const selectedReports = reports.map((report) => {
          const index = reportsWOResults.indexOf(report.report.runId);
          return index > -1 ? { ...report, results: results[index] } : report;
        });
        setSelectedReports(selectedReports);
      })
      .catch((e) => {
        console.error(e);
        addToastMsg('error', 'Please try again or select another report', 'Failed to load report');
      });
    setSelectorModalOpen(false);
  };

  return (
    <TestRunSelectorModal
      open={selectorModalOpen}
      close={() => {
        setSelectorModalOpen(false);
      }}
      defaultSelectedReports={selectedReports}
      submit={selectTestRuns}
      comparisonMode={false}
    />
  );
};

export default TestRunSelector;
