import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Modal } from '@carbon/react';

export const DiscardConfirmation = ({
  open,
  close,
  submit,
}: {
  open: boolean;
  close: () => void;
  submit: () => void;
}) => {
  const [clientReady, setClientReady] = useState<boolean>(false);

  useEffect(() => {
    setClientReady(true);
  }, []);

  return (
    <>
      {clientReady &&
        createPortal(
          <Modal
            modalHeading="Discard edits"
            primaryButtonText="Discard"
            secondaryButtonText="Cancel"
            onSecondarySubmit={close}
            size="sm"
            onRequestSubmit={submit}
            open={open}
            onRequestClose={close}
          >
            <div>Are you sure to discard the edits?</div>
          </Modal>,
          document.body,
        )}
    </>
  );
};
