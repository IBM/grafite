'use client';

import {
  DataTable,
  DataTableHeader,
  DataTableRenderProps,
  Layer,
  Pagination,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableSelectRow,
  TableToolbar,
  TableToolbarContent,
  TableToolbarSearch,
} from '@carbon/react';
import { CheckmarkFilled, InProgress, WarningFilled } from '@carbon/react/icons';
import { SelectedReport } from '@test-manager/issue-trend-analysis-old/[id]/utils';
import { type TestRun } from '@utils/getFunctions/getDashboardRunningTests';
import { stringifyJudgeModelId } from '@utils/stringifyJudgeModelId';
import { ChangeEvent, Fragment, useMemo, useState } from 'react';

import styles from './TestRunSelectorModal.module.scss';

type TableProps = {
  reports: TestRun[];
  defaultSelected: SelectedReport[];
  select: (id: string) => void;
  deselect: (id: string) => void;
};

type Row = TestRun & {
  id: string;
  disabled: boolean;
  isSelected: boolean;
};
type ColTypes = [number, string];
type TableData = DataTableRenderProps<Row, ColTypes>;

const headers = [
  {
    key: 'runId',
    header: 'Title',
  },
  {
    key: 'creator',
    header: 'Creator',
  },
  {
    key: 'modelId',
    header: 'Model',
  },
  {
    key: 'judgeModelId',
    header: 'Judge Model(s)',
  },
  {
    key: 'judgeModelIds',
    header: '',
  },
  {
    key: 'createdAt',
    header: 'Date',
  },
  {
    key: 'status',
    header: 'Status',
  },
  {
    key: 'number_of_tests',
    header: '',
  },
];

const StatusCell = ({ status }: { status: string }) => {
  switch (status) {
    case 'done':
      return (
        <div className={styles.statusCell}>
          <CheckmarkFilled className={styles.completedIcon} />
        </div>
      );
    case 'failed':
      return (
        <div className={styles.iconRow}>
          <WarningFilled className={styles.errorIcon} />
        </div>
      );
    default:
      return (
        <div className={styles.statusCell}>
          <InProgress className={styles.progressIcon} />
        </div>
      );
  }
};

const CellRenderer = ({ value, header }: { value: string; header: string }) => {
  switch (header) {
    case 'createdAt':
      return <TableCell className={styles.fixedCell}>{value.replaceAll('/', '-')}</TableCell>;
    case 'status':
      return (
        <TableCell>
          <StatusCell status={value} />
        </TableCell>
      );
    case 'judgeModelId':
      return <TableCell>{stringifyJudgeModelId(value)}</TableCell>;
    default:
      return (
        <TableCell className={styles[header]}>
          <span title={value}>{value}</span>
        </TableCell>
      );
  }
};

const RunTable = ({ reports, defaultSelected, select, deselect }: TableProps) => {
  const PAGE_SIZE = 5;
  const [page, setPage] = useState(1);

  const rows: Row[] = useMemo(
    () =>
      reports?.map((r) => ({
        id: r.id || r.runId,
        disabled: r.status !== 'done',
        isSelected: !!defaultSelected?.map((d) => d.report)?.find((d) => d.id === r.id),
        ...r,
      })),
    [reports, defaultSelected],
  );

  const slicePage = (pageNum: number, data: TableData['rows']) => {
    return data.slice((pageNum - 1) * PAGE_SIZE, pageNum * PAGE_SIZE);
  };

  return (
    <>
      <DataTable rows={rows} headers={headers}>
        {({
          rows,
          headers,
          getTableProps,
          getHeaderProps,
          getRowProps,
          getToolbarProps,
          onInputChange,
          getSelectionProps,
        }: TableData) => (
          <>
            <Layer level={1}>
              <TableToolbar {...getToolbarProps()}>
                <TableToolbarContent>
                  <TableToolbarSearch
                    onChange={(e: '' | ChangeEvent<HTMLInputElement>) => {
                      const input = (e as ChangeEvent<HTMLInputElement>).target?.value;
                      onInputChange(e as ChangeEvent<HTMLInputElement>);
                      if (input) setPage(1);
                    }}
                    persistent
                    placeholder="Search table"
                  />
                </TableToolbarContent>
              </TableToolbar>
            </Layer>
            <Table {...getTableProps()} className={styles.root}>
              <TableHead>
                <TableRow>
                  <TableHeader />
                  {headers.map(
                    (header: DataTableHeader) =>
                      header.header !== '' && (
                        <TableHeader {...getHeaderProps({ header })} key={header.key}>
                          {header.header}
                        </TableHeader>
                      ),
                  )}
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4}>No reports found.</TableCell>
                  </TableRow>
                ) : (
                  slicePage(page, rows).map((row) => {
                    return (
                      <TableRow {...getRowProps({ row })} key={row.id}>
                        <TableSelectRow
                          {...getSelectionProps({ row })}
                          onChange={() => {
                            if (!row.isSelected) {
                              select(row.id);
                            } else {
                              deselect(row.id);
                            }
                          }}
                        />
                        {row.cells.map((cell) => {
                          if (cell.info.header === 'runId') {
                            const runId = row.cells.find((c) => c.info.header === 'runId')!.value;
                            const numberOfTests = row.cells.find((c) => c.info.header === 'number_of_tests')!.value;

                            return (
                              <TableCell key={cell.id}>
                                {runId} {numberOfTests ? `(${numberOfTests})` : ''}
                              </TableCell>
                            );
                          }

                          if (cell.info.header === 'judgeModelId') {
                            const judgeModelIds = stringifyJudgeModelId(
                              ((row.cells.find((c) => c.info.header === 'judgeModelIds')!.value as string) ??
                                (row.cells.find((c) => c.info.header === 'judgeModelId')!.value as string)) ||
                                '',
                            );

                            return <TableCell key={cell.id}>{judgeModelIds}</TableCell>;
                          }

                          if (['judgeModelIds', 'number_of_tests'].includes(cell.info.header)) return null;

                          return (
                            <Fragment key={cell.id}>
                              <CellRenderer
                                value={
                                  cell.info.header === ''
                                    ? (row.cells.find((c) => c.info.header === 'run_id')!.value as string)
                                    : (cell.value as string)
                                }
                                header={cell.info.header}
                              />
                            </Fragment>
                          );
                        })}
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </>
        )}
      </DataTable>
      <Pagination
        backwardText="Previous page"
        forwardText="Next page"
        itemsPerPageText="Items per page:"
        onChange={({ page }: { page: number }) => setPage(page)}
        page={page}
        pageSize={PAGE_SIZE}
        pageSizes={[PAGE_SIZE]}
        size="md"
        totalItems={rows.length}
        pageSizeInputDisabled
      />
    </>
  );
};
export default RunTable;
