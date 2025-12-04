import { InlineLoading, Search } from '@carbon/react';
import { Link } from '@carbon/react';
import { useSelectedIssueContext } from '@components/SelectedIssueContext';
import { useToastMessageContext } from '@components/ToastMessageContext';
import { getDashboardIssues, type Issue } from '@utils/getFunctions/getDashboardIssues';
import { ChangeEvent, useEffect, useRef, useState } from 'react';

import styles from './HomeActions.module.scss';

const HomeActions = ({ issueList, addIssues }: { issueList?: Issue[]; addIssues: (issueList: Issue[]) => void }) => {
  const { addToastMsg } = useToastMessageContext();
  const { selectIssue } = useSelectedIssueContext();
  const [isLoading, setLoading] = useState<boolean>(true);
  const [searchInit, setSearchInit] = useState<boolean>(false); //to avoid user waiting for initial load, display loading before init
  const [filteredIssues, setFilteredIssues] = useState<Issue[]>([]);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const handleSearchInput = (e: ChangeEvent) => {
    if (debounceRef.current !== null) debounceRef.current = null;

    debounceRef.current = setTimeout(() => {
      const keyword = (e.target as HTMLInputElement).value?.toLowerCase();
      searchByKeyword(keyword);
    }, 300);
  };

  const searchByKeyword = (keyword: string) => {
    setSearchInit(keyword?.length > 0);

    if (keyword?.length < 3) {
      setFilteredIssues(() => []);
      return;
    }

    if (!!issueList) {
      const result = issueList?.filter((d) => !!d.title && d.title.toLowerCase().includes(keyword)) || [];

      setFilteredIssues(() => [...result]);
    }
  };

  const reset = (validate?: boolean) => {
    let clear = true;
    if (validate) {
      const wrapper = wrapperRef.current;
      if (wrapper) {
        const input = wrapper.querySelector('input');
        if (!!input?.value) clear = false;
      }
    }
    if (clear) {
      setTimeout(() => {
        setFilteredIssues(() => []);
        setSearchInit(false);
      }, 0);
    }
  };

  useEffect(() => {
    getDashboardIssues()
      .then((issues) => addIssues(issues))
      .catch((e) => addToastMsg(e.status, e.message, 'Failed to retrieve issue list'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!issueList) return;

    //if search already initiated before the data loaded, perform initlal search
    const keyword = wrapperRef.current?.querySelector('#issue-search');

    if ((keyword as HTMLInputElement)?.value) {
      if (debounceRef.current !== null) debounceRef.current = null;
      searchByKeyword((keyword as HTMLInputElement).value);
    }
  }, [issueList]);

  return (
    <div ref={wrapperRef}>
      <div className={styles.row}>
        <h3>Open a new test</h3>
        <Link disabled>Use external source</Link>
      </div>
      <div className={styles.search}>
        <Search
          labelText="Search issue"
          id="issue-search"
          onBlur={() => reset(true)}
          onChange={handleSearchInput}
          placeholder="Search issue by title"
          isExpanded
        />
        {filteredIssues && (
          <div className={styles.searchResult}>
            {isLoading ? (
              <>
                {searchInit && (
                  <button disabled>
                    <InlineLoading description="searching..." />
                  </button>
                )}
              </>
            ) : (
              <>
                {filteredIssues.map((issue) => (
                  <button
                    key={`search_issue_${issue.id}`}
                    onClick={() => {
                      selectIssue(issue.id!);
                      reset();
                    }}
                  >
                    {issue.title}
                  </button>
                ))}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
export default HomeActions;
