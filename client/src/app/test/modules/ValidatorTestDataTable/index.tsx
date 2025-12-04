import {
  Button,
  DataTable,
  DataTableRenderProps,
  Table,
  TableBody,
  TableCell,
  TableExpandedRow,
  TableExpandHeader,
  TableExpandRow,
  TableHead,
  TableHeader,
  TableRow,
  TableSelectAll,
  TableSelectRow,
  TableToolbar,
  TableToolbarContent,
  Tag,
} from '@carbon/react';
import { DataTableSkeleton } from '@carbon/react';
import { Add, Radar } from '@carbon/react/icons';
import { TableRowProps } from '@carbon/react/lib/components/DataTable/TableRow';
import ButtonWLoading from '@components/ButtonWLoading';
import ExpandableText from '@components/ExpandableText';
import LabelledItem from '@components/LabelledItem';
import ShortIdTag from '@components/ShortIdTag';
import { useToastMessageContext } from '@components/ToastMessageContext';
import { JUDGE_DEFAULT_PARAM } from '@utils/constants';
import { Test } from '@utils/getFunctions/getDashboardTests';
import { JudgeTypes } from '@utils/keyMappings';
import { parseScores } from '@utils/parseJudgeScore';
import { postOllamaFreeform } from '@utils/postFunctions/postOllamaFreeform';
import { Fragment, useCallback, useEffect, useState } from 'react';

import styles from '../../new-test.module.scss';
import { getJudgeValues, processJudgePrompt, TestTableData } from '../../utils';
import { useTestDataContext } from '../TestDataContext';
import TestDataModal from '../TestDataModal';
import TableSearch from './TableSearch';

type ColTypes = [string];
type TableData = DataTableRenderProps<TestTableData, ColTypes>;

const ValidatorTestDataTable = ({
  testInfo,
  updateValidation,
  bakedPrompt,
}: {
  testInfo: Test;
  updateValidation: (type: string, value: string | number) => void;
  bakedPrompt: string | null;
}) => {
  const { addToastMsg } = useToastMessageContext();
  const { validationTestData, updateValidationTestData } = useTestDataContext();

  const [tableRows, setTableRows] = useState<TestTableData[]>([]);
  const [isModalOpen, setModalOpen] = useState<boolean>(false);
  const [filteredData, setFilteredData] = useState<TestTableData[] | null>(null);
  const [isValidating, setValidating] = useState<boolean>(false);

  const headers = [
    { key: 'id', header: 'Test ID' },
    { key: 'score', header: 'Score' },
    { key: 'justification', header: 'Justification', width: '60%' },
  ];
  const judgeModel = process.env.NEXT_PUBLIC_JUDGE_MODEL || '';

  const updateFilteredData = (data?: TestTableData[]) => {
    if (data) setFilteredData(() => [...data]);
    else setFilteredData(null);
  };
  const callValidations = async (prompts: { id: string; prompt: string }[]) => {
    setValidating(true);
    const rowCopy = [...tableRows.map((d) => ({ ...d, score: '', justification: '' }))];

    return Promise.all(
      prompts.map(({ id, prompt }: { id: string; prompt: string }) =>
        postOllamaFreeform({
          prompt: prompt,
          model: judgeModel,
          options: { ...JUDGE_DEFAULT_PARAM },
          stream: false,
        }).then((res: string) => {
          const targetRow = rowCopy.find((d) => d.id === id);
          if (targetRow) {
            const scores = parseScores(res);
            if (typeof scores === 'string') targetRow.justification = scores;
            else {
              targetRow.justification = scores.justification;
              targetRow.score = scores.score;

              if (id === 'current') {
                updateValidation('score', scores.score);
                updateValidation('justification', scores.justification);
              }
            }
          }
          return;
        }),
      ),
    )
      .then(() => {
        return setTableRows(() => [...rowCopy]);
      })
      .catch((e) => {
        addToastMsg(e.status, e.message, 'Failed to validate the test data');
      })
      .finally(() => {
        setValidating(false);
      });
  };

  const validate = (rows: TestTableData[]) => {
    const judgeInfo = getJudgeValues(testInfo);

    //reset score and justifications
    setTableRows((prev) => prev.map((d) => ({ ...d, score: '', justification: '' })));

    if (!judgeInfo?.judgeType) {
      addToastMsg('error', 'Please select the judge prompt content', 'Judge type missing');
      return;
    }

    const ids = rows.map((d) => d.id);
    const data = tableRows.filter((d) => ids.includes(d.id));
    const { judgeType, judgeGuidelines } = judgeInfo;

    const prompts = data.map((d) => ({
      id: d.id,
      prompt: processJudgePrompt(d.prompt, d, judgeType as keyof typeof JudgeTypes, judgeGuidelines),
    }));
    callValidations(prompts);
  };

  const addTestData = (promptText: string, modelOutput: string, desiredOutput?: string) => {
    const newData = {
      id: 'temp-' + (validationTestData.length + 1),
      score: null,
      justification: '',
      prompt: promptText,
      sampleOutput: modelOutput,
      desiredOutput: desiredOutput || '',
      isSelected: true,
    };
    //add temporary test data after the current test
    updateValidationTestData([newData, ...validationTestData]);
    updateTableRows(newData);
  };

  const updateTableRows = useCallback(
    async (newData?: TestTableData) => {
      const currentData = {
        id: 'current',
        score: null,
        justification: '',
        prompt: bakedPrompt || '',
        sampleOutput: testInfo.sampleOutput ?? '',
        desiredOutput: testInfo.desiredOutput ?? '',
        isSelected: true,
      };
      //filter out the current data from the other tests from the same issue
      setTableRows(() =>
        newData ? [currentData, newData, ...validationTestData] : [currentData, ...validationTestData],
      );
    },
    [bakedPrompt, testInfo.sampleOutput, testInfo.desiredOutput, validationTestData],
  );

  useEffect(() => {
    if (bakedPrompt === null) return;
    updateTableRows();
  }, [bakedPrompt, updateTableRows]);

  return (
    <>
      {bakedPrompt === null ? (
        <DataTableSkeleton />
      ) : (
        <DataTable rows={filteredData !== null ? filteredData : tableRows} headers={headers}>
          {({
            rows,
            headers,
            getHeaderProps,
            getRowProps,
            getSelectionProps,
            getToolbarProps,
            getBatchActionProps,
            getExpandedRowProps,
            selectedRows,
            getTableProps,
            selectRow,
          }: TableData) => {
            const batchActionProps = {
              ...getBatchActionProps({
                onSelectAll: () => {
                  rows.map((row: TableRowProps) => {
                    if (!row.isSelected && row.id) {
                      selectRow(row.id);
                    }
                  });
                },
              }),
            };
            return (
              <>
                <TableToolbar {...getToolbarProps()}>
                  <TableToolbarContent aria-hidden={batchActionProps.shouldShowBatchActions}>
                    <TableSearch updateFilteredData={updateFilteredData} tableData={tableRows} />
                    <Button
                      onClick={() => {
                        setModalOpen(true);
                      }}
                      kind="ghost"
                      renderIcon={Add}
                      iconDescription="Add test data"
                    >
                      Add test data
                    </Button>
                    {isValidating ? (
                      <ButtonWLoading isLoading>Validate</ButtonWLoading>
                    ) : (
                      <Button
                        kind="secondary"
                        renderIcon={Radar}
                        iconDescription="Validate"
                        onClick={() => {
                          validate(selectedRows);
                        }}
                      >
                        Validate
                      </Button>
                    )}
                  </TableToolbarContent>
                </TableToolbar>
                <Table {...getTableProps()} aria-label="Judge setting validation test data">
                  <TableHead>
                    <TableRow>
                      <TableExpandHeader aria-label="expand row" />
                      <TableSelectAll {...getSelectionProps()} />
                      {headers.map((header) => {
                        const { key, ...rest } = getHeaderProps({ header });
                        //@ts-expect-error expanded header definition
                        if (header.width) rest.style = { width: header.width };
                        return (
                          <TableHeader key={`header_${key}`} {...rest}>
                            {header.header}
                          </TableHeader>
                        );
                      })}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {rows.map((row, idx: number) => {
                      const { key: rowKey, ...rowRest } = getRowProps({ row });
                      return (
                        <Fragment key={`row_expand_${rowKey}_${idx}`}>
                          <TableExpandRow {...rowRest}>
                            <TableSelectRow {...getSelectionProps({ row })} />
                            {row.cells.map((cell, idx: number) => (
                              //@ts-expect-error expanded cell definition
                              <TableCell key={`cell_${cell.id}_${idx}`} colSpan={cell.colSpan}>
                                {cell.id.includes('id') ? <IdTag id={cell.value} /> : cell.value}
                              </TableCell>
                            ))}
                          </TableExpandRow>
                          <TableExpandedRow
                            colSpan={headers.length + 6}
                            className="demo-expanded-td"
                            {...getExpandedRowProps({
                              row,
                            })}
                          >
                            <ExpandedCell row={row} rows={tableRows} />
                          </TableExpandedRow>
                        </Fragment>
                      );
                    })}
                  </TableBody>
                </Table>
              </>
            );
          }}
        </DataTable>
      )}
      <TestDataModal
        open={isModalOpen}
        bakedPrompt={bakedPrompt}
        close={(promptText?: string, modelOutput?: string, desiredOutput?: string) => {
          if (!!promptText || !!modelOutput || !!desiredOutput)
            addTestData(promptText || '', modelOutput || '', desiredOutput || '');
          setModalOpen(false);
        }}
      />
    </>
  );
};
const IdTag = ({ id }: { id: string }) => {
  if (id === 'current') return <Tag type="high-contrast">{id}</Tag>;
  if (id.includes('temp')) return <Tag type="outline">{id}</Tag>;
  return <ShortIdTag id={id} color="cool-gray" />;
};
const ExpandedCell = ({ row, rows }: { row: TestTableData; rows: TestTableData[] }) => {
  const data = rows.find((d) => d.id === row.id);
  return (
    <div className={styles.expandedCell}>
      {' '}
      <LabelledItem id={`data-table-${row.id}-prompt`} label="Prompt text">
        <ExpandableText>{data?.prompt || ''}</ExpandableText>
      </LabelledItem>
      <div className={styles.row}>
        <LabelledItem id={`data-table-${row.id}-model-output`} label="Model response">
          <ExpandableText>{data?.sampleOutput || ''}</ExpandableText>
        </LabelledItem>
        <LabelledItem id={`data-table-${row.id}-desired-output`} label="Desired output">
          <ExpandableText>{data?.desiredOutput || ''}</ExpandableText>
        </LabelledItem>
      </div>
    </div>
  );
};
export default ValidatorTestDataTable;
