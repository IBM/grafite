'use client';

import { Tooltip } from '@carbon/react';
import ValidationScore from '@components/ValidationScore';
import { PropsWithChildren } from 'react';

import styles from './ScoreAggregator.module.scss';

type ScoreAggregatorRowProps = {
  passed: number;
  failed: number;
  none?: number;
  hasHumanEval?: number;
  identifier?: string;
};

const Table = ({ children }: PropsWithChildren) => {
  return (
    <table>
      <tbody>{children}</tbody>
    </table>
  );
};

const Row = ({ failed, passed, identifier, none, hasHumanEval }: ScoreAggregatorRowProps) => {
  const hasMoreItems = none !== undefined || hasHumanEval !== undefined;
  const postfix = hasMoreItems ? '' : ' item';
  return (
    <tr className={styles.row}>
      {identifier && (
        <td className={styles.identifier}>
          <strong>{identifier}:</strong>
        </td>
      )}
      <td className={styles.label}>
        <ValidationScore size="sm" score={1} iconOnly />
      </td>
      <td>
        {passed}
        {postfix}
      </td>
      <td className={styles.label}>
        <ValidationScore size="sm" score={0} iconOnly />
      </td>
      <td>
        {failed}
        {postfix}
      </td>
      {none !== undefined && (
        <>
          <td className={`${styles.na} ${styles.label}`}>N/A</td>
          <td>
            {none}
            {postfix}
          </td>
        </>
      )}
      {hasHumanEval !== undefined && (
        <>
          <td className={`${styles.humanEval} ${styles.label}`}>
            <Tooltip label="Human evaluation" autoAlign>
              <button type="button" className={styles.tooltipBtn}>
                *
              </button>
            </Tooltip>
          </td>
          <td>
            {hasHumanEval}
            {postfix}
          </td>
        </>
      )}
    </tr>
  );
};

const ScoreAggregator = {
  Table,
  Row,
};

export default ScoreAggregator;
