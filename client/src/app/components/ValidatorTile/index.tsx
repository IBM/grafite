import OperationalIdTag from '@components/OperationalIdTag';
import { Validator } from '@components/SelectedIssueContext';
import ShortIdTag from '@components/ShortIdTag';
import mapJudgeTemplate from '@utils/mapJudgeTemplate';

import styles from './ValidatorTile.module.scss';

const ValidatorTile = ({
  validator,
  selectTest,
  index,
}: {
  validator: Validator;
  selectTest: ((id: string) => void) | null;
  index: number;
}) => {
  return (
    <div className={styles.validator}>
      <div className={styles.validatorTitle}>
        <span>LLM judge #{index + 1}</span>
        <div className={styles.tests}>
          <div>For tests:</div>
          <div className={styles.tagList}>
            {validator.testIds?.map((id) =>
              selectTest !== null ? (
                <OperationalIdTag id={id.toString()} key={`validator_test_${id}`} onClick={() => selectTest(id)} />
              ) : (
                <ShortIdTag id={id.toString()} key={`validator_test_${id}`} />
              ),
            )}
          </div>
        </div>
      </div>
      <div className={styles.contentSet}>
        <label id={`setting-${index}-type`}>Judge prompt content</label>
        <div aria-labelledby={`setting-${index}-type`}>{mapJudgeTemplate(validator.judgeType!)}</div>
      </div>
      <div className={styles.contentSet}>
        <label id={`setting-${index}-guideline`}>Judge guideline</label>
        <div aria-labelledby={`setting-${index}-guideline`}>{validator.judgeGuidelines}</div>
      </div>
    </div>
  );
};
export default ValidatorTile;
