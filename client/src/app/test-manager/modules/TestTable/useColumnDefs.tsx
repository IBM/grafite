import { Tag } from '@carbon/react';
import MarkdownBox from '@components/MarkdownBox';
import OperationalIdTag from '@components/OperationalIdTag';
import { CopiableTag } from '@components/ShortIdTag';
import { useIsAdmin } from '@hooks/permissionHooks';
import gridStyles from '@utils/ag-grid/ag-grid.module.scss';
import getStatusColDef, { OnStatusChangeParams } from '@utils/ag-grid/StatusCellEditor';
import TagsTooltip from '@utils/ag-grid/TagsTooltip';
import { type Test } from '@utils/getFunctions/getDashboardTests';
import {
  AgColumn,
  ColDef,
  ColGroupDef,
  ICellRendererParams,
  ITooltipParams,
  ValueGetterParams,
} from 'ag-grid-community';
import { Fragment, useMemo } from 'react';

import styles from './TestTable.module.scss';
import { objArrToString } from './utils';

type ColumnDef = ColDef | ColGroupDef;
const MarkdownToolTip = (props: ITooltipParams<Test & { issueTitle?: string }>) => {
  const content: unknown = props.value;
  const isMessage = (props.column as AgColumn)?.colId === 'messages';
  const contentIsString = typeof content === 'string';

  const formatted = (messages: { role: string; content: string }[]) =>
    messages.reduce((prev, curr) => `${prev}\n**${curr.role}**: ${curr.content}`, '');

  return (
    <div className={styles.tooltip}>
      <MarkdownBox>
        {isMessage
          ? formatted(content as { role: string; content: string }[])
          : contentIsString
            ? content
            : `${content}`}
      </MarkdownBox>
    </div>
  );
};

export const useColumnDefs = (
  selectDetail: (id: string, type: 'issue' | 'test') => void,
  onStatusChange: (params: OnStatusChangeParams) => void,
) => {
  const isAdmin = useIsAdmin();

  const statusCol = useMemo(
    () => getStatusColDef({ editable: isAdmin, type: 'test', onStatusChange }),
    [isAdmin, onStatusChange],
  );

  const colDef = useMemo<ColumnDef[] | null>(
    () => [
      {
        field: 'id',
        headerName: 'Test ID',
        pinned: 'left',
        width: 110,
        cellRenderer: (params: ICellRendererParams<Test>) => (
          <OperationalIdTag
            id={params.data?.id}
            onClick={() => {
              selectDetail(params.data?.id || '', 'test');
            }}
          />
        ),
      },
      statusCol,
      {
        field: 'issueId',
        headerName: 'Issue ID',
        width: 112,
        cellRenderer: (params: ICellRendererParams<Test>) =>
          !!params.data && (
            <OperationalIdTag id={params.data.issueId} onClick={() => selectDetail(params.data!.issueId, 'issue')} />
          ),
      },
      {
        field: 'issueTitle',
        headerName: 'Issue title',
        width: 300,
      },
      {
        field: 'prompt',
        tooltipField: 'prompt',
        width: 300,
        tooltipComponent: (params: ITooltipParams) => <MarkdownToolTip {...params} />,
      },
      {
        field: 'messages',
        tooltipField: 'messages',
        tooltipValueGetter: (params: ITooltipParams) => JSON.stringify(params.value),
        width: 300,
        valueGetter: (params: ValueGetterParams) => objArrToString(params.data?.messages),
        tooltipComponent: (params: ITooltipParams) => <MarkdownToolTip {...params} />,
      },
      {
        field: 'sampleOutput',
        tooltipField: 'sampleOutput',
        width: 300,
        tooltipComponent: (params: ITooltipParams) => <MarkdownToolTip {...params} />,
      },
      {
        headerName: 'Desired output',
        children: [
          {
            field: 'desiredOutput',
            tooltipField: 'desiredOutput',
            tooltipComponent: (params: ITooltipParams) => <MarkdownToolTip {...params} />,
            width: 300,
            headerName: 'Output',
          },
          { field: 'desiredOutputSource', width: 130, headerName: 'Source' },
        ],
      },
      {
        headerName: 'LLM Judge',
        children: [
          {
            field: 'validators',
            headerName: 'Type',
            tooltipValueGetter: (params: ITooltipParams) => params.value,
            valueGetter: (params: ITooltipParams) => params.data.validators?.[0]?.parameters.judgeType,
          },
          {
            field: 'validators',
            width: 300,
            tooltipValueGetter: (params: ITooltipParams) => params.value,
            valueGetter: (params: ITooltipParams) => params.data.validators?.[0]?.parameters.judgeGuidelines,
            headerName: 'Guidelines',
          },
          {
            field: 'validators',
            headerName: 'Template',
            tooltipValueGetter: (params: ITooltipParams) => params.value,
            tooltipComponent: (params: ITooltipParams) => <MarkdownToolTip {...params} />,
            valueGetter: (params: ITooltipParams) => params.data.validators?.[0]?.parameters.judgeTemplate,
          },
        ],
      },
      {
        field: 'flags',
        tooltipField: 'flags',
        cellRenderer: (params: ICellRendererParams) => (
          <>
            {params.data.flags?.map((val: string[], idx: number) => (
              <Fragment key={`flag-${params.data._id}-${idx}`}>
                <Tag size="sm" type="cool-gray" className={gridStyles.tag}>
                  {val}
                </Tag>
              </Fragment>
            ))}
          </>
        ),
        tooltipComponent: (params: ITooltipParams) => <TagsTooltip {...params} />,
      },
      { field: 'author', tooltipField: 'author', width: 200 },
      {
        field: 'source_id',
        headerName: 'Source ID',
        cellRenderer: (params: ICellRendererParams<Test>) =>
          !!params.value && (
            <CopiableTag className={styles.sourceIdTag} domId={`id-copiable-${params.value}`}>
              {params.value}
            </CopiableTag>
          ),
      },
    ],
    [selectDetail, statusCol],
  );

  return [colDef];
};
