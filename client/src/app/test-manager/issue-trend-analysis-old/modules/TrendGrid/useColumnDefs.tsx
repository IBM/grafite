import MarkdownBox from '@components/MarkdownBox';
import OperationalIdTag from '@components/OperationalIdTag';
import { SelectedReport } from '@test-manager/issue-trend-analysis-old/[id]/utils';
import styles from '@utils/ag-grid/ag-grid.module.scss';
import ScoreCellRenderer from '@utils/ag-grid/ScoreCellRenderer';
import { ColDef, ColGroupDef, ICellRendererParams, ITooltipParams, ValueGetterParams } from 'ag-grid-community';
import { useCallback, useMemo } from 'react';

import { objArrToString, TrendGridData } from './utils';

type ColumnDef = ColDef | ColGroupDef;
const MessagesToolTip = (props: ITooltipParams<TrendGridData>) => {
  const messages: unknown = props.data?.messages;

  const formatted = (messages as { role: string; content: string }[]).reduce(
    (prev, curr) => `${prev}\n**${curr.role}**: ${curr.content}`,
    '',
  );

  return (
    <div className={styles.tooltip}>
      <MarkdownBox>{formatted}</MarkdownBox>
    </div>
  );
};

export const useColumnDefs = (
  selectedReports: SelectedReport[],
  selectTest: (id: string | undefined) => void,
  selectTestRun: (reportId: string, testId: string) => void,
) => {
  const ScoreButton = useCallback(
    function ScoreButton(props: ICellRendererParams<TrendGridData>) {
      const value = props.value;
      const hasHumanEval = props.value[0] === '*';
      const score = hasHumanEval ? value.slice(-1) : value;
      const reportId = props.colDef?.field;
      const testId = props.data?.id;

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
        field: 'id',
        headerName: 'Test ID',
        width: 102,
        cellRenderer: (params: ICellRendererParams<TrendGridData>) => (
          <OperationalIdTag
            id={params.data?.id}
            onClick={() => selectTest(params.data?.id ? `${params.data?.id}` : undefined)}
          />
        ),
      },
      {
        field: 'messages',
        tooltipField: 'messages',
        tooltipValueGetter: (params: ITooltipParams) => JSON.stringify(params.value),
        width: 300,
        editable: false,
        valueGetter: (params: ValueGetterParams) => objArrToString(params.data?.messages),
        tooltipComponent: (params: ITooltipParams) => <MessagesToolTip {...params} />,
      },
      ...selectedReports
        ?.filter((report) => !!report.results)
        .map((d) => ({
          field: d.report.runId,
          headerName: `${d.report.modelId}\n${d.report.createdAt}`,
          headerStyle: { whiteSpace: 'wrap' },
          cellStyle: { textAlign: 'right' },
          width: 250,
          valueGetter: (params: ValueGetterParams) => {
            const hasHumanEval = params.data?.[d.report.runId]?.hasHumanEval;
            const score = params.data?.[d.report.runId]?.score;
            if (score === undefined) return 'N/A';
            return hasHumanEval ? `* ${score}` : score;
          },
          cellRenderer: ScoreButton,
        })),
    ],
    [selectedReports, selectTest, ScoreButton],
  );

  return [colDef];
};
