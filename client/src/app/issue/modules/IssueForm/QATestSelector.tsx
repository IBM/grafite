import TagsMultiSelectDropdown from '@components/TagsMultiSelectDropdown';
import { useTestContext } from '@modules/TestContext';
import { Test } from '@utils/getFunctions/getDashboardTests';
import { Dispatch, SetStateAction, useEffect } from 'react';
import { SelectorModal } from './SelectorModal';
import { DropdownSkeleton } from '@carbon/react';

import styles from './IssueForm.module.scss';
import { Issue } from '@utils/getFunctions/getDashboardIssues';

interface Props {
  issue: Issue | null | undefined;
  openedTests: Test[];
  setOpenedTests: Dispatch<SetStateAction<Test[]>>;
}

const QATestSelector = ({ issue, openedTests, setOpenedTests }: Props) => {
  const { tests } = useTestContext();

  useEffect(() => {
    if (issue?.id && tests)
      setOpenedTests(
        issue?.testIds ? issue.testIds.map((_id) => tests?.find((t) => t.id === _id)).filter((t) => !!t) : [],
      );
  }, [issue, tests]);

  return (
    <section>
      <h5>Opened Tests</h5>
      {tests ? (
        <div className={styles.selectorWrapper}>
          <TagsMultiSelectDropdown
            items={tests}
            titleText="QA Test IDs"
            selectedItems={openedTests}
            setSelectedItems={setOpenedTests}
            displayShortID
            type="test"
          />
          <SelectorModal items={tests} setSelectedItems={setOpenedTests} selectedItems={openedTests} type="test" />
        </div>
      ) : (
        <DropdownSkeleton />
      )}
    </section>
  );
};

export default QATestSelector;
