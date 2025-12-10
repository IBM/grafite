import { WarningFilled } from '@carbon/react/icons';
import OperationalIdTag from '@components/OperationalIdTag';
import MarkdownToolTip from '@utils/ag-grid/MarkdownTooltip';
import ScoreCellRenderer from '@utils/ag-grid/ScoreCellRenderer';
import { JudgeResult } from '@utils/getFunctions/getDashboardResult';
import { isHumanEval } from '@utils/isHumanEval';
import { getAvgJudgeScore } from '@utils/parseJudgeScore';
import {
  CellClassParams,
  ColDef,
  ColGroupDef,
  ICellRendererParams,
  ITooltipParams,
  ValueGetterParams,
} from 'ag-grid-community';
import { useMemo } from 'react';

import styles from './ResultsByTestGrid.module.scss';
import { GridRow, sanityCheck } from './utils';

type ColumnDef = ColDef | ColGroupDef;

export const useColumnDefs = (
  selectTest: (id: string | undefined) => void,
  selectIssue: (id: string | undefined) => void,
  selectTestRun: (data: GridRow | undefined) => void,
  judgeModels: { id: string; type?: string }[] | null,
) => {
  const isHumanEvalModel = (model: { id: string; type?: string }) => model.type === 'human';

  const judgeColumns = useMemo(() => {
    const columns = [];

    if (!!judgeModels?.length) {
      const getJustificationCol = (modelId?: string) => {
        const isAnnotation = modelId === 'annotation';
        return {
          headerName: 'Justification',
          width: 450,
          wrapText: true,
          autoHeight: true,
          cellClass: (params: CellClassParams) => (params.value === 'N/A' ? styles.na : styles.justificationCell),
          valueGetter: (params: ValueGetterParams) => {
            const justification =
              params.data?.judgeResults?.find((r: JudgeResult) =>
                isAnnotation ? isHumanEval(r) : r.modelId === modelId,
              )?.testJustification ?? 'N/A';
            if (isAnnotation && justification === 'N/A') return '';
            return justification;
          },
        };
      };
      const getScoreCol = (modelId?: string) => {
        const isAnnotation = modelId === 'annotation';
        return {
          headerName: 'Score',
          width: 100,
          valueGetter: (params: ValueGetterParams) => {
            const score =
              params.data?.judgeResults?.find((r: JudgeResult) =>
                isAnnotation ? isHumanEval(r) : r.modelId === modelId,
              )?.testScore ?? 'N/A';
            if (isAnnotation && score === 'N/A') return '';
            return score;
          },
          cellRenderer: (params: ICellRendererParams<GridRow>) => (
            <ScoreCellRenderer
              clickHandler={() => {
                selectTestRun(params.data);
              }}
              score={params.value}
            />
          ),
        };
      };
      const getSafetyWarningCol = (modelId: string) => ({
        headerName: 'Sanity warning',
        width: 140,
        cellRenderer: (params: ICellRendererParams<GridRow>) =>
          params.value ? <WarningFilled className={styles.warning} /> : null,
        valueGetter: (params: ValueGetterParams) => {
          const justification = params.data?.judgeResults?.find(
            (r: JudgeResult) => r.modelId === modelId,
          )?.testJustification;
          return justification ? !!sanityCheck(justification) : null;
        },
      });

      const annotator = judgeModels.find((model) => isHumanEvalModel(model));
      if (!!annotator) {
        columns.push({
          headerName: 'Human evaluation',
          children: [
            {
              ...getJustificationCol('annotation'),
              width: 250,
            },
            {
              ...getScoreCol('annotation'),
            },
          ],
        });
      }
      columns.push(
        ...judgeModels
          .filter((model) => !isHumanEvalModel(model))
          .map((model, i) => ({
            headerName: model.id,
            children: [
              {
                ...getJustificationCol(model.id),
              },
              {
                ...getScoreCol(model.id),
                ...(!annotator && i === 0 ? { colId: 'testScore' } : undefined),
              },
              {
                ...getSafetyWarningCol(model.id),
              },
            ],
          })),
      );
    }
    return columns;
  }, [judgeModels, selectTestRun]);

  const colDef = useMemo<ColumnDef[] | null>(
    () => [
      {
        field: 'testId',
        headerName: 'Test ID',
        width: 110,
        cellRenderer: (params: ICellRendererParams<GridRow>) => (
          <OperationalIdTag
            id={params.data?.testId as string}
            onClick={() => selectTest(params.data?.testId ? `${params.data?.testId}` : undefined)}
          />
        ),
      },
      {
        field: 'issueId',
        headerName: 'Issue ID',
        width: 110,
        cellRenderer: (params: ICellRendererParams<GridRow>) => (
          <OperationalIdTag
            id={params.data?.issueId as string}
            onClick={() => selectIssue(params.data?.issueId ? `${params.data?.issueId}` : undefined)}
          />
        ),
      },
      {
        field: 'issueTitle',
        headerName: 'Issue Title ',
        tooltipValueGetter: (params: ITooltipParams) => params.value,
      },
      ...((judgeModels?.length ?? 0) > 1
        ? [
            {
              field: 'judgeResults',
              headerName: 'Average score',
              filter: 'agNumberColumnFilter',
              colId: 'avgScore',
              width: 120,
              valueGetter: (params: ValueGetterParams) => getAvgJudgeScore(params.data) ?? 'N/A',
              cellRenderer: (params: ICellRendererParams<GridRow>) => (
                <ScoreCellRenderer
                  clickHandler={() => {
                    selectTestRun(params.data);
                  }}
                  score={params.value}
                />
              ),
            },
          ]
        : []),
      ...judgeColumns,
      {
        field: 'modelResponse',
        headerName: 'Model Response',
        width: 600,
        tooltipValueGetter: (params: ITooltipParams) => params.value,
        tooltipComponent: (params: ITooltipParams) => <MarkdownToolTip {...params} />,
      },
    ],
    [selectTest, selectIssue, selectTestRun, judgeModels, judgeColumns],
  );

  return [colDef];
};
