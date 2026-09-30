import { ResultByIssueTag } from '@test-manager/issue-trend-analysis/utils';
import { Fragment, useEffect, useRef, useState } from 'react';

import getHeatmapColor from './getHeatmapColor';
import styles from './HeatmapByIssueTags.module.scss';

interface Props {
  title: string;
  data: ResultByIssueTag[];
  isDark?: boolean;
}

// must match .tables flex-basis/gap in HeatmapByIssueTags.module.scss
const MIN_TABLE_WIDTH = 420;
const TABLE_GAP = 32;

const splitIntoColumns = <T,>(items: T[], numColumns: number) => {
  const groupSize = Math.ceil(items.length / numColumns);
  const groups: T[][] = [];
  for (let i = 0; i < items.length; i += groupSize) groups.push(items.slice(i, i + groupSize));
  return groups;
};

const getColumnLetter = (index: number) => String.fromCharCode(65 + index);
const getModelName = (column: string) => column.replace(/ \(.*\)$/, '');

const HeatmapTable = ({
  rows,
  columns,
  data,
  isDark,
}: {
  rows: string[];
  columns: string[];
  data: ResultByIssueTag[];
  isDark?: boolean;
}) => (
  <div
    className={styles.grid}
    style={{ gridTemplateColumns: `minmax(8rem, 10rem) repeat(${columns.length}, minmax(0, 165px))` }}
  >
    <div className={styles.headerCell}>Tag</div>
    {columns.map((column, i) => (
      <div key={column} className={styles.headerCell} title={column}>
        <div className={styles.letterBadge}>{getColumnLetter(i)}</div>
      </div>
    ))}
    {rows.map((row) => {
      const cells = columns.map((column) => data.find((d) => d.key === row && d.group === column));
      const rowTotal = Math.max(0, ...cells.map((cell) => cell?.total ?? 0));
      return (
        <Fragment key={row}>
          <div className={styles.rowLabel} title={row}>
            <span className={styles.rowLabelText}>{row}</span>
            <span className={styles.rowLabelTotal}>({rowTotal})</span>
          </div>
          {cells.map((cell, i) => (
            <div
              key={columns[i]}
              className={`${styles.cell} ${!cell ? styles.cellEmpty : ''}`}
              style={
                cell
                  ? {
                      backgroundColor: getHeatmapColor(cell.value, isDark),
                      color: cell.value < 40 ? 'var(--cds-text-primary)' : undefined,
                    }
                  : undefined
              }
            >
              {cell ? `${Math.round(cell.value)}%` : '–'}
            </div>
          ))}
        </Fragment>
      );
    })}
  </div>
);

const HeatmapByIssueTags = ({ title, data, isDark }: Props) => {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => setContainerWidth(entry.contentRect.width));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const getRowTotal = (row: string) => Math.max(0, ...data.filter((d) => d.key === row).map((d) => d.total ?? 0));
  const rows = [...new Set(data.map((d) => d.key))].sort((a, b) => getRowTotal(b) - getRowTotal(a));
  const columns = [...new Set(data.map((d) => d.group))];
  const numColumns = containerWidth
    ? Math.max(1, Math.floor((containerWidth + TABLE_GAP) / (MIN_TABLE_WIDTH + TABLE_GAP)))
    : 1;
  const rowGroups = splitIntoColumns(rows, numColumns);

  return (
    <div className={styles.wrapper} ref={wrapperRef}>
      <div className={styles.titleRow}>
        <p className={styles.title}>{title}</p>
        <div className={styles.columnLegend}>
          {columns.map((column, i) => (
            <span key={column}>
              <span className={styles.letterBadge}>{getColumnLetter(i)}</span> {getModelName(column)}
            </span>
          ))}
        </div>
      </div>
      <div className={styles.tables}>
        {rowGroups.map((groupRows, i) => (
          <HeatmapTable key={i} rows={groupRows} columns={columns} data={data} isDark={isDark} />
        ))}
      </div>
      <div className={styles.legend}>
        <span>Pass rate</span>
        <span>0</span>
        <div
          className={styles.legendGradient}
          style={{ background: `linear-gradient(to right, transparent, ${getHeatmapColor(100, isDark)})` }}
        />
        <span>100</span>
      </div>
    </div>
  );
};

export default HeatmapByIssueTags;
