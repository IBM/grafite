import { RefObject, SyntheticEvent, useRef, useState } from 'react';
import { TextArea } from '@carbon/react';
import { Information } from '@carbon/react/icons';
import LabelledItem from '@components/LabelledItem';
import styles from '../new-test.module.scss';
import FlaggedOutput from './FlaggedOutput';
import DesiredOutput from './DesiredOutput';
import { useTestDataContext } from './TestDataContext';
import { Test } from '@utils/getFunctions/getDashboardTests';
import { DesiredOutputSourceType } from '@api/dashboard/tests/utils';

export type FreeformTestSchema = {
  prompt: string;
  sampleOutput: string;
};
const Freeform = ({ freeformData }: { freeformData: RefObject<FreeformTestSchema> }) => {
  const { testInfo, updateTest } = useTestDataContext();
  const [isStale, setStale] = useState<boolean>(false); //to display the output's stale status
  const promptRef = useRef<HTMLTextAreaElement | null>(null);

  const resetStale = () => {
    setStale(false);
  };

  const updateData = (e: SyntheticEvent, label: string) => {
    const value = (e.target as HTMLTextAreaElement).value;
    if (freeformData.current) freeformData.current[label as keyof FreeformTestSchema] = value;
    updateTest(label as keyof Test, value);
  };

  return (
    <>
      <TextArea
        labelText="Prompt text"
        id="input_prompt-text"
        ref={promptRef}
        className={styles.freeFormInput}
        defaultValue={freeformData.current?.prompt}
        onBlur={(e: SyntheticEvent<HTMLTextAreaElement>) => {
          updateData(e, 'prompt');
        }}
        rows={6}
        onChange={() => {
          setStale(true);
        }}
        helperText={
          <div className={styles.freeformInfoRow}>
            <Information />
            <span>
              System prompt and token must be provided during freeform generation. Please use Chat mode to use the
              default system prompt.
            </span>
          </div>
        }
      />
      <div className={`${styles.row} ${styles.formRow}`}>
        <LabelledItem id="sample-model-output" label="Model response">
          <FlaggedOutput
            defaultValue={freeformData.current?.sampleOutput || ''}
            blurHandler={(e: SyntheticEvent<HTMLTextAreaElement>) => updateData(e, 'sampleOutput')}
            promptRef={promptRef}
            stale={isStale}
            staleHandler={resetStale}
          />
        </LabelledItem>

        <LabelledItem id="desired-output" label="Desired output">
          <DesiredOutput
            blurHandler={(e: SyntheticEvent<HTMLTextAreaElement>) => updateData(e, 'desiredOutput')}
            promptRef={promptRef}
            minRows={18}
            defaultValue={testInfo.desiredOutput ?? ''}
            defaultLabel={testInfo.desiredOutputSource as DesiredOutputSourceType}
            updateLabel={(value: DesiredOutputSourceType) => {
              updateTest('desiredOutputSource', value);
            }}
          />
        </LabelledItem>
      </div>
    </>
  );
};
export default Freeform;
