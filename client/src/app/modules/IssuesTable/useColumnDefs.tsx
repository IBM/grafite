import { Button, IconButton, Link } from '@carbon/react';
import { Launch } from '@carbon/react/icons';
import OperationalIdTag from '@components/OperationalIdTag';
import { useIsAdmin } from '@hooks/permissionHooks';
import { TestRunResult } from '@modules/utils';
import getStatusColDef, { OnStatusChangeParams } from '@utils/ag-grid/StatusCellEditor';
import TagsTooltip from '@utils/ag-grid/TagsTooltip';
import { MultipleTagsRenderer } from '@utils/ag-grid/TagsTooltip/MultipleTagsRenderer';
import { type Issue } from '@utils/getFunctions/getDashboardIssues';
import { ColDef, ICellEditorParams, ICellRendererParams, ITooltipParams, ValueGetterParams } from 'ag-grid-community';
import { type Dispatch, type SetStateAction, useId, useMemo } from 'react';

import { ExternalFieldCellEditor } from './ExternalFieldCellEditor';
import { GridData } from './IssuesTable';
import styles from './IssuesTable.module.scss';

const ArrayTooltipComponent = (props: ITooltipParams<Issue>) => {
  const id = useId();
  if (!props?.value?.length) return null;

  return (
    <div className={styles.tooltip}>
      {props.value.map((val: string, idx: number) => (
        <p key={`${id}-${idx}`}>
          <span>{Number(idx) + 1}.</span> {val}
        </p>
      ))}
    </div>
  );
};

const getTestRunPassRate = (props: ValueGetterParams, runId: string) => {
  const value = props.data[runId]; //IssuePassRate.testRunResults
  if (value === undefined) return 'N/A';

  const { testTotal, passedTestTotal } = value;
  if (testTotal === undefined || !passedTestTotal === undefined) return 'N/A';

  const rate = (passedTestTotal / testTotal) * 100;
  return rate.toFixed(2);
};
const PassRateButton = (props: ICellRendererParams<GridData>, runId: string) => {
  const rate = props.value;

  if (rate === 'N/A') return <span className={styles.na}>{rate}</span>;
  const issueId = props.data?.id;
  const { testTotal, passedTestTotal } = props.data?.[runId] as TestRunResult;

  return (
    <div className={styles.buttonCell}>
      <Button
        aria-label="View test run detail"
        className={styles.scoreButton}
        size="md"
        kind="ghost"
        target="_blank"
        rel="noreferrer"
        href={`/test-manager/issue-trend-analysis-old/${issueId}?run_id=${runId}`}
      >
        <span className={styles.testCounts}>
          ({passedTestTotal} / {testTotal})
        </span>{' '}
        {rate}%
      </Button>
    </div>
  );
};

const NewTabButton = (props: ICellRendererParams<GridData>, selectedRuns: string[]) => {
  const issueId = props.data?.id;
  const searchParam = selectedRuns.map((run) => `run_id=${run}`).join('&');

  return (
    <div className={styles.buttonCell}>
      <IconButton
        label="Open issue trend analysis"
        kind="ghost"
        size="md"
        target="_blank"
        rel="noreferrer"
        href={`/test-manager/issue-trend-analysis-old/${issueId}?${searchParam}`}
      >
        <Launch />
      </IconButton>
    </div>
  );
};

export const useColumnDefs = (
  selectedReportsMetadata: { runId: string; modelId: string }[],
  openTest: (id: string) => void,
  setDetailsModalProps: Dispatch<SetStateAction<{ id: string; kind: 'issue' | 'test' | 'feedback' } | undefined>>,
  onStatusChange: (params: OnStatusChangeParams) => void,
) => {
  const isAdmin = useIsAdmin();

  const statusCol = useMemo(
    () => getStatusColDef({ editable: isAdmin, type: 'issue', onStatusChange }),
    [isAdmin, onStatusChange],
  );

  const colDef = useMemo<ColDef<Issue>[] | null>(() => {
    return [
      {
        field: 'id',
        headerName: 'Issue ID',
        cellRenderer: (params: ICellRendererParams<Issue>) => (
          <OperationalIdTag
            onClick={() => setDetailsModalProps({ id: params.value, kind: 'issue' })}
            id={params.data?.id}
          />
        ),
        pinned: 'left',
        width: 110,
        filter: '',
      },
      { field: 'title', tooltipField: 'title', width: 300, pinned: 'left' },
      statusCol as ColDef<Issue>,
      ...(!selectedReportsMetadata?.length
        ? []
        : [
            {
              headerName: 'Pass rates per model',
              children: [
                ...selectedReportsMetadata.map(({ runId, modelId }) => ({
                  field: runId,
                  headerName: `${modelId}\n${runId}`,
                  headerComponentParams: {
                    innerHeaderComponent: () => (
                      <div>
                        {modelId}
                        <div className={styles.runId}>({runId})</div>
                      </div>
                    ),
                  },
                  headerStyle: { whiteSpace: 'wrap' },
                  filter: 'agNumberColumnFilter',
                  cellStyle: { textAlign: 'right' },
                  width: 250,
                  valueGetter: (params: ValueGetterParams) => getTestRunPassRate(params, runId),
                  cellRenderer: (params: ICellRendererParams<Issue>) => PassRateButton(params, runId),
                })),
                {
                  field: '',
                  headerName: 'Compare',
                  width: 100,
                  filter: false,
                  cellRenderer: (params: ICellRendererParams<Issue>) =>
                    NewTabButton(
                      params,
                      selectedReportsMetadata.map(({ runId }) => runId),
                    ),
                },
              ],
            },
          ]),
      {
        field: 'tags',
        tooltipField: 'tags',
        width: 300,
        cellRenderer: (params: ICellRendererParams<Issue>) => (
          <>
            <MultipleTagsRenderer values={params.data?.tags} />
          </>
        ),
        tooltipComponent: (params: ITooltipParams) => <TagsTooltip {...params} />,
      },
      {
        headerName: 'Feedback',
        children: [
          {
            field: 'feedbackIds',
            tooltipField: 'feedbackIds',
            headerName: 'External',
            width: 180,
            cellRenderer: (params: ICellRendererParams<Issue>) => (
              <MultipleTagsRenderer
                values={params.data?.feedbackIds}
                isId
                kind="feedback"
                selectId={(id: string) => setDetailsModalProps({ id, kind: 'feedback' })}
              />
            ),
            tooltipComponent: (params: ITooltipParams) => <TagsTooltip {...params} isId />,
            cellEditor: (props: ICellEditorParams) => <ExternalFieldCellEditor type="feedbacks" {...props} />,
          },
          {
            field: 'sources',
            tooltipField: 'sources',
            headerName: 'GitHub',
            width: 120,
            cellRenderer: (params: ICellRendererParams<Issue>) => {
              const id = params.data?.id;
              return (
                <>
                  {params.value?.map((source: string, idx: number) => {
                    const issueNum = Number(source?.match(/\/issues\/(\d+)/)?.[1]);
                    return (
                      <Link href={source} target="_blank" key={`${id}-github-${idx}`}>
                        {isNaN(issueNum) ? source : `#${issueNum}`}
                      </Link>
                    );
                  })}
                </>
              );
            },
            valueGetter: (params: ValueGetterParams) =>
              (params.data?.sources as Issue['sources'])?.filter((d) => d.type === 'github').map((d) => d.value),
            tooltipComponent: (params: ITooltipParams) => (
              <ArrayTooltipComponent
                {...params}
                value={(params.data?.sources as Issue['sources'])
                  ?.filter((d) => d.type === 'github')
                  .map((d) => d.value)}
              />
            ),
          },
          {
            field: 'sources',
            tooltipField: 'sources',
            headerName: 'Others',
            width: 120,
            cellRenderer: (params: ICellRendererParams<Issue>) => {
              const id = params.data?.id;
              return (
                <>
                  {params.value?.map((source: string, idx: number) => (
                    <Link href={source} key={`${id}-others-${idx}`}>
                      {source}
                    </Link>
                  ))}
                </>
              );
            },
            valueGetter: (params: ValueGetterParams) =>
              (params.data?.sources as Issue['sources'])?.filter((d) => d.type !== 'github').map((d) => d.value),
            tooltipComponent: (params: ITooltipParams) => (
              <ArrayTooltipComponent
                {...params}
                value={(params.data?.sources as Issue['sources'])
                  ?.filter((d) => d.type !== 'github')
                  .map((d) => d.value)}
              />
            ),
          },
        ],
      },
      {
        field: 'testIds',
        tooltipField: 'testIds',
        headerName: 'QA Tests',
        cellRenderer: (params: ICellRendererParams<Issue>) => (
          <>
            <MultipleTagsRenderer
              values={params.data?.testIds}
              isId
              kind="test"
              selectId={(id: string) => setDetailsModalProps({ id, kind: 'test' })}
            />
          </>
        ),
        tooltipComponent: (params: ITooltipParams) => <TagsTooltip {...params} isId />,
        cellEditor: (props: ICellEditorParams) => <ExternalFieldCellEditor type="tests" {...props} />,
      },
      {
        field: 'resolution',
        tooltipField: 'resolution',
        width: 200,
        cellRenderer: (params: ICellRendererParams<Issue>) => (
          <>
            <MultipleTagsRenderer values={params.data?.resolution} />
          </>
        ),
        tooltipComponent: (params: ITooltipParams) => <TagsTooltip {...params} />,
      },
      { headerName: 'Resolution note', field: 'note', tooltipField: 'note', width: 300 },
      {
        field: 'authors',
        tooltipField: 'authors',
        width: 300,
        cellRenderer: (params: ICellRendererParams<Issue>) => (
          <>
            <MultipleTagsRenderer values={params.data?.authors} />
          </>
        ),
        tooltipComponent: (params: ITooltipParams) => <TagsTooltip {...params} />,
      },
      { field: 'description', tooltipField: 'description', width: 300 },
      {
        headerName: 'Action',
        pinned: true,
        width: 140,
        filter: '',
        cellRenderer: (params: ICellRendererParams<Issue>) => (
          <Button
            kind="ghost"
            size="md"
            onClick={() => {
              if (params.data?.id) openTest(params.data.id);
            }}
            disabled={!params.data?.id}
          >
            Create test
          </Button>
        ),
      },
    ];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusCol, selectedReportsMetadata, openTest, setDetailsModalProps]);

  return [colDef];
};
