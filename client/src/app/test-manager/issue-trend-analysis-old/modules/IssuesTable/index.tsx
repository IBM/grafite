'use client';

import {
  DataTable,
  DataTableHeader,
  DataTableRenderProps,
  DataTableRow,
  DataTableSkeleton,
  InlineLoading,
  Layer,
  Link,
  Pagination,
  Table,
  TableBatchAction,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableToolbar,
  TableToolbarContent,
  TableToolbarSearch,
} from '@carbon/react';
import { Renew } from '@carbon/react/icons';
import { useIssuesContext } from '@modules/IssuesContext';
import { Issue } from '@utils/getFunctions/getDashboardIssues';
import { ChangeEvent, Fragment, useEffect, useMemo, useState } from 'react';

import styles from './IssuesTable.module.scss';

type ColTypes = [number, string];
type IssueTableRenderProps = DataTableRenderProps<Issue, ColTypes>;
const headers = [
  {
    key: 'title',
    header: 'Issue',
  },
  // {
  //   key: 'status',
  //   header: 'Status',
  // },
  {
    key: 'view-details',
    header: 'View details',
  },
];

const PAGE_SIZE = 10;

const IssuesTable = () => {
  const { issues, fetchIssues, loading } = useIssuesContext();

  const [page, setPage] = useState(1);
  const data = useMemo(
    () =>
      issues?.map((r) => ({
        id: r.id,
        ...r,
      })),
    [issues],
  );
  const [rows, setRows] = useState(data ? JSON.parse(JSON.stringify(data)) : null);

  useEffect(() => {
    if (data) setRows(JSON.parse(JSON.stringify(data)));
  }, [data]);

  const slicePage = (pageNum: number, data: IssueTableRenderProps['rows']) => {
    return data.slice((pageNum - 1) * PAGE_SIZE, pageNum * PAGE_SIZE);
  };

  if (!rows) return <DataTableSkeleton />;

  return (
    <div className={styles.root}>
      {loading && (
        <div className={styles.loading}>
          <InlineLoading description="Fetching the latest data..." />
        </div>
      )}
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
          }: IssueTableRenderProps) => (
            <>
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
                <TableBatchAction
                  onClick={() => {
                    fetchIssues();
                  }}
                  iconDescription="Refresh"
                  hasIconOnly
                  renderIcon={Renew}
                  //@ts-expect-error kind prop missing on definition
                  kind="ghost"
                />
              </TableToolbar>
              <Table {...getTableProps()}>
                <TableHead>
                  <TableRow>
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
                      <TableCell colSpan={4}>No issue found.</TableCell>
                    </TableRow>
                  ) : (
                    slicePage(page, rows).map((row: DataTableRow<ColTypes>) => (
                      <TableRow {...getRowProps({ row })} key={row.id}>
                        {row.cells.map((cell) => {
                          return (
                            <Fragment key={`issues-table-${cell.id}`}>
                              {cell.info.header === 'title' && <TableCell>{cell.value}</TableCell>}
                              {cell.info.header === 'view-details' && (
                                <TableCell className={styles.fixedCell}>
                                  <Link href={`/test-manager/issue-trend-analysis-old/${row.id}`}>View details</Link>
                                </TableCell>
                              )}
                            </Fragment>
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
      </Layer>
    </div>
  );
};

export default IssuesTable;
