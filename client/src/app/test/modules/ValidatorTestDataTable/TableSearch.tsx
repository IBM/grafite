import { TableToolbarSearch } from '@carbon/react';
import { ChangeEvent, useRef } from 'react';

import { TestTableData } from '../../utils';

const TableSearch = ({
  tableData,
  updateFilteredData,
}: {
  tableData: TestTableData[];
  updateFilteredData: (data?: TestTableData[]) => void;
}) => {
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  const search = (e: '' | ChangeEvent<HTMLInputElement>) => {
    const keyword = (e as ChangeEvent<HTMLInputElement>).target.value;

    if (!keyword) updateFilteredData(); //when no input
    if (!!debounce.current) {
      clearTimeout(debounce.current);
    }
    if (keyword.length > 2) {
      debounce.current = setTimeout(() => {
        // filter each visible values of row contains the keyword
        const targetData = tableData.map((d) => ({
          testId: d.id,
          score: d.score,
          justification: d.justification,
          promptText: d.prompt,
          modelOutput: d.sampleOutput,
          desiredOutput: d.desiredOutput,
        }));

        const filtered = targetData
          .filter((d) => !!Object.values(d).filter((str) => str?.toString().includes(keyword)).length)
          .map((d) => d.testId);

        updateFilteredData(tableData.filter((d) => filtered.includes(d.id)));
      }, 500);
    }
  };
  return <TableToolbarSearch onChange={search} placeholder="Use at least 3 characters to search" />;
};

export default TableSearch;
