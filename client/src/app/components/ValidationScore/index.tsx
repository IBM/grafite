import { CheckmarkFilled, WarningFilled } from '@carbon/react/icons';

import styles from './ValidationScore.module.scss';

interface Props {
  score: number | string;
  size?: 'sm' | 'lg';
  iconOnly?: boolean;
  onClick?: () => void;
  className?: string;
}
const ValidationScore = ({ score, size = 'lg', iconOnly = false, className, onClick }: Props) => {
  const value = Number(score);
  const isGood = value > 0.5;
  const scoreElement = (
    <div
      className={`${styles.wrapper} ${size === 'sm' ? styles.sm : ''} ${className}`}
      title={isGood ? 'Passed' : 'Failed'}
    >
      {!iconOnly && (
        <div className={styles.score}>
          {score.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
        </div>
      )}
      <div className={isGood ? styles.success : styles.warning}>{isGood ? <CheckmarkFilled /> : <WarningFilled />}</div>
    </div>
  );

  if (onClick)
    return (
      <button
        aria-label="View test run detail"
        className={`cds--btn cds--btn--sm cds--layout--size-sm cds--btn--ghost ${styles.scoreButton}`}
        onClick={onClick}
      >
        {scoreElement}
      </button>
    );

  return scoreElement;
};

export default ValidationScore;
