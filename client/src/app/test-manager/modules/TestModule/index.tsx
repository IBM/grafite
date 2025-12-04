import DetailsModal from '@modules/DetailsModal';
import { useIssuesContext } from '@modules/IssuesContext';
import { useTestContext } from '@modules/TestContext';
import TestTable from '@test-manager/modules/TestTable';
import { Test } from '@utils/getFunctions/getDashboardTests';
import { useEffect, useState } from 'react';

const TestModule = ({ filterPending }: { filterPending?: boolean }) => {
  const { tests, loading: testLoading } = useTestContext();
  const { issues, loading: issueLoading } = useIssuesContext();

  const [displayedTests, setDisplayedTests] = useState<Test[] | null>(null);
  const [selectedDetail, setSelectedDetail] = useState<{ type: 'issue' | 'test'; id: string } | null>(null);

  useEffect(() => {
    if (tests) setDisplayedTests(filterPending ? tests.filter((d) => !d.approved && d.readyForReview) : tests);
  }, [filterPending, tests]);

  return (
    <>
      <TestTable
        tests={displayedTests}
        issues={issues}
        dataLoading={testLoading || issueLoading}
        selectDetail={(id: string, type: 'issue' | 'test') => {
          setSelectedDetail({ id, type });
        }}
      />
      {selectedDetail && (
        <DetailsModal type={selectedDetail.type} id={selectedDetail.id} closeModal={() => setSelectedDetail(null)} />
      )}
    </>
  );
};

export default TestModule;
