import ValidationScore from '@components/ValidationScore';

import styles from './ScoreCellRenderer.module.scss';

interface Props {
  score: number | string;
  clickHandler: () => void;
}
const ScoreCellRenderer = ({ score, clickHandler }: Props) => {
  if (score === '' || isNaN(Number(score))) return <span className={styles.na}>{score}</span>;
  return (
    <div className={styles.scoreButtonWrapper}>
      <ValidationScore score={score} size="sm" className={styles.score} onClick={clickHandler} />
    </div>
  );
};

export default ScoreCellRenderer;
