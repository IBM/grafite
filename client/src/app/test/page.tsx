'use client';

import { Button, Loading } from '@carbon/react';
import { ArrowLeft, ArrowRight } from '@carbon/react/icons';
import { useSelectedIssueContext } from '@components/SelectedIssueContext';
import { useIssuesContext } from '@modules/IssuesContext';
import { getConnectedTests } from '@test/utils';
import { type Test } from '@utils/getFunctions/getDashboardTests';
import { mapMessagesToStr } from '@utils/mapMessagesToStr';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useMemo, useRef, useState } from 'react';

import { ChatTestSchema } from './modules/Chat/Chat';
import { FreeformTestSchema } from './modules/Freeform';
import InferenceDataForm from './modules/InferenceDataForm';
import IssueLeftSidebar from './modules/IssueLeftSidebar';
import TestDataContextProvider, { useTestDataContext } from './modules/TestDataContext';
import TestRightSidebar from './modules/TestRightSidebar';
import ValidatorSettingForm from './modules/ValidatorSettingForm';
import styles from './new-test.module.scss';
import TestHeader from './TestHeader';

export default function Test() {
  return (
    <Suspense fallback={<Loading withOverlay />}>
      <NewTest />
    </Suspense>
  );
}

function NewTest() {
  const searchParams = useSearchParams();
  const id = searchParams.get('id');

  return (
    <TestDataContextProvider id={id}>
      <Steps />
    </TestDataContextProvider>
  );
}

const Steps = () => {
  const { isLoading, updateValidationTestData } = useTestDataContext();
  const { selectedIssueId } = useSelectedIssueContext();
  const { issues } = useIssuesContext();
  const [step, setStep] = useState<number>(0);
  const [renderTrigger, setRenderTrigger] = useState<boolean>(false); //rerender right sidebar

  const [pageLoading, setPageLoading] = useState<boolean>(true);
  const [openedTests, setOpenedTests] = useState<Test[]>([]);

  const updatePromptWFeedback = useRef<((value: string) => void) | null>(null); //track desired output baked prompt to display the modal on the top layer
  const [isInitiated, setIsInitiated] = useState<boolean>(false); //indicator for data initiation to the temp storage below

  //Inference data temporary storage
  const chatData = useRef<ChatTestSchema>({
    messages: [],
    sampleOutput: '',
  });

  const freeformData = useRef<FreeformTestSchema>({ prompt: '', sampleOutput: '' });

  const initiate = (value?: boolean) => {
    if (value === false) {
      chatData.current = {
        messages: [],
        sampleOutput: '',
      };
      freeformData.current = { prompt: '', sampleOutput: '' };
    }
    setIsInitiated(value ?? true);
  };

  const changeStep = (step: number) => {
    setStep(step);
  };
  const changeRenderTrigger = (status: boolean) => {
    setRenderTrigger(status);
  };

  const selectedIssue = useMemo(() => {
    setPageLoading(true);
    const issue = issues?.find((d) => d.id === selectedIssueId);
    setPageLoading(false);
    return issue;
  }, [issues, selectedIssueId]);

  useEffect(() => {
    //add other tests under the same issue to the validationTestData array
    if (!selectedIssue) {
      setOpenedTests([]);
      updateValidationTestData([]);
      return;
    }
    (async () => {
      const tests = await getConnectedTests(selectedIssue);
      setOpenedTests(tests);
      updateValidationTestData(
        tests.map((d) => ({
          id: d.id!,
          score: null,
          justification: '',
          prompt: (d.messages ? mapMessagesToStr(d.messages) : d.prompt) ?? '',
          sampleOutput: d.sampleOutput ?? '',
          desiredOutput: d.desiredOutput ?? '',
          isSelected: false,
        })),
      );
    })();
  }, [selectedIssue, updateValidationTestData]);

  return (
    <div className={styles.wrapper}>
      <TestHeader setRenderTrigger={changeRenderTrigger} initiate={initiate} />
      <section className={styles.main}>
        {isLoading ? (
          <Loading />
        ) : (
          <>
            <IssueLeftSidebar
              updatePromptWFeedback={updatePromptWFeedback}
              selectedIssue={selectedIssue}
              isLoading={pageLoading}
            />
            <div className={styles.contents}>
              {step === 0 && (
                <InferenceDataForm
                  updatePromptWFeedback={updatePromptWFeedback}
                  chatData={chatData}
                  freeformData={freeformData}
                  isInitiated={isInitiated}
                  initiate={initiate}
                />
              )}
              {step === 1 && <ValidatorSettingForm openedTests={openedTests} />}

              <div className={styles.actions}>
                {step === 0 && (
                  <Button
                    kind="ghost"
                    size="sm"
                    renderIcon={ArrowRight}
                    iconDescription="validator settings"
                    onClick={() => changeStep(1)}
                  >
                    Validator setting
                  </Button>
                )}
                {step === 1 && (
                  <Button
                    kind="ghost"
                    size="sm"
                    className={styles.reverse}
                    renderIcon={ArrowLeft}
                    iconDescription="validator settings"
                    onClick={() => changeStep(0)}
                  >
                    Inference data
                  </Button>
                )}
              </div>
            </div>
            <TestRightSidebar
              step={step}
              changeStep={changeStep}
              renderTrigger={renderTrigger}
              setRenderTrigger={changeRenderTrigger}
            />
          </>
        )}
      </section>
    </div>
  );
};
