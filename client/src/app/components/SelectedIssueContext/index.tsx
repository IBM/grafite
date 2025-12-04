import { createContext, ReactElement, useCallback, useContext, useState } from 'react';

type SelectedIssueContextProps = {
  selectedIssueId: string | undefined;
  selectIssue: (id: string) => void;
};

export type Validator = {
  judgeType: string | null;
  judgeGuidelines: string;
  testIds: string[];
};

const SelectedIssueContext = createContext<SelectedIssueContextProps>({
  selectedIssueId: undefined,
  selectIssue: (_id: string) => {},
});

export const useSelectedIssueContext = () => useContext(SelectedIssueContext);

const SelectedIssueContextProvider = ({ children }: { children: ReactElement }) => {
  const [selectedIssueId, setSelectedIssueID] = useState<string | undefined>(undefined);

  const selectIssue = useCallback((id: string) => {
    setSelectedIssueID(id);
  }, []);

  return (
    <SelectedIssueContext.Provider
      value={{
        selectedIssueId,
        selectIssue,
      }}
    >
      {children}
    </SelectedIssueContext.Provider>
  );
};

export default SelectedIssueContextProvider;
