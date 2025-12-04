import { SyntheticEvent, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Modal, TextArea, TextAreaSkeleton } from '@carbon/react';
import styles from './Chat.module.scss';
import { Warning } from '@carbon/react/icons';

const SystemPromptModal = ({
  open,
  close,
  defaultValue,
  updateSystemPrompt,
  isEditable,
}: {
  open: boolean;
  close: () => void;
  defaultValue: string;
  updateSystemPrompt: (value: string) => void;
  isEditable: boolean;
}) => {
  const [clientReady, setClientReady] = useState<boolean>(false);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  const submit = () => {
    const input = inputRef.current;
    if (input) {
      const value = (input as HTMLTextAreaElement).value;
      updateSystemPrompt(value);
    }
    close();
  };
  useEffect(() => {
    setClientReady(true);
  }, []);

  return (
    <>
      {clientReady &&
        createPortal(
          <Modal
            modalHeading="Edit custom system prompt"
            primaryButtonText="Save"
            preventCloseOnClickOutside
            onRequestSubmit={submit}
            primaryButtonDisabled={!isEditable}
            open={open}
            onRequestClose={close}
          >
            <div>
              <div className={styles.systemPromptInfo}>
                <p>
                  <Warning /> System message is only editable before the conversation starts
                </p>
                <p>If no custom system prompt is provided, the model uses default system message.</p>
              </div>

              {open ? (
                <TextArea
                  labelText="System prompt"
                  id="modal-system_prompt_text"
                  defaultValue={defaultValue}
                  onBlur={(e: SyntheticEvent<HTMLTextAreaElement>) => {
                    updateSystemPrompt((e.target as HTMLTextAreaElement)?.value || '');
                  }}
                  rows={18}
                  ref={inputRef}
                  readOnly={!isEditable}
                />
              ) : (
                <TextAreaSkeleton />
              )}
            </div>
          </Modal>,
          document.body,
        )}
    </>
  );
};

export default SystemPromptModal;
