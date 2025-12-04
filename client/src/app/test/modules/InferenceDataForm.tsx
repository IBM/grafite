import { ContentSwitcher } from '@carbon/react';
import { Switch } from '@carbon/react';
import { SwitchEventHandlersParams } from '@carbon/react/lib/components/Switch/Switch';
import { MutableRefObject, useEffect, useRef, useState } from 'react';

import styles from '../new-test.module.scss';
import Chat, { ChatTestSchema } from './Chat/Chat';
import Freeform, { FreeformTestSchema } from './Freeform';
import { useTestDataContext } from './TestDataContext';

/**
 *
 * The step has temporary data of chat (chatData) and freeform (freeformData)
 * Only the data of currently focused tab is saved as the test data
 * The test data update triggered by tab change happens in this component
 *
 */
const InferenceDataForm = ({
  updatePromptWFeedback,
  chatData,
  freeformData,
  isInitiated,
  initiate,
}: {
  updatePromptWFeedback: MutableRefObject<((value: string) => void) | null>;
  chatData: MutableRefObject<ChatTestSchema>;
  freeformData: MutableRefObject<FreeformTestSchema>;
  isInitiated: boolean;
  initiate: () => void;
}) => {
  const { testInfo, updateTest } = useTestDataContext();
  const [isChatMode, setChatMode] = useState<boolean>(!testInfo?.prompt);
  const [dataLoading, setDataLoading] = useState<boolean>(true); //render the UI after value assign
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  // Reset the test context's current mode data except the desired output
  // Desired output is shared value between the modes to reduce model inferece number
  const changeMode = (name: string) => {
    const isChatMode = name === 'chat';
    if (isChatMode) {
      updateTest('prompt', ''); //remove freeform data

      //add chat data from chat data ref
      updateTest('messages', chatData.current.messages);
      updateTest('sampleOutput', chatData.current.sampleOutput);
    } else {
      updateTest('messages', null); //remove chat data

      //add freeform data from freeform data ref
      updateTest('prompt', freeformData.current.prompt); //remove freeform data
      updateTest('sampleOutput', freeformData.current.sampleOutput);
    }

    setChatMode(isChatMode);
  };

  //pass the function to use on IssueLeftSidbar
  updatePromptWFeedback.current = (value: string) => {
    //change the mode to freeform to indicate user the update
    if (isChatMode) changeMode('freeform');

    //update test data
    updateTest('prompt', value);
    freeformData.current.prompt = value;

    // fill the input
    const wrapper = wrapperRef.current;
    setTimeout(() => {
      if (wrapper) {
        const input = wrapper.querySelector('#input_prompt-text');
        if (input) {
          (input as HTMLTextAreaElement).value = value;
          (input as HTMLTextAreaElement).focus();
        }
      }
    }, 300);
  };

  // initiate the data only when first come to the screen
  // initiating in this component to avoid render glitch due to the event orders
  useEffect(() => {
    if (!isInitiated) {
      if (!!freeformData && !!testInfo.prompt) {
        freeformData.current.prompt = testInfo.prompt;
        freeformData.current.sampleOutput = testInfo.sampleOutput ?? '';
      }
      if (!!chatData && !testInfo.prompt) {
        chatData.current.messages = testInfo.messages || [];
        chatData.current.sampleOutput = testInfo.sampleOutput ?? '';
      }
      initiate();
    }
    setDataLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className={styles.inferenceFormWrapper} ref={wrapperRef}>
      <div className={`${styles.row} ${styles.sectionTitle} `}>
        <h4>Inference data</h4>
        <div className={styles.modeSwitcher}>
          <ContentSwitcher
            size="sm"
            onChange={(selectedItem: SwitchEventHandlersParams) => changeMode((selectedItem.name as string) || '')}
            selectedIndex={isChatMode ? 0 : 1}
          >
            <Switch name="chat" text="Chat" />
            <Switch name="freeform" text="Freeform" />
          </ContentSwitcher>
        </div>
      </div>
      {!dataLoading && <>{isChatMode ? <Chat chatData={chatData} /> : <Freeform freeformData={freeformData} />}</>}
    </div>
  );
};

export default InferenceDataForm;
