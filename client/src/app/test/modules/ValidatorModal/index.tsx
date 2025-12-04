import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import styles from './ValidatorModal.module.scss';
import { Modal } from '@carbon/react';
import { Validator } from '@components/SelectedIssueContext';
import ValidatorTile from '@components/ValidatorTile';
import { isJudgeTypeValid, JudgeTypes } from '@utils/keyMappings';
import { getValidatorsFromIssue } from '@test/utils';
import { Test } from '@utils/getFunctions/getDashboardTests';

const ValidatorModal = ({
  testId,
  open,
  openedTests,
  close,
  submit,
}: {
  testId: string | null;
  open: boolean;
  openedTests: Test[];
  close: () => void;
  submit: (judgeType: string, guidelines: string) => void;
}) => {
  const [clientReady, setClientReady] = useState<boolean>(false);
  const [judgetypeValid, setJudgeTypeValid] = useState<boolean>(true);
  const [selectedTile, setSelectedTile] = useState<number>(-1);
  const tempJudgeSelection = useRef<{ judgeType: string; guidelines: string }>({ judgeType: '', guidelines: '' });

  const validators: Validator[] = useMemo(() => {
    const validators: Validator[] = getValidatorsFromIssue(openedTests);
    return validators;
  }, [openedTests]);

  const selectValidator = (judgeType: string, guidelines: string) => {
    tempJudgeSelection.current = { judgeType, guidelines };
  };

  const selectTile = (i: number, validator: Validator) => {
    setSelectedTile(i);
    const judgetypeValid = isJudgeTypeValid(validator.judgeType!); //there are existing values not part of the schema
    setJudgeTypeValid(judgetypeValid);
    const judgeType = judgetypeValid ? validator.judgeType : JudgeTypes['Model response'];
    selectValidator(judgeType!, validator.judgeGuidelines);
  };

  const updateValues = () => {
    const { judgeType, guidelines } = tempJudgeSelection.current;
    submit(judgeType, guidelines);
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
            modalHeading="Pull existing validator setting"
            primaryButtonText="Use selected setting"
            preventCloseOnClickOutside
            passiveModal={!validators.length}
            onRequestSubmit={updateValues}
            primaryButtonDisabled={selectedTile < 0}
            open={open}
            onRequestClose={close}
          >
            <div className={styles.wrapper}>
              {!!validators.length ? (
                <>
                  {validators
                    .filter((validator) => (testId !== null ? !validator.testIds.includes(testId) : true))
                    ?.map((validator, i) => (
                      <Fragment key={`validator_pull_${i}`}>
                        <button
                          onClick={() => {
                            selectTile(i, validator);
                          }}
                          className={selectedTile === i ? styles.selected : ''}
                        >
                          <ValidatorTile validator={validator} index={i} selectTest={null} />
                        </button>
                        {selectedTile === i && !judgetypeValid && (
                          <div className={styles.alert}>
                            This judge type is not available from the UI. Please review the type after selection.
                          </div>
                        )}
                      </Fragment>
                    ))}
                </>
              ) : (
                <span className={styles.na}>No judge setting created</span>
              )}
            </div>
          </Modal>,
          document.body,
        )}
    </>
  );
};

export default ValidatorModal;
