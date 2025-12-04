import { Toggle } from '@carbon/react';
import styles from './ScoreModeToggle.module.scss';

interface Props {
  mode: 1 | 0;
  changeMode: (mode: 1 | 0) => void;
  disabled?: boolean;
}

const ScoreModeToggle = ({ mode, changeMode, disabled }: Props) => {
  return (
    <div className={styles.toggle}>
      <label htmlFor="score-mode" className={!mode ? styles.selected : ''}>
        Individual mode
      </label>
      <Toggle
        id="score-mode"
        size="sm"
        toggled={!!mode}
        hideLabel
        onToggle={(value: boolean) => {
          changeMode(value ? 1 : 0);
        }}
        disabled={disabled}
      />
      <label htmlFor="score-mode" className={!!mode ? styles.selected : ''}>
        Comparison mode
      </label>
    </div>
  );
};

export default ScoreModeToggle;
