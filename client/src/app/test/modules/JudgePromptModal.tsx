import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import styles from '../new-test.module.scss';
import { Modal, InlineNotification } from '@carbon/react';

const JudgePromptModal = ({
  open,
  close,
  judgeTemplate,
}: {
  open: boolean;
  close: () => void;
  judgeTemplate: string | null;
}) => {
  const [clientReady, setClientReady] = useState<boolean>(false);

  useEffect(() => {
    setClientReady(true);
  }, []);

  return (
    <>
      {clientReady &&
        createPortal(
          <Modal modalHeading="Judge prompt" passiveModal onRequestSubmit={close} open={open} onRequestClose={close}>
            <div className={styles.judgePrompt}>
              {judgeTemplate !== null ? (
                <p>{judgeTemplate}</p>
              ) : (
                <InlineNotification title="Judge prompt content not selected" lowContrast />
              )}
            </div>
          </Modal>,
          document.body,
        )}
    </>
  );
};

export default JudgePromptModal;
