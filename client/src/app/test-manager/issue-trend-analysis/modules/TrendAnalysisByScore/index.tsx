import { SelectedReport } from '@test-manager/issue-trend-analysis-old/[id]/utils';
import ChartByScore from '../ChartByScore';
import styles from './TrendAnalysisByScore.module.scss';
import { useEffect, useState } from 'react';
import ScoreModeToggle from '../ScoreModeToggle';

interface Props {
  selectedReports: SelectedReport[];
}
const TrendAnalysisByScore = ({ selectedReports }: Props) => {
  const [mode, setMode] = useState<0 | 1>(0); //individual / compare

  useEffect(() => {
    setMode(selectedReports.length !== 2 ? 0 : 1);
  }, [selectedReports]);

  return (
    <section className={styles.root}>
      <div className={styles.header}>
        <h3>Trend analysis by test score</h3>
        <ScoreModeToggle
          mode={mode}
          changeMode={(mode: 0 | 1) => {
            setMode(mode);
          }}
          disabled={!(selectedReports.length === 2)}
        />
      </div>
      <div className={styles.row}>
        {!mode ? (
          <>
            {selectedReports.map((report) => (
              <div className={styles.chartWrapper} key={report.report.id}>
                <ChartByScore selectedReports={[report]} />
              </div>
            ))}
          </>
        ) : (
          <div className={styles.chartWrapper}>
            <ChartByScore selectedReports={selectedReports} />
          </div>
        )}
      </div>
    </section>
  );
};

export default TrendAnalysisByScore;
