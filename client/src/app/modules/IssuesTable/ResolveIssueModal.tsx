import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { ComposedModal, TextArea, Button } from '@carbon/react';

import styles from './IssuesTable.module.scss';
import { ModalFooter } from '@carbon/react';
import { ModalHeader } from '@carbon/react';
import { ModalBody } from '@carbon/react';

type ResolveIssueModalProps = {
  issueId: string | null;
  resolutionNote: string | null;
  close: () => void;
  resolveIssue: (resolveIssueData: { issueId: string; resolutionNote: string }) => void;
  disableActions: boolean;
};

export const ResolveIssueModal = ({
  issueId,
  resolveIssue,
  close,
  disableActions,
  resolutionNote,
}: ResolveIssueModalProps) => {
  const resolutionNoteInputRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (resolutionNoteInputRef.current) {
      resolutionNoteInputRef.current.value = resolutionNote || '';
    }
  }, [resolutionNote]);

  return (
    typeof document !== 'undefined' &&
    typeof window !== 'undefined' &&
    createPortal(
      <ComposedModal size="sm" open={issueId !== null} preventCloseOnClickOutside onClose={close}>
        <ModalHeader>
          <h2>Resolve issue</h2>
        </ModalHeader>
        <ModalBody className={styles.resolveIssueModal}>
          <div className={styles.description}>Please leave a note for the future reference.</div>
          <TextArea
            id="resolution-note"
            labelText="Resolution note"
            ref={resolutionNoteInputRef}
            placeholder="I mark this as resolved based on the results of the latest run"
          />
        </ModalBody>
        <ModalFooter>
          <Button kind="secondary" onClick={close} disabled={disableActions}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              if (issueId) {
                const ISOString = new Date().toISOString();
                const resolutionNote = `${resolutionNoteInputRef.current?.value} [${ISOString}] `;

                resolveIssue({ issueId, resolutionNote });

                if (resolutionNoteInputRef.current) {
                  resolutionNoteInputRef.current.value = '';
                }
              }
            }}
            disabled={disableActions}
          >
            Proceed
          </Button>
        </ModalFooter>
      </ComposedModal>,
      document.body,
    )
  );
};
