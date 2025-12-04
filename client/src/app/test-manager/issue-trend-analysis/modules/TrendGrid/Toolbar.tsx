import { Information } from '@carbon/react/icons';
import { useIssuesContext } from '@modules/IssuesContext';
import { useTestContext } from '@modules/TestContext';
import { useReportsContext } from '@test-manager/ReportsContext';
import AgGridToolbar from '@utils/ag-grid/AgGridToolbar';
import { AgGridReact } from 'ag-grid-react';
import { memo, RefObject, useCallback } from 'react';

import localStyles from './TrendGrid.module.scss';

const Toolbar = memo(function Toolbar({
  gridRef,
  selectedReportLoading,
}: {
  gridRef: RefObject<AgGridReact>;
  selectedReportLoading: boolean;
}) {
  const { fetchIssues, loading: issueLoading } = useIssuesContext();
  const { fetchTests, loading: testLoading } = useTestContext();
  const { fetchReports } = useReportsContext();

  const info = 'Unlike this table, the charts above use binary scores (1 if > 0.5)';
  const title = (
    <div className={`cds--cc--title ${localStyles.title}`}>
      <p className="title" role="heading" aria-level={2}>
        Data
      </p>
      <span className={localStyles.info} title={info}>
        <Information /> {info}
      </span>
    </div>
  );

  const search = useCallback(
    (keyword: string) => {
      gridRef.current?.api.setGridOption('quickFilterText', keyword);
    },
    [gridRef],
  );

  const refresh = () => {
    fetchTests();
    fetchIssues();
    fetchReports();
  };

  return (
    <AgGridToolbar
      search={search}
      refresh={refresh}
      loading={testLoading || issueLoading || selectedReportLoading}
      title={title}
    />
  );
});

export default Toolbar;
