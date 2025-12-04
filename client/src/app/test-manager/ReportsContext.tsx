import { useToastMessageContext } from '@components/ToastMessageContext';
import { APICallError } from '@types';
import { getDashboardRunningTests, type TestRun } from '@utils/getFunctions/getDashboardRunningTests';
import { createContext, ReactElement, useCallback, useContext, useState } from 'react';

type ReportsContextType = {
  reports: TestRun[] | null;
  fetchReports: () => void;
  loading: boolean;
};

const ReportsContext = createContext<ReportsContextType>({ reports: null, fetchReports: () => {}, loading: true });

export const useReportsContext = () => useContext(ReportsContext);

export const ReportsContextProvider = ({ children }: { children: ReactElement }) => {
  const { addToastMsg } = useToastMessageContext();

  const [reports, setReports] = useState<TestRun[] | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchReports = useCallback(() => {
    setLoading(true);

    getDashboardRunningTests()
      .then((res) => setReports(res.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())))
      .catch((error: APICallError) => addToastMsg(error.status, error.message, 'Failed to get reports'))
      .finally(() => setLoading(false));
  }, [addToastMsg]);

  return <ReportsContext.Provider value={{ reports, fetchReports, loading }}>{children}</ReportsContext.Provider>;
};
