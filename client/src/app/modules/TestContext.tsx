import { useToastMessageContext } from '@components/ToastMessageContext';
import { getDashboardTests, Test } from '@utils/getFunctions/getDashboardTests';
import { createContext, ReactElement, useCallback, useContext, useEffect, useState } from 'react';

type TestContextType = {
  tests: Test[] | null;
  loading: boolean;
  updateTests: (tests: Test[]) => void;
  reset: () => void;
  fetchTests: () => void;
};

const TestContext = createContext<TestContextType>({
  tests: null,
  loading: false,
  updateTests: (_tests: Test[]) => {},
  reset: () => {},
  fetchTests: () => {},
});

export const useTestContext = () => useContext(TestContext);

export const TestContextProvider = ({ children }: { children: ReactElement }) => {
  const { addToastMsg } = useToastMessageContext();
  const [tests, setTests] = useState<Test[] | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const updateTests = (tests: Test[]) => {
    setTests(tests);
  };

  const reset = () => {
    setTests(null);
  };

  const fetchTests = useCallback(() => {
    setLoading(true);
    getDashboardTests()
      .then((tests) => {
        setTests(tests);
      })
      .catch((e) => {
        console.error(e);
        addToastMsg('error', e.toString(), 'Failed to fetch tests');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [getDashboardTests, addToastMsg]);

  useEffect(() => {
    fetchTests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <TestContext.Provider value={{ tests, loading, updateTests, reset, fetchTests }}>{children}</TestContext.Provider>
  );
};
