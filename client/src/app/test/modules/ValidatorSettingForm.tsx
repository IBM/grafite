import { Accordion, AccordionItem, Button, Layer, RadioButton, RadioButtonGroup, TextArea } from '@carbon/react';
import { InlineLoading } from '@carbon/react';
import { InformationFilled, Radar, Tools } from '@carbon/react/icons';
import LabelledItem from '@components/LabelledItem';
import { useToastMessageContext } from '@components/ToastMessageContext';
import ValidationScore from '@components/ValidationScore';
import { JUDGE_DEFAULT_PARAM } from '@utils/constants';
import { type Test } from '@utils/getFunctions/getDashboardTests';
import { JudgeTypes } from '@utils/keyMappings';
import { mapMessagesToStr } from '@utils/mapMessagesToStr';
import { parseScores } from '@utils/parseJudgeScore';
import { postOllamaFreeform } from '@utils/postFunctions/postOllamaFreeform';
import { SyntheticEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import styles from '../new-test.module.scss';
import { getJudgeValues, judgeTypeNames, processJudgePrompt } from '../utils';
import JudgePromptModal from './JudgePromptModal';
import { useTestDataContext } from './TestDataContext';
import ValidatorModal from './ValidatorModal';
import ValidatorTestDataTable from './ValidatorTestDataTable';

interface Props {
  openedTests: Test[];
}

const ValidatorSettingForm = ({ openedTests }: Props) => {
  const { addToastMsg } = useToastMessageContext();
  const { testInfo, updateTest, validation, updateValidation } = useTestDataContext();
  const [isPreviewModalOpen, setPreviewModalOpen] = useState<boolean>(false);
  const [isValidatorModalOpen, setValidatorModalOpen] = useState<boolean>(false);
  const [isValidating, setIsValidating] = useState<boolean>(false);
  const [formattedPrompt, setFormattedPrompt] = useState<string | null>(null);
  //form rerendring trigger
  const [rerender, setRerender] = useState<boolean>(false);

  const judgeTemplate = useRef<string | null>(null);

  const judgeSettings = useMemo(() => {
    return openedTests?.map((d) => {
      const judgeValues = getJudgeValues(d);
      return { judge_type: judgeValues?.judgeType, judge_guidelines: judgeValues?.judgeGuidelines };
    });
  }, [openedTests]);

  const judgeModel = process.env.NEXT_PUBLIC_JUDGE_MODEL || '';

  const updateJudgeType = useCallback(
    (selectedItem: string | number | undefined) => {
      updateTest('judgeType', selectedItem);
    },
    [updateTest],
  );

  const updateJudgeTemplate = (guidelines: string) => {
    updateTest('judgeGuidelines', guidelines);
  };

  const bakeJudgePrompt = () => {
    const judgeSettings = getJudgeValues(testInfo);
    if (judgeSettings?.judgeType) {
      const { judgeType, judgeGuidelines } = judgeSettings;
      judgeTemplate.current = processJudgePrompt(
        formattedPrompt || '',
        testInfo,
        judgeType as keyof typeof JudgeTypes,
        judgeGuidelines,
      );
    } else {
      judgeTemplate.current = null;
    }
  };

  const blurHandler = (e: SyntheticEvent<HTMLTextAreaElement>) => {
    const guidelines = (e.target as HTMLTextAreaElement).value;
    updateJudgeTemplate(guidelines);
  };

  const openPreview = () => {
    bakeJudgePrompt();
    setPreviewModalOpen(true);
  };

  const validate = () => {
    bakeJudgePrompt();

    if (judgeTemplate.current === null) {
      addToastMsg('error', 'Please select a judge prompt content to validate', 'Failed to create judge prompt');
      return;
    }

    setIsValidating(true);

    postOllamaFreeform({
      options: { ...JUDGE_DEFAULT_PARAM },
      model: judgeModel,
      prompt: judgeTemplate.current,
      stream: false,
    })
      .then((res: string) => {
        const scores = parseScores(res);
        if (typeof scores === 'string') {
          updateValidation('justification', scores);
        } else {
          updateValidation('score', scores.score);
          updateValidation('justification', scores.justification);
        }
      })
      .catch((err) => addToastMsg(err.status, err.mesage, 'Failed to validate'))
      .finally(() => setIsValidating(false));
  };

  useEffect(() => {
    const judgeType = getJudgeValues(testInfo)?.judgeType;
    //apply prompt template in case of chat
    updateJudgeType(judgeType ?? '');
    if (!!testInfo.messages?.length) {
      setFormattedPrompt(mapMessagesToStr(testInfo.messages));
    } else setFormattedPrompt(testInfo.prompt ?? '');
  }, [addToastMsg, testInfo, updateJudgeType]);

  return (
    <>
      <div className={styles.validatorFormWrapper}>
        <div className={`${styles.row} ${styles.title}`}>
          <h4>Validator setting</h4>
          <span>LLM as a judge</span>
        </div>
        {!!judgeSettings?.length && (
          <div className={styles.existing}>
            <InformationFilled />
            <span>There are settings available from other tests under the issue</span>
            <Button kind="ghost" size="sm" onClick={() => setValidatorModalOpen(true)}>
              Pull existing setting
            </Button>
          </div>
        )}
        {!rerender && (
          <div className={`${styles.row} ${styles.ratio_2_3}`}>
            <RadioButtonGroup
              legendText="Judge prompt content"
              name="judge-prompt-content"
              orientation="vertical"
              onChange={updateJudgeType}
              defaultSelected={getJudgeValues(testInfo)?.judgeType}
            >
              <RadioButton value={JudgeTypes[judgeTypeNames[2]]} labelText="Model response" />
              <RadioButton value={JudgeTypes[judgeTypeNames[1]]} labelText="Model response + desired output" />
              <RadioButton
                value={JudgeTypes[judgeTypeNames[0]]}
                labelText="Model response + desired output + prompt text"
              />
            </RadioButtonGroup>

            <TextArea
              labelText={'Judge guidelines'}
              defaultValue={getJudgeValues(testInfo)?.judgeGuidelines}
              rows={4}
              onBlur={blurHandler}
              className={styles.judgeGuidelinesTextarea}
            />
          </div>
        )}
        <div className={styles.validationTool}>
          <Accordion align="start">
            <AccordionItem
              title={
                <div className={styles.title}>
                  Judge validation tool
                  <Tools />
                </div>
              }
            >
              <Layer>
                <div className={styles.judgeValidator}>
                  <div>
                    Validate your judge settings with multiple test data, including the other tests under the same
                    issue.
                    <br />
                    <strong>Note:</strong> All test data in this tool has the prompt template applied if it's created in
                    a chat format.
                  </div>
                  <ValidatorTestDataTable
                    testInfo={testInfo}
                    updateValidation={updateValidation}
                    bakedPrompt={formattedPrompt}
                  />
                </div>
              </Layer>
            </AccordionItem>
          </Accordion>
        </div>
        <div className={`${styles.row} ${styles.validateActions}`}>
          {isValidating ? (
            <div className={styles.loadingBox}>
              <InlineLoading description="Validating..." />
            </div>
          ) : (
            <Button
              size="md"
              kind="tertiary"
              renderIcon={Radar}
              iconDescription="validate inference data"
              onClick={validate}
            >
              Validate inference data
            </Button>
          )}
          <Button size="md" kind="ghost" onClick={openPreview}>
            View judge prompt
          </Button>
        </div>
        <div className={`${styles.row} ${styles.ratio_1_3}`}>
          <LabelledItem id="validator-setting-score" label="Score">
            <>{validation.score !== null ? <ValidationScore score={validation.score} /> : ''}</>
          </LabelledItem>
          <LabelledItem id="validator-setting-justification" label="Justification">
            <div>{validation.justification}</div>
          </LabelledItem>
        </div>
      </div>
      <JudgePromptModal
        judgeTemplate={judgeTemplate.current}
        open={isPreviewModalOpen}
        close={() => {
          setPreviewModalOpen(false);
        }}
      />
      <ValidatorModal
        testId={testInfo.id ?? ''}
        openedTests={openedTests}
        open={isValidatorModalOpen}
        close={() => {
          setValidatorModalOpen(false);
        }}
        submit={(judgeType: string, guidelines: string) => {
          setRerender(true);
          updateJudgeType(judgeType);
          updateJudgeTemplate(guidelines);
          setTimeout(() => setRerender(false), 0);
        }}
      />
    </>
  );
};

export default ValidatorSettingForm;
