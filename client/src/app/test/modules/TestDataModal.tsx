import { SyntheticEvent, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import styles from '../new-test.module.scss';
import { Button, Modal, TextArea, TextAreaSkeleton } from '@carbon/react';
import LabelledItem from '@components/LabelledItem';
import FlaggedOutput from './FlaggedOutput';
import DesiredOutput from './DesiredOutput';
import { useTestDataContext } from './TestDataContext';
import { DesiredOutputSourceType } from '@api/dashboard/tests/utils';
import { SkeletonPlaceholder } from '@carbon/react';

const TestDataModal = ({
  open,
  close,
  bakedPrompt,
}: {
  open: boolean;
  close: (prompt_text?: string, model_output?: string, desired_output?: string) => void;
  bakedPrompt: string | null;
}) => {
  const [clientReady, setClientReady] = useState<boolean>(false);
  const { testInfo } = useTestDataContext();
  const testData = useRef<{
    prompt: string;
    sampleOutput: string;
    desiredOutput: string;
    desiredOutputSource: DesiredOutputSourceType;
  }>({ prompt: '', sampleOutput: '', desiredOutput: '', desiredOutputSource: DesiredOutputSourceType.HUMAN });
  const promptRef = useRef<HTMLTextAreaElement | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  const blurHandler = (e: SyntheticEvent<HTMLTextAreaElement>, label: string) => {
    const value = (e.target as HTMLTextAreaElement).value;
    testData.current[label as 'prompt' | 'sampleOutput' | 'desiredOutput'] = value;
  };

  const updateTextField = (prompt: string, modelOutput: string, desiredOutput: string) => {
    const promptInput = promptRef.current;
    if (promptInput) promptInput.value = prompt;

    const outputInput = wrapperRef.current
      ?.querySelector('#test-incorrect-model-output')
      ?.parentNode?.querySelector('textarea');
    if (outputInput) (outputInput as HTMLTextAreaElement).value = modelOutput;

    const desiredOutputInput = wrapperRef.current
      ?.querySelector('#test-desired-output')
      ?.parentNode?.querySelector('textarea');
    if (desiredOutputInput) (desiredOutputInput as HTMLTextAreaElement).value = desiredOutput;
  };
  const pullExistingTest = () => {
    testData.current.prompt = bakedPrompt || '';
    if (testInfo) {
      testData.current.sampleOutput = testInfo.sampleOutput ?? '';
      testData.current.desiredOutput = testInfo.desiredOutput ?? '';
      testData.current.desiredOutputSource = testInfo.desiredOutputSource as DesiredOutputSourceType;

      updateTextField(bakedPrompt || '', testInfo.sampleOutput ?? '', testInfo.desiredOutput ?? '');
    }
  };

  const closeModal = () => {
    const prompt = promptRef.current?.value || '';
    const modelOutput =
      wrapperRef.current
        ?.querySelector('#test-incorrect-model-output')
        ?.parentNode?.parentNode?.querySelector('textarea')?.value || '';
    const desiredOutput =
      wrapperRef.current?.querySelector('#test-desired-output')?.parentNode?.parentNode?.querySelector('textarea')
        ?.value || '';
    close(prompt, modelOutput, desiredOutput);
    updateTextField('', '', ''); //reset text field for future entry
    testData.current.desiredOutputSource = DesiredOutputSourceType.HUMAN;
  };

  useEffect(() => {
    setClientReady(true);
  }, []);

  return (
    <>
      {clientReady &&
        createPortal(
          <Modal
            modalHeading="Add test data for judge validation"
            size="lg"
            primaryButtonText="Add test data"
            preventCloseOnClickOutside
            onRequestSubmit={closeModal}
            open={open}
            onRequestClose={() => {
              close();
              updateTextField('', '', '');
            }}
          >
            {open ? (
              <div className={styles.inferenceFormWrapper} ref={wrapperRef}>
                <div className={styles.rightAction}>
                  <Button size="md" kind="ghost" onClick={pullExistingTest}>
                    Pull current test data
                  </Button>
                </div>
                <TextArea
                  labelText="Prompt text"
                  id="test-input_prompt_text"
                  onBlur={(e: SyntheticEvent<HTMLTextAreaElement>) => {
                    blurHandler(e, 'prompt_text');
                  }}
                  rows={6}
                  ref={promptRef}
                />

                <div className={`${styles.row} ${styles.formRow}`}>
                  <LabelledItem id="test-incorrect-model-output" label="Model response">
                    <FlaggedOutput
                      defaultValue={''}
                      blurHandler={(e: SyntheticEvent<HTMLTextAreaElement>) => blurHandler(e, 'model_output')}
                      promptRef={promptRef}
                    />
                  </LabelledItem>

                  {open ? (
                    <LabelledItem id="test-desired-output" label="Desired output">
                      <DesiredOutput
                        blurHandler={(e: SyntheticEvent<HTMLTextAreaElement>) => blurHandler(e, 'desired_output')}
                        promptRef={promptRef}
                        minRows={18}
                        defaultValue=""
                        defaultLabel={DesiredOutputSourceType.HUMAN}
                        updateLabel={(value: DesiredOutputSourceType) => {
                          testData.current.desiredOutputSource = value;
                        }}
                      />
                    </LabelledItem>
                  ) : (
                    <TextAreaSkeleton />
                  )}
                </div>
              </div>
            ) : (
              <SkeletonPlaceholder />
            )}
          </Modal>,
          document.body,
        )}
    </>
  );
};

export default TestDataModal;
