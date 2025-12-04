import { RadioButton, RadioButtonGroup } from '@carbon/react';

import styles from './JudgeType.module.scss';

type JudgeTypeProps = {
  judgeType: 'ensemble' | 'single';
  setJudgeType: (value: 'ensemble' | 'single') => void;
};

const JudgeType = ({ judgeType, setJudgeType }: JudgeTypeProps) => {
  const ensembleJudgeModels = process.env.NEXT_PUBLIC_ENSEMBLE_JUDGE_MODELS || 'llama3.3,mistral-small3.1,gpt-oss:120b';

  const singleJudgeModel = process.env.NEXT_PUBLIC_JUDGE_MODEL || 'llama3.3';

  return (
    <div>
      <RadioButtonGroup
        valueSelected={judgeType}
        legendText="Judge Type"
        name="radio-button-judge-type-group"
        onChange={(selection: string | number | undefined) => setJudgeType(selection as 'ensemble' | 'single')}
        className={styles.radioGroup}
        orientation="vertical"
      >
        <RadioButton
          id="single"
          labelText={
            <div>
              <div className={styles.label}>Single judge</div>
              <div>({singleJudgeModel})</div>
            </div>
          }
          value="single"
        />
        <RadioButton
          id="ensemble"
          labelText={
            <div>
              <div className={styles.label}>Ensemble of judges</div>
              <div>({ensembleJudgeModels.split(',').join(', ')})</div>
            </div>
          }
          value="ensemble"
        />
      </RadioButtonGroup>
    </div>
  );
};

export default JudgeType;
