import { Modal } from '@carbon/react';
import styles from './DesiredOutput.module.scss';

const PromptPreview = ({ isOpen, prompt, close }: { isOpen: boolean; prompt: string; close: () => void }) => {
  return (
    <Modal modalHeading="Preview Prompt" open={isOpen} onRequestClose={close} passiveModal>
      <div>Your prompt is encoded into tokens which the desired output model understands.</div>
      <div className={styles.prompt}>
        {!!prompt ? <p>{prompt}</p> : <span className={styles.empty}>Empty prompt provided</span>}
      </div>
    </Modal>
  );
};

export default PromptPreview;
