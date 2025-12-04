import {
  DataTable,
  DataTableRenderProps,
  DataTableSkeleton,
  Pagination,
  Table,
  TableBody,
  TableCell,
  TableExpandedRow,
  TableExpandHeader,
  TableExpandRow,
  TableHead,
  TableHeader,
  TableRow,
  TableToolbar,
  TableToolbarContent,
  TableToolbarSearch,
} from '@carbon/react';
import OperationalIdTag from '@components/OperationalIdTag';
import { useToastMessageContext } from '@components/ToastMessageContext';
import { useIssuesContext } from '@modules/IssuesContext';
import { Props as RunResultModalProps } from '@test-manager/modules/ResultTestDetailsModal';
import { type Result } from '@utils/getFunctions/getDashboardResult';
import { mapDataTableRowToObject } from '@utils/mapDataTableRowToObject';
import { groupTestRunResultByIssues } from '@utils/reportProcessors';
import { ChangeEvent, Fragment, useEffect, useMemo, useState } from 'react';

import TableFilterPanel from '../TableFilterPanel';
import { ExpandedRow } from './ExpandedRow';
import styles from './ResultsByIssueTable.module.scss';

type ResultsByIssueTableProps = {
  results: Result[];
  filters: string[];
  clearFilter: () => void;
  removeFilter: (filter: string) => void;
  setSelectedDetailModalData: (param: { type: 'test' | 'issue'; id: string }) => void;
  setSelectedTestRun: (data: RunResultModalProps['test']) => void;
};

type IssueWithTests = {
  issueId: string;
  issueTitle: string;
  failedTestsPercentage: number;
  failedTestsNumber: number;
  totalTests: number;
  tests: {
    id: string;
    justification: string[];
    score: number[];
    judgeModelId: string[];
  }[];
};

type Row = IssueWithTests & {
  id: string;
};
type ColTypes = [number, string];
type TableData = DataTableRenderProps<Row, ColTypes>;

const headers = [
  {
    key: 'issueId',
    header: '',
  },
  {
    key: 'issueTitle',
    header: 'Issue title',
  },
  {
    key: 'failedTestsPercentage',
    header: 'Failed (%)',
    align: 'right',
  },
  {
    key: 'failedTestsNumber',
    header: 'Failed (#)',
    align: 'right',
  },
  {
    key: 'totalTests',
    header: 'Total tests',
    align: 'right',
  },
  {
    key: 'tests',
    header: '',
  },
];

const PAGE_SIZE = 100;

export const ResultsByIssueTable = ({
  results,
  filters,
  clearFilter,
  removeFilter,
  setSelectedDetailModalData,
  setSelectedTestRun,
}: ResultsByIssueTableProps) => {
  const { issues } = useIssuesContext();
  const { addToastMsg } = useToastMessageContext();

  const [data, setData] = useState<IssueWithTests[] | null>(null);
  const [page, setPage] = useState(1);
  const rows = useMemo(
    () =>
      data?.map((r) => ({
        id: r.issueId,
        ...r,
      })),
    [data],
  );

  const selectTestRun = (testId: string) => {
    const result = results.find((d) => d.testId === testId);
    if (result) {
      setSelectedTestRun({
        testId: result.testId,
        promptText: result.promptText,
        messages: result.messages,
        modelResponse: result.modelResponse,
        groundTruth: result.groundTruth,
        judgePrompt: result.judgePrompt,
        judgeGuidelines: result.judgeGuidelines,
        judgeResults: result.judgeResults,
      });
    } else addToastMsg('error', 'Cannot find the test data from the results. Please try again.', 'Failed to proceed');
  };

  useEffect(() => {
    if (issues) {
      const formattedData: IssueWithTests[] = groupTestRunResultByIssues(issues, results).map(
        ({ issueId, issueTitle, passedTestTotal, testTotal, tests }) => ({
          issueId,
          issueTitle,
          failedTestsPercentage: (testTotal - passedTestTotal) / testTotal,
          failedTestsNumber: testTotal - passedTestTotal,
          totalTests: testTotal,
          tests,
        }),
      );

      setData(formattedData);
    }
  }, [issues, results]);

  const slicePage = (pageNum: number, data: TableData['rows']) => {
    return data.slice((pageNum - 1) * PAGE_SIZE, pageNum * PAGE_SIZE);
  };

  if (!rows) return <DataTableSkeleton />;

  return (
    <div className={styles.root}>
      <DataTable rows={rows} headers={headers}>
        {({
          rows,
          headers,
          getTableProps,
          getHeaderProps,
          getRowProps,
          getToolbarProps,
          onInputChange,
          getExpandedRowProps,
        }: TableData) => (
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
            </TableToolbar>
            <TableFilterPanel filters={filters} clear={clearFilter} remove={removeFilter} />
            <Table {...getTableProps()}>
              <TableHead>
                <TableRow>
                  <TableExpandHeader aria-label="expand row" />
                  {headers.map(
                    (header) =>
                      header.header !== '' && (
                        <TableHeader
                          {...getHeaderProps({ header })}
                          key={header.key}
                          //@ts-expect-error extended header definition
                          className={header.align === 'right' ? styles.rightAlign : ''}
                        >
                          {header.header}
                        </TableHeader>
                      ),
                  )}
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={headers.length + 1}>No issues with results found.</TableCell>
                  </TableRow>
                ) : (
                  slicePage(page, rows).map((row) => {
                    const { failedTestsNumber, failedTestsPercentage, issueId, issueTitle, tests, totalTests } =
                      mapDataTableRowToObject<IssueWithTests>(row);

                    return (
                      <Fragment key={issueId}>
                        <TableExpandRow {...getRowProps({ row })} className={styles.row} key={row.id}>
                          <TableCell>
                            {issueTitle}{' '}
                            <OperationalIdTag
                              id={issueId}
                              size="sm"
                              onClick={() => {
                                setSelectedDetailModalData({ type: 'issue', id: issueId });
                              }}
                            />
                          </TableCell>
                          <TableCell className={`${styles.fixedCell} ${styles.rightAlign}`}>
                            {(failedTestsPercentage * 100).toFixed(2)}%
                          </TableCell>
                          <TableCell className={`${styles.fixedCell} ${styles.rightAlign}`}>
                            {failedTestsNumber}
                          </TableCell>
                          <TableCell className={`${styles.fixedCell} ${styles.rightAlign}`}>{totalTests}</TableCell>
                        </TableExpandRow>
                        <TableExpandedRow colSpan={headers.length + 1} {...getExpandedRowProps({ row })}>
                          <ExpandedRow
                            tests={tests}
                            selectTest={(id: string) => setSelectedDetailModalData({ type: 'test', id: id })}
                            selectTestRun={selectTestRun}
                          />
                        </TableExpandedRow>
                      </Fragment>
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
    </div>
  );
};
