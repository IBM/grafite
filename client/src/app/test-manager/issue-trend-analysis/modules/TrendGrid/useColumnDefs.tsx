import { Tag } from '@carbon/react';
import OperationalIdTag from '@components/OperationalIdTag';
import { SelectedReport } from '@test-manager/issue-trend-analysis-old/[id]/utils';
import styles from '@utils/ag-grid/ag-grid.module.scss';
import ScoreCellRenderer from '@utils/ag-grid/ScoreCellRenderer';
import { ColDef, ColGroupDef, ICellRendererParams, ITooltipParams, ValueGetterParams } from 'ag-grid-community';
import { useCallback, useId, useMemo } from 'react';

import { TrendGridData } from './utils';

type ColumnDef = ColDef | ColGroupDef;

const TagsRenderer = ({ values }: { values: string[] }) => {
  const id = useId();
  return (
    <div>
      {values.map((value) => (
        <Tag key={`${id}-${value}`} size="sm" type="cool-gray">
          {value}
        </Tag>
      ))}
    </div>
  );
};

const TagsTooltipComponent = (props: ITooltipParams<TrendGridData>) => {
  return (
    <div className={styles.tooltip}>
      <TagsRenderer values={(props.value ?? []) as string[]} />
    </div>
  );
};

export const useColumnDefs = (
  selectedReports: SelectedReport[],
  selectTest: (id: string | undefined) => void,
  selectIssue: (id: string | undefined) => void,
  selectTestRun: (reportId: string, testId: string) => void,
) => {
  const ScoreButton = useCallback(
    function ScoreButton(props: ICellRendererParams<TrendGridData>) {
      const value = props.value;
      const hasHumanEval = props.value[0] === '*';
      const score = hasHumanEval ? value.slice(-1) : value;
      const reportId = props.colDef?.field;
      const testId = props.data?.testId;

      return (
        <div>
          {hasHumanEval && <span className={styles.hasHumanEval}>*</span>}
          <ScoreCellRenderer score={score} clickHandler={() => selectTestRun(reportId ?? '', String(testId) ?? '')} />
        </div>
      );
    },
    [selectTestRun],
  );

  const colDef = useMemo<ColumnDef[] | null>(
    () => [
      {
        field: 'testId',
        headerName: 'Test ID',
        width: 110,
        cellRenderer: (params: ICellRendererParams<TrendGridData>) => (
          <OperationalIdTag
            id={params.data?.testId as string}
            onClick={() => selectTest(params.data?.testId ? `${params.data?.testId}` : undefined)}
          />
        ),
      },
      {
        field: 'testFlags',
        headerName: 'Test Tags',
        cellRenderer: (params: ICellRendererParams<TrendGridData>) => (
          <TagsRenderer values={(params.value ?? []) as string[]} />
        ),
        tooltipComponent: (params: ITooltipParams) => <TagsTooltipComponent {...params} />,
      },
      {
        field: 'issueId',
        headerName: 'Issue ID',
        width: 110,
        cellRenderer: (params: ICellRendererParams<TrendGridData>) => (
          <OperationalIdTag
            id={params.data?.issueId as string}
            onClick={() => selectIssue(params.data?.issueId ? `${params.data?.issueId}` : undefined)}
          />
        ),
      },
      {
        field: 'issueTitle',
        headerName: 'Issue Title ',
      },
      {
        field: 'issueTags',
        headerName: 'Issue Tags',
        cellRenderer: (params: ICellRendererParams<TrendGridData>) => (
          <TagsRenderer values={(params.value ?? []) as string[]} />
        ),
        tooltipComponent: (params: ITooltipParams) => <TagsTooltipComponent {...params} />,
      },
      ...selectedReports
        ?.filter((report) => !!report.results)
        .map((d) => ({
          field: d.report.runId,
          headerName: `${d.report.modelId}\n${d.report.createdAt}`,
          headerStyle: { whiteSpace: 'wrap' },
          cellStyle: { textAlign: 'right' },
          width: 250,
          comparator: (a: number | string, b: number | string) => {
            if (a === 'N/A' && b === 'N/A') return 0;
            if (a === 'N/A') return -1;
            if (b === 'N/A') return 1;

            return Number(a) - Number(b);
          },
          valueGetter: (params: ValueGetterParams) => {
            const hasHumanEval = params.data?.[d.report.runId]?.hasHumanEval;
            const score = params.data?.[d.report.runId]?.score;
            if (score === undefined) return 'N/A';
            return hasHumanEval ? `* ${score}` : score;
          },
          cellRenderer: ScoreButton,
        })),
    ],
    [selectedReports, selectIssue, selectTest, ScoreButton],
  );

  return [colDef];
};
