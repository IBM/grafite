import { TextInput } from '@carbon/react';
import { Modal } from '@carbon/react';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import styles from './TagSelector.module.scss';

interface Props {
  open: boolean;
  tagType: string;
  submit: (newValue: string) => void;
  validate: (newValie: string) => boolean;
  close: () => void;
}
export const NewTagModal = ({ open, tagType, validate, submit, close }: Props) => {
  const [clientReady, setClientReady] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const wrapperRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    setClientReady(true);
  }, []);

  const getLabel = (name: string) => {
    if (name[name.length - 1] === 's') return name.slice(0, -1).toLowerCase();
  };

  const requestSubmit = () => {
    const wrapper = wrapperRef.current;
    if (wrapper) {
      const input = wrapper.querySelector('input');
      if (input) {
        const newValue = input.value;
        if (!newValue) return setError('New value cannot be empty');
        const result = validate(newValue);
        if (!result) return setError(`"${newValue}" already exist`);
        submit(newValue);
        close();
      }
    }
  };

  return (
    <>
      {clientReady &&
        createPortal(
          <Modal
            modalHeading={`Add new ${getLabel(tagType)}`}
            size="sm"
            primaryButtonText="Add and select"
            open={open}
            onRequestClose={close}
            onRequestSubmit={requestSubmit}
            preventCloseOnClickOutside
          >
            <div className={styles.wrapper} ref={wrapperRef}>
              <TextInput
                id="new-tag-input"
                labelText={`New ${getLabel(tagType)}`}
                invalid={!!error}
                invalidText={error}
              />
            </div>
          </Modal>,
          document.body,
        )}
    </>
  );
};
