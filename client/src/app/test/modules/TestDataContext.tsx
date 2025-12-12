import { useSelectedIssueContext } from '@components/SelectedIssueContext';
import { useToastMessageContext } from '@components/ToastMessageContext';
import { useIsAdmin } from '@hooks/permissionHooks';
import { getDashboardTest, Test } from '@utils/getFunctions/getDashboardTests';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { createContext, ReactElement, useCallback, useContext, useEffect, useRef, useState } from 'react';

import TestHeader from '../TestHeader';
import { createEmptyTest, TestTableData, ValidationData } from '../utils';
import AccessRestricted from './AccessRestricted';

type TestDataContextProps = {
  testInfo: Test;
  validation: ValidationData;
  validationTestData: TestTableData[];
  isLoading: boolean;
  updateTest: (
    label: keyof Test | 'judgeType' | 'judgeGuidelines' | 'judgeTemplate',
    value: unknown,
    isAddition?: boolean,
  ) => void;
  discardEdits: () => void;
  removeTestValue: (label: keyof Test, value: unknown) => void;
  updateValidation: (type: string, value: string | number) => void;
  updateValidationTestData: (data: TestTableData[]) => void;
};

const TestDataContext = createContext<TestDataContextProps>({
  testInfo: createEmptyTest(),
  validation: { score: null, justification: '' },
  validationTestData: [],
  isLoading: true,
  updateTest: (_label: keyof Test | 'judgeType' | 'judgeGuidelines' | 'judgeTemplate', _value: unknown) => {},
  discardEdits: () => {},
  removeTestValue: (_label: keyof Test, _value: unknown) => {},
  updateValidation: (_type: string, _value: string | number) => {},
  updateValidationTestData: (_data: TestTableData[]) => {},
});

export const useTestDataContext = () => useContext(TestDataContext);

const TestDataContextProvider = ({ children, id }: { children: ReactElement; id: string | null }) => {
  const router = useRouter();
  const { data } = useSession();
  const { addToastMsg } = useToastMessageContext();
  const { selectIssue, selectedIssueId } = useSelectedIssueContext();

  const isAdmin = useIsAdmin();

  const [accessRestricted, setAccessRestricted] = useState<boolean>(false);
  const [isLoading, setLoading] = useState<boolean>(true);
  const testInfo = useRef<Test>(createEmptyTest(data?.user?.email ?? ''));
  //temp test data to validate the judge settings
  const [validationTestData, setValidationTestData] = useState<TestTableData[]>([]);

  const [validation, setValidation] = useState<ValidationData>({ score: null, justification: '' });

  const updateTest = useCallback(
    (label: keyof Test | 'judgeType' | 'judgeGuidelines' | 'judgeTemplate', value: unknown, isAddition?: boolean) => {
      if (label.includes('judge')) {
        if (!testInfo.current.validators?.[0]) {
          testInfo.current.validators = [
            {
              type: 'llmjudge',
              parameters: {
                judgeType: '',
                judgeGuidelines: '',
                judgeTemplate: '',
              },
            },
          ];
        }
        //@ts-expect-error left expression type cannot be specified
        testInfo.current.validators[0].parameters[label] = value;
        //@ts-expect-error key that's not the keyof Test is excluded from the above block
      } else if (isAddition && Array.isArray(testInfo.current[label])) {
        //@ts-expect-error left expression type cannot be specified
        testInfo.current[label] = [...testInfo.current[label], value];
      } else {
        //@ts-expect-error left expression type cannot be specified
        testInfo.current[label] = value;
      }
    },
    [],
  );

  // Below functions are for validation test data management
  const removeTestValue = (label: keyof Test, value: unknown) => {
    if (Array.isArray(testInfo.current[label])) {
      //@ts-expect-error used only for flag
      const valueIdx = testInfo.current[label].indexOf(value);
      if (valueIdx > -1)
        //@ts-expect-error left expression type cannot be specified
        testInfo.current[label] = [
          ...testInfo.current[label].slice(0, valueIdx),
          ...testInfo.current[label].slice(Number(valueIdx) + 1),
        ];
    } else {
      //@ts-expect-error left expression type cannot be specified
      testInfo.current[label] = '';
    }
  };

  const discardEdits = () => {
    setLoading(true);
    if (id) {
      getDashboardTest(id)
        .then((test) => {
          testInfo.current = { ...testInfo.current, ...test };
          if (!test.flags) testInfo.current.flags = [];
          if (test.messages) {
            //parse string into messages array
            try {
              const messages = test.messages;
              testInfo.current.messages = [...messages];
            } catch (e) {
              console.error(e);
              addToastMsg('error', 'Messages are in unexpected format', 'Failed to retrieve messages');
            }
          }
        })
        .catch((e) => {
          console.error(e);
          addToastMsg('error', 'Please refresh the page', 'Failed to reset the data');
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      testInfo.current = { ...createEmptyTest() };
      setTimeout(() => setLoading(false), 0);
    }
  };

  const updateValidation = (type: string, value: string | number) => {
    setValidation((prev) => ({ ...prev, [type]: value }));
  };

  const updateValidationTestData = useCallback((data: TestTableData[]) => {
    setValidationTestData(() => [...data]);
  }, []);

  useEffect(() => {
    if (id) {
      //if id exist, means editing the existing test
      getDashboardTest(id)
        .then((test) => {
          const committer = test.author.toLowerCase();
          if (!isAdmin && committer && data?.user?.email && !(committer === data.user.email.toLowerCase())) {
            //if the test is not created by the user, return to homepage
            setAccessRestricted(true);
          } else {
            testInfo.current = { ...testInfo.current, ...test };
            if (!test.flags) testInfo.current.flags = [];
            if (test.messages) {
              //parse string into messages array
              try {
                const messages = test.messages;
                testInfo.current.messages = [...messages];
              } catch (e) {
                console.error(e);
                addToastMsg('error', 'Messages are in unexpected format', 'Failed to retrieve messages');
              }
            }
          }
        })
        .then(() => selectIssue(testInfo.current.issueId))
        .catch((e) => addToastMsg(e.status, e.message, 'Failed to retrieve the test'))
        .finally(() => setLoading(false))
        .finally(() => {
          setLoading(false);
        });
    } else {
      //new test
      //redirect to home if no issue selected (coming directly to this url)
      if (!selectedIssueId) {
        router.replace('/');
      }
      if (selectedIssueId) {
        testInfo.current = { ...testInfo.current, issueId: selectedIssueId };
      }
      setLoading(false);
    }
  }, [id]);

  return (
    <TestDataContext.Provider
      value={{
        testInfo: testInfo.current,
        validation: validation,
        validationTestData: validationTestData,
        isLoading,
        updateTest,
        discardEdits,
        removeTestValue,
        updateValidation,
        updateValidationTestData,
      }}
    >
      {accessRestricted ? (
        <>
          <TestHeader setRenderTrigger={(_status: boolean) => {}} disabled />
          <AccessRestricted />
        </>
      ) : (
        <>{children}</>
      )}
    </TestDataContext.Provider>
  );
};

export default TestDataContextProvider;
