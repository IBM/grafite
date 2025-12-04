import { Layer, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@carbon/react';
import OperationalIdTag from '@components/OperationalIdTag';
import ValidationScore from '@components/ValidationScore';
import { JudgeResult } from '@utils/getFunctions/getDashboardResult';
import { isHumanEval } from '@utils/isHumanEval';
import { getAvgJudgeScoreFromResults } from '@utils/parseJudgeScore';
import { useMemo } from 'react';

import styles from './ResultsByIssueTable.module.scss';

type ExpandedRowProps = {
  tests: {
    id: string;
    justification: string[];
    score: number[];
    judgeModelId: string[];
  }[];
  selectTest: (testId: string) => void;
  selectTestRun: (testId: string, judgeModelId?: string) => void;
};

export const ExpandedRow = ({ tests, selectTest, selectTestRun }: ExpandedRowProps) => {
  const isModelMultiple = useMemo(() => tests?.[0]?.judgeModelId.length > 1, [tests]);
  return (
    <Layer className={styles.expandedRow}>
      <Table>
        <TableHead>
          <TableRow>
            <TableHeader>Test ID</TableHeader>
            {isModelMultiple && <TableHeader>Model ID</TableHeader>}
            <TableHeader>Justification</TableHeader>
            <TableHeader>Score</TableHeader>
          </TableRow>
        </TableHead>
        <TableBody>
          {tests.map((t) => {
            const results = t.justification.map(
              (r, i) => ({ modelId: t.judgeModelId[i], testScore: t.score[i], testJustification: r }) as JudgeResult,
            );
            const avgScore = getAvgJudgeScoreFromResults(results);
            const hasHumanEval = results.find((d) => isHumanEval(d));

            return t.judgeModelId.map((model, i, arr) => {
              const isLastRow = arr.length - 1 === i;
              const [score, justification] = [t.score[i], t.justification[i]];
              return (
                <TableRow key={`${t.id}-${model}`}>
                  <TableCell
                    className={`${styles.idCell} ${isModelMultiple ? styles.multiModel : undefined} ${isLastRow ? undefined : styles.noBorder}`}
                  >
                    {!i && <OperationalIdTag id={t.id} className={styles.tag} onClick={() => selectTest(t.id)} />}
                  </TableCell>
                  {isModelMultiple && (
                    <TableCell className={styles.cell}>
                      <div className={styles.modelId}>
                        <span>{model}</span> <ValidationScore score={score} iconOnly size="sm" />
                      </div>
                    </TableCell>
                  )}
                  <TableCell className={styles.cell}>
                    <div className={styles.justification}>{justification}</div>
                  </TableCell>
                  <TableCell
                    className={`${styles.cell} ${styles.rightAlign} ${styles.scoreCell} ${isLastRow ? undefined : styles.noBorder}`}
                  >
                    {!i && (
                      <div className={styles.score}>
                        {hasHumanEval && <span className={styles.hasHumanEval}>*</span>}
                        <ValidationScore score={avgScore} size="sm" onClick={() => selectTestRun(t.id)} />
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              );
            });
          })}
        </TableBody>
      </Table>
    </Layer>
  );
};
