'use client';

import {
  Button,
  DataTable,
  DataTableRenderProps,
  DataTableSkeleton,
  Layer,
  Link,
  Loading,
  Modal,
  Pagination,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableToolbar,
  TableToolbarContent,
  TableToolbarSearch,
} from '@carbon/react';
import {
  CheckmarkFilled,
  Download,
  Information,
  InProgress,
  Renew,
  TrashCan,
  WarningFilled,
} from '@carbon/react/icons';
import { useToastMessageContext } from '@components/ToastMessageContext';
import { useReportsContext } from '@test-manager/ReportsContext';
import { downloadJSON } from '@utils/downloadJSON';
import { getDashboardResult } from '@utils/getFunctions/getDashboardResult';
import { TestRun } from '@utils/getFunctions/getDashboardRunningTests';
import { stringifyJudgeModelId } from '@utils/stringifyJudgeModelId';
import { ChangeEvent, useMemo, useState } from 'react';

import { ConfirmReportDeletionModal } from './ConfirmReportDeletionModal';
import styles from './ReportsTable.module.scss';

type ReportsTableProps = {
  showOnlyFive?: boolean;
};

type Row = TestRun & {
  id: string;
};
type ColTypes = [string];
type TableData = DataTableRenderProps<Row, ColTypes>;

const headers = [
  {
    key: 'download',
    header: ' ',
  },
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
    key: 'delete',
    header: ' ',
  },
  {
    key: 'errorMsg',
    header: '',
  },
  {
    key: 'number_of_tests',
    header: '',
  },
];

const StatusCell = ({ status, openErrorModal }: { status: string; openErrorModal?: () => void }) => {
  switch (status) {
    case 'done':
      return (
        <div className={styles.statusCell} title="Completed">
          <CheckmarkFilled className={styles.completedIcon} />
          <span className={styles.statusDescription}>Completed</span>
        </div>
      );
    case 'failed':
      return (
        <div className={styles.statusErrorCell} title="Error">
          <WarningFilled className={styles.errorIcon} />
          <span className={styles.statusDescription}>Error</span>
          <Button
            size="sm"
            kind="ghost"
            iconDescription="Error details"
            renderIcon={Information}
            hasIconOnly
            onClick={openErrorModal}
          />
        </div>
      );
    default:
      return (
        <div className={styles.statusCell} title="In progress">
          <InProgress className={styles.progressIcon} />
          <span className={styles.statusDescription}>In progress</span>
        </div>
      );
  }
};

const CellRenderer = ({
  value,
  header,
  openErrorModal,
}: {
  value: string;
  header: string;
  openErrorModal: () => void;
}) => {
  switch (header) {
    case 'createdAt':
      return <TableCell className={styles.fixedCell}>{value.replaceAll('/', '-')}</TableCell>;
    case 'status':
      return (
        <TableCell>
          <StatusCell status={value} openErrorModal={openErrorModal} />
        </TableCell>
      );
    case 'creator':
      return (
        <TableCell className={styles.creator}>
          <span title={value}>{value}</span>
        </TableCell>
      );
    case 'modelId':
      return <TableCell>{value}</TableCell>;
    default:
      return null;
  }
};

const PAGE_SIZE = 10;

export const ReportsTable = ({ showOnlyFive = false }: ReportsTableProps) => {
  const { reports: data, loading, fetchReports } = useReportsContext();
  const { addToastMsg } = useToastMessageContext();
  const [downloadingIds, setDownloadingIds] = useState<string[]>([]);
  const [deletingIds, setDeletingIds] = useState<string[]>([]);
  const [runIdForDeletion, setRunIdForDeletion] = useState<string | null>(null);
  const [errorModalData, setErrorModalData] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const rows = useMemo(
    () =>
      data?.map((r) => ({
        id: r.id || r.runId,
        ...r,
      })),
    [data],
  );

  const download = (runId: string) => {
    setDownloadingIds((prev) => [...prev, runId]);
    getDashboardResult(runId)
      .then((result) => downloadJSON(result, `grafite_${runId}.json`))
      .catch((e: Error) => {
        addToastMsg('error', e.message, 'Failed to download');
      })
      .finally(() => {
        setDownloadingIds((prev) => prev.filter((d) => d !== runId));
      });
  };

  const slicePage = (pageNum: number, data: TableData['rows']) => {
    if (showOnlyFive) return data.slice(0, 5);
    return data.slice((pageNum - 1) * PAGE_SIZE, pageNum * PAGE_SIZE);
  };

  if (!rows || loading) return <DataTableSkeleton />;

  return (
    <>
      <Layer>
        <DataTable rows={rows} headers={headers}>
          {({
            rows,
            headers,
            getTableProps,
            getHeaderProps,
            getRowProps,
            getToolbarProps,
            onInputChange,
          }: TableData) => (
            <>
              {!showOnlyFive && (
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
                    <Button
                      kind="ghost"
                      renderIcon={Renew}
                      iconDescription="Refresh"
                      hasIconOnly
                      onClick={fetchReports}
                    />
                  </TableToolbarContent>
                </TableToolbar>
              )}
              <Table {...getTableProps()}>
                <TableHead>
                  <TableRow>
                    {headers.map(
                      (header) =>
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
                    slicePage(page, rows).map((row) => (
                      <TableRow {...getRowProps({ row })} key={row.id} className={styles.row}>
                        {row.cells.map((cell) => {
                          const disabled = row.cells.find((c) => c.info.header === 'status')!.value !== 'done';
                          const runId = row.cells.find((c) => c.info.header === 'runId')!.value;
                          const judgeModelIds = stringifyJudgeModelId(
                            (row.cells.find((c) => c.info.header === 'judgeModelIds')!.value ??
                              row.cells.find((c) => c.info.header === 'judgeModelId')!.value) ||
                              '',
                          );
                          const status = row.cells.find((c) => c.info.header === 'status')!.value;
                          const numberOfTests = row.cells.find((c) => c.info.header === 'number_of_tests')!.value;

                          if (cell.info.header === 'runId') {
                            return (
                              <TableCell key={cell.id}>
                                <Link href={`/test-manager/reports/${runId}`} disabled={disabled}>
                                  {runId} {numberOfTests ? `(${numberOfTests})` : ''}
                                </Link>
                              </TableCell>
                            );
                          }

                          if (cell.info.header === 'judgeModelId')
                            return <TableCell key={cell.id}>{judgeModelIds}</TableCell>;

                          if (cell.info.header === 'download') {
                            return (
                              <TableCell className={styles.actionCell} key={cell.id}>
                                <div>
                                  {downloadingIds.includes(runId) ? (
                                    <div className={styles.loadingWheel}>
                                      <Loading small withOverlay={false} />
                                    </div>
                                  ) : (
                                    <Button
                                      kind="ghost"
                                      disabled={disabled}
                                      renderIcon={Download}
                                      iconDescription="Download"
                                      tooltipAlignment="start"
                                      hasIconOnly
                                      onClick={() => download(runId)}
                                    />
                                  )}
                                </div>
                              </TableCell>
                            );
                          }

                          if (cell.info.header === 'delete') {
                            return (
                              <TableCell className={styles.actionCell} key={cell.id}>
                                <div>
                                  {deletingIds.includes(runId) ? (
                                    <div className={styles.loadingWheel}>
                                      <Loading small withOverlay={false} />
                                    </div>
                                  ) : (
                                    <Button
                                      kind="ghost"
                                      renderIcon={TrashCan}
                                      iconDescription="Delete"
                                      hasIconOnly
                                      onClick={() => setRunIdForDeletion(runId)}
                                      tooltipPosition="left"
                                      disabled={status === 'in progress'}
                                    />
                                  )}
                                </div>
                              </TableCell>
                            );
                          }
                          return (
                            cell.info.header !== 'errorMsg' && (
                              <CellRenderer
                                value={cell.value}
                                header={cell.info.header}
                                openErrorModal={() => {
                                  setErrorModalData(
                                    row.cells.find((c) => c.info.header === 'errorMsg')?.value ||
                                      'No error message found',
                                  );
                                }}
                                key={cell.id}
                              />
                            )
                          );
                        })}
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </>
          )}
        </DataTable>
        {!showOnlyFive && (
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
        )}
      </Layer>
      <Modal
        size="md"
        passiveModal
        modalHeading="Error details"
        open={errorModalData !== null}
        onRequestClose={() => {
          setErrorModalData(null);
        }}
      >
        <p className={styles.errorDetail}>{errorModalData}</p>
      </Modal>
      <ConfirmReportDeletionModal
        runId={runIdForDeletion}
        setDeletingIds={setDeletingIds}
        setRunId={setRunIdForDeletion}
      />
    </>
  );
};
