import { createContext, ReactElement, useCallback, useContext, useEffect, useState } from 'react';

import { getDashboardIssues, type Issue } from '@utils/getFunctions/getDashboardIssues';
import { useToastMessageContext } from '@components/ToastMessageContext';

type IssuesContextType = {
  issues: Issue[] | null;
  loading: boolean;
  reset: () => void;
  fetchIssues: () => Promise<void>;
};

const IssuesContext = createContext<IssuesContextType>({
  issues: null,
  loading: false,
  reset: () => {},
  fetchIssues: async () => {},
});

export const useIssuesContext = () => useContext(IssuesContext);

export const IssuesContextProvider = ({ children }: { children: ReactElement }) => {
  const { addToastMsg } = useToastMessageContext();

  const [issues, setIssues] = useState<Issue[] | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const reset = () => {
    setIssues(null);
  };

  const fetchIssues = useCallback(async () => {
    setLoading(true);

    return getDashboardIssues()
      .then((issues) => {
        setIssues(issues);
      })
      .catch((e) => {
        addToastMsg('error', e.toString(), 'Failed to fetch issues');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [setIssues, addToastMsg]);

  useEffect(() => {
    if (!issues) fetchIssues();
  }, []);

  return <IssuesContext.Provider value={{ issues, loading, reset, fetchIssues }}>{children}</IssuesContext.Provider>;
};
